'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, {
  PrimaryAction,
  SecondaryAction,
  DestructiveAction,
} from '@/components/record/DecisionBar';
import StageRail from '@/components/record/StageRail';
import TermsGrid from '@/components/record/TermsGrid';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import {
  JobPostingRecord,
  buildStages,
  checkTypes,
  dwell,
  humanise,
  isJobPostingRecord,
  railFootnote,
  shortDate,
} from '@/components/job-postings/workflow';

/**
 * The approval and publishing record of one job advert.
 *
 * <p>This route did not exist. A posting could be created, submitted, approved, rejected, published,
 * unpublished and closed — seven transitions, every one of them writing an audit entry — and there
 * was nowhere to see any of it. The list screen showed a status pill and that was the whole story.
 *
 * <p><b>Authority is the server's answer, not this page's.</b> Job postings are the one mechanism in
 * this product that computes {@code canBeApproved} and its siblings server-side and returns them per
 * record. Every button below is gated on those flags. Deciding here which actions to offer would
 * reintroduce exactly the client-side/server-side divergence the approval work removed.
 */

/** One entry in the record's audit trail. */
interface AuditEntry {
  id: string;
  timestamp?: string;
  action?: string;
  userName?: string;
  userId?: string;
  details?: string;
}

/** JOB_POSTING_SUBMITTED_FOR_APPROVAL → "Submitted for approval". */
function actionLabel(action?: string): string {
  if (!action) return 'Recorded';
  return humanise(action.replace(/^JOB_POSTING_/, ''));
}

function longStamp(iso?: string): string {
  if (!iso) return 'Time not recorded';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Time not recorded';
  return `${date.toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}, ${date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`;
}

