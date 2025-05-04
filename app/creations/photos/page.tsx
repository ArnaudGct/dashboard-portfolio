import prisma from "@/lib/prisma";
import { PhotoItem } from "@/components/sections/creations/photos/photo-item";

export default async function PhotosPage() {
  // Récupérer toutes les photos avec leurs relations
  const photos = await prisma.photos.findMany({
    include: {
      photos_tags_link: {
        include: {
          photos_tags: true,
        },
      },
      photos_tags_recherche_link: {
        include: {
          photos_tags_recherche: true,
        },
      },
      photos_albums_link: {
        include: {
          photos_albums: true,
        },
      },
    },
    orderBy: {
      date_ajout: "desc",
    },
  });

  // Récupérer tous les albums
  const albums = await prisma.photos_albums.findMany({
    orderBy: {
      titre: "asc",
    },
  });

  return <PhotoItem photos={photos} albums={albums} />;
}
