import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { AutreItem } from "@/components/sections/creations/autres/autre-item";

export default async function Autres() {
  // Récupérer tous les projets avec leurs tags associés
  const autres = await prisma.autre.findMany({
    include: {
      // Inclure les liens vers les tags
      autre_tags_link: {
        include: {
          // Pour chaque lien, récupérer les détails du tag
          autre_tags: true,
        },
      },
    },
    orderBy: {
      // Trier par date décroissante
      date: "desc",
    },
  });

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

        {/* Si aucun projet, afficher un message */}
        {autres.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Aucun projet trouvé
            </p>
          </Card>
        ) : (
          // Sinon afficher tous les projets
          <div className="flex flex-col gap-6">
            {autres.map((autre) => (
              <AutreItem key={autre.id_autre} autre={autre} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
