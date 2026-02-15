'use client';

import React, { useState, useEffect } from 'react';
import EnterpriseThemeToggle from '../../EnterpriseThemeToggle';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics, CandidatePipeline } from '../../dashboard';
import { ApplicationVolumeChart } from '../../charts';

interface HiringManagerDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

// Mock data for hiring manager dashboard
const hiringManagerMetrics = [
  {
    id: 'time-to-fill',
    label: 'Average Time to Fill',
    value: 32,
    previousValue: 38,
    target: 30,
    unit: 'days' as const,
    trend: 'down' as const,
    trendValue: -15.8,
    description: 'Days from job posting to offer acceptance',
    status: 'warning' as const,
  },
  {
    id: 'interview-satisfaction',
    label: 'Interview Satisfaction',
    value: 4.3,
    previousValue: 4.1,
    target: 4.5,
    unit: 'number' as const,
    trend: 'up' as const,
    trendValue: 4.9,
    description: 'Candidate satisfaction score (1-5 scale)',
    status: 'good' as const,
  },
];

// Mock pipeline data
const mockPipelineStages = [
  {
    id: 'applied',
    name: 'Applied',
    color: 'bg-violet-100',
    candidates: [
      { 
        id: '1', 
        name: 'John Smith', 
        email: 'john.smith@email.com',
        position: 'Senior Developer', 
        avatar: 'JS', 
        score: 85,
        appliedDate: '2025-08-15',
        source: 'LinkedIn',
        status: 'new' as const
      },
      { 
        id: '2', 
        name: 'Sarah Chen', 
        email: 'sarah.chen@email.com',
        position: 'Product Manager', 
        avatar: 'SC', 
        score: 92,
        appliedDate: '2025-08-14',
        source: 'Company Website',
        status: 'new' as const
      },
    ],
  },
  {
    id: 'screening',
    name: 'Phone Screen',
    color: 'bg-yellow-100',
    candidates: [
      { 
        id: '3', 
        name: 'Mike Rodriguez', 
        email: 'mike.rodriguez@email.com',
        position: 'UX Designer', 
        avatar: 'MR', 
        score: 78,
        appliedDate: '2025-08-13',
        source: 'Referral',
        status: 'in_review' as const
      },
    ],
  },
  {
    id: 'interview',
    name: 'Interview',
    color: 'bg-purple-100',
    candidates: [
      { 
        id: '4', 
        name: 'Lisa Park', 
        email: 'lisa.park@email.com',
        position: 'Data Scientist', 
        avatar: 'LP', 
        score: 88,
        appliedDate: '2025-08-12',
        source: 'Job Board',
        status: 'interview_scheduled' as const
      },
    ],
  },
];

