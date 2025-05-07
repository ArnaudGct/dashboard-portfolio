import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  // Récupérer le cookie de session
  const sessionCookie = getSessionCookie(request);

  // Récupérer le chemin de l'URL
  const path = request.nextUrl.pathname;

  // Vérifier si l'utilisateur accède à une route d'authentification
  const isAuthRoute = path.startsWith("/auth/");

  // Si l'utilisateur n'est pas authentifié et n'accède pas à une route d'authentification
  if (!sessionCookie && !isAuthRoute) {
    // Rediriger vers la page de connexion
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }

  // Cas spécial: si l'utilisateur est déjà authentifié et essaie d'accéder à la page de connexion
  if (sessionCookie && path === "/auth/signin") {
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
