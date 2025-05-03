export interface Video {
  video: {
    id_vid: number;
    titre: string;
    description: string;
    lien: string;
    duree: string;
    afficher: boolean;
    videos_tags_link: Array<{
      id_tags: number;
      videos_tags: {
        id_tags: number;
        titre: string;
      };
    }>;
  };
}
