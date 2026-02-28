'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import { auditLogService } from '@/services/auditLogService';
import { AuditLogEntry } from '@/types/workflow';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DashboardWidget, PerformanceMetrics } from '../../dashboard';

interface AdminDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface SystemHealthPoint {
  time: string;
  cpu: number;
  memory: number;
  requests: number;
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

const defaultSystemHealthData: SystemHealthPoint[] = [];

const defaultAdminMetrics: MetricItem[] = [
  {
    id: 'total-users',
    label: 'Total System Users',
    value: 0,
    previousValue: 0,
    target: 900,
    unit: 'number',
    trend: 'neutral',
    trendValue: 0,
    description: 'Active users in the system',
    status: 'warning',
  },
  {
    id: 'system-uptime',
    label: 'System Uptime',
    value: 0,
    previousValue: 0,
    target: 99.9,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'System availability percentage',
    status: 'warning',
  },
];

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function getEventColor(action: string): string {
  if (action.includes('delete') || action.includes('reject')) return 'bg-red-600';
  if (action.includes('create') || action.includes('approve')) return 'bg-green-600';
  if (action.includes('auth') || action.includes('login')) return 'bg-purple-600';
  return 'bg-gold-500';
}

interface QuickAction {
  label: string;
  color: string;
  route?: string;
  disabled?: boolean;
}

const quickActions: QuickAction[] = [
  { label: 'User Management', color: 'bg-gold-500 text-violet-950', route: '/admin/permissions' },
  { label: 'Audit Logs', color: 'bg-orange-600 text-white', route: '/admin/audit-logs' },
  { label: 'System Settings', color: 'bg-gold-500 text-violet-950', route: '/settings' },
  { label: 'Security Center', color: 'bg-red-600 text-white', route: '/admin/permissions' },
  { label: 'Backup Database', color: 'bg-green-600 text-white', disabled: true },
];

export default function AdminDashboard({ selectedTimeframe, onTimeframeChange: _onTimeframeChange }: AdminDashboardProps) {
  const router = useRouter();
  const [systemHealthData, setSystemHealthData] = useState<SystemHealthPoint[]>(defaultSystemHealthData);
  const [adminMetrics, setAdminMetrics] = useState<MetricItem[]>(defaultAdminMetrics);
  const [recentEvents, setRecentEvents] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      try {
        const [dashboardResponse, events] = await Promise.allSettled([
          apiFetch('/api/analytics/dashboard?role=ADMIN'),
          auditLogService.getRecentAuditLogs(10),
        ]);

        if (cancelled) return;

        if (dashboardResponse.status === 'fulfilled' && dashboardResponse.value.ok) {
          const data = await dashboardResponse.value.json();

          if (Array.isArray(data?.systemHealth) && data.systemHealth.length > 0) {
            setSystemHealthData(data.systemHealth);
          }

          if (Array.isArray(data?.metrics) && data.metrics.length > 0) {
            setAdminMetrics(data.metrics);
          }
        }

        if (events.status === 'fulfilled') {
          setRecentEvents(events.value);
        }
      } catch {
        // Keep default values on error
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
      {/* Admin Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Main Admin Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* System Performance Metrics */}
          <div className="w-full overflow-hidden">
            <PerformanceMetrics
              metrics={adminMetrics}
              title="System Performance Indicators"
              subtitle="Monitor platform health and user activity"
              timeframe={selectedTimeframe}
            />
          </div>

          {/* System Health Chart */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="system-health"
              title="System Health Overview"
              subtitle="Server performance and resource utilization"
              refreshable={true}
              size="large"
            >
              {systemHealthData.length > 0 ? (
                <div className="w-full h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={systemHealthData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickLine={false} axisLine={false} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '2px', fontSize: 13 }}
                        formatter={(value: number, name: string) => {
                          if (name === 'requests') return [`${value}`, 'Requests/min'];
                          return [`${value}%`, name === 'cpu' ? 'CPU Usage' : 'Memory Usage'];
                        }}
                      />
                      <Legend verticalAlign="top" height={28} iconType="square" iconSize={10}
                        formatter={(value: string) => {
                          const labels: Record<string, string> = { cpu: 'CPU', memory: 'Memory', requests: 'Req/min' };
                          return <span style={{ color: '#64748B', fontSize: 12 }}>{labels[value] || value}</span>;
                        }}
                      />
                      <Area type="monotone" dataKey="cpu" stroke="#05527E" fill="#05527E" fillOpacity={0.15} strokeWidth={2} />
                      <Area type="monotone" dataKey="memory" stroke="#008C7F" fill="#008C7F" fillOpacity={0.1} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center text-sm text-gray-500">
                  No system health data available
                </div>
              )}
            </DashboardWidget>
          </div>
        </div>

        {/* Admin Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Recent System Events */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="system-events"
              title="Recent System Events"
              subtitle="Latest system activities"
              refreshable={true}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {recentEvents.length > 0 ? (
                  recentEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getEventColor(event.action)}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">
                          {event.action.replace(/_/g, ' ')} — {event.entityType}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{getRelativeTime(event.timestamp)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">No recent events</div>
                )}
              </div>
            </DashboardWidget>
          </div>

          {/* Admin Quick Actions */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="admin-actions"
              title="Admin Actions"
              subtitle="System management tools"
              size="small"
            >
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => action.route && router.push(action.route)}
                    disabled={action.disabled}
                    className={`${action.color} p-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium text-center w-full ${
                      action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
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
