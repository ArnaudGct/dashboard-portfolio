import prisma from "@/lib/prisma";
import { PhotoAddItem } from "@/components/sections/creations/photos/add/add-photo-item";

export default async function AddPhoto() {
  // Récupérer tous les tags disponibles pour les photos
  const tags = await prisma.photos_tags.findMany({
    orderBy: {
      titre: "asc",
    },
  });

  // Récupérer tous les tags de recherche disponibles
  const searchTags = await prisma.photos_tags_recherche.findMany({
    orderBy: {
      titre: "asc",
    },
  });

  // Récupérer tous les albums disponibles
  const albums = await prisma.photos_albums.findMany({
    orderBy: {
      titre: "asc",
    },
  });

  return (
    <PhotoAddItem
      availableTags={tags.map((tag) => ({
        id: tag.id_tags.toString(),
        label: tag.titre,
      }))}
      availableSearchTags={searchTags.map((tag) => ({
        id: tag.id_tags.toString(),
        label: tag.titre,
      }))}
      availableAlbums={albums.map((album) => ({
        id: album.id_alb.toString(),
        label: album.titre,
      }))}
    />
  );
}
