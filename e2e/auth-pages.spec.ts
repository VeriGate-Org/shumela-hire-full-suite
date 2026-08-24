import { test, expect, Page, Route } from '@playwright/test';

/**
 * The authentication surfaces (#240).
 *
 * These are the front door — the first screens anyone sees after leaving the marketing site — and
 * they had no browser coverage of any kind. The login page has unit tests; register, agency
 * registration and password reset had none, and nothing checked that the brand actually renders
 * or that the two registration routes are reachable from sign-in.
 *
 * The API is stubbed at the network boundary. Everything above it is the real application.
 */

const HEADLINE = 'Every appointment,';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

interface Captured {
  registrations: Array<{ path: string; body: Record<string, unknown> }>;
}

async function stubApi(
  page: Page,
  opts: { status?: number; body?: unknown } = {},
): Promise<Captured> {
  const captured: Captured = { registrations: [] };

  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;

    if (route.request().method() === 'POST' && path.includes('/register')) {
      captured.registrations.push({
        path,
        body: JSON.parse(route.request().postData() ?? '{}'),
      });
      return json(route, opts.body ?? { success: true }, opts.status ?? 201);
    }
    return json(route, {});
  });

  return captured;
}

/**
 * The mark renders once per breakpoint variant — one in the brand panel, one inline above the
 * form — and CSS decides which is shown. Filtering to the visible one keeps these assertions
 * about what a person actually sees rather than about DOM order.
 */
const brandMark = (page: Page) => page.getByLabel('ShumelaHire').filter({ visible: true });

