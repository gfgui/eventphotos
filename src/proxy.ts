import { type NextRequest, NextResponse } from "next/server";
import { hasLocale, localeCookie, locales, matchLocale } from "@/i18n/config";

const oneYear = 60 * 60 * 24 * 365;

/**
 * Every page lives under /{locale}. Unprefixed URLs (like the one in the QR Code) are
 * redirected to the language chosen before, or else to the phone's language.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathLocale = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (pathLocale) {
    const response = NextResponse.next();
    if (request.cookies.get(localeCookie)?.value !== pathLocale) {
      response.cookies.set(localeCookie, pathLocale, {
        path: "/",
        maxAge: oneYear,
        sameSite: "lax",
      });
    }
    return response;
  }

  const saved = request.cookies.get(localeCookie)?.value;
  const locale =
    saved && hasLocale(saved)
      ? saved
      : matchLocale(request.headers.get("accept-language"));

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip API routes, Next.js internals and files with an extension (favicon, fonts).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
