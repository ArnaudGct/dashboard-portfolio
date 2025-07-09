"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sketch } from "@uiw/react-color";
import {
  updateOutilAction,
  deleteOutilAction,
} from "@/actions/apropos_outils-actions";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Trash2,
  Upload,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";

interface EditOutilItemProps {
  initialData: {
    id_outil: number;
    titre: string;
    description: string;
    icone: string;
    icone_alt: string;
    icone_rounded: boolean;
    lien: string;
    couleur_fond: string;
    couleur_contour: string;
    couleur_texte: string;
    couleur_fond_dark: string;
    couleur_contour_dark: string;
    couleur_texte_dark: string;
    afficher: boolean;
  };
}

export function EditOutilItem({ initialData }: EditOutilItemProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(
    initialData.icone || null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPublished, setIsPublished] = useState<boolean>(initialData.afficher);
  const [iconeRounded, setIconeRounded] = useState<boolean>(
    initialData.icone_rounded
  );
  const isMounted = useRef(false);

  // États pour les couleurs
  const [couleurFond, setCouleurFond] = useState(initialData.couleur_fond);
  const [couleurContour, setCouleurContour] = useState(
    initialData.couleur_contour
  );
  const [couleurTexte, setCouleurTexte] = useState(initialData.couleur_texte);
  const [couleurFondDark, setCouleurFondDark] = useState(
    initialData.couleur_fond_dark
  );
  const [couleurContourDark, setCouleurContourDark] = useState(
    initialData.couleur_contour_dark
  );
  const [couleurTexteDark, setCouleurTexteDark] = useState(
    initialData.couleur_texte_dark
  );

  // États pour l'affichage des color pickers
  const [showColorPickers, setShowColorPickers] = useState({
    fond: false,
    contour: false,
    texte: false,
    fondDark: false,
    contourDark: false,
    texteDark: false,
  });

  const toggleColorPicker = (type: keyof typeof showColorPickers) => {
    setShowColorPickers((prev) => {
      const newState = {
        fond: false,
        contour: false,
        texte: false,
        fondDark: false,
        contourDark: false,
        texteDark: false,
      };

      // Si le picker actuel est fermé, on l'ouvre et ferme les autres
      if (!prev[type]) {
        newState[type] = true;
      }

      return newState;
    });
  };

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Le fichier sélectionné n'est pas une image");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image est trop volumineuse (max 5MB)");
        return;
      }

      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateOutil = async (formData: FormData) => {
    setIsUpdating(true);

    const iconeAlt = formData.get("icone_alt")?.toString();
    const lien = formData.get("lien")?.toString();

    if (!iconeAlt?.trim()) {
      toast.error("Le texte alternatif de l'icône est obligatoire.");
      setIsUpdating(false);
      return;
    }

    // Validation du lien si fourni
    if (lien && lien.trim() && !lien.startsWith("http")) {
      toast.error("Le lien doit commencer par http:// ou https://");
      setIsUpdating(false);
      return;
    }

    formData.set("id", initialData.id_outil.toString());
    formData.set("afficher", isPublished ? "true" : "false");
    formData.set("icone_rounded", iconeRounded ? "true" : "false");

    // Ajouter les couleurs au FormData
    formData.set("couleur_fond", couleurFond);
    formData.set("couleur_contour", couleurContour);
    formData.set("couleur_texte", couleurTexte);
    formData.set("couleur_fond_dark", couleurFondDark);
    formData.set("couleur_contour_dark", couleurContourDark);
    formData.set("couleur_texte_dark", couleurTexteDark);

    // Ajouter le fichier d'icône si sélectionné
    if (selectedFile) {
      formData.append("icone", selectedFile);
    }

    const result = await updateOutilAction(formData);

    if (result?.success) {
      toast.success("Outil mis à jour avec succès");
      router.push("/a-propos/outils");
      router.refresh();
    } else {
      toast.error(result?.message || "Erreur lors de la mise à jour");
    }
    setIsUpdating(false);
  };

  const handleDeleteOutil = async () => {
    setIsDeleting(true);
    const result = await deleteOutilAction(initialData.id_outil);

    if (result?.success) {
      toast.success("Outil supprimé avec succès");
      router.push("/a-propos/outils");
      router.refresh();
    } else {
      toast.error(result?.message || "Erreur lors de la suppression");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/a-propos/outils">Outils</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Modifier un outil</BreadcrumbPage>
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
                Cette action est irréversible. Cela supprimera définitivement
                cet outil.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteOutil}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600 cursor-pointer"
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form className="flex flex-col gap-5" action={handleUpdateOutil}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              name="titre"
              placeholder="Nom de l'outil"
              defaultValue={initialData.titre}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icone_alt">Texte alternatif de l'icône</Label>
            <Input
              id="icone_alt"
              name="icone_alt"
              placeholder="Description de l'icône"
              defaultValue={initialData.icone_alt}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Description de l'outil"
            defaultValue={initialData.description}
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lien">Lien vers l'outil</Label>
          <Input
            id="lien"
            name="lien"
            type="url"
            placeholder="https://example.com"
            defaultValue={initialData.lien}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="icone">Icône</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="icone"
              name="icone"
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              className="flex-1"
            />
          </div>
          {iconPreview && (
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">
                {selectedFile ? "Nouvelle icône :" : "Icône actuelle :"}
              </p>
              <Image
                src={iconPreview}
                alt={selectedFile ? "Aperçu icône" : initialData.icone_alt}
                width={64}
                height={64}
                className={`border ${iconeRounded ? "rounded-full" : "rounded-md"}`}
              />
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="icone_rounded"
            name="icone_rounded"
            checked={iconeRounded}
            onCheckedChange={setIconeRounded}
            className="cursor-pointer"
          />
          <Label htmlFor="icone_rounded">Icône arrondie</Label>
        </div>

        {/* Couleurs pour le mode clair */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Couleurs (Mode clair)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Couleur de fond</Label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border flex-shrink-0"
                  style={{ backgroundColor: couleurFond }}
                />
                <Input
                  type="text"
                  value={couleurFond}
                  onChange={(e) => setCouleurFond(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleColorPicker("fond")}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {showColorPickers.fond ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showColorPickers.fond && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-lg">
                  <Sketch
                    color={couleurFond}
                    onChange={(color) => setCouleurFond(color.hex)}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Couleur de contour</Label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border flex-shrink-0"
                  style={{ backgroundColor: couleurContour }}
                />
                <Input
                  type="text"
                  value={couleurContour}
                  onChange={(e) => setCouleurContour(e.target.value)}
                  placeholder="#e5e7eb"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleColorPicker("contour")}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {showColorPickers.contour ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showColorPickers.contour && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-lg">
                  <Sketch
                    color={couleurContour}
                    onChange={(color) => setCouleurContour(color.hex)}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Couleur du texte</Label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border flex-shrink-0"
                  style={{ backgroundColor: couleurTexte }}
                />
                <Input
                  type="text"
                  value={couleurTexte}
                  onChange={(e) => setCouleurTexte(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleColorPicker("texte")}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {showColorPickers.texte ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showColorPickers.texte && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-lg">
                  <Sketch
                    color={couleurTexte}
                    onChange={(color) => setCouleurTexte(color.hex)}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Couleurs pour le mode sombre */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Couleurs (Mode sombre)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Couleur de fond (dark)</Label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border flex-shrink-0"
                  style={{ backgroundColor: couleurFondDark }}
                />
                <Input
                  type="text"
                  value={couleurFondDark}
                  onChange={(e) => setCouleurFondDark(e.target.value)}
                  placeholder="#1f2937"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleColorPicker("fondDark")}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {showColorPickers.fondDark ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showColorPickers.fondDark && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-lg">
                  <Sketch
                    color={couleurFondDark}
                    onChange={(color) => setCouleurFondDark(color.hex)}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Couleur de contour (dark)</Label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border flex-shrink-0"
                  style={{ backgroundColor: couleurContourDark }}
                />
                <Input
                  type="text"
                  value={couleurContourDark}
                  onChange={(e) => setCouleurContourDark(e.target.value)}
                  placeholder="#374151"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleColorPicker("contourDark")}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {showColorPickers.contourDark ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showColorPickers.contourDark && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-lg">
                  <Sketch
                    color={couleurContourDark}
                    onChange={(color) => setCouleurContourDark(color.hex)}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Couleur du texte (dark)</Label>
              <div className="flex items-center space-x-2">
                <div
                  className="w-8 h-8 rounded border flex-shrink-0"
                  style={{ backgroundColor: couleurTexteDark }}
                />
                <Input
                  type="text"
                  value={couleurTexteDark}
                  onChange={(e) => setCouleurTexteDark(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleColorPicker("texteDark")}
                  className="flex-shrink-0 cursor-pointer"
                >
                  {showColorPickers.texteDark ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {showColorPickers.texteDark && (
                <div className="mt-2 p-2 border rounded-md bg-white shadow-lg">
                  <Sketch
                    color={couleurTexteDark}
                    onChange={(color) => setCouleurTexteDark(color.hex)}
                    style={{ width: "100%" }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="afficher"
            name="afficher"
            checked={isPublished}
            onCheckedChange={setIsPublished}
            className="cursor-pointer"
          />
          <Label htmlFor="afficher">Afficher l'outil</Label>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="cursor-pointer"
            disabled={isUpdating}
          >
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.push("/a-propos/outils")}
            disabled={isUpdating}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
