/**
 * Derivations for the salary recommendation queue.
 *
 * <p>The record carries four amounts — the candidate's current salary, what they asked for, a
 * proposed min/max band, and a recommended figure. Read as a list they are four numbers. Read on
 * one scale they answer the only question a reviewer has: <b>is this inside the band, and how far
 * is it from what the candidate asked for.</b>
 *
 * <p>A recommendation above the ceiling its own requester proposed is invisible in a table of
 * amounts and obvious on a scale. That is the whole point of this module.
 */

/** As `GET /api/salary-recommendations` returns each row. */
export interface RecommendationRow {
  id: string | number;
  recommendationNumber?: string;
  status: string;
  positionTitle?: string;
  department?: string;
  jobGrade?: string;
  candidateName?: string;
  candidateCurrentSalary?: number | null;
  candidateExpectedSalary?: number | null;
  proposedMinSalary?: number | null;
  proposedMaxSalary?: number | null;
  proposedTargetSalary?: number | null;
  recommendedSalary?: number | null;
  approvalLevelRequired?: number | null;
  recommendedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  returnReason?: string | null;
  timesReturned?: number | null;
  currency?: string;
}

/** Whole-set counts from `GET /api/salary-recommendations/summary`. */
export interface RecommendationSummary {
  countsByStatus: Record<string, number>;
  total: number;
  live: number;
  awaitingReview: number;
  awaitingApproval: number;
  returned: number;
  aboveProposedBand: number;
  belowProposedBand: number;
  totalProposed?: number | string | null;
  liveWithoutTarget: number;
  oldestWaitingDays?: number | null;
  oldestWaitingRef?: string | null;
}

export function isRecommendationSummary(value: unknown): value is RecommendationSummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.total === 'number' &&
    typeof candidate.live === 'number' &&
    typeof candidate.aboveProposedBand === 'number'
  );
}

/**
 * Where a recommendation sits against its own proposed band.
 *
 * <p>`unrecommended` is not a failure — it means nobody has put a number on it yet, which
 * is the normal state of anything awaiting review. `no-band` means the requester proposed
 * no bounds, so there is nothing to be inside or outside of.
 */
export type BandPosition = 'above' | 'within' | 'below' | 'no-band' | 'unrecommended';

export function bandPosition(row: RecommendationRow): BandPosition {
  const recommended = row.recommendedSalary;
  if (recommended === null || recommended === undefined) return 'unrecommended';

  const min = row.proposedMinSalary;
  const max = row.proposedMaxSalary;
  if ((min === null || min === undefined) && (max === null || max === undefined)) return 'no-band';

  if (max !== null && max !== undefined && recommended > max) return 'above';
  if (min !== null && min !== undefined && recommended < min) return 'below';
  return 'within';
}

export const BAND_LABELS: Record<BandPosition, string> = {
  above: 'above band',
  within: 'within band',
  below: 'below band',
  'no-band': 'no band proposed',
  unrecommended: 'not yet recommended',
};

/**
 * Marker positions on the band scale, as percentages of the track.
 *
 * <p>The track runs from the proposed minimum to the proposed maximum. A value outside that range
 * is clamped into view and flagged by {@link bandPosition} rather than silently pinned to an end —
 * the number stays true, only its position on the drawing is bounded.
 *
 * <p>Returns null when there is no band to draw against. Nothing is interpolated: an absent amount
 * produces an absent marker, so a graduate with no current salary shows no current-salary marker
 * rather than a zero at the far left.
 */
export function bandScale(row: RecommendationRow): {
  min: number;
  max: number;
  markers: { key: string; label: string; value: number; percent: number; outside: boolean }[];
} | null {
  const min = row.proposedMinSalary;
  const max = row.proposedMaxSalary;
  if (min === null || min === undefined || max === null || max === undefined) return null;
  if (max <= min) return null;

  const span = max - min;
  const place = (value: number) => ((value - min) / span) * 100;

  const candidates: { key: string; label: string; value: number | null | undefined }[] = [
    { key: 'current', label: 'Current salary', value: row.candidateCurrentSalary },
    { key: 'expected', label: 'Candidate expectation', value: row.candidateExpectedSalary },
    { key: 'recommended', label: 'Recommended', value: row.recommendedSalary },
  ];

  return {
    min,
    max,
    markers: candidates
      .filter((c): c is { key: string; label: string; value: number } =>
        c.value !== null && c.value !== undefined)
      .map((c) => ({
        key: c.key,
        label: c.label,
        value: c.value,
        percent: Math.min(100, Math.max(0, place(c.value))),
        outside: c.value < min || c.value > max,
      })),
  };
}

