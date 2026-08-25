'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import { RealTimeMetrics } from '../../analytics';
import { DashboardWidget, PerformanceMetrics, CandidatePipeline } from '../../dashboard';
import EmptyState from '@/components/EmptyState';
import { BriefcaseIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
    id: 'offer-acceptance-rate',
    label: 'Offer Acceptance Rate',
    value: 0,
    previousValue: 0,
    target: 85,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'Percentage of offers accepted',
    status: 'warning',
  },
  {
    id: 'interview-to-hire',
    label: 'Interview-to-Hire Ratio',
    value: 0,
    previousValue: 0,
    target: 3,
    unit: 'number',
    trend: 'neutral',
    trendValue: 0,
    description: 'Average interviews needed per hire',
    status: 'warning',
  },
  {
    id: 'quality-of-hire',
    label: 'Quality of Hire',
    value: 0,
    previousValue: 0,
    target: 80,
    unit: 'percentage',
    trend: 'neutral',
    trendValue: 0,
    description: 'New hire performance rating after 90 days',
    status: 'warning',
  },
  {
    id: 'pipeline-velocity',
    label: 'Pipeline Velocity',
    value: 0,
    previousValue: 0,
    target: 15,
    unit: 'number',
    trend: 'neutral',
    trendValue: 0,
    description: 'Average candidates processed per week',
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

/**
 * How many applications the pipeline widget loads.
 *
 * Deliberately a named constant rather than an inline 50: it is a display cap, and the widget now
 * tells the user when the cap is doing something rather than presenting the truncated figure as a
 * complete count.
 */
const PIPELINE_PAGE_SIZE = 500;

const stageMapping: Record<string, { name: string; color: string; order: number }> = {
  SUBMITTED: { name: 'Applied', color: 'bg-gold-100', order: 0 },
  APPLIED: { name: 'Applied', color: 'bg-gold-100', order: 0 },
  SCREENING: { name: 'Screening', color: 'bg-yellow-100', order: 1 },
  PHONE_SCREEN: { name: 'Screening', color: 'bg-yellow-100', order: 1 },
  INTERVIEW: { name: 'Interview', color: 'bg-purple-100', order: 2 },
  INTERVIEW_SCHEDULED: { name: 'Interview', color: 'bg-purple-100', order: 2 },
  INTERVIEW_COMPLETED: { name: 'Interview', color: 'bg-purple-100', order: 2 },
  // Verification sits between interview and offer. Its absence here was not a cosmetic gap:
  // unmapped statuses hit `if (!stageInfo) return` and vanished silently, so every candidate at
  // Reference Check — Lerato Dlamini among them — was missing from this widget entirely while
  // the pipeline board showed them.
  REFERENCE_CHECK: { name: 'Checks', color: 'bg-blue-100', order: 3 },
  BACKGROUND_CHECK: { name: 'Checks', color: 'bg-blue-100', order: 3 },
  OFFER: { name: 'Offer', color: 'bg-green-100', order: 4 },
  OFFERED: { name: 'Offer', color: 'bg-green-100', order: 4 },
  OFFER_PENDING: { name: 'Offer', color: 'bg-green-100', order: 4 },
  HIRED: { name: 'Hired', color: 'bg-emerald-100', order: 5 },
  OFFER_ACCEPTED: { name: 'Hired', color: 'bg-emerald-100', order: 5 },
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
    INTERVIEW_COMPLETED: 'interview_scheduled',
    OFFER: 'offer_made',
    OFFERED: 'offer_made',
    OFFER_PENDING: 'offer_made',
    HIRED: 'hired',
    OFFER_ACCEPTED: 'hired',
    REJECTED: 'rejected',
  };
  return mapping[status] || 'new';
}

