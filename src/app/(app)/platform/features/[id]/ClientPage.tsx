'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface PlatformFeature {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  includedPlans: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TenantAdoption {
  id: string;
  name: string;
  plan: string;
  enabled: boolean;
  source: 'PLAN_DEFAULT' | 'OVERRIDE';
}

const PLAN_STYLES: Record<string, string> = {
  TRIAL: 'bg-amber-50 text-amber-700',
  STARTER: 'bg-blue-50 text-blue-700',
  STANDARD: 'bg-emerald-50 text-emerald-700',
  ENTERPRISE: 'bg-violet-50 text-violet-700',
};

export default function FeatureDetailPage() {
  const params = useParams();
  const featureId = params.id as string;
  const { toast } = useToast();
  const [feature, setFeature] = useState<PlatformFeature | null>(null);
  const [tenants, setTenants] = useState<TenantAdoption[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch feature details from all features list
      const featuresRes = await apiFetch('/api/platform/features');
      if (featuresRes.ok) {
        const allFeatures: PlatformFeature[] = await featuresRes.json();
        const found = allFeatures.find(f => f.id === Number(featureId));
        if (found) setFeature(found);
      }

      // Fetch all tenants and their feature status
      const tenantsRes = await apiFetch('/api/platform/tenants?page=0&size=100');
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        const adoptionList: TenantAdoption[] = [];

        for (const tenant of tenantsData.content) {
          if (tenant.id === 'platform') continue;
          const featRes = await apiFetch(`/api/platform/tenants/${tenant.id}/features`);
          if (featRes.ok) {
            const features = await featRes.json();
            const match = features.find((f: any) => f.featureId === Number(featureId));
            if (match) {
              adoptionList.push({
                id: tenant.id,
                name: tenant.name,
                plan: tenant.plan,
                enabled: match.enabled,
                source: match.source,
              });
            }
          }
        }

        setTenants(adoptionList);
      }
    } catch {
      toast('Failed to load feature details', 'error');
    } finally {
      setLoading(false);
    }
  }, [featureId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <PageWrapper title="Loading...">
        <div className="flex items-center justify-center py-20 text-gray-500">Loading feature details...</div>
      </PageWrapper>
    );
  }

  if (!feature) {
    return (
      <PageWrapper title="Feature Not Found">
        <div className="text-center py-20 text-gray-500">Feature not found</div>
      </PageWrapper>
    );
  }

  const enabledCount = tenants.filter(t => t.enabled).length;
  const overrideCount = tenants.filter(t => t.source === 'OVERRIDE').length;
  const plans = feature.includedPlans?.split(',') || [];

  return (
    <PageWrapper
      title={feature.name}
      subtitle={feature.code}
      actions={
        <Link href="/platform/features" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to features
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Feature Info */}
        <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Category</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">{feature.category}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Status</div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${feature.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                <span className="text-sm text-gray-900 dark:text-gray-100">{feature.active ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Included Plans</div>
              <div className="flex gap-1 flex-wrap">
                {plans.map(plan => (
                  <span key={plan} className={`px-2 py-0.5 rounded-[2px] text-xs font-medium ${PLAN_STYLES[plan] || 'bg-gray-100 text-gray-600'}`}>
                    {plan}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Adoption</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{enabledCount} / {tenants.length} tenants</div>
            </div>
          </div>
          {feature.description && (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
          )}
        </div>

        {/* Tenant Adoption List */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-[0.05em] mb-3">
            Tenant Adoption ({overrideCount} override{overrideCount !== 1 ? 's' : ''})
          </h3>
          <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Tenant</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Plan</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Source</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-gray-500">No tenant data available</td>
                  </tr>
                ) : (
                  tenants.map(tenant => (
                    <tr key={tenant.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 px-4">
                        <Link href={`/platform/tenants/${tenant.id}`} className="font-medium text-gray-900 dark:text-gray-100 hover:text-primary transition-colors">
                          {tenant.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-[2px] text-xs font-medium ${PLAN_STYLES[tenant.plan] || 'bg-gray-100 text-gray-600'}`}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tenant.enabled ? (
                          <div className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span className="text-xs">Enabled</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <XCircleIcon className="h-4 w-4" />
                            <span className="text-xs">Disabled</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium ${
                          tenant.source === 'OVERRIDE'
                            ? 'bg-primary/5 text-primary border border-primary/20'
                            : 'bg-gray-50 text-gray-500 border border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                        }`}>
                          {tenant.source === 'PLAN_DEFAULT' ? 'Plan Default' : 'Override'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
