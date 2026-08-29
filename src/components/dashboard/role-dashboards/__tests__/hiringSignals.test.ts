import fs from 'fs';
import path from 'path';
import {
  AWAITING_DECISION,
  decisionsOwed,
  quietRoles,
  receivedSince,
  startOfWeek,
  type ApplicationLike,
} from '../hiringSignals';

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), 'src', ...p), 'utf8');
const strip = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const DASHBOARD = ['components', 'dashboard', 'role-dashboards', 'HiringManagerDashboard.tsx'] as const;

/** Wednesday 26 August 2026, midday. Fixed so "this week" has an unambiguous Monday. */
const NOW = new Date('2026-08-26T12:00:00').getTime();
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

function app(over: Partial<ApplicationLike> = {}): ApplicationLike {
  return { applicantName: 'T. Mokoena', jobTitle: 'Analyst', status: 'SCREENING', submittedAt: daysAgo(1), ...over };
}

describe('who is waiting on a decision', () => {
  it('counts only candidates held at a stage a person must act on', () => {
    const owed = decisionsOwed(
      [
        app({ status: 'SCREENING' }),
        app({ status: 'SUBMITTED' }),
        app({ status: 'INTERVIEW_COMPLETED' }),
        app({ status: 'OFFER' }), // waiting on the candidate, not on you
        app({ status: 'HIRED' }),
        app({ status: 'REJECTED' }),
      ],
      NOW,
    );

    expect(owed.count).toBe(3);
  });

  it('does not count a booked interview as a decision owed', () => {
    // The meeting exists; nobody is being held up until it has happened.
    expect(AWAITING_DECISION.has('INTERVIEW_SCHEDULED')).toBe(false);
    expect(AWAITING_DECISION.has('INTERVIEW_COMPLETED')).toBe(true);
  });

  it('reports the longest wait, in whole days', () => {
    const owed = decisionsOwed(
      [app({ submittedAt: daysAgo(3) }), app({ applicantName: 'L. Dlamini', submittedAt: daysAgo(19) })],
      NOW,
    );

    expect(owed.oldest).toEqual({
      name: 'L. Dlamini',
      role: 'Analyst',
      stage: 'screening',
      days: 19,
    });
  });

  it('draws the count and the oldest from the same set', () => {
    // Two figures on one card computed from different filters is how they come to disagree.
    const owed = decisionsOwed([app({ status: 'HIRED', submittedAt: daysAgo(400) }), app()], NOW);

    expect(owed.count).toBe(1);
    expect(owed.oldest?.days).toBe(1);
  });

  it('still counts a waiting candidate whose date is unusable', () => {
    const owed = decisionsOwed([app({ submittedAt: undefined }), app({ submittedAt: 'not a date' })], NOW);

    expect(owed.count).toBe(2);
    expect(owed.oldest).toBeNull();
  });

  it('ignores a future-dated row rather than reporting a negative wait', () => {
    const owed = decisionsOwed([app({ submittedAt: new Date(NOW + 86_400_000).toISOString() })], NOW);

    expect(owed.count).toBe(1);
    expect(owed.oldest).toBeNull();
  });

  it('says nothing is owed when nothing is', () => {
    expect(decisionsOwed([], NOW)).toEqual({ count: 0, oldest: null });
  });
});

describe('applications this week', () => {
  it('counts from Monday, not from a rolling seven days', () => {
    // NOW is a Wednesday, so Monday is two days back and Sunday is three.
    const monday = startOfWeek(NOW);
    expect(new Date(monday).getDay()).toBe(1);

    const count = receivedSince(
      [app({ submittedAt: daysAgo(1) }), app({ submittedAt: daysAgo(2) }), app({ submittedAt: daysAgo(3) })],
      monday,
    );

    expect(count).toBe(2);
  });

  it('treats Sunday as the end of the week it began in', () => {
    const sunday = new Date('2026-08-30T12:00:00').getTime();
    expect(new Date(startOfWeek(sunday)).getDate()).toBe(24); // Monday 24 August
  });

  it('skips rows with no usable date rather than counting them in', () => {
    expect(receivedSince([app({ submittedAt: undefined }), app({ submittedAt: 'rubbish' })], 0)).toBe(0);
  });
});

describe('roles attracting nothing', () => {
  it('names the published roles with no applications', () => {
    const quiet = quietRoles([
      { title: 'Internal Auditor', applicationsCount: 0 },
      { title: 'Financial Accountant', applicationsCount: 24 },
      { title: 'Actuarial Analyst', applicationsCount: 0 },
    ]);

    expect(quiet.measurable).toBe(true);
    expect(quiet.titles).toEqual(['Internal Auditor', 'Actuarial Analyst']);
  });

  it('reports "not measurable" rather than zero when the field is absent', () => {
    // An absent count and a genuine zero must not look the same. The widget read
    // `applicationCount` — a field on a different entity — so every role looked like it had none.
    const quiet = quietRoles([{ title: 'Internal Auditor' }, { title: 'Financial Accountant' }]);

    expect(quiet.measurable).toBe(false);
    expect(quiet.titles).toEqual([]);
  });

  it('measures the ones it can when only some carry a count', () => {
    const quiet = quietRoles([{ title: 'A', applicationsCount: 0 }, { title: 'B' }]);

    expect(quiet.measurable).toBe(true);
    expect(quiet.titles).toEqual(['A']);
  });
});

