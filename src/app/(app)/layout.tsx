'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { TenantProvider } from '@/contexts/TenantContext';
import { FeatureGateProvider } from '@/contexts/FeatureGateContext';
import { ToastProvider } from '@/components/Toast';
import { useTenantBranding } from '@/hooks/useTenantBranding';

function BrandingApplier({ children }: { children: React.ReactNode }) {
  useTenantBranding();
  return <>{children}</>;
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TenantProvider>
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
    </TenantProvider>
  );
}
