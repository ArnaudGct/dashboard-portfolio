"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Eye, EyeOff, Check, ChevronsUpDown, Album } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/tag";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

// Types pour les photos
type Photo = {
  id_pho: number;
  lien_high: string;
  lien_low: string;
  largeur: number;
  hauteur: number;
  alt: string;
  date_ajout: Date;
  afficher: boolean;
  photos_tags_link: {
    id_pho: number;
    id_tags: number;
    photos_tags: {
      id_tags: number;
      titre: string;
      important: boolean;
    };
  }[];
  photos_tags_recherche_link: {
    id_pho: number;
    id_tags: number;
    photos_tags_recherche: {
      id_tags: number;
      titre: string;
    };
  }[];
  photos_albums_link: {
    id_pho: number;
    id_alb: number;
    photos_albums: {
      id_alb: number;
      titre: string;
    };
  }[];
};

type Album = {
  id_alb: number;
  titre: string;
  description: string;
  date: Date;
  afficher: boolean;
};

type PhotosGalleryProps = {
  photos: Photo[];
  albums: Album[];
};

// Composant principal qui combine la liste et les items
export function PhotoItem({ photos, albums }: PhotosGalleryProps) {
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const router = useRouter();

  // Filtrer les photos en fonction de l'album sélectionné
  const filteredPhotos = !selectedAlbumId
    ? photos // Si aucun album sélectionné, afficher toutes les photos
    : selectedAlbumId === "unassigned"
      ? photos.filter((photo) => photo.photos_albums_link.length === 0)
      : photos.filter((photo) =>
          photo.photos_albums_link.some(
            (link) => link.photos_albums.id_alb === parseInt(selectedAlbumId)
          )
        );

  // Trouver l'album sélectionné pour l'affichage du titre
  const selectedAlbum =
    selectedAlbumId && selectedAlbumId !== "unassigned"
      ? albums.find((album) => album.id_alb.toString() === selectedAlbumId)
      : null;

  // Fonction pour la navigation vers l'édition
  const handlePhotoClick = (photoId: number) => {
    router.push(`/creations/photos/edit/${photoId}`);
  };

  // Fonction pour construire l'URL de l'image
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder-photo.jpg";

    if (path.startsWith("http")) {
      return path;
    }

    if (path.startsWith("/photos/") || path.startsWith("/uploads/")) {
      return `${PORTFOLIO_BASE_URL}${path}`;
    }

    return path;
  };

  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">Photos</p>
          <div className="flex gap-2">
            <Link href="/creations/photos/albums">
              <Button variant="outline" className="cursor-pointer">
                Albums
              </Button>
            </Link>
            <Link href="/creations/photos/tags">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/creations/photos/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter une photo
              </Button>
            </Link>
          </div>
        </div>

        {/* Combobox pour filtrer par album */}
        <div className="flex justify-between items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={isPopoverOpen}
                className="w-[280px] justify-between"
              >
                {selectedAlbumId === "unassigned"
                  ? "Photos sans album"
                  : selectedAlbum
                    ? selectedAlbum.titre
                    : "Toutes les photos"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
              <Command>
                <CommandInput placeholder="Rechercher un album..." />
                <CommandEmpty>Aucun album trouvé.</CommandEmpty>
                <CommandList>
                  {albums.length > 0 && (
                    <CommandGroup>
                      {albums.map((album) => (
                        <CommandItem
                          key={album.id_alb}
                          onSelect={() => {
                            setSelectedAlbumId(
                              selectedAlbumId === album.id_alb.toString()
                                ? null // Si on sélectionne le même album, on désélectionne et affiche toutes les photos
                                : album.id_alb.toString()
                            );
                            setIsPopoverOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAlbumId === album.id_alb.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {album.titre}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <p className="text-sm text-muted-foreground">
            {filteredPhotos.length} photo
            {filteredPhotos.length !== 1 ? "s" : ""} trouvée
            {filteredPhotos.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Afficher les photos filtrées */}
        {filteredPhotos.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Aucune photo trouvée dans cette sélection
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {filteredPhotos.map((photo) => (
              <Card
                key={photo.id_pho}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePhotoClick(photo.id_pho)}
              >
                <div className="flex flex-col px-6 gap-4">
                  <div
                    className="relative w-full rounded-lg overflow-hidden"
                    style={{
                      paddingTop: `${
                        (1 / (photo.largeur / photo.hauteur || 16 / 9)) * 100
                      }%`,
                    }}
                  >
                    <Image
                      src={getImageUrl(photo.lien_low)}
                      alt={photo.alt || "Photo"}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-center"
                      priority
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/placeholder-photo.jpg";
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    {photo.photos_tags_link.length > 0 && (
                      <div className="flex gap-x-2 gap-y-1 items-center flex-wrap mt-2">
                        {photo.photos_tags_link.map((tagLink) => (
                          <Tag key={`tag-${tagLink.id_tags}`} variant="default">
                            {tagLink.photos_tags.titre}
                          </Tag>
                        ))}
                      </div>
                    )}
                    {/* 
                    {photo.photos_tags_recherche_link.length > 0 && (
                      <div className="flex gap-x-2 gap-y-1 items-center flex-wrap mt-1">
                        {photo.photos_tags_recherche_link.map((tagLink) => (
                          <Tag
                            key={`search-${tagLink.id_tags}`}
                            variant="outlined"
                          >
                            {tagLink.photos_tags_recherche.titre}
                          </Tag>
                        ))}
                      </div>
                    )} */}
                    {photo.photos_albums_link.length > 0 && (
                      <div className="flex flex-col gap-1 mt-1">
                        {photo.photos_albums_link.map((albumLink) => (
                          <div
                            key={`album-${albumLink.id_alb}`}
                            className="flex gap-1 items-center text-muted-foreground"
                          >
                            <Album size={18} />
                            <p className="text-sm">
                              {albumLink.photos_albums.titre}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1 items-center text-muted-foreground">
                      {photo.afficher ? (
                        <>
                          <Eye size={18} />
                          <p className="text-sm">Visible</p>
                        </>
                      ) : (
                        <>
                          <EyeOff size={18} />
                          <p className="text-sm">Non visible</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
