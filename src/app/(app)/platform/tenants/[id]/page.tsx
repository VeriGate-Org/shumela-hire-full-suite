'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  contactEmail: string;
  maxUsers: number;
}

interface FeatureSummary {
  featureId: number;
  code: string;
  name: string;
  category: string;
  enabled: boolean;
  source: 'PLAN_DEFAULT' | 'OVERRIDE';
  planDefault: boolean;
  reason: string | null;
  expiresAt: string | null;
}

const SOURCE_STYLES = {
  PLAN_DEFAULT: 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  OVERRIDE: 'bg-primary/5 text-primary border border-primary/20',
};

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [features, setFeatures] = useState<FeatureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [revertFeature, setRevertFeature] = useState<FeatureSummary | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tenantRes, featuresRes] = await Promise.all([
        apiFetch(`/api/platform/tenants/${tenantId}`),
        apiFetch(`/api/platform/tenants/${tenantId}/features`),
      ]);

      if (tenantRes.ok) setTenant(await tenantRes.json());
      if (featuresRes.ok) setFeatures(await featuresRes.json());
    } catch {
      toast('Failed to load tenant details', 'error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleFeature = async (feature: FeatureSummary) => {
    setUpdating(feature.featureId);
    try {
      const newEnabled = !feature.enabled;
      const response = await apiFetch(`/api/platform/tenants/${tenantId}/features/${feature.featureId}`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: newEnabled,
          reason: newEnabled ? 'Manually granted by platform owner' : 'Manually revoked by platform owner',
          grantedBy: 'platform-admin',
        }),
      });

      if (response.ok) {
        setFeatures(prev =>
          prev.map(f =>
            f.featureId === feature.featureId
              ? { ...f, enabled: newEnabled, source: 'OVERRIDE' as const }
              : f
          )
        );
        toast(`${feature.name} ${newEnabled ? 'enabled' : 'disabled'}`, 'success');
      } else {
        toast('Failed to update feature', 'error');
      }
    } catch {
      toast('Failed to update feature', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const revertToDefault = (feature: FeatureSummary) => {
    setRevertFeature(feature);
  };

  const confirmRevertToDefault = async () => {
    if (!revertFeature) return;
    const feature = revertFeature;
    setRevertFeature(null);
    setUpdating(feature.featureId);
    try {
      const response = await apiFetch(`/api/platform/tenants/${tenantId}/features/${feature.featureId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFeatures(prev =>
          prev.map(f =>
            f.featureId === feature.featureId
              ? { ...f, enabled: f.planDefault, source: 'PLAN_DEFAULT' as const, reason: null }
              : f
          )
        );
        toast(`${feature.name} reverted to plan default`, 'success');
      } else {
        toast('Failed to revert feature', 'error');
      }
    } catch {
      toast('Failed to revert feature', 'error');
    } finally {
      setUpdating(null);
    }
  };

  // Group features by category
  const categorized = features.reduce<Record<string, FeatureSummary[]>>((acc, f) => {
    if (!acc[f.category]) acc[f.category] = [];
    acc[f.category].push(f);
    return acc;
  }, {});

  if (loading) {
    return (
      <PageWrapper title="Loading...">
        <div className="flex items-center justify-center py-20 text-gray-500">Loading tenant details...</div>
      </PageWrapper>
    );
  }

  if (!tenant) {
    return (
      <PageWrapper title="Tenant Not Found">
        <div className="text-center py-20 text-gray-500">Tenant not found</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={tenant.name}
      subtitle={`${tenant.subdomain} \u00B7 ${tenant.plan} plan \u00B7 ${tenant.status}`}
      actions={
        <Link href="/platform/tenants" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to tenants
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Tenant Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Contact', value: tenant.contactEmail },
            { label: 'Max Users', value: String(tenant.maxUsers) },
            { label: 'Features Enabled', value: String(features.filter(f => f.enabled).length) + ' / ' + features.length },
            { label: 'Overrides', value: String(features.filter(f => f.source === 'OVERRIDE').length) },
          ].map(stat => (
            <div key={stat.label} className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-4">
              <div className="text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">{stat.label}</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Feature Grid */}
        {Object.entries(categorized).map(([category, categoryFeatures]) => (
          <div key={category}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-[0.05em] mb-3">
              {category}
            </h3>
            <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] divide-y divide-gray-100 dark:divide-gray-800">
              {categoryFeatures.map(feature => (
                <div key={feature.featureId} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {feature.enabled ? (
                      <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-300 dark:text-gray-600" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{feature.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-medium ${SOURCE_STYLES[feature.source]}`}>
                          {feature.source === 'PLAN_DEFAULT' ? 'Plan Default' : 'Override'}
                        </span>
                        {feature.reason && (
                          <span className="text-[10px] text-gray-400">{feature.reason}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {feature.source === 'OVERRIDE' && (
                      <button
                        onClick={() => revertToDefault(feature)}
                        disabled={updating === feature.featureId}
                        className="p-1 text-gray-400 hover:text-primary transition-colors disabled:opacity-40"
                        title="Revert to plan default"
                      >
                        <ArrowPathIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => toggleFeature(feature)}
                      disabled={updating === feature.featureId}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
                        feature.enabled
                          ? 'bg-primary'
                          : 'bg-gray-200 dark:bg-gray-700'
                      } ${updating === feature.featureId ? 'opacity-40' : ''}`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                          feature.enabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ConfirmDialog
        open={revertFeature !== null}
        title="Revert to Plan Default"
        message={`Are you sure you want to revert "${revertFeature?.name}" to the plan default? The current override will be removed.`}
        confirmLabel="Revert"
        variant="warning"
        onConfirm={confirmRevertToDefault}
        onCancel={() => setRevertFeature(null)}
      />
    </PageWrapper>
  );
}
