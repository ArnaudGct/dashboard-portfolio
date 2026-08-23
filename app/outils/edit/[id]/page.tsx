import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { EditOutilItem } from "@/components/sections/outils/edit-outil-item";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

// Composant de chargement
function OutilEditLoading() {
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
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

type Params = Promise<{ id: string }>;

export default function EditOutilPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<OutilEditLoading />}>
      <EditOutilContent params={params} />
    </Suspense>
  );
}

async function EditOutilContent({ params }: { params: Params }) {
  const { id } = await params;
  const outilId = parseInt(id);

  if (isNaN(outilId)) {
    return notFound();
  }

  const outil = await prisma.outils.findUnique({
    where: {
      id_outil: outilId,
    },
    select: {
      id_outil: true,
      titre: true,
      description: true,
      miniature: true,
      logo: true,
      lien_github: true,
      lien_telechargement: true,
    },
  });

  if (!outil) {
    return notFound();
  }

  // Requête parallèle pour tous les tags
  const tagsPromise = prisma.outils_tags.findMany({
    select: {
      id_tags: true,
      titre: true,
      important: true,
    },
    orderBy: {
      titre: "asc",
    },
  });

  // Requête pour les liens de cet outil
  const outilTagsLinksPromise = prisma.outils_tags_link.findMany({
    where: {
      id_outils: outilId,
    },
  });

  const [tags, outilTagsLinks] = await Promise.all([tagsPromise, outilTagsLinksPromise]);

  // Extraire les titres des tags de cet outil
  const outilTagsIds = outilTagsLinks.map(link => link.id_tags);
  const outilTags = tags.filter(tag => outilTagsIds.includes(tag.id_tags)).map(tag => tag.titre);

  const initialData = {
    id_outil: outil.id_outil,
    titre: outil.titre,
    description: outil.description,
    miniature: outil.miniature,
    logo: outil.logo,
    lien_github: outil.lien_github,
    lien_telechargement: outil.lien_telechargement,
    tags: outilTags,
  };

  const availableTags = tags.map((tag) => ({
    id: tag.titre,
    label: tag.titre,
    important: tag.important === 1,
  }));

  return (
    <EditOutilItem initialData={initialData} availableTags={availableTags} />
  );
}
