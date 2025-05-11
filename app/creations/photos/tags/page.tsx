import { TagItem } from "@/components/sections/creations/photos/tag-item";
import prisma from "@/lib/prisma";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement pour les tags
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

            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded mt-8"></div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
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

type searchParams = Promise<{ from?: string }>;

// Composant principal avec Suspense
export default function PhotosTagsPage({
  searchParams,
}: {
  searchParams: searchParams;
}) {
  return (
    <Suspense fallback={<TagsLoading />}>
      <TagsContent searchParams={searchParams} />
    </Suspense>
  );
}

// Composant qui récupère les données de manière asynchrone
async function TagsContent({ searchParams }: { searchParams: searchParams }) {
  try {
    const { from } = await searchParams;

    // Optimisation: Exécuter les requêtes en parallèle avec Promise.all
    const [normalTags, searchTags] = await Promise.all([
      // Récupérer les tags normaux avec select optimisé
      prisma.photos_tags.findMany({
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
      }),

      // Récupérer les tags de recherche avec select optimisé
      prisma.photos_tags_recherche.findMany({
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
      }),
    ]);

    // Formater les tags pour le composant
    const formattedNormalTags = normalTags.map((tag) => ({
      id: tag.id_tags,
      titre: tag.titre,
      important: Boolean(tag.important),
      photoCount: tag._count.photos_tags_link,
    }));

    const formattedSearchTags = searchTags.map((tag) => ({
      id: tag.id_tags,
      titre: tag.titre,
      important: Boolean(tag.important),
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
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return (
      <div className="w-[90%] mx-auto mb-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Une erreur est survenue lors du chargement des tags. Veuillez
          rafraîchir la page ou contacter l'administrateur.
        </div>
      </div>
    );
  }
}
