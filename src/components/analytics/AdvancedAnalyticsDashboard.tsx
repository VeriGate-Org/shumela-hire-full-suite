import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  UsersIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  DocumentChartBarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  ApplicationVolumeChart,
  PipelineFunnelChart,
  SourceEffectivenessChart,
  TimeToHireChart,
  PerformanceGaugeChart,
  MonthlyTrendsChart,
} from '../charts';
import { apiFetch } from '@/lib/api-fetch';
import { FilterValue } from './InteractiveFilters';

// Time range days lookup (kept internal for filtering volume data)
const timeRangeDays: Record<string, number> = {
  week: 7,
  month: 30,
  quarter: 90,
  year: 365,
};

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  filters?: FilterValue[];
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface DashboardData {
  applicationVolume: Array<{ date: string; applications: number; interviews: number; offers: number; hires: number }>;
  pipeline: Array<{ stage: string; count: number }>;
  source: Array<{ source: string; applications: number; hires: number; conversionRate: number }>;
  timeToHire: Array<{ position: string; timeToHire: number; target: number }>;
  performance: Array<{ metric: string; current: number; target: number; percentage: number }>;
  monthly: Array<{ month: string; applications: number; interviews: number; offers: number; hires: number; rejections: number }>;
  summary: {
    totalApplications: number;
    totalHires: number;
    conversionRate: number;
    avgTimeToHire: number;
    applicationsTrend: string;
    hiresTrend: string;
    conversionTrend: string;
    timeToHireTrend: string;
  };
}

function buildFilterQuery(filters?: FilterValue[]): string {
  if (!filters || filters.length === 0) return '';
  const params = new URLSearchParams();
  for (const f of filters) {
    if (f.value !== undefined && f.value !== '' && f.value !== null) {
      if (Array.isArray(f.value)) {
        if (f.value.length > 0) params.set(f.id, f.value.join(','));
      } else {
        params.set(f.id, String(f.value));
      }
    }
  }
  const qs = params.toString();
  return qs ? `&${qs}` : '';
}

