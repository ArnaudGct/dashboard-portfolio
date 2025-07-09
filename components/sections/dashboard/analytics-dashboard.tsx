"use client";

import { AnalyticsOverview } from "@/components/sections/dashboard/analytics-overview";
import { AnalyticsHeader } from "@/components/sections/dashboard/analytics-header";
import { useAnalytics } from "@/hooks/use-analytics";

export function AnalyticsDashboard() {
  const { data, loading, error } = useAnalytics();
  const hasData = !error && !loading && data !== null;

  return (
    <div className="w-[90%] mx-auto p-6">
      <AnalyticsHeader hasData={hasData} />
      <AnalyticsOverview />
    </div>
  );
}
