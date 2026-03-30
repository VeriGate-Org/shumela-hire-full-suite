'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const requisitionId = params.requisitionId as string;

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
