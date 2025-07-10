import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";
import prisma from "@/lib/prisma";
import { FaqItem } from "@/components/sections/accueil/faq/faq-item";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Composant de chargement pour Suspense
function FAQLoading() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const revalidate = 60; // Revalidation des données toutes les 60 secondes

export default function FAQ() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4 items-start sm:flex-row sm:items-center justify-between">
          <h1 className="text-3xl font-bold">Questions fréquemment posées</h1>
          <Link href="/accueil/faq/add">
            <Button className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Ajouter une question
            </Button>
          </Link>
        </div>

        {/* Utiliser Suspense pour le chargement asynchrone */}
        <Suspense fallback={<FAQLoading />}>
          <FAQList />
        </Suspense>
      </div>
    </section>
  );
}

async function FAQList() {
  try {
    // Récupérer toutes les FAQ
    const faqs = await prisma.faq.findMany({
      orderBy: {
        id_faq: "asc",
      },
    });

    // Si aucune FAQ, afficher un message
    if (faqs.length === 0) {
      return (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Aucune question fréquemment posée trouvée
          </p>
        </Card>
      );
    }

    // Séparer les FAQ visibles et non visibles
    const visibleFaqs = faqs.filter((faq) => faq.afficher);
    const hiddenFaqs = faqs.filter((faq) => !faq.afficher);

    return (
      <div className="flex flex-col gap-8">
        {/* FAQ visibles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
          {visibleFaqs.map((faq) => (
            <FaqItem key={faq.id_faq} faq={faq} />
          ))}
        </div>

        {/* FAQ non visibles (si on veut les afficher pour l'admin) */}
        {hiddenFaqs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
              Questions non visibles
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {hiddenFaqs.map((faq) => (
                <div key={faq.id_faq} className="opacity-60">
                  <FaqItem faq={faq} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error("Erreur lors du chargement des FAQ:", error);
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des questions. Veuillez
          réessayer ou contacter l'administrateur.
        </div>
      </Card>
    );
  }
}
