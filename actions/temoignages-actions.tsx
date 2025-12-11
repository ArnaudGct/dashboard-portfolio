"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";

// Ajouter un témoignage
export async function addTemoignageAction(formData: FormData) {
  try {
    const client = formData.get("client")?.toString();
    const plateforme = formData.get("plateforme")?.toString() || "";
    const contenu = formData.get("contenu")?.toString();
    const afficher = formData.get("afficher") === "on";
    const date = formData.get("date")?.toString() || null;

    if (!client || !contenu) {
      return { success: false, error: "Tous les champs sont requis." };
    }

    // Trouver l'ordre maximum pour placer le nouveau témoignage à la fin
    const maxOrder = await prisma.temoignages.aggregate({
      where: { afficher },
      _max: { ordre: true },
    });
    const newOrder = (maxOrder._max.ordre ?? 0) + 1;

    await prisma.temoignages.create({
      data: {
        client,
        plateforme,
        contenu,
        ordre: newOrder,
        afficher,
        date,
      },
    });

    revalidatePath("/accueil/temoignages");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout du témoignage:", error);
    return { success: false, error: "Une erreur s'est produite." };
  }
}

// Mettre à jour un témoignage
export async function updateTemoignageAction(formData: FormData) {
  try {
    const id = parseInt(formData.get("id")?.toString() || "0");
    if (!id) throw new Error("ID manquant");

    const client = formData.get("client")?.toString();
    const plateforme = formData.get("plateforme")?.toString() || "";
    const contenu = formData.get("contenu")?.toString();
    const afficher = formData.get("afficher") === "on";
    const date = formData.get("date")?.toString() || "";

    if (!client || !contenu) {
      return { success: false, error: "Tous les champs sont requis." };
    }

    await prisma.temoignages.update({
      where: { id_tem: id },
      data: { client, plateforme, contenu, afficher, date },
    });

    revalidatePath("/accueil/temoignages");
    revalidatePath(`/accueil/temoignages/edit/${id}`);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du témoignage:", error);
    return { success: false, error: "Une erreur s'est produite." };
  }
}

// Supprimer un témoignage
export async function deleteTemoignageAction(id: number) {
  try {
    if (!id) throw new Error("ID manquant");

    // Récupérer l'ordre actuel du témoignage
    const temoignage = await prisma.temoignages.findUnique({
      where: { id_tem: id },
      select: { ordre: true, afficher: true },
    });

    await prisma.temoignages.delete({
      where: { id_tem: id },
    });

    // Réorganiser les ordres des témoignages restants dans le même groupe
    if (temoignage) {
      await prisma.temoignages.updateMany({
        where: {
          afficher: temoignage.afficher,
          ordre: { gt: temoignage.ordre },
        },
        data: {
          ordre: { decrement: 1 },
        },
      });
    }

    revalidatePath("/accueil/temoignages");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du témoignage:", error);
    return { success: false, error: "Une erreur s'est produite." };
  }
}

// Action pour réorganiser l'ordre des témoignages
export async function reorderTemoignageAction(
  temoignageId: number,
  direction: "up" | "down"
) {
  try {
    // Récupérer le témoignage actuel
    const currentTemoignage = await prisma.temoignages.findUnique({
      where: { id_tem: temoignageId },
      select: { ordre: true, afficher: true },
    });

    if (!currentTemoignage) {
      return { success: false, error: "Témoignage non trouvé" };
    }

    const currentOrder = currentTemoignage.ordre;

    // Trouver le témoignage voisin le plus proche (dans le même groupe visible/non visible)
    const targetTemoignage = await prisma.temoignages.findFirst({
      where: {
        afficher: currentTemoignage.afficher,
        ordre: direction === "up" ? { lt: currentOrder } : { gt: currentOrder },
      },
      orderBy: {
        ordre: direction === "up" ? "desc" : "asc",
      },
      select: { id_tem: true, ordre: true },
    });

    if (!targetTemoignage) {
      return {
        success: false,
        error: "Impossible de déplacer le témoignage dans cette direction",
      };
    }

    // Échanger les ordres
    await prisma.$transaction([
      prisma.temoignages.update({
        where: { id_tem: temoignageId },
        data: { ordre: targetTemoignage.ordre },
      }),
      prisma.temoignages.update({
        where: { id_tem: targetTemoignage.id_tem },
        data: { ordre: currentOrder },
      }),
    ]);

    revalidatePath("/accueil/temoignages");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la réorganisation des témoignages:", error);
    return { success: false, error: "Erreur lors de la réorganisation" };
  }
}

// Initialiser les ordres des témoignages si nécessaire
export async function initializeTemoignagesOrder() {
  try {
    // Vérifier si les ordres sont déjà initialisés (pas tous à 0)
    const allZero = await prisma.temoignages.findFirst({
      where: { ordre: { not: 0 } },
    });

    if (allZero) {
      // Les ordres sont déjà initialisés
      return;
    }

    // Initialiser les ordres séparément pour les visibles et non visibles
    const visibles = await prisma.temoignages.findMany({
      where: { afficher: true },
      orderBy: { id_tem: "asc" },
    });

    const nonVisibles = await prisma.temoignages.findMany({
      where: { afficher: false },
      orderBy: { id_tem: "asc" },
    });

    // Mettre à jour les ordres
    const updates = [
      ...visibles.map((t, index) =>
        prisma.temoignages.update({
          where: { id_tem: t.id_tem },
          data: { ordre: index + 1 },
        })
      ),
      ...nonVisibles.map((t, index) =>
        prisma.temoignages.update({
          where: { id_tem: t.id_tem },
          data: { ordre: index + 1 },
        })
      ),
    ];

    await prisma.$transaction(updates);
  } catch (error) {
    console.error("Erreur lors de l'initialisation des ordres:", error);
  }
}
