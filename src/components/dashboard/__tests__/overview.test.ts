import {
  MIN_SETTLED_OFFERS,
  RecruiterOverview,
  acceptanceTile,
  countTile,
  exceptions,
  funnel,
  funnelAvailable,
  isRecruiterOverview,
  largestLoss,
} from '../overview';

function overview(overrides: Partial<RecruiterOverview> = {}): RecruiterOverview {
  return {
    openAdverts: 8,
    advertsPastDeadline: 3,
    applications: 218,
    applicationsLast7Days: 34,
    unscreened: 64,
    interviewsAwaitingFeedback: 5,
    offersExpiringSoon: 3,
    offersLapsed: 0,
    offersSettled: 12,
    offersAccepted: 9,
    offerAcceptanceRate: 75,
    pipelineAvailable: true,
    pipeline: {
      reachedByStage: {
        APPLICATION_RECEIVED: 218,
        INITIAL_SCREENING: 154,
        FIRST_INTERVIEW: 59,
        BACKGROUND_CHECK: 24,
        HIRED: 3,
      },
      medianStageHours: {},
      conversions: {},
    },
    ...overrides,
  };
}

const ORDER = [
  'APPLICATION_RECEIVED',
  'INITIAL_SCREENING',
  'FIRST_INTERVIEW',
  'BACKGROUND_CHECK',
  'HIRED',
];

describe('the three answers', () => {
  it('shows a number when there is one', () => {
    expect(acceptanceTile(overview())).toEqual({ kind: 'value', value: 75 });
  });

  it('distinguishes a thin base from a failed request', () => {
    // These lead to different actions: one waits, the other retries. The page rendered both as 0.
    const thin = acceptanceTile(overview({ offerAcceptanceRate: null, offersSettled: 4 }));
    expect(thin.kind).toBe('insufficient');
    expect(thin.kind === 'insufficient' && thin.reason).toContain('4 offers settled');

    const failed = acceptanceTile(null);
    expect(failed.kind).toBe('unavailable');
  });

  it('says so plainly when nothing has settled at all', () => {
    const none = acceptanceTile(overview({ offerAcceptanceRate: null, offersSettled: 0 }));
    expect(none.kind === 'insufficient' && none.reason).toBe(
      'No offers have been accepted or declined yet',
    );
  });

  it('names the threshold it is waiting for', () => {
    const thin = acceptanceTile(overview({ offerAcceptanceRate: null, offersSettled: 1 }));
    expect(thin.kind === 'insufficient' && thin.reason).toContain(String(MIN_SETTLED_OFFERS));
    // Singular, because "1 offers settled" is the sort of thing that makes people distrust a page.
    expect(thin.kind === 'insufficient' && thin.reason).toContain('1 offer settled');
  });

  it('reports a count tile as unavailable rather than zero when nothing loaded', () => {
    // The whole defect in one assertion.
    expect(countTile(null, o => o.applications)).toEqual({
      kind: 'unavailable',
      reason: 'The overview did not load',
    });
    expect(countTile(overview(), o => o.applications)).toEqual({ kind: 'value', value: 218 });
  });

  it('reports a genuine zero as a zero', () => {
    // A real nought is a real answer and must still render as a number.
    expect(countTile(overview({ unscreened: 0 }), o => o.unscreened)).toEqual({
      kind: 'value',
      value: 0,
    });
  });
});

describe('funnelAvailable', () => {
  it('is false when the pipeline analytics failed on their own', () => {
    // A failure there must not zero the rest of the page.
    expect(funnelAvailable(overview({ pipelineAvailable: false, pipeline: null }))).toBe(false);
    expect(funnelAvailable(overview())).toBe(true);
    expect(funnelAvailable(null)).toBe(false);
  });
});

describe('funnel', () => {
  it('measures who reached a stage, not who sits in it', () => {
    const steps = funnel(overview(), ORDER);
    expect(steps.map(s => s.reached)).toEqual([218, 154, 59, 24, 3]);
  });

  it('expresses each step as a share of the one before', () => {
    const steps = funnel(overview(), ORDER);
    expect(steps[0].fromPrevious).toBeNull();
    expect(steps[1].fromPrevious).toBeCloseTo(70.6, 1);
  });

  it('is null rather than zero when the previous stage is empty', () => {
    // You cannot express a share of none.
    const steps = funnel(
      overview({
        pipeline: {
          reachedByStage: { APPLICATION_RECEIVED: 0, INITIAL_SCREENING: 0 },
          medianStageHours: {},
          conversions: {},
        },
      }),
      ORDER,
    );
    expect(steps[1].fromPrevious).toBeNull();
  });

  it('is empty when the pipeline did not load', () => {
    expect(funnel(overview({ pipeline: null, pipelineAvailable: false }), ORDER)).toEqual([]);
    expect(funnel(null, ORDER)).toEqual([]);
  });

  it('skips stages the pipeline never reported', () => {
    const steps = funnel(overview(), [...ORDER, 'OFFER_EXTENDED']);
    expect(steps.map(s => s.stage)).not.toContain('OFFER_EXTENDED');
  });
});

describe('largestLoss', () => {
  it('finds where the pipeline actually loses people', () => {
    const loss = largestLoss(overview(), ORDER);
    expect(loss?.fromStage).toBe('INITIAL_SCREENING');
    expect(loss?.toStage).toBe('FIRST_INTERVIEW');
    expect(loss?.lostPercent).toBeCloseTo(61.7, 1);
  });

  it('excludes the final step, because narrowing to a hire is selection not leakage', () => {
    // 24 in checks to 3 hires is an 87.5% fall — arithmetically the largest, and useless advice.
    // Including it would make the last step the "biggest loss" on almost every pipeline.
    const loss = largestLoss(overview(), ORDER);
    expect(loss?.toStage).not.toBe('HIRED');
  });

  it('is null when there is no funnel to read', () => {
    expect(largestLoss(overview({ pipeline: null, pipelineAvailable: false }), ORDER)).toBeNull();
  });
});

describe('exceptions', () => {
  it('lists only what actually needs attention', () => {
    // "0 adverts past deadline" is not news. A dashboard should be boring until it is not.
    const items = exceptions(overview({ advertsPastDeadline: 0, offersExpiringSoon: 0 }));
    expect(items.map(e => e.key)).toEqual(['unwritten', 'unscreened']);
  });

  it('is empty when nothing is wrong', () => {
    expect(
      exceptions(
        overview({
          advertsPastDeadline: 0,
          offersExpiringSoon: 0,
          offersLapsed: 0,
          interviewsAwaitingFeedback: 0,
          unscreened: 0,
        }),
      ),
    ).toEqual([]);
  });

  it('is empty rather than throwing when nothing loaded', () => {
    expect(exceptions(null)).toEqual([]);
  });

  it('separates an expired offer from an expiring one', () => {
    // One is a chase; the other has already gone.
    const items = exceptions(overview({ offersLapsed: 2 }));
    expect(items.map(e => e.key)).toContain('offers-lapsed');
    expect(items.map(e => e.key)).toContain('expiring');
  });
});

describe('isRecruiterOverview', () => {
  it('rejects an error body that would otherwise render as zeroes', () => {
    expect(isRecruiterOverview({ message: 'Internal server error' })).toBe(false);
    expect(isRecruiterOverview(null)).toBe(false);
    // The old dashboard's response shape — kpis/trends/alerts — is not this one.
    expect(isRecruiterOverview({ kpis: {}, trends: [], alerts: [] })).toBe(false);
  });

  it('accepts the real shape', () => {
    expect(isRecruiterOverview(overview())).toBe(true);
  });
});
