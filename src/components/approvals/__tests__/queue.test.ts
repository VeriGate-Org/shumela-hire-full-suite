import fs from 'fs';
import path from 'path';
import {
  COVERED_KINDS,
  PendingApproval,
  assignmentOf,
  daysLabel,
  daysWaiting,
  isPendingApprovalsResult,
  money,
  oldestWait,
  recordHref,
} from '../queue';

const item = (over: Partial<PendingApproval> = {}): PendingApproval => ({
  id: 'a1',
  kind: 'REQUISITION',
  title: 'Chief Audit Executive',
  waitingSince: '2026-08-05T09:00:00',
  ...over,
});

const NOW = new Date('2026-08-24T09:00:00').getTime();

describe('waiting time', () => {
  it('counts whole days', () => {
    expect(daysWaiting('2026-08-05T09:00:00', NOW)).toBe(19);
  });

  it('is null when the timestamp is missing or unparseable', () => {
    // Null, not zero. An item with no recorded arrival has not "waited no time".
    expect(daysWaiting(undefined, NOW)).toBeNull();
    expect(daysWaiting('not a date', NOW)).toBeNull();
  });

  it('never goes negative on a clock skew', () => {
    expect(daysWaiting('2026-09-01T09:00:00', NOW)).toBe(0);
  });

  it('labels the null case rather than printing "0 days"', () => {
    expect(daysLabel(null)).toBe('Not recorded');
    expect(daysLabel(0)).toBe('Today');
    expect(daysLabel(1)).toBe('1 day');
    expect(daysLabel(19)).toBe('19 days');
  });
});

describe('oldest wait', () => {
  it('is computed from the items, not from their order', () => {
    // The server sorts oldest-first, but a headline figure that silently depends on someone
    // else's sort is a figure waiting to go wrong. Deliberately out of order here.
    const items = [
      item({ waitingSince: '2026-08-22T09:00:00' }),
      item({ waitingSince: '2026-08-05T09:00:00' }),
      item({ waitingSince: '2026-08-17T09:00:00' }),
    ];

    expect(oldestWait(items, NOW)).toBe(19);
  });

  it('is null when nothing carries a timestamp', () => {
    expect(oldestWait([item({ waitingSince: undefined })], NOW)).toBeNull();
  });

  it('is null for an empty queue', () => {
    expect(oldestWait([], NOW)).toBeNull();
  });
});

describe('money', () => {
  it('returns null rather than R 0 when there is no figure', () => {
    // getValueHeldUp() returns null when nothing in the queue carries an amount. Rendering that
    // as R 0 would claim nothing is at stake, which is a different statement from not knowing.
    expect(money(null)).toBeNull();
    expect(money(undefined)).toBeNull();
  });

  it('formats rands with no cents', () => {
    const formatted = money(1_450_000);

    expect(formatted).toContain('1');
    expect(formatted).not.toContain('.00');
  });

  it('does format a genuine zero', () => {
    // Zero is a real figure and must survive; only absence becomes null.
    expect(money(0)).not.toBeNull();
  });
});

describe('assignment', () => {
  it('reads YOURS only when the server said so', () => {
    expect(assignmentOf({ ...item(), assignment: 'YOURS' } as PendingApproval)).toBe('YOURS');
  });

  it('defaults to UNCONFIRMED when the field is missing', () => {
    // Four of the five sources cannot say an item is yours. Defaulting the other way would claim
    // authority the server never asserted.
    expect(assignmentOf(item())).toBe('UNCONFIRMED');
    expect(assignmentOf({ ...item(), assignment: 'ANYTHING' } as unknown as PendingApproval)).toBe(
      'UNCONFIRMED',
    );
  });
});

