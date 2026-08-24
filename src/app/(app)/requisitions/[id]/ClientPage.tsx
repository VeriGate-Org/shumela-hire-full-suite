'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import WorkflowActions from '@/components/WorkflowActions';
import AuditLogViewer from '@/components/AuditLogViewer';
import ErrorState from '@/components/ErrorState';
import { FormSkeleton } from '@/components/LoadingComponents';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar from '@/components/record/DecisionBar';
import RoutingStrip from '@/components/record/RoutingStrip';
import StageRail from '@/components/record/StageRail';
import TermsGrid from '@/components/record/TermsGrid';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { approvalTimelineService } from '@/services/approvalTimelineService';
import { ApprovalStep } from '@/components/ApprovalTimeline';
import { formatSalaryRange } from '@/utils/currency';
import { getEnumLabel } from '@/utils/enumLabels';
import { displayActor, shortRef } from '@/utils/identity';
import { RequisitionData, ApprovalRole, WorkflowAction, RequisitionStatus } from '@/types/workflow';
import { apiFetch } from '@/lib/api-fetch';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import {
  RequisitionRouting,
  buildStages,
  daysBetween,
  decisionFor,
  formatDate,
  isRouting,
  stageLabel,
} from './routing';

export default function RequisitionDetailPage() {
  // Static export: every /requisitions/<id> URL is served the same pre-rendered shell (built with
  // the placeholder id "_" — see the CloudFront "/requisitions/*" rewrite in
  // ShumelaHireFrontendStack.cs). useParams() would read that build-time placeholder on a hard
  // load, so the real id comes from the browser URL.
  const pathname = usePathname();
  const router = useRouter();
  const requisitionId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    return parts.length >= 2 ? parts[1] : '';
  }, [pathname]);
  const { user } = useAuth();
  const { toast } = useToast();

  const [requisition, setRequisition] = useState<RequisitionData | null>(null);
  const [routing, setRouting] = useState<RequisitionRouting | null>(null);
  const [timelineSteps, setTimelineSteps] = useState<ApprovalStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAudit, setShowAudit] = useState(false);

  const fetchRequisitionDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/api/requisitions/${requisitionId}`);
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Requisition not found' : 'Failed to fetch requisition details');
      }
      const data = await response.json();
      setRequisition(data);

      const steps = await approvalTimelineService.getApprovalTimelineForRequisition(requisitionId);
      setTimelineSteps(steps);

      // Routing is a separate call and a separate failure. If it is unavailable the page still
      // works — the rail falls back to what the approval history shows — but the explanation is
      // omitted rather than guessed, because recomposing it here would mean duplicating the
      // delegation threshold in the browser.
      try {
        const routingResponse = await apiFetch(`/api/requisitions/${requisitionId}/routing`);
        const payload = routingResponse.ok ? await routingResponse.json() : null;
        // Validate the shape here rather than trusting it at render time. An older deployment, a
        // partial rollout or a proxy that answers this path with something else would otherwise
        // reach the strip as a chain of undefined and take the whole page down with it — the
        // routing explanation is worth having, but never at the cost of the record itself.
        setRouting(isRouting(payload) ? payload : null);
      } catch {
        setRouting(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    if (requisitionId) fetchRequisitionDetails();
  }, [requisitionId, fetchRequisitionDetails]);

  // The requisition stores createdBy as a user id; its own approval history records the same
  // people by name alongside their id. Build the lookup from what the record already carries.
  const actorNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const entry of requisition?.approvalHistory ?? []) {
      const record = entry as unknown as Record<string, unknown>;
      const id = (record.approverId ?? record.actorUserId) as string | undefined;
      const name = (record.approverName ?? record.actorName) as string | undefined;
      if (id && name) names.set(id, name);
    }
    return names;
  }, [requisition]);

  const handleWorkflowAction = async (action: WorkflowAction, comment?: string) => {
    if (!requisition) return;
    try {
      const path =
        action === WorkflowAction.SUBMIT ? 'submit'
        : action === WorkflowAction.APPROVE ? 'approve'
        : action === WorkflowAction.REJECT ? 'reject'
        : null;
      if (!path) throw new Error(`Unknown action: ${action}`);

      // The approver and their role come from the token server-side; the previous `?role=` query
      // parameter and `userId` body field were both ignored by the controller.
      const response = await apiFetch(`/api/requisitions/${requisition.id}/${path}`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
      });

      if (response.ok) {
        await fetchRequisitionDetails();
        toast('Action completed successfully', 'success');
      } else {
        const result = await response.json().catch(() => null);
        toast(`Error: ${result?.message || 'Action failed'}`, 'error');
      }
    } catch (err) {
      console.error('Error performing workflow action:', err);
      toast('An error occurred while processing the action', 'error');
    }
  };

  if (loading) {
    return (
      <PageWrapper title="Requisition" subtitle="Loading…">
        <div className="space-y-6"><FormSkeleton /><FormSkeleton /></div>
      </PageWrapper>
    );
  }

  if (error || !requisition) {
    return (
      <PageWrapper title="Requisition" subtitle={error ?? 'Not found'}>
        <ErrorState
          title={error ?? 'Requisition not found'}
          message="Please try again or go back to the requisitions list."
          onRetry={fetchRequisitionDetails}
        />
      </PageWrapper>
    );
  }

  const stages = buildStages(requisition, routing, timelineSteps);
  const waitingDays = daysBetween(requisition.updatedAt);
  const inWorkflowDays = daysBetween(requisition.createdAt);
  const decision = decisionFor(requisition, routing, waitingDays);
  const isPending =
    requisition.status !== RequisitionStatus.APPROVED &&
    requisition.status !== RequisitionStatus.REJECTED &&
    requisition.status !== RequisitionStatus.DRAFT;

  const rejection = [...(requisition.approvalHistory ?? [])]
    .reverse()
    .find((entry) => (entry as unknown as Record<string, unknown>).action === 'REJECT');
  const rejectionComment = (rejection as unknown as Record<string, unknown> | undefined)?.comment as string | undefined;

  return (
    <PageWrapper title={requisition.jobTitle} subtitle={`Requisition ${shortRef('REQ', requisition.id)}`}>
      <button
        onClick={() => router.push('/requisitions')}
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to requisitions
      </button>

      <IdentityBand
        eyebrow="Requisition &amp; approval record"
        title={requisition.jobTitle}
        subtitle={
          <>
            {requisition.department} · <b className="font-bold text-band-strong">{shortRef('REQ', requisition.id)}</b>
            {' · raised by '}
            <b className="font-bold text-band-strong">
              {displayActor(requisition.createdBy, (id) => actorNames.get(id), 'Not recorded')}
            </b>
          </>
        }
        figures={[
          {
            label: 'Stage',
            value: routing?.currentStage
              ? `${routing.chain.indexOf(routing.currentStage) + 2} of ${routing.chain.length + 2}`
              : requisition.status === RequisitionStatus.REJECTED ? 'Stopped' : 'Complete',
          },
          { label: 'In workflow', value: inWorkflowDays === undefined ? '—' : `${inWorkflowDays} days` },
          ...(isPending && waitingDays !== undefined
            ? [{
                label: 'Waiting',
                value: `${waitingDays} days`,
                tone: (waitingDays >= 14 ? 'critical' : 'warning') as 'critical' | 'warning',
              }]
            : []),
        ]}
      />

      <DecisionBar
        ask={decision.ask}
        tone={decision.tone}
        why={
          requisition.status === RequisitionStatus.REJECTED && rejectionComment
            ? rejectionComment
            : routing?.escalated && isPending
              ? 'It escalated because of the band ceiling, not because anyone asked for a second opinion.'
              : undefined
        }
      >
        {user && (
          <WorkflowActions
            requisition={requisition}
            userRole={user.role as ApprovalRole}
            onAction={(action, comment) => handleWorkflowAction(action, comment)}
          />
        )}
      </DecisionBar>

      {routing && (
        <RoutingStrip
          rationale={routing.rationale}
          chain={routing.chain.map(stageLabel)}
          currentStage={routing.currentStage ? stageLabel(routing.currentStage) : null}
          escalated={routing.escalated}
          footnote={
            <>
              Routing is computed on the <b className="font-bold text-foreground">top of the advertised band</b> —
              the maximum exposure being authorised — not on the midpoint. The threshold is per-tenant
              configuration, not code.
            </>
          }
        />
      )}

      <StageRail
        stages={stages}
        footnote={
          <>
            Bar length is time spent at each stage.
            {routing?.chain.length === 1 && ' This band sits inside the HR delegation, so there is no executive stage.'}
          </>
        }
      />

      <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-[1.75fr_1fr] lg:items-start">
        <div className="flex flex-col gap-3.5">
          <section className="overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                What is being requested
              </h2>
              {isPending && (
                <span className="text-[0.6875rem] text-muted-foreground">Locked while awaiting approval</span>
              )}
            </div>
            <TermsGrid
              terms={[
                {
                  label: 'Employment type',
                  value: requisition.employmentType
                    ? getEnumLabel('employmentType', requisition.employmentType)
                    : undefined,
                },
                { label: 'Location', value: requisition.location },
                {
                  label: 'Salary band',
                  value:
                    requisition.salaryMin || requisition.salaryMax
                      ? formatSalaryRange(requisition.salaryMin, requisition.salaryMax)
                      : undefined,
                  absent: 'Not recorded — takes the full approval chain',
                  tone: routing?.escalated ? 'warning' : 'default',
                },
                { label: 'Department', value: requisition.department },
                {
                  label: 'Raised',
                  value: requisition.createdAt ? formatDate(new Date(requisition.createdAt)) : undefined,
                },
                {
                  label: 'Last updated',
                  value: requisition.updatedAt ? formatDate(new Date(requisition.updatedAt)) : undefined,
                },
              ]}
            />
          </section>

          <section className="overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]">
            <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">Motivation</h2>
              <span className="text-[0.6875rem] text-muted-foreground">As submitted</span>
            </div>
            <div className="px-5 py-4">
              {requisition.description ? (
                <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground">
                  {requisition.description}
                </p>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  No motivation was recorded when this requisition was raised.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-card border border-border bg-card shadow-[var(--shadow-sm)]">
          <div className="flex items-baseline justify-between gap-3 border-b border-border px-5 py-3.5">
            <h2 className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">Approval trail</h2>
            <span className="text-[0.6875rem] text-muted-foreground">
              {timelineSteps.length} {timelineSteps.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {timelineSteps.length === 0 ? (
            <p className="px-5 py-6 text-center text-sm text-muted-foreground">
              Nothing has happened to this requisition yet.
            </p>
          ) : (
            <ol className="px-5 py-2">
              {timelineSteps.map((step, index) => (
                <li key={`${step.role}-${index}`} className="relative py-3 pl-6">
                  <span
                    aria-hidden="true"
                    className={`absolute left-0 top-[18px] h-3 w-3 rounded-full border-2 ${
                      step.status === 'approved'
                        ? 'border-accent-teal bg-accent-teal'
                        : step.status === 'rejected'
                          ? 'border-error bg-error'
                          : 'border-cta bg-cta'
                    }`}
                  />
                  {index < timelineSteps.length - 1 && (
                    <span aria-hidden="true" className="absolute left-[5px] top-[30px] h-full w-0.5 bg-border" />
                  )}
                  <p className="text-[0.8125rem] font-extrabold tracking-[-0.01em] text-foreground">
                    {step.status === 'pending'
                      ? `Awaiting ${stageLabel(step.role)}`
                      : `${step.status === 'approved' ? 'Approved' : 'Rejected'} — ${stageLabel(step.role)}`}
                  </p>
                  <p className="mt-0.5 text-[0.6875rem] text-muted-foreground">
                    {step.approverName}
                    {step.timestamp && ` · ${formatDate(new Date(step.timestamp))}`}
                  </p>
                  {step.comment && (
                    <p
                      className={`mt-2 rounded-control border px-3 py-2 text-xs leading-relaxed ${
                        step.status === 'rejected'
                          ? 'border-error/30 bg-error-bg text-foreground'
                          : 'border-border bg-muted/40 text-foreground'
                      }`}
                    >
                      {step.comment}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}

          <div className="border-t border-border bg-muted/40 px-5 py-2.5">
            <button
              type="button"
              onClick={() => setShowAudit((open) => !open)}
              aria-expanded={showAudit}
              className="text-[0.6875rem] font-extrabold uppercase tracking-[0.08em] text-primary transition-colors hover:text-cta-hover"
            >
              {showAudit ? 'Hide full audit log' : 'Show full audit log'}
            </button>
          </div>
          {showAudit && (
            <div className="border-t border-border px-5 py-4">
              <AuditLogViewer requisitionId={requisitionId} />
            </div>
          )}
        </section>
      </div>

      <p className="mt-4 text-[0.6875rem] text-muted-foreground">
        <Link href="/requisitions" className="underline hover:text-primary">
          All requisitions
        </Link>
      </p>
    </PageWrapper>
  );
}
