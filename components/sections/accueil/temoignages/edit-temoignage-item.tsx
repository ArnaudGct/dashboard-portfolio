"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon, Trash2 } from "lucide-react";
import {
  updateTemoignageAction,
  deleteTemoignageAction,
} from "@/actions/temoignages-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface EditTemoignageFormProps {
  initialData: {
    id_tem: number;
    client: string;
    plateforme: string;
    contenu: string;
    afficher: boolean;
    date?: string | null;
  };
}

export function EditTemoignageItem({ initialData }: EditTemoignageFormProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData.date ? new Date(initialData.date) : undefined
  );

  const handleUpdate = async (formData: FormData) => {
    setIsUpdating(true);

    if (selectedDate) {
      formData.set("date", format(selectedDate, "yyyy-MM-dd"));
    } else {
      formData.delete("date");
    }

    const result = await updateTemoignageAction(formData);
    if (result.success) {
      toast.success("Témoignage mis à jour !");
      router.push("/accueil/temoignages");
      router.refresh();
    } else {
      toast.error(result.error || "Une erreur est survenue.");
    }
    setIsUpdating(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteTemoignageAction(initialData.id_tem);
    if (result.success) {
      toast.success("Témoignage supprimé !");
      router.push("/accueil/temoignages");
      router.refresh();
    } else {
      toast.error(result.error || "Une erreur est survenue.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/accueil/temoignages">
                Témoignages
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Modifier</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" /> Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="cursor-pointer">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="cursor-pointer"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <form action={handleUpdate} className="flex flex-col gap-5">
        <input type="hidden" name="id" value={initialData.id_tem} />
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="client">Client</Label>
          <Input
            type="text"
            id="client"
            name="client"
            defaultValue={initialData.client}
            required
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="plateforme">Plateforme</Label>
          <Input
            type="text"
            id="plateforme"
            name="plateforme"
            defaultValue={initialData.plateforme}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal cursor-pointer",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? (
                  format(selectedDate, "d MMMM yyyy", { locale: fr })
                ) : (
                  <span>Sélectionner une date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="grid w-full gap-1.5">
          <Label htmlFor="contenu">Contenu</Label>
          <Textarea
            id="contenu"
            name="contenu"
            defaultValue={initialData.contenu}
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="afficher"
            name="afficher"
            defaultChecked={initialData.afficher}
            className="cursor-pointer"
          />
          <Label htmlFor="afficher">Afficher le témoignage</Label>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isUpdating}
            className="cursor-pointer"
          >
            {isUpdating ? "Mise à jour..." : "Mettre à jour"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => router.back()}
            disabled={isUpdating}
          >
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
