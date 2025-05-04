"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import {
  batchUploadPhotosWithMetadataAction,
  createPhotoTagAction,
  createPhotoSearchTagAction,
  createAlbumAction,
} from "@/actions/photos-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TagCheckbox, type TagOption } from "@/components/tag-checkbox";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, UploadCloud } from "lucide-react";
import Image from "next/image";

type AddPhotoItemMultipleProps = {
  availableTags: TagOption[];
  availableSearchTags: TagOption[];
  availableAlbums: TagOption[];
};

type PreviewImage = {
  file: File;
  preview: string;
  alt: string;
  generateLowRes: boolean;
};

export function AddPhotoItemMultiple({
  availableTags,
  availableSearchTags,
  availableAlbums,
}: AddPhotoItemMultipleProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<PreviewImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generateLowResForAll, setGenerateLowResForAll] = useState(true);

  // États communs à toutes les images
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSearchTags, setSelectedSearchTags] = useState<string[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleSearchTagsChange = (newSelectedSearchTags: string[]) => {
    setSelectedSearchTags(newSelectedSearchTags);
  };

  const handleAlbumsChange = (newSelectedAlbums: string[]) => {
    setSelectedAlbums(newSelectedAlbums);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // Filtrer les fichiers qui ne sont pas des images
      const imageFiles = newFiles.filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length !== newFiles.length) {
        toast.warning(
          `${newFiles.length - imageFiles.length} fichiers ont été ignorés car ils ne sont pas des images.`
        );
      }

      // Vérifier les tailles des fichiers
      const validImageFiles = imageFiles.filter((file) => {
        if (file.size > 10 * 1024 * 1024) {
          // 10MB
          toast.warning(
            `L'image "${file.name}" est trop volumineuse (max 30MB).`
          );
          return false;
        }
        return true;
      });

      // Créer les prévisualisations
      const newImages: PreviewImage[] = [];

      validImageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extraire le nom de fichier sans extension pour l'utiliser comme alt par défaut
          const fileName = file.name.split(".")[0].replace(/[-_]/g, " ");

          newImages.push({
            file,
            preview: reader.result as string,
            alt: fileName,
            generateLowRes: generateLowResForAll,
          });

          if (newImages.length === validImageFiles.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAlt = (index: number, alt: string) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index].alt = alt;
      return updated;
    });
  };

  const toggleLowRes = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index].generateLowRes = !updated[index].generateLowRes;
      return updated;
    });
  };

  const toggleAllLowRes = () => {
    const newValue = !generateLowResForAll;
    setGenerateLowResForAll(newValue);

    // Mettre à jour toutes les images avec la nouvelle valeur
    setImages((prev) =>
      prev.map((img) => ({
        ...img,
        generateLowRes: newValue,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Veuillez sélectionner au moins une image.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Ajouter les paramètres communs
      // Tags
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      // Tags de recherche
      selectedSearchTags.forEach((tag) => {
        formData.append("tagsRecherche", tag);
      });

      // Albums
      selectedAlbums.forEach((album) => {
        formData.append("albums", album);
      });

      // État de publication
      formData.append("isPublished", isPublished ? "on" : "off");

      // Ajouter chaque image et ses métadonnées
      images.forEach((img, index) => {
        formData.append(`photo_${index}`, img.file);
        formData.append(`alt_${index}`, img.alt);
        formData.append(
          `generateLowRes_${index}`,
          img.generateLowRes ? "true" : "false"
        );
      });

      // Ajouter le nombre total d'images
      formData.append("imageCount", images.length.toString());

      // Simuler la progression localement (car on ne peut pas la recevoir du serveur)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 1000);

      // Upload des images sans callback de progression
      const result = await batchUploadPhotosWithMetadataAction(formData);

      // Arrêter l'intervalle de simulation et mettre la progression à 100%
      clearInterval(progressInterval);
      setProgress(100);

      toast.success(`${result.count} photos ajoutées avec succès !`);
      router.push("/creations/photos");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'upload des images:", error);
      toast.error("Une erreur est survenue lors de l'upload des images.");
    } finally {
      setIsUploading(false);
    }
  };

  // Remplacer les fonctions d'ajout de tags existantes par celles-ci :

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

  const handleAddSearchTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const result = await createPhotoSearchTagAction(tagName, important);
      if (result.success && result.id) {
        return { id: result.id, label: tagName, important: important };
      }

      // Si le tag existe déjà mais qu'on a quand même récupéré son ID
      if (!result.success && result.id) {
        return { id: result.id, label: tagName, important: false };
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un tag de recherche:", error);
      toast.error("Erreur lors de la création du tag de recherche");
      return null;
    }
  };

  const handleAddAlbum = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      // Note: même si les albums n'utilisent pas la propriété "important",
      // nous devons accepter le paramètre car TagSheet l'envoie maintenant
      const formData = new FormData();
      formData.append("title", tagName);
      formData.append("isPublished", "on");
      const result = await createAlbumAction(formData);
      if (result.success && result.id) {
        return {
          id: String(result.id),
          label: tagName,
          important: false, // Les albums n'ont pas de propriété "important", donc toujours false
        };
      }

      // Si l'album existe déjà mais qu'on a quand même récupéré son ID
      if (!result.success && result.id) {
        return { id: String(result.id), label: tagName, important: important };
      }

      return null;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'un album:", error);
      toast.error("Erreur lors de la création de l'album");
      return null;
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* Section d'upload de fichiers */}
        <div className="bg-muted p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-4">
          <UploadCloud size={48} className="text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-medium">
              Déposez vos images ici ou cliquez pour parcourir
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Images supportées: PNG, JPG, WEBP (max 10MB par image)
            </p>
          </div>
          <Input
            type="file"
            id="images"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            multiple
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            Sélectionner des images
          </Button>
        </div>

        {/* Options générales pour toutes les photos */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Options communes</h3>

            <div className="flex items-center space-x-2 mb-4">
              <Label htmlFor="generateLowResAll">
                Générer des versions basse résolution
              </Label>
              <Switch
                id="generateLowResAll"
                checked={generateLowResForAll}
                onCheckedChange={toggleAllLowRes}
                disabled={isUploading}
              />
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <Label htmlFor="isPublishedAll">Publier toutes les photos</Label>
              <Switch
                id="isPublishedAll"
                checked={isPublished}
                onCheckedChange={setIsPublished}
                disabled={isUploading}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Tags et albums</h3>

            <div className="grid w-full gap-4">
              <div>
                <Label htmlFor="tags" className="mb-1 block">
                  Tags communs
                </Label>
                <TagSheet
                  title="Sélection des tags"
                  description="Choisissez les tags à appliquer à toutes les images"
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
              <div>
                <Label htmlFor="searchTags" className="mb-1 block">
                  Tags de recherche communs
                </Label>
                <TagSheet
                  title="Sélection des tags de recherche"
                  description="Choisissez les tags de recherche à appliquer à toutes les images"
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
              <div>
                <Label htmlFor="albums" className="mb-1 block">
                  Albums
                </Label>
                <TagSheet
                  title="Sélection des albums"
                  description="Choisissez les albums dans lesquels ajouter toutes les images"
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

              {selectedTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedTags.map((tagId) => {
                    const tag = availableTags.find((t) => t.id === tagId);
                    return (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag?.label || tagId}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {selectedSearchTags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedSearchTags.map((tagId) => {
                    const tag = availableSearchTags.find((t) => t.id === tagId);
                    return (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag?.label || tagId}
                      </Badge>
                    );
                  })}
                </div>
              )}

              {selectedAlbums.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedAlbums.map((albumId) => {
                    const album = availableAlbums.find((a) => a.id === albumId);
                    return (
                      <Badge
                        key={albumId}
                        variant="secondary"
                        className="text-xs"
                      >
                        {album?.label || albumId}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Liste des images sélectionnées */}
        {images.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2">
              Images sélectionnées ({images.length})
            </h3>
            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 grid grid-cols-1 gap-6">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className="flex gap-4 items-start border-b pb-6 last:border-0"
                  >
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={img.preview}
                        alt={img.alt}
                        fill
                        className="object-cover rounded-md"
                        sizes="(max-width: 768px) 100px, 100px"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="grid w-full gap-1.5 mb-2">
                        <Label htmlFor={`alt-${index}`}>Texte alternatif</Label>
                        <Input
                          id={`alt-${index}`}
                          value={img.alt}
                          onChange={(e) => updateAlt(index, e.target.value)}
                          placeholder="Description de l'image"
                          disabled={isUploading}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`lowRes-${index}`}>
                          Basse résolution
                        </Label>
                        <Switch
                          id={`lowRes-${index}`}
                          checked={img.generateLowRes}
                          onCheckedChange={() => toggleLowRes(index)}
                          disabled={isUploading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {img.file.name} -{" "}
                        {(img.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeImage(index)}
                      className="flex-shrink-0"
                      disabled={isUploading}
                    >
                      <X size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Barre de progression lors de l'upload */}
        {isUploading && (
          <div className="mt-4">
            <Label className="mb-2 block">Progression de l'upload</Label>
            <Progress value={progress} className="h-2 w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {progress}% - Veuillez patienter pendant le traitement des
              images...
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-2 mt-4">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={images.length === 0 || isUploading}
          >
            {isUploading ? "Upload en cours..." : "Ajouter toutes les photos"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/creations/photos")}
            disabled={isUploading}
          >
            Annuler
          </Button>
          {images.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setImages([])}
              disabled={isUploading}
            >
              Vider la sélection
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
