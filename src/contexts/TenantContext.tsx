'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getTenantSubdomain } from '@/lib/tenant-utils';
import { apiFetch } from '@/lib/api-fetch';
import { TenantBranding, TenantSettings } from '@/types/tenantBranding';

interface TenantInfo {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  settings?: string;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  tenantId: string;
  isLoading: boolean;
  error: string | null;
  branding: TenantBranding | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branding, setBranding] = useState<TenantBranding | null>(null);

  const subdomain = typeof window !== 'undefined' ? getTenantSubdomain() : 'default';

  const resolveTenant = useCallback(async () => {
    if (subdomain === 'default') {
      setTenant({ id: 'default', name: 'Default Organization', subdomain: 'default', plan: 'STANDARD' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiFetch(`/api/public/tenants/resolve/${subdomain}`);
      if (response.ok) {
        const data: TenantInfo = await response.json();
        setTenant(data);

        // Parse settings and extract branding
        if (data.settings) {
          try {
            const parsed: TenantSettings = JSON.parse(data.settings);
            if (parsed.branding) {
              const brandingData = { ...parsed.branding };
              // If logoKey exists, fetch signed URL
              if (brandingData.logoKey) {
                try {
                  const logoRes = await apiFetch(`/api/public/tenants/resolve/${subdomain}/logo`);
                  if (logoRes.ok) {
                    const { url } = await logoRes.json();
                    brandingData.logoUrl = url;
                  }
                } catch {
                  // Logo URL fetch failed — continue without it
                }
              }
              setBranding(brandingData);
            }
          } catch {
            // Settings JSON parse failed — ignore
          }
        }
      } else {
        setError('Organization not found');
      }
    } catch {
      setError('Failed to resolve organization');
    } finally {
      setIsLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    resolveTenant();
  }, [resolveTenant]);

  const tenantId = tenant?.id || 'default';

  return (
    <TenantContext.Provider value={{ tenant, tenantId, isLoading, error, branding }}>
      {children}
    </TenantContext.Provider>
  );
};
