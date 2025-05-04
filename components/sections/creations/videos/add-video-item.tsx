"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { addVideoAction } from "@/actions/videos-actions";
import { useRouter } from "next/navigation";

// Importer l'éditeur de manière dynamique (côté client uniquement)
const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
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
import { TagCheckbox, type TagOption } from "@/components/tag-checkbox";
import { toast } from "sonner";

type AddVideoFormProps = {
  availableTags: TagOption[];
};

export function AddVideoItem({ availableTags }: AddVideoFormProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>("Description de la vidéo");
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleAddVideo = async (formData: FormData) => {
    try {
      // Ajouter le markdown à formData
      formData.set("description", markdown);

      // Ajouter les tags sélectionnés
      formData.delete("tags"); // Supprimer les valeurs précédentes s'il y en a
      selectedTags.forEach((tag) => {
        formData.append("tags", tag);
      });

      // Ajouter la date au format YYYY-MM-DD si elle existe
      if (date) {
        // Formatez la date au format YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}-${month}-${day}`;

        formData.set("date", formattedDate);
      } else {
        formData.delete("date");
      }

      // Appeler l'action serveur pour ajouter la vidéo
      await addVideoAction(formData);

      toast.success("Vidéo ajoutée avec succès !");

      // Rediriger vers la liste des vidéos
      router.push("/creations/videos");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("Erreur lors de l'ajout de la vidéo.");
    }
  };

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/videos">Vidéos</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ajouter une vidéo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <form className="flex flex-col gap-5" action={handleAddVideo}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              type="text"
              id="title"
              name="title"
              placeholder="Titre"
              required
            />
          </div>

          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description</Label>
            <div className="border rounded-md overflow-hidden">
              <EditorComp
                markdown={markdown}
                onChange={handleEditorChange}
                editorRef={editorRef}
              />
              {/* Champ caché pour stocker la valeur markdown */}
              <input type="hidden" name="description" value={markdown} />
            </div>
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="url">Lien de la vidéo</Label>
            <Input
              type="url"
              id="url"
              name="url"
              placeholder="Ex : https://www.youtube.com/watch?v=I_hdJUyyet0"
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="duree">Durée</Label>
            <Input
              type="text"
              id="duree"
              name="duree"
              placeholder="Ex : 00:02:18"
              required
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagCheckbox
              options={availableTags}
              selectedTags={selectedTags}
              onChange={handleTagsChange}
            />
            {/* Champs cachés pour les tags */}
            {selectedTags.map((tag) => (
              <input key={tag} type="hidden" name="tags" value={tag} />
            ))}
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? (
                    format(date, "d MMMM yyyy", { locale: fr })
                  ) : (
                    <span>Choisir une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
            {date && (
              <input
                type="hidden"
                name="date"
                value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`}
              />
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="isPublished">Afficher</Label>
            <Switch
              id="isPublished"
              name="isPublished"
              className="cursor-pointer"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="cursor-pointer">
              Ajouter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/creations/videos")}
              className="cursor-pointer"
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
