import { apiFetch } from '@/lib/api-fetch';
import type { RolePermissionOverride } from '@/config/permissions';

/**
 * The tenant's deviations from the built-in role permissions, fetched once per session.
 *
 * <p>Cached because every gate in the product asks what the signed-in user may do, and re-reading
 * this per question would be a request per rendered control. It is deliberately not revalidated: a
 * permission change takes effect at the next sign-in, which is the same contract as the role itself
 * and avoids a menu that rearranges itself under the pointer.
 *
 * <p>A failure resolves to <b>no overrides</b>, not to an error. The defaults are the safe answer —
 * they are what the product shipped with — and refusing to sign someone in because a preferences
 * endpoint was briefly unavailable trades a small misconfiguration for a total outage.
 */
let cached: Promise<RolePermissionOverride[]> | null = null;

export function loadRolePermissionOverrides(): Promise<RolePermissionOverride[]> {
  if (!cached) {
    cached = apiFetch('/api/role-permissions')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => (Array.isArray(data) ? (data as RolePermissionOverride[]) : []))
      .catch(() => []);
  }
  return cached;
}

/** Drops the cache so the next read is fresh. Called after an administrator changes a permission. */
export function clearRolePermissionOverrides(): void {
  cached = null;
}
