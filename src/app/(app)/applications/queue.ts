/**
 * Derivations for the applications queue.
 *
 * <p>Kept out of the page so each rule can be tested without rendering anything, and so the page
 * reads as layout rather than as arithmetic. Same arrangement as the requisitions queue.
 */

/** Shape returned by GET /api/applications/summary — whole-set counts, never page-scoped. */
export interface AdvertBacklog {
  jobPostingId: string;
  jobTitle?: string;
  unscreened: number;
}

export interface ApplicationSummary {
  countsByStatus: Record<string, number>;
  total: number;
  live: number;
  unscreened: number;
  oldestUnscreenedDays?: number | null;
  oldestUnscreenedId?: string | null;
  unscreenedByAdvert: AdvertBacklog[];
  departments: string[];
  sources: string[];
}

/**
 * How the queue is ordered on the server.
 *
 * Oldest submission first, so the application waiting longest is the one you see. The page
 * previously defaulted to newest-first, which puts the thing least in need of attention at the top.
 */
export const QUEUE_SORT = { field: 'submittedAt', direction: 'asc' } as const;

/**
 * The funnel, as five stages rather than thirteen statuses.
 *
 * <p>Folded here rather than on the server: this is a presentation choice, and baking it into the
 * API would hand the next caller a grouping it never asked for. The summary returns all thirteen
 * counts and this decides what to make of them.
 *
 * <p>Reference and offer-preparation statuses sit inside the neighbouring stage rather than getting
 * columns of their own — a funnel with a bar holding two records is a chart about nothing.
 */
export const FUNNEL: { key: string; label: string; statuses: string[] }[] = [
  { key: 'applied', label: 'Applied', statuses: ['SUBMITTED'] },
  { key: 'screening', label: 'Screening', statuses: ['SCREENING'] },
  {
    key: 'interview',
    label: 'Interview',
    statuses: ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'REFERENCE_CHECK'],
  },
  { key: 'offer', label: 'Offer', statuses: ['OFFER_PENDING', 'OFFERED', 'OFFER_ACCEPTED'] },
  { key: 'hired', label: 'Hired', statuses: ['HIRED'] },
];

/** Statuses where the candidacy has ended. Mirrors ApplicationSummaryResponse.CLOSED. */
export const CLOSED_STATUSES = ['REJECTED', 'WITHDRAWN', 'OFFER_DECLINED'];

/** The filter chips, each carrying the statuses it selects. */
export const QUEUE_FILTERS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'unscreened', label: 'Unscreened', statuses: ['SUBMITTED'] },
  { key: 'live', label: 'All live', statuses: [] },
  { key: 'screening', label: 'Screening', statuses: ['SCREENING'] },
  {
    key: 'interview',
    label: 'Interview',
    statuses: ['INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'REFERENCE_CHECK'],
  },
  { key: 'offer', label: 'Offer', statuses: ['OFFER_PENDING', 'OFFERED', 'OFFER_ACCEPTED'] },
  { key: 'closed', label: 'Closed', statuses: CLOSED_STATUSES },
];

/**
 * How many of the whole set a filter selects.
 *
 * <p>Null when the summary has not loaded or failed — a count that cannot be computed is absent,
 * never zero. A chip reading "Unscreened 0" against a failed request is a lie the user acts on.
 */
export function filterCount(
  summary: ApplicationSummary | null,
  filter: { key: string; statuses: string[] }
): number | null {
  if (!summary) return null;
  if (filter.key === 'live') return summary.live;
  return filter.statuses.reduce((total, status) => total + (summary.countsByStatus[status] ?? 0), 0);
}

/** How many sit in a funnel stage, across the whole set. */
export function stageCount(summary: ApplicationSummary | null, stageKey: string): number | null {
  if (!summary) return null;
  const stage = FUNNEL.find((entry) => entry.key === stageKey);
  if (!stage) return null;
  return stage.statuses.reduce((total, status) => total + (summary.countsByStatus[status] ?? 0), 0);
}

/**
 * The sentence that says where the unscreened work actually is.
 *
 * <p>"64 unscreened" is a number; "41 of the 64 are on two adverts" is a decision about what to do
 * first. Built only when the concentration is real: if the backlog is spread evenly there is no
 * such sentence to write, and inventing one would point somebody at nothing.
 */
export function concentration(summary: ApplicationSummary | null): string | null {
  if (!summary || summary.unscreened === 0) return null;
  const adverts = summary.unscreenedByAdvert ?? [];
  if (adverts.length < 2) return null;

  const topTwo = adverts.slice(0, 2);
  const held = topTwo.reduce((total, advert) => total + advert.unscreened, 0);
  // Below half, "concentrated on two adverts" is not a fair description of the set.
  if (held * 2 <= summary.unscreened) return null;

  const named = topTwo
    .map((advert) => advert.jobTitle)
    .filter((title): title is string => Boolean(title && title.trim()));
  // Without titles the sentence would read "on two adverts" and name neither, which sends the
  // reader looking rather than telling them.
  if (named.length < 2) return null;

  return `${held} of the ${summary.unscreened} are on two adverts — ${named[0]} and ${named[1]}.`;
}

/** Whole days a rating maps to, or null. Ratings are 1–5 and rendered as 1–5. */
export function ratingStars(rating: number | null | undefined): number | null {
  if (typeof rating !== 'number' || Number.isNaN(rating)) return null;
  if (rating <= 0) return null;
  return Math.min(5, Math.round(rating));
}

/** Whether this status means the candidacy has ended. */
export function isClosed(status: string): boolean {
  return CLOSED_STATUSES.includes(status);
}

/**
 * Order rows so the longest wait leads.
 *
 * <p>The server already returns them this way; this keeps anything closed below anything live,
 * which submission order alone does not express — a rejected application from March should not
 * head a queue just because it is old.
 */
export function byLongestWait<T extends { status: string; daysFromSubmission?: number }>(
  rows: T[]
): T[] {
  return [...rows].sort((a, b) => {
    const aClosed = isClosed(a.status);
    const bClosed = isClosed(b.status);
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    return (b.daysFromSubmission ?? 0) - (a.daysFromSubmission ?? 0);
  });
}
