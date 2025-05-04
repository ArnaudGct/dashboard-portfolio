import prisma from "@/lib/prisma";
import { TagItem } from "@/components/sections/creations/autres/tag-item";

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.autre_tags.findMany({
      orderBy: {
        titre: "asc",
      },
      include: {
        _count: {
          select: {
            autre_tags_link: true,
          },
        },
      },
    });

    return tags.map((tag) => ({
      id: tag.id_tags,
      titre: tag.titre,
      important: tag.important,
      videoCount: tag._count.autre_tags_link,
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

// Composant serveur principal
export default async function TagsAutrePage() {
  // Récupérer tous les tags disponibles
  const tags = await getAllTags();

  return (
    <div className="w-[90%] mx-auto">
      <TagItem initialTags={tags} />
    </div>
  );
}
