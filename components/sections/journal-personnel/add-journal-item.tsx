"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Youtube, X } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { addJournalEntryAction } from "@/actions/journal-actions";
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

export function AddJournalItem() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [markdown, setMarkdown] = useState<string>("");
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date()
  );
  const [mediaType, setMediaType] = useState<"image" | "youtube" | "none">(
    "none"
  );
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState<string>("");
  const [imagePosition, setImagePosition] = useState<string>("centre");

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

    // On change simplement le type sans effacer les données
    // Cela permettra de les retrouver si l'utilisateur revient sur cet onglet
    setMediaType(newType);

    // Pas besoin de clearImage ou clearYoutubeUrl ici
  };

  // Remplaçons la fonction handleAddExperience pour gérer correctement les médias
  const handleAddExperience = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      // Ajouter la description markdown
      formData.set("description", markdown);

      if (selectedDate) {
        // Format MySQL DATE (YYYY-MM-DD)
        // S'assurer que la date est valide (pas de jour ou mois à zéro)
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth() + 1; // getMonth() retourne 0-11
        const day = selectedDate.getDate();

        // Vérifier que tous les éléments sont valides
        if (year > 0 && month > 0 && day > 0) {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          formData.set("date", formattedDate);
        } else {
          // Date invalide, ne pas l'inclure
          formData.delete("date");
        }
      }

      // Gérer les médias en fonction du type sélectionné
      if (mediaType === "youtube" && youtubeUrl) {
        // Si on a choisi YouTube et qu'il y a une URL
        formData.delete("image"); // Supprimer l'image du formData
        formData.set("url_img", youtubeUrl);
        formData.set("media_type", "youtube");
        // Vérification ajoutée
        console.log("URL YouTube envoyée:", youtubeUrl);
      } else if (mediaType === "image") {
        // Vérifier explicitement si un fichier est présent
        const imageFile = formData.get("image") as File;
        if (imageFile && imageFile.size > 0) {
          console.log("Image détectée et sera envoyée:", imageFile.name);
          formData.set("url_img", ""); // Effacer toute URL YouTube
          formData.set("media_type", "image");
        } else {
          console.warn(
            "Mode image sélectionné mais aucun fichier n'est présent"
          );
          formData.delete("image");
          formData.set("url_img", "");
          formData.set("media_type", "none");
        }
      } else {
        // Si aucun média n'est activé ou si le média sélectionné n'a pas de contenu
        formData.delete("image");
        formData.set("url_img", "");
        formData.set("media_type", "none");
      }

      // Ajouter les paramètres de position
      formData.set("position_img", imagePosition);

      // Vérifier si on a au moins un titre et une description
      const titre = formData.get("titre")?.toString();
      if (!titre || !markdown.trim()) {
        toast.error("Le titre et la description sont obligatoires");
        return;
      }

      const result = await addJournalEntryAction(formData);

      if (result.success) {
        toast.success("Entrée de journal ajoutée avec succès");
        router.push("/journal-personnel");
        router.refresh();
      } else {
        toast.error(
          "Erreur lors de l'ajout: " + (result.error || "Erreur inconnue")
        );
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("Erreur lors de l'ajout de l'entrée");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/journal-personnel">
                Journal Personnel
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ajouter une expérience</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <form className="flex flex-col gap-5" action={handleAddExperience}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="titre">Titre</Label>
            <Input
              type="text"
              id="titre"
              name="titre"
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
              defaultValue="none"
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
                  className={cn(
                    "cursor-pointer",
                    youtubeUrl ? "font-bold" : ""
                  )}
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
                        // Si on ajoute une image, on efface toute URL YouTube
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
                    <div className="flex gap-6 items-center">
                      <div className="relative">
                        <Image
                          src={previewImage}
                          alt="Aperçu"
                          width={400}
                          height={300}
                          className="rounded-md object-cover"
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
                            placeholder="Nom du crédit"
                          />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="credit_nom">URL du crédit</Label>
                          <Input
                            type="url"
                            id="credit_url"
                            name="credit_url"
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
                        // Si on ajoute une URL YouTube, on efface toute image
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
              defaultChecked
              className="cursor-pointer"
            />
            <Label htmlFor="afficher">Afficher</Label>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              className="cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ajout en cours..." : "Ajouter"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => router.push("/journal-personnel")}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
