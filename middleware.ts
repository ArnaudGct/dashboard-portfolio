import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function hasSessionCookieFallback(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();
  const rawCookieHeader = request.headers.get("cookie") || "";

  // Certains environnements/proxy peuvent modifier le nom exact du cookie.
  // On garde un fallback permissif sur les patterns de session/auth.
  const hasNamedCookie = cookies.some((cookie) => {
    const name = cookie.name.toLowerCase();
    return (
      name.includes("session") ||
      name.includes("auth") ||
      name.includes("token")
    );
  });

  if (hasNamedCookie) {
    return true;
  }

  // Fallback sur le header brut si request.cookies ne remonte rien.
  return (
    rawCookieHeader.includes("session") ||
    rawCookieHeader.includes("auth") ||
    rawCookieHeader.includes("token")
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

  // Si l'utilisateur n'est pas authentifié et n'accède pas à une route d'authentification
  if (!isAuthenticated && !isAuthRoute) {
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
    // Ne pas forcer de redirection ici: la validation serveur se fait deja dans l'app.
    // Evite les boucles/erreurs globales quand le proxy ne transmet pas encore le cookie.
    return NextResponse.next();
  }

  // Cas spécial: si l'utilisateur est déjà authentifié et essaie d'accéder à la page de connexion
  if (isAuthenticated && path === "/auth/signin") {
    console.log("[Middleware] User already logged in, redirecting to home");
    // Rediriger vers la page d'accueil
    return NextResponse.redirect(new URL("/", request.url));
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
