import { test, expect, Page, Route } from '@playwright/test';

/**
 * The job posting approval and publishing record, in a real browser.
 *
 * The screen was redesigned around the five-stage workflow, so what it *says* about a posting is
 * now the feature: which stage it sits at, what is owed and by whom, and — for a published posting
 * only — how far it has reached. None of that is worth anything if the buttons stopped calling the
 * endpoints they called before, so every action here is asserted on the request the browser
 * actually emits, not on what renders after it.
 *
 * The API is stubbed at the network boundary; routing, hydration, the auth context and the
 * component are the real application.
 */

const PERMISSIONS = [
  'view_dashboard', 'manage_jobs', 'view_applications', 'manage_pipeline', 'view_interviews',
  'manage_offers', 'view_analytics', 'manage_requisitions', 'view_applicants',
  'manage_applications', 'view_internal_jobs',
];

const POSTING_ID = 'b4f1a9c2-0000-4000-8000-000000000042';

/** Everything the workflow screen reads. Field names match JobPostingResponse. */
const BASE_POSTING = {
  id: POSTING_ID,
  title: 'Senior Software Engineer',
  department: 'Technology',
  status: 'PENDING_APPROVAL',
  statusDisplayName: 'Pending Approval',
  statusCssClass: 'bg-gray-100 text-gray-800',
  statusIcon: 'clock',
  employmentType: 'FULL_TIME',
  employmentTypeDisplayName: 'Full-time permanent',
  experienceLevel: 'SENIOR',
  experienceLevelDisplayName: 'Senior · 8+ years',
  location: 'Sandton, Gauteng',
  salaryRange: 'R 780 000 – R 950 000',
  canBeEdited: false,
  canBeSubmittedForApproval: false,
  canBeApproved: true,
  canBeRejected: true,
  canBePublished: false,
  canBeUnpublished: false,
  canBeClosed: false,
  createdAt: '2026-08-01T09:14:00',
  submittedForApprovalAt: '2026-08-05T11:02:00',
  createdBy: 'Sipho Dlamini',
  daysFromCreation: 23,
  daysFromPublication: 0,
  applicationsCount: 0,
  viewsCount: 0,
  featured: false,
  urgent: false,
  remoteWorkAllowed: false,
  requiredCheckTypes: '["CRIMINAL_RECORD","QUALIFICATION"]',
  enforceCheckCompletion: true,
};

type Posting = Record<string, unknown>;

const withStatus = (overrides: Posting): Posting => ({ ...BASE_POSTING, ...overrides });

const APPROVED = withStatus({
  status: 'APPROVED',
  statusDisplayName: 'Approved',
  canBeApproved: false,
  canBeRejected: false,
  canBePublished: true,
  canBeClosed: true,
  approvedAt: '2026-08-08T14:20:00',
  approvedBy: 'Thandi Molefe',
  approvalNotes: 'Band confirmed against the Technology salary scale.',
});

const PUBLISHED = withStatus({
  status: 'PUBLISHED',
  statusDisplayName: 'Published',
  canBeApproved: false,
  canBeRejected: false,
  canBeUnpublished: true,
  canBeClosed: true,
  approvedAt: '2026-08-08T14:20:00',
  approvedBy: 'Thandi Molefe',
  publishedAt: '2026-08-12T08:30:00',
  publishedBy: 'Thandi Molefe',
  daysFromPublication: 12,
  applicationsCount: 37,
  viewsCount: 1284,
});

const REJECTED = withStatus({
  status: 'REJECTED',
  statusDisplayName: 'Rejected',
  canBeEdited: true,
  canBeSubmittedForApproval: true,
  canBeApproved: false,
  canBeRejected: false,
  rejectionReason: 'The salary band sits above the Technology scale for this grade.',
});

const DRAFT = withStatus({
  status: 'DRAFT',
  statusDisplayName: 'Draft',
  canBeEdited: true,
  canBeSubmittedForApproval: true,
  canBeApproved: false,
  canBeRejected: false,
  submittedForApprovalAt: undefined,
});

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

interface Captured {
  /** Every workflow transition the browser posted, in order. */
  actions: Array<{ path: string; body: string }>;
}

async function stubApi(page: Page, posting: Posting): Promise<Captured> {
  const captured: Captured = { actions: [] };

  const json = (route: Route, body: unknown, status = 200) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const method = route.request().method();

    if (method === 'POST' && path.startsWith(`/api/job-postings/${POSTING_ID}/`)) {
      captured.actions.push({ path, body: route.request().postData() ?? '' });
      return json(route, posting);
    }

    if (path === '/api/job-postings/search') {
      return json(route, { content: [posting], totalPages: 1, totalElements: 1 });
    }

    // These have to answer with arrays. JobBoardManager — which the page mounts alongside the
    // workflow for a PUBLISHED posting — calls .filter() on the response without checking it,
    // so a non-array body takes the whole page down with it.
    if (path === '/api/background-checks/check-types') return json(route, []);
    if (path.startsWith('/api/job-boards')) return json(route, []);
    if (path.startsWith('/api/shortlist')) return json(route, { content: [] });

    return json(route, {});
  });

  return captured;
}

