import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api-fetch';

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
  updateInterval?: number;
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

function mapKpisToMetrics(kpis: Record<string, { value?: number }>, prevMetrics: MetricData[]): MetricData[] {
  const totalApps = Number(kpis['total_applications']?.value ?? 0);
  const avgResponseHours = Number(kpis['avg_response_time_hours']?.value ?? 0);
  const conversionRate = Number(kpis['interview_conversion_rate']?.value ?? 0);
  const interviewsConducted = Number(kpis['interviews_conducted']?.value ?? 0);

  return [
    {
      id: 'applications_today',
      label: 'Applications Today',
      value: totalApps,
      previousValue: prevMetrics[0]?.value ?? 0,
      format: 'number',
      icon: UserGroupIcon,
      color: 'text-gold-600 bg-gold-100',
    },
    {
      id: 'active_sessions',
      label: 'Interviews Conducted',
      value: interviewsConducted,
      previousValue: prevMetrics[1]?.value ?? 0,
      format: 'number',
      icon: EyeIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      id: 'avg_response_time',
      label: 'Avg Response Time',
      value: Math.round(avgResponseHours / 24) || 0,
      previousValue: prevMetrics[2]?.value ?? 0,
      format: 'duration',
      icon: ClockIcon,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      value: conversionRate,
      previousValue: prevMetrics[3]?.value ?? 0,
      format: 'percentage',
      icon: CheckCircleIcon,
      color: 'text-purple-600 bg-purple-100',
    },
  ];
}

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className = '',
  updateInterval = 5000,
}) => {
  const [metrics, setMetrics] = useState<MetricData[]>([
    {
      id: 'applications_today',
      label: 'Applications Today',
      value: 0,
      previousValue: 0,
      format: 'number',
      icon: UserGroupIcon,
      color: 'text-gold-600 bg-gold-100',
    },
    {
      id: 'active_sessions',
      label: 'Interviews Conducted',
      value: 0,
      previousValue: 0,
      format: 'number',
      icon: EyeIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      id: 'avg_response_time',
      label: 'Avg Response Time',
      value: 0,
      previousValue: 0,
      format: 'duration',
      icon: ClockIcon,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      id: 'conversion_rate',
      label: 'Conversion Rate',
      value: 0,
      previousValue: 0,
      format: 'percentage',
      icon: CheckCircleIcon,
      color: 'text-purple-600 bg-purple-100',
    },
  ]);

  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiFetch('/api/analytics/kpis');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      const kpis = json.kpis ?? {};
      setMetrics(mapKpisToMetrics(kpis, metricsRef.current));
      setLastUpdateTime(new Date());
      setFetchError(false);
    } catch {
      setFetchError(true);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Polling interval
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(fetchMetrics, updateInterval);
    return () => clearInterval(interval);
  }, [updateInterval, isLive, fetchMetrics]);

  const toggleLiveUpdates = () => {
    setIsLive(!isLive);
  };

  return (
    <div className={`enterprise-card border border-border rounded-card shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[1.0625rem] font-bold text-foreground">Real-Time Metrics</h3>
            <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
              Live recruitment activity {isMounted ? `\u00B7 Last updated: ${lastUpdateTime.toLocaleTimeString()}` : ''}
              {fetchError && (
                <span className="ml-2 text-orange-500">
                  <ExclamationTriangleIcon className="w-3.5 h-3.5 inline -mt-0.5 mr-0.5" />
                  Stale data
                </span>
              )}
            </p>
          </div>
          <button
            onClick={toggleLiveUpdates}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-button text-sm font-semibold transition-colors ${
              isLive
                ? 'bg-success-bg text-success hover:opacity-80'
                : 'bg-background text-muted-foreground hover:opacity-80'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground'
              }`}
            />
            {isLive ? 'Live' : 'Paused'}
          </button>
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
                          ? 'text-success bg-success-bg'
                          : 'text-error bg-error-bg'
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

                  {/* Live indicator */}
                  {isLive && (
                    <div className="absolute top-3 right-3 w-2 h-2 bg-success rounded-full animate-pulse opacity-60" />
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
