import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/1vs1", "/3vs3", "/profile"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = !!process.env.NEXT_PUBLIC_API_URL;

  // In dev check the plain flag cookie; in production check the httpOnly token cookie.
  const isLoggedIn = isDev
    ? !!request.cookies.get("x-tracker-session")
    : !!request.cookies.get("token");

  // Redirect logged-in users away from the landing page to their profile.
  if (pathname === "/") {
    if (isLoggedIn) return NextResponse.redirect(new URL("/profile", request.url));
    return NextResponse.next();
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/1vs1/:path*", "/3vs3/:path*", "/profile/:path*"],
};
