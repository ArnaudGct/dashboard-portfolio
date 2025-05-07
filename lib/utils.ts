import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

// Fonction de formatage de date ajoutée
export function formatDate(
  date: Date | string,
  formatString: string = "dd MMMM yyyy"
) {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, formatString, { locale: fr });
}

// Format de date pour afficher la période (mois année - mois année)
export function formatDatePeriod(
  dateDebut: Date | string,
  dateFin?: Date | string | null
) {
  const debut = typeof dateDebut === "string" ? new Date(dateDebut) : dateDebut;

  // Format court pour le mois et l'année
  const formatMoisAnnee = "MMM yyyy";

  if (!dateFin) {
    // Si pas de date de fin, on affiche "depuis mois année"
    return `${format(debut, formatMoisAnnee, { locale: fr })}`;
  }

  const fin = typeof dateFin === "string" ? new Date(dateFin) : dateFin;

  // Format de période complète
  return `${format(debut, formatMoisAnnee, { locale: fr })} - ${format(fin, formatMoisAnnee, { locale: fr })}`;
}
