"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";
import ReactMarkdown from "react-markdown";

type TemoignageItemProps = {
  temoignage: {
    id_tem: number;
    contenu: string;
    client: string;
    afficher: boolean;
    plateforme: string;
  };
};

export function TemoignageItem({ temoignage }: TemoignageItemProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/accueil/temoignages/edit/${temoignage.id_tem}`);
  };

  return (
    <Card
      className="w-full cursor-pointer hover:shadow-md transition-all"
      onClick={handleCardClick}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{temoignage.client}</span>
          <div className="flex gap-1 items-center text-muted-foreground">
            {temoignage.afficher ? (
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
          <ReactMarkdown>{temoignage.contenu}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
