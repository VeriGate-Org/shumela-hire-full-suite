import fs from 'fs';
import path from 'path';
import {
  JobPostingRecord,
  RAIL,
  buildStages,
  checkTypes,
  dwell,
  humanise,
  isStopped,
  railFootnote,
} from '../workflow';

const NOW = new Date('2026-08-24T09:00:00').getTime();

const posting = (over: Partial<JobPostingRecord> = {}): JobPostingRecord => ({
  id: 'p1',
  title: 'Senior Software Engineer',
  createdAt: '2026-08-01T09:00:00',
  ...over,
});

describe('the rail', () => {
  it('has five steps', () => {
    expect(RAIL).toHaveLength(5);
  });

  it('marks the step a draft is sitting in', () => {
    const stages = buildStages(posting({ status: 'DRAFT' }), NOW);

    expect(stages[0].state).toBe('current');
    expect(stages.slice(1).map((s) => s.state)).toEqual(['todo', 'todo', 'todo', 'todo']);
  });

  it('walks forward as the posting progresses', () => {
    const stages = buildStages(
      posting({
        status: 'PUBLISHED',
        submittedForApprovalAt: '2026-08-05T09:00:00',
        approvedAt: '2026-08-10T09:00:00',
        publishedAt: '2026-08-12T09:00:00',
      }),
      NOW,
    );

    expect(stages.map((s) => s.state)).toEqual(['done', 'done', 'done', 'current', 'todo']);
  });

  it('gives a step that was never reached no date, actor or dwell', () => {
    // Rendering "0 days" on an unreached step reads as "passed through instantly".
    const stages = buildStages(posting({ status: 'DRAFT' }), NOW);
    const unreached = stages[3];

    expect(unreached.days).toBeUndefined();
    expect(unreached.when).toBeUndefined();
    expect(unreached.actor).toBeUndefined();
  });

  it('measures dwell as the gap to the next step', () => {
    const stages = buildStages(
      posting({ status: 'PENDING_APPROVAL', submittedForApprovalAt: '2026-08-05T09:00:00' }),
      NOW,
    );

    expect(stages[0].days).toBe(4); // 1 Aug → 5 Aug
    expect(stages[1].days).toBe(19); // 5 Aug → now
  });
});

describe('the three states that are stops, not steps', () => {
  it('treats rejected, cancelled and unpublished as stops', () => {
    expect(isStopped('REJECTED')).toBe(true);
    expect(isStopped('CANCELLED')).toBe(true);
    expect(isStopped('UNPUBLISHED')).toBe(true);
    expect(isStopped('PUBLISHED')).toBe(false);
  });

  it('stops a rejected posting at approval', () => {
    const stages = buildStages(
      posting({ status: 'REJECTED', submittedForApprovalAt: '2026-08-21T09:00:00' }),
      NOW,
    );

    expect(stages[1].state).toBe('stopped');
    expect(stages.slice(2).map((s) => s.state)).toEqual(['todo', 'todo', 'todo']);
  });

  it('does not invent a dwell for the rejected step', () => {
    // There is no rejectedAt field. updatedAt would be an approximation dressed as a measurement,
    // so the figure is omitted and the audit trail carries the real timestamp.
    const stages = buildStages(
      posting({
        status: 'REJECTED',
        submittedForApprovalAt: '2026-08-21T09:00:00',
        updatedAt: '2026-08-22T16:48:00',
      }),
      NOW,
    );

    expect(stages[1].days).toBeUndefined();
  });

  it('stops an unpublished posting AT Published, not after it', () => {
    // This is the case the five-stage rail exists to handle: Unpublish is an action the API
    // offers, and a rail with no home for its result would be a button that breaks the page.
    const stages = buildStages(
      posting({
        status: 'UNPUBLISHED',
        submittedForApprovalAt: '2026-08-05T09:00:00',
        approvedAt: '2026-08-10T09:00:00',
        publishedAt: '2026-08-12T09:00:00',
        unpublishedAt: '2026-08-20T09:00:00',
      }),
      NOW,
    );

    expect(stages[3].name).toBe('Published');
    expect(stages[3].state).toBe('stopped');
    expect(stages[4].state).toBe('todo');
  });

  it('says an unpublished posting is not closed', () => {
    expect(railFootnote(posting({ status: 'UNPUBLISHED' }), NOW)).toContain('not closed');
  });

  it('does not claim how far a cancelled posting got', () => {
    // The status records nothing about progress, so only the first step is marked.
    const stages = buildStages(posting({ status: 'CANCELLED' }), NOW);

    expect(stages[0].state).toBe('stopped');
    expect(railFootnote(posting({ status: 'CANCELLED' }), NOW)).toContain('does not record');
  });

  it('renders every one of the eight statuses without an unreachable step', () => {
    const all = [
      'DRAFT',
      'PENDING_APPROVAL',
      'APPROVED',
      'PUBLISHED',
      'UNPUBLISHED',
      'REJECTED',
      'CLOSED',
      'CANCELLED',
    ] as const;

    for (const status of all) {
      const stages = buildStages(posting({ status }), NOW);
      expect(stages).toHaveLength(5);
      expect(stages.filter((s) => s.state === 'current' || s.state === 'stopped').length)
        .toBeLessThanOrEqual(1);
    }
  });
});

