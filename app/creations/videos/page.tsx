import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { VideoItem } from "@/components/sections/creations/videos/video-item";
import { Suspense } from "react";

// Composant de chargement pour la Suspense
function VideosLoading() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <div className="flex flex-col justify-center lg:justify-start items-center lg:flex-row gap-6 p-6">
            <div className="relative w-full min-w-[250px] lg:min-w-[350px] max-w-[500px] shrink-0 rounded-lg overflow-hidden aspect-video min-h-[180px] bg-gray-200 dark:bg-gray-800"></div>
            <div className="flex flex-col gap-4 py-6 w-full">
              <div className="flex flex-col gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
              </div>
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export const revalidate = 60; // Revalidation des données toutes les 60 secondes

export default function Videos() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">Vidéos</p>
          <div className="flex gap-2">
            <Link href="/creations/videos/tags">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/creations/videos/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter une vidéo
              </Button>
            </Link>
          </div>
        </div>

        {/* Utiliser Suspense pour le chargement asynchrone */}
        <Suspense fallback={<VideosLoading />}>
          <VideosList />
        </Suspense>
      </div>
    </section>
  );
}

async function VideosList() {
  try {
    // Récupérer toutes les vidéos avec leurs tags associés
    const videos = await prisma.videos.findMany({
      include: {
        // Inclure les liens vers les tags
        videos_tags_link: {
          include: {
            // Pour chaque lien, récupérer les détails du tag
            videos_tags: true,
          },
        },
      },
      orderBy: {
        // Trier par date de modification décroissante
        date: "desc",
      },
    });
    // Si aucune vidéo, afficher un message
    if (videos.length === 0) {
      return (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Aucune vidéo trouvée
          </p>
        </Card>
      );
    }

    // Sinon afficher toutes les vidéos
    return (
      <div className="flex flex-col gap-6">
        {videos.map((video) => (
          <VideoItem key={video.id_vid} video={video} />
        ))}
      </div>
    );
  } catch (error) {
    console.error("Erreur lors du chargement des vidéos:", error);
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des vidéos. Veuillez
          réessayer ou contacter l'administrateur.
        </div>
      </Card>
    );
  }
}
