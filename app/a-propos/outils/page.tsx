import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import { getOutils } from "@/actions/apropos_outils-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { OutilItem } from "@/components/sections/a-propos/outils/outil-item";
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
    // Récupérer tous les outils
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

    // Séparer les outils visibles et non visibles
    const visibleOutils = outils.filter((outil) => outil.afficher);
    const hiddenOutils = outils.filter((outil) => !outil.afficher);

    return (
      <div className="flex flex-col gap-8">
        {/* Outils visibles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {visibleOutils.map((outil) => (
            <OutilItem key={outil.id_outil} outil={outil} />
          ))}
        </div>

        {/* Outils non visibles (si on veut les afficher pour l'admin) */}
        {hiddenOutils.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
              Outils non visibles
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {hiddenOutils.map((outil) => (
                <div key={outil.id_outil} className="opacity-60">
                  <OutilItem outil={outil} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
