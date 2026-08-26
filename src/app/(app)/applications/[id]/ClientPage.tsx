'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import VerificationReportDownload from '@/components/VerificationReportDownload';
import ShortlistButton from '@/components/ShortlistButton';
import ScreeningNotesPanel from '@/components/ScreeningNotesPanel';
import InterviewSummaryPanel from '@/components/InterviewSummaryPanel';
import OfferSummaryPanel from '@/components/OfferSummaryPanel';
import AiCandidatePanel from '@/components/ai/AiCandidatePanel';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, {
  PrimaryAction,
  SecondaryAction,
  DestructiveAction,
} from '@/components/record/DecisionBar';
import StageRail from '@/components/record/StageRail';
import TermsGrid from '@/components/record/TermsGrid';
import { getEnumLabel } from '@/utils/enumLabels';
import { useToast } from '@/components/Toast';
import {
  ApplicationRecord,
  RecordAction,
  actionsFor,
  buildRail,
  decisionFor,
  hasEnded,
  isReversible,
  narrative,
  narrativeFilled,
  stagePosition,
} from './record';
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface DocumentInfo {
  id: string;
  filename: string;
  url: string;
  type: string;
  fileSizeFormatted?: string;
  uploadedAt?: string;
}

interface ApplicationDetail extends ApplicationRecord {
  applicantId?: string;
  applicantEmail?: string;
  jobAdId?: string;
  statusDisplayName?: string;
  withdrawnAt?: string;
  applicationDocuments?: DocumentInfo[];
  canBeWithdrawn?: boolean;
}

