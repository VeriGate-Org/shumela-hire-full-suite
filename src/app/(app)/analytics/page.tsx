'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import {
  AdvancedAnalyticsDashboard,
  RealTimeMetrics,
  InteractiveFilters,
  FilterConfig,
  FilterValue
} from '@/components/analytics';
import { useTheme } from '@/contexts/ThemeContext';
import { apiFetch } from '@/lib/api-fetch';
import { FunnelIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Filter configuration for analytics
const analyticsFilters: FilterConfig[] = [
  {
    id: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'product', label: 'Product' },
      { value: 'design', label: 'Design' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
    ],
    placeholder: 'Select department',
  },
  {
    id: 'position_level',
    label: 'Position Level',
    type: 'multiselect',
    options: [
      { value: 'entry', label: 'Entry Level' },
      { value: 'mid', label: 'Mid Level' },
      { value: 'senior', label: 'Senior Level' },
      { value: 'lead', label: 'Lead/Principal' },
      { value: 'manager', label: 'Manager' },
    ],
    placeholder: 'Select position levels',
  },
  {
    id: 'source',
    label: 'Application Source',
    type: 'multiselect',
    options: [
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'indeed', label: 'Indeed' },
      { value: 'company_site', label: 'Company Website' },
      { value: 'referrals', label: 'Employee Referrals' },
      { value: 'university', label: 'University Partnerships' },
    ],
    placeholder: 'Select sources',
  },
  {
    id: 'date_range',
    label: 'Date Range',
    type: 'daterange',
    placeholder: 'Select date range',
  },
  {
    id: 'experience_years',
    label: 'Years of Experience',
    type: 'range',
    min: 0,
    max: 20,
    placeholder: 'Select experience range',
  },
  {
    id: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search positions, candidates, or keywords...',
  },
];

const timeRangeOptions = [
  { key: 'week' as const, label: '7 Days' },
  { key: 'month' as const, label: '30 Days' },
  { key: 'quarter' as const, label: '3 Months' },
  { key: 'year' as const, label: '12 Months' },
];

interface Insight {
  type: 'positive' | 'warning';
  text: string;
}

