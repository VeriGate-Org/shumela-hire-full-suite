import { test, expect, Page } from '@playwright/test';

/**
 * The public marketing site.
 *
 * This replaces the previous `dashboard.spec.ts`, which never tested a dashboard and could not
 * fail. Six of its seven tests were shaped `if (await locator.count() > 0) { expect(...) }`, which
 * passes when the element is missing — that is the case it was supposedly guarding. One test
 * navigated to `/dashboard/performance`, a route that does not exist, inside a try/catch that
 * logged "route not available yet" and passed. Another registered its `pageerror` listener *after*
 * `page.goto`, so it could never observe an error thrown during the load it was checking.
 *
 * Everything here asserts unconditionally against what the site actually renders. If a locator is
 * absent, the test fails.
 */

/** Desktop nav, from MarketingNav/MarketingNavClient. Kept in step with `navLinks` there. */
const NAV_LINKS = [
  { label: 'Platform', href: '/features' },
  { label: 'Solutions', href: '/solutions' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'About', href: '/about' },
  { label: 'Blog', href: '/blog' },
];

const HERO_HEADLINE =
  'Structured Talent Acquisition for Institutions That Cannot Afford to Get It Wrong';

const DESKTOP = { width: 1280, height: 720 };
const MOBILE = { width: 375, height: 667 };

/** Collects page errors and console errors from before the first navigation. */
function watchForErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
  });
  return errors;
}

test.describe('Marketing home — content', () => {
  test('serves the homepage with its real title and hero', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(
      'ShumelaHire — Structured Talent Acquisition for Institutions',
    );

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(HERO_HEADLINE);
  });

  test('offers both hero calls to action, pointing where they claim', async ({ page }) => {
    await page.goto('/');

    const demo = page.getByRole('link', { name: 'Request a Demo' }).first();
    const platform = page.getByRole('link', { name: 'Explore the Platform' }).first();

    await expect(demo).toBeVisible();
    await expect(demo).toHaveAttribute('href', '/demo');
    await expect(platform).toBeVisible();
    await expect(platform).toHaveAttribute('href', '/features');
  });

  test('exposes the document landmarks assistive technology needs', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});

test.describe('Marketing home — desktop navigation', () => {
  test.use({ viewport: DESKTOP });

  test('shows every nav link with the href it advertises', async ({ page }) => {
    await page.goto('/');

    for (const { label, href } of NAV_LINKS) {
      const link = page.getByRole('link', { name: label, exact: true }).first();
      await expect(link, `nav link "${label}"`).toBeVisible();
      await expect(link, `nav link "${label}" href`).toHaveAttribute('href', href);
    }
  });

  test('offers a sign-in route into the application', async ({ page }) => {
    await page.goto('/');

    const signIn = page.getByRole('link', { name: 'Sign In' }).first();
    await expect(signIn).toBeVisible();
    await expect(signIn).toHaveAttribute('href', '/login');
  });

  test('keeps the mobile menu button out of the desktop layout', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('button', { name: /open menu/i })).toBeHidden();
  });

  test('every nav destination resolves and renders', async ({ page }) => {
    // Five routes in one test, each compiled on first request by the dev server. That cold
    // cost alone can exceed the default budget when workers run in parallel.
    test.slow();
    page.setDefaultNavigationTimeout(90_000);

    for (const { label, href } of NAV_LINKS) {
      const response = await page.goto(href);
      expect(response?.status(), `${label} (${href}) status`).toBeLessThan(400);
      await expect(page.getByRole('main'), `${label} (${href}) main`).toBeVisible();
    }
  });
});

test.describe('Marketing home — mobile navigation', () => {
  test.use({ viewport: MOBILE });

  test('the menu button toggles the menu and reports its own state', async ({ page }) => {
    await page.goto('/');

    const open = page.getByRole('button', { name: 'Open menu' });
    await expect(open).toBeVisible();
    await expect(open).toHaveAttribute('aria-expanded', 'false');

    await open.click();

    const close = page.getByRole('button', { name: 'Close menu' });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByRole('link', { name: 'Pricing', exact: true }).first()).toBeVisible();

    await close.click();
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('the hero still reads at a phone width', async ({ page }) => {
    await page.goto('/');

    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(HERO_HEADLINE);

    // The page must not scroll sideways on a 375px viewport.
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, 'page scrolls horizontally on mobile').toBe(false);
  });
});

test.describe('Marketing home — health', () => {
  test('loads without page or console errors', async ({ page }) => {
    // Registered before navigating: the previous version attached this listener after
    // page.goto and so could never see an error thrown during the load it was checking.
    const errors = watchForErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });

  test('finishes loading within a reasonable budget', async ({ page }) => {
    const started = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(Date.now() - started).toBeLessThan(15000);
  });

  test('returns a real 404 for a route that does not exist', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByText(/not found|404/i).first()).toBeVisible();
  });
});
