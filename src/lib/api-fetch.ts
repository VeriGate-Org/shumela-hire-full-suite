import { getTenantSubdomain } from '@/lib/tenant-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getAuthToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession({ forceRefresh: false });
    // Prefer ID token because it reliably carries role/group and tenant claims
    // consumed by backend authorization and tenant resolution.
    const token = session.tokens?.idToken?.toString()
      || session.tokens?.accessToken?.toString()
      || null;
    if (token) return token;
  } catch (err: unknown) {
    // Only swallow "Cognito not configured" style errors.
    // Log auth session failures so expired/invalid tokens are visible.
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes('Auth') || !message.includes('configured')) {
      console.warn('Failed to retrieve auth session:', message);
    }
  }
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('jwt_token');
  }
  return null;
}

/**
 * Fetch wrapper that resolves relative API paths to the backend URL
 * and includes auth + tenant headers.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const token = await getAuthToken();
  const tenantSubdomain = getTenantSubdomain();
  const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
  const headers: Record<string, string> = {
    // Let the browser set Content-Type (with boundary) for FormData uploads
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(init?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Inject tenant header if not already set
  if (!headers['X-Tenant-Id']) {
    headers['X-Tenant-Id'] = tenantSubdomain;
  }

  return fetch(url, { ...init, headers });
}

/**
 * Like apiFetch but parses JSON and throws on non-2xx responses.
 */
export async function apiFetchJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${message}`);
  }
  return res.json() as Promise<T>;
}