function initialsOf(name?: string): string {
  if (!name) return '—';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ApplicationDetailPage() {
  // Static export: this page is pre-rendered once at build time with a placeholder id ("_" — see
  // generateStaticParams in page.tsx and the CloudFront "/applications/*" rewrite). useParams()
  // would read that build-time placeholder on a hard load, so the real id comes off the URL.
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const applicationId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length >= 2 ? parts[1] : '';
  }, [pathname]);

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<RecordAction | null>(null);
  const [working, setWorking] = useState(false);
  const [offer, setOffer] = useState<unknown>(null);
  /*
   * Offers exclude INTERVIEWER on the server, and an interviewer can now open a shared candidate
   * link. OfferSummaryPanel given a null offer says "no offer has been prepared", which would be a
   * false statement to someone simply not allowed to know. The section is withheld instead.
   */
  const OFFER_ROLES = ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER'];
  const maySeeOffers = user?.role != null && OFFER_ROLES.includes(user.role);
  const [timeline, setTimeline] = useState<Array<{
    fromStage?: string; toStage?: string; createdAt?: string; performedBy?: string; reason?: string;
  }>>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const fetchApplication = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiFetch(`/api/applications/${applicationId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Application not found');
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      setApplication(await response.json());
    } catch (err) {
      console.error('Error loading application:', err);
      setError(err instanceof Error ? err.message : 'Failed to load application');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (!isAuthenticated || !applicationId) return;
    fetchApplication();
  }, [isAuthenticated, applicationId, fetchApplication]);

  // The offer and the transition history live behind their own endpoints. Both were reachable only
  // from the pipeline board's modal, which is why that modal was the real candidate record and this
  // page — the one with a URL — was the poorest of the three.
  useEffect(() => {
    if (!isAuthenticated || !applicationId) return;
    let cancelled = false;

    if (maySeeOffers) apiFetch(`/api/offers/applications/${applicationId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setOffer(Array.isArray(data) ? data[0] ?? null : data);
      })
      .catch(() => {});

    apiFetch(`/api/pipeline/applications/${applicationId}/timeline`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data) ? data : data?.content ?? [];
        setTimeline(
          rows.map((t: Record<string, string>) => ({
            fromStage: t.fromStage,
            toStage: t.toStage,
            createdAt: t.createdAt || t.transitionDate,
            // Prefer the name. performedBy holds a user id, and putting that on screen is how a
            // UUID ends up where a person's name belongs.
            performedBy: t.performedByName || undefined,
            reason: t.reason || t.notes || undefined,
          })),
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, applicationId]);

  /**
   * Copy this record's address.
   *
   * <p>The reason this page exists rather than a modal: a hiring manager has to be able to send a
   * candidate to a panel or an approver, and a modal cannot be sent.
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy the link — your browser refused clipboard access', 'error');
    }
  };

  /**
   * Move the application to another status.
   *
   * <p>The page could previously only reject. The endpoint has always been generic; nothing but
   * the buttons was missing, and the transitions offered are the ones the API says are legal.
   */
  const runAction = async (action: RecordAction) => {
    if (!application) return;
    setWorking(true);
    try {
      const response = await apiFetch(
        `/api/applications/${application.id}/status?status=${action.status}`,
        { method: 'PUT' },
      );
      if (!response.ok) throw new Error(await refusalMessage(response));
      toast(`${action.label} — done`, 'success');
      setPendingAction(null);
      fetchApplication();
    } catch (err) {
      // The API's own words. A refusal here is a rule the user needs to read, not a generic failure.
      toast(err instanceof Error ? err.message : 'Could not update this application', 'error');
    } finally {
      setWorking(false);
    }
  };

  if (!isAuthenticated) return null;

  const headerActions = (
    <div className="flex items-center gap-2">
      {application && (
        <ShortlistButton applicationId={application.id} candidateName={application.applicantName} />
      )}
      <Link href="/applications">
        <button className="inline-flex items-center px-3 py-2 border border-border rounded-full text-sm text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
          Back
        </button>
      </Link>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
      <IdentityBand
        eyebrow="Application record"
        title="Application"
        subtitle="Loading..."
        actions={headerActions}
      />

        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !application) {
    return (
      <PageWrapper>
      <IdentityBand
        eyebrow="Application record"
        title="Application Not Found"
        actions={headerActions}
      />

        <EmptyState
          icon={ExclamationTriangleIcon}
          title="Application Not Found"
          description={
            error || "The application you're looking for doesn't exist or you don't have access to it."
          }
          action={{ label: 'Back to Applications', onClick: () => router.push('/applications') }}
        />
      </PageWrapper>
    );
  }

  const position = stagePosition(application.status);
  const decision = decisionFor(application);
  const actions = actionsFor(application);
  const entries = narrative(application);
  const filled = narrativeFilled(entries);
  const documents = application.applicationDocuments ?? [];
  const ended = hasEnded(application.status);

  return (
    <PageWrapper>
<div className="space-y-4">
        <IdentityBand
          eyebrow="Application record"
          title={application.applicantName || 'Unknown candidate'}
          subtitle={
            <>
              {[application.jobTitle, application.department].filter(Boolean).join(' · ')}
              {application.applicationSource && <> · via {application.applicationSource}</>}
            </>
          }
          figures={[
            {
              label: 'Stage',
              // "Stopped" rather than a position: a rejected candidate is not at stage two of
              // five, and a progress figure would imply they are still moving.
              value: position ? `${position.index} of ${position.total}` : 'Stopped',
              tone: ended ? ('critical' as const) : undefined,
            },
            ...(typeof application.daysFromSubmission === 'number'
              ? [
                  {
                    label: 'In process',
                    value: `${application.daysFromSubmission} ${
                      application.daysFromSubmission === 1 ? 'day' : 'days'
                    }`,
                    tone:
                      !ended && application.daysFromSubmission >= 14
                        ? ('warning' as const)
                        : undefined,
                  },
                ]
              : []),
          ]}
        >
          <div className="mt-4 flex items-center gap-3">
            <div
              aria-hidden
              className="w-12 h-12 rounded-full bg-band-accent/20 text-band-accent grid place-items-center text-sm font-extrabold tracking-tight"
            >
              {initialsOf(application.applicantName)}
            </div>
            {/* The address is shown, not just copyable. A hiring manager sending this to a panel
                should be able to see what they are about to send. */}
            <div className="flex min-w-0 items-center gap-2 rounded-control border border-band-line bg-band-fill px-3 py-2">
              <span className="truncate font-mono text-xs text-band-strong">
                {typeof window === 'undefined' ? '' : window.location.host}/applications/{application.id.slice(0, 8)}…
              </span>
              <button
                type="button"
                onClick={copyLink}
                className="whitespace-nowrap text-[0.6875rem] font-extrabold uppercase tracking-[0.06em] text-band-accent hover:underline"
              >
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </IdentityBand>

        <DecisionBar ask={decision.ask} why={decision.why} tone={decision.tone}>
          {actions.map((action) =>
            action.intent === 'primary' ? (
              <PrimaryAction
                key={action.status}
                onClick={() => runAction(action)}
                disabled={working}
              >
                {action.label}
              </PrimaryAction>
            ) : action.intent === 'destructive' ? (
              <DestructiveAction
                key={action.status}
                onClick={() => setPendingAction(action)}
                disabled={working}
              >
                {action.label}
              </DestructiveAction>
            ) : (
              <SecondaryAction
                key={action.status}
                onClick={() => runAction(action)}
                disabled={working}
              >
                {action.label}
              </SecondaryAction>
            ),
          )}
        </DecisionBar>

        <StageRail
          stages={buildRail(application)}
          footnote={
            <>
              Position only. <b className="font-bold text-foreground">Time spent at each stage is
              not shown</b> — an application records its submission date and nothing per transition,
              so any per-stage duration would be an estimate presented as a measurement.
            </>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
          <div className="enterprise-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-baseline justify-between gap-3">
              <h2 className="text-[0.8125rem] font-extrabold tracking-tight">The record so far</h2>
              <span className="text-xs text-muted-foreground">
                {filled} of {entries.length} stages have produced notes
              </span>
            </div>
            <div className="divide-y divide-border">
              {entries.map((entry) => (
                <div key={entry.stage} className="px-5 py-4">
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-[0.5625rem] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
                      {entry.stage}
                    </span>
                    {/* These stage narratives carry no author — they are free text on the
                        application. Notes added below are attributed, so over time the unattributed
                        ones age out of the record rather than being retrofitted. */}
                    <span className="text-xs text-muted-foreground">{entry.kind}</span>
                  </div>
                  {entry.body ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap">{entry.body}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">{entry.absent}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

            {/* Writable, and each entry carries its author and time. The read-only summary above is
                the narrative the stages produced; this is where a view gets recorded. */}
            <div className="enterprise-card p-5">
              <ScreeningNotesPanel
                applicationId={application.id}
                notes={application.screeningNotes}
                onSaved={(allNotes) =>
                  setApplication((prev) => (prev ? { ...prev, screeningNotes: allNotes } : prev))
                }
              />
            </div>

            <div className="enterprise-card p-5">
              <InterviewSummaryPanel
                applicationId={application.id}
                candidateName={application.applicantName || 'this candidate'}
                jobTitle={application.jobTitle || ''}
                // The record is where an interview is arranged from — it is the surface that knows
                // the candidate, and the one a panel member can be sent a link to.
                onSchedule={() =>
                  router.push(
                    `/interviews/schedule?applicationId=${application.id}` +
                      `&returnTo=/applications/${application.id}`,
                  )
                }
              />
            </div>

            {maySeeOffers && (
              <div className="enterprise-card p-5">
                <OfferSummaryPanel
                  offer={offer}
                  applicationId={application.id}
                  readOnly={ended}
                  onAction={fetchApplication}
                />
              </div>
            )}

            <AiCandidatePanel
              applicationId={application.id}
              candidateName={application.applicantName || 'this candidate'}
              jobTitle={application.jobTitle || ''}
            />
          </div>

          <div className="space-y-4">
            <div className="enterprise-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Assessment</h2>
              </div>
              <div className="p-5">
                <TermsGrid
                  terms={[
                    {
                      label: 'Rating',
                      // A rating out of five, shown as a rating out of five. The list used to
                      // render this as a percentage with a progress bar.
                      value:
                        typeof application.rating === 'number' && application.rating > 0
                          ? `${Math.min(5, Math.round(application.rating))} of 5`
                          : undefined,
                      absent: 'Not rated',
                    },
                    {
                      label: 'Source',
                      value: application.applicationSource,
                      absent: 'Not recorded',
                    },
                    {
                      label: 'Applied',
                      value: formatDate(application.submittedAt),
                      absent: 'Not recorded',
                    },
                  ]}
                />
              </div>
            </div>

            <div className="enterprise-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-baseline justify-between gap-3">
                <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Documents</h2>
                <span className="text-xs text-muted-foreground">
                  {documents.length} attached
                </span>
              </div>
              {documents.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No documents attached to this application.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center min-w-0">
                        <DocumentTextIcon className="w-5 h-5 text-muted-foreground mr-3 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {doc.filename}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getEnumLabel('documentType', doc.type)}
                            {doc.fileSizeFormatted ? ` · ${doc.fileSizeFormatted}` : ''}
                          </p>
                        </div>
                      </div>
                      <ArrowDownTrayIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="enterprise-card p-5">
              <VerificationReportDownload applicationId={application.id} />
            </div>

            {/* History, deliberately secondary to the decisions on the left. */}
            <div className="enterprise-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-baseline justify-between gap-3">
                <h2 className="text-[0.8125rem] font-extrabold tracking-tight">Activity</h2>
                {timeline.length > 0 && (
                  <span className="text-xs text-muted-foreground">{timeline.length} recorded</span>
                )}
              </div>
              <div className="p-5">
                {timeline.length === 0 ? (
                  // "Nothing recorded" and "we could not load it" are different facts, but the
                  // honest reading of an empty list here is that this record predates the
                  // transition log — which is common, so it says that rather than nothing.
                  <p className="text-sm text-muted-foreground">
                    No stage changes are recorded against this application.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {timeline.map((event, index) => (
                      <li key={index} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-1.5 h-2 w-2 flex-none rounded-full bg-border"
                        />
                        <div className="min-w-0">
                          <p className="text-xs text-foreground">
                            <b className="font-extrabold">
                              {event.fromStage
                                ? `${getEnumLabel('pipelineStage', event.fromStage)} → ${getEnumLabel('pipelineStage', event.toStage ?? '')}`
                                : getEnumLabel('pipelineStage', event.toStage ?? '')}
                            </b>
                            {event.performedBy && (
                              <span className="text-muted-foreground"> by {event.performedBy}</span>
                            )}
                          </p>
                          {event.reason && (
                            <p className="mt-0.5 text-xs text-muted-foreground">{event.reason}</p>
                          )}
                          {event.createdAt && (
                            <time className="mt-0.5 block text-[0.625rem] tabular-nums text-muted-foreground">
                              {formatDate(event.createdAt)}
                            </time>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? pendingAction.label : ''}
        message={
          pendingAction
            ? `${pendingAction.label} — ${application.applicantName || 'this candidate'}'s application. ${
                // The dialog used to promise this "can be reversed by changing the status again".
                // canTransitionTo returns false for every target from REJECTED, so it cannot.
                isReversible(pendingAction.status)
                  ? 'This can be changed again afterwards.'
                  : 'This is final — the status cannot be changed again afterwards.'
              }`
            : ''
        }
        confirmLabel={working ? 'Working…' : pendingAction?.label ?? 'Confirm'}
        variant="danger"
        onConfirm={() => pendingAction && runAction(pendingAction)}
        onCancel={() => setPendingAction(null)}
      />
    </PageWrapper>
  );
}
