import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect the root to a default page under the default locale
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(`/${routing.defaultLocale}/planning`, req.url)
    );
  }

  // Let next-intl handle everything else (including /path -> /en/path)
  return intlMiddleware(req);
}

export const config = {
  matcher: "/((?!api|proxy|trpc|_next|_vercel|.*\\..*).*)",
};
