import fs from 'fs';
import path from 'path';
import { navigationRegistry } from '../navigationRegistry';
import { rolePermissions } from '../permissions';

/**
 * Every page a person is meant to work in has a way in.
 *
 * <p>The Approval Centre shipped in v2.2.0 with <b>no navigation entry</b>. It was reachable only
 * by typing the URL or through a link on the Workflow screen — so a recruiter with nine approvals
 * waiting had no way to discover the queue built for exactly that. The page was tested, the
 * endpoint was tested, and nothing asked whether anyone could find it.
 *
 * <p>These tests are cheap and would have caught it.
 */

/** Routes that deliberately have no menu entry, with the reason. */
const INTENTIONALLY_UNLISTED: Record<string, string> = {
  'job-postings/[id]': 'Reached from the job postings list, not the menu.',
  'internal/jobs/[id]': 'Reached from the internal jobs list.',
  'internal/apply/[requisitionId]': 'Reached from an internal job.',
  'requisitions/[id]': 'Reached from the requisitions list.',
  'requisitions/new': 'A create form, reached from the list.',
  'job-postings/new': 'A create form, reached from the list.',
};

describe('the approvals queue is reachable', () => {
  it('has a navigation entry', () => {
    const entry = navigationRegistry.find((item) => item.href === '/approvals');

    expect(entry).toBeDefined();
    expect(entry?.label).toBe('Approvals');
  });

  it('is offered to exactly the roles the endpoint admits', () => {
    // PendingApprovalsController: hasAnyRole('ADMIN','HR_MANAGER','RECRUITER','HIRING_MANAGER',
    // 'EXECUTIVE'). A menu entry wider than the endpoint sends people to a refusal; narrower, and
    // somebody who may approve cannot find their queue.
    const admitted = ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER', 'EXECUTIVE'];

    for (const role of admitted) {
      expect(rolePermissions[role as keyof typeof rolePermissions]).toContain('view_approvals');
    }

    const others = Object.keys(rolePermissions).filter((role) => !admitted.includes(role));
    for (const role of others) {
      expect(rolePermissions[role as keyof typeof rolePermissions]).not.toContain('view_approvals');
    }
  });
});

/**
 * Menu entries whose page does not exist, found when this test was written.
 *
 * <p>Both are gated behind {@code EMPLOYEE_SELF_SERVICE}, so they appear only for a tenant with
 * that feature on — which is why nobody had noticed. For such a tenant the item is in the menu and
 * clicking it lands on the SPA fallback, i.e. the marketing root.
 *
 * <p>Left in place rather than deleted: they belong to a module outside this work, and removing
 * somebody's nav entry is a different decision from noticing it is broken. Recorded here so the
 * test can pass without the debt going quiet.
 */
const KNOWN_MISSING_PAGES: Record<string, string> = {
  '/reports/employees': 'No page under src/app/(app)/reports/employees. EMPLOYEE_SELF_SERVICE.',
  '/announcements': 'No page under src/app/(app)/announcements. EMPLOYEE_SELF_SERVICE.',
};

describe('every menu entry points at a page that exists', () => {
  it.each(
    navigationRegistry.filter(
      (e) => e.href.startsWith('/') && !e.href.includes('[') && !(e.href in KNOWN_MISSING_PAGES),
    ),
  )(
    '$label → $href',
    (entry) => {
      // A menu item pointing at a route that was renamed or removed is a dead end that looks like
      // a feature.
      const segments = entry.href.replace(/^\//, '').split('/');
      const base = path.join(process.cwd(), 'src', 'app', '(app)', ...segments);

      const exists =
        fs.existsSync(`${base}/page.tsx`) ||
        fs.existsSync(`${base}.tsx`) ||
        fs.existsSync(`${base}/ClientPage.tsx`);

      expect(exists).toBe(true);
    },
  );
});

describe('the broken entries stay visible until someone fixes them', () => {
  it('is still exactly two, and they are still broken', () => {
    // If one of these gains a page, delete its line rather than leaving a stale exemption. If a
    // third appears, this fails — which is the point.
    for (const href of Object.keys(KNOWN_MISSING_PAGES)) {
      const segments = href.replace(/^\//, '').split('/');
      const base = path.join(process.cwd(), 'src', 'app', '(app)', ...segments);
      const exists = fs.existsSync(`${base}/page.tsx`) || fs.existsSync(`${base}.tsx`);

      expect(exists).toBe(false);
    }

    expect(Object.keys(KNOWN_MISSING_PAGES)).toHaveLength(2);
  });
});

describe('pages that exist have a way in', () => {
  it('lists any recruitment page with neither a menu entry nor a stated reason', () => {
    const appDir = path.join(process.cwd(), 'src', 'app', '(app)');
    const linked = new Set(navigationRegistry.map((entry) => entry.href.replace(/^\//, '')));

    // Only the recruitment module, which is the part that has been through the redesign and whose
    // surface is known. Widening this to the whole product would report every screen at once and
    // stop being read.
    const recruitment = [
      'approvals', 'agencies', 'applicants', 'applications', 'interviews', 'job-postings',
      'job-templates', 'offers', 'pipeline', 'requisitions', 'salary-recommendations',
      'talent-pools', 'internal/jobs',
    ];

    const orphaned = recruitment.filter((route) => {
      const hasPage = fs.existsSync(path.join(appDir, ...route.split('/'), 'page.tsx'));
      return hasPage && !linked.has(route) && !(route in INTENTIONALLY_UNLISTED);
    });

    expect(orphaned).toEqual([]);
  });
});
