import { test, expect, Page, Route } from '@playwright/test';

/**
 * The requisition audit trail (#244).
 *
 * The Audit Log tab had never shown a row to anyone. Two faults compounded: `/api/audit/**` was
 * restricted to ADMIN and HR_MANAGER in both security configs while the controller declared
 * RECRUITER and HIRING_MANAGER too — the URL rule wins, so the people who work requisitions got a
 * 403 the screen reported as "Failed to fetch audit logs" — and once an admin did reach it,
 * RequisitionService had never written a single REQUISITION entry.
 *
 * The authorisation half is pinned server-side by AuditAuthorisationTest. This covers the half
 * that only a browser sees: that the trail is reachable, renders entries, and reports a refusal
 * as a refusal.
 */

const REQUISITION = {
  id: 'r1',
  title: 'Senior Developer',
  department: 'Technology',
  status: 'APPROVED',
  positions: 1,
  createdAt: '2026-08-01T00:00:00',
};

const AUDIT_ENTRIES = [
  {
    id: 'a1',
    action: 'REQUISITION_APPROVED',
    entityType: 'REQUISITION',
    entityId: 'r1',
    userId: 'thandi.molefe',
    userRole: 'HR_MANAGER',
    details: 'Requisition approved at level 1',
    timestamp: '2026-08-20T09:15:00',
  },
  {
    id: 'a2',
    action: 'REQUISITION_SUBMITTED',
    entityType: 'REQUISITION',
    entityId: 'r1',
    userId: 'sipho.dlamini',
    userRole: 'HIRING_MANAGER',
    details: 'Submitted for approval',
    timestamp: '2026-08-19T14:02:00',
  },
];

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function stubApi(
  page: Page,
  audit: { status: number; body: unknown } = { status: 200, body: AUDIT_ENTRIES },
) {
  await page.addInitScript(() => {
    sessionStorage.setItem('jwt_token', 'e2e-token');
    sessionStorage.setItem('mock_user', JSON.stringify({
      id: 'e2e', name: 'E2E Admin', email: 'admin@example.com', role: 'ADMIN',
      permissions: ['view_dashboard', 'manage_requisitions', 'view_audit_logs'],
      tenantId: 'default',
    }));
  });

  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname;

    // The narrower GET rule #244 added: per-record lookup, open to the roles that work
    // requisitions, while the tenant-wide trail stays administrative.
    if (path.startsWith('/api/audit/entity/REQUISITION/')) {
      return json(route, audit.body, audit.status);
    }
    if (path.startsWith('/api/requisitions/')) return json(route, REQUISITION);
    return json(route, {});
  });
}

/**
 * Open the full audit trail.
 *
 * <p>This used to be a tab. The requisition detail page no longer has tabs: the approval trail is
 * on the page rather than behind one, and the full audit log — which is the administrative view of
 * the same events — sits behind a disclosure under it. Every assertion below is unchanged; only the
 * way the trail is reached has moved.
 */
async function openAuditLog(page: Page) {
  await page.goto('/requisitions/r1');
  await page.getByRole('button', { name: /show full audit log/i }).click();
}

test.beforeEach(async ({ page }) => {
  test.slow();
  page.setDefaultNavigationTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test.describe('Requisition audit trail', () => {
  test('the audit log is reachable and lists the entries', async ({ page }) => {
    await stubApi(page);
    await openAuditLog(page);

    await expect(page.getByText(/requisition approved/i).first()).toBeVisible();
    await expect(page.getByText(/requisition submitted/i).first()).toBeVisible();
  });

  test('it reads the per-record endpoint, not the tenant-wide trail', async ({ page }) => {
    const requested: string[] = [];
    await page.addInitScript(() => {
      sessionStorage.setItem('jwt_token', 'e2e-token');
      sessionStorage.setItem('mock_user', JSON.stringify({
        id: 'e2e', name: 'E2E Admin', email: 'admin@example.com', role: 'ADMIN',
        permissions: ['view_dashboard', 'manage_requisitions', 'view_audit_logs'],
        tenantId: 'default',
      }));
    });
    await page.route('**/api/**', (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.startsWith('/api/audit')) requested.push(path);
      if (path.startsWith('/api/audit/entity/REQUISITION/')) return json(route, AUDIT_ENTRIES);
      if (path.startsWith('/api/requisitions/')) return json(route, REQUISITION);
      return json(route, {});
    });

    await openAuditLog(page);
    await expect(page.getByText(/requisition approved/i).first()).toBeVisible();

    // A recruiter must not be able to read the whole tenant's trail, so the screen must never
    // reach for /audit/all.
    expect(requested.some((p) => p.startsWith('/api/audit/entity/REQUISITION/'))).toBe(true);
    expect(requested.some((p) => p.includes('/audit/all'))).toBe(false);
  });

  test('names who did what, and in which role', async ({ page }) => {
    await stubApi(page);
    await openAuditLog(page);

    await expect(page.getByText('thandi.molefe')).toBeVisible();
    await expect(page.getByText('HR_MANAGER')).toBeVisible();
    await expect(page.getByText(/Requisition approved at level 1/)).toBeVisible();
  });

  test('an empty trail says so rather than looking broken', async ({ page }) => {
    await stubApi(page, { status: 200, body: [] });
    await openAuditLog(page);

    await expect(page.getByText(/No audit logs found for this requisition/i)).toBeVisible();
  });

  test('a refusal is reported as a refusal', async ({ page }) => {
    // What a hiring manager used to get on every requisition, before the URL rule was narrowed.
    await stubApi(page, { status: 403, body: { message: 'Access denied' } });
    await openAuditLog(page);

    await expect(page.getByText(/403|denied|Failed to fetch audit logs/i).first()).toBeVisible();
  });
});
