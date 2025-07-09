import { Card } from "@/components/ui/card";
import { EditOutilItem } from "@/components/sections/a-propos/outils/edit-outil-item";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

interface EditOutilProps {
  params: {
    id: string;
  };
}

export default async function EditOutil({ params }: EditOutilProps) {
  const { id } = await params;
  const outilId = parseInt(id);

  if (isNaN(outilId)) {
    notFound();
  }

  const outil = await prisma.apropos_outils.findUnique({
    where: { id_outil: outilId },
  });

  if (!outil) {
    notFound();
  }

  return (
    <section className="w-[90%] mx-auto mb-8">
      <EditOutilItem initialData={outil} />
    </section>
  );
}
