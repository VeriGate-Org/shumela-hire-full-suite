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
  const { isAuthenticated, isLoading } = useAuth();
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
      <PageWrapper title="Application" subtitle="Loading..." actions={headerActions}>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-gold" />
        </div>
      </PageWrapper>
    );
  }

  if (error || !application) {
    return (
      <PageWrapper title="Application Not Found" actions={headerActions}>
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
    <PageWrapper
      title={application.applicantName || 'Application'}
      subtitle={[application.jobTitle, application.department].filter(Boolean).join(' · ')}
      actions={headerActions}
    >
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
          <div
            aria-hidden
            className="w-12 h-12 rounded-full bg-band-accent/20 text-band-accent grid place-items-center text-sm font-extrabold tracking-tight"
          >
            {initialsOf(application.applicantName)}
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
          <div className="lg:col-span-2 enterprise-card overflow-hidden">
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
                    {/* Who wrote it is not recorded — the notes are free text with no author, and
                        the audit trail that would carry one names the candidate as the actor. */}
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
