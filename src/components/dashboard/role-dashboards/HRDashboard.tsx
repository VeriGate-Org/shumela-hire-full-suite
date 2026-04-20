'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

interface PipelineDept {
  department: string;
  open: number;
  inProgress: number;
  filled: number;
}

interface LifecycleItem {
  stage: string;
  count: number;
  color: string;
}

interface ActivityItem {
  id: string;
  type: string;
  message: string;
  time: string;
  color: string;
}

function mapPerformanceStatus(status: string): 'good' | 'warning' | 'critical' {
  switch (status?.toUpperCase()) {
    case 'ON_TARGET':
    case 'ABOVE_TARGET':
      return 'good';
    case 'BELOW_TARGET':
    case 'AT_RISK':
      return 'warning';
    case 'CRITICAL':
      return 'critical';
    default:
      return 'warning';
  }
}

function mapTrendDirection(trend: string): 'up' | 'down' | 'neutral' {
  switch (trend?.toUpperCase()) {
    case 'UP':
    case 'IMPROVING':
      return 'up';
    case 'DOWN':
    case 'DECLINING':
      return 'down';
    default:
      return 'neutral';
  }
}

function getTimeframeDays(timeframe: string): number {
  switch (timeframe) {
    case '7days': return 7;
    case '30days': return 30;
    case '90days': return 90;
    case '12months': return 365;
    default: return 30;
  }
}

const KPI_CONFIG: Record<string, { label: string; unit: 'number' | 'percentage' | 'days'; target: number; description: string }> = {
  total_applications: { label: 'Total Applications', unit: 'number', target: 50, description: 'Applications received in the period' },
  interview_conversion_rate: { label: 'Interview Conversion', unit: 'percentage', target: 30, description: 'Applications progressing to interview stage' },
  avg_response_time_hours: { label: 'Avg Response Time', unit: 'days', target: 3, description: 'Average time to first response' },
  interviews_conducted: { label: 'Interviews Conducted', unit: 'number', target: 20, description: 'Completed interviews in the period' },
  offer_acceptance_rate: { label: 'Offer Acceptance Rate', unit: 'percentage', target: 85, description: 'Percentage of offers accepted' },
  time_to_hire: { label: 'Time to Hire', unit: 'days', target: 30, description: 'Average days from application to hire' },
};

