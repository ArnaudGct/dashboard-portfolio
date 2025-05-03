"use client";

import { useState } from "react";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  updateTagAction,
  deleteTagAction,
  createTagAction,
} from "@/actions/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Tag = {
  id: number;
  titre: string;
  videoCount: number;
};

type TagsManagerProps = {
  initialTags: Tag[];
};

export function TagItem({ initialTags }: TagsManagerProps) {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [newTagTitle, setNewTagTitle] = useState("");
  const [editTagTitle, setEditTagTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fonction pour ouvrir le dialogue d'édition
  const handleOpenTagDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setEditTagTitle(tag.titre);
    setIsDialogOpen(true);
  };

  // Fonction pour mettre à jour un tag
  const handleUpdateTag = async () => {
    if (!selectedTag || !editTagTitle.trim()) return;

    try {
      await updateTagAction(selectedTag.id, editTagTitle);

      // Mettre à jour l'état local
      setTags(
        tags.map((tag) =>
          tag.id === selectedTag.id ? { ...tag, titre: editTagTitle } : tag
        )
      );

      toast.success("Tag mis à jour avec succès");
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du tag:", error);
      toast.error("Erreur lors de la mise à jour du tag");
    }
  };

  // Fonction pour supprimer un tag
  const handleDeleteTag = async () => {
    if (!selectedTag) return;

    try {
      setIsDeleting(true);
      await deleteTagAction(selectedTag.id);

      // Mettre à jour l'état local
      setTags(tags.filter((tag) => tag.id !== selectedTag.id));

      toast.success("Tag supprimé avec succès");
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de la suppression du tag:", error);
      toast.error("Erreur lors de la suppression du tag");
      setIsDeleting(false);
    }
  };

  // Fonction pour créer un nouveau tag
  const handleCreateTag = async () => {
    if (!newTagTitle.trim()) return;

    try {
      const result = await createTagAction(newTagTitle);

      if (result.success) {
        // Ajouter le nouveau tag à l'état local
        setTags([
          ...tags,
          {
            id: result.tag.id_tags,
            titre: result.tag.titre,
            videoCount: 0,
          },
        ]);

        setNewTagTitle("");
        setIsCreating(false);
        toast.success("Tag créé avec succès");
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur lors de la création du tag:", error);
      toast.error("Erreur lors de la création du tag");
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/videos">Vidéos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Gestion des tags</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer">
              <PlusIcon className="h-4 w-4" />
              Nouveau tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau tag</DialogTitle>
              <DialogDescription>
                Entrez le nom du nouveau tag à créer.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-tag-title">Titre</Label>
                <Input
                  id="new-tag-title"
                  value={newTagTitle}
                  onChange={(e) => setNewTagTitle(e.target.value)}
                  placeholder="Titre du tag"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="cursor-pointer"
              >
                Annuler
              </Button>
              <Button onClick={handleCreateTag} className="cursor-pointer">
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tags.map((tag) => (
          <Card
            key={tag.id}
            className="shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleOpenTagDialog(tag)}
          >
            <CardHeader className="px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{tag.titre}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="ml-2">
                  {tag.videoCount} vidéo{tag.videoCount > 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Dialog pour modifier un tag */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le tag</DialogTitle>
            <DialogDescription>
              Modifiez le titre du tag "{selectedTag?.titre}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-tag-title">Titre</Label>
              <Input
                id="edit-tag-title"
                value={editTagTitle}
                onChange={(e) => setEditTagTitle(e.target.value)}
                placeholder="Titre du tag"
              />
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
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer le tag</AlertDialogTitle>
                    <AlertDialogDescription>
                      Êtes-vous sûr de vouloir supprimer le tag "
                      {selectedTag?.titre}" ?
                      {(selectedTag?.videoCount ?? 0) > 0 && (
                        <div className="mt-2 text-destructive font-medium">
                          Attention : Ce tag est utilisé par{" "}
                          {selectedTag?.videoCount} vidéo
                          {(selectedTag?.videoCount ?? 0) > 1 ? "s" : ""}.
                        </div>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                      onClick={handleDeleteTag}
                      disabled={isDeleting}
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
                <Button onClick={handleUpdateTag} className="cursor-pointer">
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
