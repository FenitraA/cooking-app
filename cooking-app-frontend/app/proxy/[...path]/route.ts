import { UnauthorizedError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { API_URL } from "@/lib/variables";
import { NextResponse } from "next/server";
import { randomUUID, createHash } from "node:crypto";

const INSTANCE_ID = randomUUID();
type RefreshResult = {
  cookieHeader: string;
  setCookies: string[];
};

type CachedRefresh = RefreshResult & { expiresAt: number };

// Short-lived cache so requests arriving milliseconds after a refresh
// reuse the new tokens instead of triggering another /auth/refresh call.
const recentRefreshCache = new Map<string, CachedRefresh>();
const RECENT_TTL_MS = 3_000;
const MAX_CACHE_ENTRIES = 1_000;

// In-flight deduplication map: concurrent 401s for the same user await
// the exact same refresh Promise instead of racing each other.
const refreshLocks = new Map<string, Promise<RefreshResult>>();

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
  // 1. Build the upstream URL by stripping "/proxy" and keeping the rest of the path + query string.
  const url = new URL(request.url);
  const upstreamPath = url.pathname.replace(/^\/proxy/, "");
  const target = `${API_URL}${upstreamPath}${url.search}`;

  // 2. Buffer the request body once so it can be reused if we need to retry after a 401.
  // (A raw Request stream can only be read once.)
  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const bufferedBody = hasBody ? await request.arrayBuffer() : undefined;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const contentType = request.headers.get("content-type");

  // 3. First attempt: forward the request to the backend as-is.
  let res: Response;
  try {
    res = await fetch(target, {
      method: request.method,
      headers: buildUpstreamHeaders(cookieHeader, contentType),
      body: bufferedBody,
    });
  } catch (error) {
    logger.error("Upstream request failed", { target, error });
    return NextResponse.json({ detail: "Bad Gateway" }, { status: 502 });
  }

  // Happy path: if the request succeeded (or failed with anything other than 401),
  // forward the response straight back to the browser.
  if (res.status !== 401) {
    return forward(res);
  }

  // 4. Token refresh flow (triggered only on 401 Unauthorized)
  const lockKey = getRefreshLockKey(cookieHeader);
  const refreshFingerprint = createHash("sha256")
    .update(lockKey)
    .digest("hex")
    .slice(0, 10);

  logger.info("Refresh coordination diagnostic", {
    instanceId: INSTANCE_ID,
    refreshFingerprint,
    endpoint: url.pathname,
  });

  // 4a. Fast path: check if we already refreshed this session in the last 3 seconds.
  const recent = getRecent(lockKey);
  if (recent) {
    logger.warn("Refresh reused from cache", { endpoint: url.pathname });
    return retryWithRefreshedCookies({
      target,
      method: request.method,
      contentType,
      bufferedBody,
      refreshed: recent,
    });
  }

  // 4b. Single-flight lock: join an in-progress refresh if one exists, or start a new one.
  let refreshPromise = refreshLocks.get(lockKey);

  if (refreshPromise) {
    logger.info("Joined in-flight refresh", {
      method: request.method,
      endpoint: url.pathname,
    });
  } else {
    logger.info("Initiating token refresh", {
      method: request.method,
      endpoint: url.pathname,
    });

    refreshPromise = executeTokenRefresh(lockKey, cookieHeader);
    refreshLocks.set(lockKey, refreshPromise);

    // Always clean up the lock once the refresh settles (whether it succeeds or fails).
    refreshPromise.finally(() => refreshLocks.delete(lockKey));
  }

  // 5. Wait for the refresh result (either ours or the shared one).
  let refreshed: RefreshResult;
  try {
    refreshed = await refreshPromise;
  } catch {
    logger.error("Token refresh failed", { endpoint: url.pathname });
    return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
  }

  // 6. Retry the original request using the newly refreshed cookies,
  // and send those Set-Cookie headers back to the browser.
  return retryWithRefreshedCookies({
    target,
    method: request.method,
    contentType,
    bufferedBody,
    refreshed,
  });
}

/**
 * Calls the backend's /auth/refresh endpoint, merges new cookies with existing ones,
 * and caches the result briefly to absorb concurrent requests.
 */
