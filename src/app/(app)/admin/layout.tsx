'use client';

import { useSecurity } from '@/contexts/SecurityContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { hasRole, isLoading } = useSecurity();
  const router = useRouter();

  const isAdmin = hasRole('ADMIN') || hasRole('HR_MANAGER');

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}
