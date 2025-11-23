"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { useEffect } from "react";
import type { User as UserType } from "@/types/user";

interface RouteDetectorProps {
  user: UserType | undefined;
  children: React.ReactNode;
}

export function RouteDetector({ user, children }: RouteDetectorProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  // Debug pour voir les valeurs
  useEffect(() => {
    console.log("[RouteDetector] Current path:", pathname);
    console.log("[RouteDetector] Is auth page:", isAuthPage);
    console.log("[RouteDetector] User:", user ? "Logged in" : "Not logged in");
    if (!user && !isAuthPage) {
      console.warn("[RouteDetector] User is undefined on protected page!");
    }
  }, [pathname, isAuthPage, user]);

  if (isAuthPage) {
    return (
      <main className="flex items-center justify-center w-full min-h-screen">
        {children}
      </main>
    );
  }

  // Si pas de user sur une page protégée, afficher quand même la structure mais sans sidebar
  if (!user) {
    return (
      <SidebarProvider>
        <main className="w-full h-full">
          <div className="p-4 text-yellow-600">
            Session expirée. Veuillez vous reconnecter.
          </div>
          {children}
        </main>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="w-full h-full">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}
