import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(process.cwd(), 'src', ...p), 'utf8');
const strip = (s: string) =>
  s.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/**
 * One component owns the KPI read.
 *
 * <p>Three components queried /api/analytics/kpis on the analytics screen at once: the page with a
 * department, the charts with the full filter set, and the real-time strip with nothing at all. The
 * page's decision bar said in writing that "department narrows everything on this page", and the
 * strip between the band and the charts was the reason that was untrue — it had no filter props to
 * pass one to.
 *
 * <p>It also re-asked that endpoint every ten seconds, forever, in any tab left open.
 */
describe('the real-time strip renders what it is given', () => {
  const strip_ = strip(read('components', 'analytics', 'RealTimeMetrics.tsx'));

  it('fetches nothing itself', () => {
    expect(strip_).not.toContain('apiFetch');
    expect(strip_).not.toContain('analytics/kpis');
  });

  it('runs no interval of its own', () => {
    // The page decides the cadence now, in one place, for every surface.
    expect(strip_).not.toContain('setInterval');
  });

  it('takes the figures, and what they are narrowed to', () => {
    expect(strip_).toContain('kpis:');
    expect(strip_).toContain('department?:');
  });

  it('says which department it is showing', () => {
    // It described itself as live while quietly ignoring the filter.
    expect(strip_).toContain("department || 'Every department'");
  });
});

describe('the analytics page owns the read', () => {
  const page = strip(read('app', '(app)', 'analytics', 'page.tsx'));

  it('passes its own KPIs and department to the strip', () => {
    expect(page).toContain('kpis={kpiValues}');
    expect(page).toContain('department={selectedDepartment || undefined}');
  });

  it('refreshes on a human cadence, not a trading-floor one', () => {
    expect(page).toContain('const REFRESH_MS = 60_000;');
  });

  it('stops polling when nobody is looking', () => {
    expect(page).toContain("document.addEventListener('visibilitychange'");
    expect(page).toContain('if (document.hidden) stop();');
  });

  it('offers one export, not two', () => {
    expect((page.match(/Export Report/g) ?? []).length).toBe(1);
  });
});

describe('the thresholds are stated, not asserted', () => {
  const page = read('app', '(app)', 'analytics', 'page.tsx');

  it('names the numbers it judges against', () => {
    // "strong" and "competitive" were this page's own rule of thumb, sourced by nothing.
    expect(page).toContain('const CONVERSION_HEALTHY = 20;');
    expect(page).toContain('const ACCEPTANCE_COMPETITIVE = 80;');
  });

  it('puts the threshold in the sentence the reader sees', () => {
    expect(page).toContain('this page treats as healthy');
    expect(page).toContain('this page treats as competitive');
  });

  it('no longer states the judgement as a fact', () => {
    expect(strip(page)).not.toContain('offers are competitive');
    expect(strip(page)).not.toContain('is strong at');
  });
});

describe('every caller of the strip supplies the figures', () => {
  it.each([
    ['HRDashboard', read('components', 'dashboard', 'role-dashboards', 'HRDashboard.tsx')],
    ['HiringManagerDashboard', read('components', 'dashboard', 'role-dashboards', 'HiringManagerDashboard.tsx')],
  ])('%s reads the KPIs and hands them down', (_name, source) => {
    expect(source).toContain("apiFetch('/api/analytics/kpis')");
    expect(source).toContain('<RealTimeMetrics kpis={kpis}');
  });
});

describe('the controls sit together and say what they narrow', () => {
  const page = strip(read('app', '(app)', 'analytics', 'page.tsx'));

  it('offers the department in the bar, not only behind a panel', () => {
    // Department was chosen inside "Advanced Filters" while the period pills sat in their own row,
    // so nothing on screen said which control reached what — a sentence underneath had to explain.
    expect(page).toContain('id="analytics-department"');
    expect(page).toContain('All departments');
  });

  it('keeps filterValues as the one record of what is selected', () => {
    // The bar writes into the same list the advanced panel reads, so the two cannot disagree.
    expect(page).toContain('const setDepartment = (value: string)');
    expect(page).toContain("prev.filter((f) => f.id !== 'department')");
  });

  it('does not count the department against the filters button', () => {
    // It has its own control now; counting it would report a filter that button does not hold.
    expect(page).toContain('const otherFilterCount');
    expect(page).toContain('otherFilterCount > 0');
  });
});

describe('an absent metric says so', () => {
  const page = read('app', '(app)', 'analytics', 'page.tsx');

  it('reports the metrics it judges but did not receive', () => {
    // Each judgement is `if (value !== undefined)`, so an unreported metric produced no line — and
    // a reader cannot tell healthy from unmeasured.
    expect(page).toContain('not reported');
    expect(page).toContain("['time_to_fill_days', 'Time to fill']");
  });

  it('names the department it is missing for', () => {
    expect(page).toContain('${selectedDepartment ? ` for ${selectedDepartment}` : \'\'}');
  });
});
