import fs from 'fs';
import path from 'path';

const SCREEN = path.join(
  process.cwd(), 'src', 'app', '(app)', 'internal', 'jobs', '[id]', 'ClientPage.tsx',
);

const source = (): string => fs.readFileSync(SCREEN, 'utf8');

/**
 * Source with comments stripped.
 *
 * <p>The notes explaining what was removed name the very things asserted absent, so a plain
 * substring check would match the explanation rather than a live reference.
 */
const code = (): string =>
  source()
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');

/**
 * The internal job detail screen — the last recruitment screen still on the old look.
 *
 * <p>31 light-only colour classes, a legacy PageWrapper header, and a card beneath it repeating
 * the same title, department, location and employment type the header already carried.
 */
describe('internal job detail', () => {
  it('has no light-only colour classes', () => {
    expect(code().match(/\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g) ?? []).toEqual([]);
  });

  it('leads with the identity band and decides with the bar', () => {
    const text = code();

    expect(text).toContain('IdentityBand');
    // Applying is the decision this page exists for; it used a bespoke gold panel.
    expect(text).toContain('DecisionBar');
  });

  it('passes no header props to PageWrapper', () => {
    // PageWrapper carried title, subtitle and actions, and the first card beneath it restated the
    // same four fields. The band is the header now, so the wrapper renders no header block —
    // passing one is what produced two.
    expect(code()).not.toMatch(/<PageWrapper\s+title=/);
    expect(code()).toContain('<PageWrapper>');
  });

  it('omits a salary range rather than showing R0', () => {
    // A role advertised at zero rands is a different statement from one advertised with no range.
    expect(code()).toMatch(/job\.salaryRangeMin \|\| job\.salaryRangeMax/);
  });

  it('does not promise to save a role for later', () => {
    // The button said "Copy Link" and copied a link, but wore a bookmark icon — which promises
    // saving the role, a feature this product does not have.
    expect(code()).not.toContain('BookmarkIcon');
  });

  it('calls the view count what it is', () => {
    // JobPostingService increments on every getJobPostingBySlug with no session or IP dedup, and
    // carries a TODO saying so. "Total Views" reads as an audience; it is page loads including
    // repeat visits by the same person.
    const text = code();

    expect(text).not.toContain('Total Views');
    expect(text).toContain('Page views');
  });
});
