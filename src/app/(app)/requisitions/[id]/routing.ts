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

/**
 * Stage names as a person would say them.
 *
 * <p>Must agree with `formatApprovalRole` in approvalTimelineService, because the two meet: the
 * routing endpoint speaks in enum values (`HR_MANAGER`) while the approval timeline has already
 * formatted the same stage into a label (`HR Manager`). Matching one against the other without
 * converting is how a completed stage silently fails to find its approver.
 */
const STAGE_LABELS: Record<string, string> = {
  HR_MANAGER: 'HR Manager',
  HR: 'HR Manager',
  EXECUTIVE: 'Executive',
  HIRING_MANAGER: 'Hiring Manager',
  ADMIN: 'Administrator',
};

export function stageLabel(stage: string): string {
  if (STAGE_LABELS[stage]) return STAGE_LABELS[stage];
  // Same fallback as formatApprovalRole: TITLE_CASE the enum rather than showing it raw.
  if (/^[A-Z][A-Z_]*$/.test(stage)) {
    return stage
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return stage;
}

/** Whole days between two instants, floored — never negative. */
export function daysBetween(from?: string | Date | null, to: Date = new Date()): number | undefined {
  if (!from) return undefined;
  const start = new Date(from).getTime();
  if (Number.isNaN(start)) return undefined;
  const end = to.getTime();
  if (Number.isNaN(end)) return undefined;
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

/** The step recording a decision at this stage, matched by label rather than by enum value. */
function stepForStage(steps: ApprovalStep[], stageName: string): ApprovalStep | undefined {
  const label = stageLabel(stageName);
  return steps.find((step) => step.role === label && step.status !== 'pending');
}

/**
 * Build the rail from the computed chain and what actually happened.
 *
 * <p>The chain length is not fixed: a requisition inside the HR delegation has one approval stage,
 * one above the threshold has two. Rendering a fixed ladder is how a two-stage chain ends up
 * looking like it stalled halfway.
 *
 * <p><b>Dwell now comes from the approval history, which is a full status history.</b> Every
 * transition writes a `RequisitionApproval`, and that record timestamps itself on construction —
 * so a stage was entered when the previous event happened and left when its own did. That makes
 * every completed stage's duration derivable, not only the ones whose own timestamp is present.
 * The page previously showed dwell for almost nothing because it had no entry time to subtract.
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

  // Decisions in the order they happened. The timeline puts the submission first as its own step,
  // which is exactly the T0 every later stage measures from.
  const decided = steps.filter((step) => step.status !== 'pending' && step.timestamp);
  const submittedAt = decided.find((step) => step.role === 'Submitted')?.timestamp;

  const raised: Stage = {
    name: 'Raised',
    state: 'done',
    when: raisedAt ? formatDate(raisedAt) : undefined,
    // Raised → submitted, or raised → now if it has not been submitted.
    days: daysBetween(raisedAt, submittedAt ? new Date(submittedAt) : now),
  };

  const chain = routing?.chain ?? inferChainFromSteps(steps);

  // Walk the chain and the decisions together: stage N was entered when decision N-1 landed.
  let enteredAt: string | Date | undefined = submittedAt ?? raisedAt;

  const approvalStages: Stage[] = chain.map((stageName) => {
    const label = stageLabel(stageName);
    const step = stepForStage(steps, stageName);

    if (step?.timestamp) {
      const stage: Stage = {
        name: label,
        state: step.status === 'rejected' ? 'stopped' : 'done',
        actor: step.approverName,
        when: formatDate(new Date(step.timestamp)),
        days: daysBetween(enteredAt, new Date(step.timestamp)),
      };
      enteredAt = step.timestamp;
      return stage;
    }

    if (stageName === routing?.currentStage) {
      return {
        name: label,
        state: 'current',
        actor: 'Awaiting a decision',
        when: enteredAt ? `since ${formatDate(new Date(enteredAt))}` : undefined,
        days: daysBetween(enteredAt, now),
      };
    }

    return { name: label, state: 'todo', actor: rejected ? 'Not reached' : undefined };
  });

  const outcome: Stage = rejected
    ? { name: 'Rejected', state: 'stopped', actor: 'Not advertised' }
    : { name: 'Approved', state: approved ? 'done' : 'todo', actor: 'Clears for advertising' };

  return [raised, ...approvalStages, outcome];
}

/**
 * When routing is unavailable, recover the chain from the decisions themselves.
 *
 * <p>Deliberately not a guess at what the chain *should* be — only the stages that demonstrably
 * had a decision, in order, with the submission excluded because it is its own rail entry.
 */
function inferChainFromSteps(steps: ApprovalStep[]): string[] {
  const seen: string[] = [];
  for (const step of steps) {
    if (step.role === 'Submitted') continue;
    if (!seen.includes(step.role)) seen.push(step.role);
  }
  return seen;
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
