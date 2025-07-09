import { notFound } from "next/navigation";
import { EditTemoignageItem } from "@/components/sections/accueil/temoignages/edit-temoignage-item";
import prisma from "@/lib/prisma";

interface EditTemoignagePageProps {
  params: {
    id: string;
  };
}

export default async function EditTemoignagePage({
  params,
}: EditTemoignagePageProps) {
  const { id } = await params;
  const temoignageId = parseInt(id);

  if (isNaN(temoignageId)) {
    notFound();
  }

  const temoignageEntry = await prisma.temoignages.findUnique({
    where: {
      id_tem: temoignageId,
    },
  });

  if (!temoignageEntry) {
    notFound();
  }

  return (
    <section className="w-[90%] mx-auto mb-8">
      <EditTemoignageItem initialData={temoignageEntry} />
    </section>
  );
}
