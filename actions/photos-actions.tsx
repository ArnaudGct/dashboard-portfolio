"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import sharp from "sharp";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
  uploadOriginalToCloudinary, // NOUVEAU
} from "@/lib/cloudinary";

// Helper pour sauvegarder une image via Cloudinary
async function saveImageToCloudinary(
  file: File,
  type: "low" | "high" = "high",
  originalPublicId?: string
): Promise<string> {
  try {
    console.log(
      `Début upload vers Cloudinary - Type: ${type}, Taille: ${file.size} bytes`
    );

    if (!file || file.size === 0) {
      throw new Error("Fichier invalide ou vide");
    }

    const result = await uploadToCloudinary(
      file,
      type,
      "portfolio/photos",
      originalPublicId
    );
    console.log(`Upload réussi - URL: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error("Erreur lors de l'upload vers Cloudinary:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Erreur d'upload Cloudinary: ${errorMessage}`);
  }
}

// Helper pour créer une image de couverture d'album avec Sharp
async function generateAlbumCover(albumId: number): Promise<string> {
  try {
    console.log(`Génération de la couverture pour l'album ${albumId}`);

    // Récupérer les 3 premières photos de l'album triées par position
    const albumPhotos = await prisma.photos_albums_link.findMany({
      where: { id_alb: albumId },
      include: {
        photos: true,
      },
      orderBy: {
        position: "asc",
      },
      take: 3,
    });

    if (albumPhotos.length === 0) {
      console.log("Aucune photo trouvée pour l'album");
      return "";
    }

    // Préparer les URLs des images
    const imageUrls = albumPhotos.map((link) => link.photos.lien_high);
    console.log(`Images trouvées pour la couverture:`, imageUrls);

    // Dimensions de l'image de couverture
    const coverWidth = 1200;
    const coverHeight = 800;

    // Fonction helper pour télécharger et redimensionner une image
    async function downloadAndResize(
      url: string,
      width: number,
      height: number
    ) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return await sharp(buffer)
          .resize(width, height, { fit: "cover", position: "center" })
          .jpeg({ quality: 95 }) // Augmenté de 80 à 95 pour moins de compression
          .toBuffer();
      } catch (error) {
        console.error(`Erreur lors du téléchargement de ${url}:`, error);
        // Créer une image placeholder grise
        return await sharp({
          create: {
            width,
            height,
            channels: 3,
            background: { r: 200, g: 200, b: 200 },
          },
        })
          .jpeg({ quality: 95 }) // Même qualité pour le placeholder
          .toBuffer();
      }
    }

    let coverBuffer: Buffer;

    if (imageUrls.length === 1) {
      // Une seule image - prendre toute la largeur
      coverBuffer = await downloadAndResize(
        imageUrls[0],
        coverWidth,
        coverHeight
      );
    } else if (imageUrls.length === 2) {
      // Deux images - côte à côte (50% chacune)
      const imgWidth = Math.floor(coverWidth / 2);
      const [img1, img2] = await Promise.all([
        downloadAndResize(imageUrls[0], imgWidth, coverHeight),
        downloadAndResize(imageUrls[1], imgWidth, coverHeight),
      ]);

      coverBuffer = await sharp({
        create: {
          width: coverWidth,
          height: coverHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite([
          { input: img1, left: 0, top: 0 },
          { input: img2, left: imgWidth, top: 0 },
        ])
        .jpeg({ quality: 95 }) // Augmenté de 80 à 95
        .toBuffer();
    } else {
      // Trois images - image de gauche 50%, deux images de droite 50% (empilées)
      const leftWidth = Math.floor(coverWidth / 2);
      const rightWidth = Math.floor(coverWidth / 2);
      const rightHeight = Math.floor(coverHeight / 2);

      const [mainImg, img2, img3] = await Promise.all([
        downloadAndResize(imageUrls[0], leftWidth, coverHeight),
        downloadAndResize(imageUrls[1], rightWidth, rightHeight),
        downloadAndResize(imageUrls[2], rightWidth, rightHeight),
      ]);

      coverBuffer = await sharp({
        create: {
          width: coverWidth,
          height: coverHeight,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      })
        .composite([
          { input: mainImg, left: 0, top: 0 },
          { input: img2, left: leftWidth, top: 0 },
          { input: img3, left: leftWidth, top: rightHeight },
        ])
        .jpeg({ quality: 95 }) // Augmenté de 80 à 95
        .toBuffer();
    }

    // Créer un objet File-like pour l'upload
    const coverFile = new File(
      [new Uint8Array(coverBuffer)],
      `album_${albumId}_cover.jpg`,
      {
        type: "image/jpeg",
      }
    );

    // Uploader vers Cloudinary dans le dossier albums
    const result = await uploadToCloudinary(
      coverFile,
      "high",
      "portfolio/albums"
    );

    console.log(`Couverture d'album générée: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error(
      "Erreur lors de la génération de la couverture d'album:",
      error
    );
    throw error;
  }
}

// Helper pour régénérer les couvertures des albums concernés
async function regenerateAlbumCovers(photoId: number): Promise<void> {
  try {
    console.log(
      `Régénération des couvertures pour les albums contenant la photo ${photoId}`
    );

    // Récupérer tous les albums qui contiennent cette photo
    const albumsContainingPhoto = await prisma.photos_albums_link.findMany({
      where: { id_pho: photoId },
      include: {
        photos_albums: true,
      },
    });

    if (albumsContainingPhoto.length === 0) {
      console.log("Aucun album ne contient cette photo");
      return;
    }

    // Régénérer la couverture pour chaque album
    for (const albumLink of albumsContainingPhoto) {
      const albumId = albumLink.id_alb;
      console.log(`Régénération de la couverture pour l'album ${albumId}`);

      try {
        // Supprimer l'ancienne couverture
        if (albumLink.photos_albums.lien_cover) {
          await deleteAlbumCover(albumLink.photos_albums.lien_cover);
        }

        // Générer la nouvelle couverture
        const coverUrl = await generateAlbumCover(albumId);
        if (coverUrl) {
          await prisma.photos_albums.update({
            where: { id_alb: albumId },
            data: { lien_cover: coverUrl },
          });
          console.log(`✓ Couverture régénérée pour l'album ${albumId}`);
        }
      } catch (coverError) {
        console.error(
          `Erreur lors de la régénération de la couverture pour l'album ${albumId}:`,
          coverError
        );
      }
    }

    // Revalider les chemins des albums
    revalidatePath("/creations/photos/albums");
  } catch (error) {
    console.error(
      "Erreur lors de la régénération des couvertures d'albums:",
      error
    );
  }
}

export async function regenerateAllAlbumCoversAction() {
  try {
    console.log(
      "=== DÉBUT RÉGÉNÉRATION DE TOUTES LES COUVERTURES D'ALBUMS ==="
    );

    // Récupérer tous les albums
    const albums = await prisma.photos_albums.findMany({
      select: {
        id_alb: true,
        titre: true,
        lien_cover: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    if (albums.length === 0) {
      console.log("Aucun album trouvé");
      return { success: true, message: "Aucun album trouvé" };
    }

    console.log(`Found ${albums.length} albums to process`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Traiter chaque album
    for (const album of albums) {
      console.log(
        `\n--- Traitement de l'album ${album.id_alb}: "${album.titre}" ---`
      );

      try {
        // Supprimer l'ancienne couverture si elle existe
        if (album.lien_cover) {
          try {
            await deleteAlbumCover(album.lien_cover);
            console.log(
              `✓ Ancienne couverture supprimée pour l'album ${album.id_alb}`
            );
          } catch (deleteError) {
            console.warn(
              `⚠️ Erreur lors de la suppression de l'ancienne couverture pour l'album ${album.id_alb}:`,
              deleteError
            );
          }
        }

        // Générer la nouvelle couverture
        const coverUrl = await generateAlbumCover(album.id_alb);

        if (coverUrl) {
          // Mettre à jour l'album avec la nouvelle couverture
          await prisma.photos_albums.update({
            where: { id_alb: album.id_alb },
            data: { lien_cover: coverUrl },
          });

          console.log(
            `✓ Couverture générée avec succès pour l'album ${album.id_alb}`
          );
          successCount++;
        } else {
          // Album sans photos - nettoyer le champ couverture
          await prisma.photos_albums.update({
            where: { id_alb: album.id_alb },
            data: { lien_cover: "" },
          });

          console.log(
            `✓ Couverture vidée pour l'album ${album.id_alb} (aucune photo)`
          );
          successCount++;
        }
      } catch (error) {
        console.error(
          `❌ Erreur lors du traitement de l'album ${album.id_alb}:`,
          error
        );
        errorCount++;
        errors.push(
          `Album "${album.titre}" (ID: ${album.id_alb}): ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Revalider les chemins
    revalidatePath("/creations/photos/albums");

    console.log(`\n=== RÉSULTATS ===`);
    console.log(`Albums traités avec succès: ${successCount}`);
    console.log(`Albums en erreur: ${errorCount}`);
    console.log(`=== FIN RÉGÉNÉRATION ===\n`);

    return {
      success: true,
      message: `Régénération terminée: ${successCount} album(s) traité(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      details: {
        successCount,
        errorCount,
        errors,
        totalAlbums: albums.length,
      },
    };
  } catch (error) {
    console.error(
      "❌ Erreur lors de la régénération de toutes les couvertures:",
      error
    );
    return {
      success: false,
      message: "Erreur lors de la régénération des couvertures",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Action pour ajouter une photo
export async function addPhotoAction(formData: FormData) {
  try {
    console.log("=== DÉBUT AJOUT PHOTO ===");

    // Récupérer les fichiers d'image
    const imageHighRes = formData.get("imageHigh") as File;
    const imageLowRes = (formData.get("imageLow") as File) || imageHighRes;

    console.log("Images reçues:", {
      imageHigh: imageHighRes
        ? `${imageHighRes.name} (${imageHighRes.size} bytes)`
        : "Aucune",
      imageLow: imageLowRes
        ? `${imageLowRes.name} (${imageLowRes.size} bytes)`
        : "Aucune",
    });

    if (!imageHighRes || imageHighRes.size === 0) {
      throw new Error("Aucune image fournie");
    }

    let lienHigh = "";
    let lienLow = "";
    let originalPublicId = "";

    // NOUVEAU: Sauvegarder l'image originale sans retouche
    console.log("Sauvegarde de l'image originale...");
    try {
      const originalResult = await uploadOriginalToCloudinary(imageHighRes);
      originalPublicId = originalResult.publicId;
      console.log(
        "✓ Image originale sauvegardée avec succès:",
        originalPublicId
      );
    } catch (originalError) {
      console.warn(
        "⚠️ Erreur lors de la sauvegarde de l'original (continuons quand même):",
        originalError
      );
    }

    // Uploader l'image haute résolution avec le lien vers l'original
    console.log("Upload image haute résolution...");
    lienHigh = await saveImageToCloudinary(
      imageHighRes,
      "high",
      originalPublicId
    );
    console.log("Image haute résolution uploadée:", lienHigh);

    // Uploader l'image basse résolution si elle existe et est différente
    if (imageLowRes && imageLowRes.size > 0) {
      console.log("Upload image basse résolution...");
      lienLow = await saveImageToCloudinary(
        imageLowRes,
        "low",
        originalPublicId
      );
      console.log("Image basse résolution uploadée:", lienLow);
    }

    // Obtenir les dimensions de l'image originale
    const arrayBuffer = await imageHighRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const metadata = await sharp(buffer).metadata();
    const largeur = metadata.width || 0;
    const hauteur = metadata.height || 0;

    console.log(`Dimensions détectées: ${largeur}x${hauteur}`);

    const alt = formData.get("alt")?.toString() || "";
    const afficher = formData.get("isPublished") === "on";

    console.log("Création en base de données...");

    // Créer la photo dans la base de données
    const photo = await prisma.photos.create({
      data: {
        lien_high: lienHigh,
        lien_low: lienLow,
        largeur,
        hauteur,
        alt,
        date: new Date(),
        afficher,
        derniere_modification: new Date(),
      },
    });

    console.log("Photo créée en base:", photo.id_pho);

    // Gérer les tags de recherche
    const tagsRecherche = formData.getAll("tagsRecherche");
    if (tagsRecherche && tagsRecherche.length > 0) {
      for (const tagId of tagsRecherche) {
        await prisma.photos_tags_recherche_link.create({
          data: {
            id_pho: photo.id_pho,
            id_tags: parseInt(tagId.toString()),
          },
        });
      }
    }

    // Gérer les tags normaux
    const tags = formData.getAll("tags");
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await prisma.photos_tags_link.create({
          data: {
            id_pho: photo.id_pho,
            id_tags: parseInt(tagId.toString()),
          },
        });
      }
    }

    // Gérer les albums
    const albums = formData.getAll("albums");
    if (albums && albums.length > 0) {
      for (const albumId of albums) {
        await prisma.photos_albums_link.create({
          data: {
            id_pho: photo.id_pho,
            id_alb: parseInt(albumId.toString()),
          },
        });
      }

      // NOUVEAU: Régénérer les couvertures des albums concernés
      console.log("Régénération des couvertures d'albums...");
      try {
        await regenerateAlbumCovers(photo.id_pho);
      } catch (coverError) {
        console.error(
          "Erreur lors de la régénération des couvertures:",
          coverError
        );
      }
    }

    revalidatePath("/creations/photos");
    return { success: true, photoId: photo.id_pho };
  } catch (error) {
    console.error("Erreur lors de l'ajout de la photo:", error);
    throw error;
  }
}

// Action pour mettre à jour une photo
export async function updatePhotoAction(formData: FormData) {
  try {
    const photoId = parseInt(formData.get("id")?.toString() || "0");

    if (isNaN(photoId) || photoId <= 0) {
      throw new Error("ID de photo invalide");
    }

    // Récupérer la photo existante
    const existingPhoto = await prisma.photos.findUnique({
      where: { id_pho: photoId },
    });

    if (!existingPhoto) {
      throw new Error("Photo non trouvée");
    }

    // Récupérer les anciens albums AVANT la mise à jour
    const oldAlbums = await prisma.photos_albums_link.findMany({
      where: { id_pho: photoId },
      select: { id_alb: true },
    });

    console.log("=== DÉBUT MISE À JOUR PHOTO ===");
    console.log("Photo existante:", {
      id: photoId,
      lien_high: existingPhoto.lien_high,
      lien_low: existingPhoto.lien_low,
    });

    // Gérer les images
    const imageHighRes = formData.get("imageHigh") as File;
    const imageLowRes = formData.get("imageLow") as File;

    let lienHigh = existingPhoto.lien_high;
    let lienLow = existingPhoto.lien_low;
    let largeur = existingPhoto.largeur;
    let hauteur = existingPhoto.hauteur;
    let imageHasChanged = false;

    // Sauvegarder TOUS les anciens publicIds AVANT l'upload
    const oldPublicIdHigh = existingPhoto.lien_high
      ? extractPublicIdFromUrl(existingPhoto.lien_high)
      : null;
    const oldPublicIdLow = existingPhoto.lien_low
      ? extractPublicIdFromUrl(existingPhoto.lien_low)
      : null;

    console.log("Anciens publicIds extraits:", {
      oldPublicIdHigh,
      oldPublicIdLow,
    });

    // Variables pour suivre les uploads
    let hasUploadedNewHighRes = false;
    let hasUploadedNewLowRes = false;

    // ====== UPLOAD DES NOUVELLES IMAGES ======
    if (imageHighRes && imageHighRes.size > 0) {
      console.log("Upload nouvelle image haute résolution...");
      imageHasChanged = true;

      try {
        // NOUVEAU: Sauvegarder l'image originale sans retouche
        console.log("Sauvegarde de la nouvelle image originale...");
        try {
          await uploadOriginalToCloudinary(imageHighRes);
          console.log("✓ Nouvelle image originale sauvegardée avec succès");
        } catch (originalError) {
          console.warn(
            "⚠️ Erreur lors de la sauvegarde de l'original (continuons quand même):",
            originalError
          );
        }

        // Upload de la nouvelle image haute résolution
        lienHigh = await saveImageToCloudinary(imageHighRes, "high");
        hasUploadedNewHighRes = true;

        // Obtenir les nouvelles dimensions
        const arrayBuffer = await imageHighRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const metadata = await sharp(buffer).metadata();
        largeur = metadata.width || existingPhoto.largeur;
        hauteur = metadata.height || existingPhoto.hauteur;

        console.log(`✓ Nouvelle image haute résolution uploadée: ${lienHigh}`);
      } catch (uploadError) {
        console.error(
          "❌ Erreur lors de l'upload de l'image haute résolution:",
          uploadError
        );
        throw uploadError;
      }
    }

    if (imageLowRes && imageLowRes.size > 0) {
      console.log("Upload nouvelle image basse résolution...");
      imageHasChanged = true;

      try {
        // Upload de la nouvelle image basse résolution
        lienLow = await saveImageToCloudinary(imageLowRes, "low");
        hasUploadedNewLowRes = true;
        console.log(`✓ Nouvelle image basse résolution uploadée: ${lienLow}`);
      } catch (uploadError) {
        console.error(
          "❌ Erreur lors de l'upload de l'image basse résolution:",
          uploadError
        );
        throw uploadError;
      }
    }

    // ====== MISE À JOUR EN BASE DE DONNÉES ======
    const alt = formData.get("alt")?.toString() || existingPhoto.alt;
    const afficher = formData.get("isPublished") === "on";

    let photoDate: Date | undefined;
    if (formData.get("date")) {
      photoDate = new Date(formData.get("date")!.toString());
    }

    // Mettre à jour la photo avec toutes les nouvelles données
    const photo = await prisma.photos.update({
      where: { id_pho: photoId },
      data: {
        lien_high: lienHigh,
        lien_low: lienLow,
        largeur,
        hauteur,
        alt,
        afficher,
        ...(photoDate && { date: photoDate }),
        derniere_modification: new Date(),
      },
    });

    console.log(`✓ Photo mise à jour en base de données`);

    // ====== SUPPRESSION DES ANCIENNES IMAGES DE CLOUDINARY (CORRIGÉ) ======
    const deletionPromises = [];

    // Si une nouvelle image HR a été uploadée et qu'une ancienne existait, on la supprime.
    if (hasUploadedNewHighRes && oldPublicIdHigh) {
      console.log(
        `🗑️ Programmation suppression ancienne image HR: ${oldPublicIdHigh}`
      );
      deletionPromises.push(deleteFromCloudinary(oldPublicIdHigh));

      // Supprimer l'ancienne image originale
      deletionPromises.push(deleteOriginalFromCloudinary(oldPublicIdHigh));
    }

    // Si une nouvelle image BR a été uploadée et qu'une ancienne existait, on la supprime.
    // On vérifie qu'on ne la supprime pas une deuxième fois si elle était identique à l'ancienne HR.
    if (
      hasUploadedNewLowRes &&
      oldPublicIdLow &&
      oldPublicIdLow !== oldPublicIdHigh
    ) {
      console.log(
        `🗑️ Programmation suppression ancienne image BR: ${oldPublicIdLow}`
      );
      deletionPromises.push(deleteFromCloudinary(oldPublicIdLow));
    }

    if (deletionPromises.length > 0) {
      console.log(
        `Exécution de ${deletionPromises.length} suppression(s) sur Cloudinary...`
      );
      const results = await Promise.allSettled(deletionPromises);
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `⚠️ Erreur lors de la suppression d'une image Cloudinary:`,
            result.reason
          );
        } else {
          console.log(`✓ Une ancienne image a été supprimée avec succès.`);
        }
      });
      console.log("🗑️ Suppression des anciennes images terminée.");
    } else {
      console.log(
        "ℹ️ Aucune nouvelle image uploadée, conservation des images existantes."
      );
    }

    // ====== MISE À JOUR DES RELATIONS ======
    // Supprimer les anciennes relations de tags de recherche
    await prisma.photos_tags_recherche_link.deleteMany({
      where: { id_pho: photoId },
    });

    // Créer les nouvelles relations de tags de recherche
    const tagsRecherche = formData.getAll("tagsRecherche");
    if (tagsRecherche && tagsRecherche.length > 0) {
      for (const tagId of tagsRecherche) {
        await prisma.photos_tags_recherche_link.create({
          data: {
            id_pho: photoId,
            id_tags: parseInt(tagId.toString()),
          },
        });
      }
    }

    // Supprimer les anciennes relations de tags
    await prisma.photos_tags_link.deleteMany({
      where: { id_pho: photoId },
    });

    // Créer les nouvelles relations de tags
    const tags = formData.getAll("tags");
    if (tags && tags.length > 0) {
      for (const tagId of tags) {
        await prisma.photos_tags_link.create({
          data: {
            id_pho: photoId,
            id_tags: parseInt(tagId.toString()),
          },
        });
      }
    }

    // Supprimer les anciennes relations d'albums
    await prisma.photos_albums_link.deleteMany({
      where: { id_pho: photoId },
    });

    // Créer les nouvelles relations d'albums
    const albums = formData.getAll("albums");
    const newAlbumIds = [];
    if (albums && albums.length > 0) {
      for (const albumId of albums) {
        await prisma.photos_albums_link.create({
          data: {
            id_pho: photoId,
            id_alb: parseInt(albumId.toString()),
          },
        });
        newAlbumIds.push(parseInt(albumId.toString()));
      }
    }

    // ====== RÉGÉNÉRATION DES COUVERTURES D'ALBUMS ======
    console.log("Régénération des couvertures d'albums...");
    try {
      // Créer un Set avec tous les albums qui ont été affectés
      const affectedAlbumIds = new Set<number>();

      // Ajouter les anciens albums
      oldAlbums.forEach((album) => affectedAlbumIds.add(album.id_alb));

      // Ajouter les nouveaux albums
      newAlbumIds.forEach((albumId) => affectedAlbumIds.add(albumId));

      // Régénérer les couvertures pour tous les albums affectés
      for (const albumId of affectedAlbumIds) {
        console.log(`Régénération de la couverture pour l'album ${albumId}`);

        try {
          // Récupérer l'album pour obtenir l'ancienne couverture
          const album = await prisma.photos_albums.findUnique({
            where: { id_alb: albumId },
          });

          // Supprimer l'ancienne couverture
          if (album?.lien_cover) {
            await deleteAlbumCover(album.lien_cover);
          }

          // Générer la nouvelle couverture
          const coverUrl = await generateAlbumCover(albumId);
          if (coverUrl) {
            await prisma.photos_albums.update({
              where: { id_alb: albumId },
              data: { lien_cover: coverUrl },
            });
            console.log(`✓ Couverture régénérée pour l'album ${albumId}`);
          } else {
            // Si pas de couverture générée (album vide), nettoyer le champ
            await prisma.photos_albums.update({
              where: { id_alb: albumId },
              data: { lien_cover: "" },
            });
            console.log(
              `✓ Couverture vidée pour l'album ${albumId} (aucune photo)`
            );
          }
        } catch (coverError) {
          console.error(
            `Erreur lors de la régénération de la couverture pour l'album ${albumId}:`,
            coverError
          );
        }
      }
    } catch (coverError) {
      console.error(
        "Erreur lors de la régénération des couvertures:",
        coverError
      );
    }

    revalidatePath("/creations/photos");
    revalidatePath(`/creations/photos/${photoId}/edit`);
    revalidatePath("/creations/photos/albums"); // Ajouter cette ligne

    console.log("=== FIN MISE À JOUR PHOTO ===");
    return { success: true };
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la photo:", error);
    throw error;
  }
}

// Action pour supprimer une photo
export async function deletePhotoAction(photoId: number) {
  try {
    if (isNaN(photoId) || photoId <= 0) {
      throw new Error("ID de photo invalide");
    }

    // Récupérer la photo pour obtenir les chemins d'image
    const photo = await prisma.photos.findUnique({
      where: { id_pho: photoId },
    });

    if (!photo) {
      throw new Error("Photo non trouvée");
    }

    // Récupérer les albums qui contiennent cette photo AVANT la suppression
    const albumsContainingPhoto = await prisma.photos_albums_link.findMany({
      where: { id_pho: photoId },
      select: { id_alb: true },
    });

    // Supprimer toutes les relations
    await prisma.photos_tags_recherche_link.deleteMany({
      where: { id_pho: photoId },
    });

    await prisma.photos_tags_link.deleteMany({
      where: { id_pho: photoId },
    });

    await prisma.photos_albums_link.deleteMany({
      where: { id_pho: photoId },
    });

    // Supprimer la photo elle-même
    await prisma.photos.delete({
      where: { id_pho: photoId },
    });

    // Supprimer les images de Cloudinary si elles existent
    if (photo.lien_high || photo.lien_low) {
      try {
        const deletionPromises = [];

        // Supprimer l'image haute résolution
        if (photo.lien_high) {
          const publicIdHigh = extractPublicIdFromUrl(photo.lien_high);
          if (publicIdHigh) {
            deletionPromises.push(deleteFromCloudinary(publicIdHigh));
            console.log(`🗑️ Suppression image HR: ${publicIdHigh}`);

            // Supprimer l'image originale correspondante
            deletionPromises.push(deleteOriginalFromCloudinary(publicIdHigh));
          }
        }

        // Supprimer l'image basse résolution si elle est différente
        if (photo.lien_low && photo.lien_low !== photo.lien_high) {
          const publicIdLow = extractPublicIdFromUrl(photo.lien_low);
          if (publicIdLow) {
            deletionPromises.push(deleteFromCloudinary(publicIdLow));
            console.log(`🗑️ Suppression image BR: ${publicIdLow}`);
          }
        }

        // Exécuter toutes les suppressions
        if (deletionPromises.length > 0) {
          const results = await Promise.allSettled(deletionPromises);
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              console.error(
                `⚠️ Erreur lors de la suppression d'une image Cloudinary:`,
                result.reason
              );
            } else {
              console.log(`✓ Image supprimée avec succès`);
            }
          });
        }
      } catch (imageError) {
        console.error(
          "Erreur lors de la suppression des images depuis Cloudinary:",
          imageError
        );
      }
    }

    // ====== RÉGÉNÉRATION DES COUVERTURES D'ALBUMS ======
    console.log("Régénération des couvertures d'albums après suppression...");
    try {
      for (const albumLink of albumsContainingPhoto) {
        const albumId = albumLink.id_alb;
        console.log(`Régénération de la couverture pour l'album ${albumId}`);

        try {
          // Récupérer l'album pour obtenir l'ancienne couverture
          const album = await prisma.photos_albums.findUnique({
            where: { id_alb: albumId },
          });

          // Supprimer l'ancienne couverture
          if (album?.lien_cover) {
            await deleteAlbumCover(album.lien_cover);
          }

          // Générer la nouvelle couverture
          const coverUrl = await generateAlbumCover(albumId);
          if (coverUrl) {
            await prisma.photos_albums.update({
              where: { id_alb: albumId },
              data: { lien_cover: coverUrl },
            });
            console.log(`✓ Couverture régénérée pour l'album ${albumId}`);
          } else {
            // Si pas de couverture générée (album vide), nettoyer le champ
            await prisma.photos_albums.update({
              where: { id_alb: albumId },
              data: { lien_cover: "" },
            });
            console.log(
              `✓ Couverture vidée pour l'album ${albumId} (aucune photo)`
            );
          }
        } catch (coverError) {
          console.error(
            `Erreur lors de la régénération de la couverture pour l'album ${albumId}:`,
            coverError
          );
        }
      }
    } catch (coverError) {
      console.error(
        "Erreur lors de la régénération des couvertures:",
        coverError
      );
    }

    revalidatePath("/creations/photos");
    revalidatePath("/creations/photos/albums"); // Ajouter cette ligne
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la photo:", error);
    throw error;
  }
}

// Actions pour les tags de photos
export async function createPhotoTagAction(
  title: string,
  important: boolean = false
) {
  try {
    const existingTag = await prisma.photos_tags.findFirst({
      where: { titre: title },
    });

    if (existingTag) {
      return {
        success: false,
        error: "Ce tag existe déjà",
        id: existingTag.id_tags.toString(),
      };
    }

    const newTag = await prisma.photos_tags.create({
      data: {
        titre: title,
        important: important,
      },
    });

    revalidatePath("/creations/photos/tags");
    return { success: true, id: newTag.id_tags.toString() };
  } catch (error) {
    console.error("Erreur lors de la création du tag:", error);
    return { success: false, error: "Impossible de créer le tag" };
  }
}

export async function updatePhotoTagAction(
  id: number,
  title: string,
  important?: boolean // Nouveau paramètre optionnel
) {
  try {
    // Créer l'objet de données à mettre à jour
    const updateData: {
      titre: string;
      important?: boolean;
    } = {
      titre: title,
    };

    // Ajouter important à l'objet uniquement s'il est défini
    if (important !== undefined) {
      updateData.important = important;
    }

    // Mettre à jour le tag avec les nouvelles données
    await prisma.photos_tags.update({
      where: { id_tags: id },
      data: updateData,
    });

    revalidatePath("/creations/photos/tags");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);
    throw error;
  }
}

export async function deletePhotoTagAction(id: number) {
  try {
    await prisma.photos_tags.delete({
      where: { id_tags: id },
    });

    revalidatePath("/creations/photos/tags");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du tag:", error);
    throw error;
  }
}

// Actions pour les tags de recherche
export async function createPhotoSearchTagAction(
  title: string,
  important: boolean = false
) {
  try {
    const existingTag = await prisma.photos_tags_recherche.findFirst({
      where: { titre: title },
    });

    if (existingTag) {
      return {
        success: false,
        error: "Ce tag existe déjà",
        id: existingTag.id_tags.toString(),
      };
    }

    const newTag = await prisma.photos_tags_recherche.create({
      data: {
        titre: title,
        important: important,
      },
    });

    revalidatePath("/creations/photos/search-tags");
    return { success: true, id: newTag.id_tags.toString() };
  } catch (error) {
    console.error("Erreur lors de la création du tag de recherche:", error);
    return { success: false, error: "Impossible de créer le tag de recherche" };
  }
}

export async function updatePhotoSearchTagAction(
  id: number,
  title: string,
  important?: boolean // Nouveau paramètre optionnel
) {
  try {
    // Créer l'objet de données à mettre à jour
    const updateData: {
      titre: string;
      important?: boolean;
    } = {
      titre: title,
    };

    // Ajouter important à l'objet uniquement s'il est défini
    if (important !== undefined) {
      updateData.important = important;
    }

    // Mettre à jour le tag de recherche avec les nouvelles données
    await prisma.photos_tags_recherche.update({
      where: { id_tags: id },
      data: updateData,
    });

    revalidatePath("/creations/photos/search-tags");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag de recherche:", error);
    throw error;
  }
}

export async function deletePhotoSearchTagAction(id: number) {
  try {
    await prisma.photos_tags_recherche.delete({
      where: { id_tags: id },
    });

    revalidatePath("/creations/photos/search-tags");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du tag de recherche:", error);
    throw error;
  }
}

// Actions pour les albums photos
export async function createAlbumAction(formData: FormData) {
  try {
    // Récupérer les données du formulaire
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const isPublished = formData.get("isPublished") === "on";
    const tags = formData.getAll("tags") as string[];
    const images = formData.getAll("images") as string[];

    // Créer l'album
    const newAlbum = await prisma.photos_albums.create({
      data: {
        titre: title,
        description: description || "",
        date: date ? new Date(date) : new Date(),
        afficher: isPublished,
        lien_cover: "", // Sera mis à jour après génération
        derniere_modification: new Date(),
      },
    });

    // Associer les tags
    if (tags.length > 0) {
      await Promise.all(
        tags.map((tagId) =>
          prisma.photos_albums_tags_link.create({
            data: {
              id_alb: newAlbum.id_alb,
              id_tags: parseInt(tagId),
            },
          })
        )
      );
    }

    // Associer les images avec leur position basée sur l'ordre de sélection
    if (images.length > 0) {
      await Promise.all(
        images.map((imageId, index) =>
          prisma.photos_albums_link.create({
            data: {
              id_alb: newAlbum.id_alb,
              id_pho: parseInt(imageId),
              position: index,
            },
          })
        )
      );

      // Générer la couverture d'album
      try {
        const coverUrl = await generateAlbumCover(newAlbum.id_alb);
        if (coverUrl) {
          await prisma.photos_albums.update({
            where: { id_alb: newAlbum.id_alb },
            data: { lien_cover: coverUrl },
          });
        }
      } catch (coverError) {
        console.error(
          "Erreur lors de la génération de la couverture:",
          coverError
        );
      }
    }

    revalidatePath("/creations/photos/albums");
    return { success: true, id: newAlbum.id_alb };
  } catch (error) {
    console.error("Erreur lors de la création de l'album:", error);
    throw error;
  }
}

// Mettre à jour l'action updateAlbumAction

export async function updateAlbumAction(formData: FormData) {
  try {
    // Récupérer les données du formulaire
    const id = parseInt(formData.get("id") as string);
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const date = formData.get("date") as string;
    const isPublished = formData.get("isPublished") === "on";
    const tags = formData.getAll("tags") as string[];
    const images = formData.getAll("images") as string[];
    const imageOrders = formData.getAll("imageOrders") as string[];

    // Récupérer l'album existant pour la couverture
    const existingAlbum = await prisma.photos_albums.findUnique({
      where: { id_alb: id },
    });

    // Mettre à jour l'album
    await prisma.photos_albums.update({
      where: { id_alb: id },
      data: {
        titre: title,
        description: description || "",
        date: date ? new Date(date) : new Date(),
        afficher: isPublished,
        derniere_modification: new Date(),
      },
    });

    // Supprimer tous les liens de tags existants
    await prisma.photos_albums_tags_link.deleteMany({
      where: { id_alb: id },
    });

    // Recréer les liens de tags
    if (tags.length > 0) {
      await Promise.all(
        tags.map((tagId) =>
          prisma.photos_albums_tags_link.create({
            data: {
              id_alb: id,
              id_tags: parseInt(tagId),
            },
          })
        )
      );
    }

    // Gérer les images avec leur position - supprimer toutes les associations existantes
    await prisma.photos_albums_link.deleteMany({
      where: { id_alb: id },
    });

    // Recréer les associations d'images avec leur position
    if (images.length > 0) {
      await Promise.all(
        images.map((imageId, index) =>
          prisma.photos_albums_link.create({
            data: {
              id_alb: id,
              id_pho: parseInt(imageId),
              position: imageOrders[index]
                ? parseInt(imageOrders[index])
                : index,
            },
          })
        )
      );

      // Régénérer la couverture d'album
      try {
        // Supprimer l'ancienne couverture
        if (existingAlbum?.lien_cover) {
          await deleteAlbumCover(existingAlbum.lien_cover);
        }

        // Générer la nouvelle couverture
        const coverUrl = await generateAlbumCover(id);
        if (coverUrl) {
          await prisma.photos_albums.update({
            where: { id_alb: id },
            data: { lien_cover: coverUrl },
          });
        }
      } catch (coverError) {
        console.error(
          "Erreur lors de la régénération de la couverture:",
          coverError
        );
      }
    } else {
      // Si aucune image, supprimer la couverture
      if (existingAlbum?.lien_cover) {
        await deleteAlbumCover(existingAlbum.lien_cover);
        await prisma.photos_albums.update({
          where: { id_alb: id },
          data: { lien_cover: "" },
        });
      }
    }

    // Forcer le rechargement de la page
    revalidatePath("/creations/photos/albums");
    revalidatePath(`/creations/photos/albums/edit/${id}`);

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'album:", error);
    throw error;
  }
}

export async function deleteAlbumAction(albumId: number) {
  try {
    if (isNaN(albumId) || albumId <= 0) {
      throw new Error("ID d'album invalide");
    }

    // Récupérer l'album pour obtenir le lien de couverture
    const album = await prisma.photos_albums.findUnique({
      where: { id_alb: albumId },
    });

    // Supprimer les relations de tags
    await prisma.photos_albums_tags_link.deleteMany({
      where: { id_alb: albumId },
    });

    // Supprimer les relations avec les photos
    await prisma.photos_albums_link.deleteMany({
      where: { id_alb: albumId },
    });

    // Supprimer l'album
    await prisma.photos_albums.delete({
      where: { id_alb: albumId },
    });

    // Supprimer la couverture d'album de Cloudinary
    if (album?.lien_cover) {
      try {
        await deleteAlbumCover(album.lien_cover);
      } catch (coverError) {
        console.error(
          "Erreur lors de la suppression de la couverture:",
          coverError
        );
      }
    }

    revalidatePath("/creations/photos/albums");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'album:", error);
    throw error;
  }
}

export async function batchUploadPhotosWithMetadataAction(formData: FormData) {
  try {
    // Récupérer le nombre total d'images
    const imageCount = parseInt(formData.get("imageCount")?.toString() || "0");

    // Vérifier si c'est une mise à jour ou un nouvel ajout
    const isUpdateMode = formData.get("updateMode") === "true";
    const photoId = isUpdateMode
      ? parseInt(formData.get("photoId")?.toString() || "0")
      : 0;

    // Si pas d'images et pas en mode mise à jour, c'est une erreur
    if (imageCount === 0 && !isUpdateMode) {
      throw new Error("Aucune image à traiter");
    }

    // Récupérer les métadonnées communes
    const isPublished = formData.get("isPublished") === "on";
    const tags = formData.getAll("tags");
    const tagsRecherche = formData.getAll("tagsRecherche");
    const albums = formData.getAll("albums");
    const alt = formData.get("alt")?.toString() || "";

    // Récupérer la date si elle est fournie
    let photoDate: Date | undefined;
    if (formData.get("date")) {
      photoDate = new Date(formData.get("date")!.toString());
    }

    // Cas de mise à jour sans nouvelle image
    if (isUpdateMode && imageCount === 0) {
      console.log("Mode mise à jour sans nouvelle image");

      // Récupérer la photo existante
      const existingPhoto = await prisma.photos.findUnique({
        where: { id_pho: photoId },
      });

      if (!existingPhoto) {
        throw new Error("Photo non trouvée");
      }

      // Mise à jour de la photo existante
      await prisma.photos.update({
        where: { id_pho: photoId },
        data: {
          alt: formData.get("alt")?.toString() || existingPhoto.alt,
          afficher: isPublished,
          // Ajouter la date si elle est définie
          ...(photoDate && { date: photoDate }),
        },
      });

      // Supprimer les anciennes relations
      await prisma.photos_tags_link.deleteMany({
        where: { id_pho: photoId },
      });

      await prisma.photos_tags_recherche_link.deleteMany({
        where: { id_pho: photoId },
      });

      await prisma.photos_albums_link.deleteMany({
        where: { id_pho: photoId },
      });

      // Recréer les relations avec les tags
      if (tags && tags.length > 0) {
        for (const tagId of tags) {
          await prisma.photos_tags_link.create({
            data: {
              id_pho: photoId,
              id_tags: parseInt(tagId.toString()),
            },
          });
        }
      }

      // Recréer les relations avec les tags de recherche
      if (tagsRecherche && tagsRecherche.length > 0) {
        for (const tagId of tagsRecherche) {
          await prisma.photos_tags_recherche_link.create({
            data: {
              id_pho: photoId,
              id_tags: parseInt(tagId.toString()),
            },
          });
        }
      }

      // Recréer les relations avec les albums
      if (albums && albums.length > 0) {
        for (const albumId of albums) {
          await prisma.photos_albums_link.create({
            data: {
              id_pho: photoId,
              id_alb: parseInt(albumId.toString()),
            },
          });
        }
      }

      // Revalider les chemins
      revalidatePath("/creations/photos");
      revalidatePath(`/creations/photos/${photoId}/edit`);

      return { success: true, mode: "update-metadata" };
    }

    // Traitement normal pour les nouvelles images ou mises à jour avec nouvelle image
    const uploadedPhotos = [];

    for (let i = 0; i < imageCount; i++) {
      const photo = formData.get(`photo_${i}`) as File;
      if (!photo || !photo.size) continue;

      const itemAlt = formData.get(`alt_${i}`)?.toString() || alt;
      const generateLowRes = formData.get(`generateLowRes_${i}`) === "true";

      // Uploader les images via l'API du portfolio
      let lienHigh = "";
      let lienLow = "";
      let width = 0;
      let height = 0;

      try {
        // Obtenir d'abord les dimensions de l'image
        const arrayBuffer = await photo.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || 0;
        height = metadata.height || 0;

        console.log(`Image ${i}: dimensions détectées ${width}x${height}`);

        // NOUVEAU: Sauvegarder l'image originale sans retouche
        console.log(`Sauvegarde de l'image originale ${i}...`);
        let originalPublicId = "";
        try {
          const originalResult = await uploadOriginalToCloudinary(photo);
          originalPublicId = originalResult.publicId;
          console.log(
            `✓ Image originale ${i} sauvegardée avec succès:`,
            originalPublicId
          );
        } catch (originalError) {
          console.warn(
            `⚠️ Erreur lors de la sauvegarde de l'original ${i} (continuons quand même):`,
            originalError
          );
        }

        // Uploader l'image haute résolution avec le lien vers l'original
        lienHigh = await saveImageToCloudinary(photo, "high", originalPublicId);

        // Si generateLowRes est vrai, uploader aussi la version basse résolution
        if (generateLowRes) {
          lienLow = await saveImageToCloudinary(photo, "low", originalPublicId);
        }

        // En mode mise à jour, nous mettons à jour la photo existante
        if (isUpdateMode && i === 0) {
          // Pour la mise à jour, on ne prend que la première image
          console.log(`Mise à jour de la photo ${photoId} avec nouvelle image`);

          // Récupérer la photo existante pour obtenir les anciens liens
          const existingPhoto = await prisma.photos.findUnique({
            where: { id_pho: photoId },
          });

          if (!existingPhoto) {
            throw new Error("Photo non trouvée pour mise à jour");
          }

          // Sauvegarder les anciens publicIds AVANT la mise à jour
          const oldPublicIdHigh = existingPhoto.lien_high
            ? extractPublicIdFromUrl(existingPhoto.lien_high)
            : null;
          const oldPublicIdLow = existingPhoto.lien_low
            ? extractPublicIdFromUrl(existingPhoto.lien_low)
            : null;

          // Mettre à jour la photo
          const updatedPhoto = await prisma.photos.update({
            where: { id_pho: photoId },
            data: {
              lien_high: lienHigh,
              lien_low: generateLowRes ? lienLow : existingPhoto.lien_low,
              alt: itemAlt,
              largeur: width,
              hauteur: height,
              afficher: isPublished,
              derniere_modification: new Date(),
              ...(photoDate && { date: photoDate }),
            },
          });

          uploadedPhotos.push(updatedPhoto);

          // ====== SUPPRESSION DES ANCIENNES IMAGES DE CLOUDINARY ======
          const deletionPromises = [];

          // Une nouvelle image HR a toujours été uploadée dans ce bloc.
          if (oldPublicIdHigh) {
            console.log(
              `🗑️ Programmation suppression ancienne image HR: ${oldPublicIdHigh}`
            );
            deletionPromises.push(deleteFromCloudinary(oldPublicIdHigh));

            // Supprimer l'ancienne image originale
            deletionPromises.push(
              deleteOriginalFromCloudinary(oldPublicIdHigh)
            );
          }

          // Si une nouvelle image BR a été générée et qu'une ancienne existait.
          if (
            generateLowRes &&
            oldPublicIdLow &&
            oldPublicIdLow !== oldPublicIdHigh
          ) {
            console.log(
              `🗑️ Programmation suppression ancienne image BR: ${oldPublicIdLow}`
            );
            deletionPromises.push(deleteFromCloudinary(oldPublicIdLow));
          }

          if (deletionPromises.length > 0) {
            console.log(
              `Exécution de ${deletionPromises.length} suppression(s) sur Cloudinary...`
            );
            const results = await Promise.allSettled(deletionPromises);
            results.forEach((result) => {
              if (result.status === "rejected") {
                console.error(
                  `⚠️ Erreur lors de la suppression d'une image Cloudinary:`,
                  result.reason
                );
              } else {
                console.log(
                  `✓ Une ancienne image a été supprimée avec succès.`
                );
              }
            });
            console.log("🗑️ Suppression des anciennes images terminée.");
          } else {
            console.log(
              "ℹ️ Aucune nouvelle image uploadée, conservation des images existantes."
            );
          }

          // Revalider les chemins
          revalidatePath("/creations/photos");
          revalidatePath(`/creations/photos/${photoId}/edit`);

          return { success: true, mode: "update" };
        }

        uploadedPhotos.push({
          lien_high: lienHigh,
          lien_low: lienLow,
          largeur: width,
          hauteur: height,
          alt: itemAlt,
          afficher: isPublished,
          date: new Date(),
          derniere_modification: new Date(),
        });
      } catch (error) {
        console.error("Erreur lors du traitement de l'image:", error);
        throw error;
      }
    }

    // Enregistrer les métadonnées dans la base de données pour chaque photo uploadée
    if (uploadedPhotos.length > 0) {
      await Promise.all(
        uploadedPhotos.map(async (photoData) => {
          const photo = await prisma.photos.create({
            data: {
              lien_high: photoData.lien_high,
              lien_low: photoData.lien_low,
              largeur: photoData.largeur,
              hauteur: photoData.hauteur,
              alt: photoData.alt,
              afficher: photoData.afficher,
              date: photoData.date,
              derniere_modification: photoData.derniere_modification,
            },
          });

          // Gérer les tags de recherche
          if (tagsRecherche && tagsRecherche.length > 0) {
            for (const tagId of tagsRecherche) {
              await prisma.photos_tags_recherche_link.create({
                data: {
                  id_pho: photo.id_pho,
                  id_tags: parseInt(tagId.toString()),
                },
              });
            }
          }

          // Gérer les tags normaux
          if (tags && tags.length > 0) {
            for (const tagId of tags) {
              await prisma.photos_tags_link.create({
                data: {
                  id_pho: photo.id_pho,
                  id_tags: parseInt(tagId.toString()),
                },
              });
            }
          }

          // Gérer les albums
          if (albums && albums.length > 0) {
            for (const albumId of albums) {
              await prisma.photos_albums_link.create({
                data: {
                  id_pho: photo.id_pho,
                  id_alb: parseInt(albumId.toString()),
                },
              });
            }
          }
        })
      );
    }

    revalidatePath("/creations/photos");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'upload par lot des photos:", error);
    throw error;
  }
}

// Helper pour supprimer l'ancienne couverture d'album
async function deleteAlbumCover(coverUrl: string): Promise<void> {
  try {
    if (coverUrl) {
      const publicId = extractPublicIdFromUrl(coverUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId);
        console.log(`Ancienne couverture supprimée: ${publicId}`);
      }
    }
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'ancienne couverture:",
      error
    );
  }
}

