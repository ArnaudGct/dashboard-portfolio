"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import {
  updateAutreAction,
  deleteAutreAction,
  createAutreTagAction,
} from "@/actions/autres-actions";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import { RemovableTag } from "@/components/removable-tag";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Importer l'éditeur de manière dynamique (côté client uniquement)
const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Switch } from "@/components/ui/switch";
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

type EditAutreFormProps = {
  initialData: {
    id_autre: number;
    titre: string;
    description: string;
    miniature: string;
    lien_github: string;
    lien_figma: string;
    lien_site: string;
    date?: Date;
    afficher: boolean;
    tags: string[];
  };
  availableTags: TagOption[]; // Nouvelles props pour les tags disponibles
};

export function EditAutreItem({
  initialData,
  availableTags,
}: EditAutreFormProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(
    initialData.date
      ? new Date(
          initialData.date.getFullYear(),
          initialData.date.getMonth(),
          initialData.date.getDate()
        )
      : undefined
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData.tags);
  const [markdown, setMarkdown] = useState<string>(initialData.description);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(() => {
    // Si l'image est une URL relative et commence par /uploads, ajouter le domaine
    if (initialData.miniature && initialData.miniature.startsWith("/uploads")) {
      return `${PORTFOLIO_BASE_URL}${initialData.miniature}`;
    }
    return initialData.miniature || null;
  });

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAutre = async () => {
    try {
      setIsDeleting(true);
      await deleteAutreAction(initialData.id_autre);
      toast.success("Projet supprimé avec succès");
      // Rediriger vers la liste des projets après la suppression
      router.push("/creations/autres");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression du projet.");
      setIsDeleting(false);
    }
  };

  const handleUpdateAutre = async (formData: FormData) => {
    try {
      setIsUpdating(true);
      // Ajouter l'ID à formData
      formData.append("id", initialData.id_autre.toString());

      // Ajouter le markdown à formData
      formData.set("description", markdown);

      // Ajouter les tags sélectionnés
      formData.delete("tags"); // Supprimer les valeurs précédentes s'il y en a
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      // Ajouter la date au format YYYY-MM-DD si elle existe
      if (date) {
        const formattedDate = format(date, "yyyy-MM-dd");
        formData.set("date", formattedDate);
      } else {
        formData.delete("date");
      }

      await updateAutreAction(formData);

      toast.success("Projet mis à jour avec succès");

      // Rediriger vers la liste des projets après la mise à jour
      router.push("/creations/autres");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour du projet.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const result = await createAutreTagAction(tagName, important);
      if (result.success && result.tag) {
        toast.success(`Tag "${tagName}" créé avec succès`);
        return {
          id: result.tag.id_tags.toString(),
          label: tagName,
          important: important,
        };
      }

      // Si le tag existe déjà, on peut quand même l'utiliser
      if (!result.success && result.tag) {
        return {
          id: result.tag.id_tags.toString(),
          label: tagName,
          important: result.tag.important,
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
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/creations/autres">
                  Autres projets
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Modifier le projet</BreadcrumbPage>
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
                  Êtes-vous sûr de vouloir supprimer ce projet ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le projet "{initialData.titre}"
                  sera définitivement supprimé de la base de données.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAutre}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <form className="flex flex-col gap-5" action={handleUpdateAutre}>
          <input type="hidden" name="id" value={initialData.id_autre} />

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              type="text"
              id="title"
              name="title"
              defaultValue={initialData.titre}
              placeholder="Titre du projet"
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

          <div className="flex w-full gap-6">
            <div className="flex flex-col w-full items-start gap-1.5">
              <Label htmlFor="miniature">Image</Label>
              <Input
                type="file"
                id="miniature"
                name="miniature"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            {previewImage && (
              <div className="w-80 shrink-0">
                <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                  <Image
                    src={previewImage}
                    alt="Aperçu"
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="rounded-md object-cover"
                    onError={(e) => {
                      // En cas d'erreur, essayer avec l'URL du portfolio
                      const target = e.target as HTMLImageElement;
                      if (
                        previewImage.startsWith("/uploads") &&
                        !previewImage.includes(PORTFOLIO_BASE_URL)
                      ) {
                        target.src = `${PORTFOLIO_BASE_URL}${previewImage}`;
                      } else {
                        target.src = "/placeholder-project.jpg";
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "d MMMM yyyy", { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {date && (
              <input
                type="hidden"
                name="date"
                value={format(date, "yyyy-MM-dd")}
              />
            )}
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagSheet
              title="Sélection des tags"
              description="Choisissez les tags à appliquer à ce projet"
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

            {/* Les champs cachés sont toujours nécessaires pour le formulaire */}
            {selectedTags.map((tag) => (
              <input key={tag} type="hidden" name="tags" value={tag} />
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
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
              <Label htmlFor="lien_figma">Lien Figma</Label>
              <Input
                type="url"
                id="lien_figma"
                name="lien_figma"
                defaultValue={initialData.lien_figma}
                placeholder="https://www.figma.com/file/..."
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_site">Lien du site</Label>
              <Input
                type="url"
                id="lien_site"
                name="lien_site"
                defaultValue={initialData.lien_site}
                placeholder="https://www.example.com"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="isPublished">Afficher</Label>
            <Switch
              id="isPublished"
              name="isPublished"
              defaultChecked={initialData.afficher}
              className="cursor-pointer"
            />
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
              onClick={() => router.push("/creations/autres")}
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
