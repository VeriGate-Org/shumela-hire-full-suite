'use client';

import { useEffect } from 'react';
import { useTenant } from '@/contexts/TenantContext';
import { useFeatureGate } from '@/contexts/FeatureGateContext';

export function useTenantBranding() {
  const { branding } = useTenant();
  const { isFeatureEnabled } = useFeatureGate();
  const enabled = isFeatureEnabled('CUSTOM_BRANDING');

  useEffect(() => {
    if (!enabled || !branding) return;

    const root = document.documentElement;
    const overrides: [string, string | undefined][] = [
      ['--primary', branding.primaryColor],
      ['--secondary', branding.secondaryColor],
      ['--cta', branding.accentColor],
    ];

    const applied: string[] = [];
    for (const [prop, value] of overrides) {
      if (value) {
        root.style.setProperty(prop, value);
        applied.push(prop);
      }
    }

    return () => {
      for (const prop of applied) {
        root.style.removeProperty(prop);
      }
    };
  }, [branding, enabled]);

  return { branding: enabled ? branding : null, enabled };
}
