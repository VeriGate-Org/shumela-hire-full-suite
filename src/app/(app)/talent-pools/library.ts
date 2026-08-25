/**
 * Derivations for the talent pool library.
 *
 * <p>The question this page exists to answer is <b>which of these pools is still worth anything</b>.
 * A pool's value is its freshness: a shortlist of 147 people whose median entry is seventeen months
 * old is a mailing list, not a bench. `addedAt` is on every entry and nothing ever
 * reported it.
 *
 * <p>The specific failure to catch is a pool that is <b>growing unattended</b> — `autoAddEnabled`
 * puts a person in on every matching rejection without anyone deciding to add them, and combined
 * with an old median that is a rejection log presented as a bench.
 */

/**
 * How old a pool's median entry may be before the pool is called stale.
 *
 * <p>Twelve months, matching `TalentPoolSummaryResponse.STALE_POOL_DAYS`. The two are
 * separate constants in separate languages; if one moves the other must, and the tests on each side
 * name the number so the drift is visible.
 */
export const STALE_POOL_DAYS = 365;

/** A pool as `GET /api/talent-pools` now returns it. */
export interface PoolRow {
  id: string | number;
  poolName: string;
  description?: string;
  department?: string;
  skillsCriteria?: string;
  experienceLevel?: string;
  isActive?: boolean | null;
  autoAddEnabled?: boolean | null;
  entryCount?: number;
  removedCount?: number;
  bySource?: Record<string, number>;
  medianEntryAgeDays?: number | null;
  oldestEntryAt?: string | null;
  lastAddedAt?: string | null;
  entriesWithoutDate?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** Whole-set counts, as `GET /api/talent-pools/summary` returns them. */
export interface PoolSummary {
  pools: number;
  active: number;
  inactive: number;
  autoAdding: number;
  stale: number;
  growingUnattended: number;
  entriesHeld: number;
  oldestMedianDays?: number | null;
  oldestMedianPoolId?: string | null;
}

/** Guards the fetch boundary — an error body is an object too, and would render as zeroes. */
export function isPoolSummary(value: unknown): value is PoolSummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.pools === 'number' &&
    typeof candidate.stale === 'number' &&
    typeof candidate.growingUnattended === 'number'
  );
}

/**
 * What this pool is.
 *
 * <p>Ordered by what needs attention first. `growing-unattended` outranks everything
 * because it is the only state that gets worse on its own.
 */
export type PoolState =
  | 'inactive'
  | 'empty'
  | 'growing-unattended'
  | 'stale'
  | 'auto-adding'
  | 'curated';

export function stateOf(pool: PoolRow): PoolState {
  // A switched-off pool still holds its people — that is why it is reported rather than hidden —
  // but it is not accumulating anybody, so it cannot be growing unattended.
  if (pool.isActive === false) return 'inactive';
  if ((pool.entryCount ?? 0) === 0) return 'empty';

  const stale = isStale(pool);
  const autoAdding = pool.autoAddEnabled === true;

  if (stale && autoAdding) return 'growing-unattended';
  if (stale) return 'stale';
  if (autoAdding) return 'auto-adding';
  return 'curated';
}

export const STATE_LABELS: Record<PoolState, string> = {
  inactive: 'Switched off, still held',
  empty: 'Empty',
  'growing-unattended': 'Growing unattended',
  stale: 'Stale',
  'auto-adding': 'Auto-adding',
  curated: 'Curated',
};


/**
 * Is this pool's median entry past the staleness threshold?
 *
 * <p>False when the median is absent. An empty pool has no median and is not stale — there is
 * nothing in it to have gone off — and flagging on a missing figure would accuse a pool of
 * something nobody can check.
 */
export function isStale(pool: PoolRow): boolean {
  const median = pool.medianEntryAgeDays;
  if (median === null || median === undefined) return false;
  return median >= STALE_POOL_DAYS;
}

/**
 * The median entry age in words, or null when the pool is empty.
 *
 * <p>Rendered in months because that is the unit the decision is made in — nobody reasons about a
 * shortlist in days once it is past a season.
 */
export function medianAgeLabel(pool: PoolRow): string | null {
  const days = pool.medianEntryAgeDays;
  if (days === null || days === undefined) return null;
  if (days < 30) return days === 1 ? '1 day' : `${days} days`;
  const months = Math.round(days / 30);
  if (months < 12) return months === 1 ? '1 month' : `${months} months`;
  const years = days / 365;
  return years >= 2 ? `${Math.round(years)} years` : `${months} months`;
}

