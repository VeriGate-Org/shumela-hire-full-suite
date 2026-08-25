import {
  BOARD_FILTERS,
  BoardCandidate,
  BoardCard,
  PipelineAnalytics,
  actionOwed,
  biggestDropOff,
  daysInStage,
  daysLabel,
  feedbackBadge,
  isBoardCard,
  isPipelineAnalytics,
  isStuck,
  legalMoves,
  matchesFilter,
  offerBadge,
  regressedIds,
  stageMedianDays,
  stageSampleSize,
  stuckCandidates,
} from '../board';

const NOW = new Date('2026-08-25T12:00:00');

function daysAgo(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function candidate(overrides: Partial<BoardCandidate> = {}): BoardCandidate {
  return {
    id: 'a1',
    candidateName: 'Thabo Nkosi',
    stage: 'INITIAL_SCREENING',
    pipelineStageEnteredAt: daysAgo(3),
    ...overrides,
  };
}

function analytics(overrides: Partial<PipelineAnalytics> = {}): PipelineAnalytics {
  return {
    reachedByStage: {},
    medianStageHours: { INITIAL_SCREENING: 96 },
    stageSampleSize: { INITIAL_SCREENING: 12 },
    conversions: {},
    regressions: [],
    transitions: 40,
    transitionsWithoutDuration: 0,
    ...overrides,
  };
}

function card(overrides: Partial<BoardCard> = {}): BoardCard {
  return { availableTransitions: ['FIRST_INTERVIEW'], interviewsAwaitingFeedback: 0, ...overrides };
}

describe('daysInStage', () => {
  it('measures from when the candidate entered the stage', () => {
    expect(daysInStage(candidate({ pipelineStageEnteredAt: daysAgo(23) }), NOW)).toBe(23);
  });

  it('never falls back to updatedAt', () => {
    // Rating a candidate writes updatedAt. Measuring dwell from it meant rating someone reset
    // their apparent dwell to zero and a stuck card silently became unstuck.
    const rated = candidate({ pipelineStageEnteredAt: null, updatedAt: daysAgo(0) });
    expect(daysInStage(rated, NOW)).toBeNull();
  });

  it('is null on an unreadable date rather than a huge number', () => {
    expect(daysInStage(candidate({ pipelineStageEnteredAt: 'nonsense' }), NOW)).toBeNull();
  });
});

describe('isStuck', () => {
  it('compares dwell against the stage median', () => {
    // 23 days against a 4-day median.
    expect(isStuck(candidate({ pipelineStageEnteredAt: daysAgo(23) }), analytics(), NOW)).toBe(true);
    expect(isStuck(candidate({ pipelineStageEnteredAt: daysAgo(3) }), analytics(), NOW)).toBe(false);
  });

  it('is null when there is no median, never false', () => {
    // Without a median there is nothing to be past. Reporting that as "not stuck" would quietly
    // clear the board of the exact cards it exists to surface.
    expect(isStuck(candidate({ stage: 'PANEL_INTERVIEW' }), analytics(), NOW)).toBeNull();
    expect(isStuck(candidate(), null, NOW)).toBeNull();
  });

  it('is null when the dwell itself is unknown', () => {
    expect(isStuck(candidate({ pipelineStageEnteredAt: null }), analytics(), NOW)).toBeNull();
  });
});

describe('stuckCandidates', () => {
  it('ranks the longest overrun first', () => {
    const rows = [
      candidate({ id: 'mild', pipelineStageEnteredAt: daysAgo(6) }),
      candidate({ id: 'worst', pipelineStageEnteredAt: daysAgo(23) }),
      candidate({ id: 'fine', pipelineStageEnteredAt: daysAgo(1) }),
    ];
    expect(stuckCandidates(rows, analytics(), NOW).map((c) => c.id)).toEqual(['worst', 'mild']);
  });

  it('excludes cards whose stage has no median rather than assuming they are fine', () => {
    const rows = [candidate({ id: 'unknown-stage', stage: 'PANEL_INTERVIEW' })];
    expect(stuckCandidates(rows, analytics(), NOW)).toEqual([]);
  });
});

describe('stageMedianDays and stageSampleSize', () => {
  it('converts the server hours into days', () => {
    expect(stageMedianDays(analytics(), 'INITIAL_SCREENING')).toBe(4);
  });

  it('is null for a stage nothing has left', () => {
    expect(stageMedianDays(analytics(), 'BACKGROUND_CHECK')).toBeNull();
    expect(stageSampleSize(analytics(), 'BACKGROUND_CHECK')).toBeNull();
  });

  it('reports how many measurements the median rests on', () => {
    // A median of one is one candidate's dwell wearing a statistic's clothes.
    expect(stageSampleSize(analytics(), 'INITIAL_SCREENING')).toBe(12);
  });
});

describe('legalMoves', () => {
  it('distinguishes nowhere-to-go from not-loaded', () => {
    // "No moves available" is a fact about the candidate; "moves unavailable" is a fact about the
    // request, and the board must not render them the same.
    expect(legalMoves(card({ availableTransitions: [] }))).toEqual([]);
    expect(legalMoves(undefined)).toBeNull();
  });

  it('returns what the server allows', () => {
    expect(legalMoves(card({ availableTransitions: ['FIRST_INTERVIEW', 'REJECTED'] }))).toEqual([
      'FIRST_INTERVIEW',
      'REJECTED',
    ]);
  });
});

describe('offerBadge', () => {
  it('counts down to expiry', () => {
    expect(offerBadge(card({ offerStatus: 'SENT', offerExpiresInDays: 2 }))).toBe(
      'Offer expires in 2d',
    );
    expect(offerBadge(card({ offerStatus: 'SENT', offerExpiresInDays: 0 }))).toBe(
      'Offer expires today',
    );
  });

  it('says when an offer has already expired rather than hiding it', () => {
    expect(offerBadge(card({ offerStatus: 'SENT', offerExpiresInDays: -3 }))).toBe(
      'Offer expired 3d ago',
    );
  });

  it('says so when there is no expiry date, rather than reading as safe', () => {
    expect(offerBadge(card({ offerStatus: 'SENT', offerExpiresInDays: null }))).toBe(
      'Offer out — no expiry date',
    );
  });

  it('is null when there is no live offer', () => {
    expect(offerBadge(card())).toBeNull();
    expect(offerBadge(undefined)).toBeNull();
  });
});

describe('feedbackBadge', () => {
  it('singularises one overdue write-up', () => {
    expect(feedbackBadge(card({ interviewsAwaitingFeedback: 1 }))).toBe('Write-up overdue');
    expect(feedbackBadge(card({ interviewsAwaitingFeedback: 3 }))).toBe('3 write-ups overdue');
  });

  it('is null when nothing is owed', () => {
    expect(feedbackBadge(card({ interviewsAwaitingFeedback: 0 }))).toBeNull();
  });
});

describe('biggestDropOff', () => {
  const order = ['APPLICATION_RECEIVED', 'INITIAL_SCREENING', 'FIRST_INTERVIEW', 'BACKGROUND_CHECK'];

  it('finds the largest fall between consecutive stages', () => {
    const data = analytics({
      reachedByStage: {
        APPLICATION_RECEIVED: 218,
        INITIAL_SCREENING: 154,
        FIRST_INTERVIEW: 59,
        BACKGROUND_CHECK: 24,
      },
    });
    const drop = biggestDropOff(data, order);
    expect(drop?.fromStage).toBe('INITIAL_SCREENING');
    expect(drop?.toStage).toBe('FIRST_INTERVIEW');
    expect(drop?.lostCount).toBe(95);
  });

  it('is null when fewer than two stages have been reached — one stage is not a funnel', () => {
    expect(biggestDropOff(analytics({ reachedByStage: { APPLICATION_RECEIVED: 10 } }), order)).toBeNull();
    expect(biggestDropOff(null, order)).toBeNull();
  });
});

describe('daysLabel', () => {
  it('drops to hours below a day rather than saying "0 days"', () => {
    expect(daysLabel(0.5)).toBe('12 hours');
    expect(daysLabel(4)).toBe('4 days');
    expect(daysLabel(1)).toBe('1 day');
  });

  it('keeps null as null', () => {
    expect(daysLabel(null)).toBeNull();
  });
});

describe('matchesFilter', () => {
  const regressed = regressedIds(
    analytics({ regressions: [{ applicationId: 'zanele', fromStage: 'X', toStage: 'Y' }] }),
  );

  it('covers every chip', () => {
    BOARD_FILTERS.forEach((filter) =>
      expect(
        typeof matchesFilter(filter.key, candidate(), card(), analytics(), regressed, NOW),
      ).toBe('boolean'),
    );
  });

  it('selects cards that moved backwards', () => {
    expect(matchesFilter('regressed', candidate({ id: 'zanele' }), card(), analytics(), regressed, NOW)).toBe(true);
    expect(matchesFilter('regressed', candidate({ id: 'other' }), card(), analytics(), regressed, NOW)).toBe(false);
  });

  it('counts an owed write-up or an expiring offer as action owed', () => {
    expect(actionOwed(card({ interviewsAwaitingFeedback: 1 }))).toBe(true);
    expect(actionOwed(card({ offerExpiringSoon: true }))).toBe(true);
    expect(actionOwed(card())).toBe(false);
    // An unloaded card owes nothing we know about.
    expect(actionOwed(undefined)).toBe(false);
  });

  it('does not treat an unknown stuck state as stuck', () => {
    expect(
      matchesFilter('stuck', candidate({ stage: 'PANEL_INTERVIEW' }), card(), analytics(), regressed, NOW),
    ).toBe(false);
  });
});

describe('shape guards', () => {
  it('rejects an error body', () => {
    // This endpoint returned a 500 on every call until the analytics were implemented, and both
    // pages that consume it swallowed the failure.
    expect(isPipelineAnalytics({ message: 'Internal server error' })).toBe(false);
    expect(isPipelineAnalytics(null)).toBe(false);
    expect(isBoardCard({ error: 'nope' })).toBe(false);
  });

  it('accepts the real shapes', () => {
    expect(isPipelineAnalytics(analytics())).toBe(true);
    expect(isBoardCard(card())).toBe(true);
  });
});
