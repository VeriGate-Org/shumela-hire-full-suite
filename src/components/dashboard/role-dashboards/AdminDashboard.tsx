'use client';

import React from 'react';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics } from '../../dashboard';

interface AdminDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Mock data for admin dashboard
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
      {/* Real-Time System Status */}
      <div className="w-full overflow-hidden">
        <RealTimeMetrics updateInterval={5000} />
      </div>

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
              <div className="w-full h-64 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-violet-50 p-6 rounded-sm h-full flex items-center justify-center">
                  <p className="text-gray-600">System Health Chart Component</p>
                </div>
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
