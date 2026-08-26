import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative } from 'path';

/**
 * A ratchet on hand-rolled modals.
 *
 * <p>Sixty-three files render their own `fixed inset-0` overlay, and each remembered a different
 * subset of what a dialog owes its user: fifteen announce themselves, eight close on Escape, two
 * stop the page behind scrolling. Converting them all at once is not realistic, so this stops the
 * number growing instead.
 *
 * <p>A new overlay outside the three primitives fails the build. An entry removed from the list
 * below can never come back. The list may only shrink — that is the whole mechanism.
 *
 * <p>Reads the source rather than rendering anything, because the failure being guarded against is
 * a file existing at all. The same technique as ShortlistingAuthorisationTest and the AI Tools
 * registry test.
 */
const OVERLAY = 'fixed inset-0';

/** These render an overlay because that is their job. */
const PRIMITIVES = [
  'components/Modal.tsx',
  'components/ConfirmDialog.tsx',
  'components/SlideOverDrawer.tsx',
];

/**
 * Everything that already had one when this guard was written. Delete a line as you convert its
 * file to `Modal`; never add one.
 */
const LEGACY = [
  'app/(app)/admin/audit-logs/page.tsx',
  'app/(app)/admin/company-documents/page.tsx',
  'app/(app)/admin/departments/page.tsx',
  'app/(app)/admin/document-retention/page.tsx',
  'app/(app)/admin/permissions/page.tsx',
  'app/(app)/agencies/page.tsx',
  'app/(app)/candidate/applications/page.tsx',
  'app/(app)/candidate/interviews/page.tsx',
  'app/(app)/candidate/offers/page.tsx',
  'app/(app)/candidate/page.tsx',
  'app/(app)/employee/documents/page.tsx',
  'app/(app)/executive/budget/page.tsx',
  'app/(app)/executive/leadership/page.tsx',
  'app/(app)/executive/overview/page.tsx',
  'app/(app)/executive/planning/page.tsx',
  'app/(app)/executive/reports/page.tsx',
  'app/(app)/expenses/page.tsx',
  'app/(app)/leave/encashment/page.tsx',
  'app/(app)/messages/page.tsx',
  'app/(app)/notifications/page.tsx',
  'app/(app)/onboarding/page.tsx',
  'app/(app)/onboarding/templates/page.tsx',
  'app/(app)/payroll/payslips/page.tsx',
  'app/(app)/performance/360/page.tsx',
  'app/(app)/performance/page.tsx',
  'app/(app)/performance/pips/page.tsx',
  'app/(app)/support/page.tsx',
  'app/(app)/talent-pools/page.tsx',
  'app/(app)/training/admin/page.tsx',
  'app/(app)/workflow/page.tsx',
  'components/AnalyticsDashboard.tsx',
  'components/ApplicationTimeline.tsx',
  'components/ApprovalActions.tsx',
  'components/GlobalSearch.tsx',
  'components/InterviewCalendar.tsx',
  'components/InviteUserModal.tsx',
  'components/LinkedInPostToCompany.tsx',
  'components/MobileNavigation.tsx',
  'components/ModernLayout.tsx',
  'components/MultiChannelPublishWizard.tsx',
  'components/OfferManagement.tsx',
  'components/PWAInstallPrompt.tsx',
  'components/SalaryRecommendationManager.tsx',
  'components/ShortlistingPanel.tsx',
  'components/WizardShell.tsx',
  'components/WorkflowActions.tsx',
  'components/dashboard/DashboardWidget.tsx',
  'components/performance/ContractBuilder.tsx',
  'components/performance/CycleManagement.tsx',
  'components/templates/DocumentTemplateEditor.tsx',
  'components/templates/TemplateEditor.tsx',
  'components/templates/TemplateList.tsx',
  // components/workflow/ApprovalCenter.tsx was deleted — it rendered a permanently empty approval
  // queue from state nothing populated. The queue now lives at /approvals over a real endpoint.
  // analytics/reports and reports/scheduled became redirects into /reports, which already had the
  // builder and the scheduler as tabs; performance/analytics was a duplicate of
  // performance-analytics and was deleted. None of the three has an overlay to hand-roll any more.
];

function tsxFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...tsxFilesUnder(full));
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

describe('hand-rolled modal overlays', () => {
  const src = join(process.cwd(), 'src');
  const withOverlay = tsxFilesUnder(src)
    .filter((f) => readFileSync(f, 'utf8').includes(OVERLAY))
    .map((f) => relative(src, f).split(/[\\/]/).join('/'))
    .sort();

  it('does not grow — a new overlay must use Modal, ConfirmDialog or SlideOverDrawer', () => {
    const known = new Set([...PRIMITIVES, ...LEGACY]);
    const added = withOverlay.filter((f) => !known.has(f));

    expect(added).toEqual([]);
  });

  it('shrinks honestly — a converted file must be struck from the list', () => {
    // Otherwise the list becomes a lie about how much is left, and stops measuring anything.
    const present = new Set(withOverlay);
    const staleEntries = LEGACY.filter((f) => !present.has(f));

    expect(staleEntries).toEqual([]);
  });

  it('keeps the primitives as the only sanctioned overlay', () => {
    PRIMITIVES.forEach((p) => expect(withOverlay).toContain(p));
  });
});
