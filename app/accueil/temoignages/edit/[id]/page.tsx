import { notFound } from "next/navigation";
import { getTemoignageByIdAction } from "@/actions/temoignages-actions";
import { EditTemoignageItem } from "@/components/sections/temoignages/edit-temoignage-item";

interface EditTemoignagePageProps {
  params: {
    id: string;
  };
}

export default async function EditTemoignagePage({
  params,
}: EditTemoignagePageProps) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    notFound();
  }

  const temoignage = await getTemoignageByIdAction(id);
  if (!temoignage) {
    notFound();
  }

  return (
    <section className="w-[90%] mx-auto mb-8">
      <EditTemoignageItem initialData={temoignage} />
    </section>
  );
}