export default function HRDashboard({ selectedTimeframe, onTimeframeChange: _onTimeframeChange }: HRDashboardProps) {
  const [metrics, setMetrics] = useState<MetricItem[]>([]);
  const [pipeline, setPipeline] = useState<PipelineDept[]>([]);
  const [lifecycle, setLifecycle] = useState<LifecycleItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const days = getTimeframeDays(selectedTimeframe);
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Fetch dashboard metrics and job posting data in parallel
      const [dashboardRes, jobPostingsRes, applicationsRes] = await Promise.allSettled([
        apiFetch(`/api/analytics/dashboard?date=${endDate}`),
        apiFetch('/api/job-postings?size=200'),
        apiFetch(`/api/applications?size=1&startDate=${startDate}&endDate=${endDate}`),
      ]);

      // Check if ALL requests failed (API is likely down)
      const allFailed = [dashboardRes, jobPostingsRes, applicationsRes].every(
        r => r.status === 'rejected' || (r.status === 'fulfilled' && r.value.status >= 500)
      );
      if (allFailed) {
        setError('Unable to connect to the server. Please try again later.');
        setLoading(false);
        return;
      }

      // Map KPIs to MetricItem format
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        const data = await dashboardRes.value.json();
        const kpis = data?.kpis || {};

        const mappedMetrics: MetricItem[] = Object.entries(kpis)
          .filter(([key]) => KPI_CONFIG[key])
          .map(([key, kpiRaw]) => {
            const kpi = kpiRaw as { value?: number; trend?: string; variance?: number; status?: string };
            const config = KPI_CONFIG[key];
            let value = Number(kpi.value ?? 0);

            // Convert hours to days for response time
            if (key === 'avg_response_time_hours') {
              value = Math.round(value / 24) || 0;
            }

            const trendDir = mapTrendDirection(kpi.trend ?? '');
            const variance = Number(kpi.variance ?? 0);

            return {
              id: key,
              label: config.label,
              value,
              previousValue: trendDir === 'neutral' ? value : Math.round(value / (1 + variance / 100)),
              target: config.target,
              unit: config.unit,
              trend: trendDir,
              trendValue: variance,
              description: config.description,
              status: mapPerformanceStatus(kpi.status ?? ''),
            };
          });

        if (mappedMetrics.length > 0) {
          setMetrics(mappedMetrics);
        }
      }

      // Build pipeline data from job postings
      if (jobPostingsRes.status === 'fulfilled' && jobPostingsRes.value.ok) {
        const jpData = await jobPostingsRes.value.json();
        const postings = jpData?.content || jpData || [];

        if (Array.isArray(postings) && postings.length > 0) {
          const deptMap: Record<string, { open: number; inProgress: number; filled: number }> = {};

          for (const jp of postings) {
            const dept = jp.department || 'Other';
            if (!deptMap[dept]) deptMap[dept] = { open: 0, inProgress: 0, filled: 0 };

            const status = (jp.status || '').toUpperCase();
            if (status === 'PUBLISHED' || status === 'OPEN' || status === 'ACTIVE') {
              deptMap[dept].open++;
            } else if (status === 'SCREENING' || status === 'INTERVIEWING' || status === 'IN_PROGRESS') {
              deptMap[dept].inProgress++;
            } else if (status === 'FILLED' || status === 'CLOSED') {
              deptMap[dept].filled++;
            }
          }

          const pipelineData = Object.entries(deptMap)
            .map(([department, counts]) => ({ department, ...counts }))
            .sort((a, b) => (b.open + b.inProgress) - (a.open + a.inProgress))
            .slice(0, 6);

          if (pipelineData.length > 0) {
            setPipeline(pipelineData);
          }
        }
      }

      // Build lifecycle counts from application stats
      if (applicationsRes.status === 'fulfilled' && applicationsRes.value.ok) {
        const appData = await applicationsRes.value.json();
        const totalApps = appData?.totalElements ?? appData?.total ?? 0;

        // Fetch onboarding/status breakdowns
        const [onboardingRes] = await Promise.all([
          apiFetch('/api/applications?status=ONBOARDING&size=1'),
        ]);

        let onboardingCount = 0;
        if (onboardingRes.ok) {
          const obData = await onboardingRes.json();
          onboardingCount = obData?.totalElements ?? 0;
        }

        setLifecycle([
          { stage: `Applications (${selectedTimeframe})`, count: totalApps, color: 'bg-primary/10 text-primary' },
          { stage: 'In Onboarding', count: onboardingCount, color: 'bg-amber-100 text-amber-800' },
        ]);
      }

      // Fetch recent audit activities
      try {
        const auditRes = await apiFetch('/api/audit-logs?size=5&sortBy=timestamp&sortDirection=desc');
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          const logs = auditData?.content || auditData || [];

          if (Array.isArray(logs) && logs.length > 0) {
            const colorMap: Record<string, string> = {
              CREATE: 'text-green-600',
              UPDATE: 'text-primary',
              DELETE: 'text-red-600',
              LOGIN: 'text-purple-600',
            };

            setActivities(
              logs.slice(0, 5).map((log: any, idx: number) => ({
                id: log.id?.toString() || `act-${idx}`,
                type: log.action || 'unknown',
                message: log.details || `${log.action} on ${log.entityType}`,
                time: log.timestamp ? formatRelativeTime(log.timestamp) : 'Recently',
                color: colorMap[log.action?.toUpperCase()] || 'text-gray-600',
              })),
            );
          }
        }
      } catch {
        // Audit logs may not be available — keep empty
      }
    } catch {
      setError('Failed to load dashboard data. Please try again.');
    }

    setLoading(false);
  }, [selectedTimeframe]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="bg-white dark:bg-charcoal rounded-[2px] border border-gray-200 dark:border-gray-700 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[2px] p-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-200">Dashboard Unavailable</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-[2px] text-sm font-medium hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const isEmpty = metrics.length === 0 && pipeline.length === 0 && lifecycle.length === 0 && activities.length === 0;
  if (isEmpty) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="bg-white dark:bg-charcoal rounded-[2px] border border-gray-200 dark:border-gray-700 p-8 text-center">
          <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Welcome to ShumelaHire</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
            Your HR dashboard will populate once employees, job postings, and leave data are configured.
            Get started by adding employees or creating job postings.
          </p>
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
          {metrics.length > 0 && (
            <div className="w-full overflow-hidden">
              <PerformanceMetrics
                metrics={metrics}
                title="HR Key Performance Indicators"
                subtitle="Track employee satisfaction and HR effectiveness"
                timeframe={selectedTimeframe}
              />
            </div>
          )}

          {/* Employee Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-full">
            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="recruitment-overview"
                title="Recruitment Pipeline"
                subtitle="Current hiring status across departments"
                refreshable={true}
                onRefresh={fetchDashboardData}
                size="medium"
              >
                <div className="space-y-4">
                  {pipeline.length > 0 ? (
                    pipeline.map((dept) => (
                      <div key={dept.department} className="flex items-center justify-between p-3 bg-off-white dark:bg-gray-800/50 rounded-[2px]">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{dept.department}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-orange-600">{dept.open} open</span>
                          <span className="text-primary">{dept.inProgress} active</span>
                          <span className="text-green-600">{dept.filled} filled</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No job posting data available</p>
                  )}
                </div>
              </DashboardWidget>
            </div>

            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="employee-lifecycle"
                title="Employee Lifecycle"
                subtitle="Onboarding and development status"
                refreshable={true}
                onRefresh={fetchDashboardData}
                size="medium"
              >
                <div className="space-y-4">
                  {lifecycle.length > 0 ? (
                    lifecycle.map((item) => (
                      <div key={item.stage} className="flex items-center justify-between p-3 bg-off-white dark:bg-gray-800/50 rounded-[2px]">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{item.stage}</span>
                        <span className={`px-2 py-1 rounded-[2px] text-sm font-medium ${item.color}`}>
                          {item.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No lifecycle data available</p>
                  )}
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
              onRefresh={fetchDashboardData}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-off-white dark:hover:bg-gray-800/50 rounded-[2px]">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.color.replace('text-', 'bg-')}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">{activity.message}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No recent activities</p>
                )}
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
                  { label: 'Employee Records', href: '/admin/departments' },
                  { label: 'Onboarding Portal', href: '/onboarding' },
                  { label: 'Job Postings', href: '/job-postings' },
                  { label: 'Performance Reviews', href: '/performance' },
                  { label: 'Analytics', href: '/analytics' },
                ].map((action) => (
                  <a
                    key={action.label}
                    href={action.href}
                    className="bg-cta text-deep-navy p-3 rounded-full hover:bg-cta/90 transition-colors text-sm font-semibold text-center w-full block"
                  >
                    {action.label}
                  </a>
                ))}
              </div>
            </DashboardWidget>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}
