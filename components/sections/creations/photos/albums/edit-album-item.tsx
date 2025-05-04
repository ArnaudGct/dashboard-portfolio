"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import {
  updateAlbumAction,
  deleteAlbumAction,
  createPhotoTagAction,
} from "@/actions/photos-actions";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import {
  ImageSheet,
  type ImageOption,
} from "@/components/sections/creations/photos/image-sheet";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { type TagOption } from "@/components/tag-checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Image from "next/image";
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
import { RemovableTag } from "@/components/removable-tag";

const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

type PhotoInfo = {
  id: number;
  lien: string;
  alt: string;
};

type EditAlbumFormProps = {
  initialData: {
    id_alb: number;
    titre: string;
    description: string | null;
    date: Date;
    afficher: boolean;
    photos: PhotoInfo[];
  };
  availableTags: TagOption[];
  selectedTagIds: string[];
  availableImages: ImageOption[];
  baseUrl: string;
};

export function EditAlbumItem({
  initialData,
  availableTags,
  selectedTagIds,
  availableImages,
  baseUrl,
}: EditAlbumFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>(selectedTagIds);
  const [date, setDate] = useState<Date | undefined>(
    new Date(initialData.date)
  );
  const [markdown, setMarkdown] = useState<string>(
    initialData.description || ""
  );
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Ajoutez cette fonction pour gérer les changements dans l'éditeur
  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  // Initialiser les images sélectionnées avec celles de l'album
  const [selectedImages, setSelectedImages] = useState<number[]>(
    initialData.photos.map((photo) => photo.id)
  );

  // Effet pour synchroniser les images sélectionnées avec l'interface unifiée
  useEffect(() => {
    // Met à jour les images sélectionnées quand selectedImages change
    setSelectedImages(selectedImages);
  }, [selectedImages]);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleImagesChange = (newSelectedImages: number[]) => {
    setSelectedImages(newSelectedImages);
  };

  const handleRestoreImages = () => {
    // Restaure la sélection d'images à l'état initial
    setSelectedImages(initialData.photos.map((photo) => photo.id));
    toast.success("Modifications annulées, sélection d'images restaurée");
  };

  // Fonction pour gérer l'ajout de nouveaux tags
  const handleAddTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const result = await createPhotoTagAction(tagName, important);
      if (result.success && result.id) {
        // Ajouter le nouveau tag à la liste des tags disponibles
        const newTag: TagOption = {
          id: result.id,
          label: tagName,
          important: important,
        };
        return newTag;
      }

      // Si le tag existe déjà mais qu'on a quand même récupéré son ID
      if (!result.success && result.id) {
        return { id: result.id, label: tagName, important: false };
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un tag:", error);
      toast.error("Erreur lors de la création du tag");
      return null;
    }
  };

  // Fonction pour obtenir l'URL complète d'une image
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder-photo.jpg";

    if (path.startsWith("http")) {
      return path;
    }

    if (path.startsWith("/photos/") || path.startsWith("/uploads/")) {
      return `${baseUrl}${path}`;
    }

    return path;
  };

  // Modifier la fonction de mise à jour
  const handleUpdateAlbum = async (formData: FormData) => {
    try {
      setIsUpdating(true);

      // Ajouter l'ID de l'album
      formData.set("id", initialData.id_alb.toString());

      formData.set("description", markdown);

      // Ajouter les tags sélectionnés
      formData.delete("tags");
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      // Ajouter les images sélectionnées
      formData.delete("images");
      selectedImages.forEach((imageId) => {
        formData.append("images", imageId.toString());
      });

      // Ajouter la date au format YYYY-MM-DD
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        formData.set("date", formattedDate);
      }

      // Appeler l'action serveur pour mettre à jour l'album
      await updateAlbumAction(formData);

      toast.success("Album mis à jour avec succès !");

      // Rediriger vers la liste des albums
      router.push("/creations/photos/albums");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'album:", error);
      toast.error("Erreur lors de la mise à jour de l'album.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculer les modifications apportées aux images
  const initialImageIds = initialData.photos.map((photo) => photo.id);
  const imagesToAdd = selectedImages.filter(
    (id) => !initialImageIds.includes(id)
  );
  const imagesToRemove = initialImageIds.filter(
    (id) => !selectedImages.includes(id)
  );
  const hasImageChanges = imagesToAdd.length > 0 || imagesToRemove.length > 0;

  const handleDeleteAlbum = async () => {
    try {
      setIsDeleting(true);
      await deleteAlbumAction(initialData.id_alb);

      toast.success("Album supprimé avec succès !");

      // Rediriger vers la liste des albums
      router.push("/creations/photos/albums");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'album.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/photos">Photos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/photos/albums">
                Albums
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Modifier l'album</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={isDeleting || isUpdating}
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. L'album sera définitivement
                supprimé, mais les photos ne seront pas affectées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAlbum}
                className="bg-destructive hover:bg-destructive/90 cursor-pointer"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form className="flex flex-col gap-5" action={handleUpdateAlbum}>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="title">Titre</Label>
          <Input
            type="text"
            id="title"
            name="title"
            defaultValue={initialData.titre}
            placeholder="Titre de l'album"
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
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal gap-2 cursor-pointer",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="h-4 w-4" />
                {date ? (
                  format(date, "d MMMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid w-full gap-1.5">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagSheet
              title="Sélection des tags"
              description="Choisissez les tags à appliquer à cet album"
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
              <div className="flex flex-wrap gap-1">
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
          </div>
        </div>

        {/* SECTION UNIFIÉE : Photos de l'album */}
        <div className="grid w-full gap-1.5">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="images">Modifier des photos dans l'album</Label>
            <ImageSheet
              title="Sélection des images"
              description="Choisissez les images à ajouter à cet album"
              options={availableImages}
              selectedImages={selectedImages}
              onChange={handleImagesChange}
              triggerLabel="Gérer les photos de l'album"
              searchPlaceholder="Rechercher une image..."
              baseUrl={baseUrl}
            />
          </div>

          {/* Aperçu des photos sélectionnées */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {selectedImages.map((imageId) => {
                const image = availableImages.find((img) => img.id === imageId);
                if (!image) return null;

                const isNewlyAdded = !initialImageIds.includes(imageId);

                return (
                  <div
                    key={imageId}
                    className={`group relative aspect-square rounded-md overflow-hidden bg-muted ${
                      isNewlyAdded ? "ring-2 ring-green-500" : ""
                    }`}
                  >
                    {/* Lien vers la page d'édition de la photo */}
                    <Link
                      href={`/creations/photos/edit/${imageId}`}
                      className="block h-full w-full"
                    >
                      <Image
                        src={
                          image.url.startsWith("http")
                            ? image.url
                            : `${baseUrl}${image.url}`
                        }
                        alt={image.alt || image.title || "Image sélectionnée"}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 33vw, 20vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-photo.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </Link>

                    {/* Bouton pour retirer la photo directement */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Retrait de l'image de la sélection
                        setSelectedImages((prev) =>
                          prev.filter((id) => id !== imageId)
                        );
                        toast.success("Photo retirée de l'album");
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Retirer de l'album</span>
                    </Button>

                    {/* Indication visuelle pour les nouvelles photos */}
                    {isNewlyAdded && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-xs rounded-full px-1.5 py-0.5">
                        Nouvelle
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Message informatif sur les changements */}
          {hasImageChanges && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex justify-between items-center">
              <p className="text-sm text-yellow-800">
                {imagesToAdd.length > 0 && (
                  <span>
                    <strong>{imagesToAdd.length}</strong> nouvelle(s) photo(s)
                    ajoutée(s).{" "}
                  </span>
                )}
                {imagesToRemove.length > 0 && (
                  <span>
                    <strong>{imagesToRemove.length}</strong> photo(s) sera(ont)
                    retirée(s).{" "}
                  </span>
                )}
                Les modifications ne seront appliquées qu'après avoir cliqué sur
                "Mettre à jour".
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2 h-8 text-yellow-800 border-yellow-300 hover:bg-yellow-100 cursor-pointer"
                onClick={handleRestoreImages}
              >
                Annuler les modifications
              </Button>
            </div>
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

        <div className="flex gap-2 mt-4">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={isUpdating || isDeleting}
          >
            {isUpdating ? "Mise à jour en cours..." : "Mettre à jour"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/creations/photos/albums")}
            disabled={isUpdating || isDeleting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
