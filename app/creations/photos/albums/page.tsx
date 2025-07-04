import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import Image from "next/image";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Tag } from "@/components/tag";
import { AlbumPreview } from "@/components/sections/creations/photos/albums/album-preview";
import { Suspense } from "react";

// Composant de chargement
function AlbumsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i} className="animate-pulse overflow-hidden">
          <div className="flex flex-col justify-center items-center gap-6 px-6">
            <div className="w-full h-40 bg-gray-200 dark:bg-gray-800 rounded-lg"></div>
            <div className="flex flex-col gap-4 w-full">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
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

export default function PhotoAlbums() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/creations/photos">Photos</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Albums</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-2">
            <Link href="/creations/photos/tags?from=albums">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/creations/photos/albums/add">
              <Button className="cursor-pointer">
                <Plus /> Nouvel album
              </Button>
            </Link>
          </div>
        </div>

        {/* Utiliser Suspense pour le chargement asynchrone */}
        <Suspense fallback={<AlbumsLoading />}>
          <AlbumsList />
        </Suspense>
      </div>
    </section>
  );
}

// Composant serveur pour charger les albums
async function AlbumsList() {
  // Optimiser la requête avec select au lieu de include
  const albums = await prisma.photos_albums.findMany({
    select: {
      id_alb: true,
      titre: true,
      description: true,
      date: true,
      // Sélectionner uniquement les champs nécessaires pour les liens vers les photos
      photos_albums_link: {
        include: {
          photos: {
            select: {
              id_pho: true,
              lien_low: true,
              lien_high: true, // Ajout du lien haute résolution pour correspondre au type Photo
              alt: true,
              date: true,
            },
          },
        },
        orderBy: {
          position: "asc",
        },
        take: 5, // Limiter à 5 photos par album pour la prévisualisation
      },
      // Sélectionner uniquement les champs nécessaires pour les tags de l'album
      photos_albums_tags_link: {
        select: {
          id_tags: true,
          photos_tags: {
            select: {
              id_tags: true,
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

  return (
    <>
      {/* Si aucun album, afficher un message */}
      {albums.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Aucun album trouvé
          </p>
        </Card>
      ) : (
        // Sinon afficher tous les albums
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {albums.map((album) => (
            <Link
              href={`/creations/photos/albums/edit/${album.id_alb}`}
              key={album.id_alb}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
                <div className="flex flex-col justify-center lg:justify-start items-center gap-6 px-6">
                  {/* Mosaïque de prévisualisation */}
                  {album.photos_albums_link.length > 0 && (
                    <div className="w-full rounded-lg overflow-hidden">
                      <AlbumPreview
                        photos={album.photos_albums_link.map(
                          (link) => link.photos
                        )}
                      />
                    </div>
                  )}

                  {/* Si pas de photos, ajouter un espace pour maintenir une apparence cohérente */}
                  {album.photos_albums_link.length === 0 && (
                    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                      <p className="text-muted-foreground">Aucune photo</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-4 w-full">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-lg font-semibold">{album.titre}</p>

                      {album.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          <ReactMarkdown>{album.description}</ReactMarkdown>
                        </div>
                      )}
                    </div>

                    {album.photos_albums_tags_link.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {album.photos_albums_tags_link.map((tagLink) => (
                          <Tag key={`tag-${tagLink.id_tags}`} variant="default">
                            {tagLink.photos_tags.titre}
                          </Tag>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {album.photos_albums_link.length} photo
                        {album.photos_albums_link.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(album.date), "d MMMM yyyy", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
