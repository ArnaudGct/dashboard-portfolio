import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { EditAutreItem } from "@/components/sections/creations/autres/edit-autre-item";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

// Composant de chargement
function AutreEditLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
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

export default function EditAutrePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<AutreEditLoading />}>
      <EditAutreContent params={params} />
    </Suspense>
  );
}

async function EditAutreContent({ params }: { params: { id: string } }) {
  const { id } = await params;
  const autreId = parseInt(id);

  if (isNaN(autreId)) {
    return notFound();
  }

  // Optimisation: utilisation de select au lieu de include
  const autre = await prisma.autre.findUnique({
    where: {
      id_autre: autreId,
    },
    select: {
      id_autre: true,
      titre: true,
      description: true,
      miniature: true,
      lien_github: true,
      lien_figma: true,
      lien_site: true,
      date: true,
      afficher: true,
      autre_tags_link: {
        select: {
          autre_tags: {
            select: {
              titre: true,
            },
          },
        },
      },
    },
  });

  if (!autre) {
    return notFound();
  }

  // Requête parallèle pour les tags
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

  // Extraire les tags du projet de manière optimisée
  const autreTags = autre.autre_tags_link.map((link) => link.autre_tags.titre);

  // Préparer les données pour le composant client
  const initialData = {
    id_autre: autre.id_autre,
    titre: autre.titre,
    description: autre.description,
    miniature: autre.miniature,
    lien_github: autre.lien_github,
    lien_figma: autre.lien_figma,
    lien_site: autre.lien_site,
    date: autre.date,
    afficher: autre.afficher,
    tags: autreTags,
  };

  const availableTags = tags.map((tag) => ({
    id: tag.titre,
    label: tag.titre,
    important: tag.important,
  }));

  return (
    <EditAutreItem initialData={initialData} availableTags={availableTags} />
  );
}
