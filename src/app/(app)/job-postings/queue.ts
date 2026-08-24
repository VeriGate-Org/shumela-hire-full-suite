/**
 * Derivations for the advert queue.
 *
 * <p>The distinction this page turns on is that an advert can be published and still taking
 * applications, or published and long past its closing date, and nothing in the data model tells
 * those apart by status — because nothing closes a posting when its deadline passes.
 */

/** Shape returned by GET /api/job-postings/summary — whole-set counts, never page-scoped. */
export interface JobPostingSummary {
  countsByStatus: Record<string, number>;
  total: number;
  openToApplicants: number;
  pastDeadline: number;
  oldestExpiredDays?: number | null;
  oldestExpiredId?: string | null;
  awaitingApproval: number;
  applicationsReceived: number;
}

export interface PostingRow {
  id: string | number;
  status: string;
  applicationDeadline?: string | null;
  publishedAt?: string | null;
  daysFromPublication?: number;
  viewsCount?: number;
  applicationsCount?: number;
}

/**
 * Is this payload usable as a summary?
 *
 * <p>Checked at the fetch boundary. An older deployment answering this path with something else
 * would otherwise reach the band and throw reading `countsByStatus`, taking down a page whose
 * adverts had loaded perfectly.
 */
export function isPostingSummary(payload: unknown): payload is JobPostingSummary {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<JobPostingSummary>;
  return (
    typeof candidate.countsByStatus === 'object' &&
    candidate.countsByStatus !== null &&
    typeof candidate.total === 'number' &&
    typeof candidate.pastDeadline === 'number'
  );
}

/**
 * What state this advert is really in.
 *
 * <p>`past-deadline` is the state the status cannot express. It is derived exactly as the server
 * derives it — published, with a closing date already gone — so the row and the count agree.
 */
export type PostingState =
  | 'draft'
  | 'awaiting-approval'
  | 'approved'
  | 'open'
  | 'past-deadline'
  | 'closed'
  | 'other';

export function stateOf(row: PostingRow, now: Date = new Date()): PostingState {
  switch (row.status) {
    case 'DRAFT':
      return 'draft';
    case 'PENDING_APPROVAL':
      return 'awaiting-approval';
    case 'APPROVED':
      return 'approved';
    case 'PUBLISHED':
      return isDeadlinePassed(row, now) ? 'past-deadline' : 'open';
    case 'CLOSED':
    case 'UNPUBLISHED':
    case 'CANCELLED':
      return 'closed';
    default:
      return 'other';
  }
}

export const STATE_LABELS: Record<PostingState, string> = {
  draft: 'Draft',
  'awaiting-approval': 'Awaiting approval',
  approved: 'Approved',
  open: 'Open',
  'past-deadline': 'Past deadline',
  closed: 'Closed',
  other: 'Other',
};

/**
 * Has the closing date gone?
 *
 * <p>False when there is no deadline at all — an advert without one is not expired, it simply has
 * no clock. `applicationDeadline` is optional and treating its absence as a passed date would
 * report live adverts as dead.
 */
export function isDeadlinePassed(row: PostingRow, now: Date = new Date()): boolean {
  if (!row.applicationDeadline) return false;
  const deadline = new Date(row.applicationDeadline);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline.getTime() < now.getTime();
}

/** Whole days until the closing date — negative once it has gone, null without one. */
export function daysUntilClose(row: PostingRow, now: Date = new Date()): number | null {
  if (!row.applicationDeadline) return null;
  const deadline = new Date(row.applicationDeadline);
  if (Number.isNaN(deadline.getTime())) return null;
  return Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
}

