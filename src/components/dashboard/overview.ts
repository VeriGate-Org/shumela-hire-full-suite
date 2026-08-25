/**
 * Derivations for the recruiter dashboard.
 *
 * <p><b>The defect this exists to fix is not a layout problem.</b> Four requests went out under
 * `Promise.allSettled` and each result was read inside `if (fulfilled && ok)` with
 * **no else branch anywhere**. When a request failed the block never ran, state stayed at its
 * initial zeros, and the page rendered a confident dashboard of noughts with no error shown. On a
 * screen people quote in meetings that is the worst available failure mode.
 *
 * <p>Worse: the four headline figures were **structurally** zero. The page read
 * `data.totalApplications`, `data.activeJobPostings`, `data.newApplicants` and
 * `data.interviewRate` from an endpoint that returns `kpis`, `trends` and
 * `alerts`. None of those keys was ever on it, and `|| 0` hid that on every
 * successful call.
 */

/** As `GET /api/analytics/recruiter-overview` returns it. */
export interface RecruiterOverview {
  openAdverts: number;
  advertsPastDeadline: number;
  applications: number;
  applicationsLast7Days: number;
  unscreened: number;
  interviewsAwaitingFeedback: number;
  offersExpiringSoon: number;
  offersLapsed: number;
  offersSettled: number;
  offersAccepted: number;
  offerAcceptanceRate?: number | null;
  pipelineAvailable: boolean;
  pipeline?: {
    reachedByStage: Record<string, number>;
    medianStageHours: Record<string, number>;
    conversions: Record<string, Record<string, number>>;
    slowestStage?: string | null;
    slowestStageDays?: number | null;
  } | null;
}

/**
 * Guards the fetch boundary.
 *
 * <p>An error body is an object too. Without this, reading `.applications` off it yields
 * `undefined`, which `|| 0` then turns into a zero indistinguishable from a real one —
 * the exact mechanism that made this page lie.
 */
export function isRecruiterOverview(value: unknown): value is RecruiterOverview {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.applications === 'number' &&
    typeof candidate.openAdverts === 'number' &&
    typeof candidate.pipelineAvailable === 'boolean'
  );
}

/**
 * What a tile should show.
 *
 * <p>Three states, because there are three answers and they lead to three different actions:
 * retry the request, wait for more data, or read the number. The page previously rendered all
 * three as `0`.
 */
export type TileState =
  | { kind: 'value'; value: number }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'insufficient'; reason: string };

/**
 * The offer acceptance tile.
 *
 * <p>`insufficient` is a success — the request worked and the base is genuinely too thin
 * to quote. That is a different thing from the request having failed, and only one of them has a
 * retry button.
 */
export function acceptanceTile(
  overview: RecruiterOverview | null,
  minSettled: number = MIN_SETTLED_OFFERS,
): TileState {
  if (!overview) {
    return { kind: 'unavailable', reason: 'The overview did not load' };
  }
  if (overview.offerAcceptanceRate === null || overview.offerAcceptanceRate === undefined) {
    const settled = overview.offersSettled ?? 0;
    return {
      kind: 'insufficient',
      reason:
        settled === 0
          ? 'No offers have been accepted or declined yet'
          : `${settled} offer${settled === 1 ? '' : 's'} settled — ${minSettled} needed before a rate means anything`,
    };
  }
  return { kind: 'value', value: overview.offerAcceptanceRate };
}

/**
 * How many settled offers are needed before a rate is worth showing.
 *
 * <p>Ten, matching `RecruiterDashboardResponse.MIN_SETTLED_OFFERS_FOR_RATE`. Below that a
 * single outcome moves the figure by more than ten percentage points.
 */
export const MIN_SETTLED_OFFERS = 10;

/** A plain count tile — unavailable when the overview did not load, never a silent zero. */
export function countTile(
  overview: RecruiterOverview | null,
  read: (o: RecruiterOverview) => number,
): TileState {
  if (!overview) return { kind: 'unavailable', reason: 'The overview did not load' };
  return { kind: 'value', value: read(overview) };
}