describe('the dashboard shows nothing it cannot source', () => {
  const source = strip(read(...DASHBOARD));

  it('no longer calls the two endpoints that answer with an empty KPI map', () => {
    // MetricsComputationScheduler writes sixteen metrics under APPLICATIONS/INTERVIEWS/OFFERS/
    // EFFICIENCY/PIPELINE, and every KPI reader filters for metricCategory == "KPI", which nothing
    // writes. Both endpoints therefore answer {"kpis":{}} for every tenant.
    expect(source).not.toContain("apiFetch('/api/analytics/kpis')");
    expect(source).not.toContain("apiFetch('/api/analytics/dashboard')");
  });

  it('renders neither the strip nor the indicator panel', () => {
    expect(source).not.toContain('<RealTimeMetrics');
    expect(source).not.toContain('<PerformanceMetrics');
  });

  it('carries no hardcoded targets', () => {
    // The six indicators each shipped an invented target that a progress bar was drawn against.
    expect(source).not.toContain('target: 30');
    expect(source).not.toContain('target: 85');
    expect(source).not.toContain('defaultMetrics');
  });

  it('states the absence instead of leaving a silence', () => {
    expect(source).toContain('Hiring performance indicators are not shown');
  });

  it('reads the application count under the name the DTO uses', () => {
    // JobPostingResponse.applicationsCount. `applicationCount` is on JobBoardPosting, a different
    // entity, so every open role displayed "0 applications" whatever its real figure was.
    expect(source).toContain('position.applicationsCount');
    expect(source).not.toContain('position.applicationCount ');
  });

  it('does not call an upcoming-interviews list "today\'s"', () => {
    expect(source).not.toContain("Today&apos;s Interviews");
    expect(source).toContain('Upcoming interviews');
  });
});

describe('the decision bar asks about what is actually owed', () => {
  const source = strip(read(...DASHBOARD));

  it('is keyed on decisions, not on roles plus interviews', () => {
    // It fired when `interviews + openRoles > 0` while its sentence named interviews alone, so
    // seven open roles and no interviews produced "0 interviews are coming up." as the ask.
    expect(source).not.toContain('const owedToYou');
    expect(source).toContain('owed.count > 0 ?');
    expect(source).toContain('waiting on a decision from you');
  });

  it('does not describe a booked interview as a warning', () => {
    expect(source).not.toContain("label: 'Interviews booked'");
  });
});

/**
 * The shipped page matches the design it was drawn from.
 *
 * <p>The first implementation carried the sourcing decisions — what is shown, what is cut — but
 * not the composition. Quick actions sat in a full-width row below a grid that declared three
 * columns and held two, the pipeline was a horizontally-scrolling board of 288px columns beneath a
 * summary block repeating its own counts, and every panel wore DashboardWidget's accent border,
 * refresh button and overflow menu. None of that was in the drawing.
 */
describe('the page is composed the way the design is', () => {
  const dash = strip(read(...DASHBOARD));
  const pipeline = strip(read('components', 'dashboard', 'CandidatePipeline.tsx'));

  it('puts quick actions inside the three-column grid', () => {
    expect(dash).not.toContain('Quick Actions — Full Width Row');
    // Three <section> children under one grid, so no column is left empty.
    const grid = dash.slice(dash.indexOf('lg:grid-cols-3'));
    expect((grid.match(/<section/g) ?? []).length).toBe(3);
  });

  it('uses plain cards rather than the widget chrome', () => {
    expect(dash).not.toContain('<DashboardWidget');
    expect(dash).not.toContain("import { DashboardWidget");
    expect(pipeline).not.toContain('<DashboardWidget');
  });

  it('lays the pipeline out six across instead of scrolling sideways', () => {
    expect(pipeline).toContain('xl:grid-cols-6');
    expect(pipeline).not.toContain('w-72');
    expect(pipeline).not.toContain('overflow-x-auto');
  });

  it('counts each stage once', () => {
    // A four-across summary block repeated the same six numbers above the board.
    expect(pipeline).not.toContain('Pipeline Summary');
    expect((pipeline.match(/stage\.candidates\.length}/g) ?? []).length).toBe(1);
  });

  it('marks a role that has attracted nothing', () => {
    expect(dash).toContain('No applications yet');
    expect(dash).toContain("'Quiet'");
  });
});

describe('the stage colour is a colour', () => {
  const dash = read(...DASHBOARD);
  const pipeline = read('components', 'dashboard', 'CandidatePipeline.tsx');

  it('is a CSS value, because an inline style consumes it', () => {
    // It held Tailwind class names — `bg-gold-100` and friends — which the browser drops as an
    // invalid style value, so every stage indicator rendered with no colour at all.
    expect(pipeline).toContain('style={{ backgroundColor: stage.color }}');

    const stageColours = [...dash.matchAll(/name: '(?:Applied|Screening|Interview|Checks|Offer|Hired)', color: '([^']+)'/g)]
      .map((m) => m[1]);

    expect(stageColours.length).toBeGreaterThanOrEqual(12);
    for (const value of stageColours) {
      expect(value).toMatch(/^var\(--[a-z-]+\)$/);
    }
  });
});
