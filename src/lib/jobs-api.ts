import type { BackendJobAd, BackendApiResponse } from '@/components/jobs/types';

/**
 * Server-side base URL for the backend API.
 * NEXT_PUBLIC_API_URL is intentionally empty in prod so client-side fetches
 * use relative paths. For SSR we derive the backend URL from NEXT_PUBLIC_APP_URL
 * (e.g. https://shumelahire.co.za → https://api.shumelahire.co.za).
 */
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const u = new URL(appUrl);
      return `${u.protocol}//api.${u.host}`;
    } catch { /* fall through */ }
  }
  return 'http://localhost:8080';
};

export async function fetchJobBySlug(slug: string): Promise<BackendJobAd | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/ads/${slug}`, {
      // Static export: ISR revalidation not available; cache via CloudFront/API Gateway
      cache: 'no-store',
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: BackendApiResponse<BackendJobAd> = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      return null;
    }

    return apiResponse.data;
  } catch (error) {
    console.error('Error fetching job data:', error);
    return null;
  }
}
