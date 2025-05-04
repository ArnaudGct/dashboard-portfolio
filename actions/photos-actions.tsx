"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

// Helper pour sauvegarder une image via l'API du portfolio
// Helper pour sauvegarder une image via l'API du portfolio
async function saveImage(
  file: File,
  type: "low" | "high" = "high"
): Promise<string> {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer un FormData pour l'upload
    const formData = new FormData();

    // Pour la version low-res, toujours appliquer l'optimisation
    if (type === "low") {
      // Activer le redimensionnement pour toutes les images en basse résolution
      formData.append("resize", "true");
      formData.append("maxWidth", "800");

      // Paramètres de qualité et compression
      if (file.type.includes("webp")) {
        // Pour les WebP, ne pas convertir mais optimiser quand même
        formData.append("optimize", "true");
        formData.append("quality", "75"); // Qualité légèrement meilleure pour WebP
      } else {
        // Pour les autres formats, convertir en WebP
        formData.append("optimize", "true");
        formData.append("convertToWebp", "true");
        formData.append("quality", "70");
      }
    }

    // Ajouter l'image avec le bon nom et type MIME
    const blob = new Blob([buffer], { type: file.type });
    formData.append("image", blob, file.name);
    formData.append("type", type);

    // Spécifier le chemin de destination
    formData.append("destination", "uploads/photos");

    // URL de votre portfolio
    const portfolioUrl =
      process.env.PORTFOLIO_API_URL || "http://localhost:3001";
    const apiUrl = `${portfolioUrl}/api/actions-creations/photos`;

    console.log(
      `Uploading to: ${apiUrl}, file type: ${file.type}, size: ${(file.size / 1024).toFixed(2)}KB, type: ${type}, isWebP: ${file.type.includes("webp")}`
    );

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PORTFOLIO_API_TOKEN}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || response.statusText;
      console.error("Réponse d'erreur API:", errorMessage);
      throw new Error(`Échec de l'upload: ${errorMessage}`);
    }

    const data = await response.json();
    console.log("Réponse de l'API:", data);

    return data.imageUrl;
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    throw new Error(`Erreur d'upload: ${error.message}`);
  }
}

