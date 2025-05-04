import prisma from "@/lib/prisma";
import { AddAutreItem } from "@/components/sections/creations/autres/add-autre-item";

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.autre_tags.findMany({
      orderBy: {
        titre: "asc",
      },
    });

    return tags.map((tag) => ({
      id: tag.titre,
      label: tag.titre,
      important: Boolean(tag.important), // Convertir explicitement en boolean
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

// Composant serveur principal
export default async function AddAutrePage() {
  // Récupérer tous les tags disponibles
  const availableTags = await getAllTags();

  return <AddAutreItem availableTags={availableTags} />;
}
