/**
 * Derivations for the hiring pipeline board.
 *
 * <p>The board's job is to say <b>which candidates are stuck, and against what</b>. "23 days here"
 * means nothing on its own; it means something next to a stage median of 4 days. Until now the
 * board showed dwell time with nothing to compare it to, so a slow stage and a slow candidate were
 * indistinguishable.
 *
 * <p>Everything here reads figures the server computes. The board previously computed its own
 * versions of two of them in the browser, and both were wrong in the same direction — see
 * {@link conversionIsNotDistribution} for the one that matters most.
 */

/** One card on the board. */
export interface BoardCandidate {
  id: string | number;
  candidateName: string;
  jobTitle?: string;
  stage: string;
  /** When they entered the CURRENT stage — not `updatedAt`, which any edit moves. */
  pipelineStageEnteredAt?: string | null;
  updatedAt?: string | null;
  submittedAt?: string | null;
  source?: string;
  rating?: number | null;
}

/** Per-card decoration from `GET /api/pipeline/board-cards?applicationIds=`. */
export interface BoardCard {
  availableTransitions: string[];
  offerStatus?: string | null;
  offerExpiresInDays?: number | null;
  offerExpiringSoon?: boolean | null;
  interviewsAwaitingFeedback: number;
  lastInterviewAt?: string | null;
  nextInterviewAt?: string | null;
  nextInterviewType?: string | null;
  nextInterviewStatus?: string | null;
  latestRecommendation?: string | null;
}

/** Whole-pipeline analytics from `GET /api/pipeline/analytics`. */
export interface PipelineAnalytics {
  reachedByStage: Record<string, number>;
  medianStageHours: Record<string, number>;
  stageSampleSize: Record<string, number>;
  conversions: Record<string, Record<string, number>>;
  regressions: {
    applicationId: string;
    fromStage: string;
    toStage: string;
    reason?: string | null;
    occurredAt?: string | null;
  }[];
  transitions: number;
  transitionsWithoutDuration: number;
  slowestStage?: string | null;
  slowestStageDays?: number | null;
}

/**
 * Guards the fetch boundary.
 *
 * <p>Load-bearing here in a way it has not been elsewhere: this endpoint returned a 500 on every
 * call until the analytics were implemented, and the two pages that consume it swallowed the
 * failure. A shape check is what stops that recurring silently.
 */
export function isPipelineAnalytics(value: unknown): value is PipelineAnalytics {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.transitions === 'number' &&
    typeof candidate.medianStageHours === 'object' &&
    candidate.medianStageHours !== null &&
    typeof candidate.reachedByStage === 'object' &&
    candidate.reachedByStage !== null
  );
}

export function isBoardCard(value: unknown): value is BoardCard {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.availableTransitions);
}

/**
 * How long this candidate has been in their current stage, in days, or null if unknown.
 *
 * <p>Reads `pipelineStageEnteredAt`, never `updatedAt`. Rating a candidate writes
 * `updatedAt`, so measuring from it meant rating someone reset their apparent dwell to
 * zero and a stuck card silently became unstuck. That precedence was corrected earlier; this keeps
 * the correct field as the only one consulted, with no fallback that could reintroduce it.
 */
export function daysInStage(
  candidate: BoardCandidate,
  now: Date = new Date(),
): number | null {
  if (!candidate.pipelineStageEnteredAt) return null;
  const entered = new Date(candidate.pipelineStageEnteredAt);
  if (Number.isNaN(entered.getTime())) return null;
  return Math.max(0, Math.floor((now.getTime() - entered.getTime()) / 86_400_000));
}

/** The median days for a stage, or null when the server measured nothing for it. */
export function stageMedianDays(
  analytics: PipelineAnalytics | null,
  stage: string,
): number | null {
  const hours = analytics?.medianStageHours?.[stage];
  if (typeof hours !== 'number') return null;
  return hours / 24;
}

/**
 * How many measurements a stage median rests on.
 *
 * <p>Shown because a "median" of one is a single candidate's dwell time wearing a statistic's
 * clothes, and a card called stuck against it deserves that context.
 */
export function stageSampleSize(
  analytics: PipelineAnalytics | null,
  stage: string,
): number | null {
  const size = analytics?.stageSampleSize?.[stage];
  return typeof size === 'number' ? size : null;
}

/**
 * Is this candidate past their stage's median?
 *
 * <p>Null — not false — when either figure is missing. Without a median there is nothing to be past,
 * and reporting that as "not stuck" would quietly clear the board of the exact cards it exists to
 * surface.
 */
export function isStuck(
  candidate: BoardCandidate,
  analytics: PipelineAnalytics | null,
  now: Date = new Date(),
): boolean | null {
  const days = daysInStage(candidate, now);
  const median = stageMedianDays(analytics, candidate.stage);
  if (days === null || median === null) return null;
  return days > median;
}

