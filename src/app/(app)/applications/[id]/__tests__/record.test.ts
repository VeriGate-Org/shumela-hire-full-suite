import {
  ApplicationRecord,
  actionsFor,
  buildRail,
  decisionFor,
  hasEnded,
  isReversible,
  narrative,
  narrativeFilled,
  stagePosition,
} from '../record';

function record(overrides: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return {
    id: 'app-1',
    status: 'SUBMITTED',
    applicantName: 'Thabo Nkosi',
    jobTitle: 'Investment Analyst',
    department: 'Strategic Business Unit',
    applicationSource: 'Careers site',
    daysFromSubmission: 23,
    allowedTransitions: ['SCREENING', 'REJECTED', 'WITHDRAWN'],
    ...overrides,
  };
}

describe('stagePosition', () => {
  it('places a live application in the chain', () => {
    expect(stagePosition('SUBMITTED')).toEqual({ index: 1, total: 5 });
    expect(stagePosition('SCREENING')).toEqual({ index: 2, total: 5 });
    expect(stagePosition('INTERVIEW_COMPLETED')).toEqual({ index: 3, total: 5 });
    expect(stagePosition('OFFERED')).toEqual({ index: 4, total: 5 });
    expect(stagePosition('HIRED')).toEqual({ index: 5, total: 5 });
  });

  it('gives an ended candidacy no position at all', () => {
    // A rejected candidate is not at stage two of five; a position would imply they are moving.
    expect(stagePosition('REJECTED')).toBeNull();
    expect(stagePosition('WITHDRAWN')).toBeNull();
    expect(stagePosition('OFFER_DECLINED')).toBeNull();
  });

  it('gives an unrecognised status no position rather than guessing one', () => {
    expect(stagePosition('SOMETHING_NEW')).toBeNull();
  });
});

describe('buildRail', () => {
  it('marks everything before the current stage done and everything after it to come', () => {
    const rail = buildRail(record({ status: 'INTERVIEW_SCHEDULED' }));
    expect(rail.map((stage) => stage.state)).toEqual(['done', 'done', 'current', 'todo', 'todo']);
  });

  it('never carries a dwell figure or an actor on a live stage', () => {
    // The design showed "11 days here" and a name against each stage. Nothing records either.
    const rail = buildRail(record({ status: 'SCREENING' }));
    rail.forEach((stage) => expect(stage.days).toBeUndefined());
    expect(rail[0].actor).toBeUndefined();
  });

  it('stops at the furthest stage there is evidence of', () => {
    // The terminal status says the candidacy ended, never where — the notes are the evidence.
    const rail = buildRail(
      record({ status: 'REJECTED', screeningNotes: 'Does not hold the required Honours.' }),
    );
    expect(rail.map((stage) => stage.state)).toEqual(['done', 'stopped', 'todo', 'todo', 'todo']);
    expect(rail[1].actor).toBe('Rejected here');
  });

  it('stops at Applied when nothing downstream produced anything', () => {
    const rail = buildRail(record({ status: 'REJECTED' }));
    expect(rail[0].state).toBe('stopped');
  });

  it('uses interview feedback as evidence the interview happened', () => {
    const rail = buildRail(
      record({ status: 'REJECTED', screeningNotes: 'Advancing.', interviewFeedback: 'Not a fit.' }),
    );
    expect(rail.map((stage) => stage.state)).toEqual(['done', 'done', 'stopped', 'todo', 'todo']);
  });

  it('says a stage was not reached rather than leaving it blank', () => {
    const rail = buildRail(record({ status: 'WITHDRAWN' }));
    expect(rail[3].actor).toBe('Not reached');
  });
});

describe('actionsFor', () => {
  it('offers exactly what the API says is legal', () => {
    const actions = actionsFor(record());
    expect(actions.map((a) => a.status)).toEqual(['SCREENING', 'WITHDRAWN', 'REJECTED']);
  });

  it('offers nothing at all for a terminal status', () => {
    // Not a display quirk: canTransitionTo returns false for every target from REJECTED.
    expect(actionsFor(record({ status: 'REJECTED', allowedTransitions: [] }))).toEqual([]);
  });

  it('offers nothing when the API sent no transitions, rather than assuming any', () => {
    expect(actionsFor(record({ allowedTransitions: undefined }))).toEqual([]);
  });

  it('puts the forward action first and the destructive one last', () => {
    const actions = actionsFor(
      record({ status: 'INTERVIEW_COMPLETED', allowedTransitions: ['REJECTED', 'REFERENCE_CHECK', 'OFFER_PENDING'] }),
    );
    expect(actions[0].status).toBe('OFFER_PENDING');
    expect(actions[actions.length - 1].status).toBe('REJECTED');
  });

  it('ignores a transition it has no wording for rather than showing a raw enum', () => {
    const actions = actionsFor(record({ allowedTransitions: ['SCREENING', 'NOT_A_STATUS'] }));
    expect(actions.map((a) => a.status)).toEqual(['SCREENING']);
  });
});

