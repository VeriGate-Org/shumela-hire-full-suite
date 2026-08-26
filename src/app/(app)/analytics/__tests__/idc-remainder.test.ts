import fs from 'fs';
import path from 'path';

const root = (...parts: string[]) => path.join(process.cwd(), 'src', ...parts);

const code = (file: string): string =>
  fs
    .readFileSync(file, 'utf8')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

const EXECUTIVE = root('app', '(app)', 'executive', 'reports', 'page.tsx');
const RECRUITER = root('components', 'RecruiterDashboard.tsx');

/**
 * The two analytics screens the IDC tenant can actually see that had not been done.
 *
 * <p>IDC licenses RECRUITMENT, AI, ANALYTICS and ADMINISTRATION, so the five HR analytics screens
 * are gated out of its menu entirely. Its analytics section is five entries, and these were the
 * two still on the old shape.
 *
 * <p>The recruiter one was easy to miss: <b>two components are called RecruiterDashboard</b>, and
 * the refreshed one is not the one this route renders.
 */
describe('recruiter analytics', () => {
  it('opens with the band', () => {
    // The route rendered components/RecruiterDashboard, while the band had been added to
    // components/dashboard/role-dashboards/RecruiterDashboard — a different file with the same name.
    expect(code(RECRUITER)).toContain('IdentityBand');
  });

  it('does not also carry a PageWrapper title on the loaded page', () => {
    // Scoped to the branch that renders the dashboard. The Access Denied branch keeps its title
    // deliberately: there is no record to identify and no figures to put in a band.
    const text = code(root('app', '(app)', 'recruiter-dashboard', 'page.tsx'));
    const loaded = text.slice(text.lastIndexOf('return ('));

    expect(loaded).toContain('<RecruiterDashboard />');
    expect(loaded).not.toMatch(/<PageWrapper[\s\S]{0,60}title=/);
  });
});

describe('executive reports', () => {
  it('opens with the band', () => {
    expect(code(EXECUTIVE)).toContain('IdentityBand');
  });

  it('sends the period to the endpoints that accept one', () => {
    // The selector triggered a refetch and was sent to nothing, so changing it re-fetched
    // identical data. /api/analytics/alerts takes days and the department pipeline takes a date
    // range; the KPI and dashboard calls are a snapshot of today and take neither.
    const text = code(EXECUTIVE);

    expect(text).toMatch(/alerts\?days=\$\{PERIOD_DAYS\[selectedPeriod\]\}/);
    expect(text).toMatch(/departments\?startDate=\$\{periodStart\(selectedPeriod\)\}/);
  });

  it('says which figures the period governs', () => {
    expect(fs.readFileSync(EXECUTIVE, 'utf8')).toContain('The figures above are current');
  });

  it('no longer renders a list nothing populates', () => {
    // strategicInsights was rendered over 49 lines from state whose setter, _setStrategicInsights,
    // was never called — so the tab showed only the AI narrative above it, on every tenant. The
    // narrative is real and stays.
    const text = code(EXECUTIVE);

    expect(text).not.toContain('strategicInsights');
    expect(text).not.toContain('_setStrategicInsights');
    expect(text).toContain('AiReportNarrative');
  });

  it('kept the band out of the error state', () => {
    // The band belongs on the loaded page. It briefly landed on the loadError branch instead,
    // which would have shown figures from a fetch that failed.
    const text = code(EXECUTIVE);
    const errorBranch = text.slice(text.indexOf('if (loadError)'), text.indexOf('if (loadError)') + 400);

    expect(errorBranch).not.toContain('IdentityBand');
  });
});