/** The funnel tile depends on the pipeline analytics, which may fail on their own. */
export function funnelAvailable(overview: RecruiterOverview | null): boolean {
  return Boolean(overview?.pipelineAvailable && overview.pipeline);
}

/**
 * The things that need attention, in the order they should be read.
 *
 * <p>A dashboard should be boring until it is not. Each of these is already known elsewhere in the
 * product; this is the screen that should say so first. Entries with a count of zero are dropped —
 * "0 adverts past deadline" is not news.
 */
export function exceptions(
  overview: RecruiterOverview | null,
): { key: string; label: string; count: number }[] {
  if (!overview) return [];
  const all = [
    { key: 'past-deadline', label: 'Adverts past deadline', count: overview.advertsPastDeadline },
    { key: 'offers-lapsed', label: 'Offers already expired', count: overview.offersLapsed },
    { key: 'unwritten', label: 'Interviews unwritten', count: overview.interviewsAwaitingFeedback },
    { key: 'expiring', label: 'Offers expiring', count: overview.offersExpiringSoon },
    { key: 'unscreened', label: 'Applications unscreened', count: overview.unscreened },
  ];
  return all.filter((entry) => entry.count > 0);
}

/**
 * The funnel, in stage order, as candidates who *reached* each stage.
 *
 * <p>Not who sits there now. That distinction is the difference between a conversion rate and a
 * snapshot, and both this page and the pipeline board previously got it the wrong way round.
 */
export function funnel(
  overview: RecruiterOverview | null,
  stageOrder: string[],
): { stage: string; reached: number; fromPrevious: number | null }[] {
  const reachedByStage = overview?.pipeline?.reachedByStage;
  if (!reachedByStage) return [];

  const present = stageOrder.filter((stage) => typeof reachedByStage[stage] === 'number');
  return present.map((stage, index) => {
    const reached = reachedByStage[stage];
    if (index === 0) return { stage, reached, fromPrevious: null };
    const before = reachedByStage[present[index - 1]];
    return {
      stage,
      reached,
      // Null rather than zero when the previous stage is empty: you cannot express a share of none.
      fromPrevious: before > 0 ? (reached / before) * 100 : null,
    };
  });
}

/**
 * The largest fall between consecutive stages — where the pipeline actually loses people.
 *
 * <p><b>The final step is excluded, and that is a judgement worth stating.</b> Narrowing from
 * twenty-four candidates in checks to three hires is not leakage; it is selection, and it is what a
 * funnel is for. Including it makes the last step the "largest loss" on almost every pipeline,
 * which is true arithmetic and useless advice.
 *
 * <p>Worth knowing: on the design's own numbers the last step is the biggest fall, while its copy
 * names Screening → Interviews. Excluding the hire step is what makes its stated conclusion the
 * correct one.
 */
export function largestLoss(
  overview: RecruiterOverview | null,
  stageOrder: string[],
): { fromStage: string; toStage: string; lostPercent: number } | null {
  const steps = funnel(overview, stageOrder);
  let worst: { fromStage: string; toStage: string; lostPercent: number } | null = null;
  // Stop before the last step — see the note above.
  for (let i = 1; i < steps.length - 1; i++) {
    const share = steps[i].fromPrevious;
    if (share === null) continue;
    const lost = 100 - share;
    if (!worst || lost > worst.lostPercent) {
      worst = { fromStage: steps[i - 1].stage, toStage: steps[i].stage, lostPercent: lost };
    }
  }
  return worst;
}

/**
 * Why only one sparkline is drawn.
 *
 * <p>Only applications has a genuine series behind it. Drawing trend lines under figures that
 * arrive as totals is invented precision — the same failure this system rejected once already on
 * the job posting workflow.
 */
export const ONE_SPARKLINE_ONLY =
  'Only applications has a time series behind it. The other figures arrive as totals, and a trend line under a total is a drawing, not data.';
