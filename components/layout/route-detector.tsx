"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { useEffect } from "react"; // Ajoutez cette importation

interface RouteDetectorProps {
  user: unknown;
  children: React.ReactNode;
}

export function RouteDetector({ user, children }: RouteDetectorProps) {
  const pathname = usePathname();
  // Ajoutez une vérification plus large pour inclure toutes les pages d'authentification
  const isAuthPage = pathname?.includes("/auth");

  // Debug pour voir les valeurs
  useEffect(() => {
    console.log("Current path:", pathname);
    console.log("Is auth page:", isAuthPage);
    console.log("User:", user);
  }, [pathname, isAuthPage, user]);

  if (isAuthPage) {
    return (
      <main className="flex items-center justify-center w-full min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <SidebarProvider>
      {user ? <AppSidebar user={user} /> : null}
      <main className="w-full h-full">
        {!isAuthPage && <SidebarTrigger />}
        {children}
      </main>
    </SidebarProvider>
  );
}
