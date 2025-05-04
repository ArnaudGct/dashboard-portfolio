"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import {
  addPhotoAction,
  createPhotoTagAction,
  createPhotoSearchTagAction,
  createAlbumAction,
} from "@/actions/photos-actions";

import Image from "next/image";
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
import { TagCheckbox, type TagOption } from "@/components/tag-checkbox";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type AddPhotoFormProps = {
  availableTags: TagOption[];
  availableSearchTags: TagOption[];
  availableAlbums: TagOption[];
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
      // Vérifier le type et la taille
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier sélectionné n'est pas une image");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB
        toast.error("L'image est trop volumineuse (max 10MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewHighRes(reader.result as string);

        // Charger l'image pour obtenir les dimensions
        const img = new Image();
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

      // Ajouter les dimensions détectées
      if (dimensions.width > 0 && dimensions.height > 0) {
        formData.set("largeur", dimensions.width.toString());
        formData.set("hauteur", dimensions.height.toString());
      }

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
      await addPhotoAction(formData);

      toast.success("Photo ajoutée avec succès !");

      // Rediriger vers la liste des photos
      router.push("/creations/photos");
      router.refresh();
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
    const result = await createAlbumAction(tagName);
    if (result.success && result.id) {
      return { id: result.id, label: tagName, important: false };
    }
    return null;
  };

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/photos">Photos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ajouter une photo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <form className="flex flex-col gap-5" action={handleAddPhoto}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
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
                    <img
                      src={previewHighRes}
                      alt="Aperçu haute résolution"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dimensions: {dimensions.width} x {dimensions.height}
                  </p>
                </div>
              )}

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
                    <img
                      src={previewLowRes}
                      alt="Aperçu basse résolution"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
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

              <div className="grid w-full gap-1.5">
                <Label htmlFor="largeur">Largeur (pixels)</Label>
                <Input
                  type="number"
                  id="largeur"
                  name="largeur"
                  placeholder="Largeur détectée automatiquement"
                  value={dimensions.width || ""}
                  onChange={(e) =>
                    setDimensions({
                      ...dimensions,
                      width: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="grid w-full gap-1.5">
                <Label htmlFor="hauteur">Hauteur (pixels)</Label>
                <Input
                  type="number"
                  id="hauteur"
                  name="hauteur"
                  placeholder="Hauteur détectée automatiquement"
                  value={dimensions.height || ""}
                  onChange={(e) =>
                    setDimensions({
                      ...dimensions,
                      height: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <Label htmlFor="isPublished">Afficher</Label>
                <Switch id="isPublished" name="isPublished" defaultChecked />
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
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
          </div>
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

          {selectedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedTags.map((tagId) => {
                const tag = availableTags.find((t) => t.id === tagId);
                return (
                  <Badge key={tagId} variant="secondary" className="text-xs">
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
                  <Badge key={tagId} variant="secondary" className="text-xs">
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
                  <Badge key={albumId} variant="secondary" className="text-xs">
                    {album?.label || albumId}
                  </Badge>
                );
              })}
            </div>
          )}
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
