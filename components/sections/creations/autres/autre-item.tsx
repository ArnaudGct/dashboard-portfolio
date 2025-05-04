"use client";

import { Eye, EyeOff, Github, Figma, Globe } from "lucide-react";
import { SiFigma, SiGithub } from "@icons-pack/react-simple-icons";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/tag";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

type AutreProps = {
  autre: {
    id_autre: number;
    titre: string;
    description: string;
    miniature: string;
    lien_github: string;
    lien_figma: string;
    lien_site: string;
    categorie: string;
    date: Date;
    afficher: boolean;
    autre_tags_link: {
      id_autre: number;
      id_tags: number;
      autre_tags: {
        id_tags: number;
        titre: string;
        important: boolean;
      };
    }[];
  };
};

export function AutreItem({ autre }: AutreProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/creations/autres/edit/${autre.id_autre}`);
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
      <div className="flex flex-col justify-center lg:justify-start items-center lg:flex-row gap-6 p-6">
        <div className="relative w-full min-w-[250px] lg:min-w-[350px] max-w-[500px] shrink-0 rounded-lg overflow-hidden aspect-video min-h-[180px]">
          <Image
            src={getImageUrl(autre.miniature)}
            alt={autre.titre}
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
        <div className="flex flex-col gap-4 py-6">
          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">{autre.titre}</p>
            <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{autre.description}</ReactMarkdown>
            </div>
          </div>
          {autre.autre_tags_link.length > 0 && (
            <div className="flex gap-x-2 gap-y-1 items-center flex-wrap">
              {/* Trier les tags pour placer les importants en premier */}
              {[...autre.autre_tags_link]
                .sort((a, b) => {
                  // Les tags importants d'abord
                  if (a.autre_tags.important && !b.autre_tags.important)
                    return -1;
                  if (!a.autre_tags.important && b.autre_tags.important)
                    return 1;

                  // Ensuite par ordre alphabétique
                  return a.autre_tags.titre.localeCompare(b.autre_tags.titre);
                })
                .map((tagLink) => (
                  <Tag
                    key={tagLink.id_tags}
                    variant={
                      tagLink.autre_tags.important ? "outlined" : "default"
                    }
                  >
                    {tagLink.autre_tags.titre}
                  </Tag>
                ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center text-muted-foreground">
              {autre.afficher ? (
                <>
                  <Eye size={18} />
                  <p className="text-sm">Visible</p>
                </>
              ) : (
                <>
                  <EyeOff size={18} />
                  <p className="text-sm">Non visible</p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              {autre.lien_github && (
                <Button
                  variant="ghost"
                  onClick={(e) => handleLinkClick(e, autre.lien_github)}
                  className="p-1 cursor-pointer"
                >
                  <SiGithub size={18} />
                </Button>
              )}
              {autre.lien_figma && (
                <Button
                  variant="ghost"
                  onClick={(e) => handleLinkClick(e, autre.lien_figma)}
                  className="p-1 cursor-pointer"
                >
                  <SiFigma size={18} />
                </Button>
              )}
              {autre.lien_site && (
                <Button
                  variant="ghost"
                  onClick={(e) => handleLinkClick(e, autre.lien_site)}
                  className="p-1 cursor-pointer"
                >
                  <Globe size={18} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