export default function AnalyticsPage() {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showFilters, setShowFilters] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const { setCurrentRole } = useTheme();

  // Set theme to executive for analytics
  useEffect(() => {
    setCurrentRole('EXECUTIVE');
  }, [setCurrentRole]);

  const handleFilterChange = (values: FilterValue[]) => {
    setFilterValues(values);
  };

  const handleFilterReset = () => {
    setFilterValues([]);
  };

  // Derive insights from KPI data
  const loadInsights = useCallback(async () => {
    setInsightsLoading(true);
    try {
      const res = await apiFetch('/api/analytics/kpis');
      if (!res.ok) throw new Error('Failed to load KPIs');
      const json = await res.json();
      const kpis = json.kpis ?? {};
      const derived: Insight[] = [];

      const interviewConversion = kpis['interview_conversion_rate']?.value;
      if (interviewConversion !== undefined) {
        const rate = Number(interviewConversion);
        if (rate >= 20) {
          derived.push({ type: 'positive', text: `Interview conversion rate is strong at ${rate.toFixed(1)}%` });
        } else if (rate > 0) {
          derived.push({ type: 'warning', text: `Interview conversion rate is ${rate.toFixed(1)}% — consider reviewing screening criteria` });
        }
      }

      const acceptanceRate = kpis['acceptance_rate']?.value;
      if (acceptanceRate !== undefined) {
        const rate = Number(acceptanceRate);
        if (rate >= 80) {
          derived.push({ type: 'positive', text: `Offer acceptance rate is ${rate.toFixed(1)}% — offers are competitive` });
        } else if (rate > 0) {
          derived.push({ type: 'warning', text: `Offer acceptance rate is ${rate.toFixed(1)}% — review compensation packages` });
        }
      }

      const noShowRate = kpis['no_show_rate']?.value;
      if (noShowRate !== undefined) {
        const rate = Number(noShowRate);
        if (rate > 15) {
          derived.push({ type: 'warning', text: `Interview no-show rate is ${rate.toFixed(1)}% — consider sending reminders` });
        } else if (rate > 0) {
          derived.push({ type: 'positive', text: `Low interview no-show rate at ${rate.toFixed(1)}%` });
        }
      }

      const timeToFill = kpis['time_to_fill_days']?.value;
      if (timeToFill !== undefined) {
        const days = Number(timeToFill);
        if (days > 45) {
          derived.push({ type: 'warning', text: `Average time to fill is ${days} days — above industry benchmark of 45 days` });
        } else if (days > 0) {
          derived.push({ type: 'positive', text: `Average time to fill is ${days} days — within target range` });
        }
      }

      const avgScore = kpis['avg_interview_score']?.value;
      if (avgScore !== undefined) {
        const score = Number(avgScore);
        if (score >= 3.5) {
          derived.push({ type: 'positive', text: `Average interview score is ${score.toFixed(1)}/5 — strong candidate quality` });
        } else if (score > 0) {
          derived.push({ type: 'warning', text: `Average interview score is ${score.toFixed(1)}/5 — sourcing may need improvement` });
        }
      }

      setInsights(derived);
    } catch {
      setInsights([]);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const handleExportCSV = async () => {
    try {
      const res = await apiFetch('/api/analytics/kpis');
      if (!res.ok) return;
      const json = await res.json();
      const kpis = json.kpis ?? {};
      const rows = [['Metric', 'Value', 'Trend', 'Variance']];
      for (const [key, kpi] of Object.entries(kpis)) {
        const k = kpi as { value?: number; trend?: string; variance?: number };
        rows.push([key, String(k.value ?? ''), k.trend ?? '', String(k.variance ?? '')]);
      }
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
  };

  const positiveInsights = insights.filter(i => i.type === 'positive');
  const warningInsights = insights.filter(i => i.type === 'warning');

  const activeFilterCount = filterValues.length;

  const actions = (
    <button
      onClick={handleExportCSV}
      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <ArrowDownTrayIcon className="w-4 h-4" />
      Export CSV
    </button>
  );

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Recruitment performance metrics and insights"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Compact time range + filter bar */}
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-2">
              {timeRangeOptions.map((range) => (
                <button
                  key={range.key}
                  onClick={() => setSelectedTimeRange(range.key)}
                  className={`px-4 py-2 rounded-sm text-sm font-medium border transition-colors ${
                    selectedTimeRange === range.key
                      ? 'bg-gold-50 text-gold-800 border-gold-300'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-medium border transition-colors ${
                  showFilters
                    ? 'bg-gold-50 text-gold-800 border-gold-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FunnelIcon className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="bg-gold-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleFilterReset}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible filters */}
        {showFilters && (
          <InteractiveFilters
            filters={analyticsFilters}
            values={filterValues}
            onChange={handleFilterChange}
            onReset={handleFilterReset}
          />
        )}

        {/* Key Insights — promoted to top */}
        {!insightsLoading && insights.length > 0 && (
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {positiveInsights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Performance Highlights</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {positiveInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">&#8226;</span>
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {warningInsights.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Areas for Improvement</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    {warningInsights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-0.5">&#8226;</span>
                        {insight.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {!insightsLoading && insights.length === 0 && (
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6 text-center">
            <p className="text-sm text-gray-500">Not enough data to generate insights</p>
          </div>
        )}

        {/* Real-Time Metrics — reduced polling interval */}
        <RealTimeMetrics updateInterval={10000} />

        {/* Main Dashboard — no header, no tabs, flat layout */}
        <AdvancedAnalyticsDashboard filters={filterValues} timeRange={selectedTimeRange} />
      </div>
    </PageWrapper>
  );
}
