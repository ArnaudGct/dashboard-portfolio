import { useEffect, useState } from "react";
import type {
  AnalyticsSeriesPoint,
  AnalyticsTrendPeriod,
} from "@/types/analytics";

interface AnalyticsTrendResponse {
  trafficTrend?: AnalyticsSeriesPoint[];
}

export function useAnalyticsTrend(period: AnalyticsTrendPeriod) {
  const [data, setData] = useState<AnalyticsSeriesPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrend() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/analytics?trendPeriod=${period}`);
        const analyticsData = (await response
          .json()
          .catch(() => null)) as AnalyticsTrendResponse | null;

        if (!response.ok) {
          throw new Error(
            (analyticsData as { message?: string } | null)?.message ||
              (analyticsData as { error?: string } | null)?.error ||
              "Erreur lors de la récupération de l'évolution du trafic",
          );
        }

        setData(analyticsData?.trafficTrend || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue",
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTrend();
  }, [period]);

  return { data, loading, error };
}
