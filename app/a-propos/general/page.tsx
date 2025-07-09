import Link from "next/link";
import { JournalItem } from "@/components/sections/journal-personnel/journal-item";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateAProposGeneral } from "@/actions/a-propos_general-actions";
import prisma from "@/lib/prisma";
import { AProposGeneralForm } from "@/components/sections/a-propos/general/AProposGeneral";

// Composant de chargement pour Suspense
function AProposGeneralLoading() {
  return (
    <div className="flex flex-col gap-10">
      <Card className="p-6 animate-pulse">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-32 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
          <div className="h-10 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </Card>
    </div>
  );
}

export const revalidate = 60; // Revalidation des données toutes les 60 secondes

export default function AProposGeneral() {
  return (
    <section className="w-[90%] mx-auto mb-8">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-start">
          <p className="text-3xl font-bold">Général</p>
        </div>

        {/* Utiliser Suspense pour le chargement asynchrone */}
        <Suspense fallback={<AProposGeneralLoading />}>
          <AProposGeneralList />
        </Suspense>
      </div>
    </section>
  );
}

async function AProposGeneralList() {
  const aproposData = await prisma.apropos_general.findFirst();

  return (
    <div className="flex flex-col gap-10">
      <Card className="p-6">
        <AProposGeneralForm
          aproposData={aproposData}
          updateAction={updateAProposGeneral}
        />
      </Card>
    </div>
  );
}
