import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'components', 'dashboard', 'role-dashboards');

/** Every role dashboard. All ten are refreshed as of batches 1–3. */
const REFRESHED = [
  'RecruiterDashboard', 'HiringManagerDashboard', 'HRDashboard',
  'ExecutiveDashboard', 'LineManagerDashboard', 'AdminDashboard',
  'ApplicantDashboard', 'EmployeeDashboard', 'InterviewerDashboard',
  'PlatformOwnerDashboard',
];

/**
 * PlatformOwner carries no DecisionBar, and that is correct rather than an omission: it fetches
 * nothing, holds no state and is two links to other screens. A decision bar there would have to
 * invent something to decide about.
 */
const NO_DECISION_BAR = ['PlatformOwnerDashboard'];

function source(name: string): string {
  return fs.readFileSync(path.join(DIR, `${name}.tsx`), 'utf8');
}

/**
 * The dashboards, once refreshed, have to stay refreshed.
 *
 * <p>These screens carried <b>265 hardcoded light-only colour classes</b> between the ten of them
 * while every queue screen carried none. That is not only a mismatch — <code>bg-white</code> and
 * <code>border-gray-200</code> do not respond to <code>data-theme="dark"</code>, so the dashboards
 * were the only part of the product that ignored the theme entirely.
 *
 * <p>Reading the source rather than rendering is deliberate, and the same choice made for the
 * pipeline board's keyboard test: the failure guarded against is a <em>pattern</em> reappearing
 * anywhere in a 600-line file, and a render test would pin the one branch it happened to mount.
 */
describe('the refreshed dashboards use tokens, not hardcoded colour', () => {
  it.each(REFRESHED)('%s has no light-only colour classes', (name) => {
    const hardcoded = source(name).match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? [];

    // If this fails: use the token — bg-card, bg-muted, text-foreground, text-muted-foreground,
    // border-border. They flip with the theme; the gray scale does not.
    expect(hardcoded).toEqual([]);
  });

  it.each(REFRESHED)('%s leads with the identity band', (name) => {
    // The band is the page header on every other screen in the product. A dashboard that opens
    // with a bare grid is the third visual language this codebase had.
    expect(source(name)).toContain('IdentityBand');
  });

  it.each(REFRESHED.filter((name) => !NO_DECISION_BAR.includes(name)))(
    '%s says what is waiting on this person',
    (name) => {
      // A dashboard's job is to answer "what do I do next". None of these had a DecisionBar.
      expect(source(name)).toContain('DecisionBar');
    },
  );

  it.each(NO_DECISION_BAR)('%s is excluded from the decision bar rule on purpose', (name) => {
    // An exclusion list nobody checks is how the next one slips through — the lesson from the AI
    // registry. If this screen ever gains data, it should gain a bar and leave this list.
    const text = source(name);

    expect(text).not.toContain('apiFetch');
    expect(text).not.toContain('useState');
  });
});

