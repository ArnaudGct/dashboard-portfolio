import { EditFaqItem } from "@/components/sections/faq/edit-faq-item";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import prisma from "@/lib/prisma";

// Composant de chargement
function FaqEditLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

interface EditFaqPageProps {
  params: {
    id: string;
  };
}

export default function EditFaqPage({ params }: EditFaqPageProps) {
  return (
    <Suspense fallback={<FaqEditLoading />}>
      <EditFaqContent params={params} />
    </Suspense>
  );
}

// Composant asynchrone pour charger les données
async function EditFaqContent({ params }: EditFaqPageProps) {
  try {
    const { id } = await params;
    const editId = parseInt(id);

    if (isNaN(editId)) {
      notFound();
    }

    // Récupérer la FAQ directement avec Prisma
    const faq = await prisma.faq.findUnique({
      where: {
        id_faq: editId,
      },
    });

    if (!faq) {
      notFound();
    }

    return (
      <section className="w-[90%] mx-auto mb-8">
        <EditFaqItem initialData={faq} />
      </section>
    );
  } catch (error) {
    console.error("Erreur lors du chargement de la FAQ:", error);
    return (
      <section className="w-[90%] mx-auto mb-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          Une erreur est survenue lors du chargement des données. Veuillez
          rafraîchir la page ou contacter l'administrateur.
        </div>
      </section>
    );
  }
}
