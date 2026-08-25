'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import {
  RecruiterOverview,
  acceptanceTile,
  exceptions,
  funnel,
  funnelAvailable,
  isRecruiterOverview,
  FUNNEL_STAGES,
  STAGE_LABELS,
} from '../overview';

/**
 * What is on a recruiter's desk, on the screen they land on after signing in.
 *
 * <p><b>This dashboard used to invent its own content.</b> "Recent Sourcing Activities" was four
 * hardcoded strings — "Contacted 5 developers on LinkedIn", "Sarah Chen responded to interview
 * invitation" — rendered as if they were this tenant's activity, with timestamps. Five "Recruiting
 * Tools" buttons carried no click handler at all. None of it was marked as a placeholder anywhere
 * on screen.
 *
 * <p>It also ignored the endpoint built for exactly this purpose. {@code RecruiterDashboardResponse}
 * has existed since #278, composed from the same summaries the pipeline, offers and applications
 * screens use so the figures cannot disagree with the pages they link to — and only
 * {@code /recruiter-dashboard} consumed it. A recruiter therefore saw invented activity on their
 * landing page and real figures on a separate nav item.
 *
 * <p>Now: the band, bar and strip the rest of the product uses, over the real overview. Everything
 * on this screen is either sourced or absent with its reason given.
 */

interface RecruiterDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

/** A recent application, as the management search returns it. */
interface RecentApplication {
  id: string;
  candidateName?: string;
  jobTitle?: string;
  status?: string;
  submittedAt?: string;
}

function relativeDay(iso?: string): string {
  if (!iso) return 'Date not recorded';
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return 'Date not recorded';
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export default function RecruiterDashboard(_props: RecruiterDashboardProps) {
  const [overview, setOverview] = useState<RecruiterOverview | null>(null);
  const [recent, setRecent] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // The whole-set figures. Guarded rather than trusted: an error body is an object too, and
      // reading .applications off it would render a desk that looks real and empty.
      try {
        const response = await apiFetch('/api/analytics/recruiter-overview');
        const payload = response.ok ? await response.json() : null;
        if (!cancelled) setOverview(isRecruiterOverview(payload) ? payload : null);
      } catch {
        if (!cancelled) setOverview(null);
      }

      try {
        const response = await apiFetch(
          '/api/applications/manage/search?size=5&sortBy=submittedAt&sortDirection=desc',
        );
        const payload = response.ok ? await response.json() : null;
        const rows = Array.isArray(payload?.content) ? payload.content : [];
        if (!cancelled) setRecent(rows);
      } catch {
        if (!cancelled) setRecent([]);
      }

      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const acceptance = acceptanceTile(overview);
  const owed = exceptions(overview);
  const stages = funnelAvailable(overview) ? funnel(overview, FUNNEL_STAGES) : [];

  return (
    <div className="space-y-4">
      <IdentityBand
        eyebrow="Your desk"
        title="Recruiter"
        subtitle={
          overview
            ? `${overview.applications} ${overview.applications === 1 ? 'application' : 'applications'} · ${overview.openAdverts} ${overview.openAdverts === 1 ? 'advert' : 'adverts'} open`
            : loading
              ? 'Loading your desk…'
              : 'Counts unavailable'
        }
        figures={
          overview
            ? [
                {
                  label: 'Unscreened',
                  value: overview.unscreened,
                  tone: (overview.unscreened > 0 ? 'warning' : undefined) as 'warning' | undefined,
                },
                {
                  label: 'Interviews unwritten',
                  value: overview.interviewsAwaitingFeedback,
                  tone: (overview.interviewsAwaitingFeedback > 0 ? 'warning' : undefined) as
                    | 'warning'
                    | undefined,
                },
                // A rate over too few settled offers is noise wearing a percentage sign. The
                // threshold is stated rather than the figure being quietly withheld — and it is
                // never rendered as 0%, which would read as "nobody accepts our offers".
                {
                  label: 'Offer acceptance',
                  value:
                    acceptance.kind === 'value'
                      ? `${acceptance.value}%`
                      : acceptance.reason,
                },
              ]
            : []
        }
      />

      {owed.length > 0 && (
        <DecisionBar
          ask={`${owed.reduce((total, entry) => total + entry.count, 0)} ${
            owed.reduce((total, entry) => total + entry.count, 0) === 1 ? 'item is' : 'items are'
          } waiting on you.`}
          why={owed.map((entry) => `${entry.count} ${entry.label.toLowerCase()}`).join(' · ')}
          tone="owed"
        >
          <PrimaryAction onClick={() => (window.location.href = '/pipeline')}>
            Open pipeline
          </PrimaryAction>
          <SecondaryAction onClick={() => (window.location.href = '/applications')}>
            Applications
          </SecondaryAction>
        </DecisionBar>
      )}

      {!loading && overview && owed.length === 0 && (
        <DecisionBar
          ask="Nothing is waiting on you."
          why="No unscreened applications, no interviews without feedback, and no offers expiring."
          tone="settled"
        />
      )}

      {stages.length > 0 && (
        <DistributionStrip
          buckets={stages.map((stage) => ({
            label: STAGE_LABELS[stage.stage] ?? stage.stage,
            count: stage.reached,
          }))}
          footnote="Candidates who reached each stage, across every open advert."
        />
      )}

      <div className="enterprise-card">
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
          <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
            Newest applications
          </h2>
          <span className="text-xs text-muted-foreground">
            {recent.length > 0 ? `${recent.length} most recent` : 'Nothing yet'}
          </span>
        </div>
        <div className="px-5 py-3">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              {loading ? 'Loading…' : 'No applications have been submitted yet.'}
            </p>
          ) : (
            recent.map((application) => (
              <div
                key={application.id}
                className="flex items-center justify-between gap-3 py-2.5 border-t border-border first:border-t-0"
              >
                <div className="min-w-0">
                  <div className="font-bold text-sm text-foreground truncate">
                    {application.candidateName || 'Name not recorded'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {application.jobTitle || 'Role not recorded'} · {relativeDay(application.submittedAt)}
                  </div>
                </div>
                {application.status && (
                  <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[0.5625rem] font-extrabold uppercase tracking-[0.1em] bg-muted text-muted-foreground">
                    {application.status.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