describe('nothing on these screens is invented', () => {
  it('the recruiter dashboard no longer renders fabricated activity', () => {
    // "Recent Sourcing Activities" was four hardcoded strings with timestamps — "Contacted 5
    // developers on LinkedIn", "Sarah Chen responded to interview invitation" — presented as this
    // tenant's activity. The names survive only in the note explaining their removal.
    const withoutComments = source('RecruiterDashboard').replace(/\/\*[\s\S]*?\*\//g, '');

    expect(withoutComments).not.toContain('Sarah Chen');
    expect(withoutComments).not.toContain('Mike Rodriguez');
    expect(withoutComments).not.toContain('Contacted 5 developers');
  });

  it('the hiring manager dashboard does not read a field the server never sends', () => {
    // data.applicationVolume appears nowhere in the backend. Guarded with Array.isArray(...), the
    // chart rendered its empty state permanently rather than erroring.
    expect(source('HiringManagerDashboard')).not.toContain('applicationVolume');
  });

  it('the hiring manager dashboard does not pass a timeframe the endpoint ignores', () => {
    // /api/analytics/dashboard accepts department and date only. Sending timeframe= re-fetched
    // identical data, so the selector changed nothing.
    const text = source('HiringManagerDashboard');

    expect(text).not.toContain('timeframe=${selectedTimeframe}');
    expect(text).not.toContain('role=HIRING_MANAGER');
  });

  it('the recruiter dashboard reads the endpoint built for it', () => {
    // RecruiterDashboardResponse has existed since #278 and only /recruiter-dashboard consumed it,
    // so the landing page showed invented activity while a separate nav item showed real figures.
    expect(source('RecruiterDashboard')).toContain('/api/analytics/recruiter-overview');
  });

  it('the HR dashboard counts postings from the summary, not from a page', () => {
    // It counted a page of 200 and presented it as a total. The per-department split still needs
    // that paged read — the summary carries no department breakdown — so both are fetched and the
    // whole-set figures come from the summary.
    expect(source('HRDashboard')).toContain('/api/job-postings/summary');
  });
});

describe('the dead controls found in batches 2 and 3', () => {
  it('the interviewer can actually submit feedback', () => {
    // The button carried no onClick. Recording feedback is the entire purpose of that screen and
    // nothing else on it could do so, so the primary action did nothing at all. The form lives on
    // the interviews page; it now has an address rather than being duplicated here.
    const text = source('InterviewerDashboard');

    expect(text).toContain('Submit Feedback');
    expect(text).toMatch(/interviews\?feedback=/);
  });

  it('the applicant can open the record behind a row', () => {
    // Also dead. #299 gave the record an address, so this had an obvious destination.
    expect(source('ApplicantDashboard')).toMatch(/\/applications\/\$\{/);
  });

  it('the applicant quick actions are gone rather than restyled', () => {
    // Four buttons rendered from a map with no onClick on any of them, one of them naming
    // "Messages" — a feature this product does not have.
    const text = source('ApplicantDashboard');

    expect(text).not.toContain("'Upload Resume'");
    expect(text).not.toContain("'Messages'");
  });

  it('no dashboard still sends a role parameter the endpoint discards', () => {
    // /api/analytics/dashboard accepts department and date only. Three screens sent role=.
    REFRESHED.forEach((name) => {
      expect(source(name)).not.toMatch(/dashboard\?role=/);
    });
  });

  it('the executive requisition figures come from the summary, not a page of ten', () => {
    // openRequisitions.length against a ?size=10 fetch: an organisation with 19 open requisitions
    // read 10, with nothing saying so.
    const text = source('ExecutiveDashboard');

    expect(text).toContain('/api/requisitions/summary');
    expect(text).not.toContain('const openRequisitionsCount = openRequisitions.length');
  });
});

/**
 * The analytics and reporting routes, refreshed in batches 4 and 5.
 *
 * <p>Separate from the role dashboards because they live under src/app rather than
 * src/components, and because the worst of them — executive/overview — failed differently: not
 * hardcoded colour, but thirteen figures read off endpoints that never returned them.
 */
describe('the analytics routes use tokens and lead with the band', () => {
  const ROUTES = [
    'analytics/page.tsx',
    'reports/page.tsx',
    'performance-analytics/page.tsx',
    'recruiter-dashboard/page.tsx',
    'leave/analytics/page.tsx',
    'analytics/training/page.tsx',
    'executive/overview/page.tsx',
    'executive/reports/page.tsx',
  ];

  const routeSource = (route: string): string =>
    fs.readFileSync(path.join(process.cwd(), 'src', 'app', '(app)', route), 'utf8');

  /**
   * Source with comments removed.
   *
   * <p>The notes explaining what was deleted name the very fields being asserted absent, so a
   * plain substring check matches the explanation rather than a live read. Documenting a removal
   * should not make the guard against it fail.
   */
  const routeCode = (route: string): string =>
    routeSource(route)
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');

  it.each(ROUTES)('%s has no light-only colour classes', (route) => {
    const hardcoded =
      routeSource(route).match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? [];

    expect(hardcoded).toEqual([]);
  });

  it.each(ROUTES)('%s leads with the identity band', (route) => {
    expect(routeSource(route)).toContain('IdentityBand');
  });

  it('the executive overview no longer reads figures no endpoint returns', () => {
    // Thirteen fields — totalEmployees, turnoverRate, averageTenure, engagementScore,
    // diversityScore, averageSalary and seven more — were read off /api/analytics/dashboard and
    // /api/analytics/kpis, which return {kpis, trends, alerts} and {kpis}. None existed, so all
    // thirteen fell through `|| 0` and the page rendered thirteen zeros on every SUCCESSFUL call.
    const text = routeCode('executive/overview/page.tsx');

    ['engagementScore', 'diversityScore', 'averageSalary', 'remoteWorkPercentage',
     'monthlyGrowthRate', 'quarterlyGrowthRate', 'yearlyGrowthRate'].forEach((field) => {
      expect(text).not.toContain(field);
    });

    // Headcount and turnover are real, from the endpoint the Executive role dashboard already uses.
    expect(text).toContain('/api/analytics/hr-overview');
  });

  it('the executive overview does not offer an export that exports nothing', () => {
    expect(routeCode('executive/overview/page.tsx')).not.toContain('Export Report');
  });
});

describe('one stage order, not two', () => {
  it('both recruiter surfaces import the same funnel stages', () => {
    // FUNNEL_STAGES and STAGE_LABELS were private to components/RecruiterDashboard. Copying them
    // for the role dashboard would have made two lists to keep in step, and the funnel is computed
    // against them — a drifted copy produces a different funnel on one screen than the other.
    const shared = fs.readFileSync(
      path.join(process.cwd(), 'src', 'components', 'dashboard', 'overview.ts'),
      'utf8',
    );

    expect(shared).toContain('export const FUNNEL_STAGES');
    expect(shared).toContain('export const STAGE_LABELS');
    expect(source('RecruiterDashboard')).toContain('FUNNEL_STAGES');
  });
});