// Helper pour supprimer l'image originale basée sur le public_id des images transformées
async function deleteOriginalFromCloudinary(
  publicId: string
): Promise<boolean> {
  try {
    console.log(`🐛 Public ID reçu: ${publicId}`);

    // Le publicId contient déjà le chemin complet, exemple: "portfolio/photos/img_1751614573663_cfu1nxit3_high"
    let originalPublicId = "";

    if (publicId.includes("portfolio/photos/")) {
      // Extraire le nom de base (sans _high ou _low)
      const baseName = publicId.replace(/_high$|_low$/, "");

      // Remplacer portfolio/photos/ par portfolio/photos/originals/
      originalPublicId = baseName.replace(
        "portfolio/photos/",
        "portfolio/photos/originals/"
      );
    } else {
      // Cas où on n'a que le nom de fichier
      const baseName = publicId.replace(/_high$|_low$/, "");
      originalPublicId = `portfolio/photos/originals/${baseName}`;
    }

    console.log(
      `🗑️ Tentative de suppression de l'image originale: ${originalPublicId}`
    );

    const result = await deleteFromCloudinary(originalPublicId);
    if (result) {
      console.log(`✓ Image originale supprimée: ${originalPublicId}`);
    } else {
      console.log(`⚠️ Image originale non trouvée: ${originalPublicId}`);
    }
    return result;
  } catch (error) {
    console.warn(
      `⚠️ Erreur lors de la suppression de l'image originale:`,
      error
    );
    return false;
  }
}
