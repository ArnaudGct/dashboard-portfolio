import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function isLocalHost(host: string): boolean {
  return host.includes("localhost") || host.startsWith("127.0.0.1");
}

function getCanonicalBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host =
    forwardedHost || request.headers.get("host") || request.nextUrl.host;

  const rawProtoHeader = request.headers.get("x-forwarded-proto") || "";
  const rawProto =
    rawProtoHeader.split(",")[0]?.trim().toLowerCase() ||
    request.nextUrl.protocol.replace(":", "") ||
    "https";

  // Derriere un reverse proxy TLS, on force HTTPS pour les hosts publics.
  const proto = !isLocalHost(host) && rawProto === "http" ? "https" : rawProto;

  return `${proto}://${host}`;
}

function hasSessionCookieFallback(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  const rawCookieHeader = request.headers.get("cookie") || "";
  const sessionCookiePatterns = [
    "better-auth",
    "session_token",
    "__secure-better-auth",
  ];

  // Certains environnements/proxy peuvent modifier le nom exact du cookie.
  // On garde un fallback cible sur les patterns better-auth/session.
  const hasNamedCookie = cookies.some((cookie) => {
    const name = cookie.name.toLowerCase();
    return sessionCookiePatterns.some((pattern) => name.includes(pattern));
  });

  if (hasNamedCookie) {
    return true;
  }

  // Fallback sur le header brut si request.cookies ne remonte rien.
  const normalizedCookieHeader = rawCookieHeader.toLowerCase();
  return sessionCookiePatterns.some((pattern) =>
    normalizedCookieHeader.includes(pattern),
  );
}

export async function middleware(request: NextRequest) {
  // Récupérer le cookie de session
  const sessionCookie = getSessionCookie(request);
  const hasFallbackSessionCookie = hasSessionCookieFallback(request);
  const isAuthenticated = Boolean(sessionCookie || hasFallbackSessionCookie);

  // Récupérer le chemin de l'URL
  const path = request.nextUrl.pathname;

  // Vérifier si l'utilisateur accède à une route d'authentification
  const isAuthRoute = path === "/auth" || path.startsWith("/auth/");
  const isApiRoute = path.startsWith("/api/");

  // Ne pas appliquer le middleware aux routes API (sauf si nécessaire)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Redirection des routes protegees vers la connexion.
  if (!isAuthenticated && !isAuthRoute) {
    if (process.env.NODE_ENV !== "production") {
      const cookieNames = request.cookies
        .getAll()
        .map((c) => c.name)
        .join(", ");
      const rawCookieHeader = request.headers.get("cookie") || "";
      console.log(
        `[Middleware] No session for ${path}, cookies seen: ${cookieNames || "none"}`,
      );
      console.log(
        `[Middleware] Raw cookie header present: ${rawCookieHeader.length > 0}`,
      );
    }

    const signInUrl = new URL("/auth/signin", getCanonicalBaseUrl(request));
    signInUrl.searchParams.set(
      "next",
      `${path}${request.nextUrl.search || ""}`,
    );

    return NextResponse.redirect(signInUrl);
  }

  // Cas spécial: si l'utilisateur est déjà authentifié et essaie d'accéder à la page de connexion
  if (isAuthenticated && path === "/auth/signin") {
    console.log("[Middleware] User already logged in, redirecting to home");
    // Rediriger vers la page d'accueil
    return NextResponse.redirect(new URL("/", getCanonicalBaseUrl(request)));
  }

  // Dans tous les autres cas, permettre l'accès
  return NextResponse.next();
}

export const config = {
  // Appliquer le middleware à toutes les routes sauf les fichiers statiques et API
  matcher: [
    /*
     * Correspond à toutes les routes sauf:
     * 1. /api (routes API)
     * 2. /_next (ressources Next.js)
     * 3. /_static (ressources statiques)
     * 4. /_vercel (ressources Vercel)
     * 5. /favicon.ico, /robots.txt, etc.
     */
    "/((?!api|_next|_static|_vercel|favicon.ico|robots.txt).*)",
  ],
};
