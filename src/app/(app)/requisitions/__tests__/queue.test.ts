import {
  QUEUE_FILTERS,
  RequisitionSummary,
  byLongestWait,
  filterCount,
  isAwaiting,
  waitingDays,
  waitingOn,
  onYouCount,
  stagesOwnedBy,
} from '../queue';
import { RequisitionStatus } from '@/types/workflow';

const NOW = new Date('2026-08-24T12:00:00Z');

const summary: RequisitionSummary = {
  countsByStatus: {
    DRAFT: 7,
    SUBMITTED: 0,
    PENDING_HR_APPROVAL: 8,
    PENDING_EXECUTIVE_APPROVAL: 4,
    APPROVED: 12,
    REJECTED: 3,
  },
  total: 34,
  awaitingDecision: 12,
  oldestWaitingDays: 19,
  oldestWaitingId: 'req-old',
};

describe('filterCount', () => {
  it('reads each filter from the summary, not from a page of rows', () => {
    const hr = QUEUE_FILTERS.find((f) => f.key === 'hr')!;
    expect(filterCount(hr, summary)).toBe(8);
  });

  it('All is the whole set', () => {
    const all = QUEUE_FILTERS.find((f) => f.key === 'all')!;
    expect(filterCount(all, summary)).toBe(34);
  });

  it('is undefined when there is no summary, so a chip shows no number rather than zero', () => {
    // "None match" and "we have not counted" are different answers, and only one of them
    // means stop looking.
    const hr = QUEUE_FILTERS.find((f) => f.key === 'hr')!;
    expect(filterCount(hr, null)).toBeUndefined();
  });

  it('counts a status the summary omits as zero rather than NaN', () => {
    const sparse: RequisitionSummary = { ...summary, countsByStatus: {} };
    const hr = QUEUE_FILTERS.find((f) => f.key === 'hr')!;
    expect(filterCount(hr, sparse)).toBe(0);
  });

  it('offers no filter that spans several statuses', () => {
    // The old Pending tab spanned four statuses, so it had to filter client-side and showed only
    // the pending rows inside the current page while the pager reported the unfiltered total.
    for (const filter of QUEUE_FILTERS) {
      expect(filter.statuses.length).toBeLessThanOrEqual(1);
    }
  });
});

describe('waitingDays', () => {
  it('counts whole days', () => {
    expect(waitingDays('2026-08-05T12:00:00Z', NOW)).toBe(19);
  });

  it('is undefined rather than zero when there is no timestamp', () => {
    expect(waitingDays(undefined, NOW)).toBeUndefined();
    expect(waitingDays(null, NOW)).toBeUndefined();
  });

  it('is undefined for an unparseable timestamp rather than NaN', () => {
    expect(waitingDays('whenever', NOW)).toBeUndefined();
  });

  it('clamps a future timestamp to zero rather than reporting a negative wait', () => {
    expect(waitingDays('2026-09-01T12:00:00Z', NOW)).toBe(0);
  });
});

describe('waitingOn', () => {
  it('names the approver from the status alone — no routing call needed', () => {
    expect(waitingOn(RequisitionStatus.PENDING_HR_APPROVAL)).toBe('HR Manager');
    expect(waitingOn(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL)).toBe('Executive');
  });

  it('is null for a requisition nobody owes a decision on', () => {
    expect(waitingOn(RequisitionStatus.APPROVED)).toBeNull();
    expect(waitingOn(RequisitionStatus.REJECTED)).toBeNull();
    expect(waitingOn(RequisitionStatus.DRAFT)).toBeNull();
  });
});

describe('isAwaiting', () => {
  it('covers every pending status and nothing else', () => {
    expect(isAwaiting(RequisitionStatus.SUBMITTED)).toBe(true);
    expect(isAwaiting(RequisitionStatus.PENDING_HR_APPROVAL)).toBe(true);
    expect(isAwaiting(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL)).toBe(true);
    expect(isAwaiting(RequisitionStatus.DRAFT)).toBe(false);
    expect(isAwaiting(RequisitionStatus.APPROVED)).toBe(false);
  });
});

