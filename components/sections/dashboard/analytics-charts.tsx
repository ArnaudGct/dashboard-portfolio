"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricTrendProps {
  title: string;
  value: string | number;
  change: string;
  description?: string;
  icon?: React.ReactNode;
}

export function MetricTrend({
  title,
  value,
  change,
  description,
  icon,
}: MetricTrendProps) {
  const isPositive = change.startsWith("+");
  const isNegative = change.startsWith("-");
  const isNeutral = !isPositive && !isNegative;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive
    ? "text-green-600"
    : isNegative
      ? "text-red-600"
      : "text-gray-600";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <span className={trendColor}>{change}</span>
          {description && <span className="ml-1">{description}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

interface SimpleChartProps {
  data: Array<{ label: string; value: number; percentage: number }>;
  title: string;
  description?: string;
}

export function SimpleChart({ data, title, description }: SimpleChartProps) {
  const maxValue = Math.max(...data.map((item) => item.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.label}</span>
                <span className="text-muted-foreground">
                  {item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
