import {
  ApplicationSummary,
  QUEUE_FILTERS,
  byLongestWait,
  concentration,
  filterCount,
  isClosed,
  ratingStars,
  stageCount,
} from '../queue';

function summary(overrides: Partial<ApplicationSummary> = {}): ApplicationSummary {
  return {
    countsByStatus: {
      SUBMITTED: 64,
      SCREENING: 38,
      INTERVIEW_SCHEDULED: 9,
      INTERVIEW_COMPLETED: 8,
      REFERENCE_CHECK: 0,
      OFFER_PENDING: 1,
      OFFERED: 3,
      OFFER_ACCEPTED: 1,
      HIRED: 3,
      REJECTED: 80,
      WITHDRAWN: 9,
      OFFER_DECLINED: 2,
    },
    total: 218,
    live: 127,
    unscreened: 64,
    oldestUnscreenedDays: 23,
    oldestUnscreenedId: 'app-1',
    unscreenedByAdvert: [],
    departments: [],
    sources: [],
    ...overrides,
  };
}

describe('filterCount', () => {
  it('counts the whole set, not a page', () => {
    const s = summary();
    expect(filterCount(s, QUEUE_FILTERS[0])).toBe(64);
  });

  it('sums every status a filter covers', () => {
    const interview = QUEUE_FILTERS.find((f) => f.key === 'interview')!;
    expect(filterCount(summary(), interview)).toBe(17);
  });

  it('reads "all live" off the live figure rather than summing statuses', () => {
    const live = QUEUE_FILTERS.find((f) => f.key === 'live')!;
    expect(filterCount(summary(), live)).toBe(127);
  });

  it('is null when the summary is unavailable, never zero', () => {
    // A chip reading "Unscreened 0" against a failed request is a lie the user acts on.
    expect(filterCount(null, QUEUE_FILTERS[0])).toBeNull();
  });

  it('treats a status the summary omits as zero', () => {
    // The summary returns every status including empty ones, so a missing key means none —
    // distinct from the summary itself being absent.
    expect(filterCount(summary({ countsByStatus: {} }), QUEUE_FILTERS[0])).toBe(0);
  });
});

describe('stageCount', () => {
  it('folds thirteen statuses onto the five funnel stages', () => {
    const s = summary();
    expect(stageCount(s, 'applied')).toBe(64);
    expect(stageCount(s, 'screening')).toBe(38);
    expect(stageCount(s, 'interview')).toBe(17);
    expect(stageCount(s, 'offer')).toBe(5);
    expect(stageCount(s, 'hired')).toBe(3);
  });

  it('is null for an unknown stage and for a missing summary', () => {
    expect(stageCount(summary(), 'nonsense')).toBeNull();
    expect(stageCount(null, 'applied')).toBeNull();
  });
});

describe('concentration', () => {
  const adverts = [
    { jobPostingId: 'a1', jobTitle: 'Investment Analyst', unscreened: 22 },
    { jobPostingId: 'a2', jobTitle: 'ICT Business Analyst', unscreened: 19 },
    { jobPostingId: 'a3', jobTitle: 'Risk Manager', unscreened: 23 },
  ];

  it('names the two adverts holding most of the backlog', () => {
    const text = concentration(summary({ unscreenedByAdvert: adverts }))!;
    expect(text).toContain('41 of the 64');
    expect(text).toContain('Investment Analyst');
    expect(text).toContain('ICT Business Analyst');
  });

  it('says nothing when the backlog is spread evenly', () => {
    // "Concentrated on two adverts" would be false, and it would point somebody at nothing.
    const spread = [
      { jobPostingId: 'a1', jobTitle: 'One', unscreened: 8 },
      { jobPostingId: 'a2', jobTitle: 'Two', unscreened: 8 },
      { jobPostingId: 'a3', jobTitle: 'Three', unscreened: 8 },
      { jobPostingId: 'a4', jobTitle: 'Four', unscreened: 40 },
    ];
    // Top two hold 16 of 64 — a quarter.
    expect(concentration(summary({ unscreenedByAdvert: spread.slice(0, 3) }))).toBeNull();
  });

  it('says nothing when there is only one advert to name', () => {
    expect(concentration(summary({ unscreenedByAdvert: adverts.slice(0, 1) }))).toBeNull();
  });

  it('says nothing when an advert has no title', () => {
    // The sentence would read "on two adverts" and name neither, which sends the reader hunting.
    const untitled = [
      { jobPostingId: 'a1', jobTitle: 'Investment Analyst', unscreened: 30 },
      { jobPostingId: 'a2', unscreened: 20 },
    ];
    expect(concentration(summary({ unscreenedByAdvert: untitled }))).toBeNull();
  });

  it('says nothing when nothing is unscreened, and nothing without a summary', () => {
    expect(concentration(summary({ unscreened: 0, unscreenedByAdvert: [] }))).toBeNull();
    expect(concentration(null)).toBeNull();
  });
});

describe('ratingStars', () => {
  it('renders a rating out of five as a rating out of five', () => {
    // Not rating × 20 rendered as "80%" beside a progress bar, which is what it replaced.
    expect(ratingStars(4)).toBe(4);
    expect(ratingStars(5)).toBe(5);
  });

  it('is null when unrated, rather than zero', () => {
    expect(ratingStars(undefined)).toBeNull();
    expect(ratingStars(null)).toBeNull();
    expect(ratingStars(0)).toBeNull();
    expect(ratingStars(NaN)).toBeNull();
  });

  it('never exceeds five stars', () => {
    expect(ratingStars(9)).toBe(5);
  });
});

describe('byLongestWait', () => {
  it('puts the longest wait first', () => {
    const rows = [
      { id: 'b', status: 'SUBMITTED', daysFromSubmission: 4 },
      { id: 'a', status: 'SUBMITTED', daysFromSubmission: 23 },
      { id: 'c', status: 'SCREENING', daysFromSubmission: 9 },
    ];
    expect(byLongestWait(rows).map((r) => r.id)).toEqual(['a', 'c', 'b']);
  });

  it('keeps ended candidacies below live ones however old they are', () => {
    const rows = [
      { id: 'rejected', status: 'REJECTED', daysFromSubmission: 200 },
      { id: 'live', status: 'SUBMITTED', daysFromSubmission: 3 },
    ];
    expect(byLongestWait(rows).map((r) => r.id)).toEqual(['live', 'rejected']);
  });

  it('does not mutate the array it was given', () => {
    const rows = [
      { id: 'b', status: 'SUBMITTED', daysFromSubmission: 1 },
      { id: 'a', status: 'SUBMITTED', daysFromSubmission: 9 },
    ];
    byLongestWait(rows);
    expect(rows.map((r) => r.id)).toEqual(['b', 'a']);
  });
});

describe('isClosed', () => {
  it('counts a declined offer as ended, not as live', () => {
    expect(isClosed('OFFER_DECLINED')).toBe(true);
    expect(isClosed('REJECTED')).toBe(true);
    expect(isClosed('WITHDRAWN')).toBe(true);
    expect(isClosed('OFFERED')).toBe(false);
  });
});
