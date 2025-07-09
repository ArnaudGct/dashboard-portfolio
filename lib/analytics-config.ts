// Configuration pour les graphiques et couleurs Analytics
export const ANALYTICS_CONFIG = {
  // Couleurs pour les graphiques
  colors: {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    neutral: "#6b7280",
    gradient: ["#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"],
  },

  // Intervalles de rafraîchissement
  refreshIntervals: {
    realTime: 30 * 1000, // 30 secondes
    standard: 5 * 60 * 1000, // 5 minutes
    detailed: 15 * 60 * 1000, // 15 minutes
  },

  // Formats d'affichage
  formats: {
    locale: "fr-FR",
    currency: "EUR",
    dateTime: {
      short: { hour: "2-digit", minute: "2-digit" },
      long: {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    },
  },

  // Limites d'affichage
  limits: {
    topPages: 5,
    topCountries: 5,
    recentActivity: 5,
    trafficSources: 5,
  },
};

// Utilitaires pour le formatage
export const formatNumber = (num: number): string => {
  return num.toLocaleString(ANALYTICS_CONFIG.formats.locale);
};

export const formatPercentage = (num: number): string => {
  return `${num.toFixed(1)}%`;
};

export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays}j`;
};

export const getChangeColor = (change: string): string => {
  if (change.startsWith("+")) return "text-green-600";
  if (change.startsWith("-")) return "text-red-600";
  return "text-gray-600";
};

export const getChangeIcon = (change: string): "up" | "down" | "neutral" => {
  if (change.startsWith("+")) return "up";
  if (change.startsWith("-")) return "down";
  return "neutral";
};
