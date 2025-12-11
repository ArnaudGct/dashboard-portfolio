"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { reorderFaqAction } from "@/actions/faq-actions";

type Faq = {
  id_faq: number;
  titre: string;
  contenu: string;
  ordre: number;
  afficher: boolean;
};

interface FaqOrderedListProps {
  faqs: Faq[];
}

export function FaqOrderedList({ faqs }: FaqOrderedListProps) {
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const router = useRouter();

  const handleReorder = async (faqId: number, direction: "up" | "down") => {
    try {
      setIsLoading(faqId);
      const result = await reorderFaqAction(faqId, direction);
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erreur lors de la réorganisation:", error);
      toast.error("Erreur lors de la réorganisation des FAQ");
    } finally {
      setIsLoading(null);
    }
  };

  const handleCardClick = (faqId: number) => {
    router.push(`/accueil/faq/edit/${faqId}`);
  };

  // Séparer les FAQ visibles et non visibles
  const visibleFaqs = faqs.filter((faq) => faq.afficher);
  const hiddenFaqs = faqs.filter((faq) => !faq.afficher);

  return (
    <div className="flex flex-col gap-8">
      {/* FAQ visibles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {visibleFaqs.map((faq, index) => (
          <Card
            key={faq.id_faq}
            className="w-full cursor-pointer hover:shadow-md transition-all"
            onClick={() => handleCardClick(faq.id_faq)}
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
                      onClick={() => handleReorder(faq.id_faq, "up")}
                      disabled={isLoading === faq.id_faq || index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                      onClick={() => handleReorder(faq.id_faq, "down")}
                      disabled={
                        isLoading === faq.id_faq ||
                        index === visibleFaqs.length - 1
                      }
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <span>{faq.titre}</span>
                </div>
                <div className="flex gap-1 items-center text-muted-foreground">
                  <Eye size={18} />
                  <span className="text-sm">Visible</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{faq.contenu}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ non visibles */}
      {hiddenFaqs.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
            Questions non visibles
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
            {hiddenFaqs.map((faq, index) => (
              <div key={faq.id_faq} className="opacity-60">
                <Card
                  className="w-full cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleCardClick(faq.id_faq)}
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
                            onClick={() => handleReorder(faq.id_faq, "up")}
                            disabled={isLoading === faq.id_faq || index === 0}
                          >
                            <ChevronUp className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 cursor-pointer hover:bg-primary/10"
                            onClick={() => handleReorder(faq.id_faq, "down")}
                            disabled={
                              isLoading === faq.id_faq ||
                              index === hiddenFaqs.length - 1
                            }
                          >
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <span>{faq.titre}</span>
                      </div>
                      <div className="flex gap-1 items-center text-muted-foreground">
                        <EyeOff size={18} />
                        <span className="text-sm">Non visible</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{faq.contenu}</ReactMarkdown>
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
