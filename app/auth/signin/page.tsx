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
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: session } = await authClient.getSession();

        if (session) {
          setIsAuthenticated(true);

          // Utiliser un petit délai pour montrer le chargement, puis rediriger
          setTimeout(() => {
            router.push("/");
          }, 300);
          return;
        }
      } catch (error) {
        console.error(
          "Erreur lors de la vérification de l'authentification:",
          error
        );
      }

      if (!isAuthenticated) {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [isAuthenticated, router]);

  if (checkingAuth || isAuthenticated) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <Card className="flex w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Se connecter</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Entrer votre mail et mot de passe pour vous connecter à votre compte.
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
            className="w-full cursor-pointer"
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
                    toast.success("Connexion réussie !", {
                      duration: 1500, // Durée courte pour laisser le toast visible
                    });

                    setTimeout(() => {
                      window.location.href = "/";
                    }, 1500);
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
  );
}