/** Opens the workflow record for the single stubbed posting. */
async function openWorkflow(page: Page, posting: Posting) {
  const captured = await stubApi(page, posting);
  await page.goto('/job-postings');
  await page.getByRole('button', { name: /view details/i }).first().click();
  await expect(page.getByTestId('stage-rail')).toBeVisible();
  return captured;
}

const rail = (page: Page) => page.getByTestId('stage-rail');
const stages = (page: Page) => rail(page).getByRole('listitem');
const decisionBar = (page: Page) => page.getByTestId('decision-bar');
const reach = (page: Page) => page.getByTestId('reach-strip');

test.beforeEach(async ({ page }) => {
  // /job-postings is a heavy route and the dev server compiles it on first request; with workers
  // in parallel that cold compile alone can exceed the default navigation timeout.
  test.slow();
  page.setDefaultNavigationTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signInAs(page, 'ADMIN');
});

test.describe('Job posting workflow — the stage rail', () => {
  test('runs all five stages, in order', async ({ page }) => {
    await openWorkflow(page, BASE_POSTING);

    await expect(stages(page)).toHaveCount(5);
    await expect(stages(page)).toContainText([
      'Drafted', 'Pending approval', 'Approved', 'Published', 'Closed',
    ]);
  });

  test('marks the stage the posting is actually at', async ({ page }) => {
    await openWorkflow(page, BASE_POSTING);

    // Stage 2 of 5 — stated in the identity band as well as drawn on the rail, so state is
    // never carried by colour alone.
    await expect(page.getByText('2 of 5')).toBeVisible();
    await expect(stages(page).nth(1)).toContainText('Awaiting approval since');
  });

  test('moves the marker when the posting is further along', async ({ page }) => {
    await openWorkflow(page, PUBLISHED);

    await expect(page.getByText('4 of 5')).toBeVisible();
    await expect(stages(page).nth(3)).toContainText('Published');
  });

  test('shows a rejected posting as stopped, not as in progress', async ({ page }) => {
    await openWorkflow(page, REJECTED);

    await expect(page.getByText('Stopped', { exact: true })).toBeVisible();
    await expect(stages(page).nth(1)).toContainText('Rejected');
    await expect(rail(page)).toContainText('Stopped here');
  });

  test('reports how long the posting sat in each stage it reached', async ({ page }) => {
    await openWorkflow(page, BASE_POSTING);

    // 1 Aug to 5 Aug in the draft stage; the value is derived from the timestamps, not stored.
    await expect(stages(page).first()).toContainText('4 days here');
  });
});

test.describe('Job posting workflow — the decision bar states the ask', () => {
  const asks: Array<[string, Posting, RegExp]> = [
    ['DRAFT', DRAFT, /draft and has not been submitted/i],
    ['PENDING_APPROVAL', BASE_POSTING, /waiting on approval/i],
    ['APPROVED', APPROVED, /ready to publish/i],
    ['PUBLISHED', PUBLISHED, /live and accepting applications/i],
    ['REJECTED', REJECTED, /rejected at approval/i],
  ];

  for (const [status, posting, ask] of asks) {
    test(`${status} is asked for the right thing`, async ({ page }) => {
      await openWorkflow(page, posting);
      await expect(decisionBar(page)).toContainText(ask);
    });
  }

  test('offers no "request changes" action, because the API has no such transition', async ({ page }) => {
    await openWorkflow(page, BASE_POSTING);
    await expect(page.getByRole('button', { name: /request changes/i })).toHaveCount(0);
  });
});

test.describe('Job posting workflow — reach follows publication', () => {
  test('an unpublished posting shows no reach figures', async ({ page }) => {
    await openWorkflow(page, BASE_POSTING);

    await expect(reach(page)).toHaveCount(0);
    await expect(page.getByText(/reach since publishing/i)).toHaveCount(0);
  });

  test('an approved-but-unadvertised posting shows none either', async ({ page }) => {
    await openWorkflow(page, APPROVED);
    await expect(reach(page)).toHaveCount(0);
  });

  test('a published posting shows views and applications', async ({ page }) => {
    await openWorkflow(page, PUBLISHED);

    await expect(reach(page)).toBeVisible();
    await expect(reach(page)).toContainText('Views');
    await expect(reach(page)).toContainText('Applications');
    await expect(reach(page)).toContainText('37');
  });
});

