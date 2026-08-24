import { RequisitionStatus } from '@/types/workflow';

/** Shape returned by GET /api/requisitions/summary. */
export interface RequisitionSummary {
  countsByStatus: Record<string, number>;
  total: number;
  awaitingDecision: number;
  oldestWaitingDays?: number | null;
  oldestWaitingId?: string | null;
}

/** Statuses where somebody owes a decision. Mirrors the server's AWAITING_DECISION. */
export const AWAITING: RequisitionStatus[] = [
  RequisitionStatus.SUBMITTED,
  RequisitionStatus.PENDING_HR_APPROVAL,
  RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
];

export interface QueueFilter {
  key: string;
  label: string;
  /** Statuses this filter sends to the API. Empty means everything. */
  statuses: RequisitionStatus[];
}

/**
 * Filters the queue actually needs.
 *
 * <p>Deliberately not one per enum value. The old tab row offered a Pending tab spanning four
 * statuses, which it then had to filter client-side — so it showed only the pending rows inside the
 * current page while the pager reported the unfiltered total. Each filter here maps to a single
 * status the API can page on, except All.
 */
export const QUEUE_FILTERS: QueueFilter[] = [
  { key: 'all', label: 'All', statuses: [] },
  { key: 'hr', label: 'Awaiting HR', statuses: [RequisitionStatus.PENDING_HR_APPROVAL] },
  { key: 'exec', label: 'Awaiting executive', statuses: [RequisitionStatus.PENDING_EXECUTIVE_APPROVAL] },
  { key: 'draft', label: 'Draft', statuses: [RequisitionStatus.DRAFT] },
  { key: 'approved', label: 'Approved', statuses: [RequisitionStatus.APPROVED] },
  { key: 'rejected', label: 'Rejected', statuses: [RequisitionStatus.REJECTED] },
];

/**
 * How many records a filter matches, from the summary.
 *
 * <p>Returns undefined rather than 0 when the summary is unavailable, so a chip shows no number
 * instead of claiming nothing matches. "None" and "not counted" are different answers.
 */
export function filterCount(filter: QueueFilter, summary: RequisitionSummary | null): number | undefined {
  if (!summary) return undefined;
  if (filter.statuses.length === 0) return summary.total;
  return filter.statuses.reduce((sum, status) => sum + (summary.countsByStatus[status] ?? 0), 0);
}

/** Whole days waited, or undefined where it cannot be known. Never negative. */
export function waitingDays(updatedAt?: string | Date | null, now: Date = new Date()): number | undefined {
  if (!updatedAt) return undefined;
  const since = new Date(updatedAt).getTime();
  if (Number.isNaN(since)) return undefined;
  return Math.max(0, Math.floor((now.getTime() - since) / 86_400_000));
}

/** Who a requisition is waiting on, from its status alone — no routing call needed. */
export function waitingOn(status: RequisitionStatus): string | null {
  switch (status) {
    case RequisitionStatus.SUBMITTED:
      return 'Submitted';
    case RequisitionStatus.PENDING_HR_APPROVAL:
      return 'HR Manager';
    case RequisitionStatus.PENDING_EXECUTIVE_APPROVAL:
      return 'Executive';
    default:
      return null;
  }
}

export function isAwaiting(status: RequisitionStatus): boolean {
  return AWAITING.includes(status);
}

/**
 * The queue, longest wait first.
 *
 * <p>Only sorts what the page holds — the API pages by `createdAt`. Ordering a page by wait while
 * the server pages by creation is a partial answer, so the page must say which it is showing
 * rather than implying the whole queue is ranked.
 */
export function byLongestWait<T extends { status: RequisitionStatus; updatedAt?: string | Date }>(
  requisitions: T[],
  now: Date = new Date()
): T[] {
  return [...requisitions].sort((a, b) => {
    const aWaiting = isAwaiting(a.status);
    const bWaiting = isAwaiting(b.status);
    // Anything awaiting a decision outranks anything settled, regardless of age.
    if (aWaiting !== bWaiting) return aWaiting ? -1 : 1;
    const aDays = waitingDays(a.updatedAt, now) ?? -1;
    const bDays = waitingDays(b.updatedAt, now) ?? -1;
    return bDays - aDays;
  });
}
