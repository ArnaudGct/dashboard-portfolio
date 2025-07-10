"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useAnalytics } from "@/hooks/use-analytics";
import { MetricTrend, SimpleChart } from "./analytics-charts";
import {
  Eye,
  Users,
  Clock,
  MousePointer,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";

export function AnalyticsOverview() {
  const { data, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Métriques principales - Skeleton */}
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Pages vues", icon: <Eye className="h-4 w-4" /> },
            { title: "Sessions", icon: <MousePointer className="h-4 w-4" /> },
            { title: "Utilisateurs", icon: <Users className="h-4 w-4" /> },
            { title: "Durée moyenne", icon: <Clock className="h-4 w-4" /> },
          ].map((metric, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
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
          {/* Pages populaires - Skeleton avec structure */}
          <Card>
            <CardHeader>
              <CardTitle>Pages les plus visitées</CardTitle>
              <CardDescription>Ce mois-ci</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{i + 1}</Badge>
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-4 w-12 mb-1" />
                      <p className="text-xs text-muted-foreground">vues</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pays - Skeleton avec structure */}
          <Card>
            <CardHeader>
              <CardTitle>Pays des visiteurs</CardTitle>
              <CardDescription>Répartition par pays</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <Skeleton
                        className="h-2 rounded-full"
                        style={{ width: `${[75, 60, 45, 80, 35][i % 5]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Types d'appareils - Skeleton avec structure */}
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
                ].map((device, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {device.icon}
                        <span className="font-medium">{device.type}</span>
                      </div>
                      <div className="text-right">
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <Skeleton
                        className="h-2 rounded-full"
                        style={{ width: `${[65, 45, 55][i % 3]}%` }}
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
            Configuration Analytics requise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Pour afficher vos vraies données Analytics, veuillez configurer
              les variables d'environnement suivantes :
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <code className="bg-muted px-2 py-1 rounded">
                  GOOGLE_ANALYTICS_PROPERTY_ID
                </code>
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">
                  GOOGLE_SERVICE_ACCOUNT_EMAIL
                </code>
              </li>
              <li>
                <code className="bg-muted px-2 py-1 rounded">
                  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
                </code>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              Ces variables doivent être configurées dans votre fichier{" "}
              <code className="bg-muted px-2 py-1 rounded">.env.local</code>{" "}
              pour récupérer les données depuis Google Analytics.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Aucune donnée mockée ne sera affichée.
                Seules les vraies données Google Analytics seront utilisées.
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
      {/* Métriques principales */}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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
      </div>

      {/* Visiteurs en temps réel - Masqué si pas de données réelles */}
      {data.realTimeVisitors > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Visiteurs en temps réel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {data.realTimeVisitors}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              visiteurs actuellement sur le site
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Pages populaires */}
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

        {/* Pays */}
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
                      <span className="text-sm text-muted-foreground ml-2">
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
        {/* Types d'appareils */}
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
                        <span className="text-sm text-muted-foreground ml-2">
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

        {/* Sources de trafic - Masqué si pas de données réelles */}
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
                        <span className="text-sm text-muted-foreground ml-2">
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

      {/* Activité récente */}
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
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
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
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
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
