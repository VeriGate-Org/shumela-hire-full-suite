'use client';

import React from 'react';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics } from '../../dashboard';

interface ExecutiveDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Mock data for executive dashboard
const executiveMetrics = [
  {
    id: 'hiring-budget',
    label: 'Hiring Budget Utilization',
    value: 67,
    previousValue: 58,
    target: 85,
    unit: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 15.5,
    description: 'Percentage of annual hiring budget utilized',
    status: 'good' as const,
  },
  {
    id: 'strategic-hires',
    label: 'Strategic Hires Completed',
    value: 12,
    previousValue: 8,
    target: 20,
    unit: 'number' as const,
    trend: 'up' as const,
    trendValue: 50.0,
    description: 'Executive and senior leadership positions filled',
    status: 'warning' as const,
  },
];

export default function ExecutiveDashboard({ selectedTimeframe }: ExecutiveDashboardProps) {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Real-Time Executive Metrics */}
      <div className="w-full overflow-hidden">
        <RealTimeMetrics updateInterval={5000} />
      </div>

      {/* Executive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Main Executive Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Executive Performance Metrics */}
          <div className="w-full overflow-hidden">
            <PerformanceMetrics
              metrics={executiveMetrics}
              title="Strategic Hiring Indicators"
              subtitle="Track organizational hiring strategy and budget utilization"
              timeframe={selectedTimeframe}
            />
          </div>

          {/* Strategic Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-full">
            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="department-overview"
                title="Department Hiring Status"
                subtitle="Staffing levels across organization"
                refreshable={true}
                size="medium"
              >
                <div className="space-y-4">
                  {[
                    { department: 'Engineering', target: 50, current: 45, budget: 'R2.1M', utilization: 78 },
                    { department: 'Sales', target: 25, current: 22, budget: 'R980K', utilization: 65 },
                    { department: 'Marketing', target: 15, current: 12, budget: 'R540K', utilization: 55 },
                    { department: 'Operations', target: 20, current: 18, budget: 'R720K', utilization: 82 },
                  ].map((dept) => (
                    <div key={dept.department} className="p-3 bg-muted rounded-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{dept.department}</span>
                        <span className="text-sm text-muted-foreground">{dept.budget}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{dept.current}/{dept.target} staff</span>
                        <span className={`font-medium ${dept.utilization > 75 ? 'text-green-600' : dept.utilization > 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {dept.utilization}% budget used
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${dept.utilization > 75 ? 'bg-green-600' : dept.utilization > 50 ? 'bg-yellow-600' : 'bg-red-600'}`}
                          style={{ width: `${(dept.current / dept.target) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            </div>

            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="high-value-positions"
                title="Executive Hiring Pipeline"
                subtitle="Senior leadership and strategic roles"
                refreshable={true}
                size="medium"
              >
                <div className="space-y-4">
                  {[
                    { 
                      position: 'Chief Technology Officer', 
                      department: 'Engineering', 
                      salary: 'R280K - R350K',
                      stage: 'Final Interviews',
                      priority: 'Critical',
                      candidates: 2,
                      statusColor: 'bg-primary/10 text-primary',
                      priorityColor: 'bg-red-100 text-red-800'
                    },
                    { 
                      position: 'VP of Sales', 
                      department: 'Sales', 
                      salary: 'R220K - R280K',
                      stage: 'Sourcing',
                      priority: 'High',
                      candidates: 0,
                      statusColor: 'bg-cta/20 text-cta-foreground',
                      priorityColor: 'bg-orange-100 text-orange-800'
                    },
                    { 
                      position: 'Director of Marketing', 
                      department: 'Marketing', 
                      salary: 'R180K - R220K',
                      stage: 'Interviews',
                      priority: 'Medium',
                      candidates: 3,
                      statusColor: 'bg-yellow-100 text-yellow-800',
                      priorityColor: 'bg-yellow-100 text-yellow-800'
                    },
                  ].map((position) => (
                    <div key={position.position} className="p-3 bg-muted rounded-card">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">{position.position}</h4>
                          <p className="text-sm text-muted-foreground">{position.department}</p>
                          <p className="text-sm text-muted-foreground">{position.salary}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${position.priorityColor}`}>
                            {position.priority}
                          </span>
                          <span className="text-xs text-muted-foreground">{position.candidates} candidates</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${position.statusColor}`}>
                        {position.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            </div>
          </div>
        </div>

        {/* Executive Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Pending Approvals */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="pending-approvals"
              title="Pending Approvals"
              subtitle="Items requiring executive decision"
              refreshable={true}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {[
                  {
                    id: '1',
                    type: 'offer',
                    message: 'Senior Director offer R285K - Tech Lead',
                    time: '2 hours ago',
                    urgent: true,
                    color: 'text-red-600',
                  },
                  {
                    id: '2',
                    type: 'budget',
                    message: 'Additional hiring budget request - Sales',
                    time: '5 hours ago',
                    urgent: false,
                    color: 'text-orange-600',
                  },
                  {
                    id: '3',
                    type: 'position',
                    message: 'New VP Marketing position approval',
                    time: '1 day ago',
                    urgent: false,
                    color: 'text-primary',
                  },
                  {
                    id: '4',
                    type: 'contract',
                    message: 'Executive search firm contract renewal',
                    time: '2 days ago',
                    urgent: false,
                    color: 'text-link',
                  },
                ].map((approval) => (
                  <div key={approval.id} className="flex items-start gap-3 p-3 hover:bg-muted rounded-card border-l-2 border-transparent hover:border-border">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${approval.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${approval.urgent ? 'font-semibold' : 'font-normal'} text-foreground truncate`}>
                        {approval.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{approval.time}</p>
                      {approval.urgent && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full mt-1 inline-block">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>

          {/* Executive Actions */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="executive-actions"
              title="Executive Tools"
              subtitle="Strategic hiring management"
              size="small"
            >
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Approval Center', color: 'bg-red-600 text-white' },
                  { label: 'Budget Planning', color: 'bg-cta text-cta-foreground' },
                  { label: 'Strategic Reports', color: 'bg-cta text-cta-foreground' },
                  { label: 'Leadership Pipeline', color: 'bg-green-600 text-white' },
                  { label: 'Board Reports', color: 'bg-orange-600 text-white' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className={`${action.color} p-3 rounded-control hover:opacity-95 transition-opacity text-sm font-medium text-center w-full`}
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
