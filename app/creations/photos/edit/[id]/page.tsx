import prisma from "@/lib/prisma";
import { EditPhotoItem } from "@/components/sections/creations/photos/edit-photo-item";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

function PhotoEditLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="aspect-video animate-pulse bg-gray-200 dark:bg-gray-800" />
          <Card className="aspect-video animate-pulse bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    </div>
  );
}

export default function EditPhotoPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<PhotoEditLoading />}>
      <EditPhotoContent params={params} />
    </Suspense>
  );
}

async function EditPhotoContent({ params }: { params: { id: string } }) {
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
        },
      },
      photos_tags_recherche_link: {
        select: {
          id_tags: true,
        },
      },
      photos_albums_link: {
        select: {
          id_alb: true,
        },
      },
    },
  });

  // Requêtes parallèles avec Promise.all pour les données de référence
  const [tags, searchTags, albums] = await Promise.all([
    prisma.photos_tags.findMany({
      select: {
        id_tags: true,
        titre: true,
        important: true,
      },
      orderBy: {
        titre: "asc",
      },
    }),
    prisma.photos_tags_recherche.findMany({
      select: {
        id_tags: true,
        titre: true,
        important: true,
      },
      orderBy: {
        titre: "asc",
      },
    }),
    prisma.photos_albums.findMany({
      select: {
        id_alb: true,
        titre: true,
      },
      orderBy: {
        titre: "asc",
      },
    }),
  ]);

  if (!photo) {
    return notFound();
  }

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
