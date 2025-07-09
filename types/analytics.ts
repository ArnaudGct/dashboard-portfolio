export interface AnalyticsMetric {
  total: number;
  thisMonth: number;
  lastMonth: number;
  change: string;
}

export interface AnalyticsPage {
  path: string;
  pageviews: number;
  title: string;
}

export interface AnalyticsCountry {
  country: string;
  sessions: number;
  percentage: number;
}

export interface AnalyticsDevice {
  type: string;
  sessions: number;
  percentage: number;
}

export interface AnalyticsTrafficSource {
  source: string;
  sessions: number;
  percentage: number;
}

export interface AnalyticsActivity {
  timestamp: Date;
  page: string;
  country: string;
}

export interface AnalyticsData {
  pageviews: AnalyticsMetric;
  sessions: AnalyticsMetric;
  users: AnalyticsMetric;
  averageSessionDuration: {
    current: string;
    previous: string;
    change: string;
  };
  bounceRate: {
    current: string;
    previous: string;
    change: string;
  };
  topPages: AnalyticsPage[];
  topCountries: AnalyticsCountry[];
  deviceTypes: AnalyticsDevice[];
  trafficSources: AnalyticsTrafficSource[];
  realTimeVisitors: number;
  recentActivity: AnalyticsActivity[];
}
