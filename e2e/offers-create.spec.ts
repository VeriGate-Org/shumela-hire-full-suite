import { test, expect, Page, Route } from '@playwright/test';

/**
 * The create-offer journey, in a real browser.
 *
 * Worth having because of how this feature failed. `POST /api/offers/applications/{id}` existed,
 * compiled and was correctly secured, but nothing called it and — once something did — it rejected
 * every request on bean validation (#237). Type checks, linting, the static build and a component
 * test with a mocked fetch all passed throughout. What none of them covered was the span from a
 * real click to a real outgoing request.
 *
 * So these tests assert the *request the browser actually emits*, not just what renders. The API is
 * stubbed at the network boundary: everything above it — routing, hydration, the auth context, the
 * form, the deep link — is the real application.
 */

const APPLICATION = {
  id: 'a7f3c2e1-0000-4000-8000-000000000001',
  jobTitle: 'Senior Developer',
  department: 'Technology',
  status: 'OFFER_PENDING',
  applicant: { firstName: 'Thandi', lastName: 'Molefe', email: 'thandi@example.com' },
};

/** Only what the offers page reads; the component gates on role alone. */
const PERMISSIONS_BY_ROLE: Record<string, string[]> = {
  ADMIN: ['view_dashboard', 'manage_offers', 'view_applications', 'manage_pipeline'],
  HR_MANAGER: ['view_dashboard', 'manage_offers', 'view_applications', 'manage_pipeline'],
  HIRING_MANAGER: ['view_dashboard', 'manage_offers', 'view_applications', 'manage_pipeline'],
  RECRUITER: ['view_dashboard', 'view_applications', 'manage_pipeline'],
};

/**
 * Seeds the session the way AuthContext hydrates it. Local dev has no Cognito configured, so
 * `checkMockSession()` reads these two keys straight out of sessionStorage.
 */
async function signInAs(page: Page, role: string) {
  await page.addInitScript(
    ([r, perms]) => {
      sessionStorage.setItem('jwt_token', 'e2e-token');
      sessionStorage.setItem(
        'mock_user',
        JSON.stringify({
          id: 'e2e-user',
          name: `E2E ${r}`,
          email: `e2e-${String(r).toLowerCase()}@example.com`,
          role: r,
          permissions: perms,
          tenantId: 'default',
        }),
      );
    },
    [role, PERMISSIONS_BY_ROLE[role] ?? []] as const,
  );
}

interface Captured {
  /** Bodies of every POST to the create endpoint, in order. */
  creates: Array<{ url: string; body: Record<string, unknown> }>;
  /** URLs of every eligible-application lookup. */
  applicationSearches: string[];
}

/**
 * Stubs the API at the network boundary. `createStatus`/`createBody` let a test choose how the
 * backend answers without changing anything above the wire.
 */
async function stubApi(
  page: Page,
  opts: {
    applications?: unknown[];
    createStatus?: number;
    createBody?: unknown;
  } = {},
): Promise<Captured> {
  const captured: Captured = { creates: [], applicationSearches: [] };
  const applications = opts.applications ?? [APPLICATION];

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === 'POST' && path.startsWith('/api/offers/applications/')) {
      captured.creates.push({
        url: path,
        body: JSON.parse(route.request().postData() ?? '{}'),
      });
      return json(route, opts.createBody ?? { id: 'offer-1', status: 'DRAFT' }, opts.createStatus ?? 201);
    }

    if (path === '/api/applications/manage/search') {
      captured.applicationSearches.push(url.search);
      return json(route, { content: applications });
    }

    if (path.startsWith('/api/applications/')) return json(route, APPLICATION);
    if (path === '/api/offers/search') return json(route, { content: [], totalPages: 0 });
    if (path === '/api/offers/dashboard') return json(route, {});

    return json(route, {});
  });

  return captured;
}

const newOfferButton = (page: Page) => page.getByRole('button', { name: /new offer/i });
const modal = (page: Page) => page.getByRole('heading', { name: /^new offer$/i });
const submit = (page: Page) => page.getByRole('button', { name: /create draft offer/i });

async function fillRequiredFields(page: Page) {
  await page.getByLabel(/candidate/i).selectOption(APPLICATION.id);
  await page.getByLabel(/base salary/i).fill('750000');
  await page.getByLabel(/start date/i).fill('2026-10-01');
}

test.describe('Offers — the create entry point exists', () => {
  for (const role of ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER']) {
    test(`${role} is offered a way to create an offer`, async ({ page }) => {
      await signInAs(page, role);
      await stubApi(page);
      await page.goto('/offers');

      await expect(newOfferButton(page)).toBeVisible();
    });
  }

  test('RECRUITER is refused offer management', async ({ page }) => {
    await signInAs(page, 'RECRUITER');
    await stubApi(page);
    await page.goto('/offers');

    await expect(page.getByText(/access denied/i)).toBeVisible();
    await expect(newOfferButton(page)).toHaveCount(0);
  });
});

