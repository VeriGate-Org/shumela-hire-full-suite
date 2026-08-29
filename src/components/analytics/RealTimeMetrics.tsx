import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface MetricData {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  format: 'number' | 'percentage' | 'currency' | 'duration';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface RealTimeMetricsProps {
  className?: string;
  /**
   * The KPIs, already fetched by the page.
   *
   * <p>This component used to call /api/analytics/kpis itself, every ten seconds, with no filter —
   * while the band above it and the charts below both narrowed by department. The page said in
   * writing that "department narrows everything on this page" and this strip was the reason that
   * was untrue. It now renders what it is given.
   */
  kpis: Record<string, number | undefined>;
  /** What the figures are narrowed to, so the strip can say so. */
  department?: string;
  updatedAt?: Date | null;
  stale?: boolean;
  /** Which metrics to show. The band carries the headline totals; this shows what moves in a day. */
  metricIds?: string[];
}

const formatValue = (value: number, format: MetricData['format']): string => {
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      return `R${value.toLocaleString()}`;
    case 'duration':
      return `${value}d`;
    default:
      return value.toLocaleString();
  }
};

const getChangeIndicator = (current: number, previous: number) => {
  if (current === previous || previous === 0) return { direction: 'neutral', percentage: 0 };

  const percentage = ((current - previous) / previous) * 100;
  const direction = current > previous ? 'up' : 'down';

  return { direction, percentage: Math.abs(percentage) };
};

function mapKpisToMetrics(
  kpis: Record<string, number | undefined>,
  previous: Record<string, number>,
): MetricData[] {
  const totalApps = Number(kpis['total_applications'] ?? 0);
  const avgResponseHours = Number(kpis['avg_response_time_hours'] ?? 0);
  const conversionRate = Number(kpis['interview_conversion_rate'] ?? 0);
  const interviewsConducted = Number(kpis['interviews_conducted'] ?? 0);

  return [
    {
      id: 'applications_today',
      label: 'Applications Today',
      value: totalApps,
      previousValue: previous['applications_today'] ?? 0,
      format: 'number',
      icon: UserGroupIcon,
      color: 'text-gold-600 bg-gold-100',
    },
    {
      id: 'active_sessions',
      label: 'Interviews Conducted',
      value: interviewsConducted,
      previousValue: previous['active_sessions'] ?? 0,
      format: 'number',
      icon: EyeIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      id: 'avg_response_time',
      label: 'Avg Response Time',
      value: Math.round(avgResponseHours / 24) || 0,
      previousValue: previous['avg_response_time'] ?? 0,
      format: 'duration',
      icon: ClockIcon,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      value: conversionRate,
      previousValue: previous['conversion_rate'] ?? 0,
      format: 'percentage',
      icon: CheckCircleIcon,
      color: 'text-purple-600 bg-purple-100',
    },
  ];
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className = '',
  kpis,
  department,
  updatedAt = null,
  stale = false,
  metricIds = ['applications_today', 'active_sessions'],
}) => {
  const [isMounted, setIsMounted] = useState(false);
  const previous = useRef<Record<string, number>>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Derived from what the page fetched, so this strip cannot disagree with the band above it.
  const metrics = useMemo(() => {
    const all = mapKpisToMetrics(kpis, previous.current);
    return all.filter((m) => metricIds.includes(m.id));
  }, [kpis, metricIds]);

  // Remembered after render, so the next set of figures can show which way they moved.
  useEffect(() => {
    previous.current = Object.fromEntries(metrics.map((m) => [m.id, m.value]));
  }, [metrics]);


  return (
    <div className={`enterprise-card border border-border rounded-card shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-[1.0625rem] font-bold text-foreground">Moving today</h3>
            <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
              {/* Says what it is narrowed to. It used to describe itself as live while ignoring the
                  department the rest of the page was filtered by. */}
              {department || 'Every department'}
              {isMounted && updatedAt ? ` \u00B7 updated ${updatedAt.toLocaleTimeString()}` : ''}
              {stale && (
                <span className="ml-2 text-warning-on-tint">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" />
                  Could not refresh
                </span>
              )}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-2 rounded-button bg-success-bg px-3 py-1.5 text-sm font-semibold text-success-on-tint">
            <span className="h-2 w-2 rounded-full bg-success" />
            Live
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {metrics.map((metric) => {
            const change = getChangeIndicator(metric.value, metric.previousValue);

            return (
              <div key={metric.id} className="relative group">
                <div className="bg-background rounded-card p-5 transition-all duration-300 group-hover:shadow-md border border-border/50">
                  {/* Icon and trend indicator */}
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${metric.color}`}>
                      <metric.icon className="w-5 h-5" />
                    </div>
                    {change.direction !== 'neutral' && (
                      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-button text-xs font-bold ${
                        change.direction === 'up'
                          ? 'text-success-on-tint bg-success-bg'
                          : 'text-error-on-tint bg-error-bg'
                      }`}>
                        {change.direction === 'up' ? (
                          <ArrowTrendingUpIcon className="w-3 h-3" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-3 h-3" />
                        )}
                        {change.percentage.toFixed(1)}%
                      </div>
                    )}
                  </div>

                  {/* Label */}
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {metric.label}
                  </div>

                  {/* Value */}
                  <div className="text-[1.75rem] font-extrabold text-foreground leading-none transition-all duration-300">
                    {formatValue(metric.value, metric.format)}
                  </div>

                  {/* Previous value for comparison */}
                  {metric.previousValue !== metric.value && metric.previousValue > 0 && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Previous: {formatValue(metric.previousValue, metric.format)}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RealTimeMetrics;
