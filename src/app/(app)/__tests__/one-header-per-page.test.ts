import fs from 'fs';
import path from 'path';

/**
 * A page has one header, not two.
 *
 * <p><b>What went wrong.</b> Converting a screen to the identity band meant stripping
 * {@code title} and {@code subtitle} from its {@code PageWrapper}. But {@code ModernLayout} renders
 * its header card when <em>any</em> of title, subtitle or actions is present — so a page that kept
 * its actions still drew the card, now empty apart from a button, sitting above the navy band.
 *
 * <p>Nine pages shipped like that. Nothing caught it: every test asserted the band was present and
 * that no title was passed, and both were true. It took someone looking at the screen.
 *
 * <p>Two more shapes turned up when someone looked at the screen again:
 *
 * <ul>
 *   <li><b>Two populated headers.</b> A page whose loaded branch kept its wrapper title while also
 *       rendering a band drew both — the same words twice, in two different treatments.</li>
 *   <li><b>A header that changes shape when the page loads.</b> Loading and error branches kept
 *       their titles, so the gold card showed while data was fetched and was replaced by the navy
 *       band when it arrived.</li>
 * </ul>
 *
 * <p>So the invariant is stronger than "actions need a title": <b>a page that uses the band must not
 * pass a title to PageWrapper in any branch</b>. One header, in every state.
 */

const APP = path.join(process.cwd(), 'src', 'app', '(app)');

/** Every page and client page under the app router. */
function screens(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== '__tests__') out.push(...screens(full));
    } else if (entry.name === 'page.tsx' || entry.name === 'ClientPage.tsx') {
      out.push(full);
    }
  }
  return out;
}

/** The end of a JSX opening tag, ignoring any `>` inside a `{...}` expression. */
function tagEnd(source: string, start: number): number {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (c === '{') depth += 1;
    else if (c === '}') depth -= 1;
    else if (c === '>' && depth === 0) return i + 1;
  }
  return source.length;
}

