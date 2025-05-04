"use client";

import { useState, useEffect, useRef } from "react"; // Ajout de useEffect
import { useRouter } from "next/navigation";
import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link"; // Ajout de l'import Link pour la navigation
// import { MDXEditorMethods } from "@mdxeditor/editor";
import {
  createAlbumAction,
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
import { Badge } from "@/components/ui/badge";
import { TagCheckbox, type TagOption } from "@/components/tag-checkbox";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RemovableTag } from "@/components/removable-tag";

const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

// Mise à jour des props
type AddAlbumFormProps = {
  availableTags: TagOption[];
  availableImages: ImageOption[];
  baseUrl: string;
};

export function AddAlbumItem({
  availableTags,
  availableImages,
  baseUrl,
}: AddAlbumFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [initialImages, setInitialImages] = useState<number[]>([]);
  const [hasInitializedImages, setHasInitializedImages] = useState(false); // Nouvel état pour suivre l'initialisation
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markdown, setMarkdown] = useState<string>("Description de l'album");
  const editorRef = useRef<MDXEditorMethods | null>(null);

  // Ajouter cette fonction
  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  // Initialiser les images initiales après la première sélection
  useEffect(() => {
    // Ne mettre à jour initialImages que si hasInitializedImages est false et selectedImages n'est pas vide
    if (!hasInitializedImages && selectedImages.length > 0) {
      setInitialImages([...selectedImages]);
      setHasInitializedImages(true);
    }
  }, [selectedImages, hasInitializedImages]);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleImagesChange = (newSelectedImages: number[]) => {
    setSelectedImages(newSelectedImages);

    // Si c'est la première sélection d'images, initialiser les images initiales
    if (!hasInitializedImages && newSelectedImages.length > 0) {
      setInitialImages([...newSelectedImages]);
      setHasInitializedImages(true);
    }
  };

  // Fonction pour restaurer les images initiales
  const handleRestoreImages = () => {
    setSelectedImages([...initialImages]);
    toast.success("Modifications annulées, sélection d'images restaurée");
  };

  // Calculer les modifications apportées aux images uniquement après la première initialisation
  const imagesToAdd = hasInitializedImages
    ? selectedImages.filter((id) => !initialImages.includes(id))
    : [];

  const imagesToRemove = hasInitializedImages
    ? initialImages.filter((id) => !selectedImages.includes(id))
    : [];

  const hasImageChanges =
    hasInitializedImages &&
    (imagesToAdd.length > 0 || imagesToRemove.length > 0);

  const handleAddAlbum = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

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

      // Ajouter la date au format YYYY-MM-DD si elle existe
      if (date) {
        // Formatez la date au format YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        formData.set("date", formattedDate);
      }

      // Appeler l'action serveur
      await createAlbumAction(formData);

      toast.success("Album créé avec succès !");

      // Rediriger vers la liste des albums
      router.push("/creations/photos/albums");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la création de l'album:", error);
      toast.error("Erreur lors de la création de l'album.");
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="flex flex-col gap-8">
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
            <BreadcrumbPage>Nouvel album</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <form className="flex flex-col gap-5" action={handleAddAlbum}>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="title">Titre</Label>
          <Input
            type="text"
            id="title"
            name="title"
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

        <div className="grid w-full gap-2">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="images">Ajouter des photos dans l'album</Label>
            <ImageSheet
              title="Sélection des images"
              description="Choisissez les images à ajouter à cet album"
              options={availableImages}
              selectedImages={selectedImages}
              onChange={handleImagesChange}
              triggerLabel="Sélectionner des images"
              searchPlaceholder="Rechercher une image..."
              baseUrl={baseUrl}
            />
          </div>

          {/* Afficher les miniatures des images sélectionnées */}
          {selectedImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {selectedImages.map((imageId) => {
                const image = availableImages.find((img) => img.id === imageId);
                if (!image) return null;

                const isNewlyAdded = !initialImages.includes(imageId);

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
                      className="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Retrait de l'image de la sélection
                        setSelectedImages((prev) =>
                          prev.filter((id) => id !== imageId)
                        );
                        toast.success("Photo retirée de la sélection");
                      }}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Retirer de la sélection</span>
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
          {hasInitializedImages && hasImageChanges && (
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
                "Créer l'album".
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
            defaultChecked
            className="cursor-pointer"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Création en cours..." : "Créer l'album"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/creations/photos/albums")}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
