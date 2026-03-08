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
        className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full shadow-sm text-gold-500 bg-transparent hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        <UserGroupIcon className="w-4 h-4 mr-2" />
        Group Mappings
      </Link>
      <button
        onClick={loadConfig}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 uppercase tracking-wider"
      >
        <ArrowPathIcon className="w-4 h-4 mr-2" />
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
          <div className="bg-white rounded-sm shadow p-8 text-center border border-gray-200">
            <ShieldCheckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Feature Not Available</h3>
            <p className="text-sm text-gray-600">
              Active Directory SSO integration is not enabled for your tenant.
              Contact your administrator to enable this feature.
            </p>
          </div>
        </PageWrapper>
      }
    >
      <PageWrapper
        title="Active Directory SSO"
        subtitle="Configure Single Sign-On with Azure AD, ADFS, Okta, or SAML providers"
        actions={actions}
      >
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShieldCheckIcon className="w-8 h-8 text-violet-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">SSO Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {config?.isEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Cog6ToothIcon className="w-8 h-8 text-gold-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Provider</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {config?.provider
                      ? config.provider.replace(/_/g, ' ')
                      : 'Not Configured'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Auto-Provision</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {config?.autoProvisionUsers ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Config Form */}
          {loading ? (
            <div className="bg-white rounded-sm shadow p-8 text-center">
              <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading SSO configuration...</p>
            </div>
          ) : (
            <SsoConfigForm initialConfig={config} onSaved={handleSaved} />
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
