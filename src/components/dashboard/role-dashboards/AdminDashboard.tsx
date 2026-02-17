'use client';

import React from 'react';
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

const systemHealthData = [
  { time: '00:00', cpu: 32, memory: 61, requests: 120 },
  { time: '02:00', cpu: 28, memory: 59, requests: 85 },
  { time: '04:00', cpu: 22, memory: 57, requests: 42 },
  { time: '06:00', cpu: 35, memory: 60, requests: 190 },
  { time: '08:00', cpu: 58, memory: 68, requests: 480 },
  { time: '10:00', cpu: 72, memory: 74, requests: 720 },
  { time: '12:00', cpu: 68, memory: 72, requests: 650 },
  { time: '14:00', cpu: 75, memory: 76, requests: 780 },
  { time: '16:00', cpu: 70, memory: 73, requests: 690 },
  { time: '18:00', cpu: 52, memory: 67, requests: 410 },
  { time: '20:00', cpu: 41, memory: 63, requests: 260 },
  { time: '22:00', cpu: 35, memory: 62, requests: 170 },
];

const adminMetrics = [
  {
    id: 'total-users',
    label: 'Total System Users',
    value: 847,
    previousValue: 823,
    target: 900,
    unit: 'number' as const,
    trend: 'up' as const,
    trendValue: 2.9,
    description: 'Active users in the system',
    status: 'good' as const,
  },
  {
    id: 'system-uptime',
    label: 'System Uptime',
    value: 99.8,
    previousValue: 99.5,
    target: 99.9,
    unit: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 0.3,
    description: 'System availability percentage',
    status: 'good' as const,
  },
];

export default function AdminDashboard({ selectedTimeframe, onTimeframeChange }: AdminDashboardProps) {
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
                {[
                  {
                    id: '1',
                    type: 'security',
                    message: 'Failed login attempt from unknown IP',
                    time: '5 minutes ago',
                    severity: 'high',
                    color: 'text-red-600',
                  },
                  {
                    id: '2',
                    type: 'user',
                    message: 'New user registration: jane.smith@company.com',
                    time: '12 minutes ago',
                    severity: 'medium',
                    color: 'text-gold-600',
                  },
                  {
                    id: '3',
                    type: 'system',
                    message: 'Database backup completed successfully',
                    time: '1 hour ago',
                    severity: 'low',
                    color: 'text-green-600',
                  },
                  {
                    id: '4',
                    type: 'maintenance',
                    message: 'Scheduled maintenance window started',
                    time: '2 hours ago',
                    severity: 'medium',
                    color: 'text-orange-600',
                  },
                ].map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${event.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{event.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{event.time}</p>
                    </div>
                  </div>
                ))}
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
                {[
                  { label: 'User Management', color: 'bg-gold-500 text-violet-950' },
                  { label: 'System Settings', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Backup Database', color: 'bg-green-600 text-white' },
                  { label: 'Audit Logs', color: 'bg-orange-600 text-white' },
                  { label: 'Security Center', color: 'bg-red-600 text-white' },
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
