import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ["/login", "/api/auth"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthed = !!req.auth?.user;
  const path = nextUrl.pathname;

  if (PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + "/"))) {
    if (isAuthed && path === "/login") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isAuthed) {
    const url = new URL("/login", nextUrl);
    if (path !== "/") url.searchParams.set("from", path);
    return NextResponse.redirect(url);
  }

  if (req.auth?.user.mustChangePassword && path !== "/first-login") {
    return NextResponse.redirect(new URL("/first-login", nextUrl));
  }

  if (path.startsWith("/admin") && !req.auth?.user.isSuperuser) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
