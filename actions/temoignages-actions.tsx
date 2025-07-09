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

    await prisma.temoignages.create({
      data: {
        client,
        plateforme,
        contenu,
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

    await prisma.temoignages.delete({
      where: { id_tem: id },
    });

    revalidatePath("/accueil/temoignages");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du témoignage:", error);
    return { success: false, error: "Une erreur s'est produite." };
  }
}
