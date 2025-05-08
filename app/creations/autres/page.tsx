import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

// Composant de chargement pour la Suspense
function AutresLoading() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="flex flex-col justify-center lg:justify-start items-center lg:flex-row gap-6 p-6">
            <div className="relative w-full min-w-[250px] lg:min-w-[350px] max-w-[500px] shrink-0 rounded-lg overflow-hidden aspect-video min-h-[180px] bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex flex-col gap-4 py-6 w-full">
              <div className="flex flex-col gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-4/6"></div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export const revalidate = 60; // Revalidation des données toutes les 60 secondes

export default function Autres() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">Autres projets</p>
          <div className="flex gap-2">
            <Link href="/creations/autres/tags">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/creations/autres/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter un projet
              </Button>
            </Link>
          </div>
        </div>

        {/* Utilisation de Suspense pour le chargement asynchrone */}
        <Suspense fallback={<AutresLoading />}>
          <AutresList />
        </Suspense>
      </div>
    </section>
  );
}

// Composant serveur pour charger les projets
async function AutresList() {
  const prisma = (await import("@/lib/prisma")).default;

  // Optimisation de la requête avec select au lieu de include
  const autres = await prisma.autre.findMany({
    select: {
      id_autre: true,
      titre: true,
      description: true,
      miniature: true,
      lien_github: true,
      lien_figma: true,
      lien_site: true,
      categorie: true,
      date: true,
      afficher: true,
      autre_tags_link: {
        select: {
          id_autre: true,
          id_tags: true,
          autre_tags: {
            select: {
              id_tags: true,
              titre: true,
              important: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Importation dynamique du composant client
  const { AutreItem } = await import(
    "@/components/sections/creations/autres/autre-item"
  );

  // Afficher les projets ou un message s'il n'y en a pas
  return autres.length === 0 ? (
    <Card className="p-6">
      <p className="text-center text-muted-foreground">Aucun projet trouvé</p>
    </Card>
  ) : (
    <div className="flex flex-col gap-6">
      {autres.map((autre) => (
        <AutreItem key={autre.id_autre} autre={autre} />
      ))}
    </div>
  );
}