/** The closing date in words, from the reader's point of view. */
export function closesLabel(row: PostingRow, now: Date = new Date()): string | null {
  const days = daysUntilClose(row, now);
  if (days === null) return null;
  if (days < 0) {
    const ago = Math.abs(days);
    return `Expired ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
  }
  if (days === 0) return 'Closes today';
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

/**
 * How long the advert has been live, or null.
 *
 * <p><b>Null for anything unpublished.</b> `daysFromPublication` returns 0 rather than null when
 * `publishedAt` is unset, so rendering it directly reads "0 days live" for a draft that has never
 * been advertised at all.
 */
export function daysLive(row: PostingRow): number | null {
  if (!row.publishedAt) return null;
  return typeof row.daysFromPublication === 'number' ? row.daysFromPublication : null;
}

/**
 * Applications as a share of views.
 *
 * <p>Null when there are no views — a rate over zero is not a low rate, it is no rate. Both inputs
 * are stored per record; nothing here is estimated.
 *
 * <p>Worth knowing before this figure is quoted: it is only a conversion rate if `viewsCount`
 * counts unique visitors rather than page loads, which is unverified.
 */
export function conversionRate(row: PostingRow): number | null {
  const views = row.viewsCount;
  const applications = row.applicationsCount;
  if (typeof views !== 'number' || views <= 0) return null;
  if (typeof applications !== 'number') return null;
  return (applications / views) * 100;
}

/** The filter chips, each carrying the states it selects. */
export const QUEUE_FILTERS: { key: string; label: string; states: PostingState[] }[] = [
  { key: 'attention', label: 'Needs attention', states: ['past-deadline', 'awaiting-approval'] },
  { key: 'all', label: 'All', states: [] },
  { key: 'open', label: 'Open', states: ['open'] },
  { key: 'awaiting-approval', label: 'Awaiting approval', states: ['awaiting-approval'] },
  { key: 'draft', label: 'Draft', states: ['draft', 'approved'] },
  { key: 'closed', label: 'Closed', states: ['closed'] },
];

/**
 * How many of the whole set a filter selects.
 *
 * <p>Null when the summary is unavailable — a count that cannot be computed is absent, never zero.
 */
export function filterCount(
  summary: JobPostingSummary | null,
  filterKey: string
): number | null {
  if (!summary) return null;
  const counts = summary.countsByStatus;
  switch (filterKey) {
    case 'attention':
      return summary.pastDeadline + summary.awaitingApproval;
    case 'all':
      return summary.total;
    case 'open':
      return summary.openToApplicants;
    case 'awaiting-approval':
      return summary.awaitingApproval;
    case 'draft':
      return (counts.DRAFT ?? 0) + (counts.APPROVED ?? 0);
    case 'closed':
      return (counts.CLOSED ?? 0) + (counts.UNPUBLISHED ?? 0) + (counts.CANCELLED ?? 0);
    default:
      return null;
  }
}

/**
 * Order by deadline, soonest first.
 *
 * <p>Expired adverts lead — they are the ones nobody has dealt with — then everything still open by
 * how long it has left, then anything with no clock running. <b>An advert with no deadline sorts
 * after those that have one</b>, because an absent date is not an imminent one.
 */
export function byDeadline<T extends PostingRow>(rows: T[], now: Date = new Date()): T[] {
  return [...rows].sort((a, b) => {
    const aDays = daysUntilClose(a, now);
    const bDays = daysUntilClose(b, now);
    if (aDays === null && bDays === null) return 0;
    if (aDays === null) return 1;
    if (bDays === null) return -1;
    return aDays - bDays;
  });
}

/**
 * The single status to ask the server for, or null to ask for everything.
 *
 * <p>`GET /api/job-postings/search` takes one {@code JobPostingStatus}, not a list — so a chip
 * covering several statuses cannot be pushed down and its rows are filtered from the page instead.
 * The chip <b>counts</b> always come from the summary and always describe the whole set; it is only
 * the rows that are a page.
 *
 * <p>Open and past-deadline both request PUBLISHED, because that is the status they share; the
 * deadline split is applied to what comes back.
 */
export function requestStatusFor(filterKey: string): string | null {
  switch (filterKey) {
    case 'open':
      return 'PUBLISHED';
    case 'awaiting-approval':
      return 'PENDING_APPROVAL';
    default:
      return null;
  }
}

/** The actions this advert can actually take, from the booleans the API already sends. */
export interface PostingAction {
  key: string;
  label: string;
  intent: 'primary' | 'secondary' | 'destructive';
}

export function actionsFor(row: Record<string, unknown>): PostingAction[] {
  const available: PostingAction[] = [];
  const can = (flag: string) => row[flag] === true;

  if (can('canBeEdited')) available.push({ key: 'edit', label: 'Edit', intent: 'secondary' });
  if (can('canBeSubmittedForApproval')) {
    available.push({ key: 'submit', label: 'Submit for approval', intent: 'primary' });
  }
  if (can('canBeApproved')) available.push({ key: 'approve', label: 'Approve', intent: 'primary' });
  if (can('canBePublished')) available.push({ key: 'publish', label: 'Publish', intent: 'primary' });
  if (can('canBeUnpublished')) {
    available.push({ key: 'unpublish', label: 'Unpublish', intent: 'secondary' });
  }
  if (can('canBeClosed')) available.push({ key: 'close', label: 'Close', intent: 'secondary' });
  if (can('canBeRejected')) available.push({ key: 'reject', label: 'Reject', intent: 'destructive' });

  return available;
}
