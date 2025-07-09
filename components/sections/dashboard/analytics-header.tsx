"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink } from "lucide-react";

interface AnalyticsHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
  hasData?: boolean;
}

export function AnalyticsHeader({
  onRefresh,
  isRefreshing = false,
  lastUpdated,
  hasData = true,
}: AnalyticsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Statistiques du site</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <p>
            Aperçu des données d'Analytics pour{" "}
            <a
              href="https://arnaudgct.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              arnaudgct.fr
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          {lastUpdated && (
            <>
              <span>•</span>
              <span className="text-sm">
                Dernière mise à jour :{" "}
                {lastUpdated.toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {hasData ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            Données en temps réel
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
            Configuration requise
          </Badge>
        )}

        {onRefresh && hasData && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualiser
          </Button>
        )}
      </div>
    </div>
  );
}
