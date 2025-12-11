"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  uploadAProposImageToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";

export async function createOutilAction(formData: FormData) {
  const titre = formData.get("titre") as string;
  const description = formData.get("description") as string;
  const iconeFile = formData.get("icone") as File;
  const iconeAlt = formData.get("icone_alt") as string;
  const iconeRounded = formData.get("icone_rounded") === "true";
  const lien = formData.get("lien") as string;
  const couleurFond = formData.get("couleur_fond") as string;
  const couleurContour = formData.get("couleur_contour") as string;
  const couleurTexte = formData.get("couleur_texte") as string;
  const couleurFondDark = formData.get("couleur_fond_dark") as string;
  const couleurContourDark = formData.get("couleur_contour_dark") as string;
  const couleurTexteDark = formData.get("couleur_texte_dark") as string;
  const afficher = formData.get("afficher") === "true";

  try {
    console.log("=== CRÉATION NOUVEL OUTIL ===");

    let iconeUrl = "";

    // Si une icône est uploadée
    if (iconeFile && iconeFile.size > 0) {
      console.log("Upload icône outil...");
      console.log(`Taille du fichier icône: ${iconeFile.size} bytes`);

      // Utiliser la fonction pour uploader l'icône
      const result = await uploadAProposImageToCloudinary(
        iconeFile,
        "portfolio/apropos/outils/icones",
        {
          width: 64,
          height: 64,
          crop: "fit",
          quality: "auto:good",
          format: "png",
        }
      );

      iconeUrl = result.url;
      console.log("Icône outil uploadée:", iconeUrl);
    }

    // Trouver l'ordre maximum pour placer le nouvel outil à la fin
    const maxOrder = await prisma.apropos_outils.aggregate({
      where: { afficher },
      _max: { ordre: true },
    });
    const newOrder = (maxOrder._max.ordre ?? 0) + 1;

    // Créer l'outil
    const nouvelOutil = await prisma.apropos_outils.create({
      data: {
        titre,
        description,
        icone: iconeUrl,
        icone_alt: iconeAlt,
        icone_rounded: iconeRounded,
        lien: lien || "",
        couleur_fond: couleurFond,
        couleur_contour: couleurContour,
        couleur_texte: couleurTexte,
        couleur_fond_dark: couleurFondDark,
        couleur_contour_dark: couleurContourDark,
        couleur_texte_dark: couleurTexteDark,
        ordre: newOrder,
        afficher,
      },
    });

    console.log("✓ Outil créé:", nouvelOutil);

    revalidatePath("/a-propos/outils");
    return { success: true, message: "Outil créé avec succès" };
  } catch (error) {
    console.error("❌ Erreur lors de la création de l'outil:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Erreur lors de la création",
    };
  }
}

export async function updateOutilAction(formData: FormData) {
  const id = parseInt(formData.get("id") as string);
  const titre = formData.get("titre") as string;
  const description = formData.get("description") as string;
  const iconeFile = formData.get("icone") as File;
  const iconeAlt = formData.get("icone_alt") as string;
  const iconeRounded = formData.get("icone_rounded") === "true";
  const lien = formData.get("lien") as string;
  const couleurFond = formData.get("couleur_fond") as string;
  const couleurContour = formData.get("couleur_contour") as string;
  const couleurTexte = formData.get("couleur_texte") as string;
  const couleurFondDark = formData.get("couleur_fond_dark") as string;
  const couleurContourDark = formData.get("couleur_contour_dark") as string;
  const couleurTexteDark = formData.get("couleur_texte_dark") as string;
  const afficher = formData.get("afficher") === "true";

  try {
    console.log("=== MISE À JOUR OUTIL ===");

    // Récupérer l'outil existant
    const existingOutil = await prisma.apropos_outils.findUnique({
      where: { id_outil: id },
    });

    if (!existingOutil) {
      throw new Error("Outil non trouvé");
    }

    let iconeUrl = existingOutil.icone;
    let oldIconePublicId: string | null = null;

    // Si une nouvelle icône est uploadée
    if (iconeFile && iconeFile.size > 0) {
      console.log("Upload nouvelle icône outil...");
      console.log(`Taille du fichier icône: ${iconeFile.size} bytes`);

      // Extraire l'ancien publicId pour suppression
      if (existingOutil.icone) {
        oldIconePublicId = extractPublicIdFromUrl(existingOutil.icone);
      }

      // Uploader la nouvelle icône
      const result = await uploadAProposImageToCloudinary(
        iconeFile,
        "portfolio/apropos/outils/icones",
        {
          width: 64,
          height: 64,
          crop: "fit",
          quality: "auto:good",
          format: "png",
        }
      );

      iconeUrl = result.url;
      console.log("Nouvelle icône outil uploadée:", iconeUrl);

      // Supprimer l'ancienne icône
      if (oldIconePublicId) {
        try {
          await deleteFromCloudinary(oldIconePublicId);
          console.log("✓ Ancienne icône supprimée");
        } catch (deleteError) {
          console.warn("⚠️ Erreur suppression ancienne icône:", deleteError);
        }
      }
    }

    // Mettre à jour l'outil
    const outilMisAJour = await prisma.apropos_outils.update({
      where: { id_outil: id },
      data: {
        titre,
        description,
        icone: iconeUrl,
        icone_alt: iconeAlt,
        icone_rounded: iconeRounded,
        lien: lien || "",
        couleur_fond: couleurFond,
        couleur_contour: couleurContour,
        couleur_texte: couleurTexte,
        couleur_fond_dark: couleurFondDark,
        couleur_contour_dark: couleurContourDark,
        couleur_texte_dark: couleurTexteDark,
        afficher,
      },
    });

    console.log("✓ Outil mis à jour:", outilMisAJour);

    revalidatePath("/a-propos/outils");
    return { success: true, message: "Outil mis à jour avec succès" };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'outil:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour",
    };
  }
}

