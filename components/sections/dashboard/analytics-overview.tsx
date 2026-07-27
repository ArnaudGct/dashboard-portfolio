"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAnalyticsTrend } from "@/hooks/use-analytics-trend";
import { AnalyticsTrendPeriod } from "@/types/analytics";
import {
  Clock,
  Eye,
  Globe,
  Monitor,
  MousePointer,
  Smartphone,
  Tablet,
  Users,
} from "lucide-react";
import { MetricTrend, SimpleChart, VerticalBarChart } from "./analytics-charts";

const TREND_PERIOD_OPTIONS: Array<{
  value: AnalyticsTrendPeriod;
  label: string;
}> = [
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "12mo", label: "12 derniers mois" },
];

export function AnalyticsOverview() {
  const { data, loading, error } = useAnalytics();
  const [trendPeriod, setTrendPeriod] = useState<AnalyticsTrendPeriod>("30d");
  const {
    data: trendData,
    loading: trendLoading,
    error: trendError,
  } = useAnalyticsTrend(trendPeriod);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Pages vues", icon: <Eye className="h-4 w-4" /> },
            { title: "Sessions", icon: <MousePointer className="h-4 w-4" /> },
            { title: "Utilisateurs", icon: <Users className="h-4 w-4" /> },
            { title: "Durée moyenne", icon: <Clock className="h-4 w-4" /> },
          ].map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-8 w-20" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-12" />
                  <span className="ml-1">depuis le mois dernier</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Pages les plus visitées</CardTitle>
              <CardDescription>Ce mois-ci</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{index + 1}</Badge>
                      <div>
                        <Skeleton className="mb-1 h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="mb-1 h-4 w-12" />
                      <p className="text-xs text-muted-foreground">vues</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pays des visiteurs</CardTitle>
              <CardDescription>Répartition par pays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="w-full rounded-full bg-muted h-2">
                      <Skeleton
                        className="h-2 rounded-full"
                        style={{ width: `${[75, 60, 45, 80, 35][index % 5]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Types d'appareils</CardTitle>
              <CardDescription>Répartition par type d'appareil</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    type: "Desktop",
                    icon: <Monitor className="h-4 w-4 text-muted-foreground" />,
                  },
                  {
                    type: "Mobile",
                    icon: (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    ),
                  },
                  {
                    type: "Tablet",
                    icon: <Tablet className="h-4 w-4 text-muted-foreground" />,
                  },
                ].map((device, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {device.icon}
                        <span className="font-medium">{device.type}</span>
                      </div>
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="w-full rounded-full bg-muted h-2">
                      <Skeleton
                        className="h-2 rounded-full"
                        style={{ width: `${[65, 45, 55][index % 3]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Configuration Plausible requise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Pour afficher vos vraies données Plausible, veuillez configurer
              les variables d'environnement suivantes :
            </p>
            <ul className="list-inside list-disc space-y-2 text-sm">
              <li>
                <code className="rounded bg-muted px-2 py-1">
                  PLAUSIBLE_SITE_ID
                </code>
              </li>
              <li>
                <code className="rounded bg-muted px-2 py-1">
                  PLAUSIBLE_API_KEY
                </code>
              </li>
              <li>
                <code className="rounded bg-muted px-2 py-1">
                  PLAUSIBLE_API_BASE_URL
                </code>
              </li>
            </ul>
            <p className="mt-4 text-sm text-muted-foreground">
              Ces variables doivent être configurées dans votre fichier{" "}
              <code className="rounded bg-muted px-2 py-1">.env.local</code>{" "}
              pour récupérer les données depuis Plausible.
            </p>
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Aucune donnée mockée ne sera affichée.
                Seules les vraies données Plausible seront utilisées.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-5">
        <MetricTrend
          title="Pages vues"
          value={data.pageviews.thisMonth.toLocaleString()}
          change={data.pageviews.change}
          description="depuis le mois dernier"
          icon={<Eye className="h-4 w-4" />}
        />
        <MetricTrend
          title="Sessions"
          value={data.sessions.thisMonth.toLocaleString()}
          change={data.sessions.change}
          description="depuis le mois dernier"
          icon={<MousePointer className="h-4 w-4" />}
        />
        <MetricTrend
          title="Utilisateurs"
          value={data.users.thisMonth.toLocaleString()}
          change={data.users.change}
          description="depuis le mois dernier"
          icon={<Users className="h-4 w-4" />}
        />
        <MetricTrend
          title="Durée moyenne"
          value={data.averageSessionDuration.current}
          change={data.averageSessionDuration.change}
          description="depuis le mois dernier"
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricTrend
          title="Taux de rebond"
          value={data.bounceRate.current}
          change={data.bounceRate.change}
          description="depuis le mois dernier"
          icon={<MousePointer className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visiteurs en direct</CardTitle>
            <CardDescription>Visiteurs actifs maintenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.realTimeVisitors}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              visiteurs sur les 5 dernières minutes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Temps moyen</CardTitle>
            <CardDescription>Durée moyenne d'une visite</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {data.averageSessionDuration.current}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              moyenne par visite
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pages les plus visitées</CardTitle>
            <CardDescription>Ce mois-ci</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topPages.map((page, index) => (
                <div
                  key={`page-${index}-${page.path}`}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{page.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {page.path}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {page.pageviews.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">vues</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pays des visiteurs</CardTitle>
            <CardDescription>Répartition par pays</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.topCountries.map((country, index) => (
                <div
                  key={`country-${index}-${country.country}`}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {country.sessions.toLocaleString()}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({country.percentage}%)
                      </span>
                    </div>
                  </div>
                  <Progress value={country.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Types d'appareils</CardTitle>
            <CardDescription>Répartition par type d'appareil</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.deviceTypes.map((device, index) => {
                const Icon =
                  device.type === "Desktop"
                    ? Monitor
                    : device.type === "Mobile"
                      ? Smartphone
                      : Tablet;

                return (
                  <div
                    key={`device-${index}-${device.type}`}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{device.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">
                          {device.sessions.toLocaleString()}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({device.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={device.percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {data.trafficSources && data.trafficSources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sources de trafic</CardTitle>
              <CardDescription>D'où viennent vos visiteurs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.trafficSources.map((source, index) => (
                  <div
                    key={`source-${index}-${source.source}`}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{source.source}</span>
                      <div className="text-right">
                        <span className="font-medium">
                          {source.sessions.toLocaleString()}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({source.percentage}%)
                        </span>
                      </div>
                    </div>
                    <Progress value={source.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Évolution du trafic</CardTitle>
              <CardDescription>
                Barres verticales basées sur les données Plausible
              </CardDescription>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trend-period">Période</Label>
              <Select
                value={trendPeriod}
                onValueChange={(value) =>
                  setTrendPeriod(value as AnalyticsTrendPeriod)
                }
              >
                <SelectTrigger id="trend-period" className="w-[180px]">
                  <SelectValue placeholder="Choisir une période" />
                </SelectTrigger>
                <SelectContent>
                  {TREND_PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="min-w-0 overflow-hidden">
          {trendLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          ) : trendError ? (
            <p className="text-sm text-destructive">{trendError}</p>
          ) : (
            <VerticalBarChart
              title="Trafic"
              description={`Période sélectionnée: ${TREND_PERIOD_OPTIONS.find((option) => option.value === trendPeriod)?.label ?? "Mois"}`}
              data={trendData}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {data.browsers && data.browsers.length > 0 && (
          <SimpleChart
            title="Navigateurs"
            description="Répartition des navigateurs"
            data={data.browsers}
          />
        )}

        {data.operatingSystems && data.operatingSystems.length > 0 && (
          <SimpleChart
            title="Systèmes d'exploitation"
            description="Répartition des systèmes d'exploitation"
            data={data.operatingSystems}
          />
        )}
      </div>

      {data.recentActivity && data.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>Dernières visites sur le site</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentActivity.map((activity, index) => (
                <div
                  key={`activity-${index}-${activity.timestamp.getTime()}`}
                  className="flex items-center justify-between rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="font-medium">{activity.page}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.country}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.timestamp instanceof Date
                      ? activity.timestamp.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : new Date(activity.timestamp).toLocaleTimeString(
                          "fr-FR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
