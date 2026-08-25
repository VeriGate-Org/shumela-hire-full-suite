import fs from 'fs';
import path from 'path';

const PAGE = path.join(process.cwd(), 'src', 'app', '(app)', 'pipeline', 'page.tsx');

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
 * <p>It is not a substitute for checking the page with a keyboard. It is a substitute for
 * remembering to.
 */
describe('the pipeline board can be driven from the keyboard', () => {
  const source = fs.readFileSync(PAGE, 'utf8');

  it('reveals hover-hidden controls on focus as well', () => {
    // Every `opacity-0 group-hover:opacity-100` has to pair with a focus reveal, or a focusable
    // child of that element becomes invisible while focused.
    const hoverReveals = source.match(/opacity-0 group-hover:opacity-100[^'"`]*/g) ?? [];

    expect(hoverReveals.length).toBeGreaterThan(0); // guard against the regex silently going stale

    const withoutFocusReveal = hoverReveals.filter(
      (cls) => !cls.includes('focus:opacity-100') && !cls.includes('focus-within:opacity-100'),
    );

    expect(withoutFocusReveal).toEqual([]);
  });

  it('opens a candidate from a real button, not a click handler on a div', () => {
    // setSelectedApplication is the "open this candidate" action. Every call site that a user
    // triggers must sit on a <button>; the card div may also carry one for mouse convenience, but
    // it cannot be the only way in.
    expect(source).toContain('open candidate details');

    const cardButton = /<button[^>]*\n(?:[^<]|<(?!\/button))*setSelectedApplication\(application\)/;
    expect(cardButton.test(source)).toBe(true);
  });

  it('gives each row action a name that says which candidate it acts on', () => {
    // An icon button with title="View details" reads identically on every row, so a screen-reader
    // user hears the same label twenty times and cannot tell the rows apart.
    expect(source).toMatch(/aria-label=\{`View details for \$\{application\.candidate/);
    expect(source).toMatch(/aria-label=\{`Select \$\{application\.candidate/);
  });

  it('keeps the board and its columns announced as lists', () => {
    // The structure screen readers use to say "5 items in Screening". Adding button semantics to
    // the card must not have cost the list semantics around it.
    expect(source).toContain('role="region"');
    expect(source).toContain('role="list"');
    expect(source).toContain('role="listitem"');
  });
});
