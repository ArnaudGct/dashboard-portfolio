"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { reorderTemoignageAction } from "@/actions/temoignages-actions";

type Temoignage = {
  id_tem: number;
  contenu: string;
  client: string;
  plateforme: string;
  ordre: number;
  afficher: boolean;
};

interface TemoignagesOrderedListProps {
  temoignages: Temoignage[];
}

export function TemoignagesOrderedList({
  temoignages,
}: TemoignagesOrderedListProps) {
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const router = useRouter();

  const handleReorder = async (
    temoignageId: number,
    direction: "up" | "down"
  ) => {
    try {
      setIsLoading(temoignageId);
      const result = await reorderTemoignageAction(temoignageId, direction);
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erreur lors de la réorganisation:", error);
      toast.error("Erreur lors de la réorganisation des témoignages");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCardClick = (temoignageId: number) => {
    router.push(`/accueil/temoignages/edit/${temoignageId}`);
  };

  // Séparer les témoignages visibles et non visibles
  const visibleTemoignages = temoignages.filter((t) => t.afficher);
  const hiddenTemoignages = temoignages.filter((t) => !t.afficher);

  return (
    <div className="flex flex-col gap-8">
      {/* Témoignages visibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {visibleTemoignages.map((temoignage, index) => (
          <Card
            key={temoignage.id_tem}
            className="w-full cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleCardClick(temoignage.id_tem)}
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
                      onClick={() => handleReorder(temoignage.id_tem, "up")}
                      disabled={isLoading === temoignage.id_tem || index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                      onClick={() => handleReorder(temoignage.id_tem, "down")}
                      disabled={
                        isLoading === temoignage.id_tem ||
                        index === visibleTemoignages.length - 1
                      }
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span>{temoignage.client}</span>
                </div>
                <div className="flex gap-1 items-center text-muted-foreground">
                  <Eye size={18} />
                  <span className="text-sm">Visible</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{temoignage.contenu}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Témoignages non visibles */}
      {hiddenTemoignages.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
            Témoignages non visibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {hiddenTemoignages.map((temoignage, index) => (
              <div key={temoignage.id_tem} className="opacity-60">
                <Card
                  className="w-full cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleCardClick(temoignage.id_tem)}
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
                            onClick={() =>
                              handleReorder(temoignage.id_tem, "up")
                            }
                            disabled={
                              isLoading === temoignage.id_tem || index === 0
                            }
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                            onClick={() =>
                              handleReorder(temoignage.id_tem, "down")
                            }
                            disabled={
                              isLoading === temoignage.id_tem ||
                              index === hiddenTemoignages.length - 1
                            }
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <span>{temoignage.client}</span>
                      </div>
                      <div className="flex gap-1 items-center text-muted-foreground">
                        <EyeOff size={18} />
                        <span className="text-sm">Non visible</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{temoignage.contenu}</ReactMarkdown>
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
