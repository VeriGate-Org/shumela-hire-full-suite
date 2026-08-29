import { test, expect, Page, Route } from '@playwright/test';

/**
 * The internal application page, in a real browser.
 *
 * The page's whole job is to show an employee what they are applying for and what it would move
 * them from. None of that came from the component before — it fetched neither the requisition nor
 * the employee — so these tests assert the *rendered move*, not just that a form exists.
 *
 * The second thing they pin down is graceful degradation. `/api/requisitions/**` is closed to the
 * EMPLOYEE role in SecurityConfig, and there is no "my employee record" endpoint, so a 403 or a
 * missing employee id is the ordinary case for exactly the people this page serves. Every one of
 * those failures must leave a submittable form behind.
 */

const REQUISITION_ID = 'req-2026-0184';
const JOB_AD_ID = 'a7f3c2e1-0000-4000-8000-000000000042';
const EMPLOYEE_ID = 'emp-4471';

const REQUISITION = {
  id: REQUISITION_ID,
  jobTitle: 'Senior Software Engineer',
  department: 'Technology',
  location: 'Sandton',
  employmentType: 'FULL_TIME',
  salaryMin: 780000,
  salaryMax: 950000,
  status: 'APPROVED',
};

const JOB_AD = {
  id: JOB_AD_ID,
  requisitionId: REQUISITION_ID,
  title: 'Senior Software Engineer',
  department: 'Technology',
  location: 'Sandton',
  employmentType: 'FULL_TIME',
  salaryRangeMin: 780000,
  salaryRangeMax: 950000,
  closingDate: '2099-09-26',
  status: 'PUBLISHED',
};

const EMPLOYEE = {
  id: EMPLOYEE_ID,
  fullName: 'Thandi Molefe',
  employeeNumber: 'IDC-4471',
  jobTitle: 'Software Engineer',
  department: 'Technology',
  jobGrade: 'P3',
  hireDate: '2023-06-01',
  reportingManagerName: 'Nomsa Khumalo',
};

/**
 * Seeds the session the way AuthContext hydrates it. Local dev has no Cognito configured, so
 * `checkMockSession()` reads these two keys straight out of sessionStorage.
 */
async function signIn(page: Page, opts: { employeeId?: string | null } = {}) {
  const employeeId = opts.employeeId === undefined ? EMPLOYEE_ID : opts.employeeId;
  await page.addInitScript(
    (empId) => {
      sessionStorage.setItem('jwt_token', 'e2e-token');
      sessionStorage.setItem(
        'mock_user',
        JSON.stringify({
          id: 'e2e-user',
          ...(empId ? { employeeId: empId } : {}),
          name: 'Thandi Molefe',
          email: 'thandi.molefe@idc.co.za',
          role: 'EMPLOYEE',
          permissions: ['view_dashboard'],
          tenantId: 'default',
        }),
      );
    },
    employeeId,
  );
}

interface Captured {
  /** Bodies of every POST to /api/applications, in order. */
  submissions: Array<{ url: string; body: Record<string, unknown> }>;
}

/**
 * Stubs the API at the network boundary. `requisitionStatus` / `employeeStatus` let a test choose
 * how the backend refuses without changing anything above the wire.
 */
async function stubApi(
  page: Page,
  opts: {
    requisitionStatus?: number;
    employeeStatus?: number;
    submitStatus?: number;
    submitBody?: unknown;
  } = {},
): Promise<Captured> {
  const captured: Captured = { submissions: [] };

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === 'POST' && path === '/api/applications') {
      captured.submissions.push({
        url: path,
        body: JSON.parse(route.request().postData() ?? '{}'),
      });
      return json(
        route,
        opts.submitBody ?? { id: 'APP-2026-1180', status: 'SUBMITTED', statusDisplayName: 'Submitted' },
        opts.submitStatus ?? 201,
      );
    }

    if (path.startsWith('/api/requisitions/')) {
      const status = opts.requisitionStatus ?? 200;
      return status === 200 ? json(route, REQUISITION) : json(route, { error: 'Access Denied' }, status);
    }

    if (path.startsWith('/api/ads/')) return json(route, JOB_AD);

    if (path.startsWith('/api/employees/')) {
      const status = opts.employeeStatus ?? 200;
      return status === 200 ? json(route, EMPLOYEE) : json(route, { error: 'Not found' }, status);
    }

    return json(route, {});
  });

  return captured;
}

const applyUrl = (extra = '') => `/internal/apply/${REQUISITION_ID}?jobId=${JOB_AD_ID}${extra}`;