/** Candidates past their stage median, longest overrun first. */
export function stuckCandidates<T extends BoardCandidate>(
  candidates: T[],
  analytics: PipelineAnalytics | null,
  now: Date = new Date(),
): T[] {
  return candidates
    .filter((candidate) => isStuck(candidate, analytics, now) === true)
    .sort((a, b) => (daysInStage(b, now) ?? 0) - (daysInStage(a, now) ?? 0));
}

/** Application ids that moved backwards, as a set for quick lookup per card. */
export function regressedIds(analytics: PipelineAnalytics | null): Set<string> {
  return new Set((analytics?.regressions ?? []).map((r) => String(r.applicationId)));
}

/**
 * The moves this card may legally make.
 *
 * <p>Empty array when the card has nowhere to go; **null when the batch did not answer for it**.
 * The board must render those differently — "no moves available" is a fact about the candidate,
 * "moves unavailable" is a fact about the request.
 */
export function legalMoves(card: BoardCard | undefined): string[] | null {
  if (!card) return null;
  return card.availableTransitions;
}

/** A short badge for the card's offer state, or null when there is no live offer. */
export function offerBadge(card: BoardCard | undefined): string | null {
  if (!card?.offerStatus) return null;
  const days = card.offerExpiresInDays;
  if (typeof days !== 'number') return 'Offer out — no expiry date';
  if (days < 0) return `Offer expired ${Math.abs(days)}d ago`;
  if (days === 0) return 'Offer expires today';
  return `Offer expires in ${days}d`;
}

/** A short badge when interview write-ups are owed, or null when none are. */
export function feedbackBadge(card: BoardCard | undefined): string | null {
  const owed = card?.interviewsAwaitingFeedback ?? 0;
  if (owed <= 0) return null;
  return owed === 1 ? 'Write-up overdue' : `${owed} write-ups overdue`;
}

/**
 * Why the board no longer computes its own conversion rate.
 *
 * <p>It calculated `stageApplications.length / basis * 100` — the share of candidates
 * <b>sitting in</b> a stage. That is a snapshot of where people are now, not the share who
 * progressed through, and the two diverge completely on any pipeline where candidates move at
 * different speeds. `conversions` on the analytics response is a real from-stage →
 * to-stage transition count and has been available the whole time.
 */
export const conversionIsNotDistribution =
  'Conversion is measured from stage transitions, not from how many candidates sit in each column.';

/**
 * The largest fall-off between two consecutive stages, from real conversions.
 *
 * <p>Returns null rather than guessing when fewer than two stages have been reached — one stage is
 * not a funnel.
 */
export function biggestDropOff(
  analytics: PipelineAnalytics | null,
  stageOrder: string[],
): { fromStage: string; toStage: string; lostPercent: number; lostCount: number } | null {
  if (!analytics) return null;
  const present = stageOrder.filter((stage) => typeof analytics.reachedByStage[stage] === 'number');
  if (present.length < 2) return null;

  let worst: { fromStage: string; toStage: string; lostPercent: number; lostCount: number } | null = null;
  for (let i = 0; i + 1 < present.length; i++) {
    const before = analytics.reachedByStage[present[i]];
    const after = analytics.reachedByStage[present[i + 1]];
    if (before <= 0) continue;
    const lostCount = before - after;
    const lostPercent = (lostCount / before) * 100;
    if (!worst || lostPercent > worst.lostPercent) {
      worst = { fromStage: present[i], toStage: present[i + 1], lostPercent, lostCount };
    }
  }
  return worst;
}

/** A stage duration in the unit a recruiter reasons in. Null stays null. */
export function daysLabel(days: number | null): string | null {
  if (days === null) return null;
  if (days < 1) {
    const hours = Math.round(days * 24);
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  const rounded = Math.round(days);
  return rounded === 1 ? '1 day' : `${rounded} days`;
}

/**
 * The triage filters above the board.
 *
 * <p>On a record you state one ask; on a board every card is an ask, so the useful line is what is
 * wrong — and each count is a filter rather than a decoration.
 */
export const BOARD_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'stuck', label: 'Stuck' },
  { key: 'regressed', label: 'Moved back' },
  { key: 'action-owed', label: 'Action owed' },
];

/** Does this card owe somebody an action right now? */
export function actionOwed(card: BoardCard | undefined): boolean {
  if (!card) return false;
  return (card.interviewsAwaitingFeedback ?? 0) > 0 || card.offerExpiringSoon === true;
}

export function matchesFilter(
  filterKey: string,
  candidate: BoardCandidate,
  card: BoardCard | undefined,
  analytics: PipelineAnalytics | null,
  regressed: Set<string>,
  now: Date = new Date(),
): boolean {
  switch (filterKey) {
    case 'all':
      return true;
    case 'stuck':
      return isStuck(candidate, analytics, now) === true;
    case 'regressed':
      return regressed.has(String(candidate.id));
    case 'action-owed':
      return actionOwed(card);
    default:
      return true;
  }
}