describe('byLongestWait', () => {
  const row = (id: string, status: RequisitionStatus, updatedAt?: string) =>
    ({ id, status, updatedAt } as { id: string; status: RequisitionStatus; updatedAt?: string });

  it('puts the longest wait first', () => {
    const sorted = byLongestWait(
      [
        row('recent', RequisitionStatus.PENDING_HR_APPROVAL, '2026-08-22T12:00:00Z'),
        row('stale', RequisitionStatus.PENDING_HR_APPROVAL, '2026-08-05T12:00:00Z'),
        row('middling', RequisitionStatus.PENDING_EXECUTIVE_APPROVAL, '2026-08-13T12:00:00Z'),
      ],
      NOW
    );

    expect(sorted.map((r) => r.id)).toEqual(['stale', 'middling', 'recent']);
  });

  it('ranks anything awaiting a decision above anything settled, however old', () => {
    const sorted = byLongestWait(
      [
        row('ancient-approved', RequisitionStatus.APPROVED, '2024-01-01T12:00:00Z'),
        row('fresh-pending', RequisitionStatus.PENDING_HR_APPROVAL, '2026-08-23T12:00:00Z'),
      ],
      NOW
    );

    expect(sorted[0].id).toBe('fresh-pending');
  });

  it('puts a row with no timestamp last among its group rather than first', () => {
    // An unknown wait must not win a queue sorted by longest wait.
    const sorted = byLongestWait(
      [
        row('undated', RequisitionStatus.PENDING_HR_APPROVAL, undefined),
        row('waited', RequisitionStatus.PENDING_HR_APPROVAL, '2026-08-20T12:00:00Z'),
      ],
      NOW
    );

    expect(sorted.map((r) => r.id)).toEqual(['waited', 'undated']);
  });

  it('does not mutate the array it was given', () => {
    const input = [
      row('a', RequisitionStatus.APPROVED, '2026-08-01T12:00:00Z'),
      row('b', RequisitionStatus.PENDING_HR_APPROVAL, '2026-08-02T12:00:00Z'),
    ];
    const before = input.map((r) => r.id);

    byLongestWait(input, NOW);

    expect(input.map((r) => r.id)).toEqual(before);
  });
});

describe('stagesOwnedBy', () => {
  it('gives each approving role the stage the server says it clears', () => {
    expect(stagesOwnedBy('HR_MANAGER')).toEqual([RequisitionStatus.PENDING_HR_APPROVAL]);
    expect(stagesOwnedBy('EXECUTIVE')).toEqual([RequisitionStatus.PENDING_EXECUTIVE_APPROVAL]);
  });

  it('gives an administrator both, because the controller lets them approve either', () => {
    expect(stagesOwnedBy('ADMIN')).toEqual([
      RequisitionStatus.PENDING_HR_APPROVAL,
      RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
    ]);
  });

  it('returns null — not an empty list — for a role with no approval stage', () => {
    // Null is "there is no such figure for you"; an empty list would render as a truthful zero,
    // which is the thing this is avoiding.
    expect(stagesOwnedBy('RECRUITER')).toBeNull();
    expect(stagesOwnedBy('HIRING_MANAGER')).toBeNull();
    expect(stagesOwnedBy(undefined)).toBeNull();
  });
});

describe('onYouCount', () => {
  const summary = {
    countsByStatus: {
      [RequisitionStatus.PENDING_HR_APPROVAL]: 4,
      [RequisitionStatus.PENDING_EXECUTIVE_APPROVAL]: 3,
      [RequisitionStatus.APPROVED]: 11,
    },
    total: 18,
    awaitingDecision: 7,
  };

  it('counts only the stage the role clears', () => {
    expect(onYouCount(summary, 'HR_MANAGER')).toBe(4);
    expect(onYouCount(summary, 'EXECUTIVE')).toBe(3);
  });

  it('sums both stages for an administrator', () => {
    expect(onYouCount(summary, 'ADMIN')).toBe(7);
  });

  it('is null for a role that approves nothing', () => {
    expect(onYouCount(summary, 'RECRUITER')).toBeNull();
  });

  it('is null before the summary loads, rather than zero', () => {
    // A failed or pending request must never render as "nothing is waiting on you".
    expect(onYouCount(null, 'HR_MANAGER')).toBeNull();
  });

  it('counts a stage the summary omits as zero, not as absent', () => {
    // The summary returns every status including the empty ones, so a missing key here means
    // genuinely none — distinct from the summary itself being unavailable.
    expect(onYouCount({ ...summary, countsByStatus: {} }, 'HR_MANAGER')).toBe(0);
  });
});
