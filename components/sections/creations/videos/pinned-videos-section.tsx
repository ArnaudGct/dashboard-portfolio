"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pin, Plus, X, Search, ArrowUpDown } from "lucide-react";
import {
  pinVideoToHomeAction,
  unpinVideoFromHomeAction,
} from "@/actions/videos-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PinnedVideo = {
  id_vid: number;
  titre: string;
  lien: string;
  duree: string;
};

type UnpinnedVideo = {
  id_vid: number;
  titre: string;
  date: Date;
};

type PinnedVideosSectionProps = {
  pinnedVideos: PinnedVideo[];
  unpinnedVideos: UnpinnedVideo[];
};

export function PinnedVideosSection({
  pinnedVideos,
  unpinnedVideos,
}: PinnedVideosSectionProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "alpha">(
    "newest"
  );

  // Filtrer et trier les vidéos
  const filteredAndSortedVideos = useMemo(() => {
    let filtered = unpinnedVideos.filter((video) =>
      video.titre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortOrder === "oldest") {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return a.titre.localeCompare(b.titre);
      }
    });
  }, [unpinnedVideos, searchQuery, sortOrder]);

  const handleUnpin = async (videoId: number) => {
    try {
      setIsLoading(videoId);
      const result = await unpinVideoFromHomeAction(videoId);
      if (result.success) {
        toast.success("Vidéo désépinglée de l'accueil");
        router.refresh();
      }
    } catch (error) {
      console.error("Erreur lors du désépinglage:", error);
      toast.error("Erreur lors du désépinglage de la vidéo");
    } finally {
      setIsLoading(null);
    }
  };

  const handlePin = async (videoId: number) => {
    try {
      setIsLoading(videoId);
      const result = await pinVideoToHomeAction(videoId);
      if (result.success) {
        toast.success("Vidéo épinglée à l'accueil");
        setIsDialogOpen(false);
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Erreur lors de l'épinglage:", error);
      toast.error("Erreur lors de l'épinglage de la vidéo");
    } finally {
      setIsLoading(null);
    }
  };

  const canAddMore = pinnedVideos.length < 4;

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">
              Vidéos épinglées à l&apos;accueil
            </h2>
            <span className="text-sm text-muted-foreground">
              ({pinnedVideos.length}/4)
            </span>
          </div>

          {canAddMore && unpinnedVideos.length > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="overflow-hidden">
                <DialogHeader>
                  <DialogTitle>Épingler une vidéo à l&apos;accueil</DialogTitle>
                  <DialogDescription>
                    Sélectionnez une vidéo à afficher sur la page d&apos;accueil
                    (maximum 4 vidéos).
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher une vidéo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={sortOrder}
                    onValueChange={(value: "newest" | "oldest" | "alpha") =>
                      setSortOrder(value)
                    }
                  >
                    <SelectTrigger className="w-full cursor-pointer">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Plus récentes</SelectItem>
                      <SelectItem value="oldest">Plus anciennes</SelectItem>
                      <SelectItem value="alpha">Alphabétique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <ScrollArea className="max-h-[350px]">
                  <div className="flex flex-col gap-2 pr-4">
                    {filteredAndSortedVideos.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune vidéo trouvée
                      </p>
                    ) : (
                      filteredAndSortedVideos.map((video) => (
                        <Button
                          key={video.id_vid}
                          variant="ghost"
                          className="justify-start h-auto py-3 px-4 cursor-pointer w-full"
                          onClick={() => handlePin(video.id_vid)}
                          disabled={isLoading === video.id_vid}
                        >
                          <Pin className="h-4 w-4 mr-2 shrink-0 self-start mt-0.5" />
                          <div className="flex flex-col items-start text-left">
                            <span className="whitespace-normal break-words">
                              {video.titre}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(video.date).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </Button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {pinnedVideos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune vidéo épinglée à l&apos;accueil. Vous pouvez en épingler
            jusqu&apos;à 4.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pinnedVideos.map((video) => (
              <div
                key={video.id_vid}
                className="flex items-center justify-between gap-2 p-3 bg-secondary/50 rounded-lg"
              >
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium truncate">
                    {video.titre}
                  </span>
                  {video.duree && (
                    <span className="text-xs text-muted-foreground">
                      {video.duree}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleUnpin(video.id_vid)}
                  disabled={isLoading === video.id_vid}
                >
                  {isLoading === video.id_vid ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
