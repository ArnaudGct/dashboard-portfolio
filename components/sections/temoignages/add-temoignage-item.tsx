"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { addTemoignageAction } from "@/actions/temoignages-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AddTemoignageItem() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await addTemoignageAction(formData);
    if (result.success) {
      toast.success("Témoignage ajouté avec succès !");
      router.push("/accueil/temoignages");
      router.refresh();
    } else {
      toast.error(result.error || "Une erreur est survenue.");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/accueil/temoignages">
              Témoignages
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ajouter un témoignage</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <form action={handleSubmit} className="flex flex-col gap-5">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="client">Client</Label>
          <Input type="text" id="client" name="client" required />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="plateforme">Plateforme</Label>
          <Input type="text" id="plateforme" name="plateforme" required />
        </div>
        <div className="grid w-full gap-1.5">
          <Label htmlFor="contenu">Contenu</Label>
          <Textarea id="contenu" name="contenu" required />
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="afficher" name="afficher" defaultChecked />
          <Label htmlFor="afficher">Afficher le témoignage</Label>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer"
          >
            {isSubmitting ? "Ajout en cours..." : "Ajouter"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
