import { AddJournalItem } from "@/components/sections/journal-personnel/add-journal-item";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement
function JournalAddLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded"></div>
        <Card className="p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 w-1/2 bg-gray-200 dark:bg-gray-800 rounded"></div>
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

// Composant principal avec Suspense
export default function AddJournalEntryPage() {
  return (
    <Suspense fallback={<JournalAddLoading />}>
      <JournalAddContent />
    </Suspense>
  );
}

// Composant qui contient le formulaire d'ajout
function JournalAddContent() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <AddJournalItem />
    </section>
  );
}
