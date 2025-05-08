import prisma from "@/lib/prisma";
import { AddAutreItem } from "@/components/sections/creations/autres/add-autre-item";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement
function AutreAddLoading() {
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
export default function AddAutrePage() {
  return (
    <Suspense fallback={<AutreAddLoading />}>
      <AddAutreContent />
    </Suspense>
  );
}

// Composant asynchrone qui récupère les données
async function AddAutreContent() {
  try {
    // Optimisation: utiliser select pour récupérer uniquement les champs nécessaires
    const tags = await prisma.autre_tags.findMany({
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

    return <AddAutreItem availableTags={availableTags} />;
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
