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

    // Vérifier si on veut afficher sur l'accueil et si la limite de 4 n'est pas atteinte
    let afficherAccueil = formData.get("afficherAccueil") === "on";

    if (afficherAccueil) {
      const videosAccueil = await prisma.videos.count({
        where: { afficher_accueil: true },
      });
      if (videosAccueil >= 4) {
        afficherAccueil = false; // Ne pas dépasser la limite de 4
      }
    }

    // Déterminer l'ordre d'accueil : si la vidéo est épinglée, placer à la fin
    let ordreAccueilValue = 0;
    if (afficherAccueil) {
      const maxOrder = await prisma.videos.aggregate({
        where: { afficher_accueil: true, afficher: true },
        _max: { ordre_accueil: true },
      });
      ordreAccueilValue = (maxOrder._max.ordre_accueil ?? 0) + 1;
    }

    const video = await prisma.videos.create({
      data: {
        titre: formData.get("title")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        lien: formData.get("url")?.toString() || "",
        duree: formData.get("duree")?.toString() || "",
        date: dateValue || new Date(), // Utiliser la date actuelle si aucune date n'est fournie
        ordre_accueil: ordreAccueilValue,
        afficher_accueil: afficherAccueil,
        afficher: formData.get("isPublished") === "on", // MySQL utilise 0/1 pour les booléens
        derniere_modification: new Date(),
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
              important: false, // Par défaut, les tags créés automatiquement ne sont pas importants
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

    // Vérifier si on veut afficher sur l'accueil
    let afficherAccueil = formData.get("afficherAccueil") === "on";

    // Récupérer l'état actuel de la vidéo (incluant ordre)
    const currentVideo = await prisma.videos.findUnique({
      where: { id_vid: videoId },
      select: { afficher_accueil: true, ordre_accueil: true },
    });

    // Si on active l'affichage accueil et ce n'était pas déjà activé, vérifier la limite
    if (afficherAccueil && !currentVideo?.afficher_accueil) {
      const videosAccueil = await prisma.videos.count({
        where: { afficher_accueil: true },
      });
      if (videosAccueil >= 4) {
        afficherAccueil = false; // Ne pas dépasser la limite de 4
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      titre: formData.get("title")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      lien: formData.get("url")?.toString() || "",
      duree: formData.get("duree")?.toString() || "",
      date: dateValue || new Date(), // Utiliser la date actuelle si aucune date n'est fournie
      afficher_accueil: afficherAccueil,
      afficher: formData.get("isPublished") === "on",
      derniere_modification: new Date(),
    };

    // Gérer l'ordre d'accueil si on active/désactive l'affichage_accueil
    if (afficherAccueil && !currentVideo?.afficher_accueil) {
      // On active l'épinglage : placer à la fin
      const maxOrder = await prisma.videos.aggregate({
        where: { afficher_accueil: true, afficher: true },
        _max: { ordre_accueil: true },
      });
      updateData.ordre_accueil = (maxOrder._max.ordre_accueil ?? 0) + 1;
    } else if (!afficherAccueil && currentVideo?.afficher_accueil) {
      // On désactive l'épinglage : mettre à 0 et réajuster les autres
      const prevOrder = currentVideo.ordre_accueil ?? 0;
      updateData.ordre_accueil = 0;

      // Mettre à jour la vidéo d'abord
      await prisma.videos.update({
        where: { id_vid: videoId },
        data: updateData,
      });

      // Décrémenter les ordres des vidéos qui étaient après la vidéo désépinglée
      await prisma.videos.updateMany({
        where: {
          afficher_accueil: true,
          afficher: true,
          ordre_accueil: { gt: prevOrder },
        },
        data: {
          ordre_accueil: { decrement: 1 },
        },
      });

      revalidatePath("/creations/videos");
      return { success: true };
    }

    // 1. Mettre à jour la vidéo (cas standard ou activation épinglage)
    const video = await prisma.videos.update({
      where: { id_vid: videoId },
      data: updateData,
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
            important: false, // Par défaut, les tags créés automatiquement ne sont pas importants
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

// Action pour supprimer un tag
export async function deleteVideoTagAction(id: number) {
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

export async function updateVideoTagAction(
  id: number,
  title: string,
  important?: boolean
) {
  try {
    // Créer un objet de données à mettre à jour
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

    // Mettre à jour le tag
    await prisma.videos_tags.update({
      where: { id_tags: id },
      data: updateData,
    });

    revalidatePath("/creations/videos/tags");
    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);
    throw error;
  }
}

// Action pour créer un nouveau tag
export async function createVideoTagAction(
  title: string,
  important: boolean = false
) {
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

    // Créer le nouveau tag avec le paramètre important
    const newTag = await prisma.videos_tags.create({
      data: {
        titre: title,
        important: important,
      },
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

// Action pour épingler une vidéo à l'accueil
export async function pinVideoToHomeAction(videoId: number) {
  try {
    // Vérifier si la limite de 4 vidéos n'est pas atteinte (seulement les vidéos visibles)
    const videosAccueil = await prisma.videos.count({
      where: { afficher_accueil: true, afficher: true },
    });

    if (videosAccueil >= 4) {
      return {
        success: false,
        error: "La limite de 4 vidéos épinglées est atteinte",
      };
    }

    // Trouver l'ordre maximum actuel pour placer la nouvelle vidéo à la fin
    const maxOrder = await prisma.videos.aggregate({
      where: { afficher_accueil: true, afficher: true },
      _max: { ordre_accueil: true },
    });
    const newOrder = (maxOrder._max.ordre_accueil ?? 0) + 1;

    // Épingler la vidéo
    await prisma.videos.update({
      where: { id_vid: videoId },
      data: {
        afficher_accueil: true,
        ordre_accueil: newOrder,
        derniere_modification: new Date(),
      },
    });

    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'épinglage de la vidéo:", error);
    throw error;
  }
}

// Action pour désépingler une vidéo de l'accueil
export async function unpinVideoFromHomeAction(videoId: number) {
  try {
    // Récupérer l'ordre actuel de la vidéo
    const video = await prisma.videos.findUnique({
      where: { id_vid: videoId },
      select: { ordre_accueil: true },
    });

    await prisma.videos.update({
      where: { id_vid: videoId },
      data: {
        afficher_accueil: false,
        ordre_accueil: 0,
        derniere_modification: new Date(),
      },
    });

    // Réorganiser les ordres des vidéos restantes
    if (video?.ordre_accueil) {
      await prisma.videos.updateMany({
        where: {
          afficher_accueil: true,
          afficher: true,
          ordre_accueil: { gt: video.ordre_accueil },
        },
        data: {
          ordre_accueil: { decrement: 1 },
        },
      });
    }

    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors du désépinglage de la vidéo:", error);
    throw error;
  }
}

// Action pour récupérer les vidéos épinglées à l'accueil
export async function getPinnedVideosAction() {
  try {
    const videos = await prisma.videos.findMany({
      where: { afficher_accueil: true, afficher: true },
      select: {
        id_vid: true,
        titre: true,
        lien: true,
        duree: true,
        ordre_accueil: true,
      },
      orderBy: {
        ordre_accueil: "asc",
      },
    });

    return { success: true, videos };
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des vidéos épinglées:",
      error
    );
    throw error;
  }
}

// Action pour récupérer le nombre de vidéos épinglées
export async function getPinnedVideosCountAction() {
  try {
    const count = await prisma.videos.count({
      where: { afficher_accueil: true, afficher: true },
    });

    return { success: true, count };
  } catch (error) {
    console.error("Erreur lors du comptage des vidéos épinglées:", error);
    throw error;
  }
}

// Action pour réorganiser l'ordre des vidéos épinglées
export async function reorderPinnedVideosAction(
  videoId: number,
  direction: "up" | "down"
) {
  try {
    // Récupérer la vidéo actuelle
    const currentVideo = await prisma.videos.findUnique({
      where: { id_vid: videoId },
      select: { ordre_accueil: true },
    });

    if (!currentVideo) {
      return { success: false, error: "Vidéo non trouvée" };
    }

    const currentOrder = currentVideo.ordre_accueil;

    // Trouver la vidéo à échanger
    const targetVideo = await prisma.videos.findFirst({
      where: {
        afficher_accueil: true,
        afficher: true,
        ordre_accueil: direction === "up" ? currentOrder - 1 : currentOrder + 1,
      },
      select: { id_vid: true, ordre_accueil: true },
    });

    if (!targetVideo) {
      return {
        success: false,
        error: "Impossible de déplacer la vidéo dans cette direction",
      };
    }

    // Échanger les ordres
    await prisma.$transaction([
      prisma.videos.update({
        where: { id_vid: videoId },
        data: { ordre_accueil: targetVideo.ordre_accueil },
      }),
      prisma.videos.update({
        where: { id_vid: targetVideo.id_vid },
        data: { ordre_accueil: currentOrder },
      }),
    ]);

    revalidatePath("/creations/videos");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la réorganisation des vidéos:", error);
    throw error;
  }
}
