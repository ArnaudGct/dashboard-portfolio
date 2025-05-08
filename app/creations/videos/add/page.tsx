import prisma from "@/lib/prisma";
import { AddVideoItem } from "@/components/sections/creations/videos/add-video-item";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement
function VideoAddLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Composant principal avec Suspense
export default function AddVideoPage() {
  return (
    <Suspense fallback={<VideoAddLoading />}>
      <AddVideoContent />
    </Suspense>
  );
}

// Composant asynchrone qui récupère les données
async function AddVideoContent() {
  try {
    // Optimisation: utiliser select pour récupérer uniquement les champs nécessaires
    const tags = await prisma.videos_tags.findMany({
      select: {
        id_tags: true,
        titre: true,
        important: true,
      },
      orderBy: {
        titre: "asc",
      },
    });

    // Transformer les données pour le composant client
    const availableTags = tags.map((tag) => ({
      id: tag.titre,
      label: tag.titre,
      important: Boolean(tag.important),
    }));

    return (
      <div className="w-[90%] mx-auto">
        <AddVideoItem availableTags={availableTags} />
      </div>
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);

    // Afficher un message d'erreur convivial
    return (
      <div className="w-[90%] mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Une erreur est survenue lors du chargement des données. Veuillez
          rafraîchir la page ou contacter l'administrateur.
        </div>
      </div>
    );
  }
}
