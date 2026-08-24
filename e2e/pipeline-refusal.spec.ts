import { test, expect, Page, Route } from '@playwright/test';

/**
 * A refused pipeline transition says why (#242).
 *
 * PipelineService blocks progression past Background Check until every required check is COMPLETED
 * and CLEAR, and explains which are outstanding. The controller answered `badRequest().build()` —
 * an empty body — so the board could only report "Failed to move candidate: HTTP 400", and a
 * governance control that presents as an unexplained error reads as a bug.
 *
 * `refusalMessage` is unit-tested against both server shapes. What is not covered anywhere is
 * whether that sentence survives the trip to the screen, which is what these drive.
 */

const APPLICATION = {
  id: 'a1',
  applicantName: 'Thandi Molefe',
  jobTitle: 'Senior Developer',
  department: 'Technology',
  status: 'BACKGROUND_CHECK',
  pipelineStage: 'BACKGROUND_CHECK',
  submittedAt: '2026-08-01T00:00:00',
  rating: 4,
  applicant: { firstName: 'Thandi', lastName: 'Molefe', email: 'thandi@example.com' },
};

const REFUSAL =
  'Cannot progress past Background Check stage. The following required verification checks are ' +
  'not completed with CLEAR result: CRIMINAL_RECORD';

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function stubApi(
  page: Page,
  move: { status: number; body: unknown },
) {
  await page.addInitScript(() => {
    sessionStorage.setItem('jwt_token', 'e2e-token');
    sessionStorage.setItem('mock_user', JSON.stringify({
      id: 'e2e', name: 'E2E Admin', email: 'admin@example.com', role: 'ADMIN',
      permissions: ['view_dashboard', 'manage_pipeline', 'view_applications', 'view_applicants'],
      tenantId: 'default',
    }));
  });

  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname;

    if (path.includes('/api/pipeline/applications/') && path.endsWith('/move')) {
      return json(route, move.body, move.status);
    }
    if (path === '/api/applications/manage/search') {
      return json(route, { content: [APPLICATION] });
    }
    return json(route, {});
  });
}

/** Opens the candidate detail panel and asks to advance them. */
async function attemptAdvance(page: Page) {
  await page.getByText('Thandi Molefe').first().click();
  await page.getByRole('button', { name: /Move to|Next/i }).first().click();
  await page.getByRole('button', { name: 'Move', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  test.slow();
  page.setDefaultNavigationTimeout(90_000);
  await page.setViewportSize({ width: 1600, height: 1000 });
});

test.describe('Pipeline — a refusal reaches the user', () => {
  test('shows the sentence the API sent, not the status code', async ({ page }) => {
    // ErrorResponse shape: controllers answer with { message }.
    await stubApi(page, { status: 400, body: { message: REFUSAL, timestamp: 1756000000000 } });
    await page.goto('/pipeline');
    await attemptAdvance(page);

    await expect(page.getByText(/CRIMINAL_RECORD/)).toBeVisible();
    await expect(page.getByText(/HTTP 400/)).toHaveCount(0);
  });

  test('reads the global handler shape too', async ({ page }) => {
    // The other live shape: { error, message } from the global exception handler.
    await stubApi(page, {
      status: 400,
      body: {
        error: 'Not permitted in the current state',
        message: 'Cannot move application from HIRED to FIRST_INTERVIEW',
        timestamp: '2026-08-24T10:00:00',
      },
    });
    await page.goto('/pipeline');
    await attemptAdvance(page);

    await expect(page.getByText(/Cannot move application from HIRED/)).toBeVisible();
  });

  test('a refusal is never reported as a server fault', async ({ page }) => {
    // Reject and withdraw used to miss IllegalStateException entirely and come back as a 500 —
    // the server reporting itself broken for having enforced a rule.
    await stubApi(page, { status: 400, body: { message: REFUSAL } });
    await page.goto('/pipeline');
    await attemptAdvance(page);

    await expect(page.getByText(/CRIMINAL_RECORD/)).toBeVisible();
    await expect(page.getByText(/500|Internal Server Error/i)).toHaveCount(0);
  });

  test('an allowed move still succeeds', async ({ page }) => {
    await stubApi(page, { status: 200, body: { success: true } });
    await page.goto('/pipeline');
    await attemptAdvance(page);

    await expect(page.getByText(/Stage transition saved/i)).toBeVisible();
  });
});