// Action pour ajouter une photo
export async function addPhotoAction(formData: FormData) {
  try {
    // Récupérer les fichiers d'image
    const imageHighRes = formData.get("imageHigh") as File;
    const imageLowRes = (formData.get("imageLow") as File) || imageHighRes; // Si pas d'image basse résolution, utiliser la haute résolution

    let lienHigh = "";
    let lienLow = "";

    // Uploader les images si elles existent
    if (imageHighRes && imageHighRes.size > 0) {
      lienHigh = await saveImage(imageHighRes, "high");
    }

    if (imageLowRes && imageLowRes.size > 0) {
      lienLow = await saveImage(imageLowRes, "low");
    }

    // Récupérer les dimensions
    const largeur = parseInt(formData.get("largeur")?.toString() || "0");
    const hauteur = parseInt(formData.get("hauteur")?.toString() || "0");
    const alt = formData.get("alt")?.toString() || "";
    const afficher = formData.get("isPublished") === "on";

    // Créer la photo dans la base de données
    const photo = await prisma.photos.create({
      data: {
        lien_high: lienHigh,
        lien_low: lienLow,
        largeur,
        hauteur,
        alt,
        date_ajout: new Date(),
        afficher,
      },
    });

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

    // Gérer les images
    const imageHighRes = formData.get("imageHigh") as File;
    const imageLowRes = formData.get("imageLow") as File;

    let lienHigh = existingPhoto.lien_high;
    let lienLow = existingPhoto.lien_low;

    // Uploader les nouvelles images si elles existent
    if (imageHighRes && imageHighRes.size > 0) {
      lienHigh = await saveImage(imageHighRes, "high");
    }

    if (imageLowRes && imageLowRes.size > 0) {
      lienLow = await saveImage(imageLowRes, "low");
    }

    // Récupérer les dimensions
    const largeur =
      parseInt(formData.get("largeur")?.toString() || "0") ||
      existingPhoto.largeur;
    const hauteur =
      parseInt(formData.get("hauteur")?.toString() || "0") ||
      existingPhoto.hauteur;
    const alt = formData.get("alt")?.toString() || existingPhoto.alt;
    const afficher = formData.get("isPublished") === "on";

    // Mettre à jour la photo
    const photo = await prisma.photos.update({
      where: { id_pho: photoId },
      data: {
        lien_high: lienHigh,
        lien_low: lienLow,
        largeur,
        hauteur,
        alt,
        afficher,
      },
    });

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

    revalidatePath("/creations/photos");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la photo:", error);
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

    // Supprimer les images si elles existent
    if (photo.lien_high || photo.lien_low) {
      try {
        const portfolioUrl =
          process.env.PORTFOLIO_API_URL || "http://localhost:3001";
        const deleteUrl = `${portfolioUrl}/api/actions-creations/photos`;

        // Supprimer l'image haute résolution
        if (
          photo.lien_high &&
          (photo.lien_high.startsWith("/photos/") ||
            photo.lien_high.startsWith("/uploads/"))
        ) {
          await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.PORTFOLIO_API_TOKEN}`,
            },
            body: JSON.stringify({
              imagePath: photo.lien_high,
            }),
          });
        }

        // Supprimer l'image basse résolution
        if (
          photo.lien_low &&
          (photo.lien_low.startsWith("/photos/") ||
            photo.lien_low.startsWith("/uploads/")) &&
          photo.lien_low !== photo.lien_high
        ) {
          await fetch(deleteUrl, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.PORTFOLIO_API_TOKEN}`,
            },
            body: JSON.stringify({
              imagePath: photo.lien_low,
            }),
          });
        }
      } catch (imageError) {
        console.error("Erreur lors de la suppression des images:", imageError);
      }
    }

    revalidatePath("/creations/photos");
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
        description: description || null,
        date: date ? new Date(date) : null,
        afficher: isPublished,
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

    // Associer les images
    if (images.length > 0) {
      await Promise.all(
        images.map((imageId) =>
          prisma.photos_albums_link.create({
            data: {
              id_alb: newAlbum.id_alb,
              id_pho: parseInt(imageId),
            },
          })
        )
      );
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

    // Mettre à jour l'album
    await prisma.photos_albums.update({
      where: { id_alb: id },
      data: {
        titre: title,
        description: description || null,
        date: date ? new Date(date) : null,
        afficher: isPublished,
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

    // Gérer les images - supprimer toutes les associations existantes
    await prisma.photos_albums_link.deleteMany({
      where: { id_alb: id },
    });

    // Recréer les associations d'images
    if (images.length > 0) {
      await Promise.all(
        images.map((imageId) =>
          prisma.photos_albums_link.create({
            data: {
              id_alb: id,
              id_pho: parseInt(imageId),
            },
          })
        )
      );
    }

    revalidatePath("/creations/photos/albums");
    revalidatePath(`/creations/photos/albums/${id}/edit`);
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

    // Supprimer les relations de tags
    await prisma.photos_albums_tags_link.deleteMany({
      where: { id_alb: albumId },
    });

    // Supprimer les relations avec les photos
    // Note: Les photos ne sont pas supprimées, juste les liens avec l'album
    await prisma.photos_albums_link.deleteMany({
      where: { id_alb: albumId },
    });

    // Supprimer l'album
    await prisma.photos_albums.delete({
      where: { id_alb: albumId },
    });

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

    if (imageCount === 0) {
      throw new Error("Aucune image à traiter");
    }

    // Récupérer les métadonnées communes
    const isPublished = formData.get("isPublished") === "on";
    const tags = formData.getAll("tags");
    const tagsRecherche = formData.getAll("tagsRecherche");
    const albums = formData.getAll("albums");

    // Utiliser l'API du portfolio directement au lieu de stocker des fichiers localement
    const uploadedPhotos = [];

    for (let i = 0; i < imageCount; i++) {
      const photo = formData.get(`photo_${i}`) as File;
      if (!photo || !photo.size) continue;

      const alt = formData.get(`alt_${i}`)?.toString() || "";
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

        // Uploader l'image haute résolution - aucun traitement pour les WebP
        lienHigh = await saveImage(photo, "high");

        // Si generateLowRes est vrai, uploader aussi la version basse résolution
        // Pour WebP, nous allons appliquer uniquement le redimensionnement
        if (generateLowRes) {
          lienLow = await saveImage(photo, "low");
        }

        // Créer l'entrée dans la base de données
        const newPhoto = await prisma.photos.create({
          data: {
            lien_high: lienHigh,
            lien_low: generateLowRes ? lienLow : null,
            alt,
            largeur: width,
            hauteur: height,
            date_ajout: new Date(),
            afficher: isPublished,
          },
        });

        uploadedPhotos.push(newPhoto);

        // Associer les tags
        if (tags && tags.length > 0) {
          for (const tagId of tags) {
            await prisma.photos_tags_link.create({
              data: {
                id_pho: newPhoto.id_pho,
                id_tags: parseInt(tagId.toString()),
              },
            });
          }
        }

        // Associer les tags de recherche
        if (tagsRecherche && tagsRecherche.length > 0) {
          for (const tagId of tagsRecherche) {
            await prisma.photos_tags_recherche_link.create({
              data: {
                id_pho: newPhoto.id_pho,
                id_tags: parseInt(tagId.toString()),
              },
            });
          }
        }

        // Associer aux albums
        if (albums && albums.length > 0) {
          for (const albumId of albums) {
            await prisma.photos_albums_link.create({
              data: {
                id_pho: newPhoto.id_pho,
                id_alb: parseInt(albumId.toString()),
              },
            });
          }
        }
      } catch (error) {
        console.error(
          `Erreur lors de l'upload de l'image ${photo.name}:`,
          error
        );
        // Continuer avec les autres images en cas d'erreur sur une image
      }
    }

    // Revalider les chemins pour la mise à jour de l'interface
    revalidatePath("/creations/photos");
    revalidatePath("/creations/photos/albums");

    return { success: true, count: uploadedPhotos.length };
  } catch (error) {
    console.error("Erreur lors de l'upload batch des photos:", error);
    throw error;
  }
}

export async function removePhotoFromAlbumAction({
  photoId,
  albumId,
}: {
  photoId: number;
  albumId: number;
}) {
  try {
    // Vérifier si la photo existe dans l'album
    // Correction du nom de colonne: id_phot -> id_pho
    const existingLink = await prisma.photos_albums_link.findFirst({
      where: {
        id_pho: photoId, // Corrigé ici: id_phot -> id_pho
        id_alb: albumId,
      },
    });

    if (!existingLink) {
      throw new Error("Cette photo n'est pas dans cet album");
    }

    // Supprimer le lien entre la photo et l'album
    // La table ne semble pas avoir de clé primaire id_link, mais une clé composite (id_pho, id_alb)
    await prisma.photos_albums_link.delete({
      where: {
        id_pho_id_alb: {
          // Utiliser la syntaxe de clé composite de Prisma
          id_pho: photoId, // Corrigé ici: id_phot -> id_pho
          id_alb: albumId,
        },
      },
    });

    revalidatePath(`/creations/photos/albums`);
    revalidatePath(`/creations/photos/albums/${albumId}/edit`);
    revalidatePath(`/creations/photos/${photoId}/edit`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du retrait de la photo de l'album:", error);
    return {
      success: false,
      error: "Impossible de retirer la photo de l'album",
    };
  }
}
