"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  uploadAutreImageToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";

// Action pour ajouter un projet
export async function addAutreAction(formData: FormData) {
  try {
    // Récupérer et traiter le fichier image
    const imageFile = formData.get("miniature") as File;
    let miniaturePath = "";

    if (imageFile && imageFile.size > 0) {
      console.log("Upload d'une nouvelle image d'autre projet...");
      const result = await uploadAutreImageToCloudinary(imageFile);
      miniaturePath = result.url;
      console.log("Image d'autre projet uploadée:", miniaturePath);
    }

    // Gérer correctement la date
    const dateStr = formData.get("date")?.toString();
    let dateValue: Date | undefined = undefined;

    if (dateStr && dateStr.trim() !== "") {
      dateValue = new Date(dateStr);
      if (isNaN(dateValue.getTime())) {
        dateValue = undefined;
      }
    }

    // 1. Créer le projet d'abord
    const projet = await prisma.autre.create({
      data: {
        titre: formData.get("title")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        miniature: miniaturePath,
        lien_github: formData.get("lien_github")?.toString() || "",
        lien_figma: formData.get("lien_figma")?.toString() || "",
        lien_site: formData.get("lien_site")?.toString() || "",
        categorie: "",
        tags: "",
        date: dateValue || new Date(),
        afficher: formData.get("isPublished") === "on",
        derniere_modification: new Date(),
      },
    });

    // 2. Récupérer les tags sélectionnés
    const selectedTags = formData.getAll("tags") as string[];

    // 3. Pour chaque tag sélectionné
    for (const tagId of selectedTags) {
      try {
        let tag = await prisma.autre_tags.findFirst({
          where: {
            titre: tagId,
          },
        });

        if (!tag) {
          tag = await prisma.autre_tags.create({
            data: {
              titre: tagId,
              important: false,
            },
          });
        }

        await prisma.autre_tags_link.create({
          data: {
            id_autre: projet.id_autre,
            id_tags: tag.id_tags,
          },
        });
      } catch (tagError) {
        console.error("Erreur lors du traitement du tag:", tagId, tagError);
      }
    }

    revalidatePath("/creations/autres");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du projet:", error);
    throw error;
  }
}

