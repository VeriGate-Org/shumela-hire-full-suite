import {
  JobPostingSummary,
  PostingRow,
  QUEUE_FILTERS,
  actionsFor,
  byDeadline,
  closesLabel,
  conversionRate,
  daysLive,
  daysUntilClose,
  filterCount,
  isDeadlinePassed,
  isPostingSummary,
  stateOf,
} from '../queue';

const NOW = new Date('2026-08-24T12:00:00');

function inDays(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString();
}

function row(overrides: Partial<PostingRow> = {}): PostingRow {
  return { id: 'p1', status: 'PUBLISHED', ...overrides };
}

function summary(overrides: Partial<JobPostingSummary> = {}): JobPostingSummary {
  return {
    countsByStatus: {
      DRAFT: 7,
      PENDING_APPROVAL: 4,
      APPROVED: 0,
      PUBLISHED: 11,
      UNPUBLISHED: 0,
      REJECTED: 0,
      CLOSED: 4,
      CANCELLED: 0,
    },
    total: 26,
    openToApplicants: 8,
    pastDeadline: 3,
    oldestExpiredDays: 11,
    oldestExpiredId: 'p-old',
    awaitingApproval: 4,
    applicationsReceived: 218,
    ...overrides,
  };
}

describe('stateOf', () => {
  it('splits published into open and past deadline', () => {
    // The distinction the status cannot express: both of these are PUBLISHED.
    expect(stateOf(row({ applicationDeadline: inDays(5) }), NOW)).toBe('open');
    expect(stateOf(row({ applicationDeadline: inDays(-11) }), NOW)).toBe('past-deadline');
  });

  it('treats a published advert with no deadline as open', () => {
    expect(stateOf(row(), NOW)).toBe('open');
  });

  it('never calls an unpublished advert expired, however old its deadline', () => {
    // A draft's deadline means nothing yet; a closed advert was ended deliberately.
    expect(stateOf(row({ status: 'DRAFT', applicationDeadline: inDays(-40) }), NOW)).toBe('draft');
    expect(stateOf(row({ status: 'CLOSED', applicationDeadline: inDays(-40) }), NOW)).toBe('closed');
  });

  it('has a state for every status the enum can hold', () => {
    ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'UNPUBLISHED', 'REJECTED', 'CLOSED', 'CANCELLED']
      .forEach((status) => expect(stateOf(row({ status }), NOW)).toBeTruthy());
  });
});

describe('isDeadlinePassed and daysUntilClose', () => {
  it('is false without a deadline, rather than treating absence as expiry', () => {
    expect(isDeadlinePassed(row(), NOW)).toBe(false);
    expect(daysUntilClose(row(), NOW)).toBeNull();
  });

  it('is false for an unparseable date rather than throwing', () => {
    expect(isDeadlinePassed(row({ applicationDeadline: 'nonsense' }), NOW)).toBe(false);
  });

  it('counts forward and backward across the date', () => {
    expect(daysUntilClose(row({ applicationDeadline: inDays(5) }), NOW)).toBe(5);
    expect(daysUntilClose(row({ applicationDeadline: inDays(-11) }), NOW)).toBe(-11);
  });
});

describe('closesLabel', () => {
  it('says what a reader needs', () => {
    expect(closesLabel(row({ applicationDeadline: inDays(5) }), NOW)).toBe('5 days left');
    expect(closesLabel(row({ applicationDeadline: inDays(-11) }), NOW)).toBe('Expired 11 days ago');
    expect(closesLabel(row({ applicationDeadline: inDays(0) }), NOW)).toBe('Closes today');
  });

  it('is null without a deadline', () => {
    expect(closesLabel(row(), NOW)).toBeNull();
  });
});

describe('daysLive', () => {
  it('reports days live for a published advert', () => {
    expect(daysLive(row({ publishedAt: inDays(-37), daysFromPublication: 37 }))).toBe(37);
  });

  it('is null for anything never published, not zero', () => {
    // daysFromPublication returns 0 when publishedAt is unset, which would read as "0 days live"
    // for a draft nobody has ever advertised.
    expect(daysLive(row({ status: 'DRAFT', daysFromPublication: 0 }))).toBeNull();
  });
});

describe('conversionRate', () => {
  it('computes applications over views', () => {
    expect(conversionRate(row({ viewsCount: 942, applicationsCount: 29 }))).toBeCloseTo(3.08, 1);
  });

  it('is null with no views — a rate over zero is not a low rate', () => {
    expect(conversionRate(row({ viewsCount: 0, applicationsCount: 0 }))).toBeNull();
    expect(conversionRate(row({ applicationsCount: 3 }))).toBeNull();
  });
});

describe('filterCount', () => {
  it('counts the whole set, not a page', () => {
    expect(filterCount(summary(), 'all')).toBe(26);
    expect(filterCount(summary(), 'open')).toBe(8);
    expect(filterCount(summary(), 'attention')).toBe(7);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'open')).toBeNull();
  });

  it('covers every chip', () => {
    QUEUE_FILTERS.forEach((filter) =>
      expect(filterCount(summary(), filter.key)).not.toBeNull(),
    );
  });
});

describe('byDeadline', () => {
  it('leads with what has already expired, oldest first', () => {
    const rows = [
      row({ id: 'open', applicationDeadline: inDays(5) }),
      row({ id: 'long-expired', applicationDeadline: inDays(-11) }),
      row({ id: 'just-expired', applicationDeadline: inDays(-2) }),
    ];
    expect(byDeadline(rows, NOW).map((r) => r.id)).toEqual(['long-expired', 'just-expired', 'open']);
  });

  it('sorts an advert with no deadline after those that have one', () => {
    // An absent date is not an imminent one.
    const rows = [
      row({ id: 'undated' }),
      row({ id: 'dated', applicationDeadline: inDays(30) }),
    ];
    expect(byDeadline(rows, NOW).map((r) => r.id)).toEqual(['dated', 'undated']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [
      row({ id: 'b', applicationDeadline: inDays(9) }),
      row({ id: 'a', applicationDeadline: inDays(1) }),
    ];
    byDeadline(rows, NOW);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('actionsFor', () => {
  it('offers exactly what the API says is possible', () => {
    const actions = actionsFor({ canBeEdited: true, canBePublished: true });
    expect(actions.map((a) => a.key)).toEqual(['edit', 'publish']);
  });

  it('offers nothing when every flag is false', () => {
    expect(actionsFor({ canBeEdited: false })).toEqual([]);
  });

  it('offers nothing when the flags are absent, rather than assuming any', () => {
    expect(actionsFor({})).toEqual([]);
  });

  it('puts the destructive action last', () => {
    const actions = actionsFor({ canBeRejected: true, canBeApproved: true, canBeEdited: true });
    expect(actions[actions.length - 1].key).toBe('reject');
  });
});

describe('isPostingSummary', () => {
  it('accepts a real summary and rejects anything else', () => {
    expect(isPostingSummary(summary())).toBe(true);
    expect(isPostingSummary({})).toBe(false);
    expect(isPostingSummary({ total: 3 })).toBe(false);
    expect(isPostingSummary(null)).toBe(false);
  });
});
