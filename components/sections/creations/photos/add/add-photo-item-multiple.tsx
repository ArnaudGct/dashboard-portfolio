"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import {
  batchUploadPhotosWithMetadataAction,
  createAlbumAction,
} from "@/actions/photos-actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, UploadCloud, Trash2 } from "lucide-react";
import Image from "next/image";
import { analyzeImageClient } from "@/lib/image-analyzer-client";

type TagOption = {
  id: string;
  label: string;
  important: boolean;
};

type AddPhotoItemMultipleProps = {
  availableTags: TagOption[];
  availableSearchTags: TagOption[];
  availableAlbums: {
    id: string;
    label: string;
  }[];
};

type PreviewImage = {
  file: File;
  preview: string;
  alt: string;
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
  const [analyzingImages, setAnalyzingImages] = useState<Set<number>>(
    new Set()
  );

  // Album sélectionné
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);

  const handleAlbumsChange = (newSelectedAlbums: string[]) => {
    setSelectedAlbums(newSelectedAlbums);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (file.size > 50 * 1024 * 1024) {
          // 20MB
          toast.warning(
            `L'image "${file.name}" est trop volumineuse (max 50MB).`
          );
          return false;
        }
        return true;
      });

      // Créer les prévisualisations avec analyse automatique
      const newImages: PreviewImage[] = [];
      let processedCount = 0;

      for (let i = 0; i < validImageFiles.length; i++) {
        const file = validImageFiles[i];
        const currentIndex = images.length + i;

        // Marquer cette image comme en cours d'analyse
        setAnalyzingImages((prev) => new Set(prev).add(currentIndex));

        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            // Analyser l'image avec Google Vision
            const base64 = (reader.result as string).split(",")[1];
            const analyzedAlt = await analyzeImageClient(base64);

            newImages.push({
              file,
              preview: reader.result as string,
              alt: analyzedAlt,
            });
          } catch (error) {
            console.error("Erreur lors de l'analyse Google Vision:", error);

            // Fallback sur le nom de fichier formaté
            const fileName = file.name.split(".")[0].replace(/[-_]/g, " ");
            const formattedName = fileName.replace(/\b\w/g, (char) =>
              char.toUpperCase()
            );

            newImages.push({
              file,
              preview: reader.result as string,
              alt: formattedName,
            });
          } finally {
            // Retirer cette image de la liste des analyses en cours
            setAnalyzingImages((prev) => {
              const newSet = new Set(prev);
              newSet.delete(currentIndex);
              return newSet;
            });
          }

          processedCount++;
          if (processedCount === validImageFiles.length) {
            setImages((prev) => [...prev, ...newImages]);
            toast.success(`${newImages.length} images analysées et ajoutées`);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImages([]);
    // Réinitialiser l'input file pour permettre la sélection des mêmes fichiers à nouveau
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateAlt = (index: number, alt: string) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index].alt = alt;
      return updated;
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Simuler un changement d'input pour utiliser le même code de traitement
      const dataTransfer = new DataTransfer();
      Array.from(e.dataTransfer.files).forEach((file) => {
        dataTransfer.items.add(file);
      });

      const event = {
        target: { files: dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      handleFileChange(event);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Veuillez sélectionner au moins une image.");
      return;
    }

    if (selectedAlbums.length === 0) {
      toast.error("Veuillez sélectionner au moins un album.");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();

      // Ajouter uniquement les albums sélectionnés
      selectedAlbums.forEach((album) => {
        formData.append("albums", album);
      });

      // État de publication
      formData.append("isPublished", isPublished ? "on" : "off");

      // Ajouter chaque image et ses métadonnées
      images.forEach((img, index) => {
        formData.append(`photo_${index}`, img.file);
        formData.append(`alt_${index}`, img.alt);
        // Toujours générer la version basse résolution
        formData.append(`generateLowRes_${index}`, "true");
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

      const albumNames = selectedAlbums.map(
        (albumId) =>
          availableAlbums.find((a) => a.id === albumId)?.label || albumId
      );

      toast.success(
        `${result} photos ajoutées avec succès dans ${
          albumNames.length > 1
            ? `les albums ${albumNames.slice(0, -1).join(", ")} et ${albumNames.slice(-1)}`
            : `l'album ${albumNames[0]}`
        }!`
      );

      router.push("/creations/photos");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'upload des images:", error);
      toast.error("Une erreur est survenue lors de l'upload des images.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddAlbum = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const formData = new FormData();
      formData.append("title", tagName);
      formData.append("isPublished", "on");
      const result = await createAlbumAction(formData);
      if (result.success && result.id) {
        return {
          id: String(result.id),
          label: tagName,
          important: false,
        };
      }

      // Si l'album existe déjà mais qu'on a quand même récupéré son ID
      if (!result.success && result.id) {
        return { id: String(result.id), label: tagName, important: false };
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
        <div
          className="bg-muted p-8 rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-4"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <UploadCloud size={48} className="text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-lg font-medium">
              Déposez vos images ici ou cliquez pour parcourir
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              Images supportées: PNG, JPG, WEBP (max 10MB par image)
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Une version basse résolution sera automatiquement générée pour
              chaque image
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

        <div className="grid w-full gap-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="albums" className="mb-1 block">
              Sélectionnez un ou plusieurs albums
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

          {selectedAlbums.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedAlbums.map((albumId) => {
                const album = availableAlbums.find((a) => a.id === albumId);
                return (
                  <Badge
                    key={albumId}
                    className="flex items-center gap-1 pl-2 pr-1 cursor-pointer hover:bg-destructive/10 transition-colors group"
                    variant="secondary"
                    onClick={() => {
                      setSelectedAlbums(
                        selectedAlbums.filter((id) => id !== albumId)
                      );
                      toast.success(
                        `Album "${album?.label || albumId}" retiré`
                      );
                    }}
                  >
                    <span
                      className="max-w-[150px] truncate"
                      title={album?.label || albumId}
                    >
                      {album?.label || albumId}
                    </span>
                    <X
                      className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </Badge>
                );
              })}
            </div>
          )}
        </div>

        {/* Liste des images sélectionnées */}
        {images.length > 0 && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">
                Images sélectionnées ({images.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={clearAllImages}
                disabled={isUploading}
              >
                <Trash2 size={14} />
                <span>Tout effacer</span>
              </Button>
            </div>

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
            disabled={
              images.length === 0 || selectedAlbums.length === 0 || isUploading
            }
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
        </div>
      </form>
    </div>
  );
}