/** How long ago the oldest person still held was added, in words, or null if the pool is empty. */
export function oldestEntryLabel(pool: PoolRow, now: Date = new Date()): string | null {
  if (!pool.oldestEntryAt) return null;
  const added = new Date(pool.oldestEntryAt);
  if (Number.isNaN(added.getTime())) return null;
  const days = Math.max(0, Math.floor((now.getTime() - added.getTime()) / 86_400_000));
  return medianAgeLabel({ ...pool, medianEntryAgeDays: days });
}

const SOURCE_LABELS: Record<string, string> = {
  MANUAL: 'manual',
  AUTO_REJECTED: 'auto',
  AGENCY: 'agency',
  UNKNOWN: 'unrecorded',
};

/**
 * How people got into this pool — "129 auto · 18 manual".
 *
 * <p>Null when the split is unknown rather than an empty string, so the caller decides how to say
 * nothing. Ordered largest first, because the largest source is what the pool actually is.
 */
export function sourceSummary(pool: PoolRow): string | null {
  const bySource = pool.bySource;
  if (!bySource || Object.keys(bySource).length === 0) return null;
  return Object.entries(bySource)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => `${count} ${SOURCE_LABELS[source] ?? source.toLowerCase()}`)
    .join(' · ');
}

/**
 * What share of this pool arrived automatically, 0–1, or null when unknown.
 *
 * <p>A pool that is 88% auto-added rejections is a rejection log; one that is entirely hand-picked
 * is a genuine bench. They deserve different trust.
 */
export function autoAddedShare(pool: PoolRow): number | null {
  const bySource = pool.bySource;
  if (!bySource) return null;
  const total = Object.values(bySource).reduce((sum, count) => sum + count, 0);
  if (total === 0) return null;
  return (bySource.AUTO_REJECTED ?? 0) / total;
}

/**
 * Order by how stale each pool is, oldest median first.
 *
 * <p>Pools with no median sort last: an empty pool is not a problem, and an unknown figure is not a
 * high one. Ties break on name so the order is stable between loads.
 */
export function byOldestMedian<T extends PoolRow>(pools: T[]): T[] {
  return [...pools].sort((a, b) => {
    const aMedian = a.medianEntryAgeDays;
    const bMedian = b.medianEntryAgeDays;
    const aMissing = aMedian === null || aMedian === undefined;
    const bMissing = bMedian === null || bMedian === undefined;
    if (aMissing && bMissing) return a.poolName.localeCompare(b.poolName);
    if (aMissing) return 1;
    if (bMissing) return -1;
    if (aMedian !== bMedian) return bMedian - aMedian;
    return a.poolName.localeCompare(b.poolName);
  });
}

/** The filter chips, each carrying the states it selects. */
export const POOL_FILTERS: { key: string; label: string; states: PoolState[] }[] = [
  { key: 'all', label: 'All', states: [] },
  { key: 'growing-unattended', label: 'Growing unattended', states: ['growing-unattended'] },
  { key: 'stale', label: 'Stale', states: ['stale', 'growing-unattended'] },
  { key: 'auto-adding', label: 'Auto-adding', states: ['auto-adding', 'growing-unattended'] },
  { key: 'inactive', label: 'Switched off', states: ['inactive'] },
];

/**
 * The count for a chip, off the whole-set summary.
 *
 * <p>Null rather than zero without a summary. "None match" and "we have not counted" are different
 * answers and only one of them means stop looking.
 */
export function filterCount(summary: PoolSummary | null, filterKey: string): number | null {
  if (!summary) return null;
  switch (filterKey) {
    case 'all':
      return summary.pools;
    case 'growing-unattended':
      return summary.growingUnattended;
    case 'stale':
      return summary.stale;
    case 'auto-adding':
      return summary.autoAdding;
    case 'inactive':
      return summary.inactive;
    default:
      return null;
  }
}

export function matchesFilter(filterKey: string, pool: PoolRow): boolean {
  if (filterKey === 'all') return true;
  const filter = POOL_FILTERS.find((entry) => entry.key === filterKey);
  if (!filter || filter.states.length === 0) return true;
  return filter.states.includes(stateOf(pool));
}

/**
 * Why availability is not shown on a pool entry.
 *
 * <p>The page rendered an "Available" / "Unavailable" badge from `TalentPoolEntry.isAvailable`.
 * That field defaults to `true` and the only code that touches it is the DynamoDB mapper
 * reading and writing its own copy — no service sets it false, ever. So the badge asserted that
 * every person in every pool was available, including anyone hired two years ago.
 *
 * <p>Exported as a string rather than left as a comment because the page has to say something in
 * that column, and what it says should be the reason.
 */
export const AVAILABILITY_NOT_TRACKED =
  'Availability is not tracked — nothing in the product records when someone stops looking.';
