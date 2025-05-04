import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { EditAutreItem } from "@/components/sections/creations/autres/edit-autre-item";

// Partie serveur pour récupérer les données
async function getAutreData(id: number) {
  try {
    const autre = await prisma.autre.findUnique({
      where: {
        id_autre: id,
      },
      include: {
        autre_tags_link: {
          include: {
            autre_tags: true,
          },
        },
      },
    });

    return autre;
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return null;
  }
}

// Récupérer tous les tags disponibles
async function getAllTags() {
  try {
    const tags = await prisma.autre_tags.findMany({
      orderBy: {
        titre: "asc",
      },
    });

    return tags.map((tag) => ({
      id: tag.titre,
      label: tag.titre,
      important: tag.important,
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);
    return [];
  }
}

// Composant serveur principal
export default async function EditAutrePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const autreId = parseInt(id);

  if (isNaN(autreId)) {
    notFound();
  }

  const [autreData, allTags] = await Promise.all([
    getAutreData(autreId),
    getAllTags(),
  ]);

  if (!autreData) {
    notFound();
  }

  // Extraire les tags du projet
  const autreTags = autreData.autre_tags_link.map(
    (link) => link.autre_tags.titre
  );

  // Convertir la date si elle existe
  const autreDate = autreData.date ? new Date(autreData.date) : undefined;

  // Préparer les données pour le composant client
  const initialData = {
    id_autre: autreData.id_autre,
    titre: autreData.titre,
    description: autreData.description,
    miniature: autreData.miniature,
    lien_github: autreData.lien_github,
    lien_figma: autreData.lien_figma,
    lien_site: autreData.lien_site,
    date: autreDate,
    afficher: autreData.afficher,
    tags: autreTags,
  };

  return <EditAutreItem initialData={initialData} availableTags={allTags} />;
}