async function executeTokenRefresh(
  lockKey: string,
  cookieHeader: string,
): Promise<RefreshResult> {
  const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  if (!refreshRes.ok) {
    throw new UnauthorizedError();
  }

  const refreshSetCookies = refreshRes.headers.getSetCookie?.() ?? [];
  if (refreshSetCookies.length === 0) {
    throw new UnauthorizedError();
  }

  const result: RefreshResult = {
    cookieHeader: mergeCookieHeaders(cookieHeader, refreshSetCookies),
    setCookies: refreshSetCookies,
  };

  setRecent(lockKey, result);
  return result;
}

/**
 * Re-sends the original request with updated cookies and attaches the refresh
 * Set-Cookie headers so the browser updates its stored cookies.
 */
async function retryWithRefreshedCookies({
  target,
  method,
  contentType,
  bufferedBody,
  refreshed,
}: {
  target: string;
  method: string;
  contentType: string | null;
  bufferedBody?: ArrayBuffer;
  refreshed: RefreshResult;
}) {
  let retryRes: Response;
  try {
    retryRes = await fetch(target, {
      method,
      headers: buildUpstreamHeaders(refreshed.cookieHeader, contentType),
      body: bufferedBody,
    });
  } catch (error) {
    logger.error("Upstream retry failed", { target, error });
    return NextResponse.json({ detail: "Bad Gateway" }, { status: 502 });
  }

  const response = forward(retryRes);

  // Forward the refreshed cookies to the browser so subsequent requests use them.
  for (const sc of refreshed.setCookies) {
    response.headers.append("set-cookie", sc);
  }

  return response;
}

/**
 * Builds clean headers for the upstream backend request.
 * Forces "identity" encoding so Node doesn't decompress a response while keeping
 * the original Content-Encoding / Content-Length headers.
 */
function buildUpstreamHeaders(
  cookieHeader: string,
  contentType: string | null,
): Record<string, string> {
  const headers: Record<string, string> = {
    cookie: cookieHeader,
    "accept-encoding": "identity",
  };
  if (contentType) {
    headers["content-type"] = contentType;
  }
  return headers;
}

/**
 * Converts an upstream Fetch Response into a NextResponse while stripping
 * hop-by-hop and encoding headers that can break proxying.
 */
function forward(res: Response) {
  const responseHeaders = new Headers(res.headers);

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
    "set-cookie", // Removed here and re-appended cleanly below
  ].forEach((h) => responseHeaders.delete(h));

  const nextRes = new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });

  // Preserve multiple Set-Cookie headers without merging them into a comma-separated string.
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const sc of setCookies) {
    nextRes.headers.append("set-cookie", sc);
  }

  return nextRes;
}

/**
 * Merges incoming browser cookies with new Set-Cookie headers from /auth/refresh
 * so the retry request sends the updated tokens.
 */
function mergeCookieHeaders(original: string, setCookies: string[]) {
  const map = new Map<string, string>();

  // Parse existing "key=value; key2=value2" header
  for (const part of original.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (!k || rest.length === 0) continue;
    map.set(k, rest.join("="));
  }

  // Apply updates (or deletions) from Set-Cookie headers
  for (const sc of setCookies) {
    const segments = sc.split(";").map((s) => s.trim());
    const [k, ...rest] = segments[0].split("=");
    if (!k || rest.length === 0) continue;

    // If the server explicitly expired/deleted the cookie, remove it from the retry header
    const isDeleted = segments.some(
      (attr) =>
        attr.toLowerCase() === "max-age=0" ||
        attr.toLowerCase().startsWith("expires=thu, 01 jan 1970"),
    );

    if (isDeleted) {
      map.delete(k);
    } else {
      map.set(k, rest.join("="));
    }
  }

  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Derives a lock/cache key per user session based on their refresh cookie.
 */
function getRefreshLockKey(cookieHeader: string) {
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
  // Prevent unbounded memory growth if many distinct keys hit the cache
  if (recentRefreshCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = recentRefreshCache.keys().next().value;
    if (oldestKey) recentRefreshCache.delete(oldestKey);
  }

  recentRefreshCache.set(lockKey, {
    ...value,
    expiresAt: Date.now() + RECENT_TTL_MS,
  });
}
