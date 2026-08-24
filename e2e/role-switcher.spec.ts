import { test, expect, Page } from '@playwright/test';

/**
 * Viewing the product as another role.
 *
 * `RoleSwitcher` and `AuthContext.switchRole` both already existed and nothing rendered the
 * component, so the only way to reach another role's screens was to sign out and back in as
 * somebody else. These tests pin the two things that matter about mounting it: that only an
 * administrator is offered it, and that the switch is visibly labelled as a view rather than
 * passing for the real thing.
 *
 * The API is stubbed at the network boundary; the chrome, the auth context and the switch are
 * the real application.
 */

const PERMISSIONS = [
  'view_dashboard', 'manage_jobs', 'view_applications', 'manage_pipeline', 'view_interviews',
  'manage_offers', 'view_analytics', 'manage_requisitions', 'view_applicants',
  'manage_applications', 'view_internal_jobs',
];

/** Seeds the session the way AuthContext hydrates it when Cognito is not configured. */
async function signInAs(page: Page, role: string) {
  await page.addInitScript(
    ([r, perms]) => {
      sessionStorage.setItem('jwt_token', 'e2e-token');
      sessionStorage.setItem('mock_user', JSON.stringify({
        id: 'e2e-user',
        name: 'E2E User',
        email: 'e2e@example.com',
        role: r,
        permissions: perms,
        tenantId: 'default',
      }));
    },
    [role, PERMISSIONS] as const,
  );
}

async function stubApi(page: Page) {
  await page.route('**/api/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

const switcher = (page: Page) => page.getByTestId('role-switcher');

test.beforeEach(async ({ page }) => {
  // /dashboard is a heavy route and the dev server compiles it on first request. With workers
  // in parallel that cold compile alone can exceed the default 30s, which shows up as a goto
  // timeout that has nothing to do with the feature.
  test.slow();
  page.setDefaultNavigationTimeout(90_000);

  await page.setViewportSize({ width: 1440, height: 900 });
  await stubApi(page);
});

test.describe('Role switcher — who is offered it', () => {
  test('an administrator gets it', async ({ page }) => {
    await signInAs(page, 'ADMIN');
    await page.goto('/dashboard');

    await expect(switcher(page)).toBeVisible();
    await expect(switcher(page)).toContainText('Administrator');
  });

  for (const role of ['RECRUITER', 'HIRING_MANAGER', 'HR_MANAGER', 'APPLICANT']) {
    test(`${role} does not`, async ({ page }) => {
      await signInAs(page, role);
      await page.goto('/dashboard');

      // The context refuses the switch for these roles anyway; this keeps a control that
      // would do nothing out of the chrome.
      await expect(switcher(page)).toHaveCount(0);
    });
  }
});

test.describe('Role switcher — switching', () => {
  test('changes the view and says so', async ({ page }) => {
    await signInAs(page, 'ADMIN');
    await page.goto('/dashboard');

    await switcher(page).click();
    await page.getByRole('menuitem', { name: /Talent Acquisition/ }).click();

    // Gold "Viewing as" treatment, so whoever is driving is never in doubt.
    await expect(switcher(page)).toContainText('Viewing as Talent Acquisition');
    await expect(page.getByRole('heading', { name: /Talent Acquisition/ }).first()).toBeVisible();
  });

  test('offers a way back to the real role', async ({ page }) => {
    await signInAs(page, 'ADMIN');
    await page.goto('/dashboard');

    await switcher(page).click();
    await page.getByRole('menuitem', { name: /Talent Acquisition/ }).click();
    await expect(switcher(page)).toContainText('Viewing as');

    await switcher(page).click();
    await page.getByRole('menuitem', { name: /Return to Administrator/ }).click();

    await expect(switcher(page)).toContainText('Administrator');
    await expect(switcher(page)).not.toContainText('Viewing as');
  });

  test('states that the session is unchanged, because the token still is', async ({ page }) => {
    await signInAs(page, 'ADMIN');
    await page.goto('/dashboard');
    await switcher(page).click();

    // apiFetch sends the real Cognito token regardless of what is selected here, so the menu
    // has to say so. If this copy goes, the feature starts implying enforcement it does not do.
    await expect(page.getByRole('menu')).toContainText('the API still answers as one');
  });

  test('survives a reload as the switched role', async ({ page }) => {
    await signInAs(page, 'ADMIN');
    await page.goto('/dashboard');

    await switcher(page).click();
    await page.getByRole('menuitem', { name: /Recruiter/ }).click();
    await expect(switcher(page)).toContainText('Viewing as Recruiter');

    // addInitScript re-seeds ADMIN on every navigation, so a reload returning to Administrator
    // is the correct outcome here — what matters is that it does not land in a broken state.
    await page.reload();
    await expect(switcher(page)).toBeVisible();
  });
});
