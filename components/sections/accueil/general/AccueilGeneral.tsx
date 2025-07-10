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

type AccueilData = {
  id_gen: number;
  video_desktop: string;
  video_mobile: string;
  video_cover: string;
  photo: string;
  photo_alt: string;
  credit_nom: string;
  credit_url: string;
  description: string;
} | null;

interface AccueilGeneralFormProps {
  accueilData: AccueilData;
  updateAction: (
    formData: FormData
  ) => Promise<{ success: boolean; message: string }>;
}

export function AccueilGeneralForm({
  accueilData,
  updateAction,
}: AccueilGeneralFormProps) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [videoDesktopPreview, setVideoDesktopPreview] = useState<string | null>(
    null
  );
  const [videoMobilePreview, setVideoMobilePreview] = useState<string | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [markdown, setMarkdown] = useState<string>(
    accueilData?.description || ""
  );
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [selectedVideoDesktopFile, setSelectedVideoDesktopFile] =
    useState<File | null>(null);
  const [selectedVideoMobileFile, setSelectedVideoMobileFile] =
    useState<File | null>(null);
  const [forceRegenerateFrame, setForceRegenerateFrame] = useState(false);
  const editorRef = useRef<MDXEditorMethods | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier sélectionné n'est pas une image");
        return;
      }

      setSelectedPhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoDesktopChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Le fichier sélectionné n'est pas une vidéo");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error("La vidéo est trop volumineuse (max 50MB)");
        return;
      }

      setSelectedVideoDesktopFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoDesktopPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Le fichier sélectionné n'est pas une vidéo");
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.error("La vidéo est trop volumineuse (max 50MB)");
        return;
      }

      setSelectedVideoMobileFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoMobilePreview(reader.result as string);
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

      // Ajouter les fichiers s'ils sont sélectionnés
      if (selectedPhotoFile) {
        formData.append("photo", selectedPhotoFile);
      }
      if (selectedVideoDesktopFile) {
        formData.append("video_desktop", selectedVideoDesktopFile);
      }
      if (selectedVideoMobileFile) {
        formData.append("video_mobile", selectedVideoMobileFile);
      }

      // Ajouter les autres données
      formData.set("photo_alt", (e.target as any).photo_alt.value);
      formData.set("credit_nom", (e.target as any).credit_nom.value);
      formData.set("credit_url", (e.target as any).credit_url.value);
      formData.set("description", markdown);
      formData.set("force_regenerate_frame", forceRegenerateFrame.toString());

      const result = await updateAction(formData);

      if (result.success) {
        toast.success(result.message);
        setPhotoPreview(null);
        setVideoDesktopPreview(null);
        setVideoMobilePreview(null);
        setSelectedPhotoFile(null);
        setSelectedVideoDesktopFile(null);
        setSelectedVideoMobileFile(null);

        // Réinitialiser les inputs file
        const photoInput = document.getElementById("photo") as HTMLInputElement;
        const videoDesktopInput = document.getElementById(
          "video_desktop"
        ) as HTMLInputElement;
        const videoMobileInput = document.getElementById(
          "video_mobile"
        ) as HTMLInputElement;

        if (photoInput) photoInput.value = "";
        if (videoDesktopInput) videoDesktopInput.value = "";
        if (videoMobileInput) videoMobileInput.value = "";
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
      {/* Upload vidéo desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="video_desktop">Vidéo Desktop</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="video_desktop"
              name="video_desktop"
              type="file"
              accept="video/*"
              onChange={handleVideoDesktopChange}
              className="flex-1"
            />
          </div>
          {accueilData?.video_desktop && !videoDesktopPreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">
                Vidéo desktop actuelle :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <video
                  src={accueilData.video_desktop}
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>
            </div>
          )}

          {/* Aperçu de la cover générée */}
          {accueilData?.video_cover && !videoDesktopPreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">
                Cover générée automatiquement :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <Image
                  src={accueilData.video_cover}
                  alt="Cover générée à partir de la vidéo"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Cette image est générée automatiquement lors de l'upload d'une
                nouvelle vidéo desktop
              </p>
            </div>
          )}

          {/* Aperçu de la nouvelle vidéo desktop */}
          {videoDesktopPreview && (
            <div className="mt-2 w-full">
              <p className="text-sm text-gray-600 mb-2">
                Aperçu de la nouvelle vidéo desktop :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <video
                  src={videoDesktopPreview}
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>
            </div>
          )}
        </div>

        {/* Upload vidéo mobile */}
        <div className="space-y-2">
          <Label htmlFor="video_mobile">Vidéo Mobile</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="video_mobile"
              name="video_mobile"
              type="file"
              accept="video/*"
              onChange={handleVideoMobileChange}
              className="flex-1"
            />
          </div>
          {accueilData?.video_mobile && !videoMobilePreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">
                Vidéo mobile actuelle :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <video
                  src={accueilData.video_mobile}
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>
            </div>
          )}

          {/* Aperçu de la nouvelle vidéo mobile */}
          {videoMobilePreview && (
            <div className="mt-2 w-full">
              <p className="text-sm text-gray-600 mb-2">
                Aperçu de la nouvelle vidéo mobile :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <video
                  src={videoMobilePreview}
                  className="w-full h-full object-contain"
                  controls
                  preload="metadata"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload de photo */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="flex-1"
              />
            </div>
          </div>

          {/* Texte alternatif de la photo */}
          <div className="space-y-2">
            <Label htmlFor="photo_alt">Texte alternatif de la photo</Label>
            <Input
              id="photo_alt"
              name="photo_alt"
              type="text"
              placeholder="Description de la photo"
              defaultValue={accueilData?.photo_alt || ""}
              required={!!(accueilData?.photo || selectedPhotoFile)}
            />
          </div>

          {accueilData?.photo && !photoPreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">Photo actuelle :</p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <Image
                  src={accueilData.photo}
                  alt={accueilData.photo_alt || "Photo actuelle"}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          )}

          {/* Aperçu de la nouvelle photo */}
          {photoPreview && (
            <div className="mt-4 w-full">
              <p className="text-sm text-gray-600 mb-2">
                Aperçu de la nouvelle photo :
              </p>
              <div className="rounded-md overflow-hidden bg-muted w-full relative aspect-video max-w-md">
                <Image
                  src={photoPreview}
                  alt="Aperçu de la photo"
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
              defaultValue={accueilData?.credit_nom || ""}
            />
          </div>

          {/* Crédit URL */}
          <div className="space-y-2">
            <Label htmlFor="credit_url">URL du crédit</Label>
            <Input
              id="credit_url"
              name="credit_url"
              type="url"
              placeholder="https://example.com"
              defaultValue={accueilData?.credit_url || ""}
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

      {/* Régénérer la frame de la vidéo desktop */}
      {accueilData?.video_desktop && (
        <div className="mt-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="regenerate_frame"
            checked={forceRegenerateFrame}
            onChange={(e) => setForceRegenerateFrame(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="regenerate_frame" className="text-sm">
            Régénérer la frame de la vidéo desktop
          </Label>
        </div>
      )}

      {/* Bouton de mise à jour */}
      <Button type="submit" className="w-full" disabled={isUploading}>
        {isUploading ? "Mise à jour en cours..." : "Mettre à jour"}
      </Button>
    </form>
  );
}
