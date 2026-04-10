import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

function hasSessionCookieFallback(request: NextRequest): boolean {
  const cookies = request.cookies.getAll();

  // Certains environnements/proxy peuvent modifier le nom exact du cookie.
  // On garde un fallback permissif sur les patterns connus de Better Auth.
  return cookies.some((cookie) => {
    const name = cookie.name.toLowerCase();
    return (
      name.includes("better-auth") &&
      (name.includes("session") || name.includes("token"))
    );
  });
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
    console.log(`[Middleware] No session for ${path}, redirecting to signin`);
    // Rediriger vers la page de connexion
    return NextResponse.redirect(new URL("/auth/signin", request.url));
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
