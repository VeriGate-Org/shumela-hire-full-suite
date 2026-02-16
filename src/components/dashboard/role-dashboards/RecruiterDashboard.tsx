'use client';

import React from 'react';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics, DataExplorer } from '../../dashboard';

interface RecruiterDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Mock data for recruiter dashboard
const recruiterMetrics = [
  {
    id: 'sourcing-effectiveness',
    label: 'Sourcing Effectiveness',
    value: 68,
    previousValue: 62,
    target: 75,
    unit: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 9.7,
    description: 'Quality candidates sourced to total outreach ratio',
    status: 'good' as const,
  },
  {
    id: 'candidate-response-rate',
    label: 'Candidate Response Rate',
    value: 24,
    previousValue: 19,
    target: 30,
    unit: 'percentage' as const,
    trend: 'up' as const,
    trendValue: 26.3,
    description: 'Response rate to initial candidate outreach',
    status: 'warning' as const,
  },
];

// Mock candidate data for DataExplorer
const mockCandidateData = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    position: 'Senior Developer',
    skills: 'React, Node.js, TypeScript',
    experience: '5 years',
    status: 'Active',
    source: 'LinkedIn',
    score: 85,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    position: 'Product Manager',
    skills: 'Product Strategy, Agile, Analytics',
    experience: '7 years',
    status: 'Interview',
    source: 'Referral',
    score: 92,
  },
  {
    id: '3',
    name: 'Mike Rodriguez',
    email: 'mike.r@email.com',
    position: 'UX Designer',
    skills: 'Figma, User Research, Prototyping',
    experience: '4 years',
    status: 'Screen',
    source: 'Job Board',
    score: 78,
  },
];

const mockCandidateColumns = [
  { key: 'name', label: 'Name', sortable: true, type: 'string' as const },
  { key: 'position', label: 'Position', sortable: true, type: 'string' as const },
  { key: 'experience', label: 'Experience', sortable: true, type: 'string' as const },
  { key: 'source', label: 'Source', sortable: true, type: 'string' as const },
  { key: 'status', label: 'Status', sortable: true, type: 'string' as const },
  { key: 'score', label: 'Score', sortable: true, type: 'number' as const },
];

export default function RecruiterDashboard({ selectedTimeframe, onTimeframeChange }: RecruiterDashboardProps) {
  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Real-Time Sourcing Metrics */}
      <div className="w-full overflow-hidden">
        <RealTimeMetrics updateInterval={5000} />
      </div>

      {/* Recruiter Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Main Recruiting Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Recruiting Performance Metrics */}
          <div className="w-full overflow-hidden">
            <PerformanceMetrics
              metrics={recruiterMetrics}
              title="Recruiting Performance Indicators"
              subtitle="Track your sourcing and candidate engagement effectiveness"
              timeframe={selectedTimeframe}
            />
          </div>

          {/* Candidate Database */}
          <div className="w-full overflow-hidden">
            <div className="max-h-96 overflow-hidden">
              <DataExplorer
                data={mockCandidateData}
                columns={mockCandidateColumns}
                title="Candidate Database"
                subtitle="Search and manage your candidate pipeline"
                defaultView="table"
              />
            </div>
          </div>
        </div>

        {/* Recruiting Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Sourcing Activities */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="sourcing-activities"
              title="Recent Sourcing Activities"
              subtitle="Latest candidate outreach and responses"
              refreshable={true}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {[
                  {
                    id: '1',
                    type: 'outreach',
                    message: 'Contacted 5 developers on LinkedIn',
                    time: '30 minutes ago',
                    color: 'text-gold-600',
                  },
                  {
                    id: '2',
                    type: 'response',
                    message: 'Sarah Chen responded to interview invitation',
                    time: '1 hour ago',
                    color: 'text-green-600',
                  },
                  {
                    id: '3',
                    type: 'screening',
                    message: 'Completed phone screen with Mike Rodriguez',
                    time: '2 hours ago',
                    color: 'text-purple-600',
                  },
                  {
                    id: '4',
                    type: 'research',
                    message: 'Added 12 new candidates to database',
                    time: '4 hours ago',
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

          {/* Sourcing Channels */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="sourcing-channels"
              title="Top Sourcing Channels"
              subtitle="Performance by source"
              size="small"
            >
              <div className="space-y-3">
                {[
                  { source: 'LinkedIn', candidates: 45, quality: 8.2, color: 'bg-gold-500' },
                  { source: 'Referrals', candidates: 23, quality: 9.1, color: 'bg-green-500' },
                  { source: 'Job Boards', candidates: 34, quality: 6.8, color: 'bg-purple-500' },
                  { source: 'GitHub', candidates: 18, quality: 8.7, color: 'bg-gray-600' },
                ].map((channel) => (
                  <div key={channel.source} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                      <span className="font-medium text-gray-900">{channel.source}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {channel.candidates} • {channel.quality}/10
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>

          {/* Recruiting Quick Actions */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="recruiting-actions"
              title="Recruiting Tools"
              subtitle="Quick access to sourcing tools"
              size="small"
            >
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Search Candidates', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Send Outreach', color: 'bg-green-600 text-white' },
                  { label: 'Schedule Screen', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Update Pipeline', color: 'bg-orange-600 text-white' },
                  { label: 'Generate Report', color: 'bg-red-600 text-white' },
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
