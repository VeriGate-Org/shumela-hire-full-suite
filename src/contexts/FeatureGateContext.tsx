'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { FEATURE_MINIMUM_PLAN, MODULE_FEATURES } from '@/config/featurePlanMap';
import { apiFetch } from '@/lib/api-fetch';

interface FeatureGateContextType {
  enabledFeatures: string[];
  isFeatureEnabled: (code: string) => boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const FeatureGateContext = createContext<FeatureGateContextType | undefined>(undefined);

export function useFeatureGate() {
  const context = useContext(FeatureGateContext);
  if (context === undefined) {
    throw new Error('useFeatureGate must be used within a FeatureGateProvider');
  }
  return context;
}

const PLAN_RANK: Record<string, number> = { STARTER: 0, STANDARD: 1, ENTERPRISE: 2 };

/**
 * Derive enabled features from module codes.
 * Splits the CSV, unions features from each module via the MODULE_FEATURES map.
 */
function deriveFromModules(modules: string): string[] {
  const moduleCodes = modules.split(',').map(c => c.trim()).filter(Boolean);
  const featureSet = new Set<string>();
  for (const code of moduleCodes) {
    const features = MODULE_FEATURES[code];
    if (features) {
      for (const f of features) {
        featureSet.add(f);
      }
    }
  }
  return Array.from(featureSet);
}

/**
 * Derive enabled features from the tenant plan (and optionally modules) using
 * the client-side feature-plan map. Used as a fallback when the backend API
 * is unavailable.
 *
 * If modules are set, module-based derivation is used.
 * Otherwise, standard plans use hierarchical tier derivation.
 */
function deriveFromPlan(plan: string | undefined, modules: string | undefined): string[] {
  // Module-based resolution takes priority when modules are set
  if (modules) {
    return deriveFromModules(modules);
  }

  if (!plan) return [];
  const upper = plan.toUpperCase();

  // Standard plans use hierarchical tier derivation
  const tenantRank = PLAN_RANK[upper] ?? -1;
  if (tenantRank < 0) return [];
  return Object.entries(FEATURE_MINIMUM_PLAN)
    .filter(([, minPlan]) => (PLAN_RANK[minPlan.toUpperCase()] ?? Infinity) <= tenantRank)
    .map(([code]) => code);
}

export function FeatureGateProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { tenant } = useTenant();
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeatures = useCallback(async () => {
    if (!isAuthenticated) {
      setEnabledFeatures([]);
      return;
    }

    // Platform owners get all features client-side
    if (user?.role === 'PLATFORM_OWNER') {
      setEnabledFeatures(['__ALL__']);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiFetch('/api/features/enabled');
      if (response.ok) {
        const features: string[] = await response.json();
        // Use API response when it returns features; fall back to plan/module
        // derivation when backend returns empty (e.g. features not seeded).
        setEnabledFeatures(features.length > 0 ? features : deriveFromPlan(tenant?.plan, tenant?.modules));
      } else {
        setEnabledFeatures(deriveFromPlan(tenant?.plan, tenant?.modules));
      }
    } catch {
      setEnabledFeatures(deriveFromPlan(tenant?.plan, tenant?.modules));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.role, tenant?.plan, tenant?.modules]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const isFeatureEnabled = useCallback((code: string): boolean => {
    if (enabledFeatures.includes('__ALL__')) return true;
    return enabledFeatures.includes(code);
  }, [enabledFeatures]);

  return (
    <FeatureGateContext.Provider value={{
      enabledFeatures,
      isFeatureEnabled,
      isLoading,
      refresh: fetchFeatures,
    }}>
      {children}
    </FeatureGateContext.Provider>
  );
}
