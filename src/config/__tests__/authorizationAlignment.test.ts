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

  const actual = rolesWithPermissions(entry!.requiredPermissions).sort();
  const sortedExpected = [...expected].sort();
  expect(actual).toEqual(sortedExpected);
}

describe('Authorization alignment', () => {
  it('keeps high-risk navigation routes aligned with backend role policies', () => {
    expectNavRoles('agencies', ['ADMIN', 'HR_MANAGER', 'RECRUITER']);
    expectNavRoles('talent-pools', ['ADMIN', 'HR_MANAGER', 'RECRUITER']);
    expectNavRoles('offers', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('workflow', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('application-management', ['ADMIN', 'HR_MANAGER', 'RECRUITER']);
    expectNavRoles('integrations', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('reports', ['ADMIN', 'EXECUTIVE', 'HR_MANAGER']);
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
    expectNavRoles('report-export', ['ADMIN', 'HR_MANAGER', 'EXECUTIVE']);
    expectNavRoles('sage-integration', ['ADMIN', 'HR_MANAGER']);
    expectNavRoles('sso-configuration', ['ADMIN', 'HR_MANAGER']);
  });
});
