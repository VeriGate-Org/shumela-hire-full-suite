/**
 * Theme contrast ratchet.
 *
 * A full runtime audit (every route, both themes, real computed styles) found 2,616 failing
 * text/icon/placeholder samples. Remediating all of it is ongoing; the job of this test is
 * narrower and more important — to stop the two mechanisms that produce *invisible* text from
 * coming back, and to keep the shared CSS button classes honest.
 *
 * It is deliberately a ratchet rather than a threshold on the whole app: a test that fails on
 * work already known to be outstanding gets suppressed, and a suppressed test protects nothing.
 *
 * The mechanisms guarded here:
 *
 *   1. `dark:text-gray-*` / `dark:text-slate-*`. The gray and slate scales are re-declared for
 *      dark mode in globals.css with their values INVERTED (`--tw-gray-100` is #1E293B in dark,
 *      not #F3F4F6). A plain `text-gray-900` therefore already adapts. Adding a `dark:` variant
 *      flips it a second time, back to a dark ink on a dark surface — `text-gray-900
 *      dark:text-gray-100` rendered #1E293B on a #1E293B card, a contrast ratio of exactly 1:1.
 *      253 of these were removed; the base class alone is correct.
 *
 *   2. Ink stated on the same element as a solid CTA fill. `--cta-foreground` is the ink for
 *      sitting ON the gold; `--cta-on-surface` is the ink for when there is no fill. Using
 *      `--foreground` for either is what made "Apply Now" and "Add Candidate" unreadable.
 */
import fs from 'fs';
import path from 'path';

const SRC = path.join(process.cwd(), 'src');
const CSS = path.join(SRC, 'app/globals.css');

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) sourceFiles(p, acc);
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function hits(re: RegExp): string[] {
  const out: string[] = [];
  for (const f of sourceFiles(SRC)) {
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      // a fresh regex per line: /g state leaks between calls otherwise
      if (new RegExp(re.source).test(line)) out.push(`${path.relative(process.cwd(), f)}:${i + 1}`);
    });
  }
  return out;
}

describe('theme contrast ratchet', () => {
  it('never re-adds a dark: variant to the inverted gray/slate scales', () => {
    // The scales are inverted for dark mode, so the base class already adapts and the variant
    // flips it back — 1:1 text. Delete the variant; do not add a new one.
    expect(hits(/dark:text-(?:gray|slate)-\d+/)).toEqual([]);
  });

  it('never puts --foreground on a solid gold CTA fill', () => {
    // --foreground is light in dark mode; on #F1C54B that measured 1.34:1. The ink for a gold
    // fill is --cta-foreground, which is navy in both themes.
    const bad = hits(/(?=.*(?:^|["'\s])(?:hover:)?bg-cta(?![\w/-]))(?=.*(?:^|["'\s])(?:hover:)?text-foreground(?![\w-]))/);
    expect(bad).toEqual([]);
  });

  it('never colours anything with a class the theme does not define', () => {
    /*
     * `text-deep-navy` sat on eleven gold buttons and badges across eight files, and `bg-off-white`
     * on sixteen panels. Neither is in tailwind.config.ts or globals.css, so neither produced any
     * colour: the elements inherited, and the gold badges rendered light-on-gold at 1.33:1.
     *
     * A phantom class is worse than a wrong one. It reads as deliberate in the source, and the
     * pair-checking guard above cannot see it — there is no token to resolve, so there is no pair.
     *
     * Only hyphenated brand-style names are checked. Tailwind's own scales (gray-400, red-100) and
     * its non-colour utilities (bg-no-repeat) are not ours to validate, and directional borders
     * (border-l-error) are stripped to the token they actually carry.
     */
    const tokens = fs.readFileSync(path.join(process.cwd(), 'tailwind.config.ts'), 'utf8');
    const css = fs.readFileSync(CSS, 'utf8');
    const TAILWIND_OWN = /^(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent|current|inherit|gradient)(?:-|$)/;
    const NOT_A_COLOUR = new Set(['no-repeat', 'clip-text', 'clip-padding', 'clip-border']);

    const suspects = new Set<string>();
    for (const file of sourceFiles(SRC)) {
      const src = fs.readFileSync(file, 'utf8');
      for (const m of src.matchAll(/(?<![\w-])(?:text|bg|border)-((?:[a-z]+-)+[a-z]+)(?![\w-])/g)) {
        const token = m[1].replace(/^[trblxy]-/, ''); // border-l-error -> error
        if (TAILWIND_OWN.test(token) || NOT_A_COLOUR.has(token)) continue;
        suspects.add(token);
      }
    }

    const undefinedTokens = [...suspects]
      .filter((t) => !tokens.includes(`'${t}'`) && !tokens.includes(`${t}:`) && !css.includes(`--${t}`))
      .sort();
    expect(undefinedTokens).toEqual([]);
  });

  it('keeps the CTA ink tokens distinct and defined in both themes', () => {
    const css = fs.readFileSync(CSS, 'utf8');
    // --cta-on-surface is the ink where there is NO fill; --cta-foreground the ink ON the fill.
    // Collapsing them is what broke the outline buttons, so both must exist in both themes.
    for (const token of ['--cta-foreground', '--cta-on-surface']) {
      const declarations = css.match(new RegExp(`${token}\\s*:`, 'g')) || [];
      expect(declarations.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps .btn-primary off the on-fill ink while it has no fill', () => {
    const css = fs.readFileSync(CSS, 'utf8');
    const block = css.match(/\.btn-primary\s*\{([^}]*)\}/);
    expect(block).not.toBeNull();
    expect(block![1]).toContain('--cta-on-surface');
    expect(block![1]).not.toContain('var(--cta-foreground)');
  });
});
