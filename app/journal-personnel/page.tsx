import Link from "next/link";
import { getAllJournalEntriesAction } from "@/actions/journal-actions";
import { JournalItem } from "@/components/sections/journal-personnel/journal-item";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";

export default async function JournalPersonnel() {
  const experiences = await getAllJournalEntriesAction();

  // Regrouper par année
  const experiencesByYear: Record<string, typeof experiences> = {};

  experiences.forEach((experience) => {
    let year = "Sans date";

    if (experience.date_debut) {
      // Parse date_debut qui peut être au format "YYYY-MM" ou "YYYY"
      const dateStr = experience.date_debut;
      if (dateStr.includes("-")) {
        const [y, m] = dateStr.split("-");
        year = y;
      } else {
        year = dateStr;
      }
    }

    if (!experiencesByYear[year]) {
      experiencesByYear[year] = [];
    }
    experiencesByYear[year].push(experience);
  });

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

        {experiences.length === 0 ? (
          <Card className="p-6">
            <p className="text-center text-muted-foreground">
              Aucune expérience trouvée
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-10">
            {Object.keys(experiencesByYear)
              .sort((a, b) => b.localeCompare(a)) // Tri descendant des années
              .map((year) => (
                <div key={year} className="flex flex-col gap-4">
                  <p className="text-xl font-semibold">{year}</p>
                  <div className="flex flex-col gap-6">
                    {experiencesByYear[year].map((experience) => (
                      <JournalItem key={experience.id_exp} entry={experience} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}
