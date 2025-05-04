import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

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
                <BreadcrumbLink>Albums</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <Link href="/creations/photos/albums/add">
            <Button className="cursor-pointer">
              <Plus /> Nouvel album
            </Button>
          </Link>
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
                className="block"
              >
                <Card className="hover:shadow-md transition-shadow h-full cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between">
                      <h3 className="text-lg font-semibold hover:underline">
                        {album.titre}
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {album.description || "Aucune description"}
                    </p>

                    {album.photos_albums_tags_link.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {album.photos_albums_tags_link.map((tagLink) => (
                          <span
                            key={tagLink.id_tags}
                            className="bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-xs"
                          >
                            {tagLink.photos_tags.titre}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between text-sm text-muted-foreground">
                    <p>
                      {album.photos_albums_link.length} photo
                      {album.photos_albums_link.length !== 1 ? "s" : ""}
                    </p>
                    <p>
                      {format(new Date(album.date), "d MMMM yyyy", {
                        locale: fr,
                      })}
                    </p>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
