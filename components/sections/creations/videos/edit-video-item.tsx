"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Trash2 } from "lucide-react"; // Ajout de l'icône Trash2
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { updateVideoAction, deleteVideoAction } from "@/actions/videos-actions"; // Ajout de l'action de suppression
import { useRouter } from "next/navigation";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import { RemovableTag } from "@/components/removable-tag";
import { createVideoTagAction } from "@/actions/videos-actions"; // Assurez-vous que cette fonction existe

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
} from "@/components/ui/alert-dialog"; // Import de la boîte de dialogue d'alerte
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

type TagOption = {
  id: string;
  label: string;
  important?: boolean; // Ajout de la propriété important
};

type EditVideoFormProps = {
  initialData: {
    id_vid: number;
    titre: string;
    description: string;
    lien: string;
    duree: string;
    date?: Date;
    afficher: boolean;
    tags: string[];
  };
  availableTags: TagOption[];
};

export function EditVideoItem({
  initialData,
  availableTags,
}: EditVideoFormProps) {
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
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleDeleteVideo = async () => {
    try {
      setIsDeleting(true);
      await deleteVideoAction(initialData.id_vid);
      toast.success("La vidéo a été supprimée avec succès");
      router.push("/creations/videos");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la vidéo");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateVideo = async (formData: FormData) => {
    try {
      // Ajouter l'ID de la vidéo
      formData.set("id", initialData.id_vid.toString());

      // Ajouter le markdown à formData
      formData.set("description", markdown);

      // Ajouter les tags sélectionnés - utilisez delete pour éviter les doublons
      formData.delete("tags");
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      // Ajouter la date au format ISO si elle existe
      if (date) {
        // Formatez la date au format YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        formData.set("date", formattedDate);
        console.log("Date formatée envoyée:", formattedDate);
      } else {
        formData.delete("date");
      }

      // Appeler l'action serveur pour mettre à jour la vidéo
      await updateVideoAction(formData);

      toast.success("La vidéo a été mise à jour avec succès");

      // Rediriger vers la liste des vidéos après la mise à jour
      router.push("/creations/videos");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour de la vidéo.");
    }
  };

  const handleAddTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const result = await createVideoTagAction(tagName, important);
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
          important: false,
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
                <BreadcrumbLink href="/creations/videos">Vidéos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Modifier la vidéo</BreadcrumbPage>
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
                  Êtes-vous sûr de vouloir supprimer cette vidéo ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. La vidéo "{initialData.titre}"
                  sera définitivement supprimée de la base de données.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteVideo}
                  className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Supprimer définitivement"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <form className="flex flex-col gap-5" action={handleUpdateVideo}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              type="text"
              id="title"
              name="title"
              placeholder="Titre"
              defaultValue={initialData.titre}
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
              {/* Champ caché pour stocker la valeur markdown */}
              <input type="hidden" name="description" value={markdown} />
            </div>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="url">Lien de la vidéo</Label>
            <Input
              type="url"
              id="url"
              name="url"
              placeholder="Ex : https://www.youtube.com/watch?v=I_hdJUyyet0"
              defaultValue={initialData.lien}
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="duree">Durée</Label>
            <Input
              type="text"
              id="duree"
              name="duree"
              placeholder="Ex : 00:02:18"
              defaultValue={initialData.duree}
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagSheet
              title="Sélection des tags"
              description="Choisissez les tags à appliquer à cette vidéo"
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
              <div className="flex flex-wrap gap-1 mt-2">
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
            {/* Plus besoin de champs cachés car les tags seront ajoutés dans handleUpdateVideo */}
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
                value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
              />
            )}
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
            <Button type="submit" className="cursor-pointer">
              Mettre à jour
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push("/creations/videos")}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
