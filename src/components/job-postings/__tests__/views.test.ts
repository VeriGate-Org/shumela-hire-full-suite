import fs from 'fs';
import path from 'path';
import { DEDUPLICATED_FROM, includesInflatedViews, viewsCaveat } from '../views';

const BEFORE = '2026-08-01T09:00:00Z';
const AFTER = '2026-09-01T09:00:00Z';

describe('which totals are affected', () => {
  it('treats a posting published before the changeover as inflated', () => {
    expect(includesInflatedViews(BEFORE)).toBe(true);
  });

  it('treats one published after it as clean', () => {
    expect(includesInflatedViews(AFTER)).toBe(false);
  });

  it('treats an unknown or unreadable date as inflated', () => {
    // Caveating a clean figure is a smaller error than presenting a dirty one as clean, and a
    // posting with no readable publication date is more likely to be old than new.
    expect(includesInflatedViews(undefined)).toBe(true);
    expect(includesInflatedViews('not a date')).toBe(true);
  });
});

describe('what is printed under the count', () => {
  it('says so when the total predates deduplication', () => {
    const caveat = viewsCaveat(BEFORE, 1284);

    expect(caveat).toContain('repeat visits');
    expect(caveat).toContain('staff previews');
  });

  it('describes a clean count as what it is', () => {
    expect(viewsCaveat(AFTER, 42)).toBe(
      'One view per person per day, from the careers site only.',
    );
  });

  it('says nothing when there is nothing to caveat', () => {
    // A posting with no views does not need a note explaining what its zero includes.
    expect(viewsCaveat(BEFORE, 0)).toBeNull();
    expect(viewsCaveat(BEFORE, null)).toBeNull();
    expect(viewsCaveat(BEFORE, undefined)).toBeNull();
  });
});

describe('the changeover date', () => {
  it('is stated once', () => {
    // Written into copy on two screens otherwise, which is two things to change if it is wrong.
    expect(DEDUPLICATED_FROM).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is the only place either screen decides what the figure means', () => {
    const posting = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', '(app)', 'job-postings', '[id]', 'ClientPage.tsx'),
      'utf8',
    );
    const internal = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', '(app)', 'internal', 'jobs', '[id]', 'ClientPage.tsx'),
      'utf8',
    );

    expect(posting).toContain('viewsCaveat');
    expect(internal).toContain('includesInflatedViews');
    // Neither screen should carry an unconditional claim about repeats any more.
    expect(posting).not.toContain('Page views include repeat visits by the same person.');
  });
});
