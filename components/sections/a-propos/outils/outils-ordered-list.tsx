"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { reorderOutilAction } from "@/actions/apropos_outils-actions";

type Outil = {
  id_outil: number;
  titre: string;
  description: string;
  icone: string;
  couleur_fond: string;
  couleur_contour: string;
  couleur_texte: string;
  ordre: number;
  afficher: boolean;
};

interface OutilsOrderedListProps {
  outils: Outil[];
}

export function OutilsOrderedList({ outils }: OutilsOrderedListProps) {
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const router = useRouter();

  const handleReorder = async (outilId: number, direction: "up" | "down") => {
    try {
      setIsLoading(outilId);
      const result = await reorderOutilAction(outilId, direction);
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erreur lors de la réorganisation:", error);
      toast.error("Erreur lors de la réorganisation des outils");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCardClick = (outilId: number) => {
    router.push(`/a-propos/outils/edit/${outilId}`);
  };

  // Séparer les outils visibles et non visibles
  const visibleOutils = outils.filter((outil) => outil.afficher);
  const hiddenOutils = outils.filter((outil) => !outil.afficher);

  return (
    <div className="flex flex-col gap-8">
      {/* Outils visibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {visibleOutils.map((outil, index) => (
          <Card
            key={outil.id_outil}
            className="w-full cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleCardClick(outil.id_outil)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="flex flex-col mr-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                      onClick={() => handleReorder(outil.id_outil, "up")}
                      disabled={isLoading === outil.id_outil || index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                      onClick={() => handleReorder(outil.id_outil, "down")}
                      disabled={
                        isLoading === outil.id_outil ||
                        index === visibleOutils.length - 1
                      }
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
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
                  <span style={{ color: outil.couleur_texte }}>
                    {outil.titre}
                  </span>
                </div>
                <div className="flex gap-1 items-center text-muted-foreground">
                  <Eye size={18} />
                  <span className="text-sm">Visible</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="leading-7 text-muted-foreground max-w-none">
                <p>{outil.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outils non visibles */}
      {hiddenOutils.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
            Outils non visibles
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {hiddenOutils.map((outil, index) => (
              <div key={outil.id_outil} className="opacity-60">
                <Card
                  className="w-full cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleCardClick(outil.id_outil)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className="flex flex-col mr-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                            onClick={() => handleReorder(outil.id_outil, "up")}
                            disabled={
                              isLoading === outil.id_outil || index === 0
                            }
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                            onClick={() =>
                              handleReorder(outil.id_outil, "down")
                            }
                            disabled={
                              isLoading === outil.id_outil ||
                              index === hiddenOutils.length - 1
                            }
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
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
                        <span style={{ color: outil.couleur_texte }}>
                          {outil.titre}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center text-muted-foreground">
                        <EyeOff size={18} />
                        <span className="text-sm">Non visible</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="leading-7 text-muted-foreground max-w-none">
                      <p>{outil.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