/**
 * How long this recommendation has been waiting on somebody, or null if it is not waiting.
 *
 * <p>An approval is measured from when the number was recommended, not from when the request was
 * raised — the review time before that belonged to somebody else, and charging it to the approver
 * makes every approval look slow.
 */
export function waitingDays(row: RecommendationRow, now: Date = new Date()): number | null {
  if (row.status !== 'PENDING_REVIEW' && row.status !== 'PENDING_APPROVAL') return null;

  const since =
    row.status === 'PENDING_APPROVAL' && row.recommendedAt
      ? row.recommendedAt
      : row.updatedAt ?? row.createdAt;
  if (!since) return null;

  const start = new Date(since);
  if (Number.isNaN(start.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - start.getTime()) / 86_400_000));
}

/**
 * Longest wait first, then everything not waiting.
 *
 * <p>Review and approval are stages of one thing. Splitting them into tabs hid the ordering that
 * actually matters — how long each has been sitting, regardless of which stage it sits in.
 */
export function byLongestWaiting<T extends RecommendationRow>(
  rows: T[],
  now: Date = new Date(),
): T[] {
  return [...rows].sort((a, b) => {
    const aWait = waitingDays(a, now);
    const bWait = waitingDays(b, now);
    if (aWait === null && bWait === null) {
      return (a.recommendationNumber ?? '').localeCompare(b.recommendationNumber ?? '');
    }
    if (aWait === null) return 1;
    if (bWait === null) return -1;
    return bWait - aWait;
  });
}

/**
 * Who has to sign this off, or null when no level has been set.
 *
 * <p>`approvalLevelRequired` decides who must approve, and a level 3 recommendation
 * waiting twelve days is waiting on a different person from a level 1. Null renders as "not set"
 * rather than as level 0, which would read as "nobody".
 */
export function approvalLevel(row: RecommendationRow): number | null {
  const level = row.approvalLevelRequired;
  return typeof level === 'number' && level > 0 ? level : null;
}

/** The filter chips. Every status the record can hold is reachable from here. */
export const QUEUE_FILTERS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'on-me', label: 'On me', statuses: ['PENDING_REVIEW', 'PENDING_APPROVAL'] },
  { key: 'all', label: 'All', statuses: [] },
  { key: 'awaiting-review', label: 'Awaiting review', statuses: ['PENDING_REVIEW'] },
  { key: 'awaiting-approval', label: 'Awaiting approval', statuses: ['PENDING_APPROVAL'] },
  { key: 'returned', label: 'Returned', statuses: ['RETURNED'] },
  { key: 'draft', label: 'Draft', statuses: ['DRAFT'] },
  { key: 'settled', label: 'Settled', statuses: ['APPROVED', 'REJECTED', 'IMPLEMENTED'] },
];

export function filterCount(
  summary: RecommendationSummary | null,
  filterKey: string,
): number | null {
  if (!summary) return null;
  const counts = summary.countsByStatus ?? {};
  const at = (status: string) => counts[status] ?? 0;

  switch (filterKey) {
    case 'all':
      return summary.total;
    case 'on-me':
      return summary.awaitingReview + summary.awaitingApproval;
    case 'awaiting-review':
      return summary.awaitingReview;
    case 'awaiting-approval':
      return summary.awaitingApproval;
    case 'returned':
      return summary.returned;
    case 'draft':
      return at('DRAFT');
    case 'settled':
      return at('APPROVED') + at('REJECTED') + at('IMPLEMENTED');
    default:
      return null;
  }
}

export function matchesFilter(filterKey: string, row: RecommendationRow): boolean {
  if (filterKey === 'all') return true;
  const filter = QUEUE_FILTERS.find((entry) => entry.key === filterKey);
  if (!filter || filter.statuses.length === 0) return true;
  return filter.statuses.includes(row.status);
}

/** Can this recommendation be sent back for rework? Mirrors the server's own guard. */
export function canReturn(row: RecommendationRow): boolean {
  return (
    row.status === 'PENDING_REVIEW' ||
    row.status === 'RECOMMENDED' ||
    row.status === 'PENDING_APPROVAL'
  );
}

/** Rands, or null — never "R 0" standing in for an amount nobody recorded. */
export function money(amount: number | string | null | undefined, currency = 'ZAR'): string | null {
  if (amount === null || amount === undefined || amount === '') return null;
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
