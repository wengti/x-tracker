import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/1vs1", "/3vs3", "/profile"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) return NextResponse.next();

  const isDev = !!process.env.NEXT_PUBLIC_API_URL;

  if (isDev) {
    // In development the frontend and backend run on different ports. The backend's
    // httpOnly token cookie is scoped to localhost:8080 and invisible to this middleware
    // on localhost:3000. Instead we check a plain flag cookie set by the frontend JS
    // after login (see login/page.tsx).
    const session = request.cookies.get("x-tracker-session");
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  } else {
    // In production both frontend and backend share the same domain, so the
    // backend's httpOnly token cookie is visible to this middleware directly.
    const token = request.cookies.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/1vs1/:path*", "/3vs3/:path*", "/profile/:path*"],
};
