"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { isValidDate } from "@/lib/utils";
import {
  uploadJournalImageToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";

// Récupérer toutes les entrées du journal
export async function getAllJournalEntriesAction() {
  try {
    const entries = await prisma.experiences.findMany({
      orderBy: [
        {
          date: "desc",
        },
      ],
    });

    return entries;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des entrées de journal:",
      error
    );
    throw error;
  }
}

// Récupérer une entrée de journal par son ID
export async function getJournalEntryByIdAction(id: number) {
  try {
    const entry = await prisma.experiences.findUnique({
      where: {
        id_exp: id,
        afficher: true,
      },
    });

    return entry;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de l'entrée de journal:",
      error
    );
    throw error;
  }
}

// Ajouter une entrée de journal
export async function addJournalEntryAction(formData: FormData) {
  try {
    const mediaType = formData.get("media_type")?.toString();
    let imageUrl = "";

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

    // Traiter selon le type de média
    if (mediaType === "image") {
      const imageFile = formData.get("image") as File;
      if (imageFile && imageFile.size > 0) {
        console.log("Upload d'une nouvelle image de journal...");
        const result = await uploadJournalImageToCloudinary(imageFile);
        imageUrl = result.url;
        console.log("Image de journal uploadée:", imageUrl);
      }
    } else if (mediaType === "youtube") {
      imageUrl = formData.get("url_img")?.toString() || "";
    }

    // Récupérer les données de crédit
    const creditNom = formData.get("credit_nom")?.toString() || "";
    const creditUrl = formData.get("credit_url")?.toString() || "";

    // Créer l'entrée de journal
    const entry = await prisma.experiences.create({
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        date: dateValue || new Date(),
        url_img: imageUrl,
        position_img: formData.get("position_img")?.toString() || "centre",
        credit_nom: creditNom,
        credit_url: creditUrl,
        afficher: formData.get("afficher") === "on",
      },
    });

    revalidatePath("/journal-personnel");
    return { success: true, id: entry.id_exp };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'entrée de journal:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue s'est produite";
    return { success: false, error: errorMessage };
  }
}

// Mettre à jour une entrée de journal
export async function updateJournalEntryAction(formData: FormData) {
  try {
    const id = parseInt(formData.get("id")?.toString() || "0");

    if (!id) {
      throw new Error("ID manquant");
    }

    // Récupérer l'entrée existante
    const existingEntry = await prisma.experiences.findUnique({
      where: { id_exp: id },
    });

    if (!existingEntry) {
      throw new Error("Entrée de journal non trouvée");
    }

    const mediaType = formData.get("media_type")?.toString();
    let imageUrl = existingEntry.url_img;

    // Sauvegarder l'ancien publicId pour suppression ultérieure
    const oldPublicId = existingEntry.url_img
      ? extractPublicIdFromUrl(existingEntry.url_img)
      : null;

    // Traiter selon le type de média
    if (mediaType === "image") {
      const imageFile = formData.get("image") as File;
      if (imageFile && imageFile.size > 0) {
        console.log("Upload d'une nouvelle image de journal...");

        // Uploader la nouvelle image
        const result = await uploadJournalImageToCloudinary(imageFile);
        imageUrl = result.url;
        console.log("Nouvelle image de journal uploadée:", imageUrl);

        // Supprimer l'ancienne image de Cloudinary si elle existe
        if (oldPublicId) {
          console.log(
            `Suppression de l'ancienne image journal: ${oldPublicId}`
          );
          await deleteFromCloudinary(oldPublicId);
        }
      }
    } else if (mediaType === "youtube") {
      const newImageUrl = formData.get("url_img")?.toString() || "";

      // Si on change vers YouTube et qu'une image existait, la supprimer
      if (oldPublicId && newImageUrl !== existingEntry.url_img) {
        console.log(`Suppression de l'ancienne image journal: ${oldPublicId}`);
        await deleteFromCloudinary(oldPublicId);
      }

      imageUrl = newImageUrl;
    } else if (mediaType === "none") {
      // Supprimer l'image existante si on passe à "aucun média"
      if (oldPublicId) {
        console.log(`Suppression de l'ancienne image journal: ${oldPublicId}`);
        await deleteFromCloudinary(oldPublicId);
      }
      imageUrl = "";
    }

    const dateStr = formData.get("date")?.toString();
    let dateValue: Date | undefined;

    if (dateStr) {
      dateValue = new Date(dateStr);
      if (isNaN(dateValue.getTime())) {
        dateValue = undefined;
      }
    }

    // Récupérer les données de crédit
    const creditNom = formData.get("credit_nom")?.toString() || "";
    const creditUrl = formData.get("credit_url")?.toString() || "";

    // Mettre à jour l'entrée
    await prisma.experiences.update({
      where: { id_exp: id },
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        date: dateValue,
        url_img: imageUrl,
        position_img: formData.get("position_img")?.toString() || "centre",
        credit_nom: creditNom,
        credit_url: creditUrl,
        afficher: formData.get("afficher") === "on",
      },
    });

    revalidatePath("/journal-personnel");
    return { success: true };
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'entrée de journal:",
      error
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue s'est produite";
    return { success: false, error: errorMessage };
  }
}

// Supprimer une entrée de journal
export async function deleteJournalEntryAction(id: number) {
  try {
    // Récupérer l'entrée pour obtenir l'URL de l'image
    const entry = await prisma.experiences.findUnique({
      where: { id_exp: id },
    });

    if (!entry) {
      throw new Error("Entrée de journal non trouvée");
    }

    // Supprimer l'image de Cloudinary si elle existe
    if (entry.url_img) {
      const publicId = extractPublicIdFromUrl(entry.url_img);
      if (publicId) {
        console.log(`Suppression de l'image journal: ${publicId}`);
        await deleteFromCloudinary(publicId);
      }
    }

    // Supprimer l'entrée de la base de données
    await prisma.experiences.delete({
      where: { id_exp: id },
    });

    revalidatePath("/journal-personnel");
    return { success: true };
  } catch (error) {
    console.error(
      "Erreur lors de la suppression de l'entrée de journal:",
      error
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue s'est produite";
    return { success: false, error: errorMessage };
  }
}
