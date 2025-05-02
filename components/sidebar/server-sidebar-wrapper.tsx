import { getUser } from "@/lib/auth-session";
import { AppSidebar } from "./app-sidebar";

export async function ServerSidebarWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser(); // Récupère l'utilisateur connecté

  // Vérifiez si l'URL actuelle est une page d'authentification
  const isAuthPage =
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/auth");

  // Si c'est une page d'authentification ou si l'utilisateur n'est pas connecté
  if (isAuthPage || !user) {
    return <div className="w-full">{children}</div>; // Affiche uniquement le contenu principal
  }

  return (
    <div className="flex w-full">
      <AppSidebar user={user} />
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
