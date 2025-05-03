import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { VideoItem } from "@/components/sections/creations/videos/video-item";

export default async function Videos() {
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

        {/* Si aucune vidéo, afficher un message */}
        {videos.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Aucune vidéo trouvée
            </p>
          </Card>
        ) : (
          // Sinon afficher toutes les vidéos
          <div className="flex flex-col gap-6">
            {videos.map((video) => (
              <VideoItem key={video.id_vid} video={video} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
