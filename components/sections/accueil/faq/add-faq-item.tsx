"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { addFaqAction } from "@/actions/faq-actions";
import { toast } from "sonner";

// Importer l'éditeur de manière dynamique
const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function AddFaqItem() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleAddFaq = async (formData: FormData) => {
    setIsSubmitting(true);

    formData.set("contenu", markdown);

    const titre = formData.get("titre")?.toString();
    if (!titre || !markdown.trim()) {
      toast.error("Le titre et la réponse sont obligatoires.");
      setIsSubmitting(false);
      return;
    }

    const result = await addFaqAction(formData);

    if (result.success) {
      toast.success("Question ajoutée avec succès");
      router.push("/accueil/faq");
      router.refresh();
    } else {
      toast.error(
        "Erreur lors de l'ajout: " + (result.error || "Erreur inconnue")
      );
    }

    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/accueil/faq">FAQ</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ajouter une question</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <form className="flex flex-col gap-5" action={handleAddFaq}>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="titre">Question</Label>
          <Input
            type="text"
            id="titre"
            name="titre"
            placeholder="Votre question"
            required
          />
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="contenu">Réponse</Label>
          <div className="border rounded-md overflow-hidden">
            <EditorComp
              markdown={markdown}
              onChange={handleEditorChange}
              editorRef={editorRef}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="afficher"
            name="afficher"
            defaultChecked
            className="cursor-pointer"
          />
          <Label htmlFor="afficher">Afficher la question</Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Ajout en cours..." : "Ajouter"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/accueil/faq")}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
