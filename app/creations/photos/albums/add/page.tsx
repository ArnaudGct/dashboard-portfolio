import { AddAlbumItem } from "@/components/sections/creations/photos/albums/add-album-item";
import prisma from "@/lib/prisma";
import { type ImageOption } from "@/components/sections/creations/photos/image-sheet";

export default async function AddAlbumPage() {
  try {
    // Récupérer les tags
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
        date_ajout: true,
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
      orderBy: { date_ajout: "desc" },
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

    // Formater les photos pour le composant avec les tags associés
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

    // URL de base pour les images
    const baseUrl = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

    return (
      <div className="w-[90%] mx-auto">
        <AddAlbumItem
          availableTags={formattedTags}
          availableImages={formattedPhotos}
          baseUrl={baseUrl}
        />
      </div>
    );
  } catch (error) {
    console.error(
      "Erreur lors du chargement de la page d'ajout d'album:",
      error
    );
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des données. Veuillez
          réessayer ou contacter l'administrateur.
        </div>
      </div>
    );
  }
}
