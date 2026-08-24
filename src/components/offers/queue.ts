/**
 * Derivations for the offers queue.
 *
 * <p>An offer is the only record in this product with a hard clock on it, and a lapse costs the
 * whole hire — the candidate goes back to the pipeline at the interview stage and the advert has
 * usually closed. So everything here is organised around expiry.
 */

/** Shape returned by GET /api/offers/summary — whole-set counts, never page-scoped. */
export interface OfferSummary {
  countsByStatus: Record<string, number>;
  total: number;
  withCandidate: number;
  expiringSoon: number;
  expiringImminently: number;
  lapsed: number;
  soonestExpiryDays?: number | null;
  soonestExpiryId?: string | null;
  withoutExpiry: number;
  committedAnnualValue: number | string;
  committedValueExcluded: number;
}

/**
 * Is this payload usable as a summary?
 *
 * <p>Checked at the fetch boundary rather than trusted at render time. An older deployment, a
 * partial rollout or a proxy answering the path with something else would otherwise reach the band
 * and throw on `countsByStatus.DRAFT`, taking down a page whose offers had loaded perfectly. The
 * same failure the requisition routing strip had before #259.
 */
export function isOfferSummary(payload: unknown): payload is OfferSummary {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Partial<OfferSummary>;
  return (
    typeof candidate.countsByStatus === 'object' &&
    candidate.countsByStatus !== null &&
    typeof candidate.total === 'number' &&
    typeof candidate.withCandidate === 'number'
  );
}

export interface OfferRow {
  id: string | number;
  status: string;
  offerExpiryDate?: string;
}

/**
 * Every status where the offer is with the candidate and the clock is running.
 *
 * <p>Must stay in step with `OfferSummaryResponse.WITH_CANDIDATE` on the server. Counting `SENT`
 * alone — which the server aggregate did until this change — omits precisely the offers most
 * likely to lapse, because a signature or a negotiation is what is consuming the time.
 */
export const WITH_CANDIDATE = ['SENT', 'AWAITING_SIGNATURE', 'SIGNED', 'UNDER_NEGOTIATION'];

/** Statuses where the offer is over. */
export const CLOSED = ['DECLINED', 'WITHDRAWN', 'EXPIRED', 'SUPERSEDED'];

export function isWithCandidate(status: string): boolean {
  return WITH_CANDIDATE.includes(status);
}

/**
 * The filter chips.
 *
 * <p><b>Lapsed is its own chip.</b> `EXPIRED` used to sit in "Declined" beside genuine declines and
 * withdrawals — but a candidate who never answered and one who said no need different follow-ups,
 * and only the first is a failure of ours.
 */
export const QUEUE_FILTERS: { key: string; label: string; statuses: string[] }[] = [
  { key: 'expiring', label: 'Expiring', statuses: [] },
  { key: 'all', label: 'All', statuses: [] },
  { key: 'draft', label: 'Draft', statuses: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'] },
  { key: 'with-candidate', label: 'Out with candidate', statuses: WITH_CANDIDATE },
  { key: 'accepted', label: 'Accepted', statuses: ['ACCEPTED'] },
  { key: 'lapsed', label: 'Lapsed', statuses: ['EXPIRED'] },
  { key: 'closed', label: 'Closed', statuses: ['DECLINED', 'WITHDRAWN', 'SUPERSEDED'] },
];

/**
 * How many of the whole set a filter selects.
 *
 * <p>Null when the summary is unavailable — a count that cannot be computed is absent, never zero.
 */
export function filterCount(summary: OfferSummary | null, filterKey: string): number | null {
  if (!summary) return null;
  if (filterKey === 'all') return summary.total;
  if (filterKey === 'expiring') return summary.expiringSoon;
  const filter = QUEUE_FILTERS.find((entry) => entry.key === filterKey);
  if (!filter) return null;
  return filter.statuses.reduce((total, status) => total + (summary.countsByStatus[status] ?? 0), 0);
}

/** Whole days until an offer expires — negative once it has passed, null without a date. */
export function daysUntilExpiry(row: OfferRow, now: Date = new Date()): number | null {
  if (!row.offerExpiryDate) return null;
  const expiry = new Date(row.offerExpiryDate);
  if (Number.isNaN(expiry.getTime())) return null;
  return Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000);
}

/**
 * Whether the expiry clock is worth showing on this row.
 *
 * <p>Every state where the offer is with the candidate, not just `SENT` and `UNDER_NEGOTIATION`.
 * An offer awaiting signature is a candidate sitting on a signing link with a deadline, and that
 * row showed no clock at all.
 */
export function showsClock(row: OfferRow): boolean {
  return isWithCandidate(row.status) && Boolean(row.offerExpiryDate);
}

/** The expiry in words, from the reader's point of view. */
export function expiryLabel(row: OfferRow, now: Date = new Date()): string | null {
  const days = daysUntilExpiry(row, now);
  if (days === null) return null;
  if (days < 0) {
    const ago = Math.abs(days);
    return `Expired ${ago} ${ago === 1 ? 'day' : 'days'} ago`;
  }
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

/** How urgent this row's clock is, for the caller to colour by. */
export function expiryTone(row: OfferRow, now: Date = new Date()): 'critical' | 'warning' | null {
  if (!showsClock(row)) return null;
  const days = daysUntilExpiry(row, now);
  if (days === null) return null;
  if (days <= 2) return 'critical';
  if (days <= 7) return 'warning';
  return null;
}

/**
 * Order so the soonest expiry leads.
 *
 * <p>Offers with the candidate come first, soonest clock at the top; then everything without a
 * running clock. <b>An offer with no expiry date sorts last within its group rather than first</b>
 * — an absent date is not an infinitely urgent one, and `offerExpiryDate` is optional.
 */
export function bySoonestExpiry<T extends OfferRow>(rows: T[], now: Date = new Date()): T[] {
  return [...rows].sort((a, b) => {
    const aLive = isWithCandidate(a.status);
    const bLive = isWithCandidate(b.status);
    if (aLive !== bLive) return aLive ? -1 : 1;

    const aDays = daysUntilExpiry(a, now);
    const bDays = daysUntilExpiry(b, now);
    if (aDays === null && bDays === null) return 0;
    if (aDays === null) return 1;
    if (bDays === null) return -1;
    return aDays - bDays;
  });
}

/**
 * The committed value, as a number.
 *
 * <p>The API sends a BigDecimal, which arrives as either a number or a string depending on the
 * serialiser. Parsed rather than assumed, and null when it cannot be — a total nobody can read is
 * better omitted than rendered as NaN.
 */
export function committedValue(summary: OfferSummary | null): number | null {
  if (!summary) return null;
  const raw = summary.committedAnnualValue;
  const value = typeof raw === 'number' ? raw : Number.parseFloat(raw);
  return Number.isFinite(value) ? value : null;
}
