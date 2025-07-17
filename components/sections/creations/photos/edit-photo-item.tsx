"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TagSheet } from "@/components/sections/creations/photos/tag-sheet";
import {
  updatePhotoAction,
  deletePhotoAction,
  createPhotoTagAction,
  createPhotoSearchTagAction,
  createAlbumAction,
  batchUploadPhotosWithMetadataAction,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Trash2, CalendarIcon } from "lucide-react";
import { RemovableTag } from "@/components/removable-tag";

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

type EditPhotoFormProps = {
  initialData: {
    id_pho: number;
    lien_high: string;
    lien_low: string;
    largeur: number;
    hauteur: number;
    alt: string;
    date: Date;
    afficher: boolean;
  };
  availableTags: {
    id: string;
    label: string;
    important: boolean;
  }[];
  availableSearchTags: {
    id: string;
    label: string;
    important: boolean;
  }[];
  availableAlbums: {
    id: string;
    label: string;
  }[];
  selectedTagIds: string[];
  selectedSearchTagIds: string[];
  selectedAlbumIds: string[];
};

type TagOption = {
  id: string;
  label: string;
  important: boolean;
};

export function EditPhotoItem({
  initialData,
  availableTags,
  availableSearchTags,
  availableAlbums,
  selectedTagIds,
  selectedSearchTagIds,
  selectedAlbumIds,
}: EditPhotoFormProps) {
  const router = useRouter();
  const [selectedTags, setSelectedTags] = useState<string[]>(selectedTagIds);
  const [selectedSearchTags, setSelectedSearchTags] =
    useState<string[]>(selectedSearchTagIds);
  const [selectedAlbums, setSelectedAlbums] =
    useState<string[]>(selectedAlbumIds);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewHighRes, setPreviewHighRes] = useState<string | null>(
    getImageUrl(initialData.lien_high)
  );
  const [previewLowRes, setPreviewLowRes] = useState<string | null>(
    getImageUrl(initialData.lien_low)
  );
  const [dimensions, setDimensions] = useState({
    width: initialData.largeur,
    height: initialData.hauteur,
  });
  const [date, setDate] = useState<Date | undefined>(
    initialData.date ? new Date(initialData.date) : undefined
  );

  function getImageUrl(path: string) {
    if (!path) return null;

    if (path.startsWith("http")) {
      return path;
    }

    if (path.startsWith("/photos/") || path.startsWith("/uploads/")) {
      return `${PORTFOLIO_BASE_URL}${path}`;
    }

    return path;
  }

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

      if (file.size > 50 * 1024 * 1024) {
        // 10MB
        toast.error("L'image est trop volumineuse (max 50MB)");
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

  const handleUpdatePhoto = async (formData: FormData) => {
    try {
      setIsUpdating(true);

      // Récupérer l'ID de la photo
      const photoId = initialData.id_pho.toString();
      formData.set("photoId", photoId);

      // Ajouter la date si elle existe
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        formData.set("date", formattedDate);
      }

      // Vérifier si de nouvelles images ont été sélectionnées
      const imageHighRes = formData.get("imageHigh") as File;
      const imageLowRes = formData.get("imageLow") as File;

      // Nombre d'images à traiter (0 ou 1)
      const hasNewImage = imageHighRes && imageHighRes.size > 0;

      if (hasNewImage) {
        // Configurer pour le traitement batch d'une image
        formData.set("imageCount", "1");
        formData.set("photo_0", imageHighRes);
        formData.set("alt_0", formData.get("alt") as string);
        formData.set("generateLowRes_0", "true");
        formData.set("updateMode", "true"); // Indiquer qu'il s'agit d'une mise à jour
      } else {
        // Si pas de nouvelle image, garder les dimensions existantes
        formData.set("largeur", initialData.largeur.toString());
        formData.set("hauteur", initialData.hauteur.toString());
      }

      // Ajouter l'ID de la photo pour l'update
      formData.set("id", photoId);

      // Supprimer les anciens champs qui ne sont plus nécessaires s'il y a une nouvelle image
      if (hasNewImage) {
        formData.delete("imageHigh");
        formData.delete("imageLow");
      }

      // Gérer l'état de publication
      const isPublished = formData.get("isPublished") === "on";
      formData.set("isPublished", isPublished ? "on" : "off");

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

      let result;

      if (hasNewImage) {
        // Utiliser l'action batch pour profiter de la détection des dimensions
        console.log("Mise à jour avec nouvelle image via batchUpload");
        result = await batchUploadPhotosWithMetadataAction(formData);
      } else {
        // Utiliser l'action de mise à jour standard
        console.log("Mise à jour des métadonnées uniquement");
        result = await updatePhotoAction(formData);
      }

      if (result.success) {
        toast.success("Photo mise à jour avec succès !");

        // Rediriger vers la liste des photos
        router.push("/creations/photos");
        router.refresh();
      } else {
        toast.error("Erreur lors de la mise à jour de la photo.");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour de la photo.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      setIsDeleting(true);
      await deletePhotoAction(initialData.id_pho);

      toast.success("Photo supprimée avec succès !");

      // Rediriger vers la liste des photos
      router.push("/creations/photos");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de la photo.");
      setIsDeleting(false);
    }
  };

  const handleAddTag = async (
    tagName: string,
    important: boolean = false
  ): Promise<TagOption | null> => {
    try {
      const result = await createPhotoTagAction(tagName, important);
      if (result.success && result.id) {
        return { id: result.id, label: tagName, important: important };
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

  // Corriger la fonction handleAddSearchTag pour transmettre le paramètre important
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

  const handleAddAlbum = async (tagName: string): Promise<TagOption | null> => {
    try {
      // Créer un FormData pour correspondre à la signature attendue
      const formData = new FormData();
      formData.append("title", tagName);
      formData.append("isPublished", "on"); // Par défaut l'album est visible

      const result = await createAlbumAction(formData);
      if (result.success && result.id) {
        return { id: String(result.id), label: tagName, important: false };
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
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col justify-center items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/creations/photos">Photos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Modifier une photo</BreadcrumbPage>
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
                  Cette action est irréversible. La photo sera définitivement
                  supprimée.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="cursor-pointer">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeletePhoto}
                  className="bg-destructive hover:bg-destructive/90 cursor-pointer"
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <form className="flex flex-col gap-5" action={handleUpdatePhoto}>
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
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour conserver l'image actuelle
                </p>
              </div>

              {previewHighRes && (
                <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                  <div className="relative w-full h-full min-h-[200px]">
                    <Image
                      src={previewHighRes}
                      alt="Aperçu haute résolution"
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 600px"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-photo.jpg";
                      }}
                      unoptimized={previewHighRes.startsWith("data:")} // Ne pas optimiser les images en data URL
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
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour conserver l'image actuelle
                </p>
              </div>

              {previewLowRes && (
                <div className="mt-2 w-full">
                  <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                    <div className="relative w-full h-full min-h-[200px]">
                      <Image
                        src={previewLowRes}
                        alt="Aperçu basse résolution"
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 600px"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-photo.jpg";
                        }}
                        unoptimized={previewLowRes.startsWith("data:")} // Ne pas optimiser les images en data URL
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="alt">Texte alternatif</Label>
            <Input
              type="text"
              id="alt"
              name="alt"
              defaultValue={initialData.alt}
              placeholder="Description de l'image"
              required
            />
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

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
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
              defaultChecked={initialData.afficher}
              className="cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
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
              onClick={() => router.push("/creations/photos")}
              disabled={isUpdating || isDeleting}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
