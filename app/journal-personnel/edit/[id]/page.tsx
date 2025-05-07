import { getJournalEntryByIdAction } from "@/actions/journal-actions";
import { EditJournalItem } from "@/components/sections/journal-personnel/edit-journal-item";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function EditJournalItemPage({ params }: PageProps) {
  const id = parseInt(params.id);

  if (isNaN(id)) {
    notFound();
  }

  const journalEntry = await getJournalEntryByIdAction(id);

  if (!journalEntry) {
    notFound();
  }

  return (
    <section className="w-[90%] mx-auto mb-8">
      <EditJournalItem initialData={journalEntry} />
    </section>
  );
}
