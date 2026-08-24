import {
  APPLICANT_FILTERS,
  APPLICANT_SORTS,
  ApplicantRow,
  ApplicationSummary,
  MAX_SUMMARY_BATCH,
  documentCount,
  filterCount,
  historyLabel,
  isApplicantSummary,
  isApplicationSummary,
  isRepeatApplicant,
  lastAppliedLabel,
  matchesFilter,
  skillList,
  sortFor,
  stateOf,
  summaryIds,
  timesApplied,
} from '../queue';

function summary(overrides: Partial<ApplicationSummary> = {}): ApplicationSummary {
  return { total: 1, active: 0, hired: false, ...overrides };
}

function applicant(overrides: Partial<ApplicantRow> = {}): ApplicantRow {
  return {
    id: 'a1',
    name: 'Thandi',
    surname: 'Zwane',
    email: 'thandi@example.com',
    createdAt: '2026-01-04T09:00:00',
    ...overrides,
  };
}

describe('stateOf', () => {
  it('separates a first-time registrant from someone with a history', () => {
    expect(stateOf(summary({ total: 0 }))).toBe('never-applied');
    expect(stateOf(summary({ total: 3, active: 1 }))).toBe('in-process');
  });

  it('reports a missing summary as unknown, never as never-applied', () => {
    // "We did not load it" and "this person has never applied" are different claims. Conflating
    // them would report a whole page as fresh candidates the moment the batch call failed.
    expect(stateOf(null)).toBe('unknown');
    expect(stateOf(undefined)).toBe('unknown');
  });

  it('puts previously hired ahead of in process', () => {
    // Someone hired before and applying again is both. Which one a recruiter needs first is the
    // fact that they already worked here.
    expect(stateOf(summary({ total: 2, active: 1, hired: true }))).toBe('previously-hired');
  });

  it('calls someone with only closed applications a past applicant', () => {
    expect(stateOf(summary({ total: 4, active: 0, hired: false }))).toBe('past-applicant');
  });
});

describe('timesApplied and isRepeatApplicant', () => {
  it('reports zero applications as zero', () => {
    expect(timesApplied(summary({ total: 0 }))).toBe(0);
  });

  it('is null when the history is unknown, not zero', () => {
    expect(timesApplied(null)).toBeNull();
    expect(isRepeatApplicant(null)).toBeNull();
  });

  it('needs two applications, not one', () => {
    expect(isRepeatApplicant(summary({ total: 1 }))).toBe(false);
    expect(isRepeatApplicant(summary({ total: 2 }))).toBe(true);
  });
});

describe('historyLabel', () => {
  it('says what the history is in the row', () => {
    expect(historyLabel(summary({ total: 4, active: 1, hired: true }))).toBe(
      '4 applications · 1 live · hired',
    );
  });

  it('singularises one application', () => {
    expect(historyLabel(summary({ total: 1 }))).toBe('1 application');
  });

  it('distinguishes never applied from not loaded', () => {
    expect(historyLabel(summary({ total: 0 }))).toBe('No applications');
    expect(historyLabel(null)).toBeNull();
  });
});

describe('lastAppliedLabel', () => {
  it('formats a stored timestamp', () => {
    expect(lastAppliedLabel(summary({ lastAppliedAt: '2026-03-18T08:30:00' }))).toContain('2026');
  });

  it('is null when never applied or unknown', () => {
    expect(lastAppliedLabel(summary({ lastAppliedAt: null }))).toBeNull();
    expect(lastAppliedLabel(null)).toBeNull();
  });

  it('is null on an unparseable date rather than "Invalid Date"', () => {
    // A broken timestamp should look absent, not authoritative.
    expect(lastAppliedLabel(summary({ lastAppliedAt: 'nonsense' }))).toBeNull();
  });
});

describe('skillList', () => {
  it('splits the free-text field for display', () => {
    expect(skillList(applicant({ skills: 'Credit risk, IFRS 9; Python' }))).toEqual([
      'Credit risk',
      'IFRS 9',
      'Python',
    ]);
  });

  it('is empty rather than one blank chip when nothing is recorded', () => {
    expect(skillList(applicant({ skills: '' }))).toEqual([]);
    expect(skillList(applicant())).toEqual([]);
    expect(skillList(applicant({ skills: ' , ; ' }))).toEqual([]);
  });
});

