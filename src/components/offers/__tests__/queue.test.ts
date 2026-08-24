import {
  OfferRow,
  OfferSummary,
  QUEUE_FILTERS,
  bySoonestExpiry,
  committedValue,
  daysUntilExpiry,
  expiryLabel,
  expiryTone,
  filterCount,
  isOfferSummary,
  isWithCandidate,
  showsClock,
} from '../queue';

const NOW = new Date('2026-08-24T12:00:00');

function inDays(days: number): string {
  return new Date(NOW.getTime() + days * 86_400_000).toISOString();
}

function row(overrides: Partial<OfferRow> = {}): OfferRow {
  return { id: 'o1', status: 'SENT', ...overrides };
}

function summary(overrides: Partial<OfferSummary> = {}): OfferSummary {
  return {
    countsByStatus: {
      DRAFT: 2,
      PENDING_APPROVAL: 1,
      APPROVED: 0,
      SENT: 3,
      AWAITING_SIGNATURE: 2,
      SIGNED: 1,
      UNDER_NEGOTIATION: 0,
      ACCEPTED: 4,
      DECLINED: 1,
      WITHDRAWN: 0,
      EXPIRED: 1,
      SUPERSEDED: 0,
    },
    total: 15,
    withCandidate: 6,
    expiringSoon: 3,
    expiringImminently: 2,
    lapsed: 1,
    soonestExpiryDays: 1,
    soonestExpiryId: 'o-soon',
    withoutExpiry: 0,
    committedAnnualValue: 7400000,
    committedValueExcluded: 0,
    ...overrides,
  };
}

describe('isWithCandidate', () => {
  it('includes every state where the clock is running', () => {
    // An offer awaiting a signature or under negotiation can lapse just as readily as one merely
    // sent — more readily, because the signature is what is consuming the time.
    ['SENT', 'AWAITING_SIGNATURE', 'SIGNED', 'UNDER_NEGOTIATION'].forEach((status) =>
      expect(isWithCandidate(status)).toBe(true),
    );
  });

  it('excludes anything not yet put to the candidate, or already over', () => {
    ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACCEPTED', 'EXPIRED', 'DECLINED'].forEach((status) =>
      expect(isWithCandidate(status)).toBe(false),
    );
  });
});

describe('showsClock', () => {
  it('shows the clock on an offer out for signature', () => {
    // This row rendered no countdown at all: the gate was SENT and UNDER_NEGOTIATION only.
    expect(showsClock(row({ status: 'AWAITING_SIGNATURE', offerExpiryDate: inDays(1) }))).toBe(true);
  });

  it('shows no clock where there is no date or the offer is not with the candidate', () => {
    expect(showsClock(row({ status: 'AWAITING_SIGNATURE' }))).toBe(false);
    expect(showsClock(row({ status: 'DRAFT', offerExpiryDate: inDays(3) }))).toBe(false);
  });
});

describe('daysUntilExpiry and expiryLabel', () => {
  it('counts forward and backward across the date', () => {
    expect(daysUntilExpiry(row({ offerExpiryDate: inDays(6) }), NOW)).toBe(6);
    expect(daysUntilExpiry(row({ offerExpiryDate: inDays(-5) }), NOW)).toBe(-5);
  });

  it('says what a reader needs rather than a raw number', () => {
    expect(expiryLabel(row({ offerExpiryDate: inDays(1) }), NOW)).toBe('Tomorrow');
    expect(expiryLabel(row({ offerExpiryDate: inDays(-5) }), NOW)).toBe('Expired 5 days ago');
    expect(expiryLabel(row({ offerExpiryDate: inDays(6) }), NOW)).toBe('6 days');
  });

  it('is null without a usable date rather than guessing', () => {
    expect(daysUntilExpiry(row(), NOW)).toBeNull();
    expect(expiryLabel(row({ offerExpiryDate: 'nonsense' }), NOW)).toBeNull();
  });
});

