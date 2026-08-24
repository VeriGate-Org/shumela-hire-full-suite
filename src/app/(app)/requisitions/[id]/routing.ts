import { RequisitionData, RequisitionStatus } from '@/types/workflow';
import { ApprovalStep } from '@/components/ApprovalTimeline';
import { Stage } from '@/components/record/StageRail';

/** Shape returned by GET /api/requisitions/{id}/routing. */
export interface RequisitionRouting {
  chain: string[];
  rationale: string;
  escalated: boolean;
  measuredValue?: number | null;
  currentStage?: string | null;
}

/**
 * Is this payload usable as routing?
 *
 * <p>Checked at the fetch boundary rather than trusted at render time. A routing response without
 * a chain — an older deployment, a partial rollout, a proxy answering the path with something else
 * — would otherwise reach the strip and throw on `chain.map`, taking down a page whose actual
 * subject loaded perfectly. The explanation is worth having; it is not worth the record.
 */
export function isRouting(payload: unknown): payload is RequisitionRouting {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<RequisitionRouting>;
  return (
    Array.isArray(candidate.chain) &&
    candidate.chain.length > 0 &&
    candidate.chain.every((stage) => typeof stage === 'string') &&
    typeof candidate.rationale === 'string' &&
    candidate.rationale.length > 0
  );
}

/** Stage names as a person would say them. The API speaks in enum values. */
const STAGE_LABELS: Record<string, string> = {
  HR_MANAGER: 'HR Manager',
  EXECUTIVE: 'Executive',
};

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

/** Whole days between two instants, floored — never negative. */
export function daysBetween(from?: string | Date | null, to: Date = new Date()): number | undefined {
  if (!from) return undefined;
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return undefined;
  return Math.max(0, Math.floor((to.getTime() - start) / 86_400_000));
}

/**
 * Build the rail from the computed chain and what has actually happened.
 *
 * <p>The chain length is not fixed: a requisition inside the HR delegation has one approval stage,
 * one above the threshold has two. Rendering a fixed ladder is how a two-stage chain ends up
 * looking like it stalled halfway.
 *
 * <p>Dwell is only shown where it can be derived honestly. The record carries `createdAt` and
 * `updatedAt` but no per-transition timestamps, so a completed stage's duration is only known when
 * the approval history supplies its timestamp. Where it cannot be worked out, the bar is omitted
 * rather than estimated.
 */
export function buildStages(
  requisition: RequisitionData,
  routing: RequisitionRouting | null,
  steps: ApprovalStep[],
  now: Date = new Date()
): Stage[] {
  const rejected = requisition.status === RequisitionStatus.REJECTED;
  const approved = requisition.status === RequisitionStatus.APPROVED;

  const raisedAt = requisition.createdAt ? new Date(requisition.createdAt) : undefined;
  const firstDecision = steps.find((step) => step.status !== 'pending')?.timestamp;

  const raised: Stage = {
    name: 'Raised',
    state: 'done',
    when: raisedAt ? formatDate(raisedAt) : undefined,
    days: firstDecision ? daysBetween(raisedAt, new Date(firstDecision)) : daysBetween(raisedAt, now),
  };

  // No routing means the endpoint was unavailable — fall back to what the approval history shows
  // rather than inventing a chain.
  const chain = routing?.chain ?? steps.map((step) => step.role);

  const approvalStages: Stage[] = chain.map((stageName, index) => {
    const step = steps.find((candidate) => candidate.role === stageName);
    const label = stageLabel(stageName);

    if (step?.status === 'rejected') {
      return {
        name: label,
        state: 'stopped',
        actor: step.approverName,
        when: step.timestamp ? formatDate(new Date(step.timestamp)) : undefined,
      };
    }
    if (step?.status === 'approved') {
      const previous = index === 0 ? firstDecisionBefore(steps, step) ?? raisedAt : undefined;
      return {
        name: label,
        state: 'done',
        actor: step.approverName,
        when: step.timestamp ? formatDate(new Date(step.timestamp)) : undefined,
        days: previous && step.timestamp ? daysBetween(previous, new Date(step.timestamp)) : undefined,
      };
    }
    if (stageName === routing?.currentStage) {
      return {
        name: label,
        state: 'current',
        actor: 'Awaiting a decision',
        when: requisition.updatedAt ? `since ${formatDate(new Date(requisition.updatedAt))}` : undefined,
        days: daysBetween(requisition.updatedAt, now),
      };
    }
    return { name: label, state: rejected ? 'todo' : 'todo', actor: rejected ? 'Not reached' : undefined };
  });

  const outcome: Stage = rejected
    ? { name: 'Rejected', state: 'stopped', actor: 'Not advertised' }
    : {
        name: 'Approved',
        state: approved ? 'done' : 'todo',
        actor: approved ? 'Clears for advertising' : 'Clears for advertising',
      };

  return [raised, ...approvalStages, outcome];
}

function firstDecisionBefore(steps: ApprovalStep[], step: ApprovalStep): Date | undefined {
  const index = steps.indexOf(step);
  for (let i = index - 1; i >= 0; i -= 1) {
    if (steps[i].timestamp) return new Date(steps[i].timestamp as string);
  }
  return undefined;
}

export function formatDate(value: Date): string {
  return value.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** The ask and its tone, given where the requisition is. */
export function decisionFor(
  requisition: RequisitionData,
  routing: RequisitionRouting | null,
  waitingDays?: number
): { ask: string; tone: 'owed' | 'settled' | 'stopped' } {
  switch (requisition.status) {
    case RequisitionStatus.DRAFT:
      return { ask: 'This requisition has not been submitted yet.', tone: 'owed' };
    case RequisitionStatus.APPROVED:
      return { ask: 'Approved — cleared for advertising.', tone: 'settled' };
    case RequisitionStatus.REJECTED:
      return { ask: 'Rejected — not cleared for advertising.', tone: 'stopped' };
    default: {
      const stage = routing?.currentStage ? stageLabel(routing.currentStage) : 'approval';
      const waited =
        typeof waitingDays === 'number' && waitingDays > 0
          ? ` It has been waiting ${waitingDays} ${waitingDays === 1 ? 'day' : 'days'}.`
          : '';
      return { ask: `This requisition is waiting on ${stage} approval.${waited}`, tone: 'owed' };
    }
  }
}
