import prisma from "@/lib/prisma";
import { TagItem } from "@/components/sections/creations/videos/tag-item";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement
function TagsLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <Card className="p-6">
          <div className="space-y-4">
            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                ></div>
              ))}
            </div>
            <div className="h-10 w-full max-w-md bg-gray-200 dark:bg-gray-800 rounded mt-4"></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function TagsPage() {
  return (
    <Suspense fallback={<TagsLoading />}>
      <TagsContent />
    </Suspense>
  );
}

async function TagsContent() {
  try {
    // Optimiser la requête avec select au lieu de include
    const tags = await prisma.videos_tags.findMany({
      orderBy: {
        titre: "asc",
      },
      select: {
        id_tags: true,
        titre: true,
        important: true,
        // Utiliser _count directement dans select
        _count: {
          select: {
            videos_tags_link: true,
          },
        },
      },
    });

    // Transformer les données pour le composant client
    const formattedTags = tags.map((tag) => ({
      id: tag.id_tags,
      titre: tag.titre,
      important: Boolean(tag.important),
      videoCount: tag._count.videos_tags_link,
    }));

    return (
      <div className="w-[90%] mx-auto">
        <TagItem initialTags={formattedTags} />
      </div>
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return (
      <div className="w-[90%] mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Une erreur est survenue lors du chargement des tags. Veuillez
          rafraîchir la page ou contacter l'administrateur.
        </div>
      </div>
    );
  }
}
