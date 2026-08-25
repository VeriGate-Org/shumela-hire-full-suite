import {
  QUEUE_FILTERS,
  RecommendationRow,
  RecommendationSummary,
  approvalLevel,
  bandPosition,
  bandScale,
  byLongestWaiting,
  canReturn,
  filterCount,
  isRecommendationSummary,
  matchesFilter,
  money,
  waitingDays,
} from '../queue';

const NOW = new Date('2026-08-25T12:00:00');

function daysAgo(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function row(overrides: Partial<RecommendationRow> = {}): RecommendationRow {
  return {
    id: 'sr1',
    recommendationNumber: 'SR-2026-0044',
    status: 'PENDING_APPROVAL',
    proposedMinSalary: 900_000,
    proposedMaxSalary: 1_450_000,
    ...overrides,
  };
}

describe('bandPosition', () => {
  it('catches a recommendation above the ceiling its own requester proposed', () => {
    // Invisible in a table of four amounts; the entire reason the scale exists.
    expect(bandPosition(row({ recommendedSalary: 1_480_000 }))).toBe('above');
  });

  it('reads within and below correctly', () => {
    expect(bandPosition(row({ recommendedSalary: 1_000_000 }))).toBe('within');
    expect(bandPosition(row({ recommendedSalary: 800_000 }))).toBe('below');
  });

  it('treats the bounds themselves as inside', () => {
    expect(bandPosition(row({ recommendedSalary: 900_000 }))).toBe('within');
    expect(bandPosition(row({ recommendedSalary: 1_450_000 }))).toBe('within');
  });

  it('says "not yet recommended" rather than implying a breach', () => {
    // The normal state of anything awaiting review. Reporting it as out-of-band would flag every
    // new request as a problem.
    expect(bandPosition(row({ recommendedSalary: null }))).toBe('unrecommended');
  });

  it('says so when no band was proposed, rather than guessing one', () => {
    expect(
      bandPosition(
        row({ proposedMinSalary: null, proposedMaxSalary: null, recommendedSalary: 5_000_000 }),
      ),
    ).toBe('no-band');
  });
});

describe('bandScale', () => {
  it('places each stored amount on the track', () => {
    const scale = bandScale(
      row({
        candidateCurrentSalary: 900_000,
        candidateExpectedSalary: 1_175_000,
        recommendedSalary: 1_450_000,
      }),
    );
    expect(scale?.markers.map((m) => Math.round(m.percent))).toEqual([0, 50, 100]);
  });

  it('omits a marker for an amount nobody recorded', () => {
    // A graduate has no current salary. A zero at the far left would be a fabricated fact.
    const scale = bandScale(row({ candidateCurrentSalary: null, recommendedSalary: 1_000_000 }));
    expect(scale?.markers.map((m) => m.key)).toEqual(['recommended']);
  });

  it('clamps an out-of-band marker into view but flags it as outside', () => {
    // The number stays true; only its position on the drawing is bounded.
    const scale = bandScale(row({ recommendedSalary: 2_000_000 }));
    const marker = scale?.markers.find((m) => m.key === 'recommended');
    expect(marker?.percent).toBe(100);
    expect(marker?.outside).toBe(true);
    expect(marker?.value).toBe(2_000_000);
  });

  it('is null when there is no band to draw against', () => {
    expect(bandScale(row({ proposedMinSalary: null }))).toBeNull();
    // A zero-width or inverted band cannot be drawn to scale.
    expect(bandScale(row({ proposedMinSalary: 900_000, proposedMaxSalary: 900_000 }))).toBeNull();
  });
});

describe('waitingDays', () => {
  it('measures an approval from when the number was recommended', () => {
    // The review time before that belonged to somebody else.
    const waiting = row({
      status: 'PENDING_APPROVAL',
      createdAt: daysAgo(40),
      recommendedAt: daysAgo(12),
      updatedAt: daysAgo(12),
    });
    expect(waitingDays(waiting, NOW)).toBe(12);
  });

  it('measures a review from its last movement', () => {
    expect(waitingDays(row({ status: 'PENDING_REVIEW', updatedAt: daysAgo(8) }), NOW)).toBe(8);
  });

  it('is null when nothing is waiting on anybody', () => {
    expect(waitingDays(row({ status: 'IMPLEMENTED', updatedAt: daysAgo(400) }), NOW)).toBeNull();
    expect(waitingDays(row({ status: 'DRAFT', updatedAt: daysAgo(90) }), NOW)).toBeNull();
  });

  it('is null on an unreadable date rather than a huge number', () => {
    expect(waitingDays(row({ status: 'PENDING_REVIEW', updatedAt: 'nonsense' }), NOW)).toBeNull();
  });
});

describe('byLongestWaiting', () => {
  it('puts the longest wait first regardless of which stage it waits in', () => {
    // Review and approval are stages of one thing; tabs hid this ordering.
    const rows = [
      row({ id: 'review-8', status: 'PENDING_REVIEW', updatedAt: daysAgo(8) }),
      row({ id: 'approval-12', status: 'PENDING_APPROVAL', recommendedAt: daysAgo(12) }),
      row({ id: 'review-6', status: 'PENDING_REVIEW', updatedAt: daysAgo(6) }),
    ];
    expect(byLongestWaiting(rows, NOW).map((r) => r.id)).toEqual([
      'approval-12',
      'review-8',
      'review-6',
    ]);
  });

  it('sorts things that are not waiting to the end', () => {
    const rows = [
      row({ id: 'done', status: 'IMPLEMENTED' }),
      row({ id: 'waiting', status: 'PENDING_REVIEW', updatedAt: daysAgo(2) }),
    ];
    expect(byLongestWaiting(rows, NOW).map((r) => r.id)).toEqual(['waiting', 'done']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [
      row({ id: 'a', status: 'IMPLEMENTED' }),
      row({ id: 'b', status: 'PENDING_REVIEW', updatedAt: daysAgo(9) }),
    ];
    byLongestWaiting(rows, NOW);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('approvalLevel', () => {
  it('reports the level that decides who signs', () => {
    expect(approvalLevel(row({ approvalLevelRequired: 3 }))).toBe(3);
  });

  it('is null when unset, never zero', () => {
    // Level 0 would read as "nobody needs to approve this".
    expect(approvalLevel(row({ approvalLevelRequired: null }))).toBeNull();
    expect(approvalLevel(row({ approvalLevelRequired: 0 }))).toBeNull();
  });
});

describe('canReturn', () => {
  it('mirrors the server guard', () => {
    expect(canReturn(row({ status: 'PENDING_REVIEW' }))).toBe(true);
    expect(canReturn(row({ status: 'RECOMMENDED' }))).toBe(true);
    expect(canReturn(row({ status: 'PENDING_APPROVAL' }))).toBe(true);
    // Nobody has been asked to look at a draft; the rest are finished.
    expect(canReturn(row({ status: 'DRAFT' }))).toBe(false);
    expect(canReturn(row({ status: 'REJECTED' }))).toBe(false);
    expect(canReturn(row({ status: 'IMPLEMENTED' }))).toBe(false);
  });
});

describe('filterCount', () => {
  const summary: RecommendationSummary = {
    countsByStatus: {
      DRAFT: 4,
      PENDING_REVIEW: 6,
      RECOMMENDED: 0,
      PENDING_APPROVAL: 4,
      APPROVED: 1,
      REJECTED: 2,
      RETURNED: 3,
      IMPLEMENTED: 2,
    },
    total: 22,
    live: 17,
    awaitingReview: 6,
    awaitingApproval: 4,
    returned: 3,
    aboveProposedBand: 2,
    belowProposedBand: 0,
    totalProposed: 14_200_000,
    liveWithoutTarget: 0,
    oldestWaitingDays: 12,
    oldestWaitingRef: 'SR-2026-0044',
  };

  it('reads every chip off the whole-set summary', () => {
    expect(filterCount(summary, 'all')).toBe(22);
    expect(filterCount(summary, 'on-me')).toBe(10);
    expect(filterCount(summary, 'returned')).toBe(3);
    expect(filterCount(summary, 'draft')).toBe(4);
    expect(filterCount(summary, 'settled')).toBe(5);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'returned')).toBeNull();
  });

  it('covers every chip', () => {
    QUEUE_FILTERS.forEach((f) => expect(filterCount(summary, f.key)).not.toBeNull());
  });

  it('reaches every status the record can hold', () => {
    // Six of eight had no view. These chips between them cover all eight.
    const covered = new Set(QUEUE_FILTERS.flatMap((f) => f.statuses));
    [
      'DRAFT',
      'PENDING_REVIEW',
      'PENDING_APPROVAL',
      'RETURNED',
      'APPROVED',
      'REJECTED',
      'IMPLEMENTED',
    ].forEach((status) => expect(covered.has(status)).toBe(true));
  });
});

describe('matchesFilter', () => {
  it('selects returned recommendations', () => {
    expect(matchesFilter('returned', row({ status: 'RETURNED' }))).toBe(true);
    expect(matchesFilter('returned', row({ status: 'DRAFT' }))).toBe(false);
  });

  it('treats review and approval together under "on me"', () => {
    expect(matchesFilter('on-me', row({ status: 'PENDING_REVIEW' }))).toBe(true);
    expect(matchesFilter('on-me', row({ status: 'PENDING_APPROVAL' }))).toBe(true);
    expect(matchesFilter('on-me', row({ status: 'IMPLEMENTED' }))).toBe(false);
  });
});

describe('money', () => {
  it('formats rands', () => {
    // Matched loosely: the group separator en-ZA uses depends on the ICU build, and asserting on
    // it would be testing Intl rather than this module.
    expect(money(1_480_000)).toMatch(/1\D?480\D?000/);
  });

  it('is null rather than "R 0" for an amount nobody recorded', () => {
    expect(money(null)).toBeNull();
    expect(money(undefined)).toBeNull();
    expect(money('')).toBeNull();
  });

  it('reports a genuine zero as a zero', () => {
    expect(money(0)).toContain('0');
  });
});

describe('isRecommendationSummary', () => {
  it('rejects an error body', () => {
    expect(isRecommendationSummary({ error: 'Internal server error' })).toBe(false);
    expect(isRecommendationSummary(null)).toBe(false);
  });

  it('accepts the real shape', () => {
    expect(isRecommendationSummary({ total: 1, live: 1, aboveProposedBand: 0 })).toBe(true);
  });
});
