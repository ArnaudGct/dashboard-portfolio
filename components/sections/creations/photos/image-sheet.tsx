"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { CheckIcon, ImageIcon, SearchIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Tag } from "@/components/tag";

export type ImageTag = {
  id: number;
  titre: string;
  important?: boolean;
};

export type ImageOption = {
  id: number;
  url: string;
  title: string | null;
  alt: string | null;
  tags?: ImageTag[]; // Tags normaux
  searchTags?: ImageTag[]; // Tags de recherche
};

interface ImageSheetProps {
  title: string;
  description?: string;
  options: ImageOption[];
  selectedImages: number[];
  onChange: (selectedImages: number[]) => void;
  triggerLabel: string;
  searchPlaceholder?: string;
  baseUrl?: string;
}

export function ImageSheet({
  title,
  description,
  options,
  selectedImages,
  onChange,
  triggerLabel,
  searchPlaceholder = "Rechercher une image...",
  baseUrl = "",
}: ImageSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [localSelectedImages, setLocalSelectedImages] = useState<number[]>([]);

  // Filtrer les options en fonction de la recherche (recherche améliorée)
  const filteredOptions = options.filter((option) => {
    const searchLower = searchQuery.toLowerCase().trim();
    if (!searchLower) return true;

    // Recherche dans le titre et l'alt
    const titleMatch = (option.title || "").toLowerCase().includes(searchLower);
    const altMatch = (option.alt || "").toLowerCase().includes(searchLower);

    // Recherche dans les tags normaux
    const normalTagMatch = option.tags?.some((tag) =>
      tag.titre.toLowerCase().includes(searchLower)
    );

    // Recherche dans les tags de recherche
    const searchTagMatch = option.searchTags?.some((tag) =>
      tag.titre.toLowerCase().includes(searchLower)
    );

    return titleMatch || altMatch || normalTagMatch || searchTagMatch;
  });

  // Synchroniser les images sélectionnées localement avec celles passées en props
  useEffect(() => {
    setLocalSelectedImages([...selectedImages]);
  }, [selectedImages, isOpen]);

  // Fonction de basculement (toggle) pour une image
  const toggleImage = (imageId: number) => {
    setLocalSelectedImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      } else {
        return [...prev, imageId];
      }
    });
  };

  // Fonction pour sauvegarder les changements
  const handleSave = () => {
    onChange(localSelectedImages);
    setIsOpen(false);
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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start cursor-pointer"
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          {triggerLabel}
          {selectedImages.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedImages.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md lg:max-w-xl">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {/* Contenu avec défilement */}
        <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
          {/* Selected images preview */}
          {localSelectedImages.length > 0 && (
            <div className="space-y-2">
              <Label>Images sélectionnées ({localSelectedImages.length})</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {localSelectedImages.map((imageId) => {
                  const image = options.find((o) => o.id === imageId);
                  if (!image) return null;

                  return (
                    <div
                      key={imageId}
                      className="group relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer"
                      onClick={() => toggleImage(imageId)}
                    >
                      <Image
                        src={getImageUrl(image.url)}
                        alt={image.alt || image.title || "Image sélectionnée"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 33vw, 25vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-photo.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CheckIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* List of images - maintenant avec hauteur adaptative */}
          <ScrollArea className="flex-1 rounded-md border p-2 min-h-[300px]">
            {filteredOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Aucune image trouvée</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredOptions.map((image) => {
                  const isSelected = localSelectedImages.includes(image.id);

                  return (
                    <div key={image.id} className="flex flex-col gap-2">
                      <div
                        className={cn(
                          "group relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer",
                          isSelected ? "ring-2 ring-primary" : ""
                        )}
                        onClick={() => toggleImage(image.id)}
                      >
                        <Image
                          src={getImageUrl(image.url)}
                          alt={image.alt || image.title || "Image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder-photo.jpg";
                          }}
                        />
                        <div
                          className={cn(
                            "absolute inset-0 transition-colors",
                            isSelected
                              ? "bg-black/30"
                              : "bg-black/0 group-hover:bg-black/20"
                          )}
                        />

                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                            <CheckIcon className="h-4 w-4 text-white" />
                          </div>
                        )}

                        {image.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-black/0 p-2">
                            <p className="text-xs text-white truncate">
                              {image.title}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Afficher les tags pour une meilleure UX */}
                      <div className="flex flex-wrap gap-1">
                        {image.tags &&
                          image.tags.length > 0 &&
                          image.tags.slice(0, 2).map((tag) => (
                            <Tag
                              key={`tag-${image.id}-${tag.id}`}
                              variant="default"
                              className="text-[10px] py-0 h-5"
                            >
                              {tag.titre}
                            </Tag>
                          ))}

                        {image.searchTags &&
                          image.searchTags.length > 0 &&
                          image.searchTags.slice(0, 1).map((tag) => (
                            <Tag
                              key={`search-${image.id}-${tag.id}`}
                              variant="outlined"
                              className="text-[10px] py-0 h-5"
                            >
                              {tag.titre}
                            </Tag>
                          ))}

                        {/* Afficher un +X si plus de tags */}
                        {(image.tags?.length || 0) +
                          (image.searchTags?.length || 0) >
                          3 && (
                          <Tag
                            variant="secondary"
                            className="text-[10px] py-0 h-5"
                          >
                            +
                            {(image.tags?.length || 0) +
                              (image.searchTags?.length || 0) -
                              3}
                          </Tag>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Pied de page fixe */}
        <SheetFooter className="mt-6 border-t pt-4 sticky bottom-0 bg-background">
          <div className="flex justify-between w-full items-center">
            <span className="text-sm text-muted-foreground">
              {localSelectedImages.length} image(s) sélectionnée(s)
            </span>
            <SheetClose asChild>
              <Button onClick={handleSave}>Confirmer la sélection</Button>
            </SheetClose>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
