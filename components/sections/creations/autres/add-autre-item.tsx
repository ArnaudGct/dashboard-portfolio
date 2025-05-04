"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";
import { addAutreAction } from "@/actions/autres-actions";
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
import Image from "next/image";

type AddAutreFormProps = {
  availableTags: TagOption[];
};

export function AddAutreItem({ availableTags }: AddAutreFormProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>("Description du projet");
  const editorRef = useRef<MDXEditorMethods | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

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

  const handleAddAutre = async (formData: FormData) => {
    try {
      setIsUploading(true);

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

      // Appeler l'action serveur pour ajouter le projet
      await addAutreAction(formData);

      toast.success("Projet ajouté avec succès !");

      // Rediriger vers la liste des projets
      router.push("/creations/autres");
      router.refresh();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      toast.error("Erreur lors de l'ajout du projet.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/creations/autres">
                Autres projets
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Ajouter un projet</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <form className="flex flex-col gap-5" action={handleAddAutre}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input
              type="text"
              id="title"
              name="title"
              placeholder="Titre du projet"
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
              <input type="hidden" name="description" value={markdown} />
            </div>
          </div>

          <div className="flex w-full gap-6">
            <div className="flex flex-col w-full items-start gap-1.5">
              <Label htmlFor="miniature">Image miniature</Label>
              <Input
                type="file"
                id="miniature"
                name="miniature"
                accept="image/*"
                onChange={handleImageChange}
                required
              />
            </div>
            {previewImage && (
              <div className="w-80 shrink-0">
                <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video">
                  <Image
                    src={previewImage}
                    alt="Aperçu"
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </div>
            )}
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

          <div className="grid w-full gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagCheckbox
              options={availableTags}
              selectedTags={selectedTags}
              onChange={handleTagsChange}
            />
            {selectedTags.map((tag) => (
              <input key={tag} type="hidden" name="tags" value={tag} />
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_github">Lien GitHub</Label>
              <Input
                type="url"
                id="lien_github"
                name="lien_github"
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_figma">Lien Figma</Label>
              <Input
                type="url"
                id="lien_figma"
                name="lien_figma"
                placeholder="https://www.figma.com/file/..."
              />
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="lien_site">Lien du site</Label>
              <Input
                type="url"
                id="lien_site"
                name="lien_site"
                placeholder="https://www.example.com"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="isPublished">Afficher</Label>
            <Switch
              id="isPublished"
              name="isPublished"
              defaultChecked
              className="cursor-pointer"
            />
          </div>

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
              onClick={() => router.push("/creations/autres")}
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