export default function HiringManagerDashboard({ selectedTimeframe, onTimeframeChange }: HiringManagerDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);
  
  // Generate mock data only on client side to avoid hydration mismatch
  const [applicationVolumeData, setApplicationVolumeData] = useState<Array<{
    date: string;
    applications: number;
    interviews: number;
    offers: number;
    hires: number;
  }>>([]);

  useEffect(() => {
    setIsMounted(true);
    // Generate mock application volume data on client side only
    const mockData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      applications: Math.floor(Math.random() * 20) + 5,
      interviews: Math.floor(Math.random() * 10) + 2,
      offers: Math.floor(Math.random() * 3) + 1,
      hires: Math.floor(Math.random() * 2) + 1,
    }));
    setApplicationVolumeData(mockData);
  }, []);
  const handleCandidateMove = (candidateId: string, fromStage: string, toStage: string) => {
    console.log(`Moving candidate ${candidateId} from ${fromStage} to ${toStage}`);
  };

  const handleCandidateClick = (candidate: any) => {
    console.log(`Viewing candidate details for ${candidate.id}`);
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hiring Manager Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Oversee hiring for your team and manage interview processes
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

      {/* Real-Time Hiring Metrics */}
      {!isMounted ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <RealTimeMetrics updateInterval={5000} />
        </div>
      )}

      {/* Hiring Manager Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-full">
        {/* Main Hiring Content */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          {/* Hiring Performance Metrics */}
          <div className="w-full overflow-hidden">
            <PerformanceMetrics
              metrics={hiringManagerMetrics}
              title="Hiring Performance Indicators"
              subtitle="Track your team's hiring effectiveness"
              timeframe={selectedTimeframe}
            />
          </div>

          {/* Team Hiring Overview */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-full">
            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="team-positions"
                title="Open Positions"
                subtitle="Current job openings for your team"
                refreshable={true}
                size="medium"
              >
                <div className="space-y-4">
                  {[
                    { role: 'Senior Frontend Developer', applications: 24, status: 'Active', priority: 'High' },
                    { role: 'Product Manager', applications: 18, status: 'Active', priority: 'Medium' },
                    { role: 'UX/UI Designer', applications: 12, status: 'Draft', priority: 'Low' },
                    { role: 'DevOps Engineer', applications: 8, status: 'Active', priority: 'High' },
                  ].map((position) => (
                    <div key={position.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{position.role}</p>
                        <p className="text-sm text-gray-500">{position.applications} applications</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          position.priority === 'High' ? 'bg-red-100 text-red-800' :
                          position.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {position.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          position.status === 'Active' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {position.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </DashboardWidget>
            </div>

            <div className="min-w-0 overflow-hidden">
              <DashboardWidget
                id="application-volume"
                title="Application Volume Trends"
                subtitle="Daily application submissions over time"
                refreshable={true}
                size="medium"
              >
                <div className="w-full h-64 overflow-hidden">
                  <ApplicationVolumeChart
                    data={applicationVolumeData.slice(-30)}
                    timeframe="month"
                  />
                </div>
              </DashboardWidget>
            </div>
          </div>
        </div>

        {/* Hiring Sidebar */}
        <div className="lg:col-span-1 space-y-6 min-w-0 max-w-full">
          {/* Candidate Pipeline */}
          <div className="max-h-96 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <CandidatePipeline
                stages={mockPipelineStages}
                onCandidateMove={handleCandidateMove}
                onCandidateClick={handleCandidateClick}
                title="Candidate Pipeline"
                subtitle="Drag to move candidates"
              />
            </div>
          </div>

          {/* Interview Schedule */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="interview-schedule"
              title="Today's Interviews"
              subtitle="Upcoming interviews"
              refreshable={true}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {[
                  {
                    id: '1',
                    candidate: 'Sarah Chen',
                    position: 'Product Manager',
                    time: '10:00 AM',
                    type: 'Technical',
                    color: 'text-violet-600',
                  },
                  {
                    id: '2',
                    candidate: 'Mike Rodriguez',
                    position: 'UX Designer',
                    time: '2:00 PM',
                    type: 'Portfolio Review',
                    color: 'text-green-600',
                  },
                  {
                    id: '3',
                    candidate: 'Lisa Park',
                    position: 'Data Scientist',
                    time: '4:30 PM',
                    type: 'Final Round',
                    color: 'text-purple-600',
                  },
                ].map((interview) => (
                  <div key={interview.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${interview.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{interview.candidate}</p>
                      <p className="text-xs text-gray-500 truncate">{interview.position}</p>
                      <p className="text-xs text-gray-600 mt-1">{interview.time} - {interview.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>

          {/* Quick Actions */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="hiring-actions"
              title="Quick Actions"
              subtitle="Common hiring tasks"
              size="small"
            >
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Post New Job', color: 'bg-violet-600', icon: '📝' },
                  { label: 'Review Applications', color: 'bg-violet-600', icon: '📋' },
                  { label: 'Schedule Interview', color: 'bg-green-600', icon: '📅' },
                  { label: 'Send Offer', color: 'bg-orange-600', icon: '💰' },
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
