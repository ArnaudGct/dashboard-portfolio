import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { EditVideoItem } from "@/components/sections/creations/videos/edit-video-item";

// Partie serveur pour récupérer les données
async function getVideoData(id: number) {
  try {
    const video = await prisma.videos.findUnique({
      where: {
        id_vid: id,
      },
      include: {
        videos_tags_link: {
          include: {
            videos_tags: true,
          },
        },
      },
    });

    return video;
  } catch (error) {
    console.error("Erreur lors de la récupération de la vidéo:", error);
    return null;
  }
}

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.videos_tags.findMany({
      orderBy: {
        titre: "asc",
      },
    });

    return tags.map((tag) => ({
      id: tag.titre,
      label: tag.titre,
      important: false, // Adding the required 'important' property
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

// Composant serveur principal
export default async function EditVideoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const videoId = parseInt(id);

  if (isNaN(videoId)) {
    notFound();
  }

  const [videoData, allTags] = await Promise.all([
    getVideoData(videoId),
    getAllTags(),
  ]);

  if (!videoData) {
    notFound();
  }

  // Extraire les tags de la vidéo
  const videoTags = videoData.videos_tags_link.map(
    (link) => link.videos_tags.titre
  );

  // Convertir la date si elle existe
  const videoDate = videoData.date ? new Date(videoData.date) : undefined;

  // Préparer les données pour le composant client
  const initialData = {
    id_vid: videoData.id_vid,
    titre: videoData.titre,
    description: videoData.description,
    lien: videoData.lien,
    duree: videoData.duree,
    date: videoDate,
    afficher: videoData.afficher,
    tags: videoTags,
  };

  return <EditVideoItem initialData={initialData} availableTags={allTags} />;
}
