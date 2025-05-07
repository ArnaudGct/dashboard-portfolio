"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

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
      process.env.PORTFOLIO_API_URL || "http://localhost:3001";
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
    throw new Error(`Erreur d'upload: ${error.message}`);
  }
}

// Récupérer toutes les entrées du journal
export async function getAllJournalEntriesAction() {
  try {
    const entries = await prisma.experiences.findMany({
      where: {
        categorie: "personnel",
      },
      orderBy: [
        {
          date_debut: "desc",
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
        categorie: "personnel",
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

    // Traiter selon le type de média
    if (mediaType === "image") {
      const imageFile = formData.get("image") as File;
      console.log("Image file reçu:", !!imageFile);
      console.log("Taille de l'image:", imageFile?.size || "Non disponible");

      if (imageFile && imageFile.size > 0) {
        imageUrl = await saveImage(imageFile);
        console.log("Image uploadée avec succès:", imageUrl);
      } else {
        console.warn("Type média 'image' spécifié mais aucun fichier trouvé");
      }
    } else if (mediaType === "youtube") {
      // Récupérer l'URL YouTube
      imageUrl = formData.get("url_img")?.toString() || "";
      console.log("URL YouTube détectée:", imageUrl);
    }
    // Si mediaType est "none", imageUrl reste vide

    // Créer l'entrée de journal
    const entry = await prisma.experiences.create({
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        date_debut: formData.get("date_debut")?.toString() || "",
        date_fin: formData.get("date_fin")?.toString() || "",
        url_img: imageUrl, // Utiliser l'URL déterminée ci-dessus
        position_img: formData.get("position_img")?.toString() || "centre",
        position: formData.get("position")?.toString() || "left",
        categorie: formData.get("categorie")?.toString() || "personnel",
        img_logo: formData.get("img_logo")?.toString() || "",
        nom_entreprise: formData.get("nom_entreprise")?.toString() || "",
        url_entreprise: formData.get("url_entreprise")?.toString() || "",
        type_emploi: formData.get("type_emploi")?.toString() || "",
        poste_actuel: formData.get("poste_actuel") === "on" ? 1 : 0,
        afficher: formData.get("afficher") === "on",
      },
    });

    revalidatePath("/journal-personnel");
    return { success: true, id: entry.id_exp };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'entrée de journal:", error);
    return { success: false, error: error.message };
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
    let imageUrl = existingEntry.url_img; // Valeur par défaut

    // Traiter selon le type de média
    if (mediaType === "image") {
      // Cas d'une image uploadée
      const imageFile = formData.get("image") as File;
      if (imageFile && imageFile.size > 0) {
        imageUrl = await saveImage(imageFile);
        console.log("Image mise à jour avec succès:", imageUrl);
      }
    } else if (mediaType === "youtube") {
      // Cas d'une URL YouTube
      imageUrl = formData.get("url_img")?.toString() || "";
      console.log("URL YouTube mise à jour:", imageUrl);
    } else if (mediaType === "none") {
      // Cas où on ne veut pas de média
      imageUrl = "";
    }

    // Mettre à jour l'entrée
    await prisma.experiences.update({
      where: { id_exp: id },
      data: {
        // Les champs restent identiques, seul imageUrl change
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        date_debut: formData.get("date_debut")?.toString() || "",
        date_fin: formData.get("date_fin")?.toString() || "",
        url_img: imageUrl,
        position_img: formData.get("position_img")?.toString() || "centre",
        position: formData.get("position")?.toString() || "left",
        categorie: formData.get("categorie")?.toString() || "personnel",
        img_logo: formData.get("img_logo")?.toString() || "",
        nom_entreprise: formData.get("nom_entreprise")?.toString() || "",
        url_entreprise: formData.get("url_entreprise")?.toString() || "",
        type_emploi: formData.get("type_emploi")?.toString() || "",
        poste_actuel: formData.get("poste_actuel") === "on" ? 1 : 0,
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
    return { success: false, error: error.message };
  }
}

// Supprimer une entrée de journal
export async function deleteJournalEntryAction(id: number) {
  try {
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
    return { success: false, error: error.message };
  }
}