describe('expiryTone', () => {
  it('escalates inside two days and warns inside a week', () => {
    expect(expiryTone(row({ offerExpiryDate: inDays(1) }), NOW)).toBe('critical');
    expect(expiryTone(row({ offerExpiryDate: inDays(5) }), NOW)).toBe('warning');
    expect(expiryTone(row({ offerExpiryDate: inDays(20) }), NOW)).toBeNull();
  });

  it('is null where no clock is shown at all', () => {
    expect(expiryTone(row({ status: 'DRAFT', offerExpiryDate: inDays(1) }), NOW)).toBeNull();
  });
});

describe('bySoonestExpiry', () => {
  it('leads with the offer closest to lapsing', () => {
    const rows = [
      row({ id: 'later', offerExpiryDate: inDays(6) }),
      row({ id: 'tomorrow', status: 'AWAITING_SIGNATURE', offerExpiryDate: inDays(1) }),
      row({ id: 'soon', status: 'UNDER_NEGOTIATION', offerExpiryDate: inDays(2) }),
    ];
    expect(bySoonestExpiry(rows, NOW).map((r) => r.id)).toEqual(['tomorrow', 'soon', 'later']);
  });

  it('puts offers not with the candidate below those that are', () => {
    const rows = [
      row({ id: 'draft', status: 'DRAFT' }),
      row({ id: 'live', status: 'SENT', offerExpiryDate: inDays(9) }),
    ];
    expect(bySoonestExpiry(rows, NOW).map((r) => r.id)).toEqual(['live', 'draft']);
  });

  it('sorts an offer with no expiry last within its group, not first', () => {
    // An absent date is not an infinitely urgent one, and offerExpiryDate is optional.
    const rows = [
      row({ id: 'undated', status: 'SENT' }),
      row({ id: 'dated', status: 'SENT', offerExpiryDate: inDays(30) }),
    ];
    expect(bySoonestExpiry(rows, NOW).map((r) => r.id)).toEqual(['dated', 'undated']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [
      row({ id: 'b', offerExpiryDate: inDays(9) }),
      row({ id: 'a', offerExpiryDate: inDays(1) }),
    ];
    bySoonestExpiry(rows, NOW);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('filterCount', () => {
  it('counts the whole set, not a page', () => {
    expect(filterCount(summary(), 'all')).toBe(15);
    expect(filterCount(summary(), 'expiring')).toBe(3);
    expect(filterCount(summary(), 'with-candidate')).toBe(6);
  });

  it('counts lapsed separately from declined', () => {
    expect(filterCount(summary(), 'lapsed')).toBe(1);
    expect(filterCount(summary(), 'closed')).toBe(1);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'expiring')).toBeNull();
  });

  it('is null for a filter it does not know', () => {
    expect(filterCount(summary(), 'nonsense')).toBeNull();
  });

  it('covers every chip', () => {
    QUEUE_FILTERS.forEach((filter) =>
      expect(filterCount(summary(), filter.key)).not.toBeNull(),
    );
  });
});

describe('committedValue', () => {
  it('reads the figure whether it arrives as a number or a string', () => {
    expect(committedValue(summary())).toBe(7400000);
    expect(committedValue(summary({ committedAnnualValue: '7400000.00' }))).toBe(7400000);
  });

  it('is null when it cannot be read, rather than NaN', () => {
    expect(committedValue(summary({ committedAnnualValue: 'not a number' }))).toBeNull();
    expect(committedValue(null)).toBeNull();
  });
});

describe('isOfferSummary', () => {
  it('accepts a real summary', () => {
    expect(isOfferSummary(summary())).toBe(true);
  });

  it('rejects a payload with no counts, rather than letting it reach the band', () => {
    // An empty object is truthy. Reading countsByStatus.DRAFT off it threw and took down a page
    // whose offers had loaded perfectly — the failure the routing strip had before #259.
    expect(isOfferSummary({})).toBe(false);
    expect(isOfferSummary({ total: 3 })).toBe(false);
    expect(isOfferSummary({ countsByStatus: null, total: 3, withCandidate: 1 })).toBe(false);
  });

  it('rejects anything that is not an object', () => {
    expect(isOfferSummary(null)).toBe(false);
    expect(isOfferSummary(undefined)).toBe(false);
    expect(isOfferSummary('summary')).toBe(false);
  });
});
