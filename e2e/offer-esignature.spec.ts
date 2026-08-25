import { test, expect, Page, Route } from '@playwright/test';

/**
 * Offer e-signature (#241).
 *
 * DocuSign was the only provider and no environment supplied credentials, so every send posted an
 * envelope with an empty account id and was rejected. A simulated provider is now the default, and
 * `loadESignStatuses` no longer skips AWAITING_SIGNATURE — which had hidden the badge and the
 * download button on exactly the offers that had an envelope.
 *
 * Both of those are states of the offers list, so this drives the list and asserts what it shows.
 */

const OFFER = (over: Record<string, unknown> = {}) => ({
  id: 1,
  offerNumber: 'OFF-001',
  version: 1,
  status: 'SENT',
  offerType: 'FULL_TIME_PERMANENT',
  negotiationStatus: 'NOT_STARTED',
  jobTitle: 'Senior Developer',
  department: 'Technology',
  baseSalary: 750000,
  currency: 'ZAR',
  totalCompensation: 750000,
  startDate: '2026-10-01',
  offerExpiryDate: '2026-12-01T00:00:00',
  negotiationRounds: 0,
  application: {
    id: 11,
    applicant: { firstName: 'Thandi', lastName: 'Molefe', email: 'thandi@example.com' },
    jobPosting: { title: 'Senior Developer', department: 'Technology' },
  },
  createdAt: '2026-08-01T00:00:00',
  createdBy: 1,
  ...over,
});

interface Captured {
  sends: string[];
}

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function stubApi(
  page: Page,
  opts: {
    offers?: Array<Record<string, unknown>>;
    /** Per-offer e-signature status, keyed by offer id. */
    statuses?: Record<number, { status: string; envelopeId?: string }>;
    simulated?: boolean;
  } = {},
): Promise<Captured> {
  const captured: Captured = { sends: [] };
  const offers = opts.offers ?? [OFFER()];
  const statuses = opts.statuses ?? {};

  await page.addInitScript(() => {
    sessionStorage.setItem('jwt_token', 'e2e-token');
    sessionStorage.setItem('mock_user', JSON.stringify({
      id: 'e2e', name: 'E2E Admin', email: 'admin@example.com', role: 'ADMIN',
      permissions: ['view_dashboard', 'manage_offers'], tenantId: 'default',
    }));
  });

  await page.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === '/api/esignature/provider') {
      return json(route, { provider: opts.simulated === false ? 'docusign' : 'local', simulated: opts.simulated !== false });
    }
    const statusMatch = path.match(/^\/api\/esignature\/offers\/(\d+)\/status$/);
    if (statusMatch) {
      const found = statuses[Number(statusMatch[1])];
      return found ? json(route, found) : json(route, { status: 'not_sent' });
    }
    const sendMatch = path.match(/^\/api\/esignature\/offers\/(\d+)\/send$/);
    if (sendMatch && route.request().method() === 'POST') {
      captured.sends.push(path);
      return json(route, { envelopeId: 'SIM-abc123', status: 'sent' });
    }

    if (path === '/api/offers/search') return json(route, { content: offers, totalPages: 1 });
    // NB the queue chip is "Out with candidate", not "Sent". The offers redesign renamed it and
    // widened what it selects: WITH_CANDIDATE is ['SENT','AWAITING_SIGNATURE','SIGNED',
    // 'UNDER_NEGOTIATION'] (src/components/offers/queue.ts), because counting SENT alone omitted
    // exactly the offers most likely to lapse — a signature or a negotiation is what consumes the
    // time. These tests assert that an AWAITING_SIGNATURE or SIGNED offer stays visible there, so
    // the rename left their meaning intact and only their selector wrong.
    //
    // The list also opens on "Expiring", which matches none of these fixtures — hence the explicit
    // chip click in each test rather than a reliance on whatever the queue opens on.
    if (path === '/api/offers/dashboard') return json(route, {});

    // The queue header counts from this, separately from the rows it lists. Unstubbed it fell
    // through and the page banner-ed "Counts are unavailable — the summary could not be loaded".
    if (path === '/api/offers/summary') {
      return json(route, { total: offers.length, withCandidate: offers.length, expiringSoon: 0, expiringImminently: 0 });
    }
    return json(route, {});
  });

  return captured;
}

