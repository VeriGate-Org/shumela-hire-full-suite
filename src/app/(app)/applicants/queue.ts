/**
 * Derivations for the candidate database.
 *
 * <p>The question this page exists to answer is <b>who keeps coming back</b>. Someone on their
 * fourth application is a different proposition from a first-time candidate, and the list could not
 * tell them apart: it showed a name, an email and a created date, while
 * `skills`, `experience`, `education` and `documents` all came back on
 * `ApplicantResponse` and were drawn nowhere.
 *
 * <p><b>Two figures of different kinds must not sit in one row of tiles.</b> The tiles beside
 * "Total Applicants" read In Screening, At Interview and Hired, and every one of them came from
 * `/api/applications/manage/statistics` — they count *applications*, under a total that
 * counts *people*. "Hired 34" meant thirty-four applications at HIRED, which is not thirty-four
 * people hired, and nothing on the page said so.
 */

/** What the list endpoint returns per row. */
export interface ApplicantRow {
  /**
   * The API returns a string id. The page's own interface declared `number`, which is
   * wrong but harmless while it is only ever interpolated — widened rather than corrected in place
   * so a numeric id from an older fixture still type-checks.
   */
  id: string | number;
  name: string;
  surname: string;
  email: string;
  phone?: string;
  createdAt: string;
  skills?: string;
  experience?: string;
  education?: string;
  documents?: { id: string; type?: string; filename?: string }[];
}

/** One applicant's history, as `GET /api/applicants/application-summaries` returns it. */
export interface ApplicationSummary {
  total: number;
  active: number;
  hired: boolean;
  lastAppliedAt?: string | null;
  byStatus?: Record<string, number>;
}

/** Whole-set counts, as `GET /api/applicants/summary` returns them. */
export interface ApplicantSummary {
  registered: number;
  neverApplied: number;
  appliedOnce: number;
  repeatApplicants: number;
  inProcessNow: number;
  previouslyHired: number;
  applicationsRecorded: number;
  orphanedApplications: number;
}

/**
 * Is this payload actually the whole-set summary?
 *
 * <p>Checked at the fetch boundary because a response that is merely truthy will throw on first
 * property access, and an error page rendering as a row of zeroes is the failure this whole
 * exercise exists to stop. The same guard on the offers queue caught a real crash.
 */
export function isApplicantSummary(value: unknown): value is ApplicantSummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.registered === 'number' &&
    typeof candidate.neverApplied === 'number' &&
    typeof candidate.appliedOnce === 'number' &&
    typeof candidate.repeatApplicants === 'number'
  );
}

/** Is this one applicant's history? Same reasoning as above, per entry in the batch. */
export function isApplicationSummary(value: unknown): value is ApplicationSummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.total === 'number' && typeof candidate.active === 'number';
}

/**
 * What this candidate is, in terms of their relationship with the organisation.
 *
 * <p>Ordered by what a recruiter needs to know first. Previously hired outranks in-process because
 * a returning employee changes the conversation before their current application does.
 */
export type ApplicantState = 'unknown' | 'never-applied' | 'previously-hired' | 'in-process' | 'past-applicant';

export function stateOf(summary: ApplicationSummary | null | undefined): ApplicantState {
  // No summary is not "never applied" — it is "we did not load it". Conflating the two would
  // report a whole page as fresh candidates the moment the batch call failed.
  if (!summary) return 'unknown';
  if (summary.total === 0) return 'never-applied';
  if (summary.hired) return 'previously-hired';
  if (summary.active > 0) return 'in-process';
  return 'past-applicant';
}

export const STATE_LABELS: Record<ApplicantState, string> = {
  unknown: 'History not loaded',
  'never-applied': 'Registered, never applied',
  'previously-hired': 'Previously hired',
  'in-process': 'In process',
  'past-applicant': 'Applied before',
};

/**
 * How many times this person has applied, or null when that is not known.
 *
 * <p>Null rather than zero, because zero is a real and different answer — it means registered and
 * never applied, which is a segment worth seeing.
 */
export function timesApplied(summary: ApplicationSummary | null | undefined): number | null {
  return summary ? summary.total : null;
}

/** Has this person applied more than once? Null when unknown, so callers cannot read it as "no". */
export function isRepeatApplicant(summary: ApplicationSummary | null | undefined): boolean | null {
  return summary ? summary.total > 1 : null;
}

/**
 * A one-line description of the history, for the row.
 *
 * <p>Returns null rather than a placeholder when nothing is known, so the caller decides how to say
 * "not loaded" in its own voice.
 */
export function historyLabel(summary: ApplicationSummary | null | undefined): string | null {
  if (!summary) return null;
  if (summary.total === 0) return 'No applications';

  const parts = [`${summary.total} application${summary.total === 1 ? '' : 's'}`];
  if (summary.active > 0) parts.push(`${summary.active} live`);
  if (summary.hired) parts.push('hired');
  return parts.join(' · ');
}