const why = (page: Page) => page.getByLabel(/why this (move|role)/i);
const submit = (page: Page) => page.getByRole('button', { name: /submit application/i });
/** The facts strip is a <dl>; scoping to it keeps assertions off the header's copy of the same words. */
const facts = (page: Page) => page.locator('dl').first();
/** The form's own error box, as distinct from the transient toast that carries the same words. */
const formError = (page: Page) => page.locator('[role="alert"]', { hasText: 'Application not submitted' });
/**
 * The band's own eyebrow.
 *
 * <p>IdentityBand publishes its eyebrow to the top bar, which renders it as the breadcrumb — so on
 * every one of the 144 band screens that word is on the page twice, by design. An unscoped
 * getByText for it is a strict-mode violation rather than a missing element, which is what these
 * two assertions became when this page gained the standard header.
 */
const eyebrow = (page: Page, text: string) => page.getByRole('main').getByText(text, { exact: true });

test.describe('Internal application — the page shows the move', () => {
  test('both sides of the move are on the page', async ({ page }) => {
    await signIn(page);
    await stubApi(page);
    await page.goto(applyUrl());

    await expect(eyebrow(page, 'Internal move')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Senior Software Engineer', level: 1 })).toBeVisible();

    // Left: where they are now, off the employee record.
    await expect(page.getByText('You are here')).toBeVisible();
    await expect(page.getByText('Software Engineer', { exact: true })).toBeVisible();
    await expect(page.getByText('P3')).toBeVisible();
    await expect(page.getByText(/Reports to/)).toBeVisible();
    await expect(page.getByText('Nomsa Khumalo', { exact: true })).toBeVisible();

    // Right: where they are asking to go.
    await expect(page.getByText('Applying for')).toBeVisible();
  });

  test('the requisition is named and the job facts render', async ({ page }) => {
    await signIn(page);
    await stubApi(page);
    await page.goto(applyUrl());

    await expect(page.getByText(new RegExp(`Requisition ${REQUISITION_ID}`, 'i'))).toBeVisible();
    await expect(facts(page).getByText('Employment type')).toBeVisible();
    await expect(facts(page).getByText('Full-time', { exact: true })).toBeVisible();
    await expect(facts(page).getByText('Salary band')).toBeVisible();
    await expect(facts(page).getByText(/780\s?000/)).toBeVisible();
    await expect(facts(page).getByText('Sandton', { exact: true })).toBeVisible();
    await expect(facts(page).getByText('Applications close')).toBeVisible();
    await expect(facts(page).getByText(/26 Sep(t)?\.? 2099/)).toBeVisible();
  });

  test('the manager notice is kept, and the policy promise is not made', async ({ page }) => {
    await signIn(page);
    await stubApi(page);
    await page.goto(applyUrl());

    await expect(page.getByText(/Your current manager is not notified by ShumelaHire/i)).toBeVisible();
    // A product cannot promise this, so it must not be on the page.
    await expect(page.getByText(/does not affect your current role/i)).toHaveCount(0);
  });

  test('the three claims the product does not deliver are gone', async ({ page }) => {
    await signIn(page);
    await stubApi(page);
    await page.goto(applyUrl());

    await expect(page.getByText(/Internal Application Advantages/i)).toHaveCount(0);
    await expect(page.getByText(/Priority Review/i)).toHaveCount(0);
    await expect(page.getByText(/Known Performance/i)).toHaveCount(0);
    await expect(page.getByText(/Faster Process/i)).toHaveCount(0);
  });
});

test.describe('Internal application — the external variant', () => {
  test('shows only the target side and no manager notice', async ({ page }) => {
    await signIn(page, { employeeId: null });
    await stubApi(page);
    await page.goto(applyUrl('&source=external'));

    await expect(eyebrow(page, 'Application')).toBeVisible();
    await expect(page.getByText('Applying for')).toBeVisible();
    await expect(page.getByText('You are here')).toHaveCount(0);
    await expect(page.getByText(/Your current manager is not notified/i)).toHaveCount(0);
    await expect(why(page)).toBeVisible();
  });

  test('never asks for an employee record', async ({ page }) => {
    const employeeReads: string[] = [];
    await signIn(page);
    await page.route('**/api/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.startsWith('/api/employees/')) employeeReads.push(path);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(JOB_AD) });
    });
    await page.goto(applyUrl('&source=external'));

    await expect(page.getByText('Applying for')).toBeVisible();
    expect(employeeReads).toHaveLength(0);
  });
});

