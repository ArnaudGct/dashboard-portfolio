"use client";

import { useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import {
  updateOutilAction,
  deleteOutilAction,
  createOutilTagAction,
} from "@/actions/outils-actions";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import { RemovableTag } from "@/components/removable-tag";
import { useRouter } from "next/navigation";
import Image from "next/image";

const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

import { Button } from "@/components/ui/button";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

type TagOption = {
  id: string;
  label: string;
  important?: boolean;
};

type EditOutilFormProps = {
  initialData: {
    id_outil: number;
    titre: string;
    description: string;
    miniature: string;
    logo: string;
    lien_github: string;
    lien_telechargement: string;
    tags: string[];
  };
  availableTags: TagOption[];
};

export function EditOutilItem({
  initialData,
  availableTags,
}: EditOutilFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags);
  const [markdown, setMarkdown] = useState<string>(initialData.description);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const isCloudinaryUrl = (url: string | null): boolean => {
    return url?.startsWith("https://res.cloudinary.com/") || false;
  };

  const formatImageUrl = (url: string | null): string | null => {
    if (!url) return null;
    if (isCloudinaryUrl(url)) {
      return url;
    }
    return `${PORTFOLIO_BASE_URL}${url}`;
  };

  const [previewMiniature, setPreviewMiniature] = useState<string | null>(
    formatImageUrl(initialData.miniature)
  );
  
  const [previewLogo, setPreviewLogo] = useState<string | null>(
    formatImageUrl(initialData.logo)
  );

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleMiniatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewMiniature(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteOutil = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteOutilAction(initialData.id_outil);

      if (result && result.success) {
        toast.success("Outil supprimé avec succès");
        router.push("/outils");
        router.refresh();
      } else {
        toast.error("Erreur lors de la suppression de l'outil");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'outil");
      setIsDeleting(false);
    }
  };

  const handleUpdateOutil = async (formData: FormData) => {
    try {
      setIsUpdating(true);

      formData.append("id", initialData.id_outil.toString());
      formData.set("description", markdown);

      formData.delete("tags");
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      const result = await updateOutilAction(formData);

      if (result && result.success) {
        toast.success("Outil mis à jour avec succès");
        router.push("/outils");
        router.refresh();
      } else {
        toast.error("Erreur lors de la mise à jour de l'outil");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour de l'outil");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const result = await createOutilTagAction(tagName, important ? 1 : 0);
      if (result.success && result.tag) {
        toast.success(`Tag "${tagName}" créé avec succès`);
        return {
          id: result.tag.id_tags.toString(),
          label: tagName,
          important: important,
        };
      }

      if (!result.success && result.tag) {
        return {
          id: result.tag.id_tags.toString(),
          label: tagName,
          important: result.tag.important === 1,
        };
      }

      toast.error("Impossible de créer le tag");
      return null;
    } catch (error) {
      console.error("Erreur lors de l'ajout du tag:", error);
      toast.error("Erreur lors de la création du tag");
      return null;
    }
  };

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-center items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/outils">
                  Outils
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Modifier l'outil</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Êtes-vous sûr de vouloir supprimer cet outil ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. L'outil "{initialData.titre}"
                  sera définitivement supprimé de la base de données.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOutil}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <form className="flex flex-col gap-5" action={handleUpdateOutil}>
          <input type="hidden" name="id" value={initialData.id_outil} />

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="titre">Titre</Label>
            <Input
              type="text"
              id="titre"
              name="titre"
              defaultValue={initialData.titre}
              placeholder="Nom de l'outil"
              required
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description</Label>
            <div className="border rounded-md overflow-hidden">
              <EditorComp
                markdown={markdown}
                onChange={handleEditorChange}
                editorRef={editorRef}
              />
              <input type="hidden" name="description" value={markdown} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col w-full items-start gap-1.5">
                <Label htmlFor="miniature">Image miniature</Label>
                <Input
                  type="file"
                  id="miniature"
                  name="miniature"
                  accept="image/*"
                  onChange={handleMiniatureChange}
                  className="cursor-pointer"
                />
              </div>

              {previewMiniature && (
                <div className="w-80 shrink-0">
                  <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                    <Image
                      src={previewMiniature}
                      alt="Aperçu miniature"
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="rounded-md object-cover"
                      unoptimized={
                        previewMiniature.startsWith("data:") ||
                        isCloudinaryUrl(previewMiniature)
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col w-full items-start gap-1.5">
                <Label htmlFor="logo">Logo (Optionnel)</Label>
                <Input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="cursor-pointer"
                />
              </div>

              {previewLogo && (
                <div className="w-40 shrink-0">
                  <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-square">
                    <Image
                      src={previewLogo}
                      alt="Aperçu logo"
                      fill
                      sizes="(max-width: 768px) 100vw, 160px"
                      className="rounded-md object-contain p-2"
                      unoptimized={
                        previewLogo.startsWith("data:") ||
                        isCloudinaryUrl(previewLogo)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagSheet
              title="Sélection des tags"
              description="Choisissez les tags à appliquer à cet outil"
              options={availableTags}
              selectedTags={selectedTags}
              onChange={handleTagsChange}
              onAddNew={handleAddTag}
              triggerLabel="Sélectionner des tags"
              searchPlaceholder="Rechercher un tag..."
              addNewLabel="Ajouter un nouveau tag"
              type="tag"
            />

            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTags.map((tagId) => {
                  const tag = availableTags.find((t) => t.id === tagId);
                  return (
                    <RemovableTag
                      key={tagId}
                      id={tagId}
                      label={tag?.label || tagId}
                      important={tag?.important}
                      onRemove={(id) => {
                        setSelectedTags(selectedTags.filter((t) => t !== id));
                      }}
                      tagType="tag"
                    />
                  );
                })}
              </div>
            )}

            {selectedTags.map((tag) => (
              <input key={tag} type="hidden" name="tags" value={tag} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_github">Lien GitHub</Label>
              <Input
                type="url"
                id="lien_github"
                name="lien_github"
                defaultValue={initialData.lien_github}
                placeholder="https://github.com/username/repo"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_telechargement">Lien de téléchargement</Label>
              <Input
                type="url"
                id="lien_telechargement"
                name="lien_telechargement"
                defaultValue={initialData.lien_telechargement}
                placeholder="https://exemple.com/download"
              />
            </div>
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
              onClick={() => router.push("/outils")}
              disabled={isUpdating}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
