"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteOutilAction,
  toggleOutilVisibilityAction,
} from "@/actions/apropos_outils-actions";

type Outil = {
  id_outil: number;
  titre: string;
  description: string;
  icone: string;
  couleur_fond: string;
  couleur_contour: string;
  couleur_texte: string;
  afficher: boolean;
};

interface OutilItemProps {
  outil: Outil;
}

export function OutilItem({ outil }: OutilItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteOutilAction(outil.id_outil);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error("Erreur lors de la suppression");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVisibility = async () => {
    try {
      const result = await toggleOutilVisibilityAction(
        outil.id_outil,
        !outil.afficher
      );
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Erreur lors du changement de visibilité:", error);
      toast.error("Erreur lors du changement de visibilité");
    }
  };

  const handleCardClick = () => {
    router.push(`/a-propos/outils/edit/${outil.id_outil}`);
  };

  return (
    <Card
      className="w-full cursor-pointer hover:shadow-md transition-all"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {outil.icone && (
              <div
                className="p-2 rounded-lg border-2 flex-shrink-0"
                style={{
                  backgroundColor: outil.couleur_fond,
                  borderColor: outil.couleur_contour,
                }}
              >
                <Image
                  src={outil.icone}
                  alt={outil.titre}
                  width={24}
                  height={24}
                  className="rounded"
                />
              </div>
            )}
            <span style={{ color: outil.couleur_texte }}>{outil.titre}</span>
          </div>
          <div className="flex gap-1 items-center text-muted-foreground">
            {outil.afficher ? (
              <>
                <Eye size={18} />
                <span className="text-sm">Visible</span>
              </>
            ) : (
              <>
                <EyeOff size={18} />
                <span className="text-sm">Non visible</span>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="leading-7 text-muted-foreground max-w-none">
          <p>{outil.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