test.describe('Internal application — the reads that are allowed to fail', () => {
  test('a refused requisition still leaves a submittable form', async ({ page }) => {
    await signIn(page);
    const captured = await stubApi(page, { requisitionStatus: 403 });
    await page.goto(applyUrl());

    // The advert carries the same facts, so the page is still complete.
    await expect(page.getByRole('heading', { name: 'Senior Software Engineer', level: 1 })).toBeVisible();
    await expect(facts(page).getByText('Sandton', { exact: true })).toBeVisible();

    await why(page).fill('I want to own the design of the payments platform.');
    await submit(page).click();
    await expect.poll(() => captured.submissions.length).toBe(1);
  });

  test('a missing employee record hides the "you are here" side rather than showing blanks', async ({ page }) => {
    await signIn(page);
    const captured = await stubApi(page, { employeeStatus: 404 });
    await page.goto(applyUrl());

    await expect(page.getByText('Applying for')).toBeVisible();
    await expect(page.getByText('You are here')).toHaveCount(0);
    // The notice survives, because it is true whether or not we know who the manager is.
    await expect(page.getByText(/Your current manager is not notified/i)).toBeVisible();

    await why(page).fill('I want to own the design of the payments platform.');
    await submit(page).click();
    await expect.poll(() => captured.submissions.length).toBe(1);
  });

  test('no employee id on the session means no lookup and no blank side', async ({ page }) => {
    await signIn(page, { employeeId: null });
    await stubApi(page);
    await page.goto(applyUrl());

    await expect(page.getByText('Applying for')).toBeVisible();
    await expect(page.getByText('You are here')).toHaveCount(0);
  });
});

test.describe('Internal application — validation stops the request leaving the browser', () => {
  test('an empty "why this move" means no POST', async ({ page }) => {
    await signIn(page);
    const captured = await stubApi(page);
    await page.goto(applyUrl());

    await submit(page).click();

    await expect(formError(page)).toContainText(/why this move/i);
    expect(captured.submissions).toHaveLength(0);
  });
});

test.describe('Internal application — the submit journey emits the right request', () => {
  test('posts the expected payload to /api/applications', async ({ page }) => {
    await signIn(page);
    const captured = await stubApi(page);
    await page.goto(applyUrl());

    await page.getByLabel(/when could you start/i).fill('2026-11-02');
    await why(page).fill('I want to own the design of the payments platform.');
    await page.getByLabel(/what you bring to it/i).fill('Led the migration off the legacy ledger.');
    await submit(page).click();

    await expect.poll(() => captured.submissions.length).toBe(1);

    const { url, body } = captured.submissions[0];
    expect(url).toBe('/api/applications');
    expect(body).toMatchObject({
      jobAdId: JOB_AD_ID,
      applicationSource: 'INTERNAL',
      availabilityDate: '2026-11-02',
      coverLetter:
        'I want to own the design of the payments platform.\n\nLed the migration off the legacy ledger.',
    });
    // jobAdId is a String UUID on the backend; Number() coercion would send null.
    expect(typeof body.jobAdId).toBe('string');
  });

  test('the external variant is marked as such', async ({ page }) => {
    await signIn(page, { employeeId: null });
    const captured = await stubApi(page);
    await page.goto(applyUrl('&source=external'));

    await why(page).fill('I have spent six years building payment systems.');
    await submit(page).click();

    await expect.poll(() => captured.submissions.length).toBe(1);
    expect(captured.submissions[0].body.applicationSource).toBe('EXTERNAL');
  });

  test('a backend refusal is shown rather than swallowed', async ({ page }) => {
    await signIn(page);
    await stubApi(page, { submitStatus: 403, submitBody: { error: 'You have already applied for this job' } });
    await page.goto(applyUrl());

    await why(page).fill('I want to own the design of the payments platform.');
    await submit(page).click();

    await expect(formError(page)).toContainText(/already applied for this job/i);
    // Still on the form, with the answer intact.
    await expect(why(page)).toHaveValue('I want to own the design of the payments platform.');
  });
});

test.describe('Internal application — the submitted state', () => {
  test('says what was submitted, to whom, and carries the reference', async ({ page }) => {
    await signIn(page);
    await stubApi(page);
    await page.goto(applyUrl());

    await page.getByLabel(/when could you start/i).fill('2026-11-02');
    await why(page).fill('I want to own the design of the payments platform.');
    await submit(page).click();

    await expect(page.getByRole('heading', { name: /your application is in/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/Submitted for/)).toBeVisible();
    await expect(facts(page).getByText('Reference')).toBeVisible();
    await expect(facts(page).getByText('APP-2026-1180')).toBeVisible();
    await expect(facts(page).getByText('Available from')).toBeVisible();
    await expect(facts(page).getByText(/2 Nov 2026/)).toBeVisible();
    await expect(facts(page).getByText('Status')).toBeVisible();
    await expect(page.getByRole('link', { name: /track my application/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /back to internal jobs/i })).toBeVisible();
    // The manager conversation is still outstanding, and the page says so by name.
    await expect(page.getByText(/Nomsa Khumalo has not been told/i)).toBeVisible();
  });

  test('the external confirmation does not raise a manager the applicant does not have', async ({ page }) => {
    await signIn(page, { employeeId: null });
    await stubApi(page);
    await page.goto(applyUrl('&source=external'));

    await why(page).fill('I have spent six years building payment systems.');
    await submit(page).click();

    await expect(page.getByRole('heading', { name: /your application is in/i, level: 1 })).toBeVisible();
    await expect(page.getByText(/has not been told/i)).toHaveCount(0);
  });
});
