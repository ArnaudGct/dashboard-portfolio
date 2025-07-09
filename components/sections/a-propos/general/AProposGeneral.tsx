"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import dynamic from "next/dynamic";
import { MDXEditorMethods } from "@mdxeditor/editor";

// Importer l'éditeur de manière dynamique
const EditorComp = dynamic(() => import("@/components/editor-textarea"), {
  ssr: false,
});

type AProposData = {
  id_gen: number;
  photo: string;
  credit_nom: string;
  credit_url: string;
  description: string;
} | null;

interface AProposGeneralFormProps {
  aproposData: AProposData;
  updateAction: (
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
}

export function AProposGeneralForm({
  aproposData,
  updateAction,
}: AProposGeneralFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [markdown, setMarkdown] = useState<string>(
    aproposData?.description || ""
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier sélectionné n'est pas une image");
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditorChange = (newMarkdown: string) => {
    setMarkdown(newMarkdown);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsUploading(true);

      const formData = new FormData();

      // Ajouter la photo si elle est sélectionnée
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      // Ajouter les autres données
      formData.set("credit_nom", (e.target as any).credit_nom.value);
      formData.set("credit_url", (e.target as any).credit_url.value);
      formData.set("description", markdown);

      const result = await updateAction(formData);

      if (result.success) {
        toast.success(result.message);
        setPreview(null);
        setSelectedFile(null);
        // Réinitialiser l'input file
        const fileInput = document.getElementById("photo") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Upload d'image */}
        <div className="space-y-2">
          <Label htmlFor="photo">Photo</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1"
            />
          </div>
          {aproposData?.photo && !preview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">Photo actuelle :</p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <Image
                  src={aproposData.photo}
                  alt="Photo actuelle"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          )}

          {/* Aperçu de la nouvelle image */}
          {preview && (
            <div className="mt-2 w-full">
              <p className="text-sm text-gray-600 mb-2">
                Aperçu de la nouvelle image :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <Image
                  src={preview}
                  alt="Aperçu de l'image"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {/* Crédit nom */}
          <div className="space-y-2">
            <Label htmlFor="credit_nom">Nom du crédit</Label>
            <Input
              id="credit_nom"
              name="credit_nom"
              type="text"
              placeholder="Nom du crédit"
              defaultValue={aproposData?.credit_nom || ""}
            />
          </div>

          {/* Crédit URL */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="credit_url">URL du crédit</Label>
            <Input
              id="credit_url"
              name="credit_url"
              type="url"
              placeholder="https://example.com"
              defaultValue={aproposData?.credit_url || ""}
            />
          </div>
        </div>
      </div>

      {/* Description avec éditeur MDX */}
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

      {/* Bouton de mise à jour */}
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Mise à jour en cours..." : "Mettre à jour"}
      </Button>
    </form>
  );
}
