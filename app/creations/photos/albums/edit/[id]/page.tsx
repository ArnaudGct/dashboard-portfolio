import { EditAlbumItem } from "@/components/sections/creations/photos/albums/edit-album-item";
import prisma from "@/lib/prisma";
import { type ImageOption } from "@/components/sections/creations/photos/image-sheet";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

// Composant de chargement
function AlbumEditLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-20 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="grid grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 aspect-square bg-gray-200 dark:bg-gray-800 rounded"
                ></div>
              ))}
            </div>
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

type Params = Promise<{ id: string }>;

export default function EditAlbumPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<AlbumEditLoading />}>
      <EditAlbumContent params={params} />
    </Suspense>
  );
}

async function EditAlbumContent({ params }: { params: Params }) {
  try {
    const { id } = await params;
    const albumId = parseInt(id);

    // Récupérer l'album avec ses photos (incluant l'ordre)
    const album = await prisma.photos_albums.findUnique({
      where: { id_alb: albumId },
      include: {
        photos_albums_tags_link: {
          include: {
            photos_tags: true,
          },
        },
        photos_albums_link: {
          include: {
            photos: {
              select: {
                id_pho: true,
                lien_high: true,
                lien_low: true,
                alt: true,
              },
            },
          },
          orderBy: {
            position: "asc", // Trier par ordre
          },
        },
      },
    });

    if (!album) {
      return notFound();
    }

    // Récupérer tous les tags
    const tags = await prisma.photos_tags.findMany({
      select: { id_tags: true, titre: true, important: true },
      orderBy: { titre: "asc" },
    });

    // Récupérer toutes les photos avec leurs tags associés
    const photos = await prisma.photos.findMany({
      select: {
        id_pho: true,
        lien_high: true,
        lien_low: true,
        alt: true,
        date: true,
        // Inclure les tags normaux
        photos_tags_link: {
          include: {
            photos_tags: {
              select: {
                id_tags: true,
                titre: true,
                important: true,
              },
            },
          },
        },
        // Inclure les tags de recherche
        photos_tags_recherche_link: {
          include: {
            photos_tags_recherche: {
              select: {
                id_tags: true,
                titre: true,
                important: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
      where: {
        afficher: true,
      },
    });

    // Formater les tags pour le composant
    const formattedTags = tags.map((tag) => ({
      id: tag.id_tags.toString(),
      label: tag.titre,
      important: tag.important,
    }));

    // Formater les photos pour le composant avec les tags
    const formattedPhotos: ImageOption[] = photos.map((photo) => ({
      id: photo.id_pho,
      url: photo.lien_high,
      thumbnail: photo.lien_low,
      title: `Photo #${photo.id_pho}`,
      alt: photo.alt,
      // Ajouter les tags normaux pour la recherche améliorée
      tags: photo.photos_tags_link.map((link) => ({
        id: link.photos_tags.id_tags,
        titre: link.photos_tags.titre,
        important: link.photos_tags.important,
      })),
      // Ajouter les tags de recherche pour la recherche améliorée
      searchTags: photo.photos_tags_recherche_link.map((link) => ({
        id: link.photos_tags_recherche.id_tags,
        titre: link.photos_tags_recherche.titre,
        important: link.photos_tags_recherche.important,
      })),
    }));

    // Formater les photos de l'album avec la position
    const albumPhotos = album.photos_albums_link.map((link) => ({
      id: link.photos.id_pho,
      lien: link.photos.lien_high,
      alt: link.photos.alt || "",
      titre: `Photo #${link.photos.id_pho}`,
      position: link.position || 0, // Utiliser position au lieu d'ordre
    }));

    // Extraire les IDs des tags sélectionnés
    const selectedTagIds = album.photos_albums_tags_link.map((tagLink) =>
      tagLink.id_tags.toString()
    );

    // URL de base pour les images
    const baseUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

    // Formater les données pour le composant
    const initialData = {
      id_alb: album.id_alb,
      titre: album.titre,
      description: album.description,
      date: album.date || new Date(),
      afficher: album.afficher,
      photos: albumPhotos,
    };

    return (
      <div className="w-[90%] mx-auto">
        <EditAlbumItem
          initialData={initialData}
          availableTags={formattedTags}
          selectedTagIds={selectedTagIds}
          availableImages={formattedPhotos}
          baseUrl={baseUrl}
        />
      </div>
    );
  } catch (error) {
    console.error(
      "Erreur lors du chargement de la page d'édition d'album:",
      error
    );
    return (
      <div className="w-[90%] mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des données. Veuillez
          réessayer ou contacter l'administrateur.
        </div>
      </div>
    );
  }
}
