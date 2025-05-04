import prisma from "@/lib/prisma";
import { EditPhotoItem } from "@/components/sections/creations/photos/edit-photo-item";
import { notFound } from "next/navigation";

export default async function EditPhoto({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const photoId = parseInt(id);

  if (isNaN(photoId)) {
    return notFound();
  }

  // Récupérer la photo avec ses relations
  const photo = await prisma.photos.findUnique({
    where: {
      id_pho: photoId,
    },
    include: {
      photos_tags_link: true,
      photos_tags_recherche_link: true,
      photos_albums_link: true,
    },
  });

  if (!photo) {
    return notFound();
  }

  // Récupérer tous les tags disponibles
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

  // Récupérer les IDs des tags associés à cette photo
  const selectedTagIds = photo.photos_tags_link.map((link) =>
    link.id_tags.toString()
  );
  const selectedSearchTagIds = photo.photos_tags_recherche_link.map((link) =>
    link.id_tags.toString()
  );
  const selectedAlbumIds = photo.photos_albums_link.map((link) =>
    link.id_alb.toString()
  );

  return (
    <EditPhotoItem
      initialData={{
        id_pho: photo.id_pho,
        lien_high: photo.lien_high,
        lien_low: photo.lien_low,
        largeur: photo.largeur,
        hauteur: photo.hauteur,
        alt: photo.alt,
        date: photo.date,
        afficher: photo.afficher,
      }}
      availableTags={tags.map((tag) => ({
        id: tag.id_tags.toString(),
        label: tag.titre,
        important: tag.important,
      }))}
      availableSearchTags={searchTags.map((tag) => ({
        id: tag.id_tags.toString(),
        label: tag.titre,
        important: tag.important,
      }))}
      availableAlbums={albums.map((album) => ({
        id: album.id_alb.toString(),
        label: album.titre,
      }))}
      selectedTagIds={selectedTagIds}
      selectedSearchTagIds={selectedSearchTagIds}
      selectedAlbumIds={selectedAlbumIds}
    />
  );
}
