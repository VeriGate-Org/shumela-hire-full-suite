'use client';

import React from 'react';
import EnterpriseThemeToggle from '../../EnterpriseThemeToggle';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics } from '../../dashboard';

interface HRDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Mock data for HR dashboard
const hrMetrics = [
  {
    id: 'employee-satisfaction',
    label: 'Employee Satisfaction',
    value: 87,
    previousValue: 82,
    target: 90,
    unit: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 6.1,
    description: 'Overall employee satisfaction score',
    status: 'good' as const,
  },
  {
    id: 'onboarding-completion',
    label: 'Onboarding Completion Rate',
    value: 94,
    previousValue: 91,
    target: 95,
    unit: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 3.3,
    description: 'New hire onboarding completion rate',
    status: 'good' as const,
  },
];

export default function HRDashboard({ selectedTimeframe, onTimeframeChange }: HRDashboardProps) {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Human Resources Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage employee lifecycle and recruitment coordination
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <EnterpriseThemeToggle variant="compact" />
          <select
            value={selectedTimeframe}
            onChange={(e) => onTimeframeChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 3 months</option>
          </select>
        </div>
      </div>

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
              metrics={hrMetrics}
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
                    <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{dept.department}</span>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-orange-600">{dept.open} open</span>
                        <span className="text-violet-600">{dept.inProgress} active</span>
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
                    { stage: 'New Hires (This Month)', count: 8, color: 'bg-violet-100 text-violet-800' },
                    { stage: 'In Onboarding', count: 5, color: 'bg-yellow-100 text-yellow-800' },
                    { stage: 'Completed Training', count: 12, color: 'bg-green-100 text-green-800' },
                    { stage: 'Performance Review Due', count: 23, color: 'bg-purple-100 text-purple-800' },
                  ].map((item) => (
                    <div key={item.stage} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                    color: 'text-violet-600',
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
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
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
                  { label: 'Employee Records', color: 'bg-violet-600', icon: '👤' },
                  { label: 'Onboarding Portal', color: 'bg-green-600', icon: '🚀' },
                  { label: 'Policy Management', color: 'bg-violet-600', icon: '📜' },
                  { label: 'Performance Reviews', color: 'bg-orange-600', icon: '⭐' },
                  { label: 'Compliance Report', color: 'bg-red-600', icon: '📊' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className={`${action.color} text-white p-3 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium text-center w-full flex items-center justify-center gap-2`}
                  >
                    <span>{action.icon}</span>
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
