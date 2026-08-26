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
 * <p>The fix is to hang the actions on the band, which takes them — so this asserts the shape that
 * makes the defect impossible rather than the symptom.
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
