/**
 * Extracts the tenant subdomain from the current hostname.
 *
 * Resolution logic:
 *  - `localhost` / `127.0.0.1` → "default"
 *  - `acme.shumelahire.co.za` → "acme"
 *  - `acme.sbx.shumelahire.co.za` → "acme"
 *  - `acme.localhost` → "acme" (local subdomain testing)
 */
export function getTenantSubdomain(): string {
  if (typeof window === 'undefined') {
    return 'default';
  }

  const hostname = window.location.hostname;

  // Plain localhost / IP — default tenant
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'default';
  }

  // <subdomain>.localhost (local dev with subdomain)
  if (hostname.endsWith('.localhost')) {
    return hostname.split('.')[0];
  }

  // <subdomain>.[env.]shumelahire.co.za
  const ENVIRONMENT_PREFIXES = new Set(['dev', 'ppe', 'staging', 'qa', 'sandbox', 'sbx']);
  const parts = hostname.split('.');
  if (parts.length >= 3 && hostname.includes('shumelahire.co.za')) {
    // Environment base URLs (dev.shumelahire.co.za, ppe.shumelahire.co.za) are not tenant subdomains
    if (ENVIRONMENT_PREFIXES.has(parts[0])) {
      return 'default';
    }
    return parts[0];
  }

  return 'default';
}
