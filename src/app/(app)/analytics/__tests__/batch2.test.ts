import fs from 'fs';
import path from 'path';

const APP = path.join(process.cwd(), 'src', 'app', '(app)');

const read = (relative: string): string =>
  fs.readFileSync(path.join(APP, ...relative.split('/')), 'utf8');

/** Source with comments stripped — the notes name the very things asserted absent. */
const code = (relative: string): string =>
  read(relative)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

/** The four screens in batch 2 — the archetype the other nine follow. */
const BATCH = [
  'analytics/page.tsx',
  'analytics/hr-overview/page.tsx',
  'reports/page.tsx',
  'reports/export/page.tsx',
];

describe('the archetype', () => {
  it.each(BATCH)('%s opens with the identity band', (screen) => {
    // Sixteen analytics screens each opened differently; every other module in the product now
    // opens the same way.
    expect(code(screen)).toContain('IdentityBand');
  });

  it.each(BATCH)('%s passes no header props to PageWrapper', (screen) => {
    // The band is the header. Passing a title as well produces two.
    expect(code(screen)).not.toMatch(/<PageWrapper\s+title=/);
  });

  it.each(BATCH)('%s uses tokens, not light-only colour', (screen) => {
    expect(code(screen).match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual(
      [],
    );
  });
});

describe('the analytics filter governs the whole page', () => {
  const screen = 'analytics/page.tsx';

  it('sends the department to the KPI endpoint', () => {
    // /api/analytics/kpis accepts department and was called without it, so the tiles ignored the
    // filter while the charts below obeyed it — one bar governing half a page, silently.
    expect(code(screen)).toMatch(/analytics\/kpis\$\{selectedDepartment/);
  });

  it('refetches when the department changes', () => {
    // Sending the parameter is not enough: the callback that reads it has to depend on it, or it
    // closes over the first value for the life of the page — the filter looks wired and refetches
    // nothing, which is a subtler form of the defect this batch set out to fix.
    //
    // Asserted against the loadInsights callback specifically. A looser check for the dependency
    // anywhere in the file passed while it sat on the wrong hook.
    const text = code(screen);
    const start = text.indexOf('const loadInsights = useCallback');
    expect(start).toBeGreaterThan(-1);

    const body = text.slice(start, text.indexOf('useEffect', start));
    expect(body).toContain('[selectedDepartment]');
  });

  it('offers the departments this tenant has, not five invented ones', () => {
    // The options were hardcoded Engineering, Product, Design, Marketing, Sales. A tenant with
    // none of those got five filters that matched nothing.
    const text = code(screen);

    expect(text).toContain('/api/departments/names');
    expect(text).toContain('departmentFilter');
    for (const invented of ["{ value: 'engineering'", "{ value: 'marketing'", "{ value: 'sales'"]) {
      expect(text).not.toContain(invented);
    }
  });

  it('says what each filter narrows', () => {
    // Position level, source and date range are not accepted by the KPI endpoint and cannot be —
    // those figures are a snapshot of today. Saying so beats implying they all do the same thing.
    expect(read(screen)).toContain('narrow the charts below');
  });
});

describe('the HR overview shows everything it computes', () => {
  const screen = 'analytics/hr-overview/page.tsx';

  it('displays the gender distribution', () => {
    // Of 24 measures emitted by HROverviewAnalyticsService this was the only one no screen read.
    expect(code(screen)).toContain('genderDistribution');
  });

  it('renders an absent measure as absent, not as zero', () => {
    expect(code(screen)).toContain('Not reported');
  });

  it('no longer hardcodes a dark theme', () => {
    // It was built with bg-gray-800 and text-white, so it rendered dark whatever the theme said.
    const text = code(screen);

    expect(text).not.toContain('bg-gray-800');
    expect(text).not.toContain('text-white');
  });
});

describe('reports and export state what is happening', () => {
  it('reports distinguishes never-run from run', () => {
    // A schedule that has never produced anything and one that ran at 06:00 are different states.
    expect(code('reports/page.tsx')).toContain("'Never'");
  });

  it('reports derives last-run from results, not from schedules', () => {
    // A schedule says when it is meant to run; this figure is about whether it did.
    expect(code('reports/page.tsx')).toContain('reportResults');
  });

  it('export counts its jobs rather than tracking them separately', () => {
    const text = code('reports/export/page.tsx');

    expect(text).toContain('const running =');
    expect(text).toContain('const ready =');
    expect(text).toContain('const failed =');
  });

  it('export names the formats it actually offers', () => {
    // FORMAT_OPTIONS is the real list; an invented FORMATS constant would have shipped a subtitle
    // naming formats the screen does not have.
    const text = code('reports/export/page.tsx');

    expect(text).toContain('FORMAT_OPTIONS.map');
    expect(text).not.toMatch(/\bFORMATS\b/);
  });
});
