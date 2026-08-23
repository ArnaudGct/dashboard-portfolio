"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { addOutilAction, createOutilTagAction } from "@/actions/outils-actions";
import { useRouter } from "next/navigation";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import { RemovableTag } from "@/components/removable-tag";

const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

import { Button } from "@/components/ui/button";
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
import Image from "next/image";

type TagOption = {
  id: string;
  label: string;
  important?: boolean;
};

type AddOutilFormProps = {
  availableTags: TagOption[];
};

export function AddOutilItem({ availableTags }: AddOutilFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>("Description de l'outil");
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewMiniature, setPreviewMiniature] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

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

  const handleAddOutil = async (formData: FormData) => {
    try {
      setIsUploading(true);
      formData.set("description", markdown);

      formData.delete("tags");
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      await addOutilAction(formData);

      toast.success("Outil ajouté avec succès !");
      router.push("/outils");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("Erreur lors de l'ajout de l'outil.");
    } finally {
      setIsUploading(false);
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

  const isCloudinaryUrl = (url: string | null): boolean => {
    return url?.startsWith("https://res.cloudinary.com/") || false;
  };

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/outils">
                Outils
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ajouter un outil</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <form className="flex flex-col gap-5" action={handleAddOutil}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="titre">Titre</Label>
            <Input
              type="text"
              id="titre"
              name="titre"
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
                  required
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
                      className="w-full h-full object-cover rounded-md"
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
                      className="w-full h-full object-contain p-2 rounded-md"
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

          <div className="grid grid-cols-1 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_github">Lien GitHub</Label>
              <Input
                type="url"
                id="lien_github"
                name="lien_github"
                placeholder="https://github.com/username/repo"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isUploading}
            >
              {isUploading ? "Ajout en cours..." : "Ajouter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push("/outils")}
              disabled={isUploading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
