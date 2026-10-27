/**
 * Routes that must render without the application chrome (sidebar, top bar, app footer).
 *
 * <p>These all live inside the `(app)` route group because they need its providers — tenant
 * resolution from the subdomain, branding and theme — but they are not part of the signed-in
 * application. The public careers page carries its own IDC header and footer, and the auth
 * screens are full-page by design, so the sidebar on top of either is wrong regardless of
 * whether anyone happens to be signed in.
 *
 * <p>Matching is by path segment, so `/jobs` also covers `/jobs/senior-analyst`. It is
 * deliberately not a substring test: `/job-postings` is an application page and must keep its
 * chrome.
 */
export const CHROMELESS_ROUTES = [
  '/jobs',
  '/login',
  '/register',
  '/forgot-password',
] as const;

/** True when the chrome must be suppressed for this path. */
export function isChromelessRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return CHROMELESS_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
}
