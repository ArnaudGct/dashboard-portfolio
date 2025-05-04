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
import { Badge } from "@/components/ui/badge";
import { CheckIcon, PlusIcon, SearchIcon, TagIcon, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch"; // Ajout du Switch
import { toast } from "sonner";

export type TagOption = {
  id: string;
  label: string;
  important?: boolean; // Ajout de la propriété important
};

interface TagSheetProps {
  title: string;
  description?: string;
  options: TagOption[];
  selectedTags: string[];
  onChange: (selectedTags: string[]) => void;
  canAddNew?: boolean;
  onAddNew?: (
    tagName: string,
    important?: boolean
  ) => Promise<TagOption | null>; // Mise à jour pour accepter le paramètre important
  addNewLabel?: string;
  searchPlaceholder?: string;
  triggerLabel: string;
  type?: "tag" | "album" | "searchTag";
}

export function TagSheet({
  title,
  description,
  options,
  selectedTags,
  onChange,
  canAddNew = true,
  onAddNew,
  addNewLabel = "Ajouter un nouveau tag",
  searchPlaceholder = "Rechercher un tag...",
  triggerLabel,
  type = "tag",
}: TagSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false); // État pour le Switch important

  // Déterminer les termes à utiliser selon le type
  const typeTerms = {
    tag: { singular: "tag", plural: "tags" },
    searchTag: { singular: "tag de recherche", plural: "tags de recherche" },
    album: { singular: "album", plural: "albums" },
  }[type];

  // Filtrer les options en fonction de la recherche
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Synchroniser les tags sélectionnés localement avec ceux passés en props
  useEffect(() => {
    setLocalSelectedTags([...selectedTags]);
  }, [selectedTags, isOpen]);

  // Fonction de basculement (toggle) pour un tag/album
  const toggleTag = (tagId: string) => {
    setLocalSelectedTags((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  // Fonction pour sauvegarder les changements
  const handleSave = () => {
    onChange(localSelectedTags);
    setIsOpen(false);
  };

  // Réinitialiser les états du formulaire d'ajout quand on ouvre/ferme le Sheet
  useEffect(() => {
    if (isOpen) {
      // Ne pas réinitialiser lors de l'ouverture pour garder les valeurs en cours
    } else {
      // Réinitialiser à la fermeture
      setNewTagName("");
      setIsImportant(false);
    }
  }, [isOpen]);

  // Fonction pour ajouter un nouveau tag/album
  const handleAddNewTag = async () => {
    if (!newTagName.trim() || !onAddNew) return;

    try {
      setIsAddingTag(true);

      // Log pour débugger
      console.log(
        "Ajout d'un nouveau tag:",
        newTagName,
        "important:",
        isImportant
      );

      // Passer le paramètre important explicitement comme booléen
      const result = await onAddNew(newTagName.trim(), isImportant === true);

      if (result) {
        // Ajouter aux tags sélectionnés
        setLocalSelectedTags((prev) => [...prev, result.id]);
        setNewTagName("");
        setIsImportant(false); // Réinitialiser le switch important

        // Message de succès avec information sur l'importance
        toast.success(
          `${typeTerms.singular.charAt(0).toUpperCase() + typeTerms.singular.slice(1)} "${result.label}"${isImportant ? " (important)" : ""} ajouté avec succès !`
        );
      } else {
        // L'élément existe probablement déjà
        const existingTag = options.find(
          (tag) => tag.label.toLowerCase() === newTagName.trim().toLowerCase()
        );

        if (existingTag) {
          if (!localSelectedTags.includes(existingTag.id)) {
            setLocalSelectedTags((prev) => [...prev, existingTag.id]);
            toast.info(
              `${typeTerms.singular.charAt(0).toUpperCase() + typeTerms.singular.slice(1)} "${existingTag.label}" existait déjà et a été sélectionné`
            );
          } else {
            toast.info(
              `${typeTerms.singular.charAt(0).toUpperCase() + typeTerms.singular.slice(1)} "${existingTag.label}" est déjà sélectionné`
            );
          }
          setNewTagName("");
          setIsImportant(false); // Réinitialiser le switch important
        } else {
          toast.error(`Impossible d'ajouter ${typeTerms.singular}`);
        }
      }
    } catch (error) {
      console.error(`Erreur lors de l'ajout ${typeTerms.singular}:`, error);
      toast.error(`Erreur lors de l'ajout ${typeTerms.singular}`);
    } finally {
      setIsAddingTag(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <TagIcon className="mr-2 h-4 w-4" />
          {triggerLabel}
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedTags.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>

        {/* Contenu avec défilement */}
        <div className="flex-1 flex flex-col gap-4 py-4 overflow-hidden">
          {/* Selected tags/albums */}
          {localSelectedTags.length > 0 && (
            <div className="space-y-2">
              <Label>
                {typeTerms.plural.charAt(0).toUpperCase() +
                  typeTerms.plural.slice(1)}{" "}
                sélectionnés ({localSelectedTags.length})
              </Label>
              <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-1">
                {localSelectedTags.map((tagId) => {
                  const tag = options.find((o) => o.id === tagId);
                  return (
                    <Badge
                      key={tagId}
                      className="flex items-center gap-1 pl-2 pr-1 cursor-pointer hover:bg-destructive/10 transition-colors group"
                      variant={tag?.important ? "default" : "secondary"}
                      onClick={() => {
                        // Supprimer l'élément lorsque le badge entier est cliqué
                        const newTags = localSelectedTags.filter(
                          (id) => id !== tagId
                        );
                        setLocalSelectedTags(newTags);
                        toast.success(
                          `${typeTerms.singular.charAt(0).toUpperCase() + typeTerms.singular.slice(1)} "${tag?.label || tagId}" supprimé`
                        );
                      }}
                    >
                      <span
                        className="max-w-[150px] truncate"
                        title={tag?.label || tagId}
                      >
                        {tag?.label || tagId}
                      </span>
                      <X
                        className="h-3 w-3 ml-1 opacity-50 group-hover:opacity-100"
                        onClick={(e) => {
                          // Empêcher la propagation pour éviter que le clic ne soit capturé deux fois
                          e.stopPropagation();
                          // Le comportement de suppression est déjà géré par le badge parent
                        }}
                      />
                    </Badge>
                  );
                })}
              </div>
              <Separator className="my-2" />
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

          {/* List of options */}
          <ScrollArea className="flex-1 rounded-md border p-2 min-h-[200px]">
            {filteredOptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Aucun {typeTerms.singular} trouvé</p>
                {canAddNew && searchQuery && (
                  <Button
                    variant="ghost"
                    className="mt-2"
                    onClick={() => {
                      setNewTagName(searchQuery);
                      setSearchQuery("");
                    }}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Créer "{searchQuery}"
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => (
                  <div
                    key={option.id}
                    className={cn(
                      "relative flex items-center rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer",
                      localSelectedTags.includes(option.id) && "bg-muted"
                    )}
                    onClick={() => toggleTag(option.id)}
                  >
                    <span
                      className={cn(
                        "mr-2 flex h-5 w-5 items-center justify-center rounded-full border",
                        localSelectedTags.includes(option.id)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground"
                      )}
                    >
                      {localSelectedTags.includes(option.id) && (
                        <CheckIcon className="h-3 w-3" />
                      )}
                    </span>
                    <div className="flex-1 flex items-center justify-between">
                      <span>{option.label}</span>
                      {option.important && (
                        <Badge variant="default" className="text-xs ml-2">
                          Important
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add new tag/album section */}
          {canAddNew && (
            <div className="space-y-3">
              <Separator className="my-1" />
              <div className="space-y-2">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder={
                      addNewLabel || `Ajouter un nouveau ${typeTerms.singular}`
                    }
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNewTag();
                      }
                    }}
                  />
                  <Button
                    onClick={handleAddNewTag}
                    disabled={!newTagName.trim() || isAddingTag}
                    size="sm"
                    variant="outline"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>

                {/* Switch pour définir si le tag est important */}
                {type === "tag" && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="important"
                      checked={isImportant}
                      onCheckedChange={setIsImportant}
                    />
                    <Label htmlFor="important" className="text-sm">
                      Tag important
                    </Label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Pied de page fixe */}
        <SheetFooter className="mt-6 border-t pt-4 sticky bottom-0 bg-background">
          <div className="flex justify-between w-full items-center">
            <span className="text-sm text-muted-foreground">
              {localSelectedTags.length}{" "}
              {localSelectedTags.length > 1
                ? typeTerms.plural
                : typeTerms.singular}{" "}
              sélectionné{localSelectedTags.length > 1 ? "s" : ""}
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
