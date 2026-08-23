import prisma from "@/lib/prisma";
import { TagItem } from "@/components/sections/outils/tag-item";

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.outils_tags.findMany({
      orderBy: {
        titre: "asc",
      },
    });

    const tagCounts = await prisma.outils_tags_link.groupBy({
      by: ['id_tags'],
      _count: {
        id_outils: true,
      },
    });

    const countMap = new Map();
    tagCounts.forEach(tc => {
      countMap.set(tc.id_tags, tc._count.id_outils);
    });

    return tags.map((tag) => ({
      id: tag.id_tags,
      titre: tag.titre,
      important: tag.important === 1,
      outilCount: countMap.get(tag.id_tags) || 0,
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

// Composant serveur principal
export default async function TagsOutilPage() {
  // Récupérer tous les tags disponibles
  const tags = await getAllTags();

  return (
    <div className="w-[90%] mx-auto">
      <TagItem initialTags={tags} />
    </div>
  );
}
