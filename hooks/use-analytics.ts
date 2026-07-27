import { useEffect, useState } from "react";
import { AnalyticsData } from "@/types/analytics";

// Fonction pour convertir les timestamps string en objets Date
function parseAnalyticsData(data: any): AnalyticsData {
  try {
    if (!data) {
      return {
        pageviews: { total: 0, thisMonth: 0, lastMonth: 0, change: "+0%" },
        sessions: { total: 0, thisMonth: 0, lastMonth: 0, change: "+0%" },
        users: { total: 0, thisMonth: 0, lastMonth: 0, change: "+0%" },
        averageSessionDuration: {
          current: "0m 0s",
          previous: "0m 0s",
          change: "+0%",
        },
        bounceRate: { current: "0.0%", previous: "0.0%", change: "+0%" },
        topPages: [],
        topCountries: [],
        deviceTypes: [],
        trafficSources: [],
        trafficTrend: [],
        browsers: [],
        operatingSystems: [],
        realTimeVisitors: 0,
        recentActivity: [],
      };
    }

    return {
      ...data,
      recentActivity:
        data.recentActivity?.map((activity: any) => ({
          ...activity,
          timestamp:
            activity.timestamp instanceof Date
              ? activity.timestamp
              : new Date(activity.timestamp),
        })) || [],
    };
  } catch (error) {
    console.warn("Erreur lors du parsing des données Analytics:", error);
    return {
      ...data,
      recentActivity: data.recentActivity || [],
    };
  }
}

// Fonction pour nettoyer et dédupliquer les données
function cleanAnalyticsData(data: AnalyticsData): AnalyticsData {
  return {
    ...data,
    topPages: data.topPages.filter(
      (page, index, self) =>
        index === self.findIndex((p) => p.path === page.path),
    ),
    topCountries: data.topCountries
      .filter(
        (country, index, self) =>
          index === self.findIndex((c) => c.country === country.country),
      )
      .map((country) => ({
        ...country,
        percentage: Math.round(country.percentage * 10) / 10, // Arrondi à 1 décimale
      })),
    deviceTypes: data.deviceTypes
      .filter(
        (device, index, self) =>
          index === self.findIndex((d) => d.type === device.type),
      )
      .map((device) => ({
        ...device,
        percentage: Math.round(device.percentage * 10) / 10, // Arrondi à 1 décimale
      })),
    trafficSources: data.trafficSources
      .filter(
        (source, index, self) =>
          index === self.findIndex((s) => s.source === source.source),
      )
      .map((source) => ({
        ...source,
        percentage: Math.round(source.percentage * 10) / 10, // Arrondi à 1 décimale
      })),
    trafficTrend: data.trafficTrend.map((point) => ({
      ...point,
      percentage: Math.round(point.percentage * 10) / 10,
    })),
    browsers: data.browsers
      .filter(
        (browser, index, self) =>
          index === self.findIndex((b) => b.label === browser.label),
      )
      .map((browser) => ({
        ...browser,
        percentage: Math.round(browser.percentage * 10) / 10,
      })),
    operatingSystems: data.operatingSystems
      .filter(
        (os, index, self) =>
          index === self.findIndex((item) => item.label === os.label),
      )
      .map((os) => ({
        ...os,
        percentage: Math.round(os.percentage * 10) / 10,
      })),
    recentActivity: data.recentActivity.filter(
      (activity, index, self) =>
        index ===
        self.findIndex(
          (a) =>
            a.timestamp.getTime() === activity.timestamp.getTime() &&
            a.page === activity.page,
        ),
    ),
  };
}

export function useAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/analytics");
        const analyticsData = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            analyticsData?.message ||
              analyticsData?.error ||
              "Erreur lors de la récupération des données",
          );
        }

        // Convertir les strings de date en objets Date
        const parsedData = parseAnalyticsData(analyticsData);

        // Nettoyer les données pour éviter les doublons
        const cleanedData = cleanAnalyticsData(parsedData);
        setData(cleanedData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();

    // Rafraîchir les données toutes les 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}