describe('a page that uses the band has no other header', () => {
  it('passes no title to PageWrapper in any branch', () => {
    // Including loading and error branches. A page whose header changes shape when the data
    // arrives is the same defect as one with two headers, spread over time instead of space.
    const offenders: string[] = [];

    for (const file of screens(APP)) {
      const source = fs.readFileSync(file, 'utf8');
      if (!source.includes('IdentityBand')) continue;

      let index = source.indexOf('<PageWrapper');
      while (index !== -1) {
        if (source.slice(index, tagEnd(source, index)).includes('title=')) {
          offenders.push(path.relative(APP, file));
          break;
        }
        index = source.indexOf('<PageWrapper', index + 1);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('renders no more bands than it has branches', () => {
    // Converting a titled wrapper by adding a band puts a second one on any branch that already
    // had its own — which is what appeared above the requisition record.
    const offenders: string[] = [];

    for (const file of screens(APP)) {
      const source = fs.readFileSync(file, 'utf8');
      const bands = (source.match(/<IdentityBand/g) ?? []).length;
      const branches = (source.match(/<PageWrapper/g) ?? []).length;
      if (branches > 0 && bands > branches) offenders.push(path.relative(APP, file));
    }

    expect(offenders).toEqual([]);
  });
});

describe('no page draws an empty header card', () => {
  it('every PageWrapper carrying actions also carries a title', () => {
    // ModernLayout renders its header when any of title, subtitle or actions is set. Actions
    // without a title therefore draws the card with nothing in it but the button — which is what
    // appeared above the band on nine screens.
    //
    // A page using the band should pass PageWrapper nothing and hang its actions on the band.
    const offenders: string[] = [];

    for (const file of screens(APP)) {
      const source = fs.readFileSync(file, 'utf8');
      let index = source.indexOf('<PageWrapper');

      while (index !== -1) {
        const tag = source.slice(index, tagEnd(source, index));
        if (tag.includes('actions=') && !tag.includes('title=')) {
          offenders.push(path.relative(APP, file));
          break;
        }
        index = source.indexOf('<PageWrapper', index + 1);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('checked a realistic number of screens', () => {
    // A walker that silently finds nothing would make the assertion above meaningless.
    expect(screens(APP).length).toBeGreaterThan(100);
  });
});

describe('the gold header card is gone', () => {
  it('no screen passes a title to PageWrapper', () => {
    // The sweep that moved the last 110 screens onto the band. Stated as an invariant rather than
    // left as a one-off, because the old header is still what a new page would be copied from:
    // ModernLayout renders its card whenever a title, subtitle or actions is present, so a single
    // titled wrapper brings the whole treatment back on that screen.
    const offenders: string[] = [];

    for (const file of screens(APP)) {
      const source = fs.readFileSync(file, 'utf8');
      let index = source.indexOf('<PageWrapper');
      while (index !== -1) {
        if (source.slice(index, tagEnd(source, index)).includes('title=')) {
          offenders.push(path.relative(APP, file));
          break;
        }
        index = source.indexOf('<PageWrapper', index + 1);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('most screens now carry a band', () => {
    // Guards the other direction: a walker that stopped finding screens would make the assertion
    // above pass by looking at nothing.
    const withBand = screens(APP).filter((f) =>
      fs.readFileSync(f, 'utf8').includes('IdentityBand'),
    );

    expect(withBand.length).toBeGreaterThan(120);
  });
});

/**
 * A page's children draw headers too.
 *
 * <p>Every assertion above reads one file. That is why the dashboard shipped with two identity
 * bands stacked: the sweep gave <code>dashboard/page.tsx</code> a band, and the role dashboard it
 * renders — two components down, through RoleDashboard — already had one of its own, with better
 * figures. Each file was individually correct.
 *
 * <p>A purely static check over-reports, because a page's band and its child's often live in
 * branches that cannot both render: the integrations screens put a band on the
 * permission-denied path and delegate to ConnectorScreen otherwise. So this is a ratchet with the
 * known-good cases named, not a rule — new pairings have to be looked at by a person.
 */
describe('a page and its children do not both draw a band', () => {
  /** Pairings that are fine, each because the two bands are mutually exclusive. */
  const ALLOWED: Record<string, string> = {
    'recruiter-dashboard/page.tsx': 'band is on the access-denied branch; RecruiterDashboard renders otherwise',
    'integrations/docusign/page.tsx': 'band is on the permission-denied branch; ConnectorScreen renders otherwise',
    'integrations/job-boards/page.tsx': 'band is on the permission-denied branch; ConnectorScreen renders otherwise',
    'integrations/email/page.tsx': 'band is on the permission-denied branch; ConnectorScreen renders otherwise',
    'applicants/page.tsx': 'pre-dates the sweep — the page header is deliberate, see the note in the file',
  };

  /** Every component that ends up rendering a band, following what components render. */
  function bandRenderers(): Set<string> {
    const byName = new Map<string, string>();
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) { if (entry.name !== '__tests__') walk(full); }
        else if (entry.name.endsWith('.tsx')) byName.set(entry.name.replace('.tsx', ''), fs.readFileSync(full, 'utf8'));
      }
    };
    walk(path.join(process.cwd(), 'src'));

    const renders = new Map<string, boolean>();
    const check = (name: string, seen = new Set<string>()): boolean => {
      if (renders.has(name)) return renders.get(name)!;
      if (seen.has(name) || !byName.has(name)) return false;
      seen.add(name);
      const source = byName.get(name)!;
      const result = source.includes('<IdentityBand')
        || [...new Set(source.match(/<([A-Z]\w+)/g) ?? [])]
             .map((t) => t.slice(1))
             .some((child) => child !== name && check(child, seen));
      renders.set(name, result);
      return result;
    };

    const out = new Set<string>();
    for (const name of byName.keys()) if (name !== 'IdentityBand' && check(name)) out.add(name);
    return out;
  }

  it('flags any page that draws a band and renders a component that also does', () => {
    const renderers = bandRenderers();
    const offenders: string[] = [];

    for (const file of screens(APP)) {
      const source = fs.readFileSync(file, 'utf8');
      if (!source.includes('<IdentityBand')) continue;
      const rel = path.relative(APP, file);
      if (rel in ALLOWED) continue;

      const children = [...new Set(source.match(/<([A-Z]\w+)/g) ?? [])]
        .map((t) => t.slice(1))
        .filter((c) => c !== 'IdentityBand' && c !== 'PageWrapper' && renderers.has(c));

      if (children.length) offenders.push(`${rel} also renders ${children.join(', ')}`);
    }

    expect(offenders).toEqual([]);
  });

  it('found the components that render bands', () => {
    // Without this the assertion above passes by knowing about nothing.
    expect(bandRenderers().size).toBeGreaterThan(10);
  });
});
