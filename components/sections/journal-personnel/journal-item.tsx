"use client";

import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Eye, EyeOff, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDatePeriod, extractYoutubeId } from "@/lib/utils";
import { LiteYoutubeEmbed } from "react-lite-yt-embed";

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

type JournalItemProps = {
  entry: {
    id_exp: number;
    date?: Date;
    titre: string;
    description: string;
    url_img: string;
    position_img: string;
    afficher: boolean;
  };
};

export function JournalItem({ entry }: JournalItemProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/journal-personnel/edit/${entry.id_exp}`);
  };

  const getImageUrl = (path: string) => {
    if (!path) return null;

    if (path.startsWith("http")) {
      return path;
    } else if (path.startsWith("/uploads")) {
      return `${PORTFOLIO_BASE_URL}${path}`;
    } else if (
      path.startsWith("www.youtube.com") ||
      path.startsWith("youtube.com")
    ) {
      return `https://${path}`;
    }

    return path;
  };

  const isYoutubeUrl =
    entry.url_img?.includes("youtube.com") ||
    entry.url_img?.includes("youtu.be");
  const youtubeId = isYoutubeUrl ? extractYoutubeId(entry.url_img) : null;

  return (
    <Card
      className="w-full cursor-pointer hover:shadow-md transition-all"
      onClick={handleCardClick}
    >
      <div className="flex flex-col justify-center xl:justify-start items-center xl:flex-row gap-6 p-6">
        {youtubeId ? (
          <div className="relative w-full min-w-[250px] lg:min-w-[350px] max-w-[500px] shrink-0 rounded-lg overflow-hidden aspect-video min-h-[180px]">
            <LiteYoutubeEmbed id={youtubeId} />
          </div>
        ) : entry.url_img ? (
          <div className="relative w-full min-w-[250px] lg:min-w-[350px] max-w-[500px] shrink-0 rounded-lg overflow-hidden aspect-video min-h-[180px]">
            <Image
              src={getImageUrl(entry.url_img) || "/placeholder-image.jpg"}
              alt={entry.titre}
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
        ) : null}

        <div className="flex flex-col gap-4 py-6 w-full">
          <div className="flex flex-col gap-2">
            <p className="text-xl font-semibold">{entry.titre}</p>
            <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{entry.description}</ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center text-muted-foreground">
              {entry.afficher ? (
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
            <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              {entry.date
                ? new Date(entry.date).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                  })
                : "Sans date"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