describe('dwell', () => {
  it('is null when the opening timestamp is missing', () => {
    expect(dwell(undefined, '2026-08-05T09:00:00', NOW)).toBeNull();
  });

  it('runs to now when there is no closing timestamp', () => {
    expect(dwell('2026-08-05T09:00:00', undefined, NOW)).toBe(19);
  });
});

describe('verification checks', () => {
  it('splits the delimited field', () => {
    expect(checkTypes(posting({ requiredCheckTypes: 'CRIMINAL_RECORD,QUALIFICATION' }))).toEqual([
      'CRIMINAL_RECORD',
      'QUALIFICATION',
    ]);
  });

  it('is empty rather than [""] when nothing is set', () => {
    expect(checkTypes(posting())).toEqual([]);
    expect(checkTypes(posting({ requiredCheckTypes: '' }))).toEqual([]);
  });

  it('reads tokens as English', () => {
    expect(humanise('CRIMINAL_RECORD')).toBe('Criminal record');
  });
});

describe('the screen', () => {
  const code = fs
    .readFileSync(
      path.join(process.cwd(), 'src', 'app', '(app)', 'job-postings', '[id]', 'ClientPage.tsx'),
      'utf8',
    )
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

  it('gates every action on the server flag rather than deciding authority itself', () => {
    // Job postings are the one mechanism that computes this server-side and returns it per record.
    expect(code).toContain('posting.canBeApproved');
    expect(code).toContain('posting.canBePublished');
    expect(code).toContain('posting.canBeUnpublished');
  });

  it('reads the id from the URL, not from useParams', () => {
    // Static export pre-renders one placeholder ("_"), so useParams would return that on a hard
    // load or refresh.
    expect(code).toContain('usePathname');
    expect(code).not.toContain('useParams');
  });

  it('shows no conversion rate or per-day average off the inflated view counter', () => {
    // viewsCount increments on every page load with no dedup, and the backend carries a TODO
    // saying so. A percentage built on it reads as precise while being wrong by an unknown factor.
    expect(code).not.toContain('% of views');
    expect(code).not.toMatch(/a day/);
    expect(code).toContain('Page views');
  });

  it('distinguishes an unreadable audit trail from an empty one', () => {
    // Every transition writes an entry, so an empty trail would be a lie — it means the read was
    // refused, not that nothing happened.
    expect(code).toContain('trailReadable');
  });

  it('uses tokens, not light-only colour', () => {
    expect(code.match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual(
      [],
    );
  });
});

describe('the route can survive a refresh', () => {
  it('has a CloudFront rewrite, like every other dynamic route', () => {
    // Without it, /job-postings/<real-id> 403s straight from S3 on a direct load — the page would
    // work only via in-app navigation, which is the failure mode that is easiest to miss in review.
    const stack = fs.readFileSync(
      path.join(process.cwd(), 'infra', 'cdk', 'ShumelaHireFrontendStack.cs'),
      'utf8',
    );

    expect(stack).toContain('JobPostingsDetailRewriteFunction');
    expect(stack).toContain("'/job-postings/_.html'");
    expect(stack).toContain('["/job-postings/*"]');
    // /job-postings/new is a real static page and must not be rewritten to the shell.
    expect(stack).toContain("uri === '/job-postings/new'");
  });
});
