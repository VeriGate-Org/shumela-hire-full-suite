/**
 * The pending-approval queue, as {@code GET /api/approvals/pending} returns it.
 *
 * <p>Five approval mechanisms exist in this product and each has its own screen, which is how five
 * separate backlogs came about. {@code PendingApprovalsService} composes them into one list ordered
 * by how long each item has waited — the only ordering that matters on a queue.
 *
 * <p>Kept out of the page component because every figure on that page is a derivation from this
 * payload, and a derivation that cannot be tested without mounting a screen does not get tested.
 */

/** The five mechanisms the backend models. Not all five are read — see {@link COVERED_KINDS}. */
export type ApprovalKind =
  | 'REQUISITION'
  | 'JOB_ADVERT'
  | 'OFFER'
  | 'SALARY_RECOMMENDATION'
  | 'LEAVE';

/**
 * How confident the server is that an item is waiting on <em>this</em> user.
 *
 * <p>Only offers can answer it — that source filters by approval level. Requisitions, job adverts
 * and salary recommendations can report only that something is pending someone.
 */
export type Assignment = 'YOURS' | 'UNCONFIRMED';

export interface PendingApproval {
  id: string;
  kind: ApprovalKind;
  title?: string;
  subtitle?: string;
  raisedBy?: string;
  waitingSince?: string;
  stage?: string;
  stakeAmount?: number | null;
  stakeLabel?: string;
}

export interface PendingApprovalsResult {
  items: PendingApproval[];
  /** Source name → why it could not be read. Empty when everything answered. */
  unavailableSources: Record<string, string>;
  partial: boolean;
  total: number;
  assignedToYou: number;
  countsByKind: Partial<Record<ApprovalKind, number>>;
  /** Null — not zero — when nothing in the queue carries a money figure. */
  valueHeldUp: number | null;
}

/**
 * The assignment lives on each item but is not in the {@link PendingApproval} interface above,
 * because it is the one field the page must never quietly default. Read it through this.
 */
export function assignmentOf(item: PendingApproval): Assignment {
  const raw = (item as unknown as { assignment?: string }).assignment;
  return raw === 'YOURS' ? 'YOURS' : 'UNCONFIRMED';
}

export function isPendingApprovalsResult(value: unknown): value is PendingApprovalsResult {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<PendingApprovalsResult>;
  return (
    Array.isArray(candidate.items) &&
    typeof candidate.total === 'number' &&
    typeof candidate.assignedToYou === 'number'
  );
}

export const KIND_LABEL: Record<ApprovalKind, string> = {
  REQUISITION: 'Requisition',
  JOB_ADVERT: 'Job advert',
  OFFER: 'Offer',
  SALARY_RECOMMENDATION: 'Salary',
  LEAVE: 'Leave',
};

/**
 * The mechanisms this queue actually reads.
 *
 * <p>Leave is excluded deliberately and says so in {@code PendingApprovalsService}: its query takes
 * a manager id rather than the caller's identity, so including it would mean changing leave's own
 * contract.
 *
 * <p>Offers are covered, but only appear for someone an administrator has given an approval level.
 * That level is read from the user record server-side — it used to be a query parameter, which let
 * any caller name their own authority — so a person with none is told why in
 * {@code unavailableSources} rather than the source going quiet.
 *
 * <p>Stated as a constant so the page can name what it covers rather than implying all five.
 */
export const COVERED_KINDS: ApprovalKind[] = [
  'REQUISITION',
  'JOB_ADVERT',
  'SALARY_RECOMMENDATION',
  'OFFER',
];

/** Whole days between an ISO timestamp and now. Null when the timestamp is missing or unparseable. */
export function daysWaiting(iso?: string, now: number = Date.now()): number | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  return Math.max(0, Math.floor((now - then) / 86_400_000));
}

export function daysLabel(days: number | null): string {
  if (days === null) return 'Not recorded';
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

/**
 * The longest wait in the queue, in days.
 *
 * <p>Computed from the items rather than trusting their order: the server sorts oldest-first, but a
 * headline figure that silently depends on someone else's sort is a figure waiting to go wrong.
 */
export function oldestWait(items: PendingApproval[], now: number = Date.now()): number | null {
  const waits = items
    .map((item) => daysWaiting(item.waitingSince, now))
    .filter((days): days is number => days !== null);
  return waits.length > 0 ? Math.max(...waits) : null;
}

/** Rands, or the reason there is no figure. Never renders null as R 0. */
export function money(amount: number | null | undefined): string | null {
  if (amount === null || amount === undefined) return null;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Where the record lives, so approving happens on the record and the audit trail is identical
 * whichever screen was used.
 *
 * <p>Salary recommendations have a list screen but no per-record route, so they land on the list.
 * Leave and offers are unreachable from here because this queue never contains them; they are in
 * the union for completeness, not because a row can occur.
 */
export function recordHref(item: PendingApproval): string | null {
  switch (item.kind) {
    case 'REQUISITION':
      return `/requisitions/${item.id}`;
    case 'JOB_ADVERT':
      return `/job-postings/${item.id}`;
    case 'SALARY_RECOMMENDATION':
      return '/salary-recommendations';
    case 'OFFER':
      return '/offers';
    case 'LEAVE':
      return '/leave/approvals';
    default:
      return null;
  }
}

/**
 * Plain-English note for a source the server could not read.
 *
 * <p>The server's own reason is preferred — it is more specific than anything inventable here —
 * and this only supplies a label for the source name.
 */
export function unavailableNote(source: string, reason: string): string {
  const labels: Record<string, string> = {
    requisitions: 'Requisitions',
    jobAdverts: 'Job adverts',
    offers: 'Offers',
    salaryRecommendations: 'Salary recommendations',
  };
  return `${labels[source] ?? source}: ${reason}`;
}
