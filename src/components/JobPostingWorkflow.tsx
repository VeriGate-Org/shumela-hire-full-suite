'use client';

import React, { useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import { apiFetch } from '@/lib/api-fetch';

interface JobPostingWorkflowProps {
  jobPosting: {
    id: string | number;
    title: string;
    department: string;
    status: string;
    statusDisplayName: string;
    statusCssClass: string;
    statusIcon: string;
    canBeSubmittedForApproval: boolean;
    canBeApproved: boolean;
    canBeRejected: boolean;
    canBePublished: boolean;
    canBeUnpublished: boolean;
    canBeClosed: boolean;
    createdAt: string;
    submittedForApprovalAt?: string;
    approvedAt?: string;
    publishedAt?: string;
    unpublishedAt?: string;
    closedAt?: string;
    approvalNotes?: string;
    rejectionReason?: string;
    createdBy: string | number;
    approvedBy?: string | number;
    publishedBy?: string | number;
    daysFromCreation: number;
    daysFromPublication: number;
    applicationsCount: number;
    viewsCount: number;
    /**
     * The advertised terms. Optional here only because this component is handed the posting by
     * whoever owns it; the API returns all four on every posting.
     */
    employmentTypeDisplayName?: string;
    experienceLevelDisplayName?: string;
    location?: string;
    salaryRange?: string;
    /** Stored as a JSON array in a string column — see VerificationRequirementsPanel. */
    requiredCheckTypes?: string | string[] | null;
    enforceCheckCompletion?: boolean | null;
  };
  onStatusChange?: (updatedPosting: JobPostingWorkflowProps['jobPosting']) => void;
  currentUserId?: string | number;
}

const DAY_MS = 86_400_000;

/** The five stages every posting moves through. Rejection and cancellation stop the run. */
const STAGES = [
  { key: 'DRAFT', name: 'Drafted' },
  { key: 'PENDING_APPROVAL', name: 'Pending approval' },
  { key: 'APPROVED', name: 'Approved' },
  { key: 'PUBLISHED', name: 'Published' },
  { key: 'CLOSED', name: 'Closed' },
] as const;

type StageState = 'done' | 'current' | 'todo' | 'stopped';

const STOPPED_STATUSES = ['REJECTED', 'CANCELLED'];
/** Statuses where somebody owes this posting a decision. */
const AWAITING_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'];
/** Reach is only meaningful once the posting has actually been advertised. */
const ADVERTISED_STATUSES = ['PUBLISHED', 'UNPUBLISHED', 'CLOSED'];

const parseAt = (value?: string): number | null => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const formatDay = (value?: string): string | null => {
  const ms = parseAt(value);
  if (ms === null) return null;
  return new Date(ms).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatMoment = (value?: string): string | null => {
  const ms = parseAt(value);
  if (ms === null) return null;
  return new Date(ms).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const daysBetween = (from: number, to: number): number => Math.max(0, Math.floor((to - from) / DAY_MS));

const dayCount = (days: number | null): string => {
  if (days === null) return '—';
  if (days === 0) return 'Under a day';
  return `${days} day${days === 1 ? '' : 's'}`;
};

/**
 * Actors are stored as opaque user ids, not names. Printing a raw UUID in a subtitle wrecks the
 * line, so an id-shaped value is shortened to a reference; anything that already reads as a name
 * is left alone.
 */
const actorLabel = (value?: string | number | null): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (text.length > 14 && !text.includes(' ')) return `user ${text.slice(0, 8)}`;
  return text;
};

const parseRequiredChecks = (value?: string | string[] | null): string[] => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

/** CRIMINAL_RECORD -> Criminal record. Presentation only; the code is what the API stores. */
const humaniseCheck = (code: string): string => {
  const words = code.replace(/[_-]+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function JobPostingWorkflow({ jobPosting, onStatusChange, currentUserId }: JobPostingWorkflowProps) {
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showPublishForm, setShowPublishForm] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [publishAudience, setPublishAudience] = useState<'both' | 'internal' | 'external'>('both');
  const [loading, setLoading] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [pendingRejection, setPendingRejection] = useState(false);

  const handleWorkflowAction = async (action: string, notes?: string) => {
    if (!currentUserId) {
      setActionFeedback({
        type: 'error',
        message: 'User ID required. Please sign in again.',
      });
      return;
    }

    if (action === 'reject' && !notes?.trim()) {
      setActionFeedback({
        type: 'error',
        message: 'Rejection reason is required before rejecting a job posting.',
      });
      return;
    }

    try {
      setLoading(action);
      setActionFeedback(null);
      const payload = new URLSearchParams();

      switch (action) {
        case 'submit-for-approval':
          payload.append('submittedBy', String(currentUserId));
          break;
        case 'approve':
          payload.append('approvedBy', String(currentUserId));
          if (notes?.trim()) payload.append('approvalNotes', notes.trim());
          break;
        case 'reject':
          payload.append('rejectedBy', String(currentUserId));
          payload.append('rejectionReason', notes?.trim() || '');
          break;
        case 'publish':
          payload.append('publishedBy', String(currentUserId));
          payload.append('channelInternal', String(publishAudience === 'both' || publishAudience === 'internal'));
          payload.append('channelExternal', String(publishAudience === 'both' || publishAudience === 'external'));
          break;
        case 'unpublish':
          payload.append('unpublishedBy', String(currentUserId));
          break;
        case 'close':
          payload.append('closedBy', String(currentUserId));
          break;
      }

      const response = await apiFetch(`/api/job-postings/${jobPosting.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: payload.toString(),
      });

      if (response.ok) {
        const updatedJobPosting = await response.json();

        // Optimistic success feedback
        setActionFeedback({
          type: 'success',
          message: `Successfully completed "${action.replace('-', ' ')}".`,
        });

        // Auto-dismiss success feedback after 3 seconds
        setTimeout(() => {
          setActionFeedback(prev => prev?.type === 'success' ? null : prev);
        }, 3000);

        // Pass full updated posting to parent
        if (onStatusChange) {
          onStatusChange(updatedJobPosting);
        }

        // Reset forms
        setShowApprovalForm(false);
        setShowRejectionForm(false);
        setShowPublishForm(false);
        setApprovalNotes('');
        setRejectionReason('');
        setPublishAudience('both');
      } else {
        let message = `Failed to ${action.replace('-', ' ')}`;
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            message = errorData.message;
          }
        } catch {
          // Leave default message when response body is not JSON.
        }
        setActionFeedback({ type: 'error', message });
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      setActionFeedback({
        type: 'error',
        message: `An unexpected error occurred while performing "${action.replace('-', ' ')}".`,
      });
    } finally {
      setLoading(null);
    }
  };

  // ---------------------------------------------------------------------------------------------
  // Derived record state. Everything below comes off timestamps the posting already carries.
  // ---------------------------------------------------------------------------------------------
  const now = Date.now();
  const status = jobPosting.status;
  const createdMs = parseAt(jobPosting.createdAt);
  const submittedMs = parseAt(jobPosting.submittedForApprovalAt);
  const approvedMs = parseAt(jobPosting.approvedAt);
  const publishedMs = parseAt(jobPosting.publishedAt);
  const unpublishedMs = parseAt(jobPosting.unpublishedAt);
  const closedMs = parseAt(jobPosting.closedAt);

  const isStopped = STOPPED_STATUSES.includes(status);
  const isAwaiting = AWAITING_STATUSES.includes(status);
  const isAdvertised = ADVERTISED_STATUSES.includes(status);

  const reachedIndex = (): number => {
    if (closedMs !== null) return 4;
    if (publishedMs !== null) return 3;
    if (approvedMs !== null) return 2;
    if (submittedMs !== null) return 1;
    return 0;
  };

  const currentIndex = (() => {
    switch (status) {
      case 'DRAFT': return 0;
      case 'PENDING_APPROVAL': return 1;
      case 'REJECTED': return 1;
      case 'APPROVED': return 2;
      case 'PUBLISHED': return 3;
      case 'UNPUBLISHED': return 3;
      case 'CLOSED': return 4;
      default: return reachedIndex();
    }
  })();

  /** Start and end of each stage; end is "now" while the posting still sits there. */
  const stageSpan = (index: number): { start: number | null; end: number } => {
    switch (index) {
      case 0: return { start: createdMs, end: submittedMs ?? now };
      case 1: return { start: submittedMs, end: approvedMs ?? now };
      case 2: return { start: approvedMs, end: publishedMs ?? now };
      case 3: return { start: publishedMs, end: unpublishedMs ?? closedMs ?? now };
      default: return { start: closedMs, end: now };
    }
  };

  const stageDays = STAGES.map((_, index) => {
    if (index > currentIndex) return null;
    const { start, end } = stageSpan(index);
    if (start === null) return null;
    return daysBetween(start, end);
  });

  const longestStage = stageDays.reduce<number>((max, d) => (d !== null && d > max ? d : max), 0);

  const stageState = (index: number): StageState => {
    if (isStopped && index === currentIndex) return 'stopped';
    if (index < currentIndex) return 'done';
    if (index === currentIndex) return 'current';
    return 'todo';
  };

  const stageName = (index: number): string => {
    if (index === 1 && status === 'REJECTED') return 'Rejected';
    if (index === 3 && status === 'UNPUBLISHED') return 'Unpublished';
    if (isStopped && index === currentIndex && status === 'CANCELLED') return 'Cancelled';
    return STAGES[index].name;
  };

  /** Who acted at this stage and when — or what the stage is still waiting for. */
  const stageWho = (index: number): { actor?: string; detail: string } => {
    const state = stageState(index);
    switch (index) {
      case 0:
        return { actor: actorLabel(jobPosting.createdBy) ?? undefined, detail: formatDay(jobPosting.createdAt) ?? 'Not recorded' };
      case 1:
        if (status === 'REJECTED') return { detail: 'Returned to the raiser' };
        if (submittedMs !== null && state === 'done') return { detail: `Submitted ${formatDay(jobPosting.submittedForApprovalAt)}` };
        if (state === 'current') {
          return { detail: submittedMs !== null ? `Awaiting approval since ${formatDay(jobPosting.submittedForApprovalAt)}` : 'Awaiting approval' };
        }
        return { detail: 'Not submitted yet' };
      case 2:
        if (approvedMs !== null) return { actor: actorLabel(jobPosting.approvedBy) ?? undefined, detail: formatDay(jobPosting.approvedAt) ?? 'Approved' };
        if (state === 'current') return { detail: 'Ready to publish' };
        return { detail: 'Not reached' };
      case 3:
        if (status === 'UNPUBLISHED') return { detail: `Taken down ${formatDay(jobPosting.unpublishedAt) ?? ''}`.trim() };
        if (publishedMs !== null) return { actor: actorLabel(jobPosting.publishedBy) ?? undefined, detail: formatDay(jobPosting.publishedAt) ?? 'Published' };
        if (state === 'current') return { detail: 'Live, accepting applications' };
        return { detail: 'Not advertised yet' };
      default:
        if (closedMs !== null) return { detail: formatDay(jobPosting.closedAt) ?? 'Closed' };
        if (state === 'current') return { detail: 'No longer accepting' };
        return { detail: 'Still open' };
    }
  };

  const currentStageDays = stageDays[currentIndex];

  // Third figure in the identity band: what the record is doing right now.
  const headlineFigure = (() => {
    if (status === 'PUBLISHED') {
      return { key: 'Live for', value: `${jobPosting.daysFromPublication} days`, urgent: false };
    }
    if (isAwaiting) {
      return { key: 'Waiting', value: dayCount(currentStageDays), urgent: true };
    }
    return { key: 'In this stage', value: dayCount(currentStageDays), urgent: false };
  })();

  // ---------------------------------------------------------------------------------------------
  // The decision bar: what is owed, by whom, and why.
  // ---------------------------------------------------------------------------------------------
  const decision = (() => {
    switch (status) {
      case 'DRAFT':
        return {
          tone: 'owed' as const,
          ask: 'This posting is a draft and has not been submitted.',
          why: `Raised ${formatDay(jobPosting.createdAt) ?? 'recently'}. Nothing is advertised and no approver has seen it yet.`,
        };
      case 'PENDING_APPROVAL':
        return {
          tone: 'owed' as const,
          ask: 'This posting is waiting on approval.',
          why: `Submitted ${formatDay(jobPosting.submittedForApprovalAt) ?? 'for approval'}. ${dayCount(currentStageDays)} in this stage.`,
        };
      case 'APPROVED':
        return {
          tone: 'owed' as const,
          ask: 'Approved and ready to publish.',
          why: `Approved ${formatDay(jobPosting.approvedAt) ?? ''}. It is not advertised anywhere until it is published.`.replace('  ', ' '),
        };
      case 'PUBLISHED':
        return {
          tone: 'live' as const,
          ask: 'Live and accepting applications.',
          why: `Published ${formatDay(jobPosting.publishedAt) ?? ''} — ${jobPosting.daysFromPublication} days live, ${jobPosting.applicationsCount} application${jobPosting.applicationsCount === 1 ? '' : 's'} received.`.replace('  ', ' '),
        };
      case 'UNPUBLISHED':
        return {
          tone: 'owed' as const,
          ask: 'Taken down — no longer advertised.',
          why: `Unpublished ${formatDay(jobPosting.unpublishedAt) ?? ''}. Applications already received are unaffected.`.replace('  ', ' '),
        };
      case 'REJECTED':
        return {
          tone: 'refused' as const,
          ask: 'Rejected at approval — not advertised.',
          why: 'It can be amended and resubmitted, which starts the approval clock again.',
        };
      case 'CANCELLED':
        return {
          tone: 'refused' as const,
          ask: 'Cancelled — this posting will not be advertised.',
          why: 'The record is kept for the audit trail. Nothing further happens to it.',
        };
      case 'CLOSED':
        return {
          tone: 'live' as const,
          ask: 'Closed — no longer accepting applications.',
          why: `Closed ${formatDay(jobPosting.closedAt) ?? ''} after ${jobPosting.applicationsCount} application${jobPosting.applicationsCount === 1 ? '' : 's'}.`.replace('  ', ' '),
        };
      default:
        return {
          tone: 'live' as const,
          ask: jobPosting.statusDisplayName,
          why: `In workflow for ${jobPosting.daysFromCreation} days.`,
        };
    }
  })();

  const decisionBorder =
    decision.tone === 'owed' ? 'border-l-cta'
      : decision.tone === 'refused' ? 'border-l-accent-pink'
        : 'border-l-accent-teal';

  const statusPill =
    decision.tone === 'owed' ? 'bg-cta/20 text-cta'
      : decision.tone === 'refused' ? 'bg-accent-pink/25 text-accent-pink'
        : 'bg-accent-teal/25 text-accent-teal';

  // ---------------------------------------------------------------------------------------------
  // Audit trail — newest first, notes shown in place.
  // ---------------------------------------------------------------------------------------------
  type AuditEntry = { id: string; title: string; meta: string; note?: string; tone: 'ok' | 'now' | 'bad' };
  const auditTrail: AuditEntry[] = [];

  if (isAwaiting && currentIndex > 0) {
    auditTrail.push({
      id: 'waiting',
      title: currentIndex === 1 ? 'Awaiting approval' : currentIndex === 2 ? 'Awaiting publication' : `Awaiting ${stageName(currentIndex).toLowerCase()}`,
      meta: `${dayCount(currentStageDays)} in this stage`,
      tone: 'now',
    });
  }
  if (status === 'REJECTED') {
    auditTrail.push({
      id: 'rejected',
      title: 'Rejected',
      // The API records the reason but no rejection timestamp, so none is claimed here.
      meta: 'Returned at approval',
      note: jobPosting.rejectionReason,
      tone: 'bad',
    });
  }
  if (status === 'CANCELLED') {
    auditTrail.push({ id: 'cancelled', title: 'Cancelled', meta: 'Workflow stopped', tone: 'bad' });
  }
  if (closedMs !== null) {
    auditTrail.push({ id: 'closed', title: 'Closed', meta: formatMoment(jobPosting.closedAt) ?? '', tone: 'ok' });
  }
  if (unpublishedMs !== null) {
    auditTrail.push({ id: 'unpublished', title: 'Unpublished', meta: formatMoment(jobPosting.unpublishedAt) ?? '', tone: 'ok' });
  }
  if (publishedMs !== null) {
    auditTrail.push({
      id: 'published',
      title: 'Published',
      meta: [actorLabel(jobPosting.publishedBy), formatMoment(jobPosting.publishedAt)].filter(Boolean).join(' · '),
      tone: status === 'PUBLISHED' ? 'now' : 'ok',
    });
  }
  if (approvedMs !== null) {
    auditTrail.push({
      id: 'approved',
      title: 'Approved',
      meta: [actorLabel(jobPosting.approvedBy), formatMoment(jobPosting.approvedAt)].filter(Boolean).join(' · '),
      note: jobPosting.approvalNotes,
      tone: 'ok',
    });
  }
  if (submittedMs !== null) {
    auditTrail.push({
      id: 'submitted',
      title: 'Submitted for approval',
      meta: formatMoment(jobPosting.submittedForApprovalAt) ?? '',
      tone: 'ok',
    });
  }
  auditTrail.push({
    id: 'created',
    title: 'Drafted',
    meta: [actorLabel(jobPosting.createdBy), formatMoment(jobPosting.createdAt)].filter(Boolean).join(' · '),
    tone: 'ok',
  });

  // ---------------------------------------------------------------------------------------------
  const terms: Array<{ key: string; value?: string }> = [
    { key: 'Employment type', value: jobPosting.employmentTypeDisplayName },
    { key: 'Experience level', value: jobPosting.experienceLevelDisplayName },
    { key: 'Location', value: jobPosting.location },
    { key: 'Salary range', value: jobPosting.salaryRange },
  ];

  const termsHint =
    status === 'DRAFT' || status === 'REJECTED' ? 'Editable'
      : status === 'PUBLISHED' ? 'Live copy'
        : 'Locked at this stage';

  const requiredChecks = parseRequiredChecks(jobPosting.requiredCheckTypes);

  const viewsPerDay = jobPosting.daysFromPublication > 0
    ? Math.round(jobPosting.viewsCount / jobPosting.daysFromPublication)
    : jobPosting.viewsCount;
  const applyRate = jobPosting.viewsCount > 0
    ? `${((jobPosting.applicationsCount / jobPosting.viewsCount) * 100).toFixed(1)}% of views`
    : 'No views recorded yet';

  const eyebrow = 'text-[0.625rem] font-extrabold uppercase tracking-[0.16em]';
  const keyLabel = 'text-[0.5625rem] font-extrabold uppercase tracking-[0.15em] text-muted-foreground';
  const btnBase = 'text-xs font-extrabold uppercase tracking-[0.07em] px-[18px] py-2.5 rounded-full border transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const btnGold = `${btnBase} bg-cta border-cta text-cta-foreground hover:bg-cta-hover hover:border-cta-hover`;
  const btnGhost = `${btnBase} bg-transparent border-border text-foreground hover:bg-muted`;
  const btnDanger = `${btnBase} bg-transparent border-accent-pink/40 text-accent-pink hover:bg-surface-pink`;
  const cardHeader = 'flex items-baseline justify-between gap-3.5 px-5 py-4 border-b border-border';
  const cardTitle = 'text-[0.8125rem] font-extrabold tracking-tight text-foreground';
  const cardHint = 'text-[0.6875rem] text-muted-foreground';

  return (
    <div className="space-y-3.5">
      {/* 1 — Identity band. Says what the record is before anything on it is read. */}
      <header className="relative overflow-hidden rounded-card bg-shumelahire-800 px-6 py-6 text-white flex flex-wrap items-start justify-between gap-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(115% 130% at 88% -10%, rgba(5,82,126,.62) 0%, rgba(3,46,73,0) 62%)' }}
        />
        <div className="relative z-10 min-w-0">
          <p className={`${eyebrow} text-cta m-0`}>Approval &amp; publishing record</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h1 className="m-0 text-2xl font-extrabold tracking-tight leading-tight text-white">{jobPosting.title}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-[0.625rem] font-extrabold uppercase tracking-[0.12em] ${statusPill}`}>
              {jobPosting.statusDisplayName}
            </span>
          </div>
          <p className="mt-1.5 mb-0 text-sm text-white/60">
            {jobPosting.department}
            {actorLabel(jobPosting.createdBy) && (
              <> &middot; raised by <b className="font-bold text-white/90">{actorLabel(jobPosting.createdBy)}</b></>
            )}
          </p>
        </div>
        <dl className="relative z-10 m-0 flex flex-wrap gap-x-7 gap-y-3">
          <div className="min-w-[88px]">
            <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-white/40">Stage</dt>
            <dd className="m-0 mt-0.5 text-[1.05rem] font-extrabold tracking-tight">
              {isStopped ? 'Stopped' : `${currentIndex + 1} of 5`}
            </dd>
          </div>
          <div className="min-w-[88px]">
            <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-white/40">In workflow</dt>
            <dd className="m-0 mt-0.5 text-[1.05rem] font-extrabold tracking-tight tabular-nums">{jobPosting.daysFromCreation} days</dd>
          </div>
          <div className="min-w-[88px]">
            <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-white/40">{headlineFigure.key}</dt>
            <dd className={`m-0 mt-0.5 text-[1.05rem] font-extrabold tracking-tight tabular-nums ${headlineFigure.urgent ? 'text-cta' : ''}`}>
              {headlineFigure.value}
            </dd>
          </div>
        </dl>
      </header>

      {/* 2 — Decision bar. What is owed, stated as a sentence, with the actions beside it. */}
      <div
        className={`flex flex-wrap items-center gap-4 rounded-card border border-border border-l-4 ${decisionBorder} bg-card px-5 py-4 shadow-sm`}
        data-testid="decision-bar"
      >
        <div className="flex-1 basis-80 min-w-0">
          <p className="m-0 text-base font-extrabold tracking-tight text-foreground">{decision.ask}</p>
          <p className="m-0 mt-0.5 text-[0.8125rem] text-muted-foreground">{decision.why}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {jobPosting.canBeSubmittedForApproval && (
            <button
              type="button"
              onClick={() => handleWorkflowAction('submit-for-approval')}
              disabled={loading === 'submit-for-approval'}
              className={btnGold}
            >
              {loading === 'submit-for-approval' ? 'Submitting…' : 'Submit for Approval'}
            </button>
          )}
          {jobPosting.canBeApproved && !showApprovalForm && (
            <button type="button" onClick={() => setShowApprovalForm(true)} className={btnGold}>
              Approve
            </button>
          )}
          {jobPosting.canBeRejected && !showRejectionForm && (
            <button type="button" onClick={() => setShowRejectionForm(true)} className={btnDanger}>
              Reject
            </button>
          )}
          {jobPosting.canBePublished && !showPublishForm && (
            <button
              type="button"
              onClick={() => setShowPublishForm(true)}
              disabled={loading === 'publish'}
              className={btnGold}
            >
              Publish
            </button>
          )}
          {jobPosting.canBeUnpublished && (
            <button
              type="button"
              onClick={() => setPendingAction('unpublish')}
              disabled={loading === 'unpublish'}
              className={btnGhost}
            >
              {loading === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
            </button>
          )}
          {jobPosting.canBeClosed && (
            <button
              type="button"
              onClick={() => setPendingAction('close')}
              disabled={loading === 'close'}
              className={btnGhost}
            >
              {loading === 'close' ? 'Closing…' : 'Close Posting'}
            </button>
          )}
        </div>
      </div>

      {actionFeedback && (
        <div
          role="status"
          className={`rounded-card border px-4 py-3 text-sm ${
            actionFeedback.type === 'success'
              ? 'border-accent-teal/40 bg-surface-teal text-accent-teal'
              : 'border-accent-pink/40 bg-surface-pink text-accent-pink'
          }`}
        >
          {actionFeedback.message}
        </div>
      )}

      {/* The decision forms sit directly under the bar that offered them. */}
      {jobPosting.canBeApproved && showApprovalForm && (
        <div className="rounded-card border border-border bg-card p-5 shadow-sm">
          <h2 className={`${cardTitle} mb-2`}>Approve job posting</h2>
          <label htmlFor="workflow-approval-notes" className="form-label">Approval notes (optional)</label>
          <textarea
            id="workflow-approval-notes"
            value={approvalNotes}
            onChange={(e) => setApprovalNotes(e.target.value)}
            placeholder="Anything the record should carry about this approval…"
            className="form-input w-full"
            rows={3}
          />
          <div className="mt-3 flex justify-end gap-2.5">
            <button type="button" onClick={() => setShowApprovalForm(false)} className={btnGhost}>Cancel</button>
            <button
              type="button"
              onClick={() => setPendingApproval(true)}
              disabled={loading === 'approve'}
              className={btnGold}
            >
              {loading === 'approve' ? 'Approving…' : 'Confirm Approval'}
            </button>
          </div>
        </div>
      )}

      {jobPosting.canBeRejected && showRejectionForm && (
        <div className="rounded-card border border-border border-l-4 border-l-accent-pink bg-card p-5 shadow-sm">
          <h2 className={`${cardTitle} mb-2`}>Reject job posting</h2>
          <label htmlFor="workflow-rejection-reason" className="form-label">Reason for rejection</label>
          <textarea
            id="workflow-rejection-reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Please provide a reason for rejection…"
            className="form-input w-full"
            rows={3}
            required
          />
          <div className="mt-3 flex justify-end gap-2.5">
            <button type="button" onClick={() => setShowRejectionForm(false)} className={btnGhost}>Cancel</button>
            <button
              type="button"
              onClick={() => setPendingRejection(true)}
              disabled={loading === 'reject' || !rejectionReason.trim()}
              className={btnDanger}
            >
              {loading === 'reject' ? 'Rejecting…' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      )}

      {jobPosting.canBePublished && showPublishForm && (
        <div className="rounded-card border border-border bg-card p-5 shadow-sm">
          <h2 className={`${cardTitle} mb-1`}>Publish job posting</h2>
          <p className="mb-3 text-[0.8125rem] text-muted-foreground">Choose who can see and apply to this vacancy.</p>
          <fieldset className="space-y-2 border-0 p-0 m-0">
            <legend className="sr-only">Publishing audience</legend>
            {([
              ['both', 'Internal & External applicants'],
              ['internal', 'Internal applicants only'],
              ['external', 'External applicants only'],
            ] as const).map(([value, label]) => (
              <div key={value} className="flex items-center gap-2">
                <input
                  type="radio"
                  id={`publish-audience-${value}`}
                  name="publish-audience"
                  className="accent-primary"
                  checked={publishAudience === value}
                  onChange={() => setPublishAudience(value)}
                />
                <label htmlFor={`publish-audience-${value}`} className="text-sm text-foreground">{label}</label>
              </div>
            ))}
          </fieldset>
          <div className="mt-3 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => { setShowPublishForm(false); setPublishAudience('both'); }}
              className={btnGhost}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setPendingAction('publish')}
              disabled={loading === 'publish'}
              className={btnGold}
            >
              {loading === 'publish' ? 'Publishing…' : 'Confirm Publish'}
            </button>
          </div>
        </div>
      )}

      {/* 3 — The five stages, horizontally, with dwell time under each. */}
      <section
        aria-label="Workflow progress"
        data-testid="stage-rail"
        className="rounded-card border border-border bg-card shadow-sm"
      >
        <ol className="grid grid-cols-1 gap-4 px-5 pt-5 pb-4 min-[900px]:grid-cols-5 min-[900px]:gap-0 m-0 list-none">
          {STAGES.map((stage, index) => {
            const state = stageState(index);
            const who = stageWho(index);
            const days = stageDays[index];
            const width = days !== null && longestStage > 0 ? Math.round((days / longestStage) * 100) : 0;

            const dot =
              state === 'done' ? 'bg-accent-teal border-accent-teal text-white'
                : state === 'stopped' ? 'bg-accent-pink border-accent-pink text-white'
                  : state === 'current' ? 'bg-cta border-cta text-cta-foreground ring-[5px] ring-cta/25'
                    : 'bg-card border-border text-muted-foreground/70';
            const glyph =
              state === 'done' ? '✓'
                : state === 'stopped' ? '✕'
                  : String(index + 1);
            const fill =
              state === 'stopped' ? 'bg-accent-pink'
                : state === 'current' ? 'bg-cta'
                  : 'bg-accent-teal';

            return (
              <li key={stage.key} className="relative min-[900px]:pr-4 min-[900px]:last:pr-0">
                {/* Connector to the next stage; hidden when the rail stacks. */}
                {index < STAGES.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={`hidden min-[900px]:block absolute left-[23px] right-1.5 top-3 h-0.5 ${state === 'done' ? 'bg-accent-teal' : 'bg-border'}`}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`relative z-10 grid h-[26px] w-[26px] place-items-center rounded-full border-2 text-[0.6875rem] font-extrabold ${dot}`}
                >
                  {glyph}
                </span>
                <p className={`mt-2.5 mb-0 text-[0.8125rem] font-extrabold tracking-tight ${state === 'todo' ? 'text-muted-foreground/70' : 'text-foreground'}`}>
                  {stageName(index)}
                </p>
                <p className="mt-0.5 mb-0 text-[0.6875rem] leading-snug text-muted-foreground">
                  {who.actor && <><b className="font-bold text-foreground">{who.actor}</b><br /></>}
                  {who.detail}
                </p>
                <div aria-hidden="true" className="mt-2.5 h-1 overflow-hidden rounded-full bg-border">
                  <span className={`block h-full rounded-full ${fill}`} style={{ width: `${width}%` }} />
                </div>
                <p className={`mt-1 mb-0 text-[0.625rem] font-bold tabular-nums ${state === 'current' ? 'text-accent-gold' : 'text-muted-foreground'}`}>
                  {days === null ? '—' : days === 0 ? 'Under a day here' : `${days} day${days === 1 ? '' : 's'} here`}
                </p>
              </li>
            );
          })}
        </ol>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-b-card border-t border-border bg-muted px-5 py-3 text-[0.6875rem] text-muted-foreground">
          <span><span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent-teal" />Complete</span>
          <span><span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-cta" />Where it is now</span>
          {isStopped && (
            <span><span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-accent-pink" />Stopped here</span>
          )}
          <span><span aria-hidden="true" className="mr-1.5 inline-block h-2 w-2 rounded-full bg-border" />Not reached</span>
          <span className="sm:ml-auto">Bar length shows time spent in each stage.</span>
        </div>
      </section>

      {/* 4 — Terms and verification on the left, the audit trail on the right. */}
      <div className="grid grid-cols-1 items-start gap-3.5 min-[900px]:grid-cols-[1.75fr_1fr]">
        <div className="flex flex-col gap-3.5">
          <section aria-label="Posting terms" className="rounded-card border border-border bg-card shadow-sm">
            <div className={cardHeader}>
              <h2 className={cardTitle}>What is being advertised</h2>
              <span className={cardHint}>{termsHint}</span>
            </div>
            <dl className="m-0 grid grid-cols-1 sm:grid-cols-2">
              {terms.map((term, i) => (
                <div
                  key={term.key}
                  className={`px-5 py-3.5 border-border ${i % 2 === 0 ? 'sm:border-r' : ''} ${i < terms.length - 2 ? 'border-b' : 'border-b sm:border-b-0'}`}
                >
                  <dt className={keyLabel}>{term.key}</dt>
                  <dd className={`m-0 mt-0.5 text-[0.9375rem] tracking-tight ${term.value ? 'font-bold text-foreground' : 'font-semibold text-muted-foreground/80'}`}>
                    {term.value || 'Not specified'}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {status === 'REJECTED' && jobPosting.rejectionReason && (
            <section aria-label="Why it was rejected" className="rounded-card border border-border border-l-4 border-l-accent-pink bg-card shadow-sm">
              <div className={cardHeader}>
                <h2 className={cardTitle}>Why it was rejected</h2>
                <span className={cardHint}>Recorded at approval</span>
              </div>
              <div className="px-5 py-4">
                <p className="m-0 text-[0.9375rem] leading-relaxed text-foreground">{jobPosting.rejectionReason}</p>
              </div>
            </section>
          )}

          <section aria-label="Verification required before hire" className="rounded-card border border-border bg-card shadow-sm">
            <div className={cardHeader}>
              <h2 className={cardTitle}>Verification required before hire</h2>
              <span className={cardHint}>Set on this posting</span>
            </div>
            <div className="px-5 py-4">
              {requiredChecks.length > 0 ? (
                <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
                  {requiredChecks.map((code) => (
                    <li key={code} className="flex items-center gap-2.5 text-[0.8125rem] font-semibold text-foreground">
                      <span aria-hidden="true" className="grid h-[17px] w-[17px] flex-none place-items-center rounded-[5px] bg-surface-teal text-[0.625rem] font-extrabold text-accent-teal">
                        &#10003;
                      </span>
                      {humaniseCheck(code)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[0.8125rem] text-muted-foreground">
                  No pre-hire verification has been set on this posting.
                </p>
              )}
              {requiredChecks.length > 0 && jobPosting.enforceCheckCompletion && (
                <p className="mt-3.5 mb-0 rounded-control border border-cta/40 bg-surface-gold px-3 py-2.5 text-xs leading-relaxed text-foreground">
                  <b className="font-extrabold">Progression is blocked</b> past Background Check until every one of
                  these is completed and clear.
                </p>
              )}
            </div>
          </section>
        </div>

        <section aria-label="Audit trail" className="rounded-card border border-border bg-card shadow-sm">
          <div className={cardHeader}>
            <h2 className={cardTitle}>Audit trail</h2>
            <span className={cardHint}>{auditTrail.length} {auditTrail.length === 1 ? 'entry' : 'entries'}</span>
          </div>
          <ol className="m-0 list-none px-5 pb-4 pt-1.5">
            {auditTrail.map((entry, index) => (
              <li key={entry.id} className="relative py-2.5 pl-[26px]">
                {index < auditTrail.length - 1 && (
                  <span aria-hidden="true" className="absolute left-[5px] top-[19px] -bottom-2.5 w-0.5 bg-border" />
                )}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-[15px] h-3 w-3 rounded-full border-2 ${
                    entry.tone === 'bad' ? 'border-accent-pink bg-accent-pink'
                      : entry.tone === 'now' ? 'border-cta bg-cta'
                        : 'border-accent-teal bg-accent-teal'
                  }`}
                />
                <p className="m-0 text-[0.8125rem] font-extrabold tracking-tight text-foreground">{entry.title}</p>
                {entry.meta && <p className="m-0 mt-px text-[0.6875rem] text-muted-foreground">{entry.meta}</p>}
                {entry.note && (
                  <p className={`mt-1.5 mb-0 rounded-control border px-2.5 py-2 text-xs leading-relaxed ${
                    entry.tone === 'bad'
                      ? 'border-accent-pink/30 bg-surface-pink text-foreground'
                      : 'border-border bg-muted text-foreground'
                  }`}>
                    {entry.note}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* 5 — Reach. Only once the posting has actually been advertised. */}
      {isAdvertised && (
        <section aria-label="Reach since publishing" data-testid="reach-strip" className="rounded-card border border-border bg-card shadow-sm">
          <div className={cardHeader}>
            <h2 className={cardTitle}>Reach since publishing</h2>
            <span className={cardHint}>
              {jobPosting.daysFromPublication > 0 ? `Over ${jobPosting.daysFromPublication} days` : 'Published today'}
            </span>
          </div>
          <dl className="m-0 grid grid-cols-1 sm:grid-cols-3">
            <div className="border-b border-border px-[18px] py-4 sm:border-b-0 sm:border-r">
              <dt className={keyLabel}>Views</dt>
              <dd className="m-0 mt-0.5 text-2xl font-extrabold leading-tight tracking-tight tabular-nums text-foreground">
                {jobPosting.viewsCount.toLocaleString('en-ZA')}
              </dd>
              <p className="m-0 text-[0.6875rem] text-muted-foreground">{viewsPerDay} a day</p>
            </div>
            <div className="border-b border-border px-[18px] py-4 sm:border-b-0 sm:border-r">
              <dt className={keyLabel}>Applications</dt>
              <dd className="m-0 mt-0.5 text-2xl font-extrabold leading-tight tracking-tight tabular-nums text-foreground">
                {jobPosting.applicationsCount.toLocaleString('en-ZA')}
              </dd>
              <p className="m-0 text-[0.6875rem] text-muted-foreground">{applyRate}</p>
            </div>
            <div className="px-[18px] py-4">
              <dt className={keyLabel}>Days live</dt>
              <dd className="m-0 mt-0.5 text-2xl font-extrabold leading-tight tracking-tight tabular-nums text-foreground">
                {jobPosting.daysFromPublication}
              </dd>
              <p className="m-0 text-[0.6875rem] text-muted-foreground">
                {status === 'PUBLISHED' ? 'Still accepting applications' : 'No longer advertised'}
              </p>
            </div>
          </dl>
        </section>
      )}

      <ConfirmDialog
        open={pendingAction !== null}
        title={`${(pendingAction || '').charAt(0).toUpperCase() + (pendingAction || '').slice(1)} Job Posting`}
        message={
          pendingAction === 'publish'
            ? publishAudience === 'internal'
              ? 'This will make the job posting visible to internal applicants only. Proceed?'
              : publishAudience === 'external'
                ? 'This will make the job posting visible to external applicants only. Proceed?'
                : 'This will make the job posting visible to internal and external applicants. Proceed?'
            : pendingAction === 'unpublish'
              ? 'This will remove the job posting from public view. Proceed?'
              : 'This will close the job posting and stop accepting applications. Proceed?'
        }
        confirmLabel={pendingAction === 'publish' ? 'Publish' : pendingAction === 'unpublish' ? 'Unpublish' : 'Close'}
        variant={pendingAction === 'close' ? 'warning' : 'default'}
        onConfirm={() => { const action = pendingAction!; setPendingAction(null); handleWorkflowAction(action); }}
        onCancel={() => setPendingAction(null)}
      />

      <ConfirmDialog
        open={pendingApproval}
        title="Approve Job Posting"
        message="Are you sure you want to approve this job posting? It will become eligible for publishing."
        confirmLabel="Approve"
        variant="default"
        onConfirm={() => { setPendingApproval(false); handleWorkflowAction('approve', approvalNotes); }}
        onCancel={() => setPendingApproval(false)}
      />

      <ConfirmDialog
        open={pendingRejection}
        title="Reject Job Posting"
        message="Are you sure you want to reject this job posting? The submitter will be notified."
        confirmLabel="Reject"
        variant="danger"
        onConfirm={() => { setPendingRejection(false); handleWorkflowAction('reject', rejectionReason); }}
        onCancel={() => setPendingRejection(false)}
      />
    </div>
  );
}
