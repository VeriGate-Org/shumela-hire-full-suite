/**
 * Derivations for the interview queue.
 *
 * <p>Kept out of the page so each rule is testable without rendering. Same arrangement as the
 * requisitions and applications queues.
 */

/** Shape returned by GET /api/interviews/summary — whole-set counts, never page-scoped. */
export interface InterviewSummary {
  countsByStatus: Record<string, number>;
  total: number;
  awaitingWriteUp: number;
  slotPassed: number;
  nextSevenDays: number;
  today: number;
  oldestWriteUpDays?: number | null;
  oldestWriteUpId?: string | null;
  medianDaysToWriteUp?: number | null;
  awaitingWriteUpIds: string[];
}

export interface InterviewRow {
  /**
   * The API returns a string UUID. The interview components declare `id: number` — on the
   * calendar, the scheduler and the feedback form alike — so the wrong type is load-bearing
   * across several files and correcting it belongs in its own change. Widened here so these
   * derivations work against either without a cast that hides the disagreement.
   */
  id: string | number;
  status: string;
  scheduledAt?: string;
  completedAt?: string;
  durationMinutes?: number;
  requiresFeedback?: boolean;
  isOverdue?: boolean;
  feedbackCount?: number;
  rescheduleCount?: number;
  rescheduleReason?: string;
}

/**
 * What a row is actually waiting on.
 *
 * <p>Two stalls, told apart, because they need different remedies. A completed interview with no
 * write-up needs the panel chased; a scheduled interview whose slot has passed needs somebody to
 * say whether it happened at all. Both are computed on the server —
 * `requiresFeedback` and `isOverdue` — and neither was ever counted on this screen.
 */
export type InterviewState =
  | 'awaiting-write-up'
  | 'slot-passed'
  | 'today'
  | 'scheduled'
  | 'written-up'
  | 'cancelled'
  | 'other';

export function stateOf(row: InterviewRow, now: Date = new Date()): InterviewState {
  if (row.status === 'CANCELLED') return 'cancelled';
  // Server-computed, and trusted over any local recalculation: the entity owns the definition.
  if (row.requiresFeedback) return 'awaiting-write-up';
  if (row.isOverdue) return 'slot-passed';
  if (row.status === 'COMPLETED') return 'written-up';
  if (row.status === 'SCHEDULED' || row.status === 'RESCHEDULED') {
    const at = row.scheduledAt ? new Date(row.scheduledAt) : null;
    if (at && !Number.isNaN(at.getTime()) && isSameDay(at, now)) return 'today';
    return 'scheduled';
  }
  return 'other';
}

export const STATE_LABELS: Record<InterviewState, string> = {
  'awaiting-write-up': 'Awaiting write-up',
  'slot-passed': 'Never started',
  today: 'Today',
  scheduled: 'Scheduled',
  'written-up': 'Written up',
  cancelled: 'Cancelled',
  other: 'In progress',
};

/** The filter chips, each carrying the states it selects. */
export const QUEUE_FILTERS: { key: string; label: string; states: InterviewState[] }[] = [
  { key: 'needs-action', label: 'Needs action', states: ['awaiting-write-up', 'slot-passed'] },
  { key: 'all', label: 'All', states: [] },
  { key: 'upcoming', label: 'Upcoming', states: ['today', 'scheduled'] },
  { key: 'awaiting-write-up', label: 'Awaiting write-up', states: ['awaiting-write-up'] },
  { key: 'written-up', label: 'Written up', states: ['written-up'] },
];

/**
 * How many of the whole set a filter selects.
 *
 * <p>Null when the summary is unavailable — a count that cannot be computed is absent, never zero.
 */
