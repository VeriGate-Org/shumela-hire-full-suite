'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import { CandidatePipeline } from '../../dashboard';
import {
  decisionsOwed,
  quietRoles,
  receivedSince,
  startOfWeek,
  type ApplicationLike,
  type PostingLike,
} from './hiringSignals';
import EmptyState from '@/components/EmptyState';
import { BriefcaseIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface HiringManagerDashboardProps {
  /** The role being viewed, as the switcher names it. */
  roleLabel?: string;
  /** Handed down by the page, because this component owns the band. */
  actions?: React.ReactNode;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

/**
 * The six "hiring performance indicators" that used to live here are gone, and so is the
 * MetricItem shape behind them.
 *
 * <p>They were hardcoded zeros — time to fill, offer acceptance, interview-to-hire, quality of
 * hire, pipeline velocity, interview satisfaction — each carrying an invented target (30 days,
 * 85%, 3, 80%, 15, 4.5) that PerformanceMetrics drew a progress bar against. They were meant to be
 * replaced by /api/analytics/dashboard, which cannot supply them: see hiringSignals.ts for why the
 * KPI feed is empty by construction. Two of the six have no backend measure under any name.
 *
 * <p>PerformanceMetrics and RealTimeMetrics are still used by the Admin and HR dashboards, so the
 * components stay; only this screen's use of them goes.
 */

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

/**
 * How many applications the pipeline widget loads.
 *
 * Deliberately a named constant rather than an inline 50: it is a display cap, and the widget now
 * tells the user when the cap is doing something rather than presenting the truncated figure as a
 * complete count.
 */
const PIPELINE_PAGE_SIZE = 500;

// `color` is a CSS colour because CandidatePipeline feeds it to an inline style. It used to
// hold Tailwind class names — `bg-gold-100` and friends — which the browser drops as an
// invalid value, so every stage indicator rendered with no colour at all.
const stageMapping: Record<string, { name: string; color: string; order: number }> = {
  SUBMITTED: { name: 'Applied', color: 'var(--cta)', order: 0 },
  APPLIED: { name: 'Applied', color: 'var(--cta)', order: 0 },
  SCREENING: { name: 'Screening', color: 'var(--warning)', order: 1 },
  PHONE_SCREEN: { name: 'Screening', color: 'var(--warning)', order: 1 },
  INTERVIEW: { name: 'Interview', color: 'var(--link)', order: 2 },
  INTERVIEW_SCHEDULED: { name: 'Interview', color: 'var(--link)', order: 2 },
  INTERVIEW_COMPLETED: { name: 'Interview', color: 'var(--link)', order: 2 },
  // Verification sits between interview and offer. Its absence here was not a cosmetic gap:
  // unmapped statuses hit `if (!stageInfo) return` and vanished silently, so every candidate at
  // Reference Check — Lerato Dlamini among them — was missing from this widget entirely while
  // the pipeline board showed them.
  REFERENCE_CHECK: { name: 'Checks', color: 'var(--accent-navy)', order: 3 },
  BACKGROUND_CHECK: { name: 'Checks', color: 'var(--accent-navy)', order: 3 },
  OFFER: { name: 'Offer', color: 'var(--accent-teal)', order: 4 },
  OFFERED: { name: 'Offer', color: 'var(--accent-teal)', order: 4 },
  OFFER_PENDING: { name: 'Offer', color: 'var(--accent-teal)', order: 4 },
  HIRED: { name: 'Hired', color: 'var(--success)', order: 5 },
  OFFER_ACCEPTED: { name: 'Hired', color: 'var(--success)', order: 5 },
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
    { id: 'applied', name: 'Applied', color: 'var(--cta)', candidates: stageMap.get('applied') || [] },
    { id: 'screening', name: 'Screening', color: 'var(--warning)', candidates: stageMap.get('screening') || [] },
    { id: 'interview', name: 'Interview', color: 'var(--link)', candidates: stageMap.get('interview') || [] },
    { id: 'checks', name: 'Checks', color: 'var(--accent-navy)', candidates: stageMap.get('checks') || [] },
    { id: 'offer', name: 'Offer', color: 'var(--accent-teal)', candidates: stageMap.get('offer') || [] },
    { id: 'hired', name: 'Hired', color: 'var(--success)', candidates: stageMap.get('hired') || [] },
  ];
}

// selectedTimeframe is still in the props so RoleDashboard's call site is unchanged, but it is
// deliberately unused: /api/analytics/dashboard accepts only department and date, so passing it
// re-fetched identical data. Making it real is a backend change with its own gate.
export default function HiringManagerDashboard({ actions, roleLabel }: HiringManagerDashboardProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  // The raw rows, kept so the derived signals below can be computed from the same set the pipeline
  // is drawn from. Deriving them from a second fetch is how two figures on one screen disagree.
  const [applications, setApplications] = useState<ApplicationLike[]>([]);
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

    // /api/analytics/dashboard and /api/analytics/kpis are no longer called. Both answer with an
    // empty kpis map for the reason set out in hiringSignals.ts, and two requests per page load
    // that can only ever return nothing are worth removing along with what they fed.
    const [applicationsResult, positionsResult, interviewsResult] = await Promise.allSettled([
      // size=50 against a tenant with 92 applications meant the widget silently showed just over
      // half of them and labelled the result a total. The endpoint returns totalElements, which
      // is used below to say so honestly when a cap is still in play.
      apiFetch(`/api/applications/manage/search?size=${PIPELINE_PAGE_SIZE}`),
      apiFetch('/api/job-postings/published'),
      apiFetch('/api/interviews/upcoming'),
    ]);

    let allFailed = true;

    // Process applications into pipeline stages
    if (applicationsResult.status === 'fulfilled' && applicationsResult.value.ok) {
      allFailed = false;
      try {
        const data = await applicationsResult.value.json();
        const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
        const stages = transformApplicationsToPipeline(items);
        setPipelineStages(stages);
        setApplications(items);
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

  /**
   * The three things this screen can honestly say, all derived from rows already fetched.
   *
   * <p>Above the loading guard deliberately: a hook after an early return is a rules-of-hooks
   * violation that the test suite passes straight through and `next lint` fails the build on.
   */
  const signals = useMemo(() => {
    const now = Date.now();
    return {
      owed: decisionsOwed(applications, now),
      thisWeek: receivedSince(applications, startOfWeek(now)),
      quiet: quietRoles(openPositions as PostingLike[]),
    };
  }, [applications, openPositions]);

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

  const { owed, thisWeek, quiet } = signals;
  const counts = `${openPositions.length} ${openPositions.length === 1 ? 'role' : 'roles'} open · ${totalApplications} ${totalApplications === 1 ? 'candidate' : 'candidates'} in play`;

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <IdentityBand
        eyebrow="Your vacancies"
        title={roleLabel ?? 'Hiring Manager'}
        subtitle={
          typeof totalApplications === 'number'
            ? owed.oldest
              ? `${counts}. The longest has been waiting on you for ${owed.oldest.days} ${owed.oldest.days === 1 ? 'day' : 'days'}.`
              : counts
            : 'Counts unavailable'
        }
        // Roles and interviews are things that exist; neither is a thing you owe. What a hiring
        // manager is on the hook for is decisions, and nothing on this page used to say how many
        // were outstanding. "Interviews booked" also carried tone="warning" — a booked interview
        // is the system working.
        figures={[
          { label: 'Open roles', value: openPositions.length },
          { label: 'In play', value: totalApplications ?? openPositions.length },
          {
            label: 'Awaiting you',
            value: owed.count,
            tone: (owed.count > 0 ? 'critical' : undefined) as 'critical' | undefined,
          },
        ]}
       actions={actions}
      />

      {/* The ask is keyed on what is actually owed. It used to fire when interviews + open roles
          was above zero while its sentence named interviews alone, so seven open roles and no
          interviews produced "0 interviews are coming up." as the headline. */}
      {owed.count > 0 ? (
        <DecisionBar
          ask={`${owed.count} ${owed.count === 1 ? 'candidate is' : 'candidates are'} waiting on a decision from you.`}
          why={
            owed.oldest
              ? `Across ${openPositions.length} open ${openPositions.length === 1 ? 'role' : 'roles'}. The oldest has been at ${owed.oldest.stage} for ${owed.oldest.days} ${owed.oldest.days === 1 ? 'day' : 'days'} — ${owed.oldest.name}, ${owed.oldest.role}. Nothing moves them until you record an outcome.`
              : `Across ${openPositions.length} open ${openPositions.length === 1 ? 'role' : 'roles'}. Nothing moves them until you record an outcome.`
          }
          tone="owed"
        >
          <PrimaryAction onClick={() => router.push('/pipeline')}>
            Open pipeline
          </PrimaryAction>
          <SecondaryAction onClick={() => router.push('/interviews')}>
            My interviews
          </SecondaryAction>
        </DecisionBar>
      ) : (
        <DecisionBar
          ask="Nothing is waiting on you."
          why="No candidate is held at a stage that needs your decision."
          tone="settled"
        />
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-error-bg border border-error rounded-control p-4 flex items-center justify-between">
          <p className="text-sm text-error-on-tint">{error}</p>
          <button onClick={fetchData} className="text-sm font-medium text-error-on-tint underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* The three signals that replace eight figures which could not be sourced. */}
      {isMounted && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-card p-4">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Applications this week
            </p>
            <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">{thisWeek}</p>
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">
              Received since Monday, across all your roles
            </p>
          </div>

          <div className="bg-card border border-border rounded-card p-4">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Roles with no applications
            </p>
            {quiet.measurable ? (
              <>
                <p className={`mt-1 text-2xl font-extrabold tabular-nums ${quiet.titles.length > 0 ? 'text-error-on-tint' : 'text-foreground'}`}>
                  {quiet.titles.length}
                </p>
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                  {quiet.titles.length > 0
                    ? `Published, attracting nothing — ${quiet.titles.slice(0, 2).join(', ')}${quiet.titles.length > 2 ? ` and ${quiet.titles.length - 2} more` : ''}`
                    : 'Every published role has at least one application'}
                </p>
              </>
            ) : (
              // An absent field and a genuine zero must not look the same.
              <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                Not reported — the postings feed did not return application counts.
              </p>
            )}
          </div>

          <div className="bg-card border border-border rounded-card p-4">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-muted-foreground">
              Longest wait
            </p>
            {owed.oldest ? (
              <>
                <p className="mt-1 text-2xl font-extrabold tabular-nums text-foreground">
                  {owed.oldest.days}
                  <span className="ml-1 text-sm font-semibold text-muted-foreground">
                    {owed.oldest.days === 1 ? 'day' : 'days'}
                  </span>
                </p>
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                  {owed.oldest.name} · {owed.oldest.role} · at {owed.oldest.stage}
                </p>
              </>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                Nobody is waiting on a decision.
              </p>
            )}
          </div>
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

      {/* Where six indicators used to be. Saying nothing would leave the reader assuming this
          screen has no view on hiring performance; saying why is the difference between a gap and
          a silence. */}
      <div className="bg-card border border-dashed border-border rounded-card p-4">
        <p className="text-[0.8125rem] font-bold text-muted-foreground">
          Hiring performance indicators are not shown
        </p>
        <p className="mt-1 text-[0.8125rem] text-muted-foreground max-w-[76ch]">
          The backend computes sixteen recruitment measures on every restart but files them under
          categories the KPI reader does not match, so nothing reaches this page. Six indicators
          used to be drawn here as zeros against targets nobody set. Rather than estimate them,
          they are off until the feed is fixed.
        </p>
      </div>

      {/*
       * Three columns, and Quick actions is one of them.
       *
       * <p>It used to sit in a full-width row underneath, which left this grid declaring three
       * columns while holding two — an empty third cell on every wide screen.
       *
       * <p>These are plain cards rather than DashboardWidget. The widget adds a 2px accent border,
       * a refresh control and an overflow menu to each panel; three of those side by side is more
       * chrome than content, and none of it was asked for.
       */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-full items-start">

        <section className="min-w-0 bg-card border border-border rounded-card p-4">
          <h2 className="text-[1.0625rem] font-bold text-foreground">Open positions</h2>
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
            {openPositions.length} published {openPositions.length === 1 ? 'role' : 'roles'}
          </p>

          {openPositions.length > 0 ? (
            <div className="mt-3">
              {openPositions
                .slice(positionsPage * POSITIONS_PAGE_SIZE, (positionsPage + 1) * POSITIONS_PAGE_SIZE)
                .map((position: any) => {
                  const count = position.applicationsCount;
                  const quiet = count === 0;
                  return (
                    <div
                      key={position.id || position.title}
                      className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-b-0"
                    >
                      <div className="min-w-0">
                        <p className="text-[0.8125rem] font-semibold text-foreground truncate">
                          {position.title || position.role}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {typeof count !== 'number'
                            ? 'Applications not reported'
                            : quiet
                              ? 'No applications yet'
                              : `${count} ${count === 1 ? 'application' : 'applications'}`}
                        </p>
                      </div>
                      {/* A published role attracting nothing is the state worth seeing here — the
                          status pill said "Active" for it, which is true and useless. */}
                      <span
                        className={`flex-none px-2 py-0.5 rounded-full text-[0.6875rem] font-bold ${
                          quiet
                            ? 'bg-surface-gold text-accent-gold-on-tint'
                            : position.status === 'PUBLISHED' || position.status === 'Active'
                              ? 'bg-success-bg text-success-on-tint'
                              : 'bg-muted text-foreground'
                        }`}
                      >
                        {quiet ? 'Quiet' : position.status === 'PUBLISHED' ? 'Active' : (position.status || 'Active')}
                      </span>
                    </div>
                  );
                })}

              {openPositions.length > POSITIONS_PAGE_SIZE && (() => {
                const totalPages = Math.ceil(openPositions.length / POSITIONS_PAGE_SIZE);
                const rangeStart = positionsPage * POSITIONS_PAGE_SIZE + 1;
                const rangeEnd = Math.min((positionsPage + 1) * POSITIONS_PAGE_SIZE, openPositions.length);
                return (
                  <div className="flex items-center justify-between pt-3 mt-1 border-t border-border">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {rangeStart}–{rangeEnd} of {openPositions.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        aria-label="Previous positions"
                        onClick={() => setPositionsPage((n) => n - 1)}
                        disabled={positionsPage === 0}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        aria-label="More positions"
                        onClick={() => setPositionsPage((n) => n + 1)}
                        disabled={positionsPage >= totalPages - 1}
                        className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
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
              title="No open positions"
              description="Nothing is published, so nothing can be applied to."
              action={{ label: 'Post a job', href: '/job-postings?action=create' }}
            />
          )}
        </section>

        <section className="min-w-0 bg-card border border-border rounded-card p-4">
          {/* It reads /api/interviews/upcoming and renders all of them, so the heading was the
              thing that was wrong, not the data. */}
          <h2 className="text-[1.0625rem] font-bold text-foreground">Upcoming interviews</h2>
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
            {upcomingInterviews.length === 0
              ? 'Nothing scheduled'
              : `Next ${upcomingInterviews.length}, soonest first`}
          </p>

          {upcomingInterviews.length > 0 ? (
            <div className="mt-3">
              {upcomingInterviews.map((interview: any) => (
                <div
                  key={interview.id}
                  className="flex items-start gap-2.5 py-2.5 border-b border-border last:border-b-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cta mt-2 flex-none" />
                  <div className="min-w-0">
                    <p className="text-[0.8125rem] font-semibold text-foreground truncate">
                      {interview.candidateName || interview.candidate}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {interview.jobTitle || interview.position}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {interview.scheduledAt
                        ? new Date(interview.scheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })
                        : interview.time}
                      {' · '}
                      {interview.interviewType || interview.type || 'Interview'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarIcon}
              title="No upcoming interviews"
              description="Nothing is scheduled. Candidates at the interview stage are waiting for a slot."
              action={{ label: 'Schedule an interview', href: '/interviews' }}
            />
          )}
        </section>

        <section className="min-w-0 bg-card border border-border rounded-card p-4">
          <h2 className="text-[1.0625rem] font-bold text-foreground">Quick actions</h2>
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Common hiring tasks</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {/* One primary, three quiet. These were gold, gold, green and orange, and the colour
                carried no meaning — green did not mean safe, orange did not mean caution. */}
            <button
              onClick={() => router.push('/job-postings?action=create')}
              className="rounded-full bg-cta px-4 py-2 text-[0.8125rem] font-semibold text-cta-foreground transition-colors hover:bg-cta-hover"
            >
              Post a job
            </button>
            {[
              { label: 'Review applications', href: '/applications' },
              { label: 'Schedule an interview', href: '/interviews' },
              { label: 'Send an offer', href: '/offers' },
            ].map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="rounded-full border border-border px-4 py-2 text-[0.8125rem] font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {action.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
