/**
 * What each pipeline stage has to say about a candidate.
 *
 * <p>The board and its detail modal were one shape repeated seven times: every card carried the
 * markup for every stage, so a Checks candidate paid for interview rows and an Applied candidate
 * showed a rating nobody had given. The stages do not ask the same question — Applied asks *is this
 * worth screening*, Checks asks *may this person be offered*, Hired asks nothing at all — and this
 * is where that difference is decided, once, for both surfaces.
 *
 * <p>Pure on purpose. The card renders {@link StageState.line}, the modal renders
 * {@link StageState.headline} and {@link StageState.detail}, and neither computes anything of its
 * own, so the two can never disagree about whether a candidate is stuck.
 */

import {
  BoardCard,
  PipelineAnalytics,
  daysInStage,
  feedbackBadge,
  offerBadge,
  stageMedianDays,
  stageSampleSize,
} from './board';

/**
 * How the stage feels about this candidate.
 *
 * <p>`settled` nothing is owed · `owed` somebody must act · `stopped` progress is barred ·
 * `neutral` in flight, on time, nothing to say.
 */
export type SignalTone = 'settled' | 'owed' | 'stopped' | 'neutral';

/**
 * Below this many measurements a stage median is one person's dwell time wearing a statistic's
 * clothes, and calling a card late against it is worse than saying nothing.
 */
export const MIN_MEDIAN_SAMPLE = 5;

/** The verification fields this module reads. `VerificationSummary` satisfies it structurally. */
export interface ChecksState {
  clearCount: number;
  totalRequired: number;
  hasAdverse: boolean;
  allClear: boolean;
  noneStarted: boolean;
  enforceCheckCompletion: boolean;
}

export interface StageInput {
  /** The column: applied · screening · interviews · checks · offer · accepted · hired. */
  groupId: string;
  backendStage: string;
  pipelineStageEnteredAt?: string | null;
  /** Whether a screening note has been recorded. */
  hasScreeningNote?: boolean;
  card?: BoardCard;
  verification?: ChecksState | null;
  analytics?: PipelineAnalytics | null;
  regressed?: boolean;
  now?: Date;
}

export interface StageState {
  tone: SignalTone;
  /** The card's single line. Null means the stage has nothing worth a line. */
  line: string | null;
  /** The modal's decision, in the stage's own words. Null only where `line` is null. */
  headline: string | null;
  /** One line of context under the headline. */
  detail: string | null;
  /**
   * What discharges it.
   *
   * <p>`move` is the stage transition and `reveal` opens the evidence that explains the state.
   * There is deliberately no `chase` — no endpoint sends an interviewer a reminder or a screening
   * provider a nudge, and a button that appears to do so is the dead control this product has been
   * removing all year.
   */
  action: 'move' | 'reveal' | 'none';
}

const NOTHING: StageState = { tone: 'neutral', line: null, headline: null, detail: null, action: 'none' };

/** Dwell in the current stage, from the real entry timestamp only. */
function dwellDays(input: StageInput): number | null {
  return daysInStage(
    {
      id: 0,
      candidateName: '',
      stage: input.backendStage,
      pipelineStageEnteredAt: input.pipelineStageEnteredAt,
    },
    input.now ?? new Date(),
  );
}

/**
 * The stage median, but only where enough measurements stand behind it.
 *
 * <p>Returns null below {@link MIN_MEDIAN_SAMPLE}, which drops the comparison from the card rather
 * than qualifying it — "median here is 6d (2 measured)" is a sentence nobody can act on.
 */
function trustedMedian(input: StageInput): number | null {
  const median = stageMedianDays(input.analytics ?? null, input.backendStage);
  if (median === null) return null;
  const sample = stageSampleSize(input.analytics ?? null, input.backendStage) ?? 0;
  return sample >= MIN_MEDIAN_SAMPLE ? median : null;
}

