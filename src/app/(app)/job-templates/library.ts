/**
 * Derivations for the template library.
 *
 * <p>The question this page exists to answer is <b>which of the library is load-bearing</b>. A
 * template that has produced thirty-one adverts matters more than one that has produced none,
 * because every advert it writes carries whatever is wrong with it.
 *
 * <p>The revision cycle is <b>twelve months</b>, confirmed rather than assumed: it lines up with
 * the employment-equity reporting year, which is when advert wording gets looked at anyway. It is
 * a single constant here so changing it is one edit rather than a search.
 */

/**
 * How long a template in use may go unrevised before the library flags it.
 *
 * <p>Twelve months. Not a guess — see the note at the head of this file. Only templates that are
 * actually producing adverts are ever flagged: a template nobody draws on carries no risk, and
 * flagging it would bury the ones that do.
 */
export const REVISION_CYCLE_MONTHS = 12;

export interface TemplateRow {
  id: string;
  name: string;
  usageCount?: number;
  isArchived?: boolean;
  /** A Date on JobAdTemplate, a string over the wire — both accepted rather than coerced blindly. */
  updatedAt?: string | Date;
}

/** What this template is, in terms of what it is doing for the tenant. */
export type TemplateState = 'in-use' | 'overdue-revision' | 'never-used' | 'archived';

export function stateOf(row: TemplateRow, now: Date = new Date()): TemplateState {
  if (row.isArchived) return 'archived';
  if ((row.usageCount ?? 0) === 0) return 'never-used';
  // In use and unrevised past the cycle. Checked after "never used" on purpose: a template that
  // has produced nothing cannot be overdue, because nothing depends on it being right.
  return isOverdueRevision(row, now) ? 'overdue-revision' : 'in-use';
}

export const STATE_LABELS: Record<TemplateState, string> = {
  'in-use': 'In use',
  'overdue-revision': 'Overdue revision',
  'never-used': 'Never used',
  archived: 'Archived',
};

/** When this template was last revised, or null if the date is missing or unreadable. */
export function lastRevised(row: TemplateRow): Date | null {
  if (!row.updatedAt) return null;
  const revised = row.updatedAt instanceof Date ? row.updatedAt : new Date(row.updatedAt);
  return Number.isNaN(revised.getTime()) ? null : revised;
}

/** Whole months since the last revision, or null when that is unknown. */
export function monthsSinceRevision(row: TemplateRow, now: Date = new Date()): number | null {
  const revised = lastRevised(row);
  if (!revised) return null;
  const months =
    (now.getFullYear() - revised.getFullYear()) * 12 + (now.getMonth() - revised.getMonth());
  // Same month counts as zero rather than negative, and a date in the future is not "overdue".
  return Math.max(0, months);
}

/**
 * Is this template in use and past its revision cycle?
 *
 * <p>False when the revision date is unknown. An unreadable date is not evidence of neglect, and
 * flagging on its absence would accuse a template of something nobody can check.
 */
export function isOverdueRevision(row: TemplateRow, now: Date = new Date()): boolean {
  if (row.isArchived) return false;
  if ((row.usageCount ?? 0) === 0) return false;
  const months = monthsSinceRevision(row, now);
  if (months === null) return false;
  return months >= REVISION_CYCLE_MONTHS;
}

/**
 * How many adverts this template has written.
 *
 * <p>Null when the field is absent rather than zero: "never used" is a claim about the template,
 * and it should not be made on the strength of a missing field.
 */
export function advertsProduced(row: TemplateRow): number | null {
  return typeof row.usageCount === 'number' ? row.usageCount : null;
}

/**
 * Order by how much work each template is doing.
 *
 * <p>Most adverts first, because that is the order in which they are worth reviewing. Templates
 * with no count at all sort last — an unknown figure is not a high one.
 */
export function byAdvertsProduced<T extends TemplateRow>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aCount = advertsProduced(a);
    const bCount = advertsProduced(b);
    if (aCount === null && bCount === null) return 0;
    if (aCount === null) return 1;
    if (bCount === null) return -1;
    if (aCount !== bCount) return bCount - aCount;
    return a.name.localeCompare(b.name);
  });
}

/**
 * The template carrying most of the library's output, if one clearly is.
 *
 * <p>Returned only when it has actually produced something and there is more than one template to
 * compare it against — "most used" of a library of one is not a finding.
 */
export function busiest<T extends TemplateRow>(rows: T[]): T | null {
  const active = rows.filter((row) => !row.isArchived);
  if (active.length < 2) return null;
  const ranked = byAdvertsProduced(active);
  const top = ranked[0];
  return (advertsProduced(top) ?? 0) > 0 ? top : null;
}

/**
 * Templates in use and past their revision cycle, most exposed first.
 *
 * <p>Ordered by adverts produced rather than by how overdue they are: a template that has written
 * thirty-one adverts and is a month past the line carries more risk than one that has written two
 * and is a year past it.
 */
export function overdueTemplates<T extends TemplateRow>(rows: T[], now: Date = new Date()): T[] {
  return byAdvertsProduced(rows.filter((row) => isOverdueRevision(row, now)));
}

/** Counts describing the library, derived from the rows the API returns. */
export interface LibraryCounts {
  total: number;
  inUse: number;
  overdueRevision: number;
  neverUsed: number;
  archived: number;
  advertsGenerated: number;
}

export function countLibrary(rows: TemplateRow[], now: Date = new Date()): LibraryCounts {
  const counts: LibraryCounts = {
    total: rows.length,
    inUse: 0,
    overdueRevision: 0,
    neverUsed: 0,
    archived: 0,
    advertsGenerated: 0,
  };
  for (const row of rows) {
    const state = stateOf(row, now);
    if (state === 'archived') counts.archived++;
    else if (state === 'never-used') counts.neverUsed++;
    else {
      // Overdue templates are in use as well — the flag is about the copy, not about whether the
      // template is doing work. Counting them separately without double-counting the total.
      counts.inUse++;
      if (state === 'overdue-revision') counts.overdueRevision++;
    }
    counts.advertsGenerated += advertsProduced(row) ?? 0;
  }
  return counts;
}

/** The filter chips, each carrying the states it selects. */
export const LIBRARY_FILTERS: { key: string; label: string; states: TemplateState[] }[] = [
  { key: 'active', label: 'In use', states: ['in-use', 'overdue-revision'] },
  { key: 'all', label: 'All', states: [] },
  { key: 'overdue', label: 'Overdue revision', states: ['overdue-revision'] },
  { key: 'never-used', label: 'Never used', states: ['never-used'] },
  { key: 'archived', label: 'Archived', states: ['archived'] },
];

export function filterCount(counts: LibraryCounts | null, filterKey: string): number | null {
  if (!counts) return null;
  switch (filterKey) {
    case 'active':
      return counts.inUse;
    case 'all':
      return counts.total;
    case 'overdue':
      return counts.overdueRevision;
    case 'never-used':
      return counts.neverUsed;
    case 'archived':
      return counts.archived;
    default:
      return null;
  }
}

/**
 * Whether the counts are worth showing at all.
 *
 * <p>On the demo tenant the seed sets `usageCount: 0` for every template, so every figure in the
 * "adverts produced" column reads zero and the ranking says nothing. Rather than presenting a
 * library that looks entirely unused, the page says the usage data is absent — which is true, and
 * distinguishable from a library nobody has drawn on.
 */
export function hasUsageData(rows: TemplateRow[]): boolean {
  return rows.some((row) => (advertsProduced(row) ?? 0) > 0);
}
