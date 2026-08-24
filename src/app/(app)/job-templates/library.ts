/**
 * Derivations for the template library.
 *
 * <p>The question this page exists to answer is <b>which of the library is load-bearing</b>. A
 * template that has produced thirty-one adverts matters more than one that has produced none,
 * because every advert it writes carries whatever is wrong with it.
 *
 * <p><b>There is deliberately no "overdue revision" state here.</b> The design proposed one — in
 * use, and unrevised for twelve months — but twelve months was a guess, and a template labelled
 * overdue against an invented review cycle is worse than one not labelled at all. It goes in when
 * there is a real cycle to measure against.
 */

export interface TemplateRow {
  id: string;
  name: string;
  usageCount?: number;
  isArchived?: boolean;
  // No updatedAt: the only thing it was for was the overdue-revision state, and that is
  // deliberately absent until there is a real review cycle to measure against.
}

/** What this template is, in terms of what it is doing for the tenant. */
export type TemplateState = 'in-use' | 'never-used' | 'archived';

export function stateOf(row: TemplateRow): TemplateState {
  if (row.isArchived) return 'archived';
  return (row.usageCount ?? 0) > 0 ? 'in-use' : 'never-used';
}

export const STATE_LABELS: Record<TemplateState, string> = {
  'in-use': 'In use',
  'never-used': 'Never used',
  archived: 'Archived',
};

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

/** Counts describing the library, derived from the rows the API returns. */
export interface LibraryCounts {
  total: number;
  inUse: number;
  neverUsed: number;
  archived: number;
  advertsGenerated: number;
}

export function countLibrary(rows: TemplateRow[]): LibraryCounts {
  const counts: LibraryCounts = {
    total: rows.length,
    inUse: 0,
    neverUsed: 0,
    archived: 0,
    advertsGenerated: 0,
  };
  for (const row of rows) {
    const state = stateOf(row);
    if (state === 'archived') counts.archived++;
    else if (state === 'in-use') counts.inUse++;
    else counts.neverUsed++;
    counts.advertsGenerated += advertsProduced(row) ?? 0;
  }
  return counts;
}

/** The filter chips, each carrying the states it selects. */
export const LIBRARY_FILTERS: { key: string; label: string; states: TemplateState[] }[] = [
  { key: 'active', label: 'In use', states: ['in-use'] },
  { key: 'all', label: 'All', states: [] },
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