function waitingLine(input: StageInput): StageState {
  const days = dwellDays(input);
  if (days === null) {
    return { tone: 'neutral', line: 'Time in stage unknown', headline: 'Time in stage unknown',
      detail: 'No stage-entry timestamp was recorded, so dwell cannot be measured.', action: 'reveal' };
  }

  const median = trustedMedian(input);
  const waited = days === 0 ? 'Arrived today' : `Waiting ${days}d`;

  if (median !== null && days > median) {
    const rounded = Math.round(median);
    return {
      tone: 'owed',
      line: `${waited} — median is ${rounded}d`,
      headline: `${waited} to be screened`,
      detail: `Median for this stage is ${rounded} ${rounded === 1 ? 'day' : 'days'}.`,
      action: 'move',
    };
  }
  return { tone: 'neutral', line: waited, headline: waited, detail: null, action: 'move' };
}

function screeningState(input: StageInput): StageState {
  if (!input.hasScreeningNote) {
    const days = dwellDays(input);
    return {
      tone: 'owed',
      line: 'No screening note',
      headline: 'No screening note recorded',
      detail: days === null
        ? 'A decision without a note leaves no audit trail.'
        : `${days === 0 ? 'Arrived today' : `${days} ${days === 1 ? 'day' : 'days'} in Screening`} — a decision without a note leaves no audit trail.`,
      action: 'reveal',
    };
  }
  const waiting = waitingLine(input);
  if (waiting.tone === 'owed') return waiting;
  return { tone: 'settled', line: 'Note recorded', headline: 'Screening note recorded',
    detail: 'Ready for a decision.', action: 'move' };
}

function interviewState(input: StageInput): StageState {
  const owed = feedbackBadge(input.card);
  if (owed) {
    return {
      tone: 'stopped',
      line: owed,
      headline: owed,
      detail: 'Advancing before the write-ups are in loses the reasons for the decision.',
      action: 'reveal',
    };
  }

  const next = input.card?.nextInterviewAt ? new Date(input.card.nextInterviewAt) : null;
  const now = input.now ?? new Date();
  if (next && !Number.isNaN(next.getTime())) {
    const type = input.card?.nextInterviewType ? humanise(input.card.nextInterviewType) : 'Interview';
    const when = next.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
    const time = next.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
    if (next.getTime() >= now.getTime()) {
      return { tone: 'settled', line: `${type} ${when}`, headline: `${type} on ${when}, ${time}`,
        detail: 'Scheduled and confirmed.', action: 'none' };
    }
    const late = Math.floor((now.getTime() - next.getTime()) / 86_400_000);
    return {
      tone: 'owed',
      line: late === 0 ? `${type} was today` : `${type} was ${late}d ago`,
      headline: `${type} on ${when} has not been closed out`,
      detail: 'Mark it complete, or reschedule it.',
      action: 'reveal',
    };
  }

  if (input.card?.latestRecommendation) {
    return { tone: 'settled', line: humanise(input.card.latestRecommendation),
      headline: `Latest recommendation: ${humanise(input.card.latestRecommendation)}`,
      detail: 'No further interview scheduled.', action: 'move' };
  }
  return { tone: 'owed', line: 'No interview scheduled', headline: 'No interview scheduled',
    detail: 'Nothing is booked and no feedback has been recorded.', action: 'reveal' };
}