/**
 * When they last applied, as a short date, or null if never or unknown.
 *
 * <p>An unparseable date returns null rather than "Invalid Date" — a broken timestamp should look
 * absent, not authoritative.
 */
export function lastAppliedLabel(summary: ApplicationSummary | null | undefined): string | null {
  if (!summary?.lastAppliedAt) return null;
  const applied = new Date(summary.lastAppliedAt);
  if (Number.isNaN(applied.getTime())) return null;
  return applied.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * The skills this applicant listed, split for display.
 *
 * <p>`skills` is one free-text field, so this is a presentation split and nothing more —
 * no matching, no scoring, no normalising. Returns an empty array when the field is absent or
 * blank, so a candidate with nothing recorded renders as nothing rather than as one empty chip.
 */
export function skillList(row: ApplicantRow): string[] {
  if (!row.skills) return [];
  return row.skills
    .split(/[,;\n]/)
    .map((skill) => skill.trim())
    .filter(Boolean);
}

/** How many documents are on file, or null when the list endpoint did not include them. */
export function documentCount(row: ApplicantRow): number | null {
  return Array.isArray(row.documents) ? row.documents.length : null;
}

/** The filter chips, each carrying the states it selects. */
export const APPLICANT_FILTERS: { key: string; label: string; states: ApplicantState[] }[] = [
  { key: 'all', label: 'All', states: [] },
  { key: 'repeat', label: 'Applied 2+ times', states: [] },
  { key: 'in-process', label: 'In process now', states: ['in-process'] },
  { key: 'previously-hired', label: 'Previously hired', states: ['previously-hired'] },
  { key: 'never-applied', label: 'Registered, never applied', states: ['never-applied'] },
];

/**
 * The count for a chip, taken from the whole-set summary.
 *
 * <p>Null without a summary rather than zero. A chip reading "0" asserts that the segment is empty;
 * a chip with no number says only that the figure has not arrived, which is the truth when the
 * summary call fails.
 */
export function filterCount(summary: ApplicantSummary | null, filterKey: string): number | null {
  if (!summary) return null;
  switch (filterKey) {
    case 'all':
      return summary.registered;
    case 'repeat':
      return summary.repeatApplicants;
    case 'in-process':
      return summary.inProcessNow;
    case 'previously-hired':
      return summary.previouslyHired;
    case 'never-applied':
      return summary.neverApplied;
    default:
      return null;
  }
}

/** Does a row match a chip, given what is known about it? */
export function matchesFilter(
  filterKey: string,
  summary: ApplicationSummary | null | undefined,
): boolean {
  if (filterKey === 'all') return true;
  if (filterKey === 'repeat') return isRepeatApplicant(summary) === true;
  const filter = APPLICANT_FILTERS.find((entry) => entry.key === filterKey);
  if (!filter || filter.states.length === 0) return true;
  return filter.states.includes(stateOf(summary));
}

/**
 * The sort orders the list actually supports.
 *
 * <p>The page rendered a four-option sort dropdown with no `onChange` handler at all —
 * choosing "Name A-Z" did nothing and gave no sign that it had done nothing. These are the
 * `sort`/`direction` pairs `GET /api/applicants` accepts, so every option
 * here can be honoured.
 */
export const APPLICANT_SORTS: { key: string; label: string; sort: string; direction: 'asc' | 'desc' }[] = [
  { key: 'createdAt-desc', label: 'Newest first', sort: 'createdAt', direction: 'desc' },
  { key: 'createdAt-asc', label: 'Oldest first', sort: 'createdAt', direction: 'asc' },
  { key: 'name-asc', label: 'Name A–Z', sort: 'name', direction: 'asc' },
  { key: 'name-desc', label: 'Name Z–A', sort: 'name', direction: 'desc' },
];

export function sortFor(key: string): { sort: string; direction: 'asc' | 'desc' } {
  const match = APPLICANT_SORTS.find((entry) => entry.key === key);
  return match
    ? { sort: match.sort, direction: match.direction }
    : { sort: 'createdAt', direction: 'desc' };
}

/**
 * The ids to ask the batch endpoint about, capped to what it will accept.
 *
 * <p>`MAX_SUMMARY_BATCH` is 100 server-side and requesting more is rejected outright
 * rather than truncated. A page is twenty, so this never bites in practice — it is here so that a
 * caller raising the page size gets a short answer instead of a 400.
 */
export const MAX_SUMMARY_BATCH = 100;

export function summaryIds(rows: ApplicantRow[]): string[] {
  return rows
    .map((row) => String(row.id))
    .filter((id) => id && id !== 'undefined' && id !== 'null')
    .slice(0, MAX_SUMMARY_BATCH);
}
