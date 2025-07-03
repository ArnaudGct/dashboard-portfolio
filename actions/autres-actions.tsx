"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import fs from "fs";
import path from "path";

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
    const apiUrl = `${portfolioUrl}/api/actions/creations/autres`;
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Erreur d'upload: ${errorMessage}`);
  }
}

// Action pour ajouter un projet
export async function addAutreAction(formData: FormData) {
  try {
    // Récupérer et traiter le fichier image
    const imageFile = formData.get("miniature") as File;
    let miniaturePath = "";

    if (imageFile && imageFile.size > 0) {
      // Utiliser l'API d'upload au lieu de sauvegarder localement
      miniaturePath = await saveImage(imageFile);
    }

    // Gérer correctement la date
    const dateStr = formData.get("date")?.toString();
    let dateValue: Date | undefined = undefined;

    if (dateStr && dateStr.trim() !== "") {
      // Convertir YYYY-MM-DD en objet Date complet
      dateValue = new Date(dateStr);
      // S'assurer qu'il s'agit d'une date valide
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
        categorie: "", // À remplir si nécessaire
        tags: "", // Le champ tags texte n'est pas utilisé directement
        date: dateValue || new Date(), // Utiliser la date actuelle comme valeur par défaut
        afficher: formData.get("isPublished") === "on",
      },
    });

    // 2. Récupérer les tags sélectionnés
    const selectedTags = formData.getAll("tags") as string[];

    // 3. Pour chaque tag sélectionné
    for (const tagId of selectedTags) {
      try {
        // 3.1 D'abord, essayer de trouver le tag
        let tag = await prisma.autre_tags.findFirst({
          where: {
            titre: tagId,
          },
        });

        // Si le tag n'existe pas, le créer
        if (!tag) {
          tag = await prisma.autre_tags.create({
            data: {
              titre: tagId,
              important: false,
            },
          });
        }

        // 3.2 Créer le lien entre le projet et le tag
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

    if (imageFile && imageFile.size > 0) {
      // Utiliser l'API d'upload pour la nouvelle image
      miniaturePath = await saveImage(imageFile);
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
        date: dateValue || new Date(), // Utiliser la date actuelle comme valeur par défaut
        afficher: formData.get("isPublished") === "on",
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
      // Vérifier si le tag existe
      let tag = await prisma.autre_tags.findFirst({
        where: {
          titre: tagId,
        },
      });

      // Créer le tag s'il n'existe pas
      if (!tag) {
        tag = await prisma.autre_tags.create({
          data: {
            titre: tagId,
            important: false,
          },
        });
      }

      // Créer le lien entre le projet et le tag
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
    // Vérifier si l'ID est valide
    if (isNaN(projetId)) {
      throw new Error("ID de projet invalide");
    }

    // Récupérer le projet pour obtenir le chemin de l'image
    const projet = await prisma.autre.findUnique({
      where: { id_autre: projetId },
    });

    if (!projet) {
      throw new Error("Projet non trouvé");
    }

    // Sauvegarder le chemin de l'image pour la supprimer après
    const imagePath = projet.miniature;

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

    // 3. Supprimer l'image si elle existe
    if (imagePath) {
      try {
        // Images stockées sur le portfolio (API externe)
        if (imagePath.startsWith("/uploads/")) {
          console.log(
            "Image stockée sur le portfolio, envoi de requête de suppression..."
          );

          // URL de votre portfolio avec la nouvelle API combinée
          const portfolioUrl =
            process.env.PORTFOLIO_API_URL ||
            "https://portfolio.srv892985.hstgr.cloud:3000";
          const deleteUrl = `${portfolioUrl}/api/actions/creations/autres`;

          // Envoyer une requête pour supprimer le fichier distant
          await fetch(deleteUrl, {
            method: "DELETE", // Utiliser DELETE au lieu de POST
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.PORTFOLIO_API_TOKEN}`,
            },
            body: JSON.stringify({
              imagePath: imagePath,
            }),
          });

          console.log("Requête de suppression envoyée");
        }
        // Images stockées localement (fallback mode)
        else if (!imagePath.startsWith("http")) {
          console.log("Image stockée localement, suppression du fichier...");

          // Construire le chemin complet vers le fichier
          const localImagePath = path.join(process.cwd(), "public", imagePath);

          if (fs.existsSync(localImagePath)) {
            console.log(`Suppression du fichier: ${localImagePath}`);
            fs.unlinkSync(localImagePath);
          } else {
            console.log(`Fichier non trouvé: ${localImagePath}`);
          }
        } else {
          console.log("Image externe, pas de suppression nécessaire");
        }
      } catch (imageError) {
        console.error("Erreur lors de la suppression de l'image:", imageError);
      }
    }

    // 4. Revalider le chemin pour mettre à jour la liste des projets
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
  important: boolean = false // Valeur par défaut pour compatibilité
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
    // 1. Supprimer tous les liens entre ce tag et des projets
    await prisma.autre_tags_link.deleteMany({
      where: { id_tags: id },
    });

    // 2. Supprimer le tag lui-même
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
  important: boolean = false // Valeur par défaut
) {
  try {
    // Vérifier si le tag existe déjà (pour éviter les doublons)
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

    // Créer le nouveau tag
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
