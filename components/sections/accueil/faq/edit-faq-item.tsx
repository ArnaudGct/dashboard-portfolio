"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MDXEditorMethods } from "@mdxeditor/editor";
import dynamic from "next/dynamic";

import { updateFaqAction, deleteFaqAction } from "@/actions/faq-actions";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

// Importer l'éditeur de manière dynamique
const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

interface EditFaqItemProps {
  initialData: {
    id_faq: number;
    titre: string;
    contenu: string;
    afficher: boolean;
  };
}

export function EditFaqItem({ initialData }: EditFaqItemProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [markdown, setMarkdown] = useState<string>(initialData.contenu || "");
  const [isPublished, setIsPublished] = useState<boolean>(initialData.afficher);
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleEditorChange = (newMarkdown: string) => {
    if (isMounted.current) {
      setMarkdown(newMarkdown);
    }
  };

  const handleUpdateFaq = async (formData: FormData) => {
    setIsUpdating(true);

    formData.set("id", initialData.id_faq.toString());
    formData.set("contenu", markdown);
    formData.set("afficher", isPublished ? "on" : "off");

    const result = await updateFaqAction(formData);

    if (result?.success) {
      toast.success("Question mise à jour avec succès");
      router.push("/accueil/faq");
      router.refresh();
    } else {
      toast.error(result?.error || "Erreur lors de la mise à jour");
    }
    setIsUpdating(false);
  };

  const handleDeleteFaq = async () => {
    setIsDeleting(true);
    const result = await deleteFaqAction(initialData.id_faq);

    if (result?.success) {
      toast.success("Question supprimée avec succès");
      router.push("/accueil/faq");
      router.refresh();
    } else {
      toast.error(result?.error || "Erreur lors de la suppression");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/accueil/faq">FAQ</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Modifier une question</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Cela supprimera définitivement
                cette question.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFaq}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form className="flex flex-col gap-5" action={handleUpdateFaq}>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="titre">Question</Label>
          <Input
            type="text"
            id="titre"
            name="titre"
            defaultValue={initialData.titre}
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
            checked={isPublished}
            onCheckedChange={setIsPublished}
            className="cursor-pointer"
          />
          <Label htmlFor="afficher">Afficher la question</Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={isUpdating}
          >
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/accueil/faq")}
            disabled={isUpdating}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
