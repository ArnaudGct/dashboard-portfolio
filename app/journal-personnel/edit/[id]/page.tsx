import { getJournalEntryByIdAction } from "@/actions/journal-actions";
import { EditJournalItem } from "@/components/sections/journal-personnel/edit-journal-item";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement
function JournalEditLoading() {
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
            <div className="h-12 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
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

interface PageProps {
  params: {
    id: string;
  };
}

export default function EditJournalItemPage({ params }: PageProps) {
  return (
    <Suspense fallback={<JournalEditLoading />}>
      <EditJournalContent params={params} />
    </Suspense>
  );
}

// Composant asynchrone pour charger les données
async function EditJournalContent({ params }: PageProps) {
  try {
    const { id } = await params;
    const journalId = parseInt(id);

    if (isNaN(journalId)) {
      return notFound();
    }

    const journalEntry = await getJournalEntryByIdAction(journalId);

    if (!journalEntry) {
      return notFound();
    }

    return (
      <section className="w-[90%] mx-auto mb-8">
        <EditJournalItem initialData={journalEntry} />
      </section>
    );
  } catch (error) {
    console.error("Erreur lors du chargement de l'entrée du journal:", error);
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
