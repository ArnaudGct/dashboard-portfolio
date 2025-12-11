"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Récupérer une FAQ par son ID
export async function getFaqByIdAction(id: number) {
  try {
    const faq = await prisma.faq.findUnique({
      where: { id_faq: id },
    });
    return faq;
  } catch (error) {
    console.error("Erreur lors de la récupération de la FAQ:", error);
    throw error;
  }
}

// Mettre à jour une FAQ
export async function updateFaqAction(formData: FormData) {
  try {
    const id = parseInt(formData.get("id")?.toString() || "0");
    if (!id) {
      throw new Error("ID manquant");
    }

    const titre = formData.get("titre")?.toString();
    const contenu = formData.get("contenu")?.toString();
    const afficher = formData.get("afficher") === "on";

    if (!titre || !contenu) {
      return { success: false, error: "Le titre et le contenu sont requis." };
    }

    await prisma.faq.update({
      where: { id_faq: id },
      data: {
        titre,
        contenu,
        afficher,
      },
    });

    revalidatePath("/accueil/faq");
    revalidatePath(`/accueil/faq/edit/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la FAQ:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue s'est produite";
    return { success: false, error: errorMessage };
  }
}

// Ajouter une FAQ
export async function addFaqAction(formData: FormData) {
  try {
    const titre = formData.get("titre")?.toString();
    const contenu = formData.get("contenu")?.toString();
    const afficher = formData.get("afficher") === "on";

    if (!titre || !contenu) {
      return { success: false, error: "Le titre et le contenu sont requis." };
    }

    // Trouver l'ordre maximum pour placer la nouvelle FAQ à la fin
    const maxOrder = await prisma.faq.aggregate({
      where: { afficher },
      _max: { ordre: true },
    });
    const newOrder = (maxOrder._max.ordre ?? 0) + 1;

    await prisma.faq.create({
      data: {
        titre,
        contenu,
        ordre: newOrder,
        afficher,
      },
    });

    revalidatePath("/accueil/faq");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de la FAQ:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue s'est produite";
    return { success: false, error: errorMessage };
  }
}

// Supprimer une FAQ
export async function deleteFaqAction(id: number) {
  try {
    if (!id) {
      throw new Error("ID manquant");
    }

    // Récupérer l'ordre actuel de la FAQ
    const faq = await prisma.faq.findUnique({
      where: { id_faq: id },
      select: { ordre: true, afficher: true },
    });

    await prisma.faq.delete({
      where: { id_faq: id },
    });

    // Réorganiser les ordres des FAQ restantes dans le même groupe
    if (faq) {
      await prisma.faq.updateMany({
        where: {
          afficher: faq.afficher,
          ordre: { gt: faq.ordre },
        },
        data: {
          ordre: { decrement: 1 },
        },
      });
    }

    revalidatePath("/accueil/faq");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de la FAQ:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue s'est produite";
    return { success: false, error: errorMessage };
  }
}

// Action pour réorganiser l'ordre des FAQ
export async function reorderFaqAction(
  faqId: number,
  direction: "up" | "down"
) {
  try {
    // Récupérer la FAQ actuelle
    const currentFaq = await prisma.faq.findUnique({
      where: { id_faq: faqId },
      select: { ordre: true, afficher: true },
    });

    if (!currentFaq) {
      return { success: false, error: "FAQ non trouvée" };
    }

    const currentOrder = currentFaq.ordre;

    // Trouver la FAQ voisine la plus proche (dans le même groupe visible/non visible)
    const targetFaq = await prisma.faq.findFirst({
      where: {
        afficher: currentFaq.afficher,
        ordre: direction === "up" ? { lt: currentOrder } : { gt: currentOrder },
      },
      orderBy: {
        ordre: direction === "up" ? "desc" : "asc",
      },
      select: { id_faq: true, ordre: true },
    });

    if (!targetFaq) {
      return {
        success: false,
        error: "Impossible de déplacer la FAQ dans cette direction",
      };
    }

    // Échanger les ordres
    await prisma.$transaction([
      prisma.faq.update({
        where: { id_faq: faqId },
        data: { ordre: targetFaq.ordre },
      }),
      prisma.faq.update({
        where: { id_faq: targetFaq.id_faq },
        data: { ordre: currentOrder },
      }),
    ]);

    revalidatePath("/accueil/faq");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la réorganisation des FAQ:", error);
    return { success: false, error: "Erreur lors de la réorganisation" };
  }
}

// Initialiser les ordres des FAQ si nécessaire
export async function initializeFaqOrder() {
  try {
    // Vérifier si les ordres sont déjà initialisés (pas tous à 0)
    const allZero = await prisma.faq.findFirst({
      where: { ordre: { not: 0 } },
    });

    if (allZero) {
      // Les ordres sont déjà initialisés
      return;
    }

    // Initialiser les ordres séparément pour les visibles et non visibles
    const visibles = await prisma.faq.findMany({
      where: { afficher: true },
      orderBy: { id_faq: "asc" },
    });

    const nonVisibles = await prisma.faq.findMany({
      where: { afficher: false },
      orderBy: { id_faq: "asc" },
    });

    // Mettre à jour les ordres
    const updates = [
      ...visibles.map((f, index) =>
        prisma.faq.update({
          where: { id_faq: f.id_faq },
          data: { ordre: index + 1 },
        })
      ),
      ...nonVisibles.map((f, index) =>
        prisma.faq.update({
          where: { id_faq: f.id_faq },
          data: { ordre: index + 1 },
        })
      ),
    ];

    await prisma.$transaction(updates);
  } catch (error) {
    console.error("Erreur lors de l'initialisation des ordres:", error);
  }
}