describe('the payload guard', () => {
  it('rejects an error body', () => {
    // An error body is an object too. Reading .items off it renders an empty queue that looks
    // like good news.
    expect(isPendingApprovalsResult({ error: 'Internal server error' })).toBe(false);
    expect(isPendingApprovalsResult(null)).toBe(false);
    expect(isPendingApprovalsResult([])).toBe(false);
  });

  it('accepts a real result', () => {
    expect(
      isPendingApprovalsResult({ items: [], total: 0, assignedToYou: 0, unavailableSources: {} }),
    ).toBe(true);
  });
});

describe('where a row goes', () => {
  it('sends each kind to its record', () => {
    expect(recordHref(item({ kind: 'REQUISITION', id: 'r1' }))).toBe('/requisitions/r1');
    expect(recordHref(item({ kind: 'JOB_ADVERT', id: 'j1' }))).toBe('/job-postings/j1');
  });

  it('sends salary recommendations to the list, which is the only screen they have', () => {
    expect(recordHref(item({ kind: 'SALARY_RECOMMENDATION' }))).toBe('/salary-recommendations');
  });
});

describe('what the queue covers', () => {
  it('is four mechanisms, not five', () => {
    // Leave is deliberately not read — its query takes a manager id rather than the caller, so
    // folding it in changes leave's own contract. Claiming five on the page would be claiming
    // coverage the endpoint does not have.
    expect(COVERED_KINDS).toEqual([
      'REQUISITION',
      'JOB_ADVERT',
      'SALARY_RECOMMENDATION',
      'OFFER',
    ]);
    expect(COVERED_KINDS).not.toContain('LEAVE');
  });

  it('includes offers, which are gated on the server, not on the client', () => {
    // Offers used to be permanently absent because the endpoint filtered them by a level nothing
    // stored. That level now lives on the user record and is read server-side — it was a query
    // parameter, which let any caller name their own authority. The client must never send one.
    expect(COVERED_KINDS).toContain('OFFER');
  });
});

describe('the page', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src', 'app', '(app)', 'approvals', 'page.tsx'),
    'utf8',
  );

  const code = source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  it('renders the sources that could not be read', () => {
    // PendingApprovalsResult carries unavailableSources precisely so a source that did not answer
    // is distinguishable from a source with nothing in it. Without this, the queue silently
    // shrinks and a short list reads as a quiet day.
    expect(code).toContain('unavailableSources');
    expect(code).toContain('unavailableNote');
  });

  it('uses tokens, not light-only colour', () => {
    expect(code.match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual(
      [],
    );
  });

  it('leads with the band and states the decision', () => {
    expect(code).toContain('IdentityBand');
    expect(code).toContain('DecisionBar');
  });

  it('passes no header props to PageWrapper', () => {
    expect(code).not.toMatch(/<PageWrapper\s+title=/);
  });

  it('does not send an approval level it cannot know', () => {
    // The User entity has no approval-level field. Sending a made-up one would silently filter
    // offers by an authority the signed-in user may not have.
    expect(code).not.toMatch(/approvalLevel=/);
  });
});

describe('the dead approval centre is gone', () => {
  it('no longer exists', () => {
    // 488 lines fed by useState<ApprovalRequest[]>([]) that nothing populated, with three action
    // handlers that mapped over the empty array. It was mounted at /workflow, so it rendered an
    // empty approval queue permanently on every tenant.
    expect(
      fs.existsSync(
        path.join(process.cwd(), 'src', 'components', 'workflow', 'ApprovalCenter.tsx'),
      ),
    ).toBe(false);
  });

  it('is not exported from the workflow barrel', () => {
    const barrel = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'workflow', 'index.ts'),
      'utf8',
    );

    expect(barrel).not.toContain('ApprovalCenter');
  });

  it('left no orphaned state or handlers behind on the workflow page', () => {
    const page = fs
      .readFileSync(path.join(process.cwd(), 'src', 'app', '(app)', 'workflow', 'page.tsx'), 'utf8')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

    expect(page).not.toContain('approvalRequests');
    expect(page).not.toContain('handleApprove');
    expect(page).not.toContain('handleReject');
    expect(page).not.toContain('handleAddComment');
    expect(page).not.toContain('ApprovalRequest');
  });
});
