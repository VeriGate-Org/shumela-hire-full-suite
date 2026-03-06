import type { BackendJobAd, BackendApiResponse, BackendPagedResponse } from '@/components/jobs/types';

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

export async function fetchActiveJobs(): Promise<BackendJobAd[]> {
  try {
    const baseUrl = getBaseUrl();
    const url = new URL('/api/ads', baseUrl);
    url.searchParams.set('status', 'PUBLISHED');
    url.searchParams.set('channel', 'external');
    url.searchParams.set('size', '100');
    url.searchParams.set('sort', 'createdAt,desc');

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const apiResponse: BackendApiResponse<BackendPagedResponse> = await response.json();

    if (!apiResponse.success || !apiResponse.data) {
      return [];
    }

    const now = new Date();
    return apiResponse.data.content.filter((job) => {
      if (job.status !== 'PUBLISHED' || !job.channelExternal) return false;
      if (job.closingDate && new Date(job.closingDate) < now) return false;
      return true;
    });
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    return [];
  }
}

export async function fetchJobBySlug(slug: string): Promise<BackendJobAd | null> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/ads/${slug}`, {
      next: { revalidate: 300 },
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
