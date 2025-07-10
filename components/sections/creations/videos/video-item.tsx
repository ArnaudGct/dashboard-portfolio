"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/tag";
import { LiteYoutubeEmbed } from "react-lite-yt-embed";
import { Video as VideoType } from "@/types/video";
import { useState, useEffect } from "react";
import { extractYoutubeId } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

export function VideoItem({ video }: VideoType) {
  const router = useRouter();
  // État pour suivre si nous sommes côté client
  const [isClient, setIsClient] = useState(false);

  // Extraire l'ID YouTube du lien
  const youtubeId = extractYoutubeId(video.lien);

  useEffect(() => {
    // S'assurer que ce code ne s'exécute que côté client
    setIsClient(true);
  }, []);

  const handleCardClick = () => {
    router.push(`/creations/videos/edit/${video.id_vid}`);
  };

  // Prévenir la navigation si on clique sur les boutons
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex flex-col justify-center xl:justify-start items-center xl:flex-row gap-6 px-6">
        {isClient && youtubeId ? (
          <div
            className="w-full aspect-video min-w-[250px] lg:min-w-[350px] max-w-[500px] rounded-lg overflow-hidden"
            onClick={handleButtonClick} // Empêcher la navigation lors du clic sur la vidéo
          >
            <LiteYoutubeEmbed id={youtubeId} />
          </div>
        ) : (
          <div className="w-full aspect-video bg-muted flex items-center justify-center min-w-[250px] lg:min-w-[350px] max-w-[500px] rounded-lg">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}

        <div className="flex flex-col gap-4 py-6 w-full">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">{video.titre}</p>
              {video.duree && (
                <span className="text-xs bg-secondary px-2 py-1 rounded-md">
                  {video.duree}
                </span>
              )}
            </div>
            <div className="leading-7 text-muted-foreground prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{video.description}</ReactMarkdown>
            </div>
          </div>

          {video.videos_tags_link.length > 0 && (
            <div className="flex gap-x-2 gap-y-1 items-center flex-wrap">
              {video.videos_tags_link.map((tagLink) => (
                <Tag key={tagLink.id_tags}>{tagLink.videos_tags.titre}</Tag>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-1 items-center text-muted-foreground">
              {video.afficher ? (
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
          </div>
        </div>
      </div>
    </Card>
  );
}
