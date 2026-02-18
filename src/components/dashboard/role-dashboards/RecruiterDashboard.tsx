'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics, DataExplorer } from '../../dashboard';

interface RecruiterDashboardProps {
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

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  position: string;
  skills: string;
  experience: string;
  status: string;
  source: string;
  score: number;
}

const mockCandidateColumns = [
  { key: 'name', label: 'Name', sortable: true, type: 'string' as const },
  { key: 'position', label: 'Position', sortable: true, type: 'string' as const },
  { key: 'experience', label: 'Experience', sortable: true, type: 'string' as const },
  { key: 'source', label: 'Source', sortable: true, type: 'string' as const },
  { key: 'status', label: 'Status', sortable: true, type: 'string' as const },
  { key: 'score', label: 'Score', sortable: true, type: 'number' as const },
];

const defaultMetrics: MetricItem[] = [
  {
    id: 'sourcing-effectiveness',
    label: 'Sourcing Effectiveness',
    value: 0,
    previousValue: 0,
    target: 75,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'Quality candidates sourced to total outreach ratio',
    status: 'warning',
  },
  {
    id: 'candidate-response-rate',
    label: 'Candidate Response Rate',
    value: 0,
    previousValue: 0,
    target: 30,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'Response rate to initial candidate outreach',
    status: 'warning',
  },
];

export default function RecruiterDashboard({ selectedTimeframe }: RecruiterDashboardProps) {
  const [metrics, setMetrics] = useState<MetricItem[]>(defaultMetrics);
  const [candidateData, setCandidateData] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      // Fetch metrics and candidates in parallel
      const [metricsResult, candidatesResult] = await Promise.allSettled([
        apiFetch('/api/analytics/dashboard?role=RECRUITER'),
        apiFetch('/api/applications/manage/search?size=10&sortBy=submittedAt&sortDirection=desc'),
      ]);

      if (cancelled) return;

      // Process metrics
      if (metricsResult.status === 'fulfilled' && metricsResult.value.ok) {
        try {
          const data = await metricsResult.value.json();
          if (Array.isArray(data?.metrics) && data.metrics.length > 0) {
            setMetrics(data.metrics);
          }
        } catch {
          // Keep default metrics on parse error
        }
      }

      // Process candidates
      if (candidatesResult.status === 'fulfilled' && candidatesResult.value.ok) {
        try {
          const data = await candidatesResult.value.json();
          const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
          const mapped: CandidateRow[] = items.map((item: any) => ({
            id: item.id?.toString() || '',
            name: item.candidateName || item.name || '',
            email: item.candidateEmail || item.email || '',
            position: item.jobTitle || item.position || '',
            skills: Array.isArray(item.skills) ? item.skills.join(', ') : (item.skills || ''),
            experience: item.experience || '',
            status: item.status || '',
            source: item.source || '',
            score: item.score ?? 0,
          }));
          setCandidateData(mapped);
        } catch {
          // Keep empty candidates on parse error
        }
      }

      setLoading(false);
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
              metrics={metrics}
              title="Recruiting Performance Indicators"
              subtitle="Track your sourcing and candidate engagement effectiveness"
              timeframe={selectedTimeframe}
            />
          </div>

          {/* Candidate Database */}
          <div className="w-full overflow-hidden">
            <div className="max-h-96 overflow-hidden">
              <DataExplorer
                data={candidateData}
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
                    color: 'text-primary',
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
                    color: 'text-link',
                  },
                  {
                    id: '4',
                    type: 'research',
                    message: 'Added 12 new candidates to database',
                    time: '4 hours ago',
                    color: 'text-orange-600',
                  },
                ].map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-muted rounded-card">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${activity.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
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
                  { source: 'LinkedIn', candidates: 45, quality: 8.2, color: 'bg-cta' },
                  { source: 'Referrals', candidates: 23, quality: 9.1, color: 'bg-green-500' },
                  { source: 'Job Boards', candidates: 34, quality: 6.8, color: 'bg-primary' },
                  { source: 'GitHub', candidates: 18, quality: 8.7, color: 'bg-gray-600' },
                ].map((channel) => (
                  <div key={channel.source} className="flex items-center justify-between p-3 bg-muted rounded-card">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${channel.color}`}></div>
                      <span className="font-medium text-foreground">{channel.source}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
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
                  { label: 'Search Candidates', color: 'bg-cta text-cta-foreground' },
                  { label: 'Send Outreach', color: 'bg-green-600 text-white' },
                  { label: 'Schedule Screen', color: 'bg-cta text-cta-foreground' },
                  { label: 'Update Pipeline', color: 'bg-orange-600 text-white' },
                  { label: 'Generate Report', color: 'bg-red-600 text-white' },
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
