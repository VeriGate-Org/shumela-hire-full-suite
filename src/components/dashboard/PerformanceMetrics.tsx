import React, { useState, useMemo } from 'react';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { RecruitmentLineChart } from '../charts';
import DashboardWidget from './DashboardWidget';

interface MetricData {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: 'number' | 'percentage' | 'currency' | 'days';
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  description?: string;
  drillDown?: {
    available: boolean;
    data?: Array<{ period: string; value: number }>;
  };
  status: 'good' | 'warning' | 'critical';
  benchmark?: number;
}

interface PerformanceMetricsProps {
  metrics: MetricData[];
  title: string;
  subtitle?: string;
  timeframe?: string;
  className?: string;
  refreshable?: boolean;
  onRefresh?: () => void;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  metrics,
  title,
  subtitle,
  timeframe = 'Last 30 days',
  className = '',
  refreshable = true,
  onRefresh,
}) => {
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [showBenchmarks, setShowBenchmarks] = useState(false);

  const formatValue = (value: number, unit: MetricData['unit']): string => {
    switch (unit) {
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `R${value.toLocaleString()}`;
      case 'days':
        return `${Math.round(value)} days`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (trend: MetricData['trend']) => {
    switch (trend) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4" />;
      default:
        return <MinusIcon className="w-4 h-4" />;
    }
  };

  const getTrendColor = (trend: MetricData['trend'], status: MetricData['status']) => {
    if (trend === 'neutral') return 'text-gray-500';
    
    // For performance metrics, "up" trend might be good or bad depending on the metric
    if (status === 'good') return 'text-green-600';
    if (status === 'critical') return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusColor = (status: MetricData['status']) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = (value: number, target?: number) => {
    if (!target) return 0;
    return Math.min(100, (value / target) * 100);
  };

  const summaryStats = useMemo(() => {
    const goodMetrics = metrics.filter(m => m.status === 'good').length;
    const criticalMetrics = metrics.filter(m => m.status === 'critical').length;
    const avgTrend = metrics.reduce((acc, m) => acc + m.trendValue, 0) / metrics.length;
    
    return {
      goodMetrics,
      criticalMetrics,
      avgTrend,
      totalMetrics: metrics.length,
    };
  }, [metrics]);

  const renderDrillDown = (metric: MetricData) => {
    if (!metric.drillDown?.data) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {metric.label} Trend
        </h4>
        <div className="h-32">
          <RecruitmentLineChart
            data={metric.drillDown.data}
            xKey="period"
            yKey="value"
            height={128}
            showGrid={false}
            curved={true}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Trend over the last 12 periods
        </div>
      </div>
    );
  };

  return (
    <DashboardWidget
      id="performance-metrics"
      title={title}
      subtitle={subtitle}
      className={className}
      refreshable={refreshable}
      onRefresh={onRefresh}
      size="large"
    >
      <div className="space-y-6">
        {/* Summary Header */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{summaryStats.totalMetrics}</div>
              <div className="text-sm text-gray-500">Total Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summaryStats.goodMetrics}</div>
              <div className="text-sm text-gray-500">Performing Well</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summaryStats.criticalMetrics}</div>
              <div className="text-sm text-gray-500">Need Attention</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${summaryStats.avgTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summaryStats.avgTrend >= 0 ? '+' : ''}{summaryStats.avgTrend.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Avg Trend</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">{timeframe}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBenchmarks(!showBenchmarks)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                showBenchmarks 
                  ? 'bg-violet-100 text-violet-700' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Show Benchmarks
            </button>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <InformationCircleIcon className="w-4 h-4" />
            Click metrics to view trends
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedMetric(
                  expandedMetric === metric.id ? null : metric.id
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-gray-900">{metric.label}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(metric.status)}`}>
                        {metric.status}
                      </span>
                    </div>
                    
                    {metric.description && (
                      <p className="text-sm text-gray-500 mb-3">{metric.description}</p>
                    )}

                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl font-bold text-gray-900">
                        {formatValue(metric.value, metric.unit)}
                      </span>
                      
                      {metric.previousValue && (
                        <div className={`flex items-center gap-1 text-sm ${getTrendColor(metric.trend, metric.status)}`}>
                          {getTrendIcon(metric.trend)}
                          <span>
                            {metric.trendValue >= 0 ? '+' : ''}{metric.trendValue.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Target Progress */}
                    {metric.target && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress to target</span>
                          <span className="text-gray-900">
                            {formatValue(metric.target, metric.unit)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              metric.status === 'good' ? 'bg-green-500' : 
                              metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${getProgressPercentage(metric.value, metric.target)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Benchmark Comparison */}
                    {showBenchmarks && metric.benchmark && (
                      <div className="mt-3 p-2 bg-violet-50 rounded">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-violet-700">Industry Benchmark</span>
                          <span className="font-medium text-violet-900">
                            {formatValue(metric.benchmark, metric.unit)}
                          </span>
                        </div>
                        <div className="text-xs text-violet-600 mt-1">
                          You are {((metric.value / metric.benchmark) * 100 - 100).toFixed(1)}% 
                          {metric.value > metric.benchmark ? ' above' : ' below'} benchmark
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="ml-4 flex items-center">
                    {metric.drillDown?.available && (
                      <ChevronDownIcon 
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          expandedMetric === metric.id ? 'rotate-180' : ''
                        }`} 
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Drill-down content */}
              {expandedMetric === metric.id && renderDrillDown(metric)}
            </div>
          ))}
        </div>

        {/* Action Items */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Recommended Actions</h4>
          <ul className="space-y-1 text-sm text-yellow-700">
            {summaryStats.criticalMetrics > 0 && (
              <li>• Focus on {summaryStats.criticalMetrics} critical metrics requiring immediate attention</li>
            )}
            {summaryStats.avgTrend < 0 && (
              <li>• Overall performance trend is negative - consider process improvements</li>
            )}
            <li>• Review metrics with low benchmark performance for optimization opportunities</li>
          </ul>
        </div>
      </div>
    </DashboardWidget>
  );
};

export default PerformanceMetrics;
