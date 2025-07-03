"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { isValidDate } from "@/lib/utils";

// Helper pour sauvegarder une image via l'API du portfolio
async function saveImage(file: File): Promise<string> {
  // Au début de votre fonction saveImage
  console.log("URL API:", process.env.PORTFOLIO_API_URL);
  console.log("Token présent:", !!process.env.PORTFOLIO_API_TOKEN);
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer un FormData pour l'upload
    const formData = new FormData();
    formData.append("image", new Blob([buffer]), file.name);

    // URL de votre portfolio (à ajuster selon votre configuration)
    const portfolioUrl =
      process.env.PORTFOLIO_API_URL ||
      "https://portfolio.srv892985.hstgr.cloud:3000";
    const apiUrl = `${portfolioUrl}/api/actions/journal-personnel`;
    console.log("Tentative d'upload vers:", apiUrl);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PORTFOLIO_API_TOKEN}`,
      },
      body: formData,
    });

    // Vérifiez le type de contenu de la réponse
    const contentType = response.headers.get("content-type");
    console.log("Type de contenu reçu:", contentType);

    // Si ce n'est pas du JSON, affichez le texte reçu pour le débogage
    if (!contentType || !contentType.includes("application/json")) {
      const textResponse = await response.text();
      console.error("Réponse non-JSON reçue:", textResponse.substring(0, 500));
      throw new Error("La réponse n'est pas au format JSON");
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Échec de l'upload: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Erreur lors de l'upload de l'image:", error);
    throw new Error(
      `Erreur d'upload: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Récupérer toutes les entrées du journal
export async function getAllJournalEntriesAction() {
  try {
    const entries = await prisma.experiences.findMany({
      where: {
        afficher: true,
      },
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
        imageUrl = await saveImage(imageFile);
      }
    } else if (mediaType === "youtube") {
      imageUrl = formData.get("url_img")?.toString() || "";
    }

    // Créer l'entrée de journal
    const entry = await prisma.experiences.create({
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        // Utiliser 'date' au lieu de 'date_debut'
        date: dateValue || new Date(), // Utiliser la date validée
        url_img: imageUrl,
        position_img: formData.get("position_img")?.toString() || "centre",
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

    // Traiter selon le type de média
    if (mediaType === "image") {
      const imageFile = formData.get("image") as File;
      if (imageFile && imageFile.size > 0) {
        imageUrl = await saveImage(imageFile);
      }
    } else if (mediaType === "youtube") {
      imageUrl = formData.get("url_img")?.toString() || "";
    } else if (mediaType === "none") {
      imageUrl = "";
    }

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
    // Mettre à jour l'entrée avec la date correctement formatée
    await prisma.experiences.update({
      where: { id_exp: id },
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        date: dateValue, // Utiliser la date validée
        url_img: imageUrl,
        position_img: formData.get("position_img")?.toString() || "centre",
        afficher: formData.get("afficher") === "on",
      },
    });

    revalidatePath("/journal-personnel");
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
    await prisma.experiences.delete({
      where: { id_exp: id },
    });
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
