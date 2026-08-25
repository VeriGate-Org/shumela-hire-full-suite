import fs from 'fs';
import path from 'path';

/**
 * The recruitment module's screens use the theme tokens, not the raw grey scale.
 *
 * <p><code>bg-white</code>, <code>bg-gray-*</code>, <code>text-gray-*</code> and
 * <code>border-gray-*</code> do not respond to <code>data-theme="dark"</code>. A screen carrying
 * them is not merely inconsistent with the rest of the product — it ignores the theme outright, so
 * a person reading in dark mode gets a white card in the middle of a dark page.
 *
 * <p>This is a <b>ratchet</b>: the list only ever grows. Adding a screen here after sweeping it is
 * what stops the greys coming back the next time someone copies a block from an unswept file.
 *
 * <p>The tokens: <code>bg-card</code>, <code>bg-muted</code>, <code>text-foreground</code>,
 * <code>text-muted-foreground</code>, <code>border-border</code>.
 */

/** Recruitment screens that have been swept. Append after sweeping — never remove. */
const SWEPT = [
  'agencies/page.tsx',
  'talent-pools/page.tsx',
  'dashboard/page.tsx',
  'pipeline/page.tsx',
  'internal/jobs/[id]/ClientPage.tsx',
  'internal/apply/[requisitionId]/ClientPage.tsx',
  'approvals/page.tsx',
  'job-postings/[id]/ClientPage.tsx',
];

const LIGHT_ONLY = /\b(bg-white|bg-gray-\d+|text-gray-\d+|border-gray-\d+)\b/g;

describe('recruitment screens use tokens, not the raw grey scale', () => {
  it.each(SWEPT)('%s has no light-only colour classes', (relative) => {
    const file = path.join(process.cwd(), 'src', 'app', '(app)', ...relative.split('/'));
    const found = fs.readFileSync(file, 'utf8').match(LIGHT_ONLY) ?? [];

    // If this fails: use the token, not the grey. They flip with the theme; the scale does not.
    expect(found).toEqual([]);
  });

  it('every listed screen actually exists', () => {
    // A ratchet that silently passes on a renamed file protects nothing.
    for (const relative of SWEPT) {
      const file = path.join(process.cwd(), 'src', 'app', '(app)', ...relative.split('/'));
      expect(fs.existsSync(file)).toBe(true);
    }
  });
});