test.describe('Auth pages — the brand is present', () => {
  for (const [name, path] of [
    ['sign in', '/login'],
    ['candidate registration', '/register'],
    ['agency registration', '/agencies/register'],
    ['password reset', '/forgot-password'],
  ] as const) {
    test(`${name} carries the mark and the brand panel`, async ({ page }) => {
      await stubApi(page);
      await page.goto(path);

      await expect(brandMark(page)).toHaveCount(1);
      await expect(page.getByText(HEADLINE)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }

  test('the wordmark reads as one word to assistive technology', async ({ page }) => {
    await stubApi(page);
    await page.goto('/login');

    // "Shumela" and "Hire" are two coloured spans; they must not be announced separately.
    await expect(brandMark(page)).toHaveText('ShumelaHire');
  });

  test('the brand panel gives way to an inline mark on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubApi(page);
    await page.goto('/login');

    // The panel is decorative and drops away; the mark moves inline so the brand survives.
    await expect(page.getByText(HEADLINE)).toBeHidden();
    await expect(brandMark(page)).toHaveCount(1);

    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(overflows, 'auth page scrolls sideways on mobile').toBe(false);
  });
});

test.describe('Auth pages — both registration routes are reachable from sign-in', () => {
  test('sign-in offers the candidate and agency routes', async ({ page }) => {
    await stubApi(page);
    await page.goto('/login');

    const candidate = page.getByRole('link', { name: /Register as a candidate/ });
    const agency = page.getByRole('link', { name: /Register your agency/ });

    await expect(candidate).toBeVisible();
    await expect(candidate).toHaveAttribute('href', '/register');
    await expect(agency).toBeVisible();
    await expect(agency).toHaveAttribute('href', '/agencies/register');
  });

  test('the agency route says the account needs approval before it works', async ({ page }) => {
    await stubApi(page);
    await page.goto('/login');

    // Agency users are created disabled pending approval, so advertising the route without
    // saying so would leave them to discover it as a failed sign-in.
    await expect(page.getByText(/Activated once approved/i)).toBeVisible();
  });

  test('the candidate route actually navigates', async ({ page }) => {
    await stubApi(page);
    await page.goto('/login');

    await page.getByRole('link', { name: /Register as a candidate/ }).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole('heading', { name: /Create your account/ })).toBeVisible();
  });

  test('the agency route actually navigates', async ({ page }) => {
    await stubApi(page);
    await page.goto('/login');

    await page.getByRole('link', { name: /Register your agency/ }).click();
    await expect(page).toHaveURL(/\/agencies\/register$/);
    await expect(page.getByRole('heading', { name: /Register your agency/ })).toBeVisible();
  });
});

test.describe('Auth pages — candidate registration', () => {
  test('posts the entered details to the public register endpoint', async ({ page }) => {
    const captured = await stubApi(page);
    await page.goto('/register');

    await page.getByLabel('First name').fill('Thandi');
    await page.getByLabel('Last name').fill('Molefe');
    await page.getByLabel('Email').fill('thandi@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Sup3rSecret!23');
    await page.getByLabel('Confirm password').fill('Sup3rSecret!23');
    await page.getByRole('button', { name: /Create account/i }).click();

    await expect.poll(() => captured.registrations.length).toBe(1);
    const { path, body } = captured.registrations[0];
    expect(path).toBe('/api/public/auth/register');
    expect(body).toMatchObject({
      firstName: 'Thandi',
      lastName: 'Molefe',
      email: 'thandi@example.com',
    });
  });

  test('refuses mismatched passwords without calling the API', async ({ page }) => {
    const captured = await stubApi(page);
    await page.goto('/register');

    await page.getByLabel('First name').fill('Thandi');
    await page.getByLabel('Last name').fill('Molefe');
    await page.getByLabel('Email').fill('thandi@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Sup3rSecret!23');
    await page.getByLabel('Confirm password').fill('somethingelse');
    await page.getByRole('button', { name: /Create account/i }).click();

    await expect(page.getByText(/Passwords do not match/i)).toBeVisible();
    expect(captured.registrations).toHaveLength(0);
  });

  test('surfaces the reason the server gives', async ({ page }) => {
    await stubApi(page, { status: 409, body: { success: false, message: 'Email already registered.' } });
    await page.goto('/register');

    await page.getByLabel('First name').fill('Thandi');
    await page.getByLabel('Last name').fill('Molefe');
    await page.getByLabel('Email').fill('taken@example.com');
    await page.getByLabel('Password', { exact: true }).fill('Sup3rSecret!23');
    await page.getByLabel('Confirm password').fill('Sup3rSecret!23');
    await page.getByRole('button', { name: /Create account/i }).click();

    await expect(page.getByText('Email already registered.')).toBeVisible();
  });

  test('rates password strength as it is typed', async ({ page }) => {
    await stubApi(page);
    await page.goto('/register');

    await page.getByLabel('Password', { exact: true }).fill('abc');
    await expect(page.getByText(/Weak|Fair/).first()).toBeVisible();

    await page.getByLabel('Password', { exact: true }).fill('Sup3rSecret!23');
    await expect(page.getByText(/Good|Strong/).first()).toBeVisible();
  });
});

test.describe('Auth pages — agency registration', () => {
  test('posts to the public agency endpoint with the selected specializations', async ({ page }) => {
    const captured = await stubApi(page);
    await page.goto('/agencies/register');

    await page.getByLabel('Agency name').fill('Karisani Talent Partners');
    await page.getByLabel('Contact person').fill('Thandi Molefe');
    await page.getByLabel('Contact email').fill('thandi@agency.co.za');
    await page.getByRole('button', { name: 'Executive Search' }).click();
    await page.getByLabel('Password', { exact: true }).fill('Sup3rSecret!23');
    await page.getByLabel('Confirm password').fill('Sup3rSecret!23');
    await page.getByRole('button', { name: /Submit registration/i }).click();

    await expect.poll(() => captured.registrations.length).toBe(1);
    const { path, body } = captured.registrations[0];
    expect(path).toBe('/api/public/agencies/register');
    expect(body).toMatchObject({
      agencyName: 'Karisani Talent Partners',
      contactEmail: 'thandi@agency.co.za',
    });
    expect(body.specializations).toContain('Executive Search');
  });

  test('a specialization reports its own selected state', async ({ page }) => {
    await stubApi(page);
    await page.goto('/agencies/register');

    const chip = page.getByRole('button', { name: 'Engineering' });
    await expect(chip).toHaveAttribute('aria-pressed', 'false');
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  test('confirms that the account waits on approval', async ({ page }) => {
    await stubApi(page);
    await page.goto('/agencies/register');

    await page.getByLabel('Agency name').fill('Karisani Talent Partners');
    await page.getByLabel('Contact person').fill('Thandi Molefe');
    await page.getByLabel('Contact email').fill('thandi@agency.co.za');
    await page.getByLabel('Password', { exact: true }).fill('Sup3rSecret!23');
    await page.getByLabel('Confirm password').fill('Sup3rSecret!23');
    await page.getByRole('button', { name: /Submit registration/i }).click();

    await expect(page.getByRole('heading', { name: /Registration submitted/i })).toBeVisible();
    await expect(page.getByText(/approved by our team/i)).toBeVisible();
  });
});