test.describe('Offers — the create journey emits the right request', () => {
  test('a filled form posts to the application-scoped endpoint', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    const captured = await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await expect(modal(page)).toBeVisible();

    await fillRequiredFields(page);
    await page.getByLabel(/offer type/i).selectOption('CONTRACT_FIXED_TERM');
    await page.getByLabel(/signing bonus/i).fill('50000');
    await submit(page).click();

    await expect.poll(() => captured.creates.length).toBe(1);

    const { url, body } = captured.creates[0];
    expect(url).toBe(`/api/offers/applications/${APPLICATION.id}`);
    expect(body).toMatchObject({
      offerType: 'CONTRACT_FIXED_TERM',
      baseSalary: 750000,
      signingBonus: 50000,
      currency: 'ZAR',
      salaryFrequency: 'ANNUALLY',
      startDate: '2026-10-01',
    });
    // createOffer overwrites both from the application, so sending them would be a lie.
    expect(body).not.toHaveProperty('jobTitle');
    expect(body).not.toHaveProperty('department');
  });

  test('the modal closes and the list reloads on success', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await fillRequiredFields(page);
    await submit(page).click();

    await expect(modal(page)).toBeHidden();
    await expect(page.getByText(/submit it for approval/i)).toBeVisible();
  });

  test('baseSalary crosses the wire as a number', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    const captured = await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await fillRequiredFields(page);
    await submit(page).click();

    await expect.poll(() => captured.creates.length).toBe(1);
    expect(typeof captured.creates[0].body.baseSalary).toBe('number');
  });
});

test.describe('Offers — validation stops the request leaving the browser', () => {
  test('no base salary means no POST', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    const captured = await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await page.getByLabel(/candidate/i).selectOption(APPLICATION.id);
    await page.getByLabel(/start date/i).fill('2026-10-01');
    await submit(page).click();

    await expect(page.getByText(/base salary greater than zero/i)).toBeVisible();
    expect(captured.creates).toHaveLength(0);
  });

  test('no candidate means no POST', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    const captured = await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await page.getByLabel(/base salary/i).fill('750000');
    await submit(page).click();

    await expect(page.getByText(/select the candidate/i)).toBeVisible();
    expect(captured.creates).toHaveLength(0);
  });
});

test.describe('Offers — the candidate picker', () => {
  test('asks only for offer-eligible applications', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    const captured = await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await expect.poll(() => captured.applicationSearches.length).toBeGreaterThan(0);

    const statuses = new URLSearchParams(captured.applicationSearches[0]).getAll('statuses');
    expect(statuses.sort()).toEqual(['OFFERED', 'OFFER_PENDING', 'REFERENCE_CHECK']);
  });

  test('names the candidate rather than showing a bare id', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page);
    await page.goto('/offers');

    await newOfferButton(page).click();
    await expect(
      page.getByLabel(/candidate/i).getByRole('option', { name: /Thandi Molefe/ }),
    ).toHaveCount(1);
  });

  test('says what to do when nothing is at an offer-ready stage', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page, { applications: [] });
    await page.goto('/offers');

    await newOfferButton(page).click();
    await expect(page.getByText(/no candidates are at an offer-ready stage/i)).toBeVisible();
  });
});

test.describe('Offers — the deep link from the pipeline', () => {
  test('opens the modal preselected on the linked candidate', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page);
    await page.goto(`/offers?create=true&applicationId=${APPLICATION.id}`);

    await expect(modal(page)).toBeVisible();
    await expect(page.getByLabel(/candidate/i)).toHaveValue(APPLICATION.id);
  });

  test('clears the params so a reload does not reopen the modal', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page);
    await page.goto(`/offers?create=true&applicationId=${APPLICATION.id}`);

    await expect(modal(page)).toBeVisible();
    await expect.poll(() => new URL(page.url()).search).not.toContain('create=true');

    await page.reload();
    await expect(newOfferButton(page)).toBeVisible();
    await expect(modal(page)).toBeHidden();
  });

  test('the deep link is reachable end to end from a filled form', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    const captured = await stubApi(page);
    await page.goto(`/offers?create=true&applicationId=${APPLICATION.id}`);

    await expect(modal(page)).toBeVisible();
    await page.getByLabel(/base salary/i).fill('900000');
    await page.getByLabel(/start date/i).fill('2026-11-01');
    await submit(page).click();

    await expect.poll(() => captured.creates.length).toBe(1);
    expect(captured.creates[0].url).toBe(`/api/offers/applications/${APPLICATION.id}`);
  });
});

test.describe('Offers — backend refusals reach the user', () => {
  test('an ineligible application state is shown verbatim', async ({ page }) => {
    const reason = 'Cannot create offer for application in current state: INTERVIEW';
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page, { createStatus: 400, createBody: { error: reason } });
    await page.goto('/offers');

    await newOfferButton(page).click();
    await fillRequiredFields(page);
    await submit(page).click();

    await expect(page.getByText(reason)).toBeVisible();
  });

  /**
   * The #237 regression, at the layer that would have caught it: the real validation failure the
   * deployed API returned before the constraint was scoped to Offer.Persisted.
   */
  test('a bean-validation rejection does not fail silently', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page, {
      createStatus: 400,
      createBody: { error: 'Validation failed for argument [1] ... [Application is required]' },
    });
    await page.goto('/offers');

    await newOfferButton(page).click();
    await fillRequiredFields(page);
    await submit(page).click();

    await expect(page.getByText(/Application is required/)).toBeVisible();
    await expect(modal(page)).toBeVisible();
    await expect(page.getByLabel(/base salary/i)).toHaveValue('750000');
  });

  test('a 403 is explained rather than shown as a status code', async ({ page }) => {
    await signInAs(page, 'HIRING_MANAGER');
    await stubApi(page, { createStatus: 403, createBody: {} });
    await page.goto('/offers');

    await newOfferButton(page).click();
    await fillRequiredFields(page);
    await submit(page).click();

    await expect(page.getByText(/do not have permission/i)).toBeVisible();
  });
});