describe('isReversible', () => {
  it('reports that rejection is final, because the API refuses to undo it', () => {
    // The confirmation dialog promised the opposite on a screen with no way to change it back.
    expect(isReversible('REJECTED')).toBe(false);
    expect(isReversible('WITHDRAWN')).toBe(false);
    expect(isReversible('OFFER_DECLINED')).toBe(false);
    expect(isReversible('HIRED')).toBe(false);
  });

  it('reports a live status as changeable', () => {
    expect(isReversible('SCREENING')).toBe(true);
  });
});

describe('decisionFor', () => {
  it('leads with the gap on an unscreened application', () => {
    const decision = decisionFor(record());
    expect(decision.ask).toMatch(/never been screened/i);
    expect(decision.why).toContain('23 days');
    expect(decision.tone).toBe('owed');
  });

  it('says a decision is owed once feedback is in', () => {
    const decision = decisionFor(
      record({ status: 'INTERVIEW_COMPLETED', interviewFeedback: 'Best candidate so far.' }),
    );
    expect(decision.ask).toMatch(/decision is owed/i);
  });

  it('distinguishes an interview with no feedback from one with feedback', () => {
    const decision = decisionFor(record({ status: 'INTERVIEW_COMPLETED' }));
    expect(decision.ask).toMatch(/no feedback has been filed/i);
  });

  it('says where regret correspondence actually happens', () => {
    // Otherwise a rejected candidate goes untold and nothing on the page says why.
    const decision = decisionFor(record({ status: 'REJECTED' }));
    expect(decision.tone).toBe('stopped');
    expect(decision.why).toMatch(/Offers screen/);
  });

  it('reads a hire as settled rather than as owed', () => {
    expect(decisionFor(record({ status: 'HIRED' })).tone).toBe('settled');
  });
});

describe('narrative', () => {
  it('always lists every stage, so a gap is visible rather than a missing card', () => {
    const entries = narrative(record());
    expect(entries.map((entry) => entry.stage)).toEqual(['Applied', 'Screening', 'Interview']);
  });

  it('names the outstanding step on an unscreened application', () => {
    const entries = narrative(record({ status: 'SUBMITTED' }));
    expect(entries[1].absent).toMatch(/outstanding/i);
  });

  it('adds an outcome entry only when there is an outcome to explain', () => {
    expect(narrative(record()).some((entry) => entry.stage === 'Outcome')).toBe(false);

    const rejected = narrative(
      record({ status: 'REJECTED', rejectionReason: 'Requires an Honours qualification.' }),
    );
    const outcome = rejected.find((entry) => entry.stage === 'Outcome')!;
    expect(outcome.kind).toBe('Rejection reason');
    expect(outcome.body).toContain('Honours');
  });

  it('labels a withdrawal as the candidate’s reason, not a rejection', () => {
    const entries = narrative(record({ status: 'WITHDRAWN', withdrawalReason: 'Accepted elsewhere.' }));
    expect(entries.find((entry) => entry.stage === 'Outcome')!.kind).toBe('Withdrawal reason');
  });

  it('treats whitespace-only notes as absent', () => {
    const entries = narrative(record({ screeningNotes: '   ' }));
    expect(entries[1].body).toBeUndefined();
  });

  it('counts only the stages that produced something', () => {
    const entries = narrative(record({ coverLetter: 'I am applying…', screeningNotes: 'Advancing.' }));
    expect(narrativeFilled(entries)).toBe(2);
  });
});

describe('hasEnded', () => {
  it('counts a declined offer as ended', () => {
    expect(hasEnded('OFFER_DECLINED')).toBe(true);
    expect(hasEnded('OFFERED')).toBe(false);
  });
});
