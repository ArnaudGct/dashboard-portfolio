"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client"; // Import de authClient pour vérifier l'authentification

import { useEffect } from "react"; // Import de useEffect

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true); // État pour gérer la vérification d'authentification
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Nouvel état pour suivre l'authentification

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: session } = await authClient.getSession();

        if (session) {
          setIsAuthenticated(true); // Marquer l'utilisateur comme authentifié

          // Ajouter un léger délai avant la redirection pour maintenir l'écran de chargement
          window.location.href = "/";

          // Ne pas mettre checkingAuth à false si l'utilisateur est authentifié
          // cela maintiendra l'écran de chargement pendant la redirection
          return;
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'authentification:",
          error
        );
      }

      // Seulement mettre checkingAuth à false si l'utilisateur n'est PAS authentifié
      if (!isAuthenticated) {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [isAuthenticated]);

  // Afficher l'indicateur de chargement à la fois pendant la vérification
  // et si l'utilisateur est authentifié (avant la redirection)
  if (checkingAuth || isAuthenticated) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-screen">
      <Card className="flex w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Se connecter</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Entrer votre mail et mot de passe pour vous connecter à votre
            compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                onChange={(e) => {
                  setEmail(e.target.value);
                }}
                value={email}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="/auth/forget-password"
                  className="ml-auto inline-block text-sm underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                placeholder="mot de passe"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              onClick={async () => {
                const { error } = await signIn.email(
                  {
                    email,
                    password,
                  },
                  {
                    onRequest: () => {
                      setLoading(true);
                    },
                    onResponse: () => {
                      setLoading(false);
                    },
                    onSuccess: () => {
                      toast.success("Connexion réussite !");
                      window.location.href = "/";
                    },
                  }
                );
                if (error) {
                  toast.error(error.message);
                  return;
                }
              }}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <p> Se connecter </p>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
