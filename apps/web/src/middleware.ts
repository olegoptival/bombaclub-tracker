import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Auth middleware.
 *
 * Three rules:
 *   1. Unauthenticated → /login
 *   2. Authenticated but mustChangePassword → /first-login
 *   3. /admin/* requires isSuperuser
 *
 * Public routes: /login, /api/auth/*, static assets.
 */

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth?.user;
  const path = nextUrl.pathname;

  // Allow public paths regardless of auth
  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    // If already logged in and on /login, send home
    if (isAuthed && path === "/login") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  // Not authenticated → /login (preserve where they wanted to go)
  if (!isAuthed) {
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  // Force password change before everything else
  if (req.auth?.user.mustChangePassword && path !== "/first-login") {
    return NextResponse.redirect(new URL("/first-login", nextUrl));
  }

  // /admin/* — super-admin only
  if (path.startsWith("/admin") && !req.auth?.user.isSuperuser) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

// Match all routes EXCEPT static files and Next internals
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
