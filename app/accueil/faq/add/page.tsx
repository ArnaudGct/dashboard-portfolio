import { AddFaqItem } from "@/components/sections/faq/add-faq-item";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";

// Composant de chargement
function FaqAddLoading() {
  return (
    <div className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded"></div>
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

// Composant principal avec Suspense
export default function AddFaqPage() {
  return (
    <Suspense fallback={<FaqAddLoading />}>
      <FaqAddContent />
    </Suspense>
  );
}

// Composant qui contient le formulaire d'ajout
function FaqAddContent() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <AddFaqItem />
    </section>
  );
}
