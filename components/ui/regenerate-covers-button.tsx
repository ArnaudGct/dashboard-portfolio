"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { regenerateAllAlbumCoversAction } from "@/actions/photos-actions";
import { toast } from "sonner";

interface RegenerateCoversButtonProps {
  className?: string;
}

export function RegenerateCoversButton({
  className,
}: RegenerateCoversButtonProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (isRegenerating) return;

    // Demander confirmation
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir régénérer toutes les couvertures d'albums ?\n\nCette opération peut prendre quelques minutes et remplacera toutes les couvertures existantes."
    );

    if (!confirmed) return;

    setIsRegenerating(true);

    try {
      console.log("Début de la régénération de toutes les couvertures...");

      // Afficher un toast de début
      toast.info("Régénération des couvertures d'albums en cours...", {
        duration: 3000,
      });

      const result = await regenerateAllAlbumCoversAction();

      if (result.success) {
        toast.success(result.message, {
          duration: 5000,
        });

        // Afficher les détails si disponibles
        if (result.details) {
          console.log("Détails de la régénération:", result.details);

          if (result.details.errors && result.details.errors.length > 0) {
            console.warn("Erreurs rencontrées:", result.details.errors);

            // Afficher un toast d'avertissement pour les erreurs
            toast.warning(
              `${result.details.errorCount} album(s) en erreur. Consultez la console pour plus de détails.`,
              {
                duration: 7000,
              }
            );
          }
        }
      } else {
        toast.error(result.message || "Erreur lors de la régénération", {
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la régénération:", error);
      toast.error("Erreur inattendue lors de la régénération", {
        duration: 5000,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      variant="outline"
      className={className}
    >
      <RefreshCw
        className={`w-4 h-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`}
      />
      {isRegenerating ? "Régénération..." : "Régénérer les couvertures"}
    </Button>
  );
}
