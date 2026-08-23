"use client";

import { Github } from "lucide-react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

type OutilProps = {
  outil: {
    id_outil: number;
    titre: string;
    description: string;
    logo: string;
    miniature: string;
    lien_github: string;
    derniere_modification: Date;
  };
};

export function OutilItem({ outil }: OutilProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/outils/edit/${outil.id_outil}`);
  };

  // Prévenir la navigation si on clique sur les liens
  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    if (url) window.open(url, "_blank");
  };

  const getImageUrl = (path: string) => {
    // Si l'URL commence déjà par http ou https, elle est complète
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }

    // Si c'est une URL relative (commence par /uploads), ajouter le domaine du portfolio
    if (path.startsWith("/uploads")) {
      // URL de base du portfolio (à configurer dans .env si nécessaire)
      return `${PORTFOLIO_BASE_URL}${path}`;
    }

    // Fallback à un placeholder si l'URL n'est pas valide
    return "/placeholder-project.jpg";
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex flex-col justify-center xl:justify-start items-center xl:flex-row gap-6 p-6">
        <div className="relative w-full min-w-[250px] lg:min-w-[350px] max-w-[500px] shrink-0 rounded-lg overflow-hidden aspect-video min-h-[180px]">
          <Image
            src={getImageUrl(outil.miniature)}
            alt={outil.titre}
            fill
            className="rounded-lg object-cover object-center"
            priority
            onError={(e) => {
              // Fallback en cas d'erreur
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder-project.jpg";
            }}
          />
        </div>
        <div className="flex flex-col gap-4 py-6 w-full">
          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">{outil.titre}</p>
            <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{outil.description}</ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-end items-center mt-auto">
            <div className="flex gap-2">
              {outil.lien_github && (
                <Button
                  variant="ghost"
                  onClick={(e) => handleLinkClick(e, outil.lien_github)}
                  className="p-1 cursor-pointer"
                >
                  <SiGithub size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
