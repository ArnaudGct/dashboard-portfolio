import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { TemoignageItem } from "@/components/sections/accueil/temoignages/temoignage-item";

// Composant de chargement pour Suspense
function TemoignagesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="p-6 animate-pulse">
          <div className="flex flex-col gap-4">
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="flex justify-between items-center">
              <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-6 w-1/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export const revalidate = 60; // Revalidation des données toutes les 60 secondes

export default function TemoignagesPage() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Témoignages</h1>
          <Link href="/accueil/temoignages/add">
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Ajouter un témoignage
            </Button>
          </Link>
        </div>

        {/* Utiliser Suspense pour le chargement asynchrone */}
        <Suspense fallback={<TemoignagesLoading />}>
          <TemoignagesList />
        </Suspense>
      </div>
    </section>
  );
}

async function TemoignagesList() {
  try {
    // Récupérer tous les témoignages
    const temoignages = await prisma.temoignages.findMany({
      orderBy: {
        id_tem: "desc", // Trier par le plus récent
      },
    });

    // Si aucun témoignage, afficher un message
    if (temoignages.length === 0) {
      return (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Aucun témoignage trouvé
          </p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {temoignages.map((temoignage) => (
          <TemoignageItem key={temoignage.id_tem} temoignage={temoignage} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Erreur lors du chargement des témoignages:", error);
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des témoignages. Veuillez
          réessayer ou contacter l'administrateur.
        </div>
      </Card>
    );
  }
}
