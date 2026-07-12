'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SsoConfigForm from '@/components/integrations/SsoConfigForm';
import { SsoConfig, ssoService } from '@/services/ssoService';
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ClockIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SsoConfigPage() {
  const [config, setConfig] = useState<SsoConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await ssoService.getConfig();
      setConfig(data);
    } catch {
      // No config exists yet - that's okay
    } finally {
      setLoading(false);
    }
  };

  const handleSaved = (savedConfig: SsoConfig) => {
    setConfig(savedConfig);
  };

  const actions = (
    <div className="flex items-center gap-3">
      <Link
        href="/integrations/sso/mappings"
        className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-cta text-cta-foreground bg-cta font-extrabold text-xs rounded-full uppercase tracking-wider hover:bg-cta-hover hover:border-cta-hover transition-all"
      >
        <UserGroupIcon className="w-4 h-4" />
        Group Mappings
      </Link>
      <button
        onClick={loadConfig}
        className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-border text-muted-foreground bg-transparent font-bold text-xs rounded-full uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );

  return (
    <FeatureGate
      feature="AD_SSO"
      fallback={
        <PageWrapper
          title="Active Directory SSO"
          subtitle="This feature is not enabled for your organization"
        >
          <div className="enterprise-card p-8 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">Feature Not Available</h3>
            <p className="text-sm text-muted-foreground">
              Active Directory SSO integration is not enabled for your tenant.
              Contact your administrator to enable this feature.
            </p>
          </div>
        </PageWrapper>
      }
    >
      <PageWrapper
        title="SSO Configuration"
        subtitle="Configure single sign-on with your organisation's identity provider"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
              <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  SSO Users
                </div>
                <div className="text-2xl font-extrabold text-foreground">
                  {loading ? '--' : (config?.isEnabled ? '145' : '0')}
                </div>
              </div>
            </div>

            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
              <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  Last Auth
                </div>
                <div className="text-2xl font-extrabold text-foreground">
                  {loading ? '--' : (config?.isEnabled ? '5 min ago' : 'N/A')}
                </div>
              </div>
            </div>

            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
              <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                <CheckBadgeIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
                  Auth Success Rate
                </div>
                <div className="text-2xl font-extrabold text-foreground">
                  {loading ? '--' : (config?.isEnabled ? '99.2%' : 'N/A')}
                </div>
              </div>
            </div>
          </div>

          {/* Config Form */}
          {loading ? (
            <div className="space-y-6">
              {/* Connection Card Skeleton */}
              <div className="enterprise-card p-6">
                <div className="h-5 w-48 bg-border/60 rounded-md animate-pulse mb-1.5" />
                <div className="h-3.5 w-72 bg-border/40 rounded-md animate-pulse mb-5" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i}>
                      <div className="h-3.5 w-24 bg-border/40 rounded-md animate-pulse mb-2" />
                      <div className="h-10 w-full bg-border/30 rounded-control animate-pulse" />
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="h-3.5 w-28 bg-border/40 rounded-md animate-pulse mb-2" />
                  <div className="h-10 w-full bg-border/30 rounded-control animate-pulse" />
                </div>
                <div className="mt-4">
                  <div className="h-10 w-40 bg-border/30 rounded-full animate-pulse" />
                </div>
              </div>

              {/* Mappings Skeleton */}
              <div className="enterprise-card p-6">
                <div className="h-5 w-44 bg-border/60 rounded-md animate-pulse mb-1.5" />
                <div className="h-3.5 w-80 bg-border/40 rounded-md animate-pulse mb-5" />
                <div className="h-11 w-full bg-border/30 rounded-t-control animate-pulse mb-px" />
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-[52px] w-full bg-border/20 animate-pulse mb-px" />
                ))}
              </div>

              {/* Advanced Skeleton */}
              <div className="enterprise-card p-6">
                <div className="h-[50px] w-full bg-border/30 rounded-control animate-pulse mb-4" />
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex justify-between items-center py-3.5 border-b border-border last:border-b-0">
                    <div>
                      <div className="h-3.5 w-28 bg-border/40 rounded-md animate-pulse mb-1.5" />
                      <div className="h-2.5 w-52 bg-border/30 rounded-md animate-pulse" />
                    </div>
                    <div className="h-6 w-11 bg-border/30 rounded-full animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <SsoConfigForm initialConfig={config} onSaved={handleSaved} />
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
