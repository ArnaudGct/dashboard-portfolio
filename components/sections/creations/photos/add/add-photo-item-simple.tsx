"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Image from "next/image";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import {
  addPhotoAction,
  createPhotoTagAction,
  createPhotoSearchTagAction,
  createAlbumAction,
  batchUploadPhotosWithMetadataAction,
} from "@/actions/photos-actions";

import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { RemovableTag } from "@/components/removable-tag";

type TagOption = {
  id: string;
  label: string;
  important: boolean;
};

type AddPhotoFormProps = {
  availableTags: TagOption[];
  availableSearchTags: TagOption[];
  availableAlbums: {
    id: string;
    label: string;
  }[];
};

export function AddPhotoItemSimple({
  availableTags,
  availableSearchTags,
  availableAlbums,
}: AddPhotoFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSearchTags, setSelectedSearchTags] = useState<string[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewHighRes, setPreviewHighRes] = useState<string | null>(null);
  const [previewLowRes, setPreviewLowRes] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [date, setDate] = useState<Date | undefined>(new Date());

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleSearchTagsChange = (newSelectedTags: string[]) => {
    setSelectedSearchTags(newSelectedTags);
  };

  const handleAlbumsChange = (newSelectedAlbums: string[]) => {
    setSelectedAlbums(newSelectedAlbums);
  };

  const handleHighResImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier sélectionné n'est pas une image");
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        // 10MB
        toast.error("L'image est trop volumineuse (max 20MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewHighRes(reader.result as string);

        // Charger l'image pour obtenir les dimensions
        const img = new window.Image();
        img.onload = () => {
          setDimensions({
            width: img.naturalWidth,
            height: img.naturalHeight,
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLowResImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier sélectionné n'est pas une image");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        // 5MB
        toast.error(
          "L'image est trop volumineuse pour une version basse résolution (max 5MB)"
        );
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewLowRes(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPhoto = async (formData: FormData) => {
    try {
      setIsUploading(true);

      // Vérifier si une image est sélectionnée
      const imageHighRes = formData.get("imageHigh") as File;
      if (!imageHighRes || imageHighRes.size === 0) {
        toast.error("Veuillez sélectionner une image haute résolution");
        return;
      }

      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        formData.set("date", formattedDate);
      }

      // Ajouter au FormData de la même manière que batchUploadPhotosWithMetadataAction
      formData.set("imageCount", "1");
      formData.set("photo_0", imageHighRes);
      formData.set("alt_0", formData.get("alt") as string);
      formData.set("generateLowRes_0", "true");

      // Supprimer les anciens champs qui ne sont plus nécessaires
      formData.delete("imageHigh");
      formData.delete("imageLow");
      formData.delete("largeur");
      formData.delete("hauteur");

      // Ajouter les tags sélectionnés
      formData.delete("tags");
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      // Ajouter les tags de recherche sélectionnés
      formData.delete("tagsRecherche");
      selectedSearchTags.forEach((tag) => {
        formData.append("tagsRecherche", tag);
      });

      // Ajouter les albums sélectionnés
      formData.delete("albums");
      selectedAlbums.forEach((album) => {
        formData.append("albums", album);
      });

      // Appeler l'action serveur pour ajouter la photo
      console.log("Envoi des données pour traitement batch");

      // Appeler l'action serveur pour ajouter la photo
      const result = await batchUploadPhotosWithMetadataAction(formData);

      if (result.success) {
        toast.success("Photo ajoutée avec succès !");

        // Rediriger vers la liste des photos
        router.push("/creations/photos");
        router.refresh();
      } else {
        toast.error("Erreur lors de l'ajout de la photo.");
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("Erreur lors de l'ajout de la photo.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    const result = await createPhotoTagAction(tagName, important);
    if (result.success && result.id) {
      return { id: result.id, label: tagName, important: important };
    }
    return null;
  };

  const handleAddSearchTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    const result = await createPhotoSearchTagAction(tagName, important);
    if (result.success && result.id) {
      return { id: result.id, label: tagName, important: important };
    }
    return null;
  };

  const handleAddAlbum = async (tagName: string): Promise<TagOption | null> => {
    const formData = new FormData();
    formData.append("title", tagName);
    formData.append("isPublished", "on");

    const result = await createAlbumAction(formData);
    if (result.success && result.id) {
      return { id: String(result.id), label: tagName, important: false };
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-8">
        <form className="flex flex-col gap-5" action={handleAddPhoto}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col w-full items-start gap-1.5">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="imageHigh">Image haute résolution</Label>
                <Input
                  type="file"
                  id="imageHigh"
                  name="imageHigh"
                  accept="image/*"
                  onChange={handleHighResImageChange}
                  required
                />
              </div>
              {previewHighRes && (
                <div className="mt-2 w-full">
                  <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                    <Image
                      src={previewHighRes}
                      alt="Aperçu haute résolution"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col w-full items-start gap-1.5">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="imageLow">
                  Image basse résolution (optionnel)
                </Label>
                <Input
                  type="file"
                  id="imageLow"
                  name="imageLow"
                  accept="image/*"
                  onChange={handleLowResImageChange}
                />
                <p className="text-xs text-muted-foreground">
                  Si non fournie, l'image haute résolution sera utilisée
                </p>
              </div>

              {previewLowRes && (
                <div className="mt-2 w-full">
                  <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                    <Image
                      src={previewLowRes}
                      alt="Aperçu basse résolution"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="alt">Texte alternatif</Label>
              <Input
                type="text"
                id="alt"
                name="alt"
                placeholder="Description de l'image"
                required
              />
            </div>
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="date">Date de la photo</Label>
            <div className="grid gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal cursor-pointer ${
                      !date ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date
                      ? format(date, "d MMMM yyyy", { locale: fr })
                      : "Sélectionner une date"}
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
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            <div className="grid w-full gap-1.5">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="tags">Tags</Label>
                <TagSheet
                  title="Sélection des tags"
                  description="Choisissez les tags à appliquer à cette image"
                  options={availableTags}
                  selectedTags={selectedTags}
                  onChange={handleTagsChange}
                  onAddNew={handleAddTag}
                  triggerLabel="Sélectionner des tags"
                  searchPlaceholder="Rechercher un tag..."
                  addNewLabel="Ajouter un nouveau tag"
                  type="tag"
                />
              </div>
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

            <div className="grid w-full gap-1.5">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="searchTags">Tags de recherche</Label>
                <TagSheet
                  title="Sélection des tags de recherche"
                  description="Choisissez les tags de recherche à appliquer à cette image"
                  options={availableSearchTags}
                  selectedTags={selectedSearchTags}
                  onChange={handleSearchTagsChange}
                  onAddNew={handleAddSearchTag}
                  triggerLabel="Sélectionner des tags de recherche"
                  searchPlaceholder="Rechercher un tag de recherche..."
                  addNewLabel="Ajouter un nouveau tag de recherche"
                  type="searchTag"
                />
              </div>
              {selectedSearchTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedSearchTags.map((tagId) => {
                    const tag = availableSearchTags.find((t) => t.id === tagId);
                    return (
                      <RemovableTag
                        key={tagId}
                        id={tagId}
                        label={tag?.label || tagId}
                        important={tag?.important}
                        onRemove={(id) => {
                          setSelectedSearchTags(
                            selectedSearchTags.filter((t) => t !== id)
                          );
                        }}
                        tagType="searchTag"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid w-full gap-1.5">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="albums">Albums</Label>
                <TagSheet
                  title="Sélection des albums"
                  description="Choisissez les albums dans lesquels ajouter cette image"
                  options={availableAlbums}
                  selectedTags={selectedAlbums}
                  onChange={handleAlbumsChange}
                  onAddNew={handleAddAlbum}
                  triggerLabel="Sélectionner des albums"
                  searchPlaceholder="Rechercher un album..."
                  addNewLabel="Ajouter un nouvel album"
                  type="album"
                />
              </div>
              {selectedAlbums.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedAlbums.map((albumId) => {
                    const album = availableAlbums.find((a) => a.id === albumId);
                    return (
                      <RemovableTag
                        key={albumId}
                        id={albumId}
                        label={album?.label || albumId}
                        important={false}
                        onRemove={(id) => {
                          setSelectedAlbums(
                            selectedAlbums.filter((a) => a !== id)
                          );
                        }}
                        tagType="album"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-2">
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
              disabled={!previewHighRes || isUploading}
            >
              {isUploading ? "Ajout en cours..." : "Ajouter"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push("/creations/photos")}
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
