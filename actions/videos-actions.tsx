"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";

export async function addVideoAction(formData: FormData) {
  try {
    // Gérer correctement la date
    const dateStr = formData.get("date")?.toString();
    let dateValue: Date | undefined;

    if (dateStr) {
      // Convertir YYYY-MM-DD en objet Date complet
      dateValue = new Date(dateStr);
      // S'assurer qu'il s'agit d'une date valide
      if (isNaN(dateValue.getTime())) {
        dateValue = undefined;
      }
    }

    const video = await prisma.videos.create({
      data: {
        titre: formData.get("title")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        lien: formData.get("url")?.toString() || "",
        duree: formData.get("duree")?.toString() || "",
        date: dateValue || new Date(), // Utiliser la date actuelle si aucune date n'est fournie
        media_webm: "", // Valeur par défaut ou à récupérer du formulaire
        media_mp4: "", // Valeur par défaut ou à récupérer du formulaire
        afficher_competences: "", // Valeur par défaut ou à récupérer du formulaire
        afficher: formData.get("isPublished") === "on", // MySQL utilise 0/1 pour les booléens
        derniere_modification: new Date(),
        tags: "", // Champ texte de tags, à utiliser si nécessaire
      },
    });

    // 2. Récupérer les tags sélectionnés
    const selectedTags = formData.getAll("tags") as string[];

    // 3. Pour chaque tag sélectionné
    for (const tagId of selectedTags) {
      try {
        // 3.1 D'abord, essayer de trouver le tag
        let tag;
        try {
          // Essayer de trouver le tag par son ID
          tag = await prisma.videos_tags.findFirst({
            where: {
              titre: tagId, // Rechercher par le titre au lieu de l'ID
            },
          });
        } catch (error) {
          console.log("Tag non trouvé, nous allons le créer, error:", error);
        }

        // Si le tag n'existe pas, le créer
        if (!tag) {
          tag = await prisma.videos_tags.create({
            data: {
              titre: tagId, // Utiliser le tagId comme titre
            },
          });
          console.log("Tag créé avec succès:", tag);
        }

        // 3.2 Créer le lien entre la vidéo et le tag
        await prisma.videos_tags_link.create({
          data: {
            id_vid: video.id_vid, // ID de la vidéo qu'on vient de créer
            id_tags: tag.id_tags, // ID du tag
          },
        });
      } catch (tagError) {
        console.error("Erreur lors du traitement du tag:", tagId, tagError);
      }
    }

    revalidatePath("/creations/videos");
  } catch (error) {
    console.error("Erreur lors de l'ajout de la vidéo:", error);
    throw error; // Retransmettre l'erreur pour la gérer dans l'interface utilisateur
  }
}

export async function updateVideoAction(formData: FormData) {
  try {
    const videoId = parseInt(formData.get("id")?.toString() || "");

    if (isNaN(videoId)) {
      throw new Error("ID de vidéo invalide");
    }

    // Gérer correctement la date
    const dateStr = formData.get("date")?.toString();
    let dateValue: Date | undefined;

    if (dateStr) {
      // Convertir YYYY-MM-DD en objet Date complet
      dateValue = new Date(dateStr);
      // S'assurer qu'il s'agit d'une date valide
      if (isNaN(dateValue.getTime())) {
        dateValue = undefined;
      }
    }

    // 1. Mettre à jour la vidéo
    const video = await prisma.videos.update({
      where: {
        id_vid: videoId,
      },
      data: {
        titre: formData.get("title")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        lien: formData.get("url")?.toString() || "",
        duree: formData.get("duree")?.toString() || "",
        date: dateValue || new Date(), // Utiliser la date actuelle si aucune date n'est fournie
        afficher: formData.get("isPublished") === "on",
        derniere_modification: new Date(),
      },
    });

    // 2. Gérer les tags
    // 2.1. Supprimer tous les liens existants
    await prisma.videos_tags_link.deleteMany({
      where: {
        id_vid: videoId,
      },
    });

    // 2.2. Récupérer les nouveaux tags sélectionnés
    const selectedTags = formData.getAll("tags") as string[];

    // 2.3. Créer de nouveaux liens pour chaque tag sélectionné
    for (const tagId of selectedTags) {
      // Vérifier si le tag existe
      let tag = await prisma.videos_tags.findFirst({
        where: {
          titre: tagId,
        },
      });

      // Créer le tag s'il n'existe pas
      if (!tag) {
        tag = await prisma.videos_tags.create({
          data: {
            titre: tagId,
          },
        });
      }

      // Créer le lien entre la vidéo et le tag
      await prisma.videos_tags_link.create({
        data: {
          id_vid: videoId,
          id_tags: tag.id_tags,
        },
      });
    }

    revalidatePath("/creations/videos");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la vidéo:", error);
    throw error;
  }
}

export async function deleteVideoAction(videoId: number) {
  try {
    // Vérifier si l'ID est valide
    if (isNaN(videoId)) {
      throw new Error("ID de vidéo invalide");
    }

    // 1. Supprimer d'abord tous les liens vers les tags
    await prisma.videos_tags_link.deleteMany({
      where: {
        id_vid: videoId,
      },
    });

    // 2. Supprimer la vidéo elle-même
    await prisma.videos.delete({
      where: {
        id_vid: videoId,
      },
    });

    // 3. Revalider le chemin pour mettre à jour la liste des vidéos
    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la vidéo:", error);
    throw error;
  }
}

// Action pour mettre à jour un tag
export async function updateTagAction(id: number, title: string) {
  try {
    await prisma.videos_tags.update({
      where: { id_tags: id },
      data: { titre: title },
    });

    revalidatePath("/creations/videos/tags");
    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);
    throw error;
  }
}

// Action pour supprimer un tag
export async function deleteTagAction(id: number) {
  try {
    // 1. Supprimer tous les liens entre ce tag et des vidéos
    await prisma.videos_tags_link.deleteMany({
      where: { id_tags: id },
    });

    // 2. Supprimer le tag lui-même
    await prisma.videos_tags.delete({
      where: { id_tags: id },
    });

    revalidatePath("/creations/videos/tags");
    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du tag:", error);
    throw error;
  }
}

// Action pour créer un nouveau tag
export async function createTagAction(title: string) {
  try {
    // Vérifier si le tag existe déjà (pour éviter les doublons)
    const existingTag = await prisma.videos_tags.findFirst({
      where: { titre: title },
    });

    if (existingTag) {
      return {
        success: false,
        error: "Ce tag existe déjà",
        tag: existingTag,
      };
    }

    // Créer le nouveau tag
    const newTag = await prisma.videos_tags.create({
      data: { titre: title },
    });

    revalidatePath("/creations/videos/tags");
    revalidatePath("/creations/videos");

    return {
      success: true,
      tag: newTag,
    };
  } catch (error) {
    console.error("Erreur lors de la création du tag:", error);
    throw error;
  }
}
