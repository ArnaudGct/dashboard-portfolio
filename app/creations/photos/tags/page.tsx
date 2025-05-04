import { TagItem } from "@/components/sections/creations/photos/tag-item";
import prisma from "@/lib/prisma";

export default async function PhotosTagsPage({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  // Récupérer les tags normaux
  const { from } = await searchParams;

  // Récupérer les tags normaux
  const normalTags = await prisma.photos_tags.findMany({
    select: {
      id_tags: true,
      titre: true,
      important: true,
      _count: {
        select: {
          photos_tags_link: true,
        },
      },
    },
    orderBy: {
      titre: "asc",
    },
  });

  // Récupérer les tags de recherche
  const searchTags = await prisma.photos_tags_recherche.findMany({
    select: {
      id_tags: true,
      titre: true,
      important: true,
      _count: {
        select: {
          photos_tags_recherche_link: true,
        },
      },
    },
    orderBy: {
      titre: "asc",
    },
  });

  // Formater les tags pour le composant
  const formattedNormalTags = normalTags.map((tag) => ({
    id: tag.id_tags,
    titre: tag.titre,
    important: tag.important,
    photoCount: tag._count.photos_tags_link,
  }));

  const formattedSearchTags = searchTags.map((tag) => ({
    id: tag.id_tags,
    titre: tag.titre,
    important: tag.important,
    photoCount: tag._count.photos_tags_recherche_link,
  }));

  return (
    <div className="w-[90%] mx-auto mb-8">
      <TagItem
        initialTags={{
          normal: formattedNormalTags,
          search: formattedSearchTags,
        }}
        fromPage={from || "photos"}
      />
    </div>
  );
}
