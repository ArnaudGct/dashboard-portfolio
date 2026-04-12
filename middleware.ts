import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAuthRoute = path === "/auth" || path.startsWith("/auth/");
  const isApiRoute = path.startsWith("/api/");

  if (isApiRoute) return NextResponse.next();

  // ✅ getSessionCookie lit automatiquement le bon nom de cookie
  //    selon useSecureCookies (avec ou sans préfixe __Secure-)
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix:
      process.env.NODE_ENV === "production"
        ? "__Secure-better-auth"
        : "better-auth",
  });

  const isAuthenticated = Boolean(sessionCookie);

  if (!isAuthenticated && !isAuthRoute) {
    const signInUrl = new URL("/auth/signin", request.nextUrl.origin);
    signInUrl.searchParams.set("next", path + (request.nextUrl.search || ""));
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthenticated && path === "/auth/signin") {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|_static|_vercel|favicon.ico|robots.txt).*)"],
};
