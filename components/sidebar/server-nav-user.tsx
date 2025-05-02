"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// Fonction serveur pour gérer la déconnexion
export async function handleSignOut() {
  await auth.api.signOut({
    headers: await headers(),
  });
  redirect("/auth/signin");
}
