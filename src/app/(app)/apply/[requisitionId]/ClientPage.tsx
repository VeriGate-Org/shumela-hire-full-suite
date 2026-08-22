'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
  const { isAuthenticated, isLoading } = useAuth();
  const requisitionId = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    // ['apply', '<requisitionId>']
    return parts.length >= 2 ? parts[1] : '';
  }, [pathname]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(`/register?returnTo=${encodeURIComponent(`/apply/${requisitionId}`)}`);
      return;
    }

    // Authenticated — redirect to the internal application flow
    router.replace(`/internal/apply/${requisitionId}?source=external`);
  }, [isAuthenticated, isLoading, requisitionId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto" />
        <p className="mt-4 text-gray-600">Preparing your application...</p>
      </div>
    </div>
  );
}
