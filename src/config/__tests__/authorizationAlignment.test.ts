import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { navigationRegistry } from '@/config/navigationRegistry';
import { rolePermissions } from '@/config/permissions';
import type { UserRole } from '@/contexts/AuthContext';

const ALL_ROLES = Object.keys(rolePermissions) as UserRole[];

function rolesWithPermissions(requiredPermissions: string[]): UserRole[] {
  return ALL_ROLES.filter((role) =>
    requiredPermissions.every((permission) => rolePermissions[role].includes(permission)),
  );
}

function expectNavRoles(navId: string, expected: UserRole[]) {
  const entry = navigationRegistry.find((item) => item.id === navId);
  expect(entry).toBeDefined();

  let actual = rolesWithPermissions(entry!.requiredPermissions);
  // allowedRoles is a UI-only allow-list on top of the permission check —
  // e.g. talent-pools/agencies share view_applicants with 'applicants' but
  // are deliberately pinned to a narrower role set so that granting a role
  // view_applicants for Applicants' sake doesn't silently also unlock
  // these two. Without this, the test would only ever see the permission
  // side and miss that narrowing entirely.
  if (entry!.allowedRoles) {
    const allowed = new Set(entry!.allowedRoles);
    actual = actual.filter((role) => allowed.has(role));
  }
  actual = actual.sort();
  const sortedExpected = [...expected].sort();
  expect(actual).toEqual(sortedExpected);
}

describe('Authorization alignment', () => {
  it('keeps high-risk navigation routes aligned with backend role policies', () => {
    expectNavRoles('agencies', ['ADMIN', 'HR_MANAGER', 'RECRUITER']);
    expectNavRoles('talent-pools', ['ADMIN', 'HR_MANAGER', 'RECRUITER']);
    expectNavRoles('offers', ['ADMIN', 'HIRING_MANAGER', 'HR_MANAGER']);
    expectNavRoles('workflow', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('application-management', ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER']);
    expectNavRoles('applicants', ['ADMIN', 'HR_MANAGER', 'RECRUITER', 'HIRING_MANAGER']);
    expectNavRoles('integrations', ['ADMIN', 'HR_MANAGER']);
    // ReportingController admits HIRING_MANAGER as of the same change that
    // granted the role view_reports — a hiring manager reads reports on their
    // own vacancies.
    expectNavRoles('reports', ['ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'HIRING_MANAGER']);
    expectNavRoles('audit-logs', ['ADMIN']);
    expectNavRoles('permissions', ['ADMIN']);
    expectNavRoles('recruiter-dashboard', ['ADMIN', 'HR_MANAGER', 'RECRUITER']);
    expectNavRoles('analytics', ['ADMIN', 'EXECUTIVE', 'HIRING_MANAGER', 'HR_MANAGER', 'RECRUITER']);
  });

  it('restricts platform owner to platform administration permissions', () => {
    expect(rolePermissions.PLATFORM_OWNER).toEqual([
      'view_dashboard',
      'platform_admin',
      'manage_features',
      'manage_tenants',
    ]);
  });

  it('aligns new HR module nav entries with correct roles', () => {
    expectNavRoles('leave', ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EMPLOYEE']);
    expectNavRoles('time-attendance', ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EMPLOYEE']);
    expectNavRoles('shift-scheduling', ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER']);
    expectNavRoles('employee-self-service', ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EMPLOYEE', 'APPLICANT']);
    expectNavRoles('training', ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EXECUTIVE']);
    expectNavRoles('performance', ['ADMIN', 'HR_MANAGER', 'LINE_MANAGER', 'EXECUTIVE']);
    expectNavRoles('engagement', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('compliance', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('labour-relations', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('hr-analytics', ['ADMIN', 'HR_MANAGER', 'EXECUTIVE', 'HIRING_MANAGER', 'RECRUITER']);
    // ReportExportController is ADMIN/HR_MANAGER only — EXECUTIVE was never
    // admitted, so the entry it used to get here would have 403'd. The nav
    // entry now pins the role set instead of inheriting it from view_reports.
    expectNavRoles('report-export', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('sage-integration', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('sso-configuration', ['ADMIN', 'HR_MANAGER']);
  });

  /**
   * Component-level role gates drift from the backend silently.
   *
   * ShortlistingPanel hides its whole action bar behind a MANAGE_ROLES literal. When
   * HIRING_MANAGER was missing from it, hiring managers saw the score table with no
   * Recalculate, no Auto-Shortlist and no Override — while the backend authorised every one
   * of those calls. Nothing failed; the affordance simply was not rendered, which presents as
   * a dead button rather than as a permission boundary.
   *
   * Read as text rather than imported, because the constant is module-private and the point
   * is to pin the literal a future edit would change.
   */
  it('keeps ShortlistingPanel MANAGE_ROLES aligned with ShortlistingController', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/ShortlistingPanel.tsx'),
      'utf8',
    );

    const match = source.match(/const MANAGE_ROLES = \[([^\]]+)\]/);
    expect(match).not.toBeNull();

    const actual = match![1]
      .split(',')
      .map((r) => r.trim().replace(/['"]/g, ''))
      .filter(Boolean)
      .sort();

    // ShortlistingController @PreAuthorize on calculate, auto-shortlist, scores and override.
    expect(actual).toEqual(['ADMIN', 'HIRING_MANAGER', 'HR_MANAGER', 'RECRUITER'].sort());
  });
});