describe('documentCount', () => {
  it('counts what is on file', () => {
    expect(documentCount(applicant({ documents: [{ id: 'd1' }, { id: 'd2' }] }))).toBe(2);
  });

  it('is zero for an empty list and null when the field is absent', () => {
    // An applicant with no documents and a list endpoint that omits documents are different facts.
    expect(documentCount(applicant({ documents: [] }))).toBe(0);
    expect(documentCount(applicant())).toBeNull();
  });
});

describe('filterCount', () => {
  const counts = {
    registered: 1486,
    neverApplied: 418,
    appliedOnce: 855,
    repeatApplicants: 213,
    inProcessNow: 127,
    previouslyHired: 34,
    applicationsRecorded: 1402,
    orphanedApplications: 0,
  };

  it('reads each chip off the whole-set summary', () => {
    expect(filterCount(counts, 'all')).toBe(1486);
    expect(filterCount(counts, 'repeat')).toBe(213);
    expect(filterCount(counts, 'in-process')).toBe(127);
    expect(filterCount(counts, 'previously-hired')).toBe(34);
    expect(filterCount(counts, 'never-applied')).toBe(418);
  });

  it('is null without a summary, never zero', () => {
    expect(filterCount(null, 'repeat')).toBeNull();
  });

  it('covers every chip', () => {
    APPLICANT_FILTERS.forEach((filter) =>
      expect(filterCount(counts, filter.key)).not.toBeNull(),
    );
  });

  it('the volume segments account for everybody', () => {
    expect(counts.neverApplied + counts.appliedOnce + counts.repeatApplicants).toBe(counts.registered);
  });
});

describe('matchesFilter', () => {
  it('selects repeat applicants by count rather than by state', () => {
    // A repeat applicant can be in any state, so this cannot be a state test.
    expect(matchesFilter('repeat', summary({ total: 3, hired: true }))).toBe(true);
    expect(matchesFilter('repeat', summary({ total: 1 }))).toBe(false);
  });

  it('excludes a row whose history never loaded rather than guessing', () => {
    expect(matchesFilter('repeat', null)).toBe(false);
    expect(matchesFilter('never-applied', null)).toBe(false);
  });

  it('lets everything through the all chip, loaded or not', () => {
    expect(matchesFilter('all', null)).toBe(true);
    expect(matchesFilter('all', summary())).toBe(true);
  });
});

describe('sortFor', () => {
  it('maps every offered option to a real API sort', () => {
    APPLICANT_SORTS.forEach((option) => {
      const resolved = sortFor(option.key);
      expect(resolved.sort).toBe(option.sort);
      expect(resolved.direction).toBe(option.direction);
    });
  });

  it('falls back to newest first on an unknown key', () => {
    expect(sortFor('nonsense')).toEqual({ sort: 'createdAt', direction: 'desc' });
  });
});

describe('summaryIds', () => {
  it('takes the ids as strings, whatever the row declared', () => {
    expect(summaryIds([applicant({ id: 7 }), applicant({ id: 'a2' })])).toEqual(['7', 'a2']);
  });

  it('never asks for more than the server accepts', () => {
    // The server rejects an over-long batch rather than truncating it, so the cap belongs here too.
    const rows = Array.from({ length: MAX_SUMMARY_BATCH + 25 }, (_, i) => applicant({ id: `a${i}` }));
    expect(summaryIds(rows)).toHaveLength(MAX_SUMMARY_BATCH);
  });
});

describe('shape guards', () => {
  it('rejects a payload that is truthy but not a summary', () => {
    // An error body is an object too. Reading .registered off it renders a row of zeroes.
    expect(isApplicantSummary({ error: 'Internal server error' })).toBe(false);
    expect(isApplicantSummary(null)).toBe(false);
    expect(isApplicantSummary('ok')).toBe(false);
  });

  it('accepts the real shape', () => {
    expect(
      isApplicantSummary({
        registered: 3,
        neverApplied: 1,
        appliedOnce: 1,
        repeatApplicants: 1,
      }),
    ).toBe(true);
    expect(isApplicationSummary({ total: 2, active: 1 })).toBe(true);
    expect(isApplicationSummary({ total: 'two' })).toBe(false);
  });
});
