'use client';

import Link from 'next/link';
import React from 'react';
import IdentityBand from '@/components/record/IdentityBand';

interface PlatformOwnerDashboardProps {
  /** Handed down by the page, because this component owns the band. */
  actions?: React.ReactNode;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export default function PlatformOwnerDashboard({
  selectedTimeframe,
  onTimeframeChange, actions }: PlatformOwnerDashboardProps) {
  return (
    <div className="space-y-4">
      {/* No figures: this screen fetches nothing and holds no state. A band with invented numbers
          on it would be worse than a band without any. */}
      <IdentityBand
        eyebrow="Platform"
        title="Platform Owner"
        subtitle="Tenants, feature flags and the platform control centre"
       actions={actions}
      />
      <div className="bg-card rounded-[10px] border border-border p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Platform Control Center</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Manage tenants and platform features across environments.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedTimeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-full"
            >
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
              <option value="90days">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/platform/tenants"
          className="bg-card rounded-[10px] border border-border p-5 hover:shadow-sm transition-shadow"
        >
          <h4 className="text-base font-semibold text-foreground">Tenant Management</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Review tenants, domains, and feature entitlements.
          </p>
        </Link>

        <Link
          href="/platform/features"
          className="bg-card rounded-[10px] border border-border p-5 hover:shadow-sm transition-shadow"
        >
          <h4 className="text-base font-semibold text-foreground">Feature Registry</h4>
          <p className="text-sm text-muted-foreground mt-1">
            Define platform features and control rollout.
          </p>
        </Link>
      </div>
    </div>
  );
}
