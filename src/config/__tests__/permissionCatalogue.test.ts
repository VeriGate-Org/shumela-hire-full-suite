import {
  LOCKED_PERMISSIONS,
  PERMISSION_CATALOGUE,
  PERMISSION_CATEGORIES,
  effectivePermissions,
  isPermissionLocked,
  rolePermissions,
} from '../permissions';
import type { UserRole } from '@/contexts/AuthContext';

/**
 * The catalogue and the role defaults describe the same permissions and must not drift.
 *
 * <p>Drift between two lists of permission ids is not hypothetical here: the product shipped with
 * two entire vocabularies, one in this file that gates the interface and one in the Java
 * `PermissionService` that was displayed on the role-permissions page and enforced nothing. Every
 * tick on that matrix was decorative, and nothing failed to make that visible.
 *
 * <p>Now the server stores only deviations and never restates the ids, so the remaining risk is a
 * permission granted to a role but missing from the catalogue — which would make it invisible on
 * the page and therefore impossible to revoke.
 */
describe('the permission catalogue', () => {
  const catalogueIds = new Set(PERMISSION_CATALOGUE.map((p) => p.id));
  const grantedIds = new Set(Object.values(rolePermissions).flat());

  it('describes every permission that any role is granted by default', () => {
    const missing = [...grantedIds].filter((id) => !catalogueIds.has(id)).sort();
    // A granted permission absent from the catalogue cannot be seen or revoked on the page.
    expect(missing).toEqual([]);
  });

  it('does not describe permissions no role has', () => {
    const orphans = [...catalogueIds].filter((id) => !grantedIds.has(id)).sort();
    expect(orphans).toEqual([]);
  });

  it('has no duplicate ids', () => {
    expect(PERMISSION_CATALOGUE.length).toBe(catalogueIds.size);
  });

  it('files every permission under a real category', () => {
    const known = new Set(PERMISSION_CATEGORIES.map((c) => c.id));
    const stray = PERMISSION_CATALOGUE.filter((p) => !known.has(p.category)).map((p) => p.id);
    expect(stray).toEqual([]);
  });

  it('locks only permissions the locked role actually holds', () => {
    // Locking something a role does not have would render a tick nobody can explain.
    for (const [role, locked] of Object.entries(LOCKED_PERMISSIONS)) {
      for (const id of locked ?? []) {
        expect(rolePermissions[role as UserRole]).toContain(id);
      }
    }
  });
});

describe('effectivePermissions', () => {
  it('returns the defaults when nothing has been overridden', () => {
    expect(new Set(effectivePermissions('RECRUITER'))).toEqual(new Set(rolePermissions.RECRUITER));
  });

  it('adds a granted permission the role does not have by default', () => {
    expect(rolePermissions.INTERVIEWER).not.toContain('view_reports');
    const result = effectivePermissions('INTERVIEWER', [
      { role: 'INTERVIEWER', permissionId: 'view_reports', granted: true },
    ]);
    expect(result).toContain('view_reports');
  });

  it('removes a revoked permission', () => {
    const result = effectivePermissions('RECRUITER', [
      { role: 'RECRUITER', permissionId: 'view_salary_data', granted: false },
    ]);
    expect(result).not.toContain('view_salary_data');
  });

  it('ignores overrides belonging to another role', () => {
    const result = effectivePermissions('RECRUITER', [
      { role: 'INTERVIEWER', permissionId: 'view_salary_data', granted: false },
    ]);
    expect(result).toContain('view_salary_data');
  });

  it('refuses to revoke a locked permission even when an override says so', () => {
    // The server refuses this too. Both matter: the endpoint is reachable directly, and a stale
    // override written before a lock existed must not take effect on read either.
    const result = effectivePermissions('ADMIN', [
      { role: 'ADMIN', permissionId: 'manage_permissions', granted: false },
    ]);
    expect(result).toContain('manage_permissions');
    expect(isPermissionLocked('ADMIN', 'manage_permissions')).toBe(true);
  });

  it('a later release adding a default permission reaches a tenant that has overridden others', () => {
    // The reason deviations are stored rather than a snapshot of the whole set.
    const result = effectivePermissions('RECRUITER', [
      { role: 'RECRUITER', permissionId: 'view_reports', granted: true },
    ]);
    rolePermissions.RECRUITER.forEach((id) => expect(result).toContain(id));
  });
});
