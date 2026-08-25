/**
 * Derivations for the agency panel.
 *
 * <p>The panel exists to fill roles, so the two things it is judged on are <b>whether the contract
 * is live</b> and <b>whether the agency places anybody</b>. Neither was on the list: the row showed
 * a name, a contact and a status pill, while `feePercentage`, `beeLevel` and
 * `contractEndDate` were reachable only by opening the edit form.
 *
 * <p><b>Contract state is computed against today.</b> `contractEndDate` is stored,
 * editable, and compared to the current date nowhere in the product. An agency whose contract ended
 * seventy days ago keeps submitting candidates and nothing says so — and a placement made under a
 * lapsed contract has no agreed fee.
 */

/** As `GET /api/agencies` now returns each row. */
export interface AgencyRow {
  id: string | number;
  agencyName: string;
  registrationNumber?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  specializations?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED' | 'TERMINATED';
  feePercentage?: number | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  beeLevel?: number | null;
  contractState?: ContractState;
  daysUntilExpiry?: number | null;
  daysSinceLapse?: number | null;
  totalSubmissions?: number;
  acceptedSubmissions?: number;
  placementRate?: number | null;
  submissionsSinceLapse?: number | null;
  awaitingReview?: number;
  medianReviewDays?: number | null;
  oldestAwaitingDays?: number | null;
}

/**
 * What state the relationship is in.
 *
 * <p>There is no `EXPIRED` in `AgencyStatus` — its values are
 * `PENDING_APPROVAL`, `APPROVED`, `SUSPENDED`, `TERMINATED`. A lapsed contract is
 * therefore an approved agency with a past end date. The mock's "Active" chip has to filter on
 * `APPROVED`; filtering on a token the enum does not contain matches nothing and reads as
 * "no agencies are active".
 */
export type ContractState =
  | 'LAPSED'
  | 'EXPIRING_SOON'
  | 'IN_CONTRACT'
  | 'NO_END_DATE'
  | 'SUSPENDED'
  | 'PENDING_APPROVAL'
  | 'TERMINATED';

/** Whole-panel counts, as `GET /api/agencies/summary` returns them. */
export interface AgencySummary {
  agencies: number;
  inContract: number;
  lapsed: number;
  expiringSoon: number;
  noEndDate: number;
  suspended: number;
  pendingApproval: number;
  terminated: number;
  submissionsOnLapsedContracts: number;
  awaitingReview: number;
  totalSubmissions: number;
  medianReviewDays?: number | null;
  longestLapsedAgencyId?: string | null;
  longestLapsedDays?: number | null;
}

/** Guards the fetch boundary — an error body is an object too and would render as zeroes. */
export function isAgencySummary(value: unknown): value is AgencySummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.agencies === 'number' &&
    typeof candidate.lapsed === 'number' &&
    typeof candidate.submissionsOnLapsedContracts === 'number'
  );
}

/**
 * The contract state for a row.
 *
 * <p>Prefers the server's derivation and falls back to computing it here, so a row that arrives from
 * an older payload still says something true rather than nothing.
 */
export function stateOf(agency: AgencyRow, now: Date = new Date()): ContractState {
  if (agency.contractState) return agency.contractState;

  if (agency.status === 'SUSPENDED') return 'SUSPENDED';
  if (agency.status === 'TERMINATED') return 'TERMINATED';
  if (agency.status !== 'APPROVED') return 'PENDING_APPROVAL';

  if (!agency.contractEndDate) return 'NO_END_DATE';
  const end = new Date(agency.contractEndDate);
  if (Number.isNaN(end.getTime())) return 'NO_END_DATE';

  const days = Math.floor((end.getTime() - startOfDay(now).getTime()) / 86_400_000);
  if (days < 0) return 'LAPSED';
  if (days <= EXPIRY_WARNING_DAYS) return 'EXPIRING_SOON';
  return 'IN_CONTRACT';
}

/** Matches `AgencyResponse.EXPIRY_WARNING_DAYS` — long enough to run a renewal through procurement. */
export const EXPIRY_WARNING_DAYS = 60;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export const STATE_LABELS: Record<ContractState, string> = {
  LAPSED: 'Contract lapsed',
  EXPIRING_SOON: 'Expiring',
  IN_CONTRACT: 'In contract',
  NO_END_DATE: 'No end date',
  SUSPENDED: 'Suspended',
  PENDING_APPROVAL: 'Awaiting approval',
  TERMINATED: 'Terminated',
};

/** Whether this state means the agency can still put candidates forward. */
export function canStillSubmit(state: ContractState): boolean {
  return state === 'LAPSED' || state === 'EXPIRING_SOON' || state === 'IN_CONTRACT'
    || state === 'NO_END_DATE';
}

/**
 * When the contract ends, in the row's own words.
 *
 * <p>"Not recorded" is returned as itself. `contractEndDate` is optional, so an agency can
 * sit on the panel indefinitely and never appear in any expiry check — hiding that would hide the
 * gap.
 */
export function contractLabel(agency: AgencyRow, now: Date = new Date()): string {
  const state = stateOf(agency, now);
  if (state === 'NO_END_DATE') return 'Not recorded';
  if (state === 'SUSPENDED') return 'Blocked from submitting';
  if (state === 'PENDING_APPROVAL') return 'Not yet approved';
  if (state === 'TERMINATED') return 'Ended';

  const days = agency.daysSinceLapse ?? agency.daysUntilExpiry;
  if (days === null || days === undefined) return 'Not recorded';

  if (state === 'LAPSED') return `Lapsed ${days} day${days === 1 ? '' : 's'} ago`;
  if (state === 'EXPIRING_SOON') {
    return days === 0 ? 'Ends today' : `${days} day${days === 1 ? '' : 's'} left`;
  }
  return 'In contract';
}

