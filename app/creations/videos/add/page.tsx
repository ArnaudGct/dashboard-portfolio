"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";

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

const availableTags: TagOption[] = [
  { id: "court-metrage", label: "Court-métrage" },
  { id: "fiction", label: "Fiction" },
  { id: "drame", label: "Drame" },
  { id: "comedie", label: "Comédie" },
  { id: "suspense", label: "Suspense" },
  { id: "documentaire", label: "Documentaire" },
  { id: "experimental", label: "Expérimental" },
  { id: "clip", label: "Clip" },
];

export default function Add() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [markdown, setMarkdown] = useState<string>(`Description de la vidéo`);
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const handleTagsChange = (newSelectedTags: string[]) => {
    setSelectedTags(newSelectedTags);
  };

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Le contenu markdown est disponible dans la variable "markdown"
    console.log("Contenu markdown à envoyer:", markdown);
    // Implémentez ici la logique d'envoi vers votre backend
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
              <BreadcrumbPage>Modifier une vidéo</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="title">Titre</Label>
            <Input type="text" id="title" placeholder="Titre" />
          </div>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="description">Description</Label>
            <div className="border rounded-md overflow-hidden">
              <EditorComp
                markdown={markdown}
                onChange={handleEditorChange}
                editorRef={editorRef}
              />
            </div>
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="url">Lien de la vidéo</Label>
            <Input
              type="url"
              id="url"
              placeholder="Ex : https://www.youtube.com/watch?v=I_hdJUyyet0"
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="duree">Durée</Label>
            <Input type="text" id="duree" placeholder="Ex : 00:02:18" />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="tags">Tags</Label>
            <TagCheckbox
              options={availableTags}
              selectedTags={selectedTags}
              onChange={handleTagsChange}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
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
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="airplane-mode">Afficher</Label>
            <Switch id="airplane-mode" />
          </div>
          <div className="flex">
            <Button type="submit" className="cursor-pointer">
              Ajouter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
