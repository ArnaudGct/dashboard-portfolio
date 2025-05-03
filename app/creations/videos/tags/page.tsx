import prisma from "@/lib/prisma";
import { TagItem } from "@/components/sections/creations/videos/tag-item";

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.videos_tags.findMany({
      orderBy: {
        titre: "asc",
      },
      include: {
        _count: {
          select: {
            videos_tags_link: true,
          },
        },
      },
    });

    return tags.map((tag) => ({
      id: tag.id_tags,
      titre: tag.titre,
      videoCount: tag._count.videos_tags_link,
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

export default async function Tags() {
  const tags = await getAllTags();

  return (
    <div className="w-[90%] mx-auto">
      <TagItem initialTags={tags} />
    </div>
  );
}
