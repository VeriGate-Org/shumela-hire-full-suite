'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  plan: string;
  contactEmail: string;
  maxUsers: number;
  createdAt: string;
}

interface PageResponse {
  content: Tenant[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

const PLAN_STYLES: Record<string, string> = {
  TRIAL: 'bg-amber-50 text-amber-700 border border-amber-200',
  STARTER: 'bg-blue-50 text-blue-700 border border-blue-200',
  STANDARD: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ENTERPRISE: 'bg-violet-50 text-violet-700 border border-violet-200',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  TRIAL: 'bg-amber-50 text-amber-700 border border-amber-200',
  SUSPENDED: 'bg-red-50 text-red-700 border border-red-200',
  CANCELLED: 'bg-gray-50 text-gray-500 border border-gray-200',
};

export default function TenantsPage() {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [search, setSearch] = useState('');

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/platform/tenants?page=${page}&size=20`);
      if (response.ok) {
        const data: PageResponse = await response.json();
        setTenants(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
      } else {
        toast('Failed to load tenants', 'error');
      }
    } catch {
      toast('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = search
    ? tenants.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
        t.id.toLowerCase().includes(search.toLowerCase())
      )
    : tenants;

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Platform"
        title="Tenants"
        subtitle="Manage platform tenants and their subscriptions"
      />
      <div className="space-y-6">
        {/* Search */}
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-[2px] border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-charcoal dark:border-gray-700 dark:text-foreground"
          />
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-charcoal rounded-[2px] border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-[0.05em]">Tenant</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-[0.05em]">Subdomain</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-[0.05em]">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-[0.05em]">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 uppercase text-xs tracking-[0.05em]">Max Users</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">Loading tenants...</td>
                </tr>
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">No tenants found</td>
                </tr>
              ) : (
                filteredTenants.map(tenant => (
                  <tr key={tenant.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/platform/tenants/${tenant.id}`} className="flex items-center gap-3 group">
                        <div className="h-8 w-8 rounded-[2px] bg-primary/10 flex items-center justify-center">
                          <BuildingOfficeIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">{tenant.name}</div>
                          <div className="text-xs text-gray-500">{tenant.contactEmail}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{tenant.subdomain}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-[2px] text-xs font-medium ${PLAN_STYLES[tenant.plan] || 'bg-gray-50 text-gray-600'}`}>
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-[2px] text-xs font-medium ${STATUS_STYLES[tenant.status] || 'bg-gray-50 text-gray-600'}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{tenant.maxUsers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <span className="text-xs text-gray-500">{totalElements} tenants total</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1 rounded-[2px] hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <span className="text-xs text-gray-600">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1 rounded-[2px] hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
