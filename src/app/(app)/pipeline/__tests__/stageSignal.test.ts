import { MIN_MEDIAN_SAMPLE, StageInput, stageState } from '../stageSignal';
import { BoardCard, PipelineAnalytics } from '../board';

/**
 * The board and the modal now read one derivation, so this is the only place either of them can be
 * wrong about a candidate.
 */

const NOW = new Date('2026-08-26T09:00:00Z');

function analytics(medianHours: Record<string, number>, sample: Record<string, number>): PipelineAnalytics {
  return {
    reachedByStage: {},
    medianStageHours: medianHours,
    stageSampleSize: sample,
    conversions: {},
    regressions: [],
    transitions: 0,
    transitionsWithoutDuration: 0,
  };
}

function card(overrides: Partial<BoardCard> = {}): BoardCard {
  return { availableTransitions: [], interviewsAwaitingFeedback: 0, ...overrides };
}

function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 86_400_000).toISOString();
}

function base(overrides: Partial<StageInput>): StageInput {
  return { groupId: 'applied', backendStage: 'APPLICATION_RECEIVED', now: NOW, ...overrides };
}

describe('stageState', () => {
  describe('Applied', () => {
    it('calls a candidate late only against a median with enough measurements behind it', () => {
      const late = base({
        pipelineStageEnteredAt: daysAgo(9),
        analytics: analytics({ APPLICATION_RECEIVED: 96 }, { APPLICATION_RECEIVED: MIN_MEDIAN_SAMPLE }),
      });
      expect(stageState(late).tone).toBe('owed');
      expect(stageState(late).line).toContain('median is 4d');
    });

    it('says nothing about the median when it rests on too few measurements', () => {
      // The figure exists; it is one person's dwell time wearing a statistic's clothes, and calling
      // a card late against it is worse than saying nothing.
      const thin = base({
        pipelineStageEnteredAt: daysAgo(9),
        analytics: analytics({ APPLICATION_RECEIVED: 96 }, { APPLICATION_RECEIVED: MIN_MEDIAN_SAMPLE - 1 }),
      });
      expect(stageState(thin).tone).toBe('neutral');
      expect(stageState(thin).line).toBe('Waiting 9d');
    });

    it('reports an absent stage-entry timestamp rather than inventing a dwell', () => {
      const state = stageState(base({ pipelineStageEnteredAt: null }));
      expect(state.line).toBe('Time in stage unknown');
    });
  });

  describe('Screening', () => {
    it('leads with the missing note, which is the thing that has to exist before a decision', () => {
      const state = stageState(base({
        groupId: 'screening',
        backendStage: 'INITIAL_SCREENING',
        pipelineStageEnteredAt: daysAgo(4),
        hasScreeningNote: false,
      }));
      expect(state.tone).toBe('owed');
      expect(state.headline).toBe('No screening note recorded');
      // Reveal, not move: the point is to write the note, not to skip past it.
      expect(state.action).toBe('reveal');
    });

    it('settles once a note is recorded and the stage is on time', () => {
      const state = stageState(base({
        groupId: 'screening',
        backendStage: 'INITIAL_SCREENING',
        pipelineStageEnteredAt: daysAgo(1),
        hasScreeningNote: true,
      }));
      expect(state.tone).toBe('settled');
      expect(state.action).toBe('move');
    });
  });

  describe('Interviews', () => {
    it('treats owed write-ups as stopping progress, and offers no invented chase', () => {
      const state = stageState(base({
        groupId: 'interviews',
        backendStage: 'PANEL_INTERVIEW',
        card: card({ interviewsAwaitingFeedback: 2, nextInterviewAt: daysAgo(-3) }),
      }));
      expect(state.tone).toBe('stopped');
      expect(state.line).toBe('2 write-ups overdue');
      // No endpoint reminds an interviewer, so the bar must not appear to.
      expect(state.action).toBe('reveal');
    });

    it('reads a scheduled interview as settled', () => {
      const state = stageState(base({
        groupId: 'interviews',
        backendStage: 'PANEL_INTERVIEW',
        card: card({ nextInterviewAt: daysAgo(-2), nextInterviewType: 'PANEL_INTERVIEW' }),
      }));
      expect(state.tone).toBe('settled');
      expect(state.line).toContain('Panel interview');
    });

    it('flags an interview whose date has passed without feedback', () => {
      const state = stageState(base({
        groupId: 'interviews',
        backendStage: 'FIRST_INTERVIEW',
        card: card({ nextInterviewAt: daysAgo(3), nextInterviewType: 'FIRST_INTERVIEW' }),
      }));
      expect(state.tone).toBe('owed');
      expect(state.line).toBe('First interview was 3d ago');
    });
  });

  describe('Checks', () => {
    const checks = (o: Partial<StageInput['verification']> = {}) => ({
      clearCount: 3, totalRequired: 5, hasAdverse: false, allClear: false,
      noneStarted: false, enforceCheckCompletion: true, ...o,
    });

    it('states the refusal before anyone reaches for the move button', () => {
      const state = stageState(base({
        groupId: 'checks', backendStage: 'BACKGROUND_CHECK', verification: checks(),
      }));
      expect(state.tone).toBe('stopped');
      expect(state.headline).toContain('Blocked from Offer');
      expect(state.action).toBe('reveal');
    });

    it('does not claim a block where the vacancy does not enforce completion', () => {
      const state = stageState(base({
        groupId: 'checks', backendStage: 'BACKGROUND_CHECK',
        verification: checks({ enforceCheckCompletion: false }),
      }));
      expect(state.tone).toBe('owed');
      expect(state.headline).not.toContain('Blocked');
    });

    it('offers the move once everything is clear', () => {
      const state = stageState(base({
        groupId: 'checks', backendStage: 'BACKGROUND_CHECK',
        verification: checks({ clearCount: 5, allClear: true }),
      }));
      expect(state.tone).toBe('settled');
      expect(state.action).toBe('move');
    });

    it('an adverse finding outranks the count', () => {
      const state = stageState(base({
        groupId: 'checks', backendStage: 'BACKGROUND_CHECK',
        verification: checks({ hasAdverse: true }),
      }));
      expect(state.tone).toBe('stopped');
      expect(state.line).toBe('Adverse finding');
    });
  });

  describe('Offer', () => {
    it('an expired offer is stopped, not merely late', () => {
      const state = stageState(base({
        groupId: 'offer', backendStage: 'OFFER_EXTENDED',
        card: card({ offerStatus: 'EXTENDED', offerExpiresInDays: -1 }),
      }));
      expect(state.tone).toBe('stopped');
    });

    it('an offer expiring within two days is owed', () => {
      const state = stageState(base({
        groupId: 'offer', backendStage: 'OFFER_EXTENDED',
        card: card({ offerStatus: 'EXTENDED', offerExpiresInDays: 2 }),
      }));
      expect(state.tone).toBe('owed');
      expect(state.line).toBe('Offer expires in 2d');
    });

    it('says the offer is unprepared rather than inventing an expiry', () => {
      const state = stageState(base({ groupId: 'offer', backendStage: 'OFFER_PREPARATION', card: card() }));
      expect(state.line).toBe('Offer not prepared');
    });
  });

  describe('Hired', () => {
    it('says nothing, because nothing is owed', () => {
      const state = stageState(base({ groupId: 'hired', backendStage: 'HIRED' }));
      expect(state.line).toBeNull();
      expect(state.headline).toBeNull();
      expect(state.action).toBe('none');
    });
  });

  it('a candidate moved backwards outranks whatever stage they landed in', () => {
    const state = stageState(base({
      groupId: 'checks',
      backendStage: 'BACKGROUND_CHECK',
      regressed: true,
      verification: {
        clearCount: 5, totalRequired: 5, hasAdverse: false, allClear: true,
        noneStarted: false, enforceCheckCompletion: true,
      },
    }));
    expect(state.tone).toBe('stopped');
    expect(state.line).toBe('Moved back');
  });
});