export async function deleteOutilAction(id: number) {
  try {
    console.log("=== SUPPRESSION OUTIL ===");

    // Récupérer l'outil pour obtenir l'URL de l'icône
    const outil = await prisma.apropos_outils.findUnique({
      where: { id_outil: id },
    });

    if (!outil) {
      throw new Error("Outil non trouvé");
    }

    // Supprimer l'icône de Cloudinary si elle existe
    if (outil.icone) {
      const publicId = extractPublicIdFromUrl(outil.icone);
      if (publicId) {
        try {
          await deleteFromCloudinary(publicId);
          console.log("✓ Icône supprimée de Cloudinary");
        } catch (deleteError) {
          console.warn("⚠️ Erreur suppression icône Cloudinary:", deleteError);
        }
      }
    }

    // Supprimer l'outil de la base de données
    await prisma.apropos_outils.delete({
      where: { id_outil: id },
    });

    console.log("✓ Outil supprimé");

    revalidatePath("/a-propos/outils");
    return { success: true, message: "Outil supprimé avec succès" };
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'outil:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression",
    };
  }
}

export async function toggleOutilVisibilityAction(
  id: number,
  afficher: boolean
) {
  try {
    await prisma.apropos_outils.update({
      where: { id_outil: id },
      data: { afficher },
    });

    revalidatePath("/a-propos/outils");
    return {
      success: true,
      message: `Outil ${afficher ? "affiché" : "masqué"} avec succès`,
    };
  } catch (error) {
    console.error("❌ Erreur lors du changement de visibilité:", error);
    return {
      success: false,
      message: "Erreur lors du changement de visibilité",
    };
  }
}

export async function getOutils() {
  try {
    const outils = await prisma.apropos_outils.findMany({
      orderBy: { ordre: "asc" },
    });
    return outils;
  } catch (error) {
    console.error("Erreur lors de la récupération des outils:", error);
    return [];
  }
}

// Action pour réorganiser l'ordre des outils
export async function reorderOutilAction(
  outilId: number,
  direction: "up" | "down"
) {
  try {
    // Récupérer l'outil actuel
    const currentOutil = await prisma.apropos_outils.findUnique({
      where: { id_outil: outilId },
      select: { ordre: true, afficher: true },
    });

    if (!currentOutil) {
      return { success: false, error: "Outil non trouvé" };
    }

    const currentOrder = currentOutil.ordre;

    // Trouver l'outil voisin le plus proche (dans le même groupe visible/non visible)
    const targetOutil = await prisma.apropos_outils.findFirst({
      where: {
        afficher: currentOutil.afficher,
        ordre: direction === "up" ? { lt: currentOrder } : { gt: currentOrder },
      },
      orderBy: {
        ordre: direction === "up" ? "desc" : "asc",
      },
      select: { id_outil: true, ordre: true },
    });

    if (!targetOutil) {
      return {
        success: false,
        error: "Impossible de déplacer l'outil dans cette direction",
      };
    }

    // Échanger les ordres
    await prisma.$transaction([
      prisma.apropos_outils.update({
        where: { id_outil: outilId },
        data: { ordre: targetOutil.ordre },
      }),
      prisma.apropos_outils.update({
        where: { id_outil: targetOutil.id_outil },
        data: { ordre: currentOrder },
      }),
    ]);

    revalidatePath("/a-propos/outils");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la réorganisation des outils:", error);
    return { success: false, error: "Erreur lors de la réorganisation" };
  }
}

// Initialiser les ordres des outils si nécessaire
export async function initializeOutilsOrder() {
  try {
    // Vérifier si les ordres sont déjà initialisés (pas tous à 0)
    const allZero = await prisma.apropos_outils.findFirst({
      where: { ordre: { not: 0 } },
    });

    if (allZero) {
      // Les ordres sont déjà initialisés
      return;
    }

    // Initialiser les ordres séparément pour les visibles et non visibles
    const visibles = await prisma.apropos_outils.findMany({
      where: { afficher: true },
      orderBy: { id_outil: "asc" },
    });

    const nonVisibles = await prisma.apropos_outils.findMany({
      where: { afficher: false },
      orderBy: { id_outil: "asc" },
    });

    // Mettre à jour les ordres
    const updates = [
      ...visibles.map((o, index) =>
        prisma.apropos_outils.update({
          where: { id_outil: o.id_outil },
          data: { ordre: index + 1 },
        })
      ),
      ...nonVisibles.map((o, index) =>
        prisma.apropos_outils.update({
          where: { id_outil: o.id_outil },
          data: { ordre: index + 1 },
        })
      ),
    ];

    await prisma.$transaction(updates);
  } catch (error) {
    console.error("Erreur lors de l'initialisation des ordres:", error);
  }
}
