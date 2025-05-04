import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Tag } from "@/components/tag";
import React from "react";

export default async function PhotoAlbums() {
  // Récupérer tous les albums avec leurs photos et tags associés
  const albums = await prisma.photos_albums.findMany({
    include: {
      // Inclure les liens vers les photos
      photos_albums_link: true,
      // Inclure les tags de l'album
      photos_albums_tags_link: {
        include: {
          photos_tags: true,
        },
      },
    },
    orderBy: {
      // Trier par date décroissante
      date: "desc",
    },
  });

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

        {/* Si aucun album, afficher un message */}
        {albums.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Aucun album trouvé
            </p>
          </Card>
        ) : (
          // Sinon afficher tous les albums
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album) => (
              <Link
                href={`/creations/photos/albums/edit/${album.id_alb}`}
                key={album.id_alb}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex flex-col gap-4 px-6">
                    <div className="flex flex-col gap-1.5">
                      <p className="text-lg font-semibold">{album.titre}</p>

                      <ReactMarkdown>
                        {album.description || "Aucune description"}
                      </ReactMarkdown>
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
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