function checksStateFor(input: StageInput): StageState {
  const v = input.verification;
  if (!v || v.totalRequired === 0) {
    return { tone: 'neutral', line: 'No checks required', headline: 'No checks required for this role',
      detail: null, action: 'move' };
  }
  if (v.hasAdverse) {
    return { tone: 'stopped', line: 'Adverse finding', headline: 'Adverse finding — review required',
      detail: 'Progression is barred until the finding is reviewed.', action: 'reveal' };
  }
  if (v.allClear) {
    return { tone: 'settled', line: `All ${v.totalRequired} clear`,
      headline: `All ${v.totalRequired} checks clear`, detail: 'Cleared to proceed to Offer.', action: 'move' };
  }
  const outstanding = v.totalRequired - v.clearCount;
  if (v.enforceCheckCompletion) {
    return {
      tone: 'stopped',
      line: `${v.clearCount} of ${v.totalRequired} clear`,
      headline: `Blocked from Offer — ${outstanding} of ${v.totalRequired} outstanding`,
      detail: 'This vacancy enforces check completion. The move will be refused until all clear.',
      action: 'reveal',
    };
  }
  return {
    tone: 'owed',
    line: v.noneStarted ? 'Checks not started' : `${v.clearCount} of ${v.totalRequired} clear`,
    headline: v.noneStarted ? 'Verification checks not started' : `${v.clearCount} of ${v.totalRequired} checks clear`,
    detail: `${outstanding} still outstanding.`,
    action: 'reveal',
  };
}

function offerState(input: StageInput): StageState {
  const badge = offerBadge(input.card);
  if (!badge) {
    return { tone: 'owed', line: 'Offer not prepared', headline: 'No offer prepared yet',
      detail: 'Nothing has been sent to the candidate.', action: 'reveal' };
  }
  const days = input.card?.offerExpiresInDays;
  const expired = typeof days === 'number' && days < 0;
  const soon = input.card?.offerExpiringSoon === true || (typeof days === 'number' && days <= 2);
  return {
    tone: expired ? 'stopped' : soon ? 'owed' : 'neutral',
    line: badge,
    headline: badge,
    detail: expired
      ? 'The offer lapsed without a recorded response.'
      : 'No response recorded yet.',
    action: 'reveal',
  };
}

/**
 * Everything the stage has to say, or {@link NOTHING} where it has nothing.
 *
 * <p>Regression outranks every stage-specific signal: a candidate who moved backwards is a fact
 * about the process, not about the stage they landed in.
 */
export function stageState(input: StageInput): StageState {
  if (input.regressed) {
    return { tone: 'stopped', line: 'Moved back', headline: 'This candidate was moved backwards',
      detail: 'Check the history for the reason before acting.', action: 'reveal' };
  }

  switch (input.groupId) {
    case 'applied':
      return waitingLine(input);
    case 'screening':
      return screeningState(input);
    case 'interviews':
      return interviewState(input);
    case 'checks':
      return checksStateFor(input);
    case 'offer':
      return offerState(input);
    case 'accepted':
      return { tone: 'settled', line: 'Offer accepted', headline: 'Offer accepted',
        detail: 'Awaiting the start date.', action: 'move' };
    case 'hired':
      // Nothing is owed and nothing is pending. A bar reading "no action required" is noise with a
      // border round it, so the modal renders a settled statement instead and the card says nothing.
      return NOTHING;
    default:
      return NOTHING;
  }
}

/** Tailwind classes for a tone, as a left edge on the card. */
export const TONE_EDGE: Record<SignalTone, string> = {
  settled: 'before:bg-accent-teal',
  owed: 'before:bg-accent-gold',
  stopped: 'before:bg-accent-pink',
  neutral: 'before:bg-transparent',
};

/** Tailwind classes for a tone, as the card's signal text. */
export const TONE_TEXT: Record<SignalTone, string> = {
  settled: 'text-accent-teal',
  owed: 'text-accent-gold',
  stopped: 'text-accent-pink',
  neutral: 'text-muted-foreground',
};

/** Tailwind classes for a tone, as the modal's decision bar. */
export const TONE_BAR: Record<SignalTone, string> = {
  settled: 'border-l-accent-teal bg-surface-teal/40',
  owed: 'border-l-accent-gold bg-surface-gold/40',
  stopped: 'border-l-accent-pink bg-surface-pink/40',
  neutral: 'border-l-border bg-muted/40',
};

/** `PANEL_INTERVIEW` → `Panel interview`. Local so this module stays free of UI imports. */
function humanise(value: string): string {
  const words = value.replace(/_/g, ' ').toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
