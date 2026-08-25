import {
  AGENCY_FILTERS,
  AgencyRow,
  AgencySummary,
  EXPIRY_WARNING_DAYS,
  beeLabel,
  byContractState,
  canStillSubmit,
  contractLabel,
  feeLabel,
  filterCount,
  isAgencySummary,
  matchesFilter,
  placementLabel,
  placementRate,
  stateOf,
} from '../queue';

const NOW = new Date('2026-08-25T12:00:00');

function daysFromNow(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function agency(overrides: Partial<AgencyRow> = {}): AgencyRow {
  return {
    id: 'a1',
    agencyName: 'Sasekile Talent Partners',
    status: 'APPROVED',
    ...overrides,
  };
}

describe('stateOf', () => {
  it('derives a lapse from the stored end date', () => {
    // Nothing in the product compared this date to today.
    expect(stateOf(agency({ contractEndDate: daysFromNow(-24) }), NOW)).toBe('LAPSED');
  });

  it('separates a renewal decision from a lapse', () => {
    expect(stateOf(agency({ contractEndDate: daysFromNow(37) }), NOW)).toBe('EXPIRING_SOON');
    expect(stateOf(agency({ contractEndDate: daysFromNow(200) }), NOW)).toBe('IN_CONTRACT');
  });

  it('treats a contract ending today as still live', () => {
    // It runs to the end of its last day. Calling it lapsed that morning would block an agency
    // still entitled to submit.
    expect(stateOf(agency({ contractEndDate: daysFromNow(0) }), NOW)).toBe('EXPIRING_SOON');
  });

  it('warns exactly at the threshold', () => {
    expect(stateOf(agency({ contractEndDate: daysFromNow(EXPIRY_WARNING_DAYS) }), NOW)).toBe(
      'EXPIRING_SOON',
    );
    expect(stateOf(agency({ contractEndDate: daysFromNow(EXPIRY_WARNING_DAYS + 1) }), NOW)).toBe(
      'IN_CONTRACT',
    );
  });

  it('reports a missing end date as its own state', () => {
    expect(stateOf(agency({ contractEndDate: null }), NOW)).toBe('NO_END_DATE');
    expect(stateOf(agency({ contractEndDate: 'nonsense' }), NOW)).toBe('NO_END_DATE');
  });

  it('lets status outrank the date', () => {
    // Reporting a suspended agency as lapsed would bury the reason it cannot submit.
    expect(stateOf(agency({ status: 'SUSPENDED', contractEndDate: daysFromNow(-300) }), NOW)).toBe(
      'SUSPENDED',
    );
    expect(stateOf(agency({ status: 'TERMINATED', contractEndDate: daysFromNow(300) }), NOW)).toBe(
      'TERMINATED',
    );
    expect(
      stateOf(agency({ status: 'PENDING_APPROVAL', contractEndDate: daysFromNow(300) }), NOW),
    ).toBe('PENDING_APPROVAL');
  });

  it('prefers the state the server already derived', () => {
    expect(stateOf(agency({ contractState: 'LAPSED', contractEndDate: daysFromNow(900) }), NOW)).toBe(
      'LAPSED',
    );
  });
});

describe('canStillSubmit', () => {
  it('says the quiet part: a lapsed contract does not stop anyone submitting', () => {
    // Nothing blocks submission at expiry, which is exactly why the state has to be shown.
    expect(canStillSubmit('LAPSED')).toBe(true);
    expect(canStillSubmit('NO_END_DATE')).toBe(true);
    expect(canStillSubmit('SUSPENDED')).toBe(false);
    expect(canStillSubmit('TERMINATED')).toBe(false);
  });
});

describe('contractLabel', () => {
  it('says how long ago it lapsed', () => {
    expect(contractLabel(agency({ contractState: 'LAPSED', daysSinceLapse: 24 }), NOW)).toBe(
      'Lapsed 24 days ago',
    );
    expect(contractLabel(agency({ contractState: 'LAPSED', daysSinceLapse: 1 }), NOW)).toBe(
      'Lapsed 1 day ago',
    );
  });

  it('counts down to a renewal decision', () => {
    expect(contractLabel(agency({ contractState: 'EXPIRING_SOON', daysUntilExpiry: 37 }), NOW)).toBe(
      '37 days left',
    );
    expect(contractLabel(agency({ contractState: 'EXPIRING_SOON', daysUntilExpiry: 0 }), NOW)).toBe(
      'Ends today',
    );
  });

  it('shows "Not recorded" as itself', () => {
    // An agency with no end date never appears in any expiry check. Hiding that hides the gap.
    expect(contractLabel(agency({ contractEndDate: null }), NOW)).toBe('Not recorded');
  });
});

describe('placementRate', () => {
  it('is null when nothing has ever been submitted, not zero', () => {
    // 0% would rank a brand-new agency alongside one that has sent twenty-two and placed two.
    expect(placementRate(agency({ totalSubmissions: 0 }))).toBeNull();
    expect(placementLabel(agency({ totalSubmissions: 0 }))).toBeNull();
  });

  it('reports a genuine nought as nought', () => {
    expect(placementRate(agency({ totalSubmissions: 18, acceptedSubmissions: 0 }))).toBe(0);
    expect(placementLabel(agency({ totalSubmissions: 18, acceptedSubmissions: 0 }))).toBe(
      '0% · 0 of 18',
    );
  });

  it('states the rate with the counts behind it', () => {
    expect(placementLabel(agency({ totalSubmissions: 29, acceptedSubmissions: 9 }))).toBe(
      '31% · 9 of 29',
    );
  });

  it('prefers the server figure', () => {
    expect(placementRate(agency({ placementRate: 12.5, totalSubmissions: 0 }))).toBe(12.5);
  });
});

describe('feeLabel and beeLabel', () => {
  it('renders the fee as a percentage, or nothing at all', () => {
    expect(feeLabel(agency({ feePercentage: 12.5 }))).toBe('12.5%');
    expect(feeLabel(agency({ feePercentage: null }))).toBeNull();
  });

  it('says "Not recorded" rather than blank or zero for B-BBEE', () => {
    expect(beeLabel(agency({ beeLevel: 1 }))).toBe('Level 1');
    expect(beeLabel(agency({ beeLevel: null }))).toBe('Not recorded');
    expect(beeLabel(agency())).toBe('Not recorded');
  });
});

describe('byContractState', () => {
  it('puts lapsed contracts first, longest lapse leading', () => {
    const rows = [
      agency({ id: 'ok', agencyName: 'Ok', contractState: 'IN_CONTRACT' }),
      agency({ id: 'recent', agencyName: 'Recent', contractState: 'LAPSED', daysSinceLapse: 24 }),
      agency({ id: 'worst', agencyName: 'Worst', contractState: 'LAPSED', daysSinceLapse: 70 }),
    ];
    expect(byContractState(rows, NOW).map((r) => r.id)).toEqual(['worst', 'recent', 'ok']);
  });

  it('ranks by placement rate once nothing is on fire', () => {
    const rows = [
      agency({
        id: 'poor',
        agencyName: 'Poor',
        contractState: 'IN_CONTRACT',
        totalSubmissions: 22,
        acceptedSubmissions: 2,
      }),
      agency({
        id: 'good',
        agencyName: 'Good',
        contractState: 'IN_CONTRACT',
        totalSubmissions: 27,
        acceptedSubmissions: 12,
      }),
    ];
    expect(byContractState(rows, NOW).map((r) => r.id)).toEqual(['good', 'poor']);
  });

  it('sorts an agency with no rate last within its group', () => {
    const rows = [
      agency({ id: 'unknown', agencyName: 'Unknown', contractState: 'IN_CONTRACT' }),
      agency({
        id: 'known',
        agencyName: 'Known',
        contractState: 'IN_CONTRACT',
        totalSubmissions: 10,
        acceptedSubmissions: 1,
      }),
    ];
    expect(byContractState(rows, NOW).map((r) => r.id)).toEqual(['known', 'unknown']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [
      agency({ id: 'a', contractState: 'IN_CONTRACT' }),
      agency({ id: 'b', contractState: 'LAPSED', daysSinceLapse: 5 }),
    ];
    byContractState(rows, NOW);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('filterCount', () => {
  const summary: AgencySummary = {
    agencies: 9,
    inContract: 6,
    lapsed: 2,
    expiringSoon: 1,
    noEndDate: 0,
    suspended: 1,
    pendingApproval: 0,
    terminated: 0,
    submissionsOnLapsedContracts: 11,
    awaitingReview: 23,
    totalSubmissions: 184,
    medianReviewDays: 9,
  };

  it('reads each chip off the whole-panel summary', () => {
    expect(filterCount(summary, 'all')).toBe(9);
    expect(filterCount(summary, 'lapsed')).toBe(2);
    expect(filterCount(summary, 'expiring')).toBe(1);
    expect(filterCount(summary, 'active')).toBe(6);
    expect(filterCount(summary, 'suspended')).toBe(1);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'lapsed')).toBeNull();
  });

  it('covers every chip', () => {
    AGENCY_FILTERS.forEach((filter) => expect(filterCount(summary, filter.key)).not.toBeNull());
  });
});

describe('matchesFilter', () => {
  it('counts an expiring contract as still in contract', () => {
    const expiring = agency({ contractState: 'EXPIRING_SOON' });
    expect(matchesFilter('active', expiring, NOW)).toBe(true);
    expect(matchesFilter('expiring', expiring, NOW)).toBe(true);
  });

  it('does not let a lapsed contract through the in-contract chip', () => {
    expect(matchesFilter('active', agency({ contractState: 'LAPSED' }), NOW)).toBe(false);
  });

  it('matches approved agencies, since there is no ACTIVE status to match on', () => {
    // AgencyStatus is PENDING_APPROVAL / APPROVED / SUSPENDED / TERMINATED. A chip filtering on
    // "ACTIVE" would match nothing and read as "no agencies are active".
    expect(matchesFilter('active', agency({ contractEndDate: daysFromNow(300) }), NOW)).toBe(true);
  });
});

describe('isAgencySummary', () => {
  it('rejects a payload that is truthy but not a summary', () => {
    expect(isAgencySummary({ error: 'Internal server error' })).toBe(false);
    expect(isAgencySummary(null)).toBe(false);
  });

  it('accepts the real shape', () => {
    expect(isAgencySummary({ agencies: 9, lapsed: 2, submissionsOnLapsedContracts: 11 })).toBe(true);
  });
});