function transformApplicationsToPipeline(applications: any[]): PipelineStage[] {
  const stageMap = new Map<string, PipelineCandidate[]>();

  // Initialise every stage, including the one that used to be dropped
  ['applied', 'screening', 'interview', 'checks', 'offer', 'hired'].forEach((id) => stageMap.set(id, []));

  applications.forEach((app: any) => {
    const status = (app.status || 'SUBMITTED').toUpperCase();
    const stageInfo = stageMapping[status];
    if (!stageInfo) {
      // Loud rather than silent. A status nobody mapped is a candidate nobody sees, and the
      // widget would still report a confident total that quietly excluded them.
      console.warn(`[CandidatePipeline] unmapped application status "${status}" — candidate hidden`);
      return;
    }

    const stageId = stageInfo.name.toLowerCase();

    stageMap.get(stageId)?.push({
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

  return [
    { id: 'applied', name: 'Applied', color: 'bg-gold-100', candidates: stageMap.get('applied') || [] },
    { id: 'screening', name: 'Screening', color: 'bg-yellow-100', candidates: stageMap.get('screening') || [] },
    { id: 'interview', name: 'Interview', color: 'bg-purple-100', candidates: stageMap.get('interview') || [] },
    { id: 'checks', name: 'Checks', color: 'bg-blue-100', candidates: stageMap.get('checks') || [] },
    { id: 'offer', name: 'Offer', color: 'bg-green-100', candidates: stageMap.get('offer') || [] },
    { id: 'hired', name: 'Hired', color: 'bg-emerald-100', candidates: stageMap.get('hired') || [] },
  ];
}

// selectedTimeframe is still in the props so RoleDashboard's call site is unchanged, but it is
// deliberately unused: /api/analytics/dashboard accepts only department and date, so passing it
// re-fetched identical data. Making it real is a backend change with its own gate.
export default function HiringManagerDashboard(_props: HiringManagerDashboardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [metrics, setMetrics] = useState<MetricItem[]>(defaultMetrics);
  const [totalApplications, setTotalApplications] = useState<number | undefined>(undefined);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);
  const [openPositions, setOpenPositions] = useState<any[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [positionsPage, setPositionsPage] = useState(0);
  const POSITIONS_PAGE_SIZE = 5;

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [dashboardResult, applicationsResult, positionsResult, interviewsResult] = await Promise.allSettled([
      apiFetch('/api/analytics/dashboard'),
      // size=50 against a tenant with 92 applications meant the widget silently showed just over
      // half of them and labelled the result a total. The endpoint returns totalElements, which
      // is used below to say so honestly when a cap is still in play.
      apiFetch(`/api/applications/manage/search?size=${PIPELINE_PAGE_SIZE}`),
      apiFetch('/api/job-postings/published'),
      apiFetch('/api/interviews/upcoming'),
    ]);

    let allFailed = true;

    // Process dashboard analytics (metrics + volume data)
    if (dashboardResult.status === 'fulfilled' && dashboardResult.value.ok) {
      allFailed = false;
      try {
        const data = await dashboardResult.value.json();

        if (Array.isArray(data?.metrics) && data.metrics.length > 0) {
          setMetrics(data.metrics);
        } else if (data?.kpis && typeof data.kpis === 'object') {
          const kpiMetrics: MetricItem[] = Object.entries(data.kpis).map(([key, kpi]: [string, any]) => ({
            id: key,
            label: key.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            value: Number(kpi?.value) || 0,
            previousValue: Number(kpi?.previousValue) || 0,
            target: Number(kpi?.target) || 0,
            unit: (kpi?.unit || 'number') as 'percentage' | 'number' | 'days',
            trend: (kpi?.trend?.toLowerCase() === 'up' ? 'up' : kpi?.trend?.toLowerCase() === 'down' ? 'down' : 'neutral') as 'up' | 'down' | 'neutral',
            trendValue: Number(kpi?.variance) || Number(kpi?.trendValue) || 0,
            description: kpi?.description || '',
            status: (kpi?.status || 'warning') as 'good' | 'warning' | 'critical',
          }));
          if (kpiMetrics.length > 0) setMetrics(kpiMetrics);
        }

      } catch {
        // Keep defaults on parse error
      }
    }

    // Process applications into pipeline stages
    if (applicationsResult.status === 'fulfilled' && applicationsResult.value.ok) {
      allFailed = false;
      try {
        const data = await applicationsResult.value.json();
        const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        const stages = transformApplicationsToPipeline(items);
        setPipelineStages(stages);
        // The true figure, so the widget can distinguish "everything" from "the first N".
        setTotalApplications(
          typeof data?.totalElements === 'number' ? data.totalElements : items.length,
        );
      } catch {
        // Keep empty pipeline on parse error
      }
    }

    // Process open positions
    if (positionsResult.status === 'fulfilled' && positionsResult.value.ok) {
      allFailed = false;
      try {
        const data = await positionsResult.value.json();
        const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        setOpenPositions(items);
      } catch {
        // Keep empty on parse error
      }
    }

    // Process upcoming interviews
    if (interviewsResult.status === 'fulfilled' && interviewsResult.value.ok) {
      allFailed = false;
      try {
        const data = await interviewsResult.value.json();
        const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        setUpcomingInterviews(items);
      } catch {
        // Keep empty on parse error
      }
    }

    if (allFailed) {
      setError('Failed to load dashboard data. Please check your connection and try again.');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, [fetchData]);

  const handleCandidateMove = async (candidateId: string, _fromStage: string, toStage: string) => {
    const stageToStatus: Record<string, string> = {
      applied: 'SUBMITTED',
      screening: 'SCREENING',
      interview: 'INTERVIEW_SCHEDULED',
      offer: 'OFFERED',
      hired: 'HIRED',
    };
    const newStatus = stageToStatus[toStage];
    if (!newStatus) return;
    try {
      await apiFetch(`/api/applications/${candidateId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Pipeline component already updates local state optimistically
    }
  };

  const handleCandidateClick = (candidate: any) => {
    router.push(`/applications?search=${encodeURIComponent(candidate.name)}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="bg-card rounded-control border border-border border-t-2 border-t-gold-500 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="h-20 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const owedToYou = (upcomingInterviews?.length ?? 0) + (openPositions?.length ?? 0);

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <IdentityBand
        eyebrow="Your vacancies"
        title="Hiring Manager"
        subtitle={
          typeof totalApplications === 'number'
            ? `${openPositions.length} ${openPositions.length === 1 ? 'role' : 'roles'} open · ${totalApplications} ${totalApplications === 1 ? 'candidate' : 'candidates'} in play`
            : loading
              ? 'Loading your vacancies…'
              : 'Counts unavailable'
        }
        figures={[
          { label: 'Open roles', value: openPositions.length },
          {
            label: 'Interviews booked',
            value: upcomingInterviews.length,
            tone: (upcomingInterviews.length > 0 ? 'warning' : undefined) as 'warning' | undefined,
          },
        ]}
      />

      {!loading && (
        owedToYou > 0 ? (
          <DecisionBar
            ask={`${upcomingInterviews.length} ${upcomingInterviews.length === 1 ? 'interview is' : 'interviews are'} coming up.`}
            why={`Across ${openPositions.length} open ${openPositions.length === 1 ? 'role' : 'roles'}. Candidates cannot advance until you record a decision.`}
            tone="owed"
          >
            <PrimaryAction onClick={() => (window.location.href = '/pipeline')}>
              Open pipeline
            </PrimaryAction>
            <SecondaryAction onClick={() => (window.location.href = '/interviews')}>
              My interviews
            </SecondaryAction>
          </DecisionBar>
        ) : (
          <DecisionBar
            ask="Nothing is waiting on you."
            why="No open roles carry an outstanding decision."
            tone="settled"
          />
        )
      )}
      {/* Real-Time Hiring Metrics */}
      {!isMounted ? (
        <div className="bg-card rounded-control border border-border border-t-2 border-t-gold-500 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <RealTimeMetrics updateInterval={5000} />
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-control p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={fetchData} className="text-sm text-red-600 hover:text-red-800 font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Candidate Pipeline — Full Width */}
      <CandidatePipeline
        stages={pipelineStages}
        onCandidateMove={handleCandidateMove}
        onCandidateClick={handleCandidateClick}
        title="Candidate Pipeline"
        subtitle="Drag to move candidates between stages"
        totalAvailable={totalApplications}
      />

      {/* Hiring Performance Metrics */}
      <div className="w-full overflow-hidden">
        <PerformanceMetrics
          metrics={metrics}
          title="Hiring Performance Indicators"
          subtitle="Track your team's hiring effectiveness"
        />
      </div>

      {/* 3-Column Grid: Open Positions | Application Volume | Today's Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Open Positions */}
        <div className="min-w-0 overflow-hidden">
          <DashboardWidget
            id="team-positions"
            title="Open Positions"
            subtitle="Current job openings"
            refreshable={true}
            size="medium"
          >
            {openPositions.length > 0 ? (
              <div className="space-y-4">
                {openPositions
                  .slice(positionsPage * POSITIONS_PAGE_SIZE, (positionsPage + 1) * POSITIONS_PAGE_SIZE)
                  .map((position: any) => (
                  <div key={position.id || position.title} className="flex items-center justify-between p-3 bg-muted rounded-control">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{position.title || position.role}</p>
                      <p className="text-sm text-muted-foreground">
                        {position.applicationCount ?? position.applications ?? 0} applications
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        position.status === 'PUBLISHED' || position.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-foreground'
                      }`}>
                        {position.status === 'PUBLISHED' ? 'Active' : (position.status || 'Active')}
                      </span>
                    </div>
                  </div>
                ))}
                {openPositions.length > POSITIONS_PAGE_SIZE && (() => {
                  const totalPages = Math.ceil(openPositions.length / POSITIONS_PAGE_SIZE);
                  const rangeStart = positionsPage * POSITIONS_PAGE_SIZE + 1;
                  const rangeEnd = Math.min((positionsPage + 1) * POSITIONS_PAGE_SIZE, openPositions.length);
                  return (
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {rangeStart}–{rangeEnd} of {openPositions.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setPositionsPage(p => p - 1)}
                          disabled={positionsPage === 0}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setPositionsPage(p => p + 1)}
                          disabled={positionsPage >= totalPages - 1}
                          className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <EmptyState
                icon={BriefcaseIcon}
                title="No Open Positions"
                description="There are no published job postings at the moment."
                action={{ label: 'Post New Job', href: '/job-postings?action=create' }}
              />
            )}
          </DashboardWidget>
        </div>

        {/* Today's Interviews */}
        <div className="min-w-0 overflow-hidden">
          <DashboardWidget
            id="interview-schedule"
            title="Today&apos;s Interviews"
            subtitle="Upcoming interviews"
            refreshable={true}
            size="medium"
          >
            {upcomingInterviews.length > 0 ? (
              <div className="space-y-3">
                {upcomingInterviews.map((interview: any) => (
                  <div key={interview.id} className="flex items-start gap-3 p-3 hover:bg-muted rounded-control">
                    <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-gold-500"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {interview.candidateName || interview.candidate}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {interview.jobTitle || interview.position}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {interview.scheduledAt
                          ? new Date(interview.scheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                          : interview.time}
                        {' - '}
                        {interview.interviewType || interview.type || 'Interview'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarIcon}
                title="No Upcoming Interviews"
                description="There are no interviews scheduled for today."
                action={{ label: 'Schedule Interview', href: '/interviews' }}
              />
            )}
          </DashboardWidget>
        </div>
      </div>

      {/* Quick Actions — Full Width Row */}
      <div className="w-full overflow-hidden">
        <DashboardWidget
          id="hiring-actions"
          title="Quick Actions"
          subtitle="Common hiring tasks"
          size="small"
        >
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => router.push('/job-postings?action=create')}
              className="bg-gold-500 text-violet-950 px-6 py-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Post New Job
            </button>
            <button
              onClick={() => router.push('/applications')}
              className="bg-gold-500 text-violet-950 px-6 py-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Review Applications
            </button>
            <button
              onClick={() => router.push('/interviews')}
              className="bg-green-600 text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Schedule Interview
            </button>
            <button
              onClick={() => router.push('/offers')}
              className="bg-orange-600 text-white px-6 py-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium"
            >
              Send Offer
            </button>
          </div>
        </DashboardWidget>
      </div>
    </div>
  );
}
