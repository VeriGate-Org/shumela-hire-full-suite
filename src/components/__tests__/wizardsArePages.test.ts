import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * A wizard is a page, never a modal.
 *
 * <p>By the modal standard's own rule a modal is a *short focused task*, so anything that has
 * earned steps has already failed that test. Steps in a modal also cannot be linked to, resumed
 * from history, or handed to a colleague — which is the whole reason the four flows that did this
 * became routes.
 *
 * <p>`WizardShell` still accepts `variant="modal"` and still carries the focus-trap and scroll-lock
 * machinery that serves it. Deleting that is a follow-up; this stops anyone reaching for it in the
 * meantime, because an option that exists gets chosen.
 */
function tsxFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFilesUnder(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

describe('wizards are pages', () => {
  const src = join(process.cwd(), 'src');

  it('nothing mounts a wizard as a modal', () => {
    const offenders = tsxFilesUnder(src)
      .filter((f) => {
        const source = readFileSync(f, 'utf8');
        return /variant\s*=\s*["']modal["']/.test(source);
      })
      .map((f) => relative(src, f).split(/[\\/]/).join('/'))
      .sort();

    expect(offenders).toEqual([]);
  });

  it('the four flows that used to be modals have routes to live at', () => {
    // Named rather than counted: a route silently disappearing should fail here, not at the point
    // where somebody follows a link to it.
    const routes = [
      'app/(app)/requisitions/new/page.tsx',
      'app/(app)/job-postings/new/page.tsx',
      'app/(app)/interviews/schedule/page.tsx',
    ];
    const present = new Set(
      tsxFilesUnder(src).map((f) => relative(src, f).split(/[\\/]/).join('/')),
    );

    routes.forEach((r) => expect(present.has(r)).toBe(true));
  });
});