test.beforeEach(async ({ page }) => {
  test.slow();
  page.setDefaultNavigationTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
});

test.describe('Offer e-signature — the offer stays visible', () => {
  // Every tab filters by status. AWAITING_SIGNATURE and SIGNED were in none of them, so sending
  // an offer for signature made it vanish from the board — #241 fixed the badge on offers that
  // could not be seen.
  for (const status of ['AWAITING_SIGNATURE', 'SIGNED']) {
    test(`an offer in ${status} still appears under Out with candidate`, async ({ page }) => {
      await stubApi(page, {
        offers: [OFFER({ status })],
        statuses: { 1: { status: 'sent', envelopeId: 'SIM-abc123' } },
      });
      await page.goto('/offers');
      await page.getByRole('button', { name: /^Out with candidate/ }).click();

      await expect(page.getByText('Thandi Molefe')).toBeVisible();
    });
  }
});

test.describe('Offer e-signature — the badge', () => {
  test('shows for an offer awaiting signature', async ({ page }) => {
    // The regression: AWAITING_SIGNATURE was filtered out of the status lookup, so an offer
    // with a live envelope displayed nothing at all.
    await stubApi(page, {
      offers: [OFFER({ status: 'AWAITING_SIGNATURE' })],
      statuses: { 1: { status: 'sent', envelopeId: 'SIM-abc123' } },
    });
    await page.goto('/offers');
    await page.getByRole('button', { name: /^Out with candidate/ }).click();

    await expect(page.getByText(/E-Signature: sent/i)).toBeVisible();
  });

  test('marks a simulated signature as simulated', async ({ page }) => {
    // The provider is not legally binding, so it must never present as though it were.
    await stubApi(page, {
      offers: [OFFER({ status: 'AWAITING_SIGNATURE' })],
      statuses: { 1: { status: 'sent', envelopeId: 'SIM-abc123' } },
      simulated: true,
    });
    await page.goto('/offers');
    await page.getByRole('button', { name: /^Out with candidate/ }).click();

    await expect(page.getByText(/simulated/i).first()).toBeVisible();
  });

  test('stays absent when nothing has been sent', async ({ page }) => {
    await stubApi(page, { offers: [OFFER({ status: 'SENT' })], statuses: { 1: { status: 'not_sent' } } });
    await page.goto('/offers');
    await page.getByRole('button', { name: /^Out with candidate/ }).click();

    await expect(page.getByText(/E-Signature:/i)).toHaveCount(0);
  });
});

test.describe('Offer e-signature — sending', () => {
  test('an unsent offer can be sent for signature', async ({ page }) => {
    const captured = await stubApi(page, {
      offers: [OFFER({ status: 'SENT' })],
      statuses: { 1: { status: 'not_sent' } },
    });
    await page.goto('/offers');
    await page.getByRole('button', { name: /^Out with candidate/ }).click();

    await page.getByRole('button', { name: 'E-Sign', exact: true }).click();

    // A confirmation modal stands between the button and the call.
    await expect(page.getByRole('heading', { name: /Send for E-Signature/i })).toBeVisible();
    await page.getByRole('button', { name: /^Send/i }).last().click();

    await expect.poll(() => captured.sends.length, { timeout: 15_000 }).toBe(1);
    expect(captured.sends[0]).toBe('/api/esignature/offers/1/send');
  });

  test('a completed signature offers the signed document', async ({ page }) => {
    await stubApi(page, {
      offers: [OFFER({ status: 'ACCEPTED' })],
      statuses: { 1: { status: 'completed', envelopeId: 'SIM-abc123' } },
    });
    await page.goto('/offers');
    await page.getByRole('button', { name: /^Accepted/ }).click();

    await expect(page.getByRole('button', { name: /Download/i }).first()).toBeVisible();
  });
});
