"use client";

import { Button } from "@/components/ui/button";
import { Plus, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/tag";
import { LiteYoutubeEmbed } from "react-lite-yt-embed";
import { useState, useEffect } from "react";

export default function Videos() {
  const [youtubeId, setYoutubeId] = useState("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // S'assurer que ce code ne s'exécute que côté client
    setIsClient(true);

    try {
      const parsedUrl = new URL("https://www.youtube.com/watch?v=I_hdJUyyet0");
      setYoutubeId(parsedUrl.searchParams.get("v") || "");
    } catch (error) {
      console.error(`❌ URL YouTube invalide :`, error);
    }
  }, []);

  return (
    <section className="w-[90%] mx-auto">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <p className="text-3xl font-bold">Vidéos</p>
          <div className="flex gap-2">
            <Link href="/creations/videos/tags">
              <Button variant="outline" className="cursor-pointer">
                Tags
              </Button>
            </Link>
            <Link href="/creations/videos/add">
              <Button className="cursor-pointer">
                <Plus /> Ajouter une vidéo
              </Button>
            </Link>
          </div>
        </div>
        <div>
          <Card>
            <div className="flex flex-col justify-center items-center lg:flex-row gap-6 px-6">
              {isClient && youtubeId ? (
                <div className="w-full aspect-video min-w-[250px] lg:min-w-[350px] max-w-[500px] rounded-lg overflow-hidden">
                  <LiteYoutubeEmbed id={youtubeId} />
                </div>
              ) : (
                <div className="w-full aspect-video bg-muted flex items-center justify-center min-w-[250px] lg:min-w-[350px] max-w-[500px] rounded-lg">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              )}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-xl font-semibold">Une parmi d'autres</p>
                  <p className="leading-7 text-muted-foreground">
                    Dans une forêt isolée, Nina, une jeune femme enlevée, lutte
                    pour survivre après avoir été abandonnée par ses ravisseurs.
                    Seule et désorientée, elle suit des signes énigmatiques qui
                    la mènent vers une issue inattendue. Mais derrière cette
                    fuite, une présence invisible semble guider ses pas. Entre
                    tension et mystère, "Une parmi d'autres" plonge dans une
                    course contre le temps où chaque détail compte et où rien
                    n'est vraiment ce qu'il paraît.
                  </p>
                </div>
                <div className="flex gap-x-2 gap-y-1 items-center flex-wrap">
                  <Tag>Court-métrage</Tag>
                </div>
                <div className="flex gap-1 items-center text-muted-foreground">
                  <Eye size={18} />
                  <p className="text-sm">Visible</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