export default function JobPostingWorkflowPage() {
  // Static export: this page is pre-rendered once with a placeholder id ("_" — see
  // generateStaticParams in page.tsx and the "/job-postings/*" rewrite in
  // ShumelaHireFrontendStack.cs). useParams() would read that build-time placeholder rather than
  // the real id on a hard load or refresh, so the id comes from the browser URL.
  const pathname = usePathname();
  const postingId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['job-postings', '<id>']
    return parts.length >= 2 ? parts[1] : '';
  }, [pathname]);

  const [posting, setPosting] = useState<JobPostingRecord | null>(null);
  const [trail, setTrail] = useState<AuditEntry[]>([]);
  const [trailReadable, setTrailReadable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acting, setActing] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!postingId || postingId === '_') return;
    setLoading(true);

    try {
      const response = await apiFetch(`/api/job-postings/${postingId}`);
      const payload = response.ok ? await response.json() : null;
      if (isJobPostingRecord(payload)) {
        setPosting(payload);
        setNotFound(false);
      } else {
        setPosting(null);
        setNotFound(true);
      }
    } catch {
      setPosting(null);
      setNotFound(true);
    }

    // The trail is a second call and a lesser one: a posting that loads without it is still a
    // usable page, so a failure here narrows the page rather than breaking it. It is also
    // permission-gated more tightly than the posting itself, which is why "could not be read" is
    // shown rather than an empty history — an empty trail would be a lie, since every transition
    // writes one.
    try {
      const response = await apiFetch(`/api/audit/entity/JOB_POSTING/${postingId}`);
      if (response.ok) {
        const payload = await response.json();
        setTrail(Array.isArray(payload) ? payload : []);
        setTrailReadable(true);
      } else {
        setTrail([]);
        setTrailReadable(false);
      }
    } catch {
      setTrail([]);
      setTrailReadable(false);
    }

    setLoading(false);
  }, [postingId]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = useCallback(
    async (path: string, body?: Record<string, unknown>) => {
      setActing(true);
      setProblem(null);
      try {
        const response = await apiFetch(`/api/job-postings/${postingId}/${path}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body ?? {}),
        });
        if (!response.ok) {
          setProblem(await refusalMessage(response));
        } else {
          await load();
        }
      } catch {
        setProblem('The change could not be saved. Nothing was altered.');
      } finally {
        setActing(false);
      }
    },
    [postingId, load],
  );

  const stages = useMemo(() => (posting ? buildStages(posting) : []), [posting]);
  const checks = useMemo(() => (posting ? checkTypes(posting) : []), [posting]);

  const sortedTrail = useMemo(
    () =>
      [...trail].sort((a, b) => {
        const left = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const right = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return right - left;
      }),
    [trail],
  );

  if (loading) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Approval & publishing record" title="Loading…" />
      </PageWrapper>
    );
  }

  if (notFound || !posting) {
    return (
      <PageWrapper>
        <div className="space-y-4">
          <IdentityBand
            eyebrow="Approval & publishing record"
            title="This posting could not be found"
            subtitle="It may have been deleted, or the link may be wrong."
          />
          <DecisionBar
            ask="Nothing to show for this reference."
            why="No job posting was returned for this id."
            tone="stopped"
          >
            <PrimaryAction onClick={() => (window.location.href = '/job-postings')}>
              Back to postings
            </PrimaryAction>
          </DecisionBar>
        </div>
      </PageWrapper>
    );
  }

  const status = posting.status;
  const liveDays = dwell(posting.publishedAt);

  return (
    <PageWrapper>
      <div className="space-y-4">
        <IdentityBand
          eyebrow="Approval & publishing record"
          title={posting.title || 'Untitled posting'}
          subtitle={
            [
              posting.department,
              posting.requisitionId,
              posting.createdBy ? `raised by ${posting.createdBy}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || 'No department or requisition recorded'
          }
          figures={[
            { label: 'Status', value: posting.statusDisplayName || humanise(status ?? 'UNKNOWN') },
            {
              label: 'In workflow',
              value:
                dwell(posting.createdAt) !== null ? `${dwell(posting.createdAt)} days` : 'Not recorded',
            },
            ...(status === 'PUBLISHED' && liveDays !== null
              ? [{ label: 'Live for', value: `${liveDays} days` }]
              : []),
          ]}
        />

        {problem && (
          <DecisionBar ask="That change was refused." why={problem} tone="stopped">
            <SecondaryAction onClick={() => setProblem(null)}>Dismiss</SecondaryAction>
          </DecisionBar>
        )}

        {/*
          Every action is gated on the server's own flag. A posting the caller may not approve
          simply has no Approve button, rather than one that fails when pressed.
        */}
        {posting.canBeApproved && (
          <DecisionBar
            ask="This posting is waiting on your approval."
            why={
              posting.submittedForApprovalAt
                ? `Submitted on ${shortDate(posting.submittedForApprovalAt)}, ${dwell(
                    posting.submittedForApprovalAt,
                  )} days in this step.`
                : 'Submitted for approval.'
            }
            tone="owed"
          >
            <PrimaryAction disabled={acting} onClick={() => void act('approve')}>
              Approve
            </PrimaryAction>
            {posting.canBeRejected && (
              <DestructiveAction
                disabled={acting}
                onClick={() => {
                  const reason = window.prompt(
                    'Why is this being rejected? The reason is shown on the record and in the audit trail.',
                  );
                  if (reason && reason.trim()) void act('reject', { rejectionReason: reason.trim() });
                }}
              >
                Reject
              </DestructiveAction>
            )}
          </DecisionBar>
        )}

        {posting.canBePublished && (
          <DecisionBar
            ask="Approved and ready to publish."
            why="Publishing puts this advert on the careers site and starts accepting applications."
            tone="owed"
          >
            <PrimaryAction disabled={acting} onClick={() => void act('publish')}>
              Publish
            </PrimaryAction>
          </DecisionBar>
        )}

        {status === 'PUBLISHED' && (
          <DecisionBar
            ask="Live and accepting applications."
            why={
              posting.publishedAt
                ? `Published on ${shortDate(posting.publishedAt)}${
                    posting.publishedBy ? ` by ${posting.publishedBy}` : ''
                  }.`
                : 'Published.'
            }
            tone="settled"
          >
            {posting.canBeUnpublished && (
              <SecondaryAction disabled={acting} onClick={() => void act('unpublish')}>
                Unpublish
              </SecondaryAction>
            )}
            {posting.canBeClosed && (
              <SecondaryAction disabled={acting} onClick={() => void act('close')}>
                Close posting
              </SecondaryAction>
            )}
          </DecisionBar>
        )}

        {status === 'UNPUBLISHED' && (
          <DecisionBar
            ask="Withdrawn from the careers site."
            why={`Taken down${
              posting.unpublishedAt ? ` on ${shortDate(posting.unpublishedAt)}` : ''
            }. It is not closed — it can be published again.`}
            tone="stopped"
          >
            {posting.canBePublished && (
              <PrimaryAction disabled={acting} onClick={() => void act('publish')}>
                Publish again
              </PrimaryAction>
            )}
          </DecisionBar>
        )}

        {status === 'REJECTED' && (
          <DecisionBar
            ask="Rejected at approval — not advertised."
            why="It can be amended and resubmitted, which starts the approval clock again."
            tone="stopped"
          />
        )}

        <StageRail stages={stages} footnote={railFootnote(posting)} />

        {status === 'REJECTED' && posting.rejectionReason && (
          <section aria-label="Rejection reason" className="enterprise-card border-l-4 border-l-error">
            <div className="px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                Why it was rejected
              </h2>
              <p className="mt-1.5 text-sm text-foreground">{posting.rejectionReason}</p>
            </div>
          </section>
        )}

        {posting.approvalNotes && (
          <section aria-label="Approval notes" className="enterprise-card">
            <div className="px-5 py-4">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                Approval notes
              </h2>
              <p className="mt-1.5 text-sm text-foreground">{posting.approvalNotes}</p>
            </div>
          </section>
        )}

        <section aria-label="What is being advertised" className="enterprise-card">
          <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
            <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
              What is being advertised
            </h2>
            <span className="text-xs text-muted-foreground">
              {status === 'PENDING_APPROVAL' ? 'Locked while awaiting approval' : 'As recorded'}
            </span>
          </div>
          <TermsGrid
            terms={[
              {
                label: 'Employment type',
                value: posting.employmentTypeDisplayName,
                absent: 'Not recorded',
              },
              {
                label: 'Experience level',
                value: posting.experienceLevelDisplayName,
                absent: 'Not recorded',
              },
              { label: 'Location', value: posting.location, absent: 'Not recorded' },
              {
                label: 'Salary range',
                // Omitted rather than shown as a range of zero: a role advertised at nothing is a
                // different statement from one advertised without a range.
                value: posting.salaryRange || undefined,
                absent: 'No range captured',
              },
              {
                label: 'Positions',
                value: posting.positionsAvailable,
                absent: 'Not recorded',
              },
              {
                label: 'Applications close',
                value: shortDate(posting.applicationDeadline),
                absent: 'No closing date set',
              },
            ]}
          />
        </section>

        {checks.length > 0 && (
          <section aria-label="Verification required" className="enterprise-card">
            <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                Verification required before hire
              </h2>
              <span className="text-xs text-muted-foreground">Set on the requisition</span>
            </div>
            <div className="px-5 py-4">
              <ul className="flex flex-wrap gap-2">
                {checks.map((check) => (
                  <li
                    key={check}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground"
                  >
                    {humanise(check)}
                  </li>
                ))}
              </ul>
              {posting.enforceCheckCompletion && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Progression is blocked past Background Check until every one of these is completed
                  and clear. Approving this posting commits the panel to that gate.
                </p>
              )}
            </div>
          </section>
        )}

        {/*
          Reach, shown as two counts and nothing more.

          JobPostingService increments viewsCount on every getJobPostingBySlug with no session or IP
          dedup, and carries a TODO saying so — one candidate refreshing five times is five views.
          That rules out the conversion rate and the per-day average the design drew, both of which
          would read as precise while resting on an inflated denominator. Both counters are also
          scalars: no time series exists for either, so there is no sparkline to draw.
        */}
        {(status === 'PUBLISHED' || status === 'UNPUBLISHED' || status === 'CLOSED') && (
          <section aria-label="Reach" className="enterprise-card">
            <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                Interest
              </h2>
              <span className="text-xs text-muted-foreground">Since publishing</span>
            </div>
            <TermsGrid
              terms={[
                {
                  label: 'Page views',
                  value: posting.viewsCount,
                  absent: 'Not counted',
                },
                {
                  label: 'Applications',
                  value: posting.applicationsCount,
                  absent: 'Not counted',
                },
              ]}
            />
            <p className="px-5 pb-4 text-xs text-muted-foreground">
              Page views include repeat visits by the same person.
            </p>
          </section>
        )}

        <section aria-label="Audit trail" className="enterprise-card">
          <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
            <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
              Audit trail
            </h2>
            <span className="text-xs text-muted-foreground">
              {trailReadable
                ? `${sortedTrail.length} ${sortedTrail.length === 1 ? 'entry' : 'entries'}`
                : 'Not readable'}
            </span>
          </div>
          <div className="px-5 py-2">
            {!trailReadable ? (
              <p className="py-3 text-sm text-muted-foreground">
                The audit trail could not be read with your permissions. Every change to this
                posting is recorded — this is not an empty history.
              </p>
            ) : sortedTrail.length === 0 ? (
              <p className="py-3 text-sm text-muted-foreground">No entries recorded.</p>
            ) : (
              sortedTrail.map((entry) => (
                <div key={entry.id} className="py-3 border-t border-border first:border-t-0">
                  <div className="font-bold text-sm text-foreground">
                    {actionLabel(entry.action)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {entry.userName || entry.userId || 'User not recorded'} ·{' '}
                    {longStamp(entry.timestamp)}
                  </div>
                  {entry.details && (
                    <p className="mt-1 text-sm text-foreground">{entry.details}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
