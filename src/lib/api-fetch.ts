import { getTenantSubdomain } from '@/lib/tenant-utils';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function getAuthToken(): Promise<string | null> {
  try {
    const { fetchAuthSession } = await import('aws-amplify/auth');
    const session = await fetchAuthSession({ forceRefresh: false });
    // Prefer ID token because it reliably carries role/group and tenant claims
    // consumed by backend authorization and tenant resolution.
    return session.tokens?.idToken?.toString()
      || session.tokens?.accessToken?.toString()
      || null;
  } catch {
    // Cognito not configured
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
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
