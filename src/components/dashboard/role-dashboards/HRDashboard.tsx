'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics } from '../../dashboard';

interface HRDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface MetricItem {
  id: string;
  label: string;
  value: number;
  previousValue: number;
  target: number;
  unit: 'percentage' | 'number' | 'days';
  trend: 'up' | 'down' | 'neutral';
  trendValue: number;
  description: string;
  status: 'good' | 'warning' | 'critical';
}

const defaultMetrics: MetricItem[] = [
  {
    id: 'employee-satisfaction',
    label: 'Employee Satisfaction',
    value: 0,
    previousValue: 0,
    target: 90,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'Overall employee satisfaction score',
    status: 'warning',
  },
  {
    id: 'onboarding-completion',
    label: 'Onboarding Completion Rate',
    value: 0,
    previousValue: 0,
    target: 95,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'New hire onboarding completion rate',
    status: 'warning',
  },
];

export default function HRDashboard({ selectedTimeframe, onTimeframeChange }: HRDashboardProps) {
  const [metrics, setMetrics] = useState<MetricItem[]>(defaultMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        const response = await apiFetch('/api/analytics/dashboard?role=HR_MANAGER');

        if (cancelled) return;

        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data?.metrics) && data.metrics.length > 0) {
            setMetrics(data.metrics);
          }
        }
      } catch {
        // Keep default metrics on error
      }

      if (!cancelled) {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Real-Time HR Metrics */}
      <div className="w-full overflow-hidden">
        <RealTimeMetrics updateInterval={5000} />
      </div>

      {/* HR Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Main HR Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* HR Performance Metrics */}
          <div className="w-full overflow-hidden">
            <PerformanceMetrics
              metrics={metrics}
              title="HR Key Performance Indicators"
              subtitle="Track employee satisfaction and HR effectiveness"
              timeframe={selectedTimeframe}
            />
          </div>

          {/* Employee Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-full">
            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="recruitment-overview"
                title="Recruitment Pipeline"
                subtitle="Current hiring status across departments"
                refreshable={true}
                size="medium"
              >
                <div className="space-y-4">
                  {[
                    { department: 'Engineering', open: 12, inProgress: 8, filled: 3 },
                    { department: 'Sales', open: 6, inProgress: 4, filled: 2 },
                    { department: 'Marketing', open: 3, inProgress: 2, filled: 1 },
                    { department: 'Operations', open: 4, inProgress: 1, filled: 0 },
                  ].map((dept) => (
                    <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                      <span className="font-medium text-gray-900">{dept.department}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-orange-600">{dept.open} open</span>
                        <span className="text-gold-600">{dept.inProgress} active</span>
                        <span className="text-green-600">{dept.filled} filled</span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            </div>

            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="employee-lifecycle"
                title="Employee Lifecycle"
                subtitle="Onboarding and development status"
                refreshable={true}
                size="medium"
              >
                <div className="space-y-4">
                  {[
                    { stage: 'New Hires (This Month)', count: 8, color: 'bg-gold-100 text-gold-800' },
                    { stage: 'In Onboarding', count: 5, color: 'bg-yellow-100 text-yellow-800' },
                    { stage: 'Completed Training', count: 12, color: 'bg-green-100 text-green-800' },
                    { stage: 'Performance Review Due', count: 23, color: 'bg-purple-100 text-purple-800' },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                      <span className="font-medium text-gray-900">{item.stage}</span>
                      <span className={`px-2 py-1 rounded-full text-sm font-medium ${item.color}`}>
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            </div>
          </div>
        </div>

        {/* HR Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Recent HR Activities */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="hr-activities"
              title="Recent HR Activities"
              subtitle="Latest employee and policy updates"
              refreshable={true}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {[
                  {
                    id: '1',
                    type: 'onboarding',
                    message: 'Sarah Johnson completed onboarding program',
                    time: '1 hour ago',
                    color: 'text-green-600',
                  },
                  {
                    id: '2',
                    type: 'policy',
                    message: 'Updated remote work policy published',
                    time: '3 hours ago',
                    color: 'text-gold-600',
                  },
                  {
                    id: '3',
                    type: 'review',
                    message: 'Q3 performance reviews initiated',
                    time: '5 hours ago',
                    color: 'text-purple-600',
                  },
                  {
                    id: '4',
                    type: 'compliance',
                    message: 'Diversity training compliance at 94%',
                    time: '1 day ago',
                    color: 'text-orange-600',
                  },
                ].map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>

          {/* HR Quick Actions */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="hr-actions"
              title="HR Quick Actions"
              subtitle="Common HR management tasks"
              size="small"
            >
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Employee Records', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Onboarding Portal', color: 'bg-green-600 text-white' },
                  { label: 'Policy Management', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Performance Reviews', color: 'bg-orange-600 text-white' },
                  { label: 'Compliance Report', color: 'bg-red-600 text-white' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className={`${action.color} p-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium text-center w-full`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </DashboardWidget>
          </div>
        </div>
      </div>
    </div>
  );
}
