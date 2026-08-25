import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'components', 'dashboard', 'role-dashboards');

/** The dashboards refreshed in batch 1. Extend as later batches land. */
const REFRESHED = ['RecruiterDashboard', 'HiringManagerDashboard', 'HRDashboard'];

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

  it.each(REFRESHED)('%s says what is waiting on this person', (name) => {
    // A dashboard's job is to answer "what do I do next". None of these had a DecisionBar.
    expect(source(name)).toContain('DecisionBar');
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
