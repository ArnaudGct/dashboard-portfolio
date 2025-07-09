"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  uploadAProposImageToCloudinary,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";
import sharp from "sharp";

export async function updateAccueilGeneral(formData: FormData) {
  const photoFile = formData.get("photo") as File;
  const videoDesktopFile = formData.get("video_desktop") as File;
  const videoMobileFile = formData.get("video_mobile") as File;
  const creditNom = formData.get("credit_nom") as string;
  const creditUrl = formData.get("credit_url") as string;
  const description = formData.get("description") as string;

  try {
    console.log("=== DÉBUT MISE À JOUR ACCUEIL GÉNÉRAL ===");

    // Vérifier s'il y a déjà un enregistrement
    const existingRecord = await prisma.accueil_general.findFirst();

    let photoUrl = existingRecord?.photo || "";
    let videoDesktopUrl = existingRecord?.video_desktop || "";
    let videoMobileUrl = existingRecord?.video_mobile || "";
    let oldPhotoPublicId: string | null = null;
    let oldVideoDesktopPublicId: string | null = null;
    let oldVideoMobilePublicId: string | null = null;

    // Si une nouvelle photo est uploadée
    if (photoFile && photoFile.size > 0) {
      console.log("Upload nouvelle photo accueil...");
      console.log(`Taille du fichier photo: ${photoFile.size} bytes`);

      // Extraire l'ancien publicId pour suppression ultérieure
      if (existingRecord?.photo) {
        oldPhotoPublicId = extractPublicIdFromUrl(existingRecord.photo);
        console.log(`Ancien publicId photo extrait: ${oldPhotoPublicId}`);
      }

      // Obtenir les dimensions de l'image originale
      const arrayBuffer = await photoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const metadata = await sharp(buffer).metadata();
      const largeur = metadata.width || 0;
      const hauteur = metadata.height || 0;

      console.log(`Dimensions photo détectées: ${largeur}x${hauteur}`);

      // Utiliser la fonction spécialisée pour les images d'accueil
      const result = await uploadAProposImageToCloudinary(
        photoFile,
        "portfolio/accueil/general",
        {
          width: 800,
          height: undefined,
          crop: "scale",
          quality: "auto:good",
          format: "webp",
        }
      );

      photoUrl = result.url;
      console.log("Photo d'accueil uploadée:", photoUrl);

      // Supprimer l'ancienne photo de Cloudinary si elle existe
      if (oldPhotoPublicId) {
        console.log(
          `Suppression de l'ancienne photo d'accueil: ${oldPhotoPublicId}`
        );
        try {
          await deleteFromCloudinary(oldPhotoPublicId);
          console.log("✓ Ancienne photo supprimée avec succès");
        } catch (deleteError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne photo:",
            deleteError
          );
        }
      }
    }

    // Si une nouvelle vidéo desktop est uploadée
    if (videoDesktopFile && videoDesktopFile.size > 0) {
      console.log("Upload nouvelle vidéo desktop...");
      console.log(
        `Taille du fichier vidéo desktop: ${videoDesktopFile.size} bytes`
      );

      // Extraire l'ancien publicId pour suppression ultérieure
      if (existingRecord?.video_desktop) {
        oldVideoDesktopPublicId = extractPublicIdFromUrl(
          existingRecord.video_desktop
        );
        console.log(
          `Ancien publicId vidéo desktop extrait: ${oldVideoDesktopPublicId}`
        );
      }

      // Upload vidéo desktop avec la fonction spécialisée
      const result = await uploadVideoToCloudinary(
        videoDesktopFile,
        "portfolio/accueil/general/videos",
        {
          quality: "auto:good",
          format: "mp4",
        }
      );

      videoDesktopUrl = result.url;
      console.log("Vidéo desktop d'accueil uploadée:", videoDesktopUrl);

      // Supprimer l'ancienne vidéo desktop de Cloudinary si elle existe
      if (oldVideoDesktopPublicId) {
        console.log(
          `Suppression de l'ancienne vidéo desktop: ${oldVideoDesktopPublicId}`
        );
        try {
          await deleteFromCloudinary(oldVideoDesktopPublicId);
          console.log("✓ Ancienne vidéo desktop supprimée avec succès");
        } catch (deleteError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne vidéo desktop:",
            deleteError
          );
        }
      }
    }

    // Si une nouvelle vidéo mobile est uploadée
    if (videoMobileFile && videoMobileFile.size > 0) {
      console.log("Upload nouvelle vidéo mobile...");
      console.log(
        `Taille du fichier vidéo mobile: ${videoMobileFile.size} bytes`
      );

      // Extraire l'ancien publicId pour suppression ultérieure
      if (existingRecord?.video_mobile) {
        oldVideoMobilePublicId = extractPublicIdFromUrl(
          existingRecord.video_mobile
        );
        console.log(
          `Ancien publicId vidéo mobile extrait: ${oldVideoMobilePublicId}`
        );
      }

      // Upload vidéo mobile avec la fonction spécialisée
      const result = await uploadVideoToCloudinary(
        videoMobileFile,
        "portfolio/accueil/general/videos",
        {
          quality: "auto:good",
          format: "mp4",
        }
      );

      videoMobileUrl = result.url;
      console.log("Vidéo mobile d'accueil uploadée:", videoMobileUrl);

      // Supprimer l'ancienne vidéo mobile de Cloudinary si elle existe
      if (oldVideoMobilePublicId) {
        console.log(
          `Suppression de l'ancienne vidéo mobile: ${oldVideoMobilePublicId}`
        );
        try {
          await deleteFromCloudinary(oldVideoMobilePublicId);
          console.log("✓ Ancienne vidéo mobile supprimée avec succès");
        } catch (deleteError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne vidéo mobile:",
            deleteError
          );
        }
      }
    }

    if (existingRecord) {
      // Mettre à jour l'enregistrement existant
      await prisma.accueil_general.update({
        where: { id_gen: existingRecord.id_gen },
        data: {
          photo: photoUrl,
          video_desktop: videoDesktopUrl,
          video_mobile: videoMobileUrl,
          credit_nom: creditNom,
          credit_url: creditUrl,
          description: description,
        },
      });
      console.log("✓ Enregistrement mis à jour en base de données");
    } else {
      // Créer un nouvel enregistrement
      await prisma.accueil_general.create({
        data: {
          photo: photoUrl,
          video_desktop: videoDesktopUrl,
          video_mobile: videoMobileUrl,
          credit_nom: creditNom,
          credit_url: creditUrl,
          description: description,
        },
      });
      console.log("✓ Nouvel enregistrement créé en base de données");
    }

    revalidatePath("/accueil/general");
    console.log("=== FIN MISE À JOUR ACCUEIL GÉNÉRAL ===");
    return { success: true, message: "Données mises à jour avec succès" };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erreur lors de la mise à jour",
    };
  }
}

export async function getAccueilGeneral() {
  try {
    const data = await prisma.accueil_general.findFirst();
    return data;
  } catch (error) {
    console.error("Erreur lors de la récupération des données:", error);
    return null;
  }
}