test.describe('Job posting workflow — a rejection explains itself', () => {
  test('the reason is on the page, not buried', async ({ page }) => {
    await openWorkflow(page, REJECTED);

    await expect(page.getByText(/salary band sits above the Technology scale/i).first()).toBeVisible();
  });

  test('the audit trail carries the rejection too', async ({ page }) => {
    await openWorkflow(page, REJECTED);

    const audit = page.getByRole('region', { name: /audit trail/i });
    await expect(audit).toContainText('Rejected');
    await expect(audit).toContainText(/salary band sits above/i);
  });
});

test.describe('Job posting workflow — every action still calls its endpoint', () => {
  test('approve posts to /approve with the notes and the actor', async ({ page }) => {
    const captured = await openWorkflow(page, BASE_POSTING);

    await page.getByRole('button', { name: /^approve$/i }).click();
    await page.getByLabel(/approval notes/i).fill('Headcount confirmed in the Q2 plan.');
    await page.getByRole('button', { name: /confirm approval/i }).click();
    await page.getByRole('button', { name: /^approve$/i }).click(); // ConfirmDialog

    await expect.poll(() => captured.actions.length).toBe(1);
    expect(captured.actions[0].path).toBe(`/api/job-postings/${POSTING_ID}/approve`);
    const body = new URLSearchParams(captured.actions[0].body);
    expect(body.get('approvedBy')).toBe('e2e-user');
    expect(body.get('approvalNotes')).toBe('Headcount confirmed in the Q2 plan.');
  });

  test('reject posts to /reject and refuses to leave without a reason', async ({ page }) => {
    const captured = await openWorkflow(page, BASE_POSTING);

    await page.getByRole('button', { name: /^reject$/i }).click();
    const confirm = page.getByRole('button', { name: /confirm rejection/i });
    await expect(confirm).toBeDisabled();
    expect(captured.actions).toHaveLength(0);

    await page.getByLabel(/reason for rejection/i).fill('Salary band above the scale.');
    await confirm.click();
    await page.getByRole('button', { name: /^reject$/i }).last().click(); // ConfirmDialog

    await expect.poll(() => captured.actions.length).toBe(1);
    expect(captured.actions[0].path).toBe(`/api/job-postings/${POSTING_ID}/reject`);
    const body = new URLSearchParams(captured.actions[0].body);
    expect(body.get('rejectionReason')).toBe('Salary band above the scale.');
    expect(body.get('rejectedBy')).toBe('e2e-user');
  });

  test('publish posts the chosen audience to /publish', async ({ page }) => {
    const captured = await openWorkflow(page, APPROVED);

    await page.getByRole('button', { name: /^publish$/i }).click();
    await page.getByLabel(/internal applicants only/i).check();
    await page.getByRole('button', { name: /confirm publish/i }).click();
    await page.getByRole('button', { name: /^publish$/i }).last().click(); // ConfirmDialog

    await expect.poll(() => captured.actions.length).toBe(1);
    expect(captured.actions[0].path).toBe(`/api/job-postings/${POSTING_ID}/publish`);
    const body = new URLSearchParams(captured.actions[0].body);
    expect(body.get('channelInternal')).toBe('true');
    expect(body.get('channelExternal')).toBe('false');
  });

  test('unpublish posts to /unpublish after confirmation', async ({ page }) => {
    const captured = await openWorkflow(page, PUBLISHED);

    await page.getByRole('button', { name: /^unpublish$/i }).click();
    await page.getByRole('button', { name: /^unpublish$/i }).last().click(); // ConfirmDialog

    await expect.poll(() => captured.actions.length).toBe(1);
    expect(captured.actions[0].path).toBe(`/api/job-postings/${POSTING_ID}/unpublish`);
    expect(new URLSearchParams(captured.actions[0].body).get('unpublishedBy')).toBe('e2e-user');
  });

  test('close posts to /close after confirmation', async ({ page }) => {
    const captured = await openWorkflow(page, PUBLISHED);

    await page.getByRole('button', { name: /close posting/i }).click();
    await page.getByRole('button', { name: /^close$/i }).click(); // ConfirmDialog

    await expect.poll(() => captured.actions.length).toBe(1);
    expect(captured.actions[0].path).toBe(`/api/job-postings/${POSTING_ID}/close`);
    expect(new URLSearchParams(captured.actions[0].body).get('closedBy')).toBe('e2e-user');
  });

  test('submit-for-approval posts to /submit-for-approval', async ({ page }) => {
    const captured = await openWorkflow(page, DRAFT);

    await page.getByRole('button', { name: /submit for approval/i }).click();

    await expect.poll(() => captured.actions.length).toBe(1);
    expect(captured.actions[0].path).toBe(`/api/job-postings/${POSTING_ID}/submit-for-approval`);
    expect(new URLSearchParams(captured.actions[0].body).get('submittedBy')).toBe('e2e-user');
  });
});
