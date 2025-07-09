import { NextResponse } from "next/server";
import { google } from "googleapis";

// Fonction pour traiter les données Google Analytics
function processAnalyticsData(
  mainResponse: any,
  pagesResponse: any,
  countriesResponse: any,
  devicesResponse: any
) {
  const rows = mainResponse.data.rows || [];
  const currentPeriod = rows.filter(
    (row: any) => row.dimensionValues[0].value >= getDateString(30)
  );
  const previousPeriod = rows.filter(
    (row: any) => row.dimensionValues[0].value < getDateString(30)
  );

  // Calcul des métriques
  const currentMetrics = calculateMetrics(currentPeriod);
  const previousMetrics = calculateMetrics(previousPeriod);

  // Pages populaires
  const topPages =
    pagesResponse.data.rows?.slice(0, 5).map((row: any) => ({
      path: row.dimensionValues[0].value,
      title: row.dimensionValues[1].value || row.dimensionValues[0].value,
      pageviews: parseInt(row.metricValues[0].value),
    })) || [];

  // Pays
  const totalSessions =
    countriesResponse.data.rows?.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues[0].value),
      0
    ) || 1;

  const topCountries =
    countriesResponse.data.rows?.slice(0, 5).map((row: any) => {
      const sessions = parseInt(row.metricValues[0].value);
      return {
        country: row.dimensionValues[0].value,
        sessions,
        percentage: (sessions / totalSessions) * 100,
      };
    }) || [];

  // Appareils
  const totalDeviceSessions =
    devicesResponse.data.rows?.reduce(
      (sum: number, row: any) => sum + parseInt(row.metricValues[0].value),
      0
    ) || 1;

  const deviceTypes =
    devicesResponse.data.rows?.map((row: any) => {
      const sessions = parseInt(row.metricValues[0].value);
      return {
        type: row.dimensionValues[0].value,
        sessions,
        percentage: (sessions / totalDeviceSessions) * 100,
      };
    }) || [];

  return {
    pageviews: {
      total: currentMetrics.pageviews + previousMetrics.pageviews,
      thisMonth: currentMetrics.pageviews,
      lastMonth: previousMetrics.pageviews,
      change: calculateChange(
        currentMetrics.pageviews,
        previousMetrics.pageviews
      ),
    },
    sessions: {
      total: currentMetrics.sessions + previousMetrics.sessions,
      thisMonth: currentMetrics.sessions,
      lastMonth: previousMetrics.sessions,
      change: calculateChange(
        currentMetrics.sessions,
        previousMetrics.sessions
      ),
    },
    users: {
      total: currentMetrics.users + previousMetrics.users,
      thisMonth: currentMetrics.users,
      lastMonth: previousMetrics.users,
      change: calculateChange(currentMetrics.users, previousMetrics.users),
    },
    averageSessionDuration: {
      current: formatDuration(currentMetrics.avgSessionDuration),
      previous: formatDuration(previousMetrics.avgSessionDuration),
      change: calculateChange(
        currentMetrics.avgSessionDuration,
        previousMetrics.avgSessionDuration
      ),
    },
    bounceRate: {
      current: `${currentMetrics.bounceRate.toFixed(1)}%`,
      previous: `${previousMetrics.bounceRate.toFixed(1)}%`,
      change: calculateChange(
        previousMetrics.bounceRate,
        currentMetrics.bounceRate
      ), // Inversé car un taux de rebond plus bas est mieux
    },
    topPages,
    topCountries,
    deviceTypes,
    // Pas de sources de trafic - nécessite une requête séparée à Google Analytics
    trafficSources: [],
    // Pas de visiteurs temps réel - nécessite l'API Real Time Reporting
    realTimeVisitors: 0,
    recentActivity: [], // Pas d'activité récente - nécessite une requête séparée
  };
}

function calculateMetrics(rows: any[]) {
  return rows.reduce(
    (acc, row) => {
      acc.pageviews += parseInt(row.metricValues[0].value) || 0;
      acc.sessions += parseInt(row.metricValues[1].value) || 0;
      acc.users += parseInt(row.metricValues[2].value) || 0;
      acc.avgSessionDuration += parseFloat(row.metricValues[3].value) || 0;
      acc.bounceRate += parseFloat(row.metricValues[4].value) || 0;
      return acc;
    },
    {
      pageviews: 0,
      sessions: 0,
      users: 0,
      avgSessionDuration: 0,
      bounceRate: 0,
    }
  );
}

function calculateChange(current: number, previous: number): string {
  if (previous === 0) return "+0%";
  const change = ((current - previous) / previous) * 100;
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

function getDateString(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0].replace(/-/g, "");
}

export async function GET() {
  try {
    // Vérifier si les variables d'environnement sont configurées
    const useRealData =
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (useRealData) {
      console.log("Utilisation des données réelles Google Analytics");

      // Configuration pour Google Analytics avec vraies données
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
            /\\n/g,
            "\n"
          ),
        },
        scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
      });

      const analyticsData = google.analyticsdata("v1beta");
      const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;

      try {
        // Requête pour les métriques principales
        const response = await analyticsData.properties.runReport({
          auth,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [
              { startDate: "30daysAgo", endDate: "yesterday" },
              { startDate: "60daysAgo", endDate: "31daysAgo" },
            ],
            metrics: [
              { name: "screenPageViews" },
              { name: "sessions" },
              { name: "activeUsers" },
              { name: "averageSessionDuration" },
              { name: "bounceRate" },
            ],
            dimensions: [{ name: "date" }],
          },
        });

        // Requête pour les pages populaires
        const pagesResponse = await analyticsData.properties.runReport({
          auth,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
            metrics: [{ name: "screenPageViews" }],
            dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
            limit: "5",
            orderBys: [
              { metric: { metricName: "screenPageViews" }, desc: true },
            ],
          },
        });

        // Requête pour les pays
        const countriesResponse = await analyticsData.properties.runReport({
          auth,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
            metrics: [{ name: "sessions" }],
            dimensions: [{ name: "country" }],
            limit: "5",
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          },
        });

        // Requête pour les appareils
        const devicesResponse = await analyticsData.properties.runReport({
          auth,
          property: `properties/${propertyId}`,
          requestBody: {
            dateRanges: [{ startDate: "30daysAgo", endDate: "yesterday" }],
            metrics: [{ name: "sessions" }],
            dimensions: [{ name: "deviceCategory" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          },
        });

        // Traitement des données réelles
        const realData = processAnalyticsData(
          response,
          pagesResponse,
          countriesResponse,
          devicesResponse
        );
        console.log("Données réelles récupérées avec succès");
        return NextResponse.json(realData);
      } catch (analyticsError) {
        console.error(
          "Erreur lors de l'appel à Google Analytics:",
          analyticsError
        );

        // Retourner une erreur au lieu des données mockées
        return NextResponse.json(
          {
            error:
              "Erreur lors de la récupération des données Google Analytics",
            message:
              analyticsError instanceof Error
                ? analyticsError.message
                : "Erreur inconnue",
          },
          { status: 503 }
        );
      }
    } else {
      console.log("Variables d'environnement manquantes pour Google Analytics");

      // Retourner une erreur si les variables d'environnement ne sont pas configurées
      return NextResponse.json(
        {
          error: "Configuration Google Analytics manquante",
          message:
            "Veuillez configurer GOOGLE_ANALYTICS_PROPERTY_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL et GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
        },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des données Analytics:",
      error
    );
    return NextResponse.json(
      {
        error: "Erreur serveur lors de la récupération des données Analytics",
        message: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
