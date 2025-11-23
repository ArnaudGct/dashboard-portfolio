"use client";

import { useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SignOut() {
  const router = useRouter();

  useEffect(() => {
    async function handleSignOut() {
      try {
        await signOut({
          fetchOptions: {
            onSuccess: () => {
              toast.success("Vous avez été déconnecté avec succès");
              router.push("/auth/signin");
            },
            onError: (ctx) => {
              console.error("Erreur lors de la déconnexion:", ctx.error);
              toast.error("Erreur lors de la déconnexion");
              // Rediriger quand même vers la page de connexion
              router.push("/auth/signin");
            },
          },
        });
      } catch (error) {
        console.error("Erreur lors de la déconnexion:", error);
        toast.error("Erreur lors de la déconnexion");
        // Rediriger quand même vers la page de connexion
        router.push("/auth/signin");
      }
    }

    handleSignOut();
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-screen gap-4">
      <Loader2 size={48} className="animate-spin text-primary" />
      <p className="text-lg text-muted-foreground">Déconnexion en cours...</p>
    </div>
  );
}
