import { UnauthorizedError } from "@/lib/errors";
import { API_URL } from "@/lib/variables";
import {
  coordinateRefresh,
  RefreshWaitTimeoutError,
  type RefreshResult,
} from "@/lib/auth/refresh-coordinator";
import { NextResponse } from "next/server";

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
  // 1. Build the upstream URL.
  const url = new URL(request.url);
  const upstreamPath = url.pathname.replace(/^\/proxy/, "");
  const target = `${API_URL}${upstreamPath}${url.search}`;

  // 2. Buffer the request body once for potential retry.
  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);

  const bufferedBody = hasBody ? await request.arrayBuffer() : undefined;

  const cookieHeader = request.headers.get("cookie") ?? "";
  const contentType = request.headers.get("content-type");

  // 3. First attempt: forward the original request.
  let res: Response;

  try {
    res = await fetch(target, {
      method: request.method,
      headers: buildUpstreamHeaders(cookieHeader, contentType),
      body: bufferedBody,
    });
  } catch (error) {
    return NextResponse.json({ detail: "Bad Gateway" }, { status: 502 });
  }

  // 4. Happy path: no refresh required.
  if (res.status !== 401) {
    return forward(res);
  }

  // 5. Refresh coordination through Redis.
  let refreshed: RefreshResult;

  try {
    refreshed = await coordinateRefresh({
      cookieHeader,
      endpoint: url.pathname,
      executeRefresh: () => executeTokenRefresh(cookieHeader),
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    if (error instanceof RefreshWaitTimeoutError) {
      return NextResponse.json(
        { detail: "Authentication refresh is still in progress" },
        {
          status: 503,
          headers: { "Retry-After": "1" },
        },
      );
    }

    return NextResponse.json(
      { detail: "Authentication service temporarily unavailable" },
      { status: 503 },
    );
  }

  // 6. Retry the original request using the refreshed cookies.
  return retryWithRefreshedCookies({
    target,
    method: request.method,
    contentType,
    bufferedBody,
    refreshed,
  });
}

/**
 * Calls the backend's refresh endpoint and merges the new cookies
 * with the original cookies for the subsequent retry.
 */
async function executeTokenRefresh(
  cookieHeader: string,
): Promise<RefreshResult> {
  const endpoint = `${API_URL}/auth/refresh`;
  const refreshRes = await fetch(endpoint, {
    method: "POST",
    headers: { cookie: cookieHeader },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  if (!refreshRes.ok) {
    throw new UnauthorizedError();
  }

  const refreshSetCookies = refreshRes.headers.getSetCookie?.() ?? [];

  if (refreshSetCookies.length === 0) {
    throw new UnauthorizedError();
  }

  return {
    cookieHeader: mergeCookieHeaders(cookieHeader, refreshSetCookies),
    setCookies: refreshSetCookies,
  };
}

/**
 * Retries the original request with updated cookies and forwards
 * the refreshed Set-Cookie headers to the browser.
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
    return NextResponse.json({ detail: "Bad Gateway" }, { status: 502 });
  }

  const response = forward(retryRes);

  // Forward refreshed cookies to the browser.
  for (const sc of refreshed.setCookies) {
    response.headers.append("set-cookie", sc);
  }

  return response;
}

/**
 * Builds clean headers for upstream requests.
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
 * Converts an upstream Fetch Response into a NextResponse,
 * stripping hop-by-hop and encoding headers.
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
    "set-cookie",
  ].forEach((h) => responseHeaders.delete(h));

  const nextRes = new NextResponse(res.body, {
    status: res.status,
    headers: responseHeaders,
  });

  // Preserve multiple Set-Cookie headers.
  const setCookies = res.headers.getSetCookie?.() ?? [];

  for (const sc of setCookies) {
    nextRes.headers.append("set-cookie", sc);
  }

  return nextRes;
}

/**
 * Merges original browser cookies with updated Set-Cookie headers
 * received from the backend.
 */
function mergeCookieHeaders(original: string, setCookies: string[]) {
  const map = new Map<string, string>();

  // Parse existing cookies.
  for (const part of original.split(";")) {
    const [k, ...rest] = part.trim().split("=");

    if (!k || rest.length === 0) continue;

    map.set(k, rest.join("="));
  }

  // Apply updated cookies.
  for (const sc of setCookies) {
    const segments = sc.split(";").map((s) => s.trim());
    const [k, ...rest] = segments[0].split("=");

    if (!k || rest.length === 0) continue;

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
