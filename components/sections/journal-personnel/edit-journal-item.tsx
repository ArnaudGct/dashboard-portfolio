"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Youtube, X, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import {
  updateJournalEntryAction,
  deleteJournalEntryAction,
} from "@/actions/journal-actions";
import Image from "next/image";
import { extractYoutubeId } from "@/lib/utils";
import { LiteYoutubeEmbed } from "react-lite-yt-embed";

// Importer l'éditeur de manière dynamique
const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
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

interface EditJournalItemProps {
  initialData: {
    id_exp: number;
    titre: string;
    description: string;
    date?: Date;
    url_img: string | null;
    position_img: string;
    credit_nom?: string | null;
    credit_url?: string | null;
    afficher: boolean;
  };
}

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

export function EditJournalItem({ initialData }: EditJournalItemProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [markdown, setMarkdown] = useState<string>(
    initialData.description || ""
  );
  const editorRef = useRef<MDXEditorMethods | null>(null);

  // Traiter la date
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData.date ? new Date(initialData.date) : new Date()
  );

  // Fonction helper pour déterminer si une URL est une URL Cloudinary complète
  const isCloudinaryUrl = (url: string | null): boolean => {
    return url?.startsWith("https://res.cloudinary.com/") || false;
  };

  // Fonction helper pour formater correctement l'URL d'image
  const formatImageUrl = (url: string | null): string | null => {
    if (!url) return null;

    // Si c'est déjà une URL Cloudinary complète, la retourner telle quelle
    if (isCloudinaryUrl(url)) {
      return url;
    }

    // Sinon, ajouter le PORTFOLIO_BASE_URL pour les anciennes images
    return `${PORTFOLIO_BASE_URL}${url}`;
  };

  // Déterminer le type de média
  const hasImage =
    !!initialData.url_img && !initialData.url_img.includes("youtube");
  const hasYoutube =
    !!initialData.url_img && initialData.url_img.includes("youtube");
  const initialMediaType = hasYoutube ? "youtube" : hasImage ? "image" : "none";

  const [mediaType, setMediaType] = useState<"image" | "youtube" | "none">(
    initialMediaType
  );
  const [previewImage, setPreviewImage] = useState<string | null>(
    hasImage ? formatImageUrl(initialData.url_img) : null
  );
  const [youtubeUrl, setYoutubeUrl] = useState<string>(
    hasYoutube ? initialData.url_img || "" : ""
  );
  const [imagePosition, setImagePosition] = useState<string>(
    initialData.position_img || "centre"
  );
  const [isPublished, setIsPublished] = useState<boolean>(initialData.afficher);

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Ajout de fonctions pour gérer la suppression des médias
  const clearImage = () => {
    setPreviewImage(null);
    // Réinitialiser l'input file
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const clearYoutubeUrl = () => {
    setYoutubeUrl("");
  };

  // Modifions la fonction handleMediaTypeChange pour conserver les données
  const handleMediaTypeChange = (value: string) => {
    const newType = value as "image" | "youtube" | "none";
    setMediaType(newType);
  };

  // Fonction pour gérer la mise à jour
  const handleUpdateExperience = async (formData: FormData) => {
    try {
      setIsUpdating(true);

      // Ajouter l'ID de l'entrée
      formData.set("id", initialData.id_exp.toString());

      // Ajouter la description markdown
      formData.set("description", markdown);

      // Gestion de la date
      if (selectedDate) {
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();

        if (year > 0 && month > 0 && day > 0) {
          const formattedMonth = month.toString().padStart(2, "0");
          const formattedDay = day.toString().padStart(2, "0");
          const formattedDate = `${year}-${formattedMonth}-${formattedDay}`;
          formData.set("date", formattedDate);
          console.log("Date formatée envoyée:", formattedDate);
        } else {
          formData.delete("date");
        }
      }

      // Gérer les médias en fonction du type sélectionné
      if (mediaType === "youtube" && youtubeUrl) {
        formData.delete("image");
        formData.set("url_img", youtubeUrl);
        formData.set("media_type", "youtube");
      } else if (mediaType === "image") {
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 0) {
          // Nouvelle image uploadée
          formData.set("url_img", "");
          formData.set("media_type", "image");
        } else if (
          previewImage &&
          (previewImage.includes(PORTFOLIO_BASE_URL) ||
            isCloudinaryUrl(previewImage))
        ) {
          // Conserver l'image existante
          formData.delete("image");
          formData.set("url_img", initialData.url_img || "");
          formData.set("media_type", "image");
        } else {
          // Pas d'image
          formData.delete("image");
          formData.set("url_img", "");
          formData.set("media_type", "none");
        }
      } else {
        // Aucun média
        formData.delete("image");
        formData.set("url_img", "");
        formData.set("media_type", "none");
      }

      // Ajouter les paramètres de position
      formData.set("position_img", imagePosition);

      // État de publication
      formData.set("afficher", isPublished ? "on" : "off");

      // Vérifier si on a au moins un titre et une description
      const titre = formData.get("titre")?.toString();
      if (!titre || !markdown.trim()) {
        toast.error("Le titre et la description sont obligatoires");
        return;
      }

      const result = await updateJournalEntryAction(formData);

      if (result && result.success) {
        toast.success("Entrée de journal mise à jour avec succès");
        router.push("/journal-personnel");
        router.refresh();
      } else {
        toast.error(
          "Erreur lors de la mise à jour: " +
            (result?.error || "Erreur inconnue")
        );
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour de l'entrée");
    } finally {
      setIsUpdating(false);
    }
  };

  // Fonction pour gérer la suppression
  const handleDeleteExperience = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteJournalEntryAction(initialData.id_exp);

      if (result && result.success) {
        toast.success("Entrée de journal supprimée avec succès");
        router.push("/journal-personnel");
        router.refresh();
      } else {
        toast.error("Erreur lors de la suppression");
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression de l'entrée");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-center items-start gap-4 sm:flex-row sm:justify-between sm:items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/journal-personnel">
                Journal Personnel
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Modifier une expérience</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action ne peut pas être annulée. Cela supprimera
                définitivement cette entrée de journal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteExperience}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer définitivement"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form className="flex flex-col gap-5" action={handleUpdateExperience}>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="titre">Titre</Label>
          <Input
            type="text"
            id="titre"
            name="titre"
            defaultValue={initialData.titre}
            placeholder="Titre de l'expérience"
            required
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal cursor-pointer",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "d MMMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="description">Contenu</Label>
          <div className="border rounded-md overflow-hidden">
            <EditorComp
              markdown={markdown}
              onChange={handleEditorChange}
              editorRef={editorRef}
            />
            <input type="hidden" name="description" value={markdown} />
          </div>
        </div>

        <div className="grid w-full gap-1.5">
          <Label>Média</Label>
          <Tabs
            defaultValue={mediaType}
            value={mediaType}
            onValueChange={handleMediaTypeChange}
            className="w-full"
          >
            <TabsList>
              <TabsTrigger value="none" className="cursor-pointer">
                Aucun
              </TabsTrigger>
              <TabsTrigger
                value="image"
                className={cn(
                  "cursor-pointer",
                  previewImage ? "font-bold" : ""
                )}
              >
                Image
              </TabsTrigger>
              <TabsTrigger
                value="youtube"
                className={cn("cursor-pointer", youtubeUrl ? "font-bold" : "")}
              >
                YouTube
              </TabsTrigger>
            </TabsList>

            <TabsContent value="image">
              <div className="grid w-full items-center gap-2">
                <div className="flex gap-2">
                  <Input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    className="cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        setYoutubeUrl("");
                      }
                      handleImageChange(e);
                    }}
                  />
                  {previewImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="cursor-pointer"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {previewImage && (
                  <div className="flex flex-col items-start lg:flex-row gap-6 lg:items-center">
                    <div className="relative">
                      <Image
                        src={previewImage}
                        alt="Aperçu"
                        width={400}
                        height={300}
                        className="rounded-md object-cover"
                        unoptimized={
                          previewImage.startsWith("data:") ||
                          isCloudinaryUrl(previewImage)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                      <div className="flex flex-col gap-1.5">
                        <Label>Position dans l'image</Label>
                        <Select
                          value={imagePosition}
                          onValueChange={setImagePosition}
                          name="position_img"
                        >
                          <SelectTrigger className="cursor-pointer">
                            <SelectValue placeholder="Choisir une position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="centre">Centrée</SelectItem>
                            <SelectItem value="gauche">
                              Alignée à gauche
                            </SelectItem>
                            <SelectItem value="droite">
                              Alignée à droite
                            </SelectItem>
                            <SelectItem value="none">
                              Sans alignement
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="credit_nom">Crédit</Label>
                        <Input
                          type="text"
                          id="credit_nom"
                          name="credit_nom"
                          defaultValue={initialData.credit_nom || ""}
                          placeholder="Nom du crédit"
                        />
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="credit_url">URL du crédit</Label>
                        <Input
                          type="url"
                          id="credit_url"
                          name="credit_url"
                          defaultValue={initialData.credit_url || ""}
                          placeholder="URL du crédit"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="youtube">
              <div className="grid w-full items-center gap-2">
                <div className="flex gap-2">
                  <Input
                    type="url"
                    id="youtube-url"
                    name="youtube_url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => {
                      if (e.target.value && e.target.value !== youtubeUrl) {
                        clearImage();
                      }
                      setYoutubeUrl(e.target.value);
                    }}
                  />
                  {youtubeUrl && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="cursor-pointer"
                      onClick={clearYoutubeUrl}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {youtubeUrl && (
                  <div className="relative w-full max-w-[400px] overflow-hidden rounded-md aspect-video">
                    <LiteYoutubeEmbed id={extractYoutubeId(youtubeUrl)} />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="none">
              <p className="text-sm text-muted-foreground">
                Aucun média ne sera associé à cette entrée.
              </p>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="afficher"
            name="afficher"
            checked={isPublished}
            onCheckedChange={setIsPublished}
            className="cursor-pointer"
          />
          <Label htmlFor="afficher">Afficher</Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={isUpdating}
          >
            {isUpdating ? "Mise à jour en cours..." : "Mettre à jour"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/journal-personnel")}
            disabled={isUpdating}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
