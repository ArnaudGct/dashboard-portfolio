"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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

export default function ForgetPassword() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!token) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Card className="flex w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">
              Réinitialisation du mot de passe
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Entrer votre mail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                const email = formData.get("email") as string;
                await authClient.forgetPassword(
                  {
                    email: email as string,
                    redirectTo: "/auth/forget-password",
                  },
                  {
                    onRequest: () => {
                      setLoading(true);
                    },
                    onSuccess: () => {
                      toast.success(
                        "Un lien de réinitialisation a été envoyé à votre adresse email !"
                      );
                      setLoading(false);
                    },
                    onError: (ctx) => {
                      toast.error(ctx.error.message);
                    },
                  }
                );
              }}
              className="grid gap-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>

                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="m.example.com"
                  required
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  value={email}
                />
              </div>
              {/* <div className="grid gap-2">
                <Label htmlFor="password">Mot de passe</Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="mot de passe"
                  autoComplete="password"
                  value={password}
                  required
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div> */}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <p> Envoyer le lien de réinitialisation </p>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center w-full h-screen">
      <Card className="flex w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Réinitialisation du mot de passe
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Entrer votre nouveau mot de passe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={async (formData) => {
              const password = formData.get("password") as string;
              await authClient.resetPassword(
                {
                  newPassword: password as string,
                  token: token as string,
                },
                {
                  onRequest: () => {
                    setLoading(true);
                  },
                  onSuccess: () => {
                    router.push("/auth/signin");
                    toast.success("Mot de passe réinitialisé avec succès !");
                    setLoading(false);
                  },
                  onError: (ctx) => {
                    toast.error(ctx.error.message);
                  },
                }
              );
            }}
            className="grid gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>

              <Input
                id="password"
                type="password"
                name="password"
                placeholder="mot de passe"
                autoComplete="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <p> Réinitialiser mon mot de passe </p>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
