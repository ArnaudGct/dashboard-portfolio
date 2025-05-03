import prisma from "@/lib/prisma";
import { AddVideoItem } from "@/components/sections/creations/videos/add-video-item";

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.videos_tags.findMany({
      orderBy: {
        titre: "asc",
      },
    });

    return tags.map((tag) => ({
      id: tag.titre,
      label: tag.titre,
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

// Composant serveur principal
export default async function AddVideoPage() {
  // Récupérer tous les tags disponibles
  const availableTags = await getAllTags();

  return <AddVideoItem availableTags={availableTags} />;
}
