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
  data: Array<{
    label: string;
    value?: number;
    sessions?: number;
    percentage: number;
  }>;
  title: string;
  description?: string;
}

export function SimpleChart({ data, title, description }: SimpleChartProps) {
  const maxValue = Math.max(
    ...data.map((item) => item.value ?? item.sessions ?? 0),
    1,
  );

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
                  {(item.value ?? item.sessions ?? 0).toLocaleString()} (
                  {item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(((item.value ?? item.sessions ?? 0) / maxValue) * 100).toFixed(1)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface VerticalBarChartProps {
  data: Array<{
    label: string;
    value?: number;
    sessions?: number;
    percentage: number;
  }>;
  title: string;
  description?: string;
}

export function VerticalBarChart({
  data,
  title,
  description,
}: VerticalBarChartProps) {
  const maxValue = Math.max(
    ...data.map((item) => item.value ?? item.sessions ?? 0),
    1,
  );

  return (
    <Card className="w-full min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex h-64 items-end gap-2 min-w-max pb-2">
          {data.map((item, index) => {
            const value = item.value ?? item.sessions ?? 0;
            const height = Math.max((value / maxValue) * 100, 4);

            return (
              <div
                key={`${item.label}-${index}`}
                className="flex min-w-[2.5rem] flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="text-xs font-medium text-muted-foreground">
                  {value.toLocaleString()}
                </div>
                <div className="flex h-44 w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-md bg-primary/90 transition-all duration-300 hover:bg-primary"
                    style={{ height: `${height}%` }}
                  />
                </div>
                <div className="max-w-full truncate text-center text-[10px] text-muted-foreground">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
