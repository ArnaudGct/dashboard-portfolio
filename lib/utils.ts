import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractYoutubeId(url: string): string {
  if (!url) return "";

  try {
    // Gérer les formats d'URL YouTube courants
    if (url.includes("youtu.be/")) {
      // Format court: https://youtu.be/VIDEO_ID
      return url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/watch")) {
      // Format classique: https://www.youtube.com/watch?v=VIDEO_ID
      const urlObj = new URL(url);
      return urlObj.searchParams.get("v") || "";
    } else if (url.includes("youtube.com/embed/")) {
      // Format embed: https://www.youtube.com/embed/VIDEO_ID
      return url.split("youtube.com/embed/")[1]?.split("?")[0] || "";
    }
  } catch (error) {
    console.error("Erreur lors de l'extraction de l'ID YouTube:", error);
  }

  return "";
}