function mapDashboardResponse(dashboardData: Record<string, unknown>, kpiData: Record<string, unknown>): DashboardData {
  const kpis = (kpiData as { kpis?: Record<string, { value?: number; trend?: string; variance?: number }> })?.kpis ?? {};
  const trends = (dashboardData as { trends?: { data?: Record<string, Array<{ date: string; value: number }>> } })?.trends?.data ?? {};

  // Map KPI values
  const totalApplications = kpis['total_applications']?.value ?? 0;
  const interviewConversionRate = kpis['interview_conversion_rate']?.value ?? 0;
  const avgResponseTimeHours = kpis['avg_response_time_hours']?.value ?? 0;
  const offersMade = kpis['offers_made']?.value ?? 0;
  const acceptanceRate = kpis['acceptance_rate']?.value ?? 0;
  const timeToFillDays = kpis['time_to_fill_days']?.value ?? 0;

  // Application Volume from trends
  const appTrends = trends['total_applications'] ?? [];
  const applicationVolume = appTrends.map((t: { date: string; value: number }) => ({
    date: t.date,
    applications: Number(t.value) || 0,
    interviews: 0,
    offers: 0,
    hires: 0,
  }));

  // Pipeline stages from stage_*_percentage KPIs
  const stageNames = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'];
  const stageKeys = ['stage_applied_percentage', 'stage_screening_percentage', 'stage_interview_percentage', 'stage_offer_percentage', 'stage_hired_percentage'];
  const pipeline = stageNames.map((stage, i) => ({
    stage,
    count: Math.round(Number(kpis[stageKeys[i]]?.value ?? 0) * Number(totalApplications) / 100) || 0,
  }));
  if (pipeline.every(p => p.count === 0) && totalApplications > 0) {
    pipeline[0].count = Number(totalApplications);
  }

  // Source effectiveness
  const sourceEffectiveness = kpis['source_effectiveness_score']?.value;
  const source = sourceEffectiveness
    ? [{ source: 'All Sources', applications: Number(totalApplications), hires: Number(offersMade), conversionRate: Number(sourceEffectiveness) }]
    : [];

  // Time to hire
  const timeToHire = timeToFillDays
    ? [{ position: 'Overall', timeToHire: Number(timeToFillDays), target: 30 }]
    : [];

  // Performance gauges
  const performance: DashboardData['performance'] = [];
  if (interviewConversionRate) {
    performance.push({ metric: 'Interview Conversion', current: Number(interviewConversionRate), target: 100, percentage: Number(interviewConversionRate) });
  }
  if (acceptanceRate) {
    performance.push({ metric: 'Offer Acceptance', current: Number(acceptanceRate), target: 100, percentage: Number(acceptanceRate) });
  }
  if (kpis['no_show_rate']?.value !== undefined) {
    const noShowRate = Number(kpis['no_show_rate'].value);
    performance.push({ metric: 'Show-up Rate', current: 100 - noShowRate, target: 95, percentage: Math.min(100, ((100 - noShowRate) / 95) * 100) });
  }
  if (kpis['avg_interview_score']?.value !== undefined) {
    const avgScore = Number(kpis['avg_interview_score'].value);
    performance.push({ metric: 'Avg Interview Score', current: avgScore, target: 4, percentage: Math.min(100, (avgScore / 4) * 100) });
  }

  // Monthly trends
  const monthlyMap = new Map<string, { applications: number; interviews: number; offers: number; hires: number; rejections: number }>();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const entry of appTrends) {
    const d = new Date(entry.date);
    const month = monthNames[d.getMonth()];
    const existing = monthlyMap.get(month) ?? { applications: 0, interviews: 0, offers: 0, hires: 0, rejections: 0 };
    existing.applications += Number(entry.value) || 0;
    monthlyMap.set(month, existing);
  }
  const monthly = Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }));

  // Trend indicators
  const getTrendStr = (key: string): string => {
    const kpi = kpis[key];
    if (!kpi) return '';
    const variance = Number(kpi.variance ?? 0);
    if (variance > 0) return `+${variance.toFixed(1)}%`;
    if (variance < 0) return `${variance.toFixed(1)}%`;
    return '0%';
  };

  const totalHires = Number(offersMade) || 0;
  const conversionRate = Number(totalApplications) > 0 ? (totalHires / Number(totalApplications)) * 100 : 0;

  return {
    applicationVolume,
    pipeline,
    source,
    timeToHire,
    performance,
    monthly,
    summary: {
      totalApplications: Number(totalApplications),
      totalHires,
      conversionRate,
      avgTimeToHire: Number(timeToFillDays) || Number(avgResponseTimeHours) / 24 || 0,
      applicationsTrend: getTrendStr('total_applications'),
      hiresTrend: getTrendStr('offers_made'),
      conversionTrend: getTrendStr('interview_conversion_rate'),
      timeToHireTrend: getTrendStr('time_to_fill_days'),
    },
  };
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  className = '',
  filters,
  timeRange = 'month',
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filterQuery = buildFilterQuery(filters);
      const [dashboardRes, kpiRes] = await Promise.all([
        apiFetch(`/api/analytics/dashboard?date=${new Date().toISOString().split('T')[0]}${filterQuery}`),
        apiFetch(`/api/analytics/kpis?${filterQuery.replace(/^&/, '')}`),
      ]);

      if (!dashboardRes.ok || !kpiRes.ok) {
        throw new Error('Failed to load analytics data');
      }

      const [dashboardJson, kpiJson] = await Promise.all([dashboardRes.json(), kpiRes.json()]);
      const mapped = mapDashboardResponse(dashboardJson, kpiJson);

      // If all summary stats are zero, try computing from raw list data
      if (mapped.summary.totalApplications === 0 && mapped.summary.totalHires === 0) {
        try {
          const [appRes, intRes, offerRes] = await Promise.allSettled([
            apiFetch('/api/applications?size=1'),
            apiFetch('/api/interviews?size=1'),
            apiFetch('/api/offers?size=1'),
          ]);
          const getTotal = (r: PromiseSettledResult<Response>) => {
            if (r.status === 'fulfilled' && r.value.ok) {
              return r.value.json().then((d: Record<string, unknown>) => Number((d as Record<string, unknown>).totalElements) || 0);
            }
            return Promise.resolve(0);
          };
          const [totalApps, , totalOffers] = await Promise.all([getTotal(appRes), getTotal(intRes), getTotal(offerRes)]);
          if (totalApps > 0 || totalOffers > 0) {
            mapped.summary.totalApplications = totalApps;
            mapped.summary.totalHires = totalOffers;
            mapped.summary.conversionRate = totalApps > 0 ? Math.round((totalOffers / totalApps) * 1000) / 10 : 0;
            if (mapped.pipeline.length > 0 && mapped.pipeline.every(p => p.count === 0)) {
              mapped.pipeline[0].count = totalApps;
            }
          }
        } catch {
          // Keep original mapped data
        }
      }

      setData(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData, timeRange]);

  // Filter application volume by time range
  const filteredVolumeData = useMemo(() => {
    if (!data) return [];
    const days = timeRangeDays[timeRange] ?? 30;
    return data.applicationVolume.slice(-days);
  }, [data, timeRange]);

  const summaryStats = data?.summary ?? {
    totalApplications: 0,
    totalHires: 0,
    conversionRate: 0,
    avgTimeToHire: 0,
    applicationsTrend: '',
    hiresTrend: '',
    conversionTrend: '',
    timeToHireTrend: '',
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded-card border border-border p-6 shadow-sm animate-pulse">
              <div className="h-10 bg-muted rounded mb-4"></div>
              <div className="h-6 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-card border border-border p-6 shadow-sm animate-pulse h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${className}`}>
        <div className="bg-card rounded-card border border-border border-t-2 border-t-red-500 p-8 shadow-sm text-center">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load analytics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const statCards: Array<{ title: string; value: string; icon: typeof ChartBarIcon; color: string; change: string | null; changeType: 'positive' | 'negative' }> = [
    {
      title: 'Total Applications',
      value: summaryStats.totalApplications.toLocaleString(),
      icon: DocumentChartBarIcon,
      color: 'text-gold-600 bg-gold-100',
      change: summaryStats.applicationsTrend || null,
      changeType: summaryStats.applicationsTrend?.startsWith('-') ? 'negative' : 'positive',
    },
    {
      title: 'Total Hires',
      value: summaryStats.totalHires.toString(),
      icon: UsersIcon,
      color: 'text-green-600 bg-green-100',
      change: summaryStats.hiresTrend || null,
      changeType: summaryStats.hiresTrend?.startsWith('-') ? 'negative' : 'positive',
    },
    {
      title: 'Conversion Rate',
      value: `${summaryStats.conversionRate.toFixed(1)}%`,
      icon: ArrowTrendingUpIcon,
      color: 'text-primary bg-primary/10',
      change: summaryStats.conversionTrend || null,
      changeType: summaryStats.conversionTrend?.startsWith('-') ? 'negative' : 'positive',
    },
    {
      title: 'Avg Time to Hire',
      value: summaryStats.avgTimeToHire > 0 ? `${summaryStats.avgTimeToHire.toFixed(0)} days` : '--',
      icon: ClockIcon,
      color: 'text-orange-600 bg-orange-100',
      change: summaryStats.timeToHireTrend || null,
      changeType: summaryStats.timeToHireTrend?.startsWith('-') ? 'positive' : 'negative',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 4 Summary stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-card rounded-card border border-border border-t-2 border-t-cta p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-sm ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.change && (
                <span
                  className={`text-sm font-medium ${
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.change}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Application Volume — full width */}
      <ApplicationVolumeChart
        data={filteredVolumeData}
        timeframe={timeRange === 'week' ? 'week' : timeRange === 'month' ? 'month' : 'quarter'}
      />

      {/* Pipeline Funnel + Performance Gauges — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PipelineFunnelChart data={data?.pipeline ?? []} />
        <PerformanceGaugeChart data={data?.performance ?? []} />
      </div>

      {/* Monthly Trends — full width */}
      <MonthlyTrendsChart data={data?.monthly ?? []} />

      {/* Source Effectiveness + Time to Hire — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourceEffectivenessChart data={data?.source ?? []} />
        <TimeToHireChart data={data?.timeToHire ?? []} />
      </div>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;
