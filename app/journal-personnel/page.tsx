import Link from "next/link";
import { getAllJournalEntriesAction } from "@/actions/journal-actions";
import { JournalItem } from "@/components/sections/journal-personnel/journal-item";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";

// Composant de chargement pour Suspense
function JournalLoading() {
  return (
    <div className="flex flex-col gap-10">
      {/* Année */}
      {[1, 2].map((year) => (
        <div key={year} className="flex flex-col gap-4">
          <div className="h-7 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
          <div className="flex flex-col gap-6">
            {/* Entries pour chaque année */}
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="p-6 animate-pulse">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                    <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  </div>
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded"></div>
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function JournalPersonnel() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">Journal personnel</p>
          <div className="flex gap-2">
            <Link href="/journal-personnel/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter une expérience
              </Button>
            </Link>
          </div>
        </div>

        <Suspense fallback={<JournalLoading />}>
          <JournalContent />
        </Suspense>
      </div>
    </section>
  );
}

// Composant asynchrone pour récupérer et afficher les données
async function JournalContent() {
  try {
    const experiences = await getAllJournalEntriesAction();

    // Utilisation de Map pour de meilleures performances
    const experiencesByYear = new Map<string, typeof experiences>();

    // Optimisation: utiliser forEach au lieu d'itérer plusieurs fois
    experiences.forEach((experience) => {
      let year = "Sans date";

      if (experience.date_debut) {
        // Parse date_debut de manière plus efficace
        const dateStr = experience.date_debut;
        year = dateStr.includes("-") ? dateStr.split("-")[0] : dateStr;
      }

      // Optimisation avec Map
      if (!experiencesByYear.has(year)) {
        experiencesByYear.set(year, []);
      }
      experiencesByYear.get(year)?.push(experience);
    });

    // Pas d'expériences trouvées
    if (experiences.length === 0) {
      return (
        <Card className="p-6">
          <p className="text-center text-muted-foreground">
            Aucune expérience trouvée
          </p>
        </Card>
      );
    }

    // Convertir Map en array et trier les années
    const sortedYears = Array.from(experiencesByYear.keys()).sort(
      (a, b) => b.localeCompare(a) // Tri descendant
    );

    return (
      <div className="flex flex-col gap-10">
        {sortedYears.map((year) => {
          const yearExperiences = experiencesByYear.get(year) || [];
          return (
            <div key={year} className="flex flex-col gap-4">
              <p className="text-xl font-semibold">{year}</p>
              <div className="flex flex-col gap-6">
                {yearExperiences.map((experience) => (
                  <JournalItem key={experience.id_exp} entry={experience} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error("Erreur lors du chargement du journal:", error);
    return (
      <Card className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          Une erreur est survenue lors du chargement des expériences. Veuillez
          rafraîchir la page ou contacter l'administrateur.
        </div>
      </Card>
    );
  }
}
