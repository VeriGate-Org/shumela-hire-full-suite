import {
  POOL_FILTERS,
  PoolRow,
  PoolSummary,
  STALE_POOL_DAYS,
  autoAddedShare,
  byOldestMedian,
  filterCount,
  isPoolSummary,
  isStale,
  matchesFilter,
  medianAgeLabel,
  oldestEntryLabel,
  sourceSummary,
  stateOf,
} from '../library';

const NOW = new Date('2026-08-25T12:00:00');

function pool(overrides: Partial<PoolRow> = {}): PoolRow {
  return {
    id: 'p1',
    poolName: 'Rejected — Investment Analyst',
    isActive: true,
    autoAddEnabled: false,
    entryCount: 10,
    medianEntryAgeDays: 30,
    ...overrides,
  };
}

describe('stateOf', () => {
  it('flags a pool that fills itself and nobody reads', () => {
    // The one state that gets worse on its own.
    expect(stateOf(pool({ autoAddEnabled: true, medianEntryAgeDays: 520 }))).toBe(
      'growing-unattended',
    );
  });

  it('separates stale from auto-adding, because they are different decisions', () => {
    expect(stateOf(pool({ autoAddEnabled: false, medianEntryAgeDays: 520 }))).toBe('stale');
    expect(stateOf(pool({ autoAddEnabled: true, medianEntryAgeDays: 40 }))).toBe('auto-adding');
    expect(stateOf(pool({ autoAddEnabled: false, medianEntryAgeDays: 40 }))).toBe('curated');
  });

  it('reports a switched-off pool as switched off, whatever else is true of it', () => {
    // It still holds its people, which is why it is reported at all — but it is not accumulating
    // anybody, so it cannot be growing unattended.
    expect(stateOf(pool({ isActive: false, autoAddEnabled: true, medianEntryAgeDays: 900 }))).toBe(
      'inactive',
    );
  });

  it('calls an empty pool empty rather than curated', () => {
    expect(stateOf(pool({ entryCount: 0, medianEntryAgeDays: null }))).toBe('empty');
  });

  it('reads a missing isActive as active, not as switched off', () => {
    expect(stateOf(pool({ isActive: undefined }))).toBe('curated');
  });
});

describe('isStale', () => {
  it('includes the threshold itself', () => {
    expect(isStale(pool({ medianEntryAgeDays: STALE_POOL_DAYS }))).toBe(true);
    expect(isStale(pool({ medianEntryAgeDays: STALE_POOL_DAYS - 1 }))).toBe(false);
  });

  it('is false when there is no median, rather than flagging on absence', () => {
    // An empty pool has nothing in it to have gone off.
    expect(isStale(pool({ medianEntryAgeDays: null }))).toBe(false);
    expect(isStale(pool({ medianEntryAgeDays: undefined }))).toBe(false);
  });
});

describe('medianAgeLabel', () => {
  it('renders in the unit the decision is made in', () => {
    expect(medianAgeLabel(pool({ medianEntryAgeDays: 3 }))).toBe('3 days');
    expect(medianAgeLabel(pool({ medianEntryAgeDays: 120 }))).toBe('4 months');
    expect(medianAgeLabel(pool({ medianEntryAgeDays: 510 }))).toBe('17 months');
    expect(medianAgeLabel(pool({ medianEntryAgeDays: 1100 }))).toBe('3 years');
  });

  it('is null for an empty pool rather than "0 days"', () => {
    // Zero days would read as "everyone was added today", the opposite of the truth.
    expect(medianAgeLabel(pool({ medianEntryAgeDays: null }))).toBeNull();
  });
});

describe('oldestEntryLabel', () => {
  it('describes how long the oldest person has been sitting there', () => {
    expect(oldestEntryLabel(pool({ oldestEntryAt: '2023-08-25T12:00:00' }), NOW)).toBe('3 years');
  });

  it('is null when unknown or unparseable', () => {
    expect(oldestEntryLabel(pool({ oldestEntryAt: null }), NOW)).toBeNull();
    expect(oldestEntryLabel(pool({ oldestEntryAt: 'nonsense' }), NOW)).toBeNull();
  });
});

