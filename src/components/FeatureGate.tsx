'use client';

import { ReactNode } from 'react';
import { useFeatureGate } from '@/contexts/FeatureGateContext';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * What to show while the flag state is still loading.
   *
   * <p>Defaults to the fallback, which is the honest choice for an inline widget: a brief "not
   * enabled" is closer to the truth than a brief nothing. A whole page should pass something
   * neutral instead — see the AI Tools route, where a blank screen reads as a broken page.
   */
  loading?: ReactNode;
}

/**
 * Renders children only when a feature flag is on.
 *
 * <p><b>Loading is not the same as off.</b> This returned `null` while the flag state
 * resolved, so every gated page flashed blank on load — including for tenants that do have the
 * feature. That was invisible on a small inline widget and looked like a broken page on a whole
 * route. The loading state is now its own branch, defaulting to the fallback so existing callers
 * get a message rather than nothing.
 */
export function FeatureGate({ feature, children, fallback = null, loading }: FeatureGateProps) {
  const { isFeatureEnabled, isLoading } = useFeatureGate();

  if (isLoading) {
    return <>{loading !== undefined ? loading : fallback}</>;
  }

  if (!isFeatureEnabled(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