export function filterCount(
  summary: InterviewSummary | null,
  filterKey: string
): number | null {
  if (!summary) return null;
  switch (filterKey) {
    case 'needs-action':
      return summary.awaitingWriteUp + summary.slotPassed;
    case 'all':
      return summary.total;
    case 'upcoming':
      return summary.nextSevenDays;
    case 'awaiting-write-up':
      return summary.awaitingWriteUp;
    case 'written-up':
      // Completed interviews that are no longer waiting on anybody.
      return Math.max(0, (summary.countsByStatus.COMPLETED ?? 0) - summary.awaitingWriteUp);
    default:
      return null;
  }
}

/**
 * Whole days a row has been waiting, or null if it is not waiting on anyone.
 *
 * <p>Measured from when the interview finished for a missing write-up, and from the end of the
 * booked slot for one nobody started. A scheduled interview in the future is not waiting.
 */
export function waitingDays(row: InterviewRow, now: Date = new Date()): number | null {
  const state = stateOf(row, now);
  if (state !== 'awaiting-write-up' && state !== 'slot-passed') return null;

  const from = row.completedAt ? new Date(row.completedAt) : endOfSlot(row);
  if (!from || Number.isNaN(from.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / 86_400_000));
}

function endOfSlot(row: InterviewRow): Date | null {
  if (!row.scheduledAt) return null;
  const start = new Date(row.scheduledAt);
  if (Number.isNaN(start.getTime())) return null;
  return new Date(start.getTime() + (row.durationMinutes ?? 60) * 60_000);
}

/**
 * Feedback filed, as a fraction — or null.
 *
 * <p><b>The denominator is deliberately absent.</b> An interview records one `interviewerId` plus a
 * free-text `additionalInterviewers` string, so the intended panel size would have to be a comma
 * count over prose. The numerator is real: `feedbackCount` is the length of a structured array. So
 * this reports how many write-ups exist, and does not claim how many were expected.
 */
export function feedbackFiled(row: InterviewRow): number | null {
  return typeof row.feedbackCount === 'number' ? row.feedbackCount : null;
}

/** Order so the longest-stalled leads, then today, then everything still ahead. */
export function byMostOverdue<T extends InterviewRow>(rows: T[], now: Date = new Date()): T[] {
  const rank: Record<InterviewState, number> = {
    'awaiting-write-up': 0,
    'slot-passed': 0,
    today: 1,
    scheduled: 2,
    other: 3,
    'written-up': 4,
    cancelled: 5,
  };
  return [...rows].sort((a, b) => {
    const byRank = rank[stateOf(a, now)] - rank[stateOf(b, now)];
    if (byRank !== 0) return byRank;
    const aWait = waitingDays(a, now);
    const bWait = waitingDays(b, now);
    if (aWait !== null || bWait !== null) return (bWait ?? 0) - (aWait ?? 0);
    // Neither is stalled: soonest first, so the next thing to happen leads.
    return timeOf(a) - timeOf(b);
  });
}

function timeOf(row: InterviewRow): number {
  if (!row.scheduledAt) return Number.MAX_SAFE_INTEGER;
  const at = new Date(row.scheduledAt).getTime();
  return Number.isNaN(at) ? Number.MAX_SAFE_INTEGER : at;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * When this interview is, in words.
 *
 * <p>Relative where relative is what matters — an interview two hours away and one nine days
 * overdue are both better read as a distance than as a date.
 */
export function whenLabel(row: InterviewRow, now: Date = new Date()): string | null {
  if (!row.scheduledAt) return null;
  const at = new Date(row.scheduledAt);
  if (Number.isNaN(at.getTime())) return null;

  const diffMs = at.getTime() - now.getTime();
  const days = Math.round(diffMs / 86_400_000);

  if (isSameDay(at, now)) {
    const hours = Math.round(diffMs / 3_600_000);
    if (hours > 0) return `In ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    return 'Earlier today';
  }
  if (diffMs < 0) {
    const ago = Math.abs(days);
    return `${ago} ${ago === 1 ? 'day' : 'days'} ago`;
  }
  return `In ${days} ${days === 1 ? 'day' : 'days'}`;
}
