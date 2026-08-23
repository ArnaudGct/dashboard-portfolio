import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import { OutilItem } from "@/components/sections/outils/outil-item";

// Composant de chargement pour la Suspense
function OutilsLoading() {
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
              <div className="flex justify-end items-center mt-auto">
                <div className="flex gap-2">
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

export default function Outils() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-start sm:flex-row sm:items-center justify-between">
          <p className="text-3xl font-bold">Outils</p>
          <div className="flex gap-2">
            <Link href="/outils/tags">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/outils/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter un outil
              </Button>
            </Link>
          </div>
        </div>

        {/* Utilisation de Suspense pour le chargement asynchrone */}
        <Suspense fallback={<OutilsLoading />}>
          <OutilsList />
        </Suspense>
      </div>
    </section>
  );
}

// Composant serveur pour charger les projets
async function OutilsList() {
  const prisma = (await import("@/lib/prisma")).default;

  // Optimisation de la requête avec select au lieu de include
  const outils = await prisma.outils.findMany({
    select: {
      id_outil: true,
      titre: true,
      description: true,
      logo: true,
      miniature: true,
      lien_github: true,
      derniere_modification: true,
    },
    orderBy: {
      derniere_modification: "desc",
    },
  });

  // Suppression de l'import dynamique pour utiliser l'import statique en haut du fichier

  // Afficher les outils ou un message s'il n'y en a pas
  return outils.length === 0 ? (
    <Card className="p-6">
      <p className="text-center text-muted-foreground">Aucun outil trouvé</p>
    </Card>
  ) : (
    <div className="flex flex-col gap-6">
      {outils.map((outil) => (
        <OutilItem key={outil.id_outil} outil={outil} />
      ))}
    </div>
  );
}
