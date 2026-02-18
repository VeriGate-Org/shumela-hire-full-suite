'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics, CandidatePipeline } from '../../dashboard';
import { ApplicationVolumeChart } from '../../charts';

interface HiringManagerDashboardProps {
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

interface PipelineCandidate {
  id: string;
  name: string;
  email: string;
  position: string;
  avatar: string;
  score: number;
  appliedDate: string;
  source: string;
  status: 'new' | 'in_review' | 'interview_scheduled' | 'offer_made' | 'hired' | 'rejected';
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  candidates: PipelineCandidate[];
}

interface VolumeDataPoint {
  date: string;
  applications: number;
  interviews: number;
  offers: number;
  hires: number;
  [key: string]: unknown;
}

const defaultMetrics: MetricItem[] = [
  {
    id: 'time-to-fill',
    label: 'Average Time to Fill',
    value: 0,
    previousValue: 0,
    target: 30,
    unit: 'days',
    trend: 'neutral',
    trendValue: 0,
    description: 'Days from job posting to offer acceptance',
    status: 'warning',
  },
  {
    id: 'interview-satisfaction',
    label: 'Interview Satisfaction',
    value: 0,
    previousValue: 0,
    target: 4.5,
    unit: 'number',
    trend: 'neutral',
    trendValue: 0,
    description: 'Candidate satisfaction score (1-5 scale)',
    status: 'warning',
  },
];

const stageMapping: Record<string, { name: string; color: string; order: number }> = {
  SUBMITTED: { name: 'Applied', color: 'bg-gold-100', order: 0 },
  APPLIED: { name: 'Applied', color: 'bg-gold-100', order: 0 },
  SCREENING: { name: 'Phone Screen', color: 'bg-yellow-100', order: 1 },
  PHONE_SCREEN: { name: 'Phone Screen', color: 'bg-yellow-100', order: 1 },
  INTERVIEW: { name: 'Interview', color: 'bg-purple-100', order: 2 },
  INTERVIEW_SCHEDULED: { name: 'Interview', color: 'bg-purple-100', order: 2 },
  OFFER: { name: 'Offer', color: 'bg-green-100', order: 3 },
  OFFERED: { name: 'Offer', color: 'bg-green-100', order: 3 },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function mapStatusToCandidate(status: string): PipelineCandidate['status'] {
  const mapping: Record<string, PipelineCandidate['status']> = {
    SUBMITTED: 'new',
    APPLIED: 'new',
    SCREENING: 'in_review',
    PHONE_SCREEN: 'in_review',
    INTERVIEW: 'interview_scheduled',
    INTERVIEW_SCHEDULED: 'interview_scheduled',
    OFFER: 'offer_made',
    OFFERED: 'offer_made',
    HIRED: 'hired',
    REJECTED: 'rejected',
  };
  return mapping[status] || 'new';
}

function transformApplicationsToPipeline(applications: any[]): PipelineStage[] {
  const stageMap = new Map<string, PipelineCandidate[]>();

  // Initialize default stages
  const defaultStages = ['applied', 'screening', 'interview'];
  defaultStages.forEach((id) => stageMap.set(id, []));

  applications.forEach((app: any) => {
    const status = (app.status || 'SUBMITTED').toUpperCase();
    const stageInfo = stageMapping[status];
    if (!stageInfo) return;

    const stageId = stageInfo.name.toLowerCase().replace(/\s+/g, '-').replace('phone-screen', 'screening');
    const normalizedId = stageId === 'applied' ? 'applied' : stageId === 'phone-screen' ? 'screening' : stageId;

    if (!stageMap.has(normalizedId)) {
      stageMap.set(normalizedId, []);
    }

    stageMap.get(normalizedId)?.push({
      id: app.id?.toString() || '',
      name: app.candidateName || app.name || '',
      email: app.candidateEmail || app.email || '',
      position: app.jobTitle || app.position || '',
      avatar: getInitials(app.candidateName || app.name || ''),
      score: app.score ?? 0,
      appliedDate: app.submittedAt || app.appliedDate || '',
      source: app.source || '',
      status: mapStatusToCandidate(status),
    });
  });

  const stages: PipelineStage[] = [
    { id: 'applied', name: 'Applied', color: 'bg-gold-100', candidates: stageMap.get('applied') || [] },
    { id: 'screening', name: 'Phone Screen', color: 'bg-yellow-100', candidates: stageMap.get('screening') || [] },
    { id: 'interview', name: 'Interview', color: 'bg-purple-100', candidates: stageMap.get('interview') || [] },
  ];

  // Add offer stage if there are candidates in it
  const offerCandidates = stageMap.get('offer');
  if (offerCandidates && offerCandidates.length > 0) {
    stages.push({ id: 'offer', name: 'Offer', color: 'bg-green-100', candidates: offerCandidates });
  }

  return stages;
}

export default function HiringManagerDashboard({ selectedTimeframe, onTimeframeChange }: HiringManagerDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<MetricItem[]>(defaultMetrics);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [applicationVolumeData, setApplicationVolumeData] = useState<VolumeDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    let cancelled = false;

    async function fetchData() {
      setLoading(true);

      const [dashboardResult, applicationsResult] = await Promise.allSettled([
        apiFetch('/api/analytics/dashboard?role=HIRING_MANAGER'),
        apiFetch('/api/applications/manage/search?size=20'),
      ]);

      if (cancelled) return;

      // Process dashboard analytics (metrics + volume data)
      if (dashboardResult.status === 'fulfilled' && dashboardResult.value.ok) {
        try {
          const data = await dashboardResult.value.json();

          if (Array.isArray(data?.metrics) && data.metrics.length > 0) {
            setMetrics(data.metrics);
          }

          if (Array.isArray(data?.applicationVolume) && data.applicationVolume.length > 0) {
            setApplicationVolumeData(data.applicationVolume);
          }
        } catch {
          // Keep defaults on parse error
        }
      }

      // Process applications into pipeline stages
      if (applicationsResult.status === 'fulfilled' && applicationsResult.value.ok) {
        try {
          const data = await applicationsResult.value.json();
          const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
          const stages = transformApplicationsToPipeline(items);
          setPipelineStages(stages);
        } catch {
          // Keep empty pipeline on parse error
        }
      }

      setLoading(false);
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCandidateMove = (candidateId: string, fromStage: string, toStage: string) => {
    console.log(`Moving candidate ${candidateId} from ${fromStage} to ${toStage}`);
  };

  const handleCandidateClick = (candidate: any) => {
    console.log(`Viewing candidate details for ${candidate.id}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
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
      {/* Real-Time Hiring Metrics */}
      {!isMounted ? (
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
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
              metrics={metrics}
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
                    <div key={position.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
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
                  {applicationVolumeData.length > 0 ? (
                    <ApplicationVolumeChart
                      data={applicationVolumeData.slice(-30)}
                      timeframe="month"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                      No volume data available
                    </div>
                  )}
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
                stages={pipelineStages}
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
                    color: 'text-gold-600',
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
                  <div key={interview.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm">
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
                  { label: 'Post New Job', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Review Applications', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Schedule Interview', color: 'bg-green-600 text-white' },
                  { label: 'Send Offer', color: 'bg-orange-600 text-white' },
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
