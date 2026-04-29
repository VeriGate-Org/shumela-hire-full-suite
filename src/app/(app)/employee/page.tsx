'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { InlineLoading } from '@/components/LoadingComponents';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

interface DirectReport {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  status?: string;
  profilePhotoUrl?: string;
}

function fullName(emp: DirectReport): string {
  return (
    emp.fullName ||
    [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim() ||
    'Unknown'
  );
}

function initials(emp: DirectReport): string {
  const first = emp.firstName?.[0] || '';
  const last = emp.lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function TeamListInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const requestedManagerId = searchParams.get('managerId') || 'me';
  const managerId =
    requestedManagerId === 'me' ? user?.employeeId || '' : requestedManagerId;

  const [reports, setReports] = useState<DirectReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!managerId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/employees/${managerId}/direct-reports`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setReports(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load direct reports');
          setReports([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [managerId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return reports;
    return reports.filter((r) => {
      const haystack = [
        fullName(r),
        r.email,
        r.jobTitle,
        r.department,
        r.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [reports, search]);

  const showMissingEmployee = !user?.employeeId && requestedManagerId === 'me';

  return (
    <PageWrapper
      title="My Team"
      subtitle="Direct reports who roll up to you"
      actions={
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </button>
      }
    >
      {showMissingEmployee ? (
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-orange-500 p-6">
          <p className="font-semibold text-gray-900">No employee record linked</p>
          <p className="text-sm text-gray-600 mt-1">
            Your line-manager view relies on an Employee record to surface direct
            reports. Ask HR to link your user account to an employee profile.
          </p>
        </div>
      ) : loading ? (
        <div className="enterprise-card p-6">
          <InlineLoading message="Loading your team..." />
        </div>
      ) : error ? (
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-red-500 p-6">
          <p className="font-semibold text-red-700">Failed to load team</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="No direct reports"
          description="You don't have any direct reports assigned. If this looks wrong, ask HR to update reporting lines in employee records."
        />
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, role, department..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
            />
          </div>

          <div className="bg-white rounded-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filtered.length} of {reports.length}{' '}
                {reports.length === 1 ? 'person' : 'people'}
              </p>
            </div>
            <ul className="divide-y divide-gray-100">
              {filtered.map((emp) => (
                <li key={emp.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/employee/${emp.id}`)}
                    className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-semibold flex-shrink-0 overflow-hidden">
                      {emp.profilePhotoUrl ? (
                        <img
                          src={emp.profilePhotoUrl}
                          alt=""
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        initials(emp)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {fullName(emp)}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {[emp.jobTitle, emp.department].filter(Boolean).join(' · ') ||
                          emp.email ||
                          ''}
                      </p>
                    </div>
                    {emp.status && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          emp.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {emp.status}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

export default function TeamListPage() {
  return (
    <Suspense fallback={<PageWrapper title="My Team" subtitle="Loading..."><InlineLoading /></PageWrapper>}>
      <TeamListInner />
    </Suspense>
  );
}
