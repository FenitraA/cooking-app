import { UnauthorizedError } from "@/lib/errors";
import { API_URL } from "@/lib/variables";
import { NextResponse } from "next/server";

type RefreshResult = {
  cookieHeader: string;
  setCookies: string[];
};

type CachedRefresh = RefreshResult & { expiresAt: number };

const recentRefreshCache = new Map<string, CachedRefresh>();
const RECENT_TTL_MS = 3_000; // 2–5 seconds is usually enough

const refreshLocks = new Map<string, Promise<RefreshResult>>();
// value is Promise<cookieHeader> (merged cookies) to use for retry

export const runtime = "nodejs";

export async function GET(req: Request) {
  return proxy(req);
}
export async function POST(req: Request) {
  return proxy(req);
}
export async function PUT(req: Request) {
  return proxy(req);
}
export async function DELETE(req: Request) {
  return proxy(req);
}
export async function PATCH(req: Request) {
  return proxy(req);
}

async function proxy(request: Request) {
  const url = new URL(request.url);
  const idPath = url.pathname.replace("/proxy", "");
  const cookieHeader = request.headers.get("cookie") ?? "";

  const path = idPath.replace(/\/\d+/g, "");

  const target = `${API_URL}${path}${url.search}`;

  const bodyUsed = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const bufferedBody = bodyUsed ? await request.arrayBuffer() : undefined;

  const contentType = request.headers.get("content-type");
  const headers: Record<string, string> = { cookie: cookieHeader };
  if (contentType) headers["content-type"] = contentType;
  headers["accept-encoding"] = "identity";
  
  // 1) First attempt
  let res = await fetch(target, {
    method: request.method,
    headers: headers,
    body: bufferedBody,
    // @ts-expect-error - 'duplex' is required when sending a body stream in Node.js fetch
    duplex: bodyUsed ? "half" : undefined,
  });

  // If not unauthorized → return immediately (but still forward any Set-Cookie)
  if (res.status !== 401) {
    return forward(res);
  }

  // 2) Refresh (single-flight) + recent cache

  const lockKey = getRefreshLockKey(cookieHeader);

  // if we refreshed in the last few seconds, reuse it
  const recent = getRecent(lockKey);
  if (recent) {
    const refreshedHeaders: Record<string, string> = {
      cookie: recent.cookieHeader,
    };
    refreshedHeaders["accept-encoding"] = "identity";
    if (contentType) refreshedHeaders["content-type"] = contentType;

    res = await fetch(target, {
      method: request.method,
      headers: refreshedHeaders,
      body: bufferedBody,
      // @ts-expect-error - 'duplex' is required when sending a body stream in Node.js fetch
      duplex: bodyUsed ? "half" : undefined,
    });

    const response = forward(res);
    for (const sc of recent.setCookies)
      response.headers.append("set-cookie", sc);
    return response;
  }

  let refreshPromise = refreshLocks.get(lockKey);

  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshRes = await fetch(
        `${API_URL}/auth/refresh`,
        {
          method: "POST",
          headers: { cookie: cookieHeader },
          cache: "no-store",
        },
      );

      if (!refreshRes.ok) throw new UnauthorizedError();

      const refreshSetCookies = refreshRes.headers.getSetCookie?.() ?? [];
      if (refreshSetCookies.length === 0) throw new UnauthorizedError();

      const mergedCookieHeader = mergeCookieHeaders(
        cookieHeader,
        refreshSetCookies,
      );

      const result = {
        cookieHeader: mergedCookieHeader,
        setCookies: refreshSetCookies,
      };

      // cache for a short window to cover the browser gap
      setRecent(lockKey, result);

      return result;
    })();

    refreshLocks.set(lockKey, refreshPromise);
    refreshPromise.finally(() => refreshLocks.delete(lockKey));
  }
  let refreshed;
  try {
    refreshed = await refreshPromise;
  } catch {
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const refreshedContentType = request.headers.get("content-type");
  const refreshedHeaders: Record<string, string> = {
    cookie: refreshed.cookieHeader,
  };
  refreshedHeaders["accept-encoding"] = "identity";
  if (refreshedContentType)
    refreshedHeaders["content-type"] = refreshedContentType;

  // 3) Retry original request with refreshed cookies
  res = await fetch(target, {
    method: request.method,
    headers: refreshedHeaders,
    body: bufferedBody,
    // @ts-expect-error - 'duplex' is required when sending a body stream in Node.js fetch
    duplex: bodyUsed ? "half" : undefined,
  });

  // 4) Return response, forwarding cookies to browser
  const response = forward(res);

  //  forward refresh cookies to browser so it stores them
  for (const sc of refreshed.setCookies) {
    response.headers.append("set-cookie", sc);
  }

  return response;
}

function forward(res: Response) {
  const responseHeaders = new Headers(res.headers);

  // Strip headers that can cause decoding/length mismatches when proxying
  [
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "upgrade",
  ].forEach((h) => responseHeaders.delete(h));

  // We'll re-append set-cookie manually (and avoid duplicates)
  responseHeaders.delete("set-cookie");

  const nextRes = new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });

  // Forward any upstream set-cookie (may be multiple)
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) nextRes.headers.append("set-cookie", sc);

  return nextRes;
}

function mergeCookieHeaders(original: string, setCookies: string[]) {
  const map = new Map<string, string>();

  // parse "a=1; b=2"
  for (const part of original.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    map.set(k, rest.join("="));
  }

  // overwrite with refreshed Set-Cookie values
  for (const sc of setCookies) {
    const firstPart = sc.split(";")[0]; // name=value
    const [k, ...rest] = firstPart.trim().split("=");
    if (!k || rest.length === 0) continue;
    map.set(k, rest.join("="));
  }

  // rebuild
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function getRefreshLockKey(cookieHeader: string) {
  // simplest: use refresh cookie value as the key (if present)
  const match = cookieHeader.match(/(?:^|;\s*)refresh=([^;]+)/);
  return match?.[1] ? `refresh:${match[1]}` : `anon:${cookieHeader}`;
}
function getRecent(lockKey: string): RefreshResult | null {
  const cached = recentRefreshCache.get(lockKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    recentRefreshCache.delete(lockKey);
    return null;
  }
  return { cookieHeader: cached.cookieHeader, setCookies: cached.setCookies };
}

function setRecent(lockKey: string, value: RefreshResult) {
  recentRefreshCache.set(lockKey, {
    ...value,
    expiresAt: Date.now() + RECENT_TTL_MS,
  });
}
