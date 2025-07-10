import prisma from "@/lib/prisma";
import { PhotoItem } from "@/components/sections/creations/photos/photo-item";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";

// Composant de chargement pour la Suspense
function PhotosLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="flex flex-col px-6 gap-4 py-4">
            <div className="bg-gray-200 dark:bg-gray-800 h-40 w-full rounded-lg"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export const revalidate = 60; // Revalidation des données toutes les 60 secondes

export default function PhotosPage() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-start sm:flex-row sm:items-center justify-between">
          <p className="text-3xl font-bold">Photos</p>
          <div className="flex gap-2">
            <Link href="/creations/photos/albums">
              <Button variant="outline" className="cursor-pointer">
                Albums
              </Button>
            </Link>
            <Link href="/creations/photos/tags?from=photos">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/creations/photos/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter une photo
              </Button>
            </Link>
          </div>
        </div>

        {/* Charger le contenu principal avec Suspense */}
        <Suspense fallback={<PhotosLoading />}>
          <PhotoData />
        </Suspense>
      </div>
    </section>
  );
}

// Composant server pour récupérer les données
async function PhotoData() {
  // Optimisation 1: Utilisez select au lieu de include pour limiter les données
  const photos = await prisma.photos.findMany({
    select: {
      id_pho: true,
      lien_high: true,
      lien_low: true,
      largeur: true,
      hauteur: true,
      alt: true,
      date: true,
      afficher: true,
      photos_tags_link: {
        select: {
          id_tags: true,
          photos_tags: {
            select: {
              id_tags: true,
              titre: true,
              important: true,
            },
          },
        },
      },
      photos_albums_link: {
        select: {
          id_alb: true,
          photos_albums: {
            select: {
              id_alb: true,
              titre: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: "desc",
    },
  });

  // Optimisation 2: Limitez les données des albums
  const albums = await prisma.photos_albums.findMany({
    select: {
      id_alb: true,
      titre: true,
    },
    orderBy: {
      titre: "asc",
    },
  });

  return <PhotoItem photos={photos} albums={albums} />;
}
