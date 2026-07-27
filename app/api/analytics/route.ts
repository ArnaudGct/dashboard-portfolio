import { NextRequest, NextResponse } from "next/server";
import type { AnalyticsData } from "@/types/analytics";

export const dynamic = "force-dynamic";

type PlausibleAggregateResponse = {
  results?: {
    visitors?: { value?: number };
    visits?: { value?: number };
    pageviews?: { value?: number };
    bounce_rate?: { value?: number };
    visit_duration?: { value?: number };
  };
};

type PlausibleBreakdownRow = {
  page?: string;
  country?: string;
  source?: string;
  device?: string;
  browser?: string;
  os?: string;
  date?: string;
  visitors?: number;
  visits?: number;
  pageviews?: number;
};

type PlausibleBreakdownResponse = {
  results?: PlausibleBreakdownRow[];
};

const DEFAULT_PLAUSIBLE_API_BASE_URL = "https://plausible.arnaudgct.fr";
const DEFAULT_SITE_ID = "arnaudgct.fr";

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getDateRange(daysAgoStart: number, daysAgoEnd: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgoStart);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - daysAgoEnd);

  return `${formatDate(startDate)},${formatDate(endDate)}`;
}

function calculateChange(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? "+0%" : "+100%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function roundPercentage(value: number): number {
  return Math.round(value * 10) / 10;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function toCountryName(codeOrName: string | undefined) {
  if (!codeOrName) return "Inconnu";

  if (codeOrName.length !== 2) return codeOrName;

  try {
    const displayNames = new Intl.DisplayNames(["fr"], { type: "region" });
    return displayNames.of(codeOrName.toUpperCase()) || codeOrName;
  } catch {
    return codeOrName;
  }
}

function derivePageTitle(path: string) {
  if (!path || path === "/") return "Accueil";

  const slug = path.split("/").filter(Boolean).pop() || path;
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

async function queryAggregate(period: string, date?: string) {
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID || DEFAULT_SITE_ID;
  const baseUrl = (
    process.env.PLAUSIBLE_API_BASE_URL || DEFAULT_PLAUSIBLE_API_BASE_URL
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new Error(
      "Veuillez configurer PLAUSIBLE_API_KEY dans votre fichier .env.local.",
    );
  }

  const url = new URL(`${baseUrl}/api/v1/stats/aggregate`);
  url.searchParams.set("site_id", siteId);
  url.searchParams.set("period", period);
  if (date) {
    url.searchParams.set("date", date);
  }
  url.searchParams.set(
    "metrics",
    "visitors,visits,pageviews,bounce_rate,visit_duration",
  );

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const payload = (await response
    .json()
    .catch(() => null)) as PlausibleAggregateResponse | null;

  if (!response.ok) {
    throw new Error(
      (payload as { message?: string } | null)?.message ||
        "Impossible de récupérer les statistiques Plausible.",
    );
  }

  return payload?.results || {};
}

async function queryBreakdown(property: string, period: string, limit = 5) {
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID || DEFAULT_SITE_ID;
  const baseUrl = (
    process.env.PLAUSIBLE_API_BASE_URL || DEFAULT_PLAUSIBLE_API_BASE_URL
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new Error(
      "Veuillez configurer PLAUSIBLE_API_KEY dans votre fichier .env.local.",
    );
  }

  const url = new URL(`${baseUrl}/api/v1/stats/breakdown`);
  url.searchParams.set("site_id", siteId);
  url.searchParams.set("period", period);
  url.searchParams.set("property", property);
  url.searchParams.set("metrics", "visitors,pageviews,visits");
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const payload = (await response
    .json()
    .catch(() => null)) as PlausibleBreakdownResponse | null;

  if (!response.ok) {
    throw new Error(
      (payload as { message?: string } | null)?.message ||
        "Impossible de récupérer les statistiques Plausible.",
    );
  }

  return payload?.results || [];
}

async function queryTimeseries(period: string) {
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID || DEFAULT_SITE_ID;
  const baseUrl = (
    process.env.PLAUSIBLE_API_BASE_URL || DEFAULT_PLAUSIBLE_API_BASE_URL
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new Error(
      "Veuillez configurer PLAUSIBLE_API_KEY dans votre fichier .env.local.",
    );
  }

  const url = new URL(`${baseUrl}/api/v1/stats/timeseries`);
  url.searchParams.set("site_id", siteId);
  url.searchParams.set("period", period);
  url.searchParams.set("metrics", "visitors,pageviews");
  url.searchParams.set("interval", period === "12mo" ? "month" : "date");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const payload = (await response.json().catch(() => null)) as {
    results?: Array<{ date?: string; visitors?: number; pageviews?: number }>;
  } | null;

  if (!response.ok) {
    throw new Error(
      (payload as { message?: string } | null)?.message ||
        "Impossible de récupérer les statistiques Plausible.",
    );
  }

  return payload?.results || [];
}

async function queryRealtimeVisitors() {
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const siteId = process.env.PLAUSIBLE_SITE_ID || DEFAULT_SITE_ID;
  const baseUrl = (
    process.env.PLAUSIBLE_API_BASE_URL || DEFAULT_PLAUSIBLE_API_BASE_URL
  ).replace(/\/$/, "");

  if (!apiKey) {
    return 0;
  }

  const url = new URL(`${baseUrl}/api/v1/stats/realtime/visitors`);
  url.searchParams.set("site_id", siteId);

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    return 0;
  }

  const text = await response.text();
  return Number(text) || 0;
}

function buildAnalyticsData(
  currentSnapshot: {
    pageviews: number;
    sessions: number;
    users: number;
    bounceRate: number;
    visitDuration: number;
  },
  previousSnapshot: {
    pageviews: number;
    sessions: number;
    users: number;
    bounceRate: number;
    visitDuration: number;
  },
  pagesResponse: PlausibleBreakdownRow[],
  countriesResponse: PlausibleBreakdownRow[],
  devicesResponse: PlausibleBreakdownRow[],
  sourcesResponse: PlausibleBreakdownRow[],
  browsersResponse: PlausibleBreakdownRow[],
  osResponse: PlausibleBreakdownRow[],
  trafficTrendResponse: Array<{
    date?: string;
    visitors?: number;
    pageviews?: number;
  }>,
  realTimeVisitors: number,
  trendPeriod?: string,
): AnalyticsData {
  const topPages =
    pagesResponse.slice(0, 5).map((row: PlausibleBreakdownRow) => {
      const path = row.page || "/";
      return {
        path,
        title: derivePageTitle(path),
        pageviews: toNumber(row.pageviews || row.visitors),
      };
    }) || [];

  const countryRows = countriesResponse || [];
  const totalCountrySessions =
    countryRows.reduce(
      (sum: number, row: PlausibleBreakdownRow) =>
        sum + toNumber(row.visitors || row.visits),
      0,
    ) || 1;

  const topCountries = countryRows
    .slice(0, 5)
    .map((row: PlausibleBreakdownRow) => {
      const sessions = toNumber(row.visitors || row.visits);

      return {
        country: toCountryName(row.country),
        sessions,
        percentage: roundPercentage((sessions / totalCountrySessions) * 100),
      };
    });

  const deviceRows = devicesResponse || [];
  const totalDeviceSessions =
    deviceRows.reduce(
      (sum: number, row: PlausibleBreakdownRow) =>
        sum + toNumber(row.visitors || row.visits),
      0,
    ) || 1;

  const deviceTypes = deviceRows.map((row: PlausibleBreakdownRow) => {
    const sessions = toNumber(row.visitors || row.visits);

    return {
      type: row.device || "Unknown",
      sessions,
      percentage: roundPercentage((sessions / totalDeviceSessions) * 100),
    };
  });

  const trafficRows = sourcesResponse || [];
  const totalTrafficSessions =
    trafficRows.reduce(
      (sum: number, row: PlausibleBreakdownRow) =>
        sum + toNumber(row.visitors || row.visits),
      0,
    ) || 1;

  const trafficSources = trafficRows
    .slice(0, 5)
    .map((row: PlausibleBreakdownRow) => {
      const sessions = toNumber(row.visitors || row.visits);

      return {
        source: row.source || "Direct",
        sessions,
        percentage: roundPercentage((sessions / totalTrafficSessions) * 100),
      };
    });

  const browsersRows = browsersResponse || [];
  const totalBrowserSessions =
    browsersRows.reduce(
      (sum: number, row: PlausibleBreakdownRow) =>
        sum + toNumber(row.visitors || row.visits),
      0,
    ) || 1;

  const browsers = browsersRows
    .slice(0, 5)
    .map((row: PlausibleBreakdownRow) => {
      const sessions = toNumber(row.visitors || row.visits);

      return {
        label: row.browser || "Unknown",
        sessions,
        percentage: roundPercentage((sessions / totalBrowserSessions) * 100),
      };
    });

  const osRows = osResponse || [];
  const totalOsSessions =
    osRows.reduce(
      (sum: number, row: PlausibleBreakdownRow) =>
        sum + toNumber(row.visitors || row.visits),
      0,
    ) || 1;

  const operatingSystems = osRows
    .slice(0, 5)
    .map((row: PlausibleBreakdownRow) => {
      const sessions = toNumber(row.visitors || row.visits);

      return {
        label: row.os || "Unknown",
        sessions,
        percentage: roundPercentage((sessions / totalOsSessions) * 100),
      };
    });

  const maxTrendValue = Math.max(
    ...trafficTrendResponse.map((point) =>
      toNumber(point.visitors || point.pageviews),
    ),
    1,
  );

  const trafficTrend = trafficTrendResponse.map((point) => {
    let label = point.date || "";
    if (label) {
      const date = new Date(label);
      if (!isNaN(date.getTime())) {
        if (trendPeriod === "12mo") {
          label = new Intl.DateTimeFormat("fr-FR", { month: "long" }).format(date);
          label = label.charAt(0).toUpperCase() + label.slice(1);
        } else {
          label = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(date);
        }
      }
    }

    return {
      label,
      value: toNumber(point.visitors || point.pageviews),
      percentage: roundPercentage(
        (toNumber(point.visitors || point.pageviews) / maxTrendValue) * 100,
      ),
    };
  });

  return {
    pageviews: {
      total: currentSnapshot.pageviews + previousSnapshot.pageviews,
      thisMonth: currentSnapshot.pageviews,
      lastMonth: previousSnapshot.pageviews,
      change: calculateChange(
        currentSnapshot.pageviews,
        previousSnapshot.pageviews,
      ),
    },
    sessions: {
      total: currentSnapshot.sessions + previousSnapshot.sessions,
      thisMonth: currentSnapshot.sessions,
      lastMonth: previousSnapshot.sessions,
      change: calculateChange(
        currentSnapshot.sessions,
        previousSnapshot.sessions,
      ),
    },
    users: {
      total: currentSnapshot.users + previousSnapshot.users,
      thisMonth: currentSnapshot.users,
      lastMonth: previousSnapshot.users,
      change: calculateChange(currentSnapshot.users, previousSnapshot.users),
    },
    averageSessionDuration: {
      current: formatDuration(currentSnapshot.visitDuration),
      previous: formatDuration(previousSnapshot.visitDuration),
      change: calculateChange(
        currentSnapshot.visitDuration,
        previousSnapshot.visitDuration,
      ),
    },
    bounceRate: {
      current: `${currentSnapshot.bounceRate.toFixed(1)}%`,
      previous: `${previousSnapshot.bounceRate.toFixed(1)}%`,
      change: calculateChange(
        previousSnapshot.bounceRate,
        currentSnapshot.bounceRate,
      ),
    },
    topPages,
    topCountries,
    deviceTypes,
    trafficSources,
    trafficTrend,
    browsers,
    operatingSystems,
    realTimeVisitors,
    recentActivity: [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const previousRange = getDateRange(60, 31);
    const trendPeriod =
      request.nextUrl.searchParams.get("trendPeriod") || "30d";

    const [
      currentResponse,
      previousResponse,
      pagesResponse,
      countriesResponse,
      devicesResponse,
      sourcesResponse,
      browsersResponse,
      osResponse,
      trafficTrendResponse,
      realTimeVisitors,
    ] = await Promise.all([
      queryAggregate("30d"),
      queryAggregate("custom", previousRange),
      queryBreakdown("event:page", "30d", 5),
      queryBreakdown("visit:country", "30d", 5),
      queryBreakdown("visit:device", "30d", 5),
      queryBreakdown("visit:source", "30d", 5),
      queryBreakdown("visit:browser", "30d", 5),
      queryBreakdown("visit:os", "30d", 5),
      queryTimeseries(trendPeriod),
      queryRealtimeVisitors(),
    ]);

    const currentSnapshot = {
      pageviews: currentResponse.pageviews?.value || 0,
      sessions: currentResponse.visits?.value || 0,
      users: currentResponse.visitors?.value || 0,
      bounceRate: currentResponse.bounce_rate?.value || 0,
      visitDuration: currentResponse.visit_duration?.value || 0,
    };

    const previousSnapshot = {
      pageviews: previousResponse.pageviews?.value || 0,
      sessions: previousResponse.visits?.value || 0,
      users: previousResponse.visitors?.value || 0,
      bounceRate: previousResponse.bounce_rate?.value || 0,
      visitDuration: previousResponse.visit_duration?.value || 0,
    };

    return NextResponse.json(
      buildAnalyticsData(
        currentSnapshot,
        previousSnapshot,
        pagesResponse,
        countriesResponse,
        devicesResponse,
        sourcesResponse,
        browsersResponse,
        osResponse,
        trafficTrendResponse,
        realTimeVisitors,
        trendPeriod,
      ),
    );
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données Plausible:",
      error,
    );

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des données Plausible",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 503 },
    );
  }
}
