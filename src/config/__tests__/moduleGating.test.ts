import { navigationRegistry, NavSection } from '@/config/navigationRegistry';
import { MODULE_FEATURES } from '@/config/featurePlanMap';
import { rolePermissions } from '@/config/permissions';
import type { UserRole } from '@/contexts/AuthContext';

/**
 * A tenant that licenses only some modules must not see the others in its
 * sidebar. ModernSidebar enforces that by locking any entry whose
 * `requiredFeature` is outside the tenant's modules, then dropping locked
 * entries for a module-scoped tenant.
 *
 * The hole this test closes: an entry with NO `requiredFeature` can never
 * lock, so it survives module gating whatever the tenant bought. That is how
 * Employee Directory, Add Employee, Payslips and Expense Submission were
 * appearing in the sidebar of the IDC tenant, which licenses recruitment only.
 */

/** Feature codes reachable from a set of licensed modules. */
function featuresFor(modules: string[]): Set<string> {
  const features = new Set<string>();
  for (const code of modules) {
    for (const feature of MODULE_FEATURES[code] ?? []) features.add(feature);
  }
  return features;
}

/** The sidebar ModernSidebar would build for a module-scoped tenant. */
function visibleSidebar(role: UserRole, modules: string[]) {
  const permissions = rolePermissions[role];
  const features = featuresFor(modules);
  return navigationRegistry.filter((entry) => {
    if (entry.allowedRoles && !entry.allowedRoles.includes(role)) return false;
    if (!entry.requiredPermissions.every((p) => permissions.includes(p))) return false;
    // A module-scoped tenant drops locked entries entirely, rather than
    // showing them greyed out.
    if (entry.requiredFeature && !features.has(entry.requiredFeature)) return false;
    return true;
  });
}

/** Sections whose entries are module-owned and must all be feature-gated. */
const MODULE_OWNED_SECTIONS: NavSection[] = ['hr_core', 'talent', 'engagement'];

const IDC_MODULES = ['RECRUITMENT', 'AI', 'ANALYTICS', 'ADMINISTRATION'];
const ALL_MODULES = Object.keys(MODULE_FEATURES);

describe('Module gating', () => {
  it.each(MODULE_OWNED_SECTIONS)(
    'every %s entry carries a requiredFeature, so it can be gated at all',
    (section) => {
      const untagged = navigationRegistry
        .filter((entry) => entry.section === section && !entry.requiredFeature)
        .map((entry) => entry.id);
      expect(untagged).toEqual([]);
    },
  );

  it('every requiredFeature is reachable from some module', () => {
    const everyFeature = featuresFor(ALL_MODULES);
    const orphans = navigationRegistry
      .filter((entry) => entry.requiredFeature && !everyFeature.has(entry.requiredFeature))
      .map((entry) => `${entry.id} -> ${entry.requiredFeature}`);
    // An unreachable code is never returned by /api/features/enabled either,
    // so the entry would be hidden from every tenant rather than gated.
    expect(orphans).toEqual([]);
  });

  it('shows a recruitment-only tenant no HR section at all', () => {
    for (const role of ['ADMIN', 'HR_MANAGER', 'HIRING_MANAGER', 'RECRUITER'] as UserRole[]) {
      const hr = visibleSidebar(role, IDC_MODULES).filter((e) => e.section === 'hr_core');
      expect({ role, hr: hr.map((e) => e.label) }).toEqual({ role, hr: [] });
    }
  });

  it('shows a recruitment-only tenant only recruitment analytics', () => {
    const analytics = visibleSidebar('ADMIN', IDC_MODULES)
      .filter((e) => e.section === 'analytics')
      .map((e) => e.label);
    expect(analytics).toEqual(['Analytics', 'Recruiter Analytics', 'Reports', 'Report Export']);
    expect(analytics).not.toContain('HR Analytics');
    expect(analytics).not.toContain('Performance Analytics');
    expect(analytics).not.toContain('Employee Reports');
  });

  it('still shows HR and Talent to a tenant that licenses every module', () => {
    const labels = visibleSidebar('ADMIN', ALL_MODULES).map((e) => e.label);
    for (const label of [
      'Employee Directory',
      'Add Employee',
      'Payslips',
      'Expense Submission',
      'HR Analytics',
      'Performance Analytics',
      'Employee Reports',
    ]) {
      expect(labels).toContain(label);
    }
  });
});