describe('sourceSummary and autoAddedShare', () => {
  it('says how people got in, largest source first', () => {
    expect(
      sourceSummary(pool({ bySource: { MANUAL: 18, AUTO_REJECTED: 129 } })),
    ).toBe('129 auto · 18 manual');
  });

  it('names an unrecorded source rather than dropping it', () => {
    expect(sourceSummary(pool({ bySource: { UNKNOWN: 4 } }))).toBe('4 unrecorded');
  });

  it('is null when the split is unknown, not an empty string', () => {
    expect(sourceSummary(pool({ bySource: undefined }))).toBeNull();
    expect(sourceSummary(pool({ bySource: {} }))).toBeNull();
  });

  it('measures what share arrived automatically', () => {
    // 88% auto-added rejections is a rejection log, not a bench.
    expect(autoAddedShare(pool({ bySource: { AUTO_REJECTED: 129, MANUAL: 18 } }))).toBeCloseTo(
      0.878,
      2,
    );
    expect(autoAddedShare(pool({ bySource: { MANUAL: 27 } }))).toBe(0);
    expect(autoAddedShare(pool({ bySource: undefined }))).toBeNull();
  });
});

describe('byOldestMedian', () => {
  it('puts the stalest pool first', () => {
    const pools = [
      pool({ id: 'fresh', poolName: 'Fresh', medianEntryAgeDays: 60 }),
      pool({ id: 'stalest', poolName: 'Stalest', medianEntryAgeDays: 520 }),
      pool({ id: 'middling', poolName: 'Middling', medianEntryAgeDays: 240 }),
    ];
    expect(byOldestMedian(pools).map((p) => p.id)).toEqual(['stalest', 'middling', 'fresh']);
  });

  it('sorts a pool with no median last, not first', () => {
    const pools = [
      pool({ id: 'empty', poolName: 'Empty', medianEntryAgeDays: null }),
      pool({ id: 'has-people', poolName: 'Has people', medianEntryAgeDays: 5 }),
    ];
    expect(byOldestMedian(pools).map((p) => p.id)).toEqual(['has-people', 'empty']);
  });

  it('does not mutate the array it was given', () => {
    const pools = [
      pool({ id: 'a', medianEntryAgeDays: 10 }),
      pool({ id: 'b', medianEntryAgeDays: 900 }),
    ];
    byOldestMedian(pools);
    expect(pools.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('filterCount', () => {
  const summary: PoolSummary = {
    pools: 7,
    active: 6,
    inactive: 1,
    autoAdding: 3,
    stale: 2,
    growingUnattended: 2,
    entriesHeld: 412,
    oldestMedianDays: 520,
    oldestMedianPoolId: 'p1',
  };

  it('reads each chip off the whole-set summary', () => {
    expect(filterCount(summary, 'all')).toBe(7);
    expect(filterCount(summary, 'growing-unattended')).toBe(2);
    expect(filterCount(summary, 'stale')).toBe(2);
    expect(filterCount(summary, 'auto-adding')).toBe(3);
    expect(filterCount(summary, 'inactive')).toBe(1);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'stale')).toBeNull();
  });

  it('covers every chip', () => {
    POOL_FILTERS.forEach((filter) => expect(filterCount(summary, filter.key)).not.toBeNull());
  });
});

describe('matchesFilter', () => {
  it('counts a growing-unattended pool as both stale and auto-adding', () => {
    // It is both. A chip that excluded it would under-report the very pools it exists to find.
    const bad = pool({ autoAddEnabled: true, medianEntryAgeDays: 520 });
    expect(matchesFilter('stale', bad)).toBe(true);
    expect(matchesFilter('auto-adding', bad)).toBe(true);
    expect(matchesFilter('growing-unattended', bad)).toBe(true);
  });

  it('does not let a current pool through the stale chip', () => {
    expect(matchesFilter('stale', pool({ medianEntryAgeDays: 30 }))).toBe(false);
  });
});

describe('isPoolSummary', () => {
  it('rejects a payload that is truthy but not a summary', () => {
    expect(isPoolSummary({ error: 'Internal server error' })).toBe(false);
    expect(isPoolSummary(null)).toBe(false);
  });

  it('accepts the real shape', () => {
    expect(isPoolSummary({ pools: 7, stale: 2, growingUnattended: 2 })).toBe(true);
  });
});
