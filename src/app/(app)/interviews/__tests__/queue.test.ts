import {
  InterviewRow,
  InterviewSummary,
  byMostOverdue,
  feedbackFiled,
  filterCount,
  stateOf,
  waitingDays,
  whenLabel,
} from '../queue';

const NOW = new Date('2026-08-24T12:00:00');

function iso(offsetDays: number, hour = 10): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function row(overrides: Partial<InterviewRow> = {}): InterviewRow {
  return { id: 'i1', status: 'SCHEDULED', durationMinutes: 60, ...overrides };
}

function summary(overrides: Partial<InterviewSummary> = {}): InterviewSummary {
  return {
    countsByStatus: { SCHEDULED: 9, COMPLETED: 19, CANCELLED: 3 },
    total: 33,
    awaitingWriteUp: 5,
    slotPassed: 2,
    nextSevenDays: 12,
    today: 3,
    oldestWriteUpDays: 9,
    oldestWriteUpId: 'i-old',
    medianDaysToWriteUp: 2,
    awaitingWriteUpIds: ['i-old'],
    ...overrides,
  };
}

describe('stateOf', () => {
  it('trusts the server on both stalls rather than recomputing them', () => {
    expect(stateOf(row({ status: 'COMPLETED', requiresFeedback: true }), NOW)).toBe('awaiting-write-up');
    expect(stateOf(row({ status: 'SCHEDULED', isOverdue: true }), NOW)).toBe('slot-passed');
  });

  it('separates a missing write-up from a slot nobody started', () => {
    // Different failures needing different remedies — one chases the panel, the other asks
    // whether the interview happened at all.
    const unwritten = stateOf(row({ status: 'COMPLETED', requiresFeedback: true }), NOW);
    const never = stateOf(row({ status: 'SCHEDULED', isOverdue: true }), NOW);
    expect(unwritten).not.toBe(never);
  });

  it('calls a completed interview with feedback written up', () => {
    expect(stateOf(row({ status: 'COMPLETED', requiresFeedback: false }), NOW)).toBe('written-up');
  });

  it('distinguishes today from merely scheduled', () => {
    expect(stateOf(row({ scheduledAt: iso(0, 14) }), NOW)).toBe('today');
    expect(stateOf(row({ scheduledAt: iso(3) }), NOW)).toBe('scheduled');
  });

  it('never reports a cancelled interview as a stall', () => {
    expect(stateOf(row({ status: 'CANCELLED', isOverdue: true }), NOW)).toBe('cancelled');
  });
});

describe('waitingDays', () => {
  it('measures a missing write-up from when the interview finished', () => {
    const r = row({ status: 'COMPLETED', requiresFeedback: true, completedAt: iso(-9) });
    expect(waitingDays(r, NOW)).toBe(9);
  });

  it('measures a slot nobody started from the end of the booked slot', () => {
    // Booked 10:00 three days ago for an hour, so the slot ended 3 days and 1 hour before now.
    const r = row({ status: 'SCHEDULED', isOverdue: true, scheduledAt: iso(-3), durationMinutes: 60 });
    expect(waitingDays(r, NOW)).toBe(3);
  });

  it('is null for anything not waiting on a person', () => {
    // A scheduled interview in the future is not late; reporting zero would put it in a queue of
    // things to chase.
    expect(waitingDays(row({ scheduledAt: iso(2) }), NOW)).toBeNull();
    expect(waitingDays(row({ status: 'COMPLETED', requiresFeedback: false }), NOW)).toBeNull();
  });

  it('is null when the timestamps needed are missing', () => {
    expect(waitingDays(row({ status: 'COMPLETED', requiresFeedback: true }), NOW)).toBeNull();
  });
});

describe('feedbackFiled', () => {
  it('reports how many write-ups exist', () => {
    expect(feedbackFiled(row({ feedbackCount: 1 }))).toBe(1);
    expect(feedbackFiled(row({ feedbackCount: 0 }))).toBe(0);
  });

  it('is null when the count is absent, rather than zero', () => {
    expect(feedbackFiled(row())).toBeNull();
  });
});

describe('filterCount', () => {
  it('counts the whole set, not a page', () => {
    expect(filterCount(summary(), 'needs-action')).toBe(7);
    expect(filterCount(summary(), 'all')).toBe(33);
    expect(filterCount(summary(), 'upcoming')).toBe(12);
  });

  it('counts written-up as completed minus those still awaiting one', () => {
    expect(filterCount(summary(), 'written-up')).toBe(14);
  });

  it('never reports a negative count if the two figures disagree', () => {
    expect(filterCount(summary({ awaitingWriteUp: 40 }), 'written-up')).toBe(0);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'needs-action')).toBeNull();
  });
});

describe('byMostOverdue', () => {
  it('leads with what is stalled, longest first', () => {
    const rows = [
      row({ id: 'soon', scheduledAt: iso(2) }),
      row({ id: 'stalled', status: 'COMPLETED', requiresFeedback: true, completedAt: iso(-9) }),
      row({ id: 'today', scheduledAt: iso(0, 14) }),
      row({ id: 'never', status: 'SCHEDULED', isOverdue: true, scheduledAt: iso(-3) }),
    ];
    expect(byMostOverdue(rows, NOW).map((r) => r.id)).toEqual(['stalled', 'never', 'today', 'soon']);
  });

  it('puts settled and cancelled interviews last', () => {
    const rows = [
      row({ id: 'done', status: 'COMPLETED', requiresFeedback: false }),
      row({ id: 'cancelled', status: 'CANCELLED' }),
      row({ id: 'upcoming', scheduledAt: iso(1) }),
    ];
    expect(byMostOverdue(rows, NOW).map((r) => r.id)).toEqual(['upcoming', 'done', 'cancelled']);
  });

  it('orders unstalled interviews soonest first', () => {
    const rows = [
      row({ id: 'later', scheduledAt: iso(5) }),
      row({ id: 'sooner', scheduledAt: iso(1) }),
    ];
    expect(byMostOverdue(rows, NOW).map((r) => r.id)).toEqual(['sooner', 'later']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [row({ id: 'b', scheduledAt: iso(5) }), row({ id: 'a', scheduledAt: iso(1) })];
    byMostOverdue(rows, NOW);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('whenLabel', () => {
  it('counts hours on the day itself and days otherwise', () => {
    expect(whenLabel(row({ scheduledAt: iso(0, 14) }), NOW)).toBe('In 2 hours');
    expect(whenLabel(row({ scheduledAt: iso(2) }), NOW)).toBe('In 2 days');
  });

  it('says how long ago something was', () => {
    expect(whenLabel(row({ scheduledAt: iso(-9) }), NOW)).toBe('9 days ago');
  });

  it('is null without a date, rather than guessing one', () => {
    expect(whenLabel(row(), NOW)).toBeNull();
    expect(whenLabel(row({ scheduledAt: 'not-a-date' }), NOW)).toBeNull();
  });
});
