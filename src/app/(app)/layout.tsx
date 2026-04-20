'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { TenantProvider, useTenant } from '@/contexts/TenantContext';
import { FeatureGateProvider } from '@/contexts/FeatureGateContext';
import { ToastProvider } from '@/components/Toast';
import { useTenantBranding } from '@/hooks/useTenantBranding';

function BrandingApplier({ children }: { children: React.ReactNode }) {
  useTenantBranding();
  return <>{children}</>;
}

function TenantGate({ children }: { children: React.ReactNode }) {
  const { isLoading, error } = useTenant();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Organization Not Found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{error}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Check the URL and try again, or contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TenantProvider>
      <TenantGate>
        <ThemeProvider>
          <AuthProvider>
            <FeatureGateProvider>
              <ToastProvider>
                <BrandingApplier>
                  <LayoutProvider>
                    {children}
                  </LayoutProvider>
                </BrandingApplier>
              </ToastProvider>
            </FeatureGateProvider>
          </AuthProvider>
        </ThemeProvider>
      </TenantGate>
    </TenantProvider>
  );
}
