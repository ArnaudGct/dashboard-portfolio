"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  createPhotoTagAction,
  updatePhotoTagAction,
  deletePhotoTagAction,
  createPhotoSearchTagAction,
  updatePhotoSearchTagAction,
  deletePhotoSearchTagAction,
} from "@/actions/photos-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type TagData = {
  id: number;
  titre: string;
  important?: boolean;
  photoCount: number;
};

type TagsManagerProps = {
  initialTags: {
    normal: TagData[];
    search: TagData[];
  };
  fromPage?: string;
};

export function TagItem({
  initialTags,
  fromPage = "photos",
}: TagsManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"normal" | "search">("normal");
  const [normalTags, setNormalTags] = useState<TagData[]>(initialTags.normal);
  const [searchTags, setSearchTags] = useState<TagData[]>(initialTags.search);
  const [selectedTag, setSelectedTag] = useState<TagData | null>(null);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [editTagTitle, setEditTagTitle] = useState("");
  const [isImportant, setIsImportant] = useState(false);
  const [isEditImportant, setIsEditImportant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const backButtonHref =
    fromPage === "albums" ? "/creations/photos/albums" : "/creations/photos";

  // Déterminer le lien de retour et le texte à afficher
  const breadcrumbInfo = {
    photos: {
      href: "/creations/photos",
      text: "Photos",
    },
    albums: {
      href: "/creations/photos/albums",
      text: "Albums",
    },
  }[fromPage] || { href: "/creations/photos", text: "Photos" };

  // Obtenir les tags actuellement actifs selon l'onglet sélectionné
  const currentTags = activeTab === "normal" ? normalTags : searchTags;
  const setCurrentTags = activeTab === "normal" ? setNormalTags : setSearchTags;

  // Fonction pour ouvrir le dialogue d'édition
  const handleOpenTagDialog = (tag: TagData) => {
    setSelectedTag(tag);
    setEditTagTitle(tag.titre);
    setIsEditImportant(tag.important === true);
    setIsDialogOpen(true);
  };

  // Fonction pour mettre à jour un tag
  const handleUpdateTag = async () => {
    if (!selectedTag || !editTagTitle.trim()) return;

    try {
      // Mettre à jour avec le paramètre important
      if (activeTab === "normal") {
        await updatePhotoTagAction(
          selectedTag.id,
          editTagTitle,
          isEditImportant
        );
      } else {
        await updatePhotoSearchTagAction(
          selectedTag.id,
          editTagTitle,
          isEditImportant
        );
      }

      // Mettre à jour l'état local
      setCurrentTags(
        currentTags.map((tag) =>
          tag.id === selectedTag.id
            ? {
                ...tag,
                titre: editTagTitle,
                important: isEditImportant === true,
              }
            : tag
        )
      );

      const tagTypeLabel = activeTab === "normal" ? "tag" : "tag de recherche";
      toast.success(
        `${tagTypeLabel.charAt(0).toUpperCase() + tagTypeLabel.slice(1)} mis à jour avec succès`
      );
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      const tagTypeLabel = activeTab === "normal" ? "tag" : "tag de recherche";
      console.error(`Erreur lors de la mise à jour du ${tagTypeLabel}:`, error);
      toast.error(`Erreur lors de la mise à jour du ${tagTypeLabel}`);
    }
  };

  // Fonction pour supprimer un tag
  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      setIsDeleting(true);

      if (activeTab === "normal") {
        await deletePhotoTagAction(selectedTag.id);
      } else {
        await deletePhotoSearchTagAction(selectedTag.id);
      }

      // Mettre à jour l'état local
      setCurrentTags(currentTags.filter((tag) => tag.id !== selectedTag.id));

      const tagTypeLabel = activeTab === "normal" ? "tag" : "tag de recherche";
      toast.success(
        `${tagTypeLabel.charAt(0).toUpperCase() + tagTypeLabel.slice(1)} supprimé avec succès`
      );
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      const tagTypeLabel = activeTab === "normal" ? "tag" : "tag de recherche";
      console.error(`Erreur lors de la suppression du ${tagTypeLabel}:`, error);
      toast.error(`Erreur lors de la suppression du ${tagTypeLabel}`);
      setIsDeleting(false);
    }
  };

  // Fonction pour créer un nouveau tag
  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) return;

    try {
      let result;

      if (activeTab === "normal") {
        result = await createPhotoTagAction(newTagTitle, isImportant);
      } else {
        result = await createPhotoSearchTagAction(newTagTitle, isImportant);
      }

      if (result.success) {
        // Ajouter le nouveau tag à l'état local
        setCurrentTags([
          ...currentTags,
          {
            id: parseInt(result.id?.toString() || "0"),
            titre: newTagTitle,
            important: isImportant === true,
            photoCount: 0,
          },
        ]);

        setNewTagTitle("");
        setIsImportant(false);
        setIsCreating(false);
        const tagTypeLabel =
          activeTab === "normal" ? "tag" : "tag de recherche";
        toast.success(
          `${tagTypeLabel.charAt(0).toUpperCase() + tagTypeLabel.slice(1)} créé avec succès`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Ce tag existe déjà");
      }
    } catch (error) {
      const tagTypeLabel = activeTab === "normal" ? "tag" : "tag de recherche";
      console.error(`Erreur lors de la création du ${tagTypeLabel}:`, error);
      toast.error(`Erreur lors de la création du ${tagTypeLabel}`);
    }
  };

  // Fonction pour réinitialiser les états de dialogue lors du changement d'onglet
  const handleTabChange = (value: string) => {
    setActiveTab(value as "normal" | "search");
    setIsDialogOpen(false);
    setIsCreating(false);
    setDeleteDialogOpen(false);
    setSelectedTag(null);
  };

  const tagTypeLabel = activeTab === "normal" ? "tag" : "tag de recherche";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={breadcrumbInfo.href}>
                {breadcrumbInfo.text}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Tags</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer">
              <PlusIcon className="h-4 w-4" />
              Nouveau {tagTypeLabel}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau {tagTypeLabel}</DialogTitle>
              <DialogDescription>
                Entrez le nom du nouveau {tagTypeLabel} à créer et définissez
                s'il est important.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-tag-title">Titre</Label>
                <Input
                  id="new-tag-title"
                  value={newTagTitle}
                  onChange={(e) => setNewTagTitle(e.target.value)}
                  placeholder={`Titre du ${tagTypeLabel}`}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-tag-important"
                  checked={isImportant}
                  onCheckedChange={setIsImportant}
                  className="cursor-pointer"
                />
                <Label htmlFor="new-tag-important">Important</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewTagTitle("");
                  setIsImportant(false);
                }}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateTag}
                className="cursor-pointer"
                disabled={!newTagTitle.trim()}
              >
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs pour la navigation entre types de tags */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 w-[400px] mb-6">
          <TabsTrigger value="normal" className="cursor-pointer">
            Tags visibles
          </TabsTrigger>
          <TabsTrigger value="search" className="cursor-pointer">
            Tags de recherche
          </TabsTrigger>
        </TabsList>

        <TabsContent value="normal" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {normalTags.length === 0 ? (
              <p className="col-span-full text-center py-8 text-muted-foreground">
                Aucun tag visible trouvé
              </p>
            ) : (
              normalTags.map((tag) => (
                <Card
                  key={tag.id}
                  className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                    tag.important ? "border-primary/50" : ""
                  }`}
                  onClick={() => handleOpenTagDialog(tag)}
                >
                  <CardHeader className="px-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{tag.titre}</CardTitle>
                      {tag.important && (
                        <Bookmark className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="ml-2">
                        {tag.photoCount} photo{tag.photoCount > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchTags.length === 0 ? (
              <p className="col-span-full text-center py-8 text-muted-foreground">
                Aucun tag de recherche trouvé
              </p>
            ) : (
              searchTags.map((tag) => (
                <Card
                  key={tag.id}
                  className={`shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
                    tag.important ? "border-primary/50" : ""
                  }`}
                  onClick={() => handleOpenTagDialog(tag)}
                >
                  <CardHeader className="px-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{tag.titre}</CardTitle>
                      {tag.important && (
                        <Bookmark className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="ml-2">
                        {tag.photoCount} photo{tag.photoCount > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog pour modifier un tag */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le {tagTypeLabel}</DialogTitle>
            <DialogDescription>
              Modifiez le titre et le statut d'importance du {tagTypeLabel} "
              {selectedTag?.titre}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-tag-title">Titre</Label>
              <Input
                id="edit-tag-title"
                value={editTagTitle}
                onChange={(e) => setEditTagTitle(e.target.value)}
                placeholder={`Titre du ${tagTypeLabel}`}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-tag-important"
                checked={isEditImportant}
                onCheckedChange={setIsEditImportant}
                className="cursor-pointer"
              />
              <Label htmlFor="edit-tag-important">Important</Label>
            </div>
          </div>
          <DialogFooter className="flex justify-between items-center">
            <div className="flex gap-2 justify-between items-center w-full">
              <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={(selectedTag?.photoCount ?? 0) > 0}
                    title={
                      (selectedTag?.photoCount ?? 0) > 0
                        ? "Ce tag est utilisé par des photos"
                        : ""
                    }
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Supprimer le {tagTypeLabel}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer le {tagTypeLabel} "
                      {selectedTag?.titre}" ?
                      {(selectedTag?.photoCount ?? 0) > 0 && (
                        <div className="mt-2 text-destructive font-medium">
                          Attention : Ce tag est utilisé par{" "}
                          {selectedTag?.photoCount} photo
                          {(selectedTag?.photoCount ?? 0) > 1 ? "s" : ""}.
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                      onClick={handleDeleteTag}
                      disabled={
                        isDeleting || (selectedTag?.photoCount ?? 0) > 0
                      }
                    >
                      {isDeleting ? "Suppression..." : "Supprimer"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="cursor-pointer"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleUpdateTag}
                  className="cursor-pointer"
                  disabled={
                    !editTagTitle.trim() ||
                    (editTagTitle === selectedTag?.titre &&
                      isEditImportant === selectedTag?.important)
                  }
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
