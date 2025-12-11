import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import {
  getOutils,
  initializeOutilsOrder,
} from "@/actions/apropos_outils-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { OutilsOrderedList } from "@/components/sections/a-propos/outils/outils-ordered-list";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Composant de chargement
function OutilsLoading() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mt-4" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export const revalidate = 60;

export default function AProposOutils() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-start sm:flex-row sm:items-center justify-between">
          <h1 className="text-3xl font-bold">Outils</h1>
          <Link href="/a-propos/outils/add">
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Ajouter un outil
            </Button>
          </Link>
        </div>

        {/* Utiliser Suspense pour le chargement asynchrone */}
        <Suspense fallback={<OutilsLoading />}>
          <OutilsList />
        </Suspense>
      </div>
    </section>
  );
}

async function OutilsList() {
  try {
    // Initialiser les ordres si nécessaire
    await initializeOutilsOrder();

    // Récupérer tous les outils (triés par ordre)
    const outils = await getOutils();

    // Si aucun outil, afficher un message
    if (outils.length === 0) {
      return (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Aucun outil trouvé
          </p>
        </Card>
      );
    }

    return <OutilsOrderedList outils={outils} />;
  } catch (error) {
    console.error("Erreur lors du chargement des outils:", error);
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des outils. Veuillez
          réessayer ou contacter l'administrateur.
        </div>
      </Card>
    );
  }
}
