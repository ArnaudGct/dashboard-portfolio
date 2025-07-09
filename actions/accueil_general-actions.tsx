"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  uploadAProposImageToCloudinary,
  uploadVideoToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  deleteVideoFromCloudinary,
} from "@/lib/cloudinary";
import { generateValidatedFrameUrl, diagnoseVideoUrl } from "@/lib/video-utils";

export async function updateAccueilGeneral(formData: FormData) {
  const photoFile = formData.get("photo") as File;
  const photoAlt = formData.get("photo_alt") as string;
  const videoDesktopFile = formData.get("video_desktop") as File;
  const videoMobileFile = formData.get("video_mobile") as File;
  const creditNom = formData.get("credit_nom") as string;
  const creditUrl = formData.get("credit_url") as string;
  const description = formData.get("description") as string;
  const forceRegenerateFrame =
    formData.get("force_regenerate_frame") === "true";

  try {
    console.log("=== DÉBUT MISE À JOUR ACCUEIL GÉNÉRAL ===");

    // Vérifier s'il y a déjà un enregistrement
    const existingRecord = await prisma.accueil_general.findFirst();

    // Validation du texte alternatif si une photo est présente ou uploadée
    if ((photoFile && photoFile.size > 0) || existingRecord?.photo) {
      if (!photoAlt || !photoAlt.trim()) {
        return {
          success: false,
          message: "Le texte alternatif de la photo est obligatoire",
        };
      }
    }

    let photoUrl = existingRecord?.photo || "";
    let videoDesktopUrl = existingRecord?.video_desktop || "";
    let videoMobileUrl = existingRecord?.video_mobile || "";
    let videoCoverUrl = existingRecord?.video_cover || "";
    let oldPhotoPublicId: string | null = null;
    let oldVideoDesktopPublicId: string | null = null;
    let oldVideoMobilePublicId: string | null = null;
    let oldVideoCoverPublicId: string | null = null;

    // Si une nouvelle photo est uploadée
    if (photoFile && photoFile.size > 0) {
      console.log("Upload nouvelle photo accueil...");
      console.log(`Taille du fichier photo: ${photoFile.size} bytes`);

      // Extraire l'ancien publicId pour suppression ultérieure
      if (existingRecord?.photo) {
        oldPhotoPublicId = extractPublicIdFromUrl(existingRecord.photo);
        console.log(`Ancien publicId photo extrait: ${oldPhotoPublicId}`);
      }

      // Upload de la nouvelle photo
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
        console.log("=== DEBUG SUPPRESSION VIDÉO ===");
        console.log(`URL vidéo existante: ${existingRecord.video_desktop}`);
        console.log(`PublicId extrait: ${oldVideoDesktopPublicId}`);
        console.log("================================");
      }

      // Extraire l'ancien publicId du video_cover pour suppression
      if (existingRecord?.video_cover) {
        oldVideoCoverPublicId = extractPublicIdFromUrl(
          existingRecord.video_cover
        );
        console.log("=== DEBUG SUPPRESSION COVER ===");
        console.log(`URL cover existante: ${existingRecord.video_cover}`);
        console.log(`PublicId cover extrait: ${oldVideoCoverPublicId}`);
        console.log("================================");
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

      // Supprimer l'ancienne vidéo desktop de Cloudinary IMMÉDIATEMENT après l'upload
      if (oldVideoDesktopPublicId) {
        console.log(
          `Suppression de l'ancienne vidéo desktop: ${oldVideoDesktopPublicId}`
        );
        try {
          const deleteResult = await deleteVideoFromCloudinary(
            oldVideoDesktopPublicId
          );
          if (deleteResult) {
            console.log("✓ Ancienne vidéo desktop supprimée avec succès");
          } else {
            console.warn(
              "⚠️ Échec de la suppression de l'ancienne vidéo desktop"
            );
          }
        } catch (deleteError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne vidéo desktop:",
            deleteError
          );
        }
      }

      // Supprimer l'ancienne cover de Cloudinary IMMÉDIATEMENT
      if (oldVideoCoverPublicId) {
        console.log(
          `Suppression de l'ancienne cover vidéo: ${oldVideoCoverPublicId}`
        );
        try {
          const deleteResult = await deleteFromCloudinary(
            oldVideoCoverPublicId
          );
          if (deleteResult) {
            console.log("✓ Ancienne cover vidéo supprimée avec succès");
          } else {
            console.warn("⚠️ Échec de la suppression de l'ancienne cover");
          }
        } catch (deleteError) {
          console.warn(
            "⚠️ Erreur lors de la suppression de l'ancienne cover:",
            deleteError
          );
        }
      }

      try {
        // Diagnostic de l'URL vidéo
        console.log("Diagnostic de l'URL vidéo...");
        const diagnostic = await diagnoseVideoUrl(videoDesktopUrl);

        if (!diagnostic.isValidUrl) {
          throw new Error("URL vidéo Cloudinary invalide");
        }

        if (!diagnostic.publicId) {
          throw new Error("Impossible d'extraire le public_id de l'URL vidéo");
        }

        // Générer l'URL de la première frame avec validation
        console.log("Génération de la cover vidéo avec Cloudinary...");
        const frameUrl = await generateValidatedFrameUrl(
          videoDesktopUrl,
          "w_1280,h_720,c_scale,q_auto:good,f_webp"
        );

        // Optionnel : Stocker la cover comme fichier séparé
        try {
          // Télécharger la frame générée
          const frameResponse = await fetch(frameUrl);
          const frameBuffer = await frameResponse.arrayBuffer();

          // Créer un fichier temporaire et l'uploader
          const frameFile = new File([frameBuffer], "video-cover.webp", {
            type: "image/webp",
          });
          const coverResult = await uploadAProposImageToCloudinary(
            frameFile,
            "portfolio/accueil/general/covers",
            {
              width: 1280,
              height: 720,
              crop: "scale",
              quality: "auto:good",
              format: "webp",
            }
          );

          videoCoverUrl = coverResult.url;
          console.log("Cover vidéo stockée sur Cloudinary:", videoCoverUrl);
        } catch (uploadError) {
          console.warn(
            "⚠️ Erreur lors du stockage de la cover, utilisation de l'URL de transformation:",
            uploadError
          );
          videoCoverUrl = frameUrl;
        }

        console.log("Cover vidéo générée et validée:", videoCoverUrl);
      } catch (frameError) {
        console.warn(
          "⚠️ Erreur lors de la génération de la frame:",
          frameError
        );
        // En cas d'erreur, on garde l'ancienne cover si elle existe
        videoCoverUrl = existingRecord?.video_cover || "";
      }
    }

    // Régénération forcée de la frame si demandée
    if (
      forceRegenerateFrame &&
      existingRecord?.video_desktop &&
      !videoDesktopFile
    ) {
      console.log("Régénération forcée de la frame vidéo...");

      try {
        // Générer une nouvelle URL de frame avec validation
        videoCoverUrl = await generateValidatedFrameUrl(
          existingRecord.video_desktop,
          "w_1280,h_720,c_scale,q_auto:good,f_webp"
        );
        console.log("Frame régénérée avec succès:", videoCoverUrl);
      } catch (frameError) {
        console.warn(
          "⚠️ Erreur lors de la régénération de la frame:",
          frameError
        );
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
          const deleteResult = await deleteVideoFromCloudinary(
            oldVideoMobilePublicId
          );
          if (deleteResult) {
            console.log("✓ Ancienne vidéo mobile supprimée avec succès");
          } else {
            console.warn(
              "⚠️ Échec de la suppression de l'ancienne vidéo mobile"
            );
          }
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
          photo_alt: photoAlt?.trim() || existingRecord.photo_alt,
          video_desktop: videoDesktopUrl,
          video_mobile: videoMobileUrl,
          video_cover: videoCoverUrl,
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
          photo_alt: photoAlt?.trim() || "",
          video_desktop: videoDesktopUrl,
          video_mobile: videoMobileUrl,
          video_cover: videoCoverUrl,
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
