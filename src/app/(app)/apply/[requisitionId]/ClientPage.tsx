'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicApplyPage() {
  // Static export: every /apply/<requisitionId> URL is served the same
  // pre-rendered shell (built with the placeholder id "_" — see the
  // CloudFront "/apply/*" rewrite behavior in ShumelaHireFrontendStack.cs).
  // useParams() would read that build-time placeholder instead of the real
  // id on a hard page load / refresh, so the real id is read from the
  // actual browser URL instead (same fix as requisitions/[id], #187).
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const requisitionId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['apply', '<requisitionId>']
    return parts.length >= 2 ? parts[1] : '';
  }, [pathname]);

  // The advert carries jobId and title in the query string, and the form on the
  // far side needs both — jobId becomes the jobAdId on the submitted
  // application. This hop used to rebuild the URL from scratch and drop them,
  // so a candidate who came from a live advert arrived at a form that no longer
  // knew which job it was for.
  const forwardedQuery = useMemo(() => {
    const params = new URLSearchParams();
    const jobId = searchParams.get('jobId');
    const title = searchParams.get('title');
    if (jobId) params.set('jobId', jobId);
    if (title) params.set('title', title);
    return params.toString();
  }, [searchParams]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const returnTo = forwardedQuery
        ? `/apply/${requisitionId}?${forwardedQuery}`
        : `/apply/${requisitionId}`;
      router.replace(`/register?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }

    // Authenticated — redirect to the internal application flow
    const query = forwardedQuery ? `${forwardedQuery}&source=external` : 'source=external';
    router.replace(`/internal/apply/${requisitionId}?${query}`);
  }, [isAuthenticated, isLoading, requisitionId, forwardedQuery, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto" />
        <p className="mt-4 text-gray-600">Preparing your application...</p>
      </div>
    </div>
  );
}