// Action pour mettre à jour un projet
export async function updateAutreAction(formData: FormData) {
  try {
    const projetId = parseInt(formData.get("id")?.toString() || "");

    if (isNaN(projetId)) {
      throw new Error("ID de projet invalide");
    }

    // Récupérer le projet existant pour obtenir le chemin actuel de l'image
    const existingProjet = await prisma.autre.findUnique({
      where: { id_autre: projetId },
    });

    if (!existingProjet) {
      throw new Error("Projet non trouvé");
    }

    // Vérifier s'il y a une nouvelle image
    const imageFile = formData.get("miniature") as File;
    let miniaturePath = existingProjet.miniature;

    // Sauvegarder l'ancien publicId pour suppression ultérieure
    const oldPublicId = existingProjet.miniature
      ? extractPublicIdFromUrl(existingProjet.miniature)
      : null;

    if (imageFile && imageFile.size > 0) {
      console.log("Upload d'une nouvelle image d'autre projet...");

      // Uploader la nouvelle image
      const result = await uploadAutreImageToCloudinary(imageFile);
      miniaturePath = result.url;
      console.log("Nouvelle image d'autre projet uploadée:", miniaturePath);

      // Supprimer l'ancienne image de Cloudinary si elle existe
      if (oldPublicId) {
        console.log(
          `Suppression de l'ancienne image autre projet: ${oldPublicId}`
        );
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Gérer correctement la date
    const dateStr = formData.get("date")?.toString();
    let dateValue: Date | undefined;

    if (dateStr) {
      dateValue = new Date(dateStr);
      if (isNaN(dateValue.getTime())) {
        dateValue = undefined;
      }
    }

    // 1. Mettre à jour le projet
    const projet = await prisma.autre.update({
      where: {
        id_autre: projetId,
      },
      data: {
        titre: formData.get("title")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        miniature: miniaturePath,
        lien_github: formData.get("lien_github")?.toString() || "",
        lien_figma: formData.get("lien_figma")?.toString() || "",
        lien_site: formData.get("lien_site")?.toString() || "",
        date: dateValue || new Date(),
        afficher: formData.get("isPublished") === "on",
        derniere_modification: new Date(),
      },
    });

    // 2. Gérer les tags
    // 2.1. Supprimer tous les liens existants
    await prisma.autre_tags_link.deleteMany({
      where: {
        id_autre: projetId,
      },
    });

    // 2.2. Récupérer les nouveaux tags sélectionnés
    const selectedTags = formData.getAll("tags") as string[];

    // 2.3. Créer de nouveaux liens pour chaque tag sélectionné
    for (const tagId of selectedTags) {
      let tag = await prisma.autre_tags.findFirst({
        where: {
          titre: tagId,
        },
      });

      if (!tag) {
        tag = await prisma.autre_tags.create({
          data: {
            titre: tagId,
            important: false,
          },
        });
      }

      await prisma.autre_tags_link.create({
        data: {
          id_autre: projetId,
          id_tags: tag.id_tags,
        },
      });
    }

    revalidatePath("/creations/autres");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    throw error;
  }
}

// Action pour supprimer un projet
export async function deleteAutreAction(projetId: number) {
  try {
    if (isNaN(projetId)) {
      throw new Error("ID de projet invalide");
    }

    // Récupérer le projet pour obtenir l'URL de l'image
    const projet = await prisma.autre.findUnique({
      where: { id_autre: projetId },
    });

    if (!projet) {
      throw new Error("Projet non trouvé");
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (projet.miniature) {
      const publicId = extractPublicIdFromUrl(projet.miniature);
      if (publicId) {
        console.log(`Suppression de l'image autre projet: ${publicId}`);
        await deleteFromCloudinary(publicId);
      }
    }

    // 1. Supprimer d'abord tous les liens vers les tags
    await prisma.autre_tags_link.deleteMany({
      where: {
        id_autre: projetId,
      },
    });

    // 2. Supprimer le projet lui-même
    await prisma.autre.delete({
      where: {
        id_autre: projetId,
      },
    });

    revalidatePath("/creations/autres");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    throw error;
  }
}

// Action pour mettre à jour un tag
export async function updateAutreTagAction(
  id: number,
  title: string,
  important: boolean = false
) {
  try {
    await prisma.autre_tags.update({
      where: { id_tags: id },
      data: {
        titre: title,
        important: important,
      },
    });

    revalidatePath("/creations/autres/tags");
    revalidatePath("/creations/autres");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);
    throw error;
  }
}

// Action pour supprimer un tag
export async function deleteAutreTagAction(id: number) {
  try {
    await prisma.autre_tags_link.deleteMany({
      where: { id_tags: id },
    });

    await prisma.autre_tags.delete({
      where: { id_tags: id },
    });

    revalidatePath("/creations/autres/tags");
    revalidatePath("/creations/autres");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du tag:", error);
    throw error;
  }
}

// Action pour créer un nouveau tag
export async function createAutreTagAction(
  title: string,
  important: boolean = false
) {
  try {
    const existingTag = await prisma.autre_tags.findFirst({
      where: { titre: title },
    });

    if (existingTag) {
      return {
        success: false,
        error: "Ce tag existe déjà",
        tag: existingTag,
      };
    }

    const newTag = await prisma.autre_tags.create({
      data: {
        titre: title,
        important: important,
      },
    });

    revalidatePath("/creations/autres/tags");
    revalidatePath("/creations/autres");

    return {
      success: true,
      tag: newTag,
    };
  } catch (error) {
    console.error("Erreur lors de la création du tag:", error);
    throw error;
  }
}
