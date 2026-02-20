import React, { useState, useEffect } from 'react';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  EyeIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon 
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
  updateInterval?: number; // in milliseconds
}

// TODO: Replace with real WebSocket/SSE data source

const generateMetricValue = (baseValue: number, variance: number = 0.1): number => {
  const change = (Math.random() - 0.5) * variance * 2;
  return Math.max(0, Math.round(baseValue * (1 + change)));
};

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
  if (current === previous) return { direction: 'neutral', percentage: 0 };
  
  const percentage = ((current - previous) / previous) * 100;
  const direction = current > previous ? 'up' : 'down';
  
  return { direction, percentage: Math.abs(percentage) };
};

const RealTimeMetrics: React.FC<RealTimeMetricsProps> = ({
  className = '',
  updateInterval = 5000, // 5 seconds
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
      label: 'Active Sessions',
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
      label: 'Today\'s Conversion',
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

  // Fix hydration mismatch by only showing time after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMetrics(prevMetrics => 
        prevMetrics.map(metric => ({
          ...metric,
          previousValue: metric.value,
          value: generateMetricValue(metric.value, 0.1),
        }))
      );
      setLastUpdateTime(new Date());
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, isLive]);

  const toggleLiveUpdates = () => {
    setIsLive(!isLive);
  };

  return (
    <div className={`bg-white rounded-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Real-Time Metrics</h3>
            <p className="text-sm text-gray-500">
              Live recruitment activity • Last updated: {isMounted ? lastUpdateTime.toLocaleTimeString() : '--:--:--'}
            </p>
          </div>
          <button
            onClick={toggleLiveUpdates}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isLive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            {isLive ? 'Live' : 'Paused'}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const change = getChangeIndicator(metric.value, metric.previousValue);
            
            return (
              <div key={metric.id} className="relative group">
                <div className="bg-gray-50 rounded-sm p-4 transition-all duration-300 group-hover:shadow-md">
                  {/* Icon and trend indicator */}
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-sm ${metric.color}`}>
                      <metric.icon className="w-5 h-5" />
                    </div>
                    {change.direction !== 'neutral' && (
                      <div className={`flex items-center gap-1 ${
                        change.direction === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {change.direction === 'up' ? (
                          <ArrowTrendingUpIcon className="w-4 h-4" />
                        ) : (
                          <ArrowTrendingDownIcon className="w-4 h-4" />
                        )}
                        <span className="text-xs font-medium">
                          {change.percentage.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Value */}
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900 transition-all duration-300">
                      {formatValue(metric.value, metric.format)}
                    </div>
                    <div className="text-sm text-gray-500">{metric.label}</div>
                  </div>

                  {/* Previous value for comparison */}
                  {metric.previousValue !== metric.value && (
                    <div className="text-xs text-gray-400 mt-1">
                      Previous: {formatValue(metric.previousValue, metric.format)}
                    </div>
                  )}

                  {/* Live indicator */}
                  {isLive && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse opacity-60" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini activity feed */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            <p className="text-sm text-gray-400">No recent activity</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMetrics;
