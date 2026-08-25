import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'src', 'app', '(app)', 'pipeline');
const PAGE = fs.readFileSync(path.join(DIR, 'page.tsx'), 'utf8');
const CARD = fs.readFileSync(path.join(DIR, 'StageCard.tsx'), 'utf8');

/** Both files together: the board is the page, and the card it renders. */
const BOARD = `${PAGE}\n${CARD}`;

/**
 * The pipeline board has to be operable without a mouse.
 *
 * <p>Two defects, both of which read as "works fine" to anyone testing with a trackpad:
 *
 * <ul>
 *   <li>Opening a candidate was an <code>onClick</code> on the card <code>div</code>, with no
 *       <code>tabIndex</code>, no role and no key handler. A keyboard or screen-reader user could
 *       read every card on the board and open none of them.</li>
 *   <li>The selection checkbox was revealed by <code>group-hover</code> alone. It is a real input,
 *       so it was in the tab order the whole time — focus landed on a control with
 *       <code>opacity-0</code>. That is worse than being unreachable, because the page appears to
 *       swallow the Tab key rather than to be missing a feature.</li>
 * </ul>
 *
 * <p>These read the source rather than rendering the page. That is deliberate: the failure being
 * guarded against is a <em>pattern</em> — a hover-only reveal on a focusable control, an action
 * bound to a bare div — and it can reappear anywhere in a 2,000-line file. A render test would
 * pin the one card it happened to mount and miss the next one.
 *
 * <p>Reads the card component as well as the page. When the per-stage card was extracted, every
 * one of these assertions failed while the page remained perfectly operable — the markup had moved,
 * not regressed. Following it is the right repair; relaxing the assertions would have turned a
 * guard into a formality, and the extraction did hide one real gap, which is why the list view's
 * row checkbox is now named too.
 *
 * <p>It is not a substitute for checking the page with a keyboard. It is a substitute for
 * remembering to.
 */
describe('the pipeline board can be driven from the keyboard', () => {
  it('reveals hover-hidden controls on focus as well', () => {
    // Every `opacity-0 group-hover:opacity-100` has to pair with a focus reveal, or a focusable
    // child of that element becomes invisible while focused. Tailwind orders these classes freely,
    // so the match is on the pair being present in one class string, not on their order.
    const hoverReveals = (BOARD.match(/className=["'`][^'"`]*group-hover:opacity-100[^'"`]*/g) ?? [])
      .filter((cls) => /\bopacity-0\b/.test(cls));

    expect(hoverReveals.length).toBeGreaterThan(0); // guard against the regex silently going stale

    const withoutFocusReveal = hoverReveals.filter(
      (cls) => !cls.includes('focus:opacity-100') && !cls.includes('focus-within:opacity-100'),
    );

    expect(withoutFocusReveal).toEqual([]);
  });

  it('opens a candidate from a real button, not a click handler on a div', () => {
    // The card div may carry an onClick for mouse convenience, but it cannot be the only way in.
    expect(CARD).toContain('open candidate details');

    const cardButton = /<button[^>]*\n(?:[^<]|<(?!\/button))*onOpen\(\)/;
    expect(cardButton.test(CARD)).toBe(true);
  });

  it('gives every candidate-scoped control a name that says which candidate it acts on', () => {
    // An icon button with title="View details" reads identically on every row, so a screen-reader
    // user hears the same label twenty times and cannot tell the rows apart.
    expect(PAGE).toMatch(/aria-label=\{`View details for \$\{application\.candidate/);

    // Both surfaces select a candidate: the board card and the list view's rows.
    expect(CARD).toMatch(/aria-label=\{`Select \$\{name\}`\}/);
    expect(PAGE).toMatch(/aria-label=\{`Select \$\{application\.candidate/);
  });

  it('keeps the board and its columns announced as lists', () => {
    // The structure screen readers use to say "5 items in Screening". Adding button semantics to
    // the card must not have cost the list semantics around it.
    expect(PAGE).toContain('role="region"');
    expect(PAGE).toContain('role="list"');
    expect(CARD).toContain('role="listitem"');
  });
});
