'use client';

import React from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SsoGroupMappingTable from '@/components/integrations/SsoGroupMappingTable';
import {
  ShieldCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function SsoMappingsPage() {
  const actions = (
    <div className="flex items-center gap-3">
      <Link
        href="/integrations/sso"
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 uppercase tracking-wider"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to SSO Config
      </Link>
    </div>
  );

  return (
    <FeatureGate
      feature="AD_SSO"
      fallback={
        <PageWrapper
          title="SSO Group Mappings"
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
        title="AD Group Mappings"
        subtitle="Map Active Directory security groups to ShumelaHire application roles"
        actions={actions}
      >
        <SsoGroupMappingTable />
      </PageWrapper>
    </FeatureGate>
  );
}
