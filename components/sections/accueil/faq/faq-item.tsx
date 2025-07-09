"use client";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

type FaqItemProps = {
  faq: {
    id_faq: number;
    titre: string;
    contenu: string;
    afficher: boolean;
  };
};

export function FaqItem({ faq }: FaqItemProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/accueil/faq/edit/${faq.id_faq}`);
  };

  return (
    <Card
      className="w-full cursor-pointer hover:shadow-md transition-all"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{faq.titre}</span>
          <div className="flex gap-1 items-center text-muted-foreground">
            {faq.afficher ? (
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
        <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{faq.contenu}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