/**
 * Placement rate as a percentage, or null when the agency has never submitted anything.
 *
 * <p>Null rather than zero. An agency that has submitted nothing has no placement rate; showing 0%
 * ranks it alongside one that has sent twenty-two candidates and placed two, which is the opposite
 * of the truth. A genuine nought — submissions made, none accepted — is still shown as 0%.
 */
export function placementRate(agency: AgencyRow): number | null {
  if (agency.placementRate !== null && agency.placementRate !== undefined) {
    return agency.placementRate;
  }
  const total = agency.totalSubmissions ?? 0;
  if (total === 0) return null;
  return ((agency.acceptedSubmissions ?? 0) / total) * 100;
}

/** "31% · 9 of 29", or null when nothing has been submitted. */
export function placementLabel(agency: AgencyRow): string | null {
  const rate = placementRate(agency);
  if (rate === null) return null;
  return `${Math.round(rate)}% · ${agency.acceptedSubmissions ?? 0} of ${agency.totalSubmissions ?? 0}`;
}

/**
 * The fee, or null when it is not recorded.
 *
 * <p>Shown beside the placement rate because neither number means anything alone: 18% at a 9%
 * placement rate and 12.5% at 31% are not close decisions once they are on the same row.
 */
export function feeLabel(agency: AgencyRow): string | null {
  const fee = agency.feePercentage;
  if (fee === null || fee === undefined) return null;
  return `${fee}%`;
}

/**
 * B-BBEE level, or the string "Not recorded".
 *
 * <p>First-class on the record and correct for a South African development-finance client with
 * procurement obligations, so it belongs where panel decisions are made rather than in an edit
 * form. Absence is shown as itself rather than as a blank or a zero.
 */
export function beeLabel(agency: AgencyRow): string {
  const level = agency.beeLevel;
  if (level === null || level === undefined) return 'Not recorded';
  return `Level ${level}`;
}

/**
 * Order by what needs attention.
 *
 * <p>Lapsed first, longest lapse leading, then contracts about to expire, then everything else by
 * placement rate — because once nothing is on fire, the question is who is actually filling roles.
 */
const STATE_RANK: Record<ContractState, number> = {
  LAPSED: 0,
  EXPIRING_SOON: 1,
  NO_END_DATE: 2,
  IN_CONTRACT: 3,
  SUSPENDED: 4,
  PENDING_APPROVAL: 5,
  TERMINATED: 6,
};

export function byContractState<T extends AgencyRow>(agencies: T[], now: Date = new Date()): T[] {
  return [...agencies].sort((a, b) => {
    const rankDiff = STATE_RANK[stateOf(a, now)] - STATE_RANK[stateOf(b, now)];
    if (rankDiff !== 0) return rankDiff;

    const aLapse = a.daysSinceLapse ?? 0;
    const bLapse = b.daysSinceLapse ?? 0;
    if (aLapse !== bLapse) return bLapse - aLapse;

    const aRate = placementRate(a);
    const bRate = placementRate(b);
    // An agency with no rate sorts last within its group — an unknown figure is not a good one.
    if (aRate === null && bRate === null) return a.agencyName.localeCompare(b.agencyName);
    if (aRate === null) return 1;
    if (bRate === null) return -1;
    if (aRate !== bRate) return bRate - aRate;
    return a.agencyName.localeCompare(b.agencyName);
  });
}

/** The filter chips, each carrying the states it selects. */
export const AGENCY_FILTERS: { key: string; label: string; states: ContractState[] }[] = [
  { key: 'all', label: 'All', states: [] },
  { key: 'lapsed', label: 'Contract lapsed', states: ['LAPSED'] },
  { key: 'expiring', label: 'Expiring', states: ['EXPIRING_SOON'] },
  // "Active" filters on APPROVED-derived states. There is no ACTIVE in AgencyStatus, so a chip
  // matching on that token would match nothing and read as "no agencies are active".
  { key: 'active', label: 'In contract', states: ['IN_CONTRACT', 'EXPIRING_SOON', 'NO_END_DATE'] },
  { key: 'suspended', label: 'Suspended', states: ['SUSPENDED'] },
];

export function filterCount(summary: AgencySummary | null, filterKey: string): number | null {
  if (!summary) return null;
  switch (filterKey) {
    case 'all':
      return summary.agencies;
    case 'lapsed':
      return summary.lapsed;
    case 'expiring':
      return summary.expiringSoon;
    case 'active':
      // inContract already includes the expiring ones — the warning is about the decision owed, not
      // about the agency having stopped being able to work.
      return summary.inContract + summary.noEndDate;
    case 'suspended':
      return summary.suspended;
    default:
      return null;
  }
}

export function matchesFilter(filterKey: string, agency: AgencyRow, now: Date = new Date()): boolean {
  if (filterKey === 'all') return true;
  const filter = AGENCY_FILTERS.find((entry) => entry.key === filterKey);
  if (!filter || filter.states.length === 0) return true;
  return filter.states.includes(stateOf(agency, now));
}

/**
 * Why no rand figure appears anywhere on this page.
 *
 * <p>Cost of a placement needs `feePercentage` against the placed candidate's offer
 * salary. Both exist, in different aggregates, with no join between them. The percentage is honest;
 * a rand total would be invented.
 */
export const NO_RAND_FIGURE =
  'Fees are shown as percentages. What a placement cost in rands needs the placed candidate’s offer salary, which is not joined to the agency record.';
