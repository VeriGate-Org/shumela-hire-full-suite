'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  MapPinIcon,
  EllipsisVerticalIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { InlineLoading } from '@/components/LoadingComponents';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

/* ---------- types ---------- */
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

/* ---------- helpers ---------- */
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

/** Pick a deterministic accent colour from the palette based on the employee id */
const AVATAR_PALETTES = [
  { bg: 'bg-icon-bg-navy', text: 'text-accent-navy', solid: 'bg-accent-navy' },
  { bg: 'bg-icon-bg-teal', text: 'text-accent-teal', solid: 'bg-accent-teal' },
  { bg: 'bg-icon-bg-gold', text: 'text-accent-gold', solid: 'bg-accent-gold' },
  { bg: 'bg-icon-bg-pink', text: 'text-accent-pink', solid: 'bg-accent-pink' },
] as const;

function avatarPalette(emp: DirectReport) {
  const hash = emp.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

function statusBadge(status?: string) {
  if (!status) return null;
  const upper = status.toUpperCase();
  let classes = 'bg-surface-teal text-accent-teal'; // default: active
  if (upper === 'ON_LEAVE' || upper === 'ON LEAVE')
    classes = 'bg-surface-gold text-accent-gold';
  if (upper === 'TERMINATED' || upper === 'INACTIVE')
    classes = 'bg-surface-pink text-accent-pink';

  const label =
    upper === 'ON_LEAVE'
      ? 'On Leave'
      : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${classes}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          upper === 'ACTIVE'
            ? 'bg-accent-teal'
            : upper === 'ON_LEAVE' || upper === 'ON LEAVE'
              ? 'bg-accent-gold'
              : 'bg-accent-pink'
        }`}
      />
      {label}
    </span>
  );
}

/* ---------- sub-components ---------- */
type ViewMode = 'grid' | 'list';

function StatCard({
  icon: Icon,
  value,
  label,
  palette,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: number;
  label: string;
  palette: 'navy' | 'teal' | 'gold' | 'pink';
}) {
  const iconBgMap = {
    navy: 'bg-icon-bg-navy text-accent-navy',
    teal: 'bg-icon-bg-teal text-accent-teal',
    gold: 'bg-icon-bg-gold text-accent-gold',
    pink: 'bg-icon-bg-pink text-accent-pink',
  };
  return (
    <div className="enterprise-card flex items-center gap-4 p-5 hover:-translate-y-px">
      <div
        className={`w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 ${iconBgMap[palette]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[1.75rem] font-extrabold leading-none text-foreground">
          {value}
        </p>
        <p className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ---------- main inner component ---------- */
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
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  /* ----- data fetch ----- */
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

  /* ----- derived data ----- */
  const departments = useMemo(
    () =>
      Array.from(new Set(reports.map((r) => r.department).filter(Boolean))).sort() as string[],
    [reports],
  );

  const statuses = useMemo(
    () =>
      Array.from(new Set(reports.map((r) => r.status).filter(Boolean))).sort() as string[],
    [reports],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter((r) => {
      if (deptFilter && r.department !== deptFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (q) {
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
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reports, search, deptFilter, statusFilter]);

  const activeCount = useMemo(
    () => reports.filter((r) => r.status?.toUpperCase() === 'ACTIVE').length,
    [reports],
  );

  const onLeaveCount = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.status?.toUpperCase() === 'ON_LEAVE' ||
          r.status?.toUpperCase() === 'ON LEAVE',
      ).length,
    [reports],
  );

  const showMissingEmployee = !user?.employeeId && requestedManagerId === 'me';

  /* ---------- render ---------- */
  return (
    <PageWrapper
      title="Employee Directory"
      subtitle="Manage and view all employees"
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Dashboard
          </button>
        </div>
      }
    >
      {/* --- Error / missing / loading states --- */}
      {showMissingEmployee ? (
        <div className="enterprise-card border-t-2 border-t-warning p-6">
          <p className="font-semibold text-foreground">No employee record linked</p>
          <p className="text-sm text-muted-foreground mt-1">
            Your line-manager view relies on an Employee record to surface direct
            reports. Ask HR to link your user account to an employee profile.
          </p>
        </div>
      ) : loading ? (
        <div className="enterprise-card p-6">
          <InlineLoading message="Loading your team..." />
        </div>
      ) : error ? (
        <div className="enterprise-card border-t-2 border-t-destructive p-6">
          <p className="font-semibold text-destructive">Failed to load team</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={UserGroupIcon}
          title="No direct reports"
          description="You don't have any direct reports assigned. If this looks wrong, ask HR to update reporting lines in employee records."
        />
      ) : (
        <div className="space-y-4">
          {/* ===== Stats Bar ===== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              icon={UserGroupIcon}
              value={reports.length}
              label="Total Employees"
              palette="navy"
            />
            <StatCard
              icon={CheckCircleIcon}
              value={activeCount}
              label="Active"
              palette="teal"
            />
            <StatCard
              icon={CalendarDaysIcon}
              value={onLeaveCount}
              label="On Leave Today"
              palette="gold"
            />
            <StatCard
              icon={UserPlusIcon}
              value={reports.length}
              label="Team Members"
              palette="pink"
            />
          </div>

          {/* ===== Filter Bar ===== */}
          <div className="enterprise-card p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Left: dropdowns */}
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="text-sm font-medium px-3 py-2 border border-border rounded-control bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm font-medium px-3 py-2 border border-border rounded-control bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Center: search */}
            <div className="relative flex-shrink-0 w-full md:w-80">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employees..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-control bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            {/* Right: view toggles */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                title="Grid View"
                onClick={() => setViewMode('grid')}
                className={`w-[38px] h-[38px] rounded-control border flex items-center justify-center transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                <Squares2X2Icon className="w-[18px] h-[18px]" />
              </button>
              <button
                type="button"
                title="List View"
                onClick={() => setViewMode('list')}
                className={`w-[38px] h-[38px] rounded-control border flex items-center justify-center transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                <ListBulletIcon className="w-[18px] h-[18px]" />
              </button>
            </div>
          </div>

          {/* ===== Results info ===== */}
          <p className="text-sm text-muted-foreground font-medium">
            Showing {filtered.length} of {reports.length}{' '}
            {reports.length === 1 ? 'person' : 'people'}
          </p>

          {/* ===== Grid View ===== */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((emp) => {
                const palette = avatarPalette(emp);
                return (
                  <div
                    key={emp.id}
                    className="enterprise-card p-5 relative hover:-translate-y-0.5 group"
                  >
                    {/* Three-dot menu */}
                    <button
                      type="button"
                      onClick={() => router.push(`/employee/${emp.id}`)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                      title="Actions"
                    >
                      <EllipsisVerticalIcon className="w-[18px] h-[18px]" />
                    </button>

                    {/* Card top: avatar + name */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden ${palette.solid}`}
                      >
                        {emp.profilePhotoUrl ? (
                          <img
                            src={emp.profilePhotoUrl}
                            alt=""
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          initials(emp)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground leading-tight truncate">
                          {fullName(emp)}
                        </p>
                        <p className="text-[0.8125rem] text-muted-foreground font-medium leading-tight truncate">
                          {emp.jobTitle || emp.email || ''}
                        </p>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border my-3.5" />

                    {/* Info rows */}
                    <div className="space-y-2 text-[0.8125rem]">
                      {emp.department && (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${palette.solid}`} />
                          <span className="text-foreground">{emp.department}</span>
                        </div>
                      )}
                      {emp.location && (
                        <div className="flex items-center gap-2 text-foreground">
                          <MapPinIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span>{emp.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        {statusBadge(emp.status)}
                      </div>
                    </div>

                    {/* Card bottom: View Profile link */}
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => router.push(`/employee/${emp.id}`)}
                        className="text-[0.8125rem] font-semibold text-primary uppercase tracking-wider hover:text-cta-hover transition-colors"
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== List / Table View ===== */}
          {viewMode === 'list' && (
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Department
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-[50px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((emp, idx) => {
                      const palette = avatarPalette(emp);
                      return (
                        <tr
                          key={emp.id}
                          className={`border-b border-border last:border-b-0 transition-colors hover:bg-surface-navy ${
                            idx % 2 === 1 ? 'bg-muted/30' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-[0.6875rem] font-bold text-white flex-shrink-0 overflow-hidden ${palette.solid}`}
                              >
                                {emp.profilePhotoUrl ? (
                                  <img
                                    src={emp.profilePhotoUrl}
                                    alt=""
                                    className="w-9 h-9 rounded-full object-cover"
                                  />
                                ) : (
                                  initials(emp)
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-foreground truncate">
                                  {fullName(emp)}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                  {emp.jobTitle || emp.email || ''}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {emp.department && (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-2 h-2 rounded-full flex-shrink-0 ${palette.solid}`}
                                />
                                <span className="text-foreground">
                                  {emp.department}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-foreground">
                            {emp.location || '--'}
                          </td>
                          <td className="px-4 py-3">
                            {statusBadge(emp.status)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => router.push(`/employee/${emp.id}`)}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                              title="Actions"
                            >
                              <EllipsisVerticalIcon className="w-[18px] h-[18px]" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== No results ===== */}
          {filtered.length === 0 && (
            <div className="enterprise-card py-12 px-8 text-center">
              <MagnifyingGlassIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No employees found
              </h3>
              <p className="text-[0.9375rem] text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}

          {/* ===== Pagination Bar ===== */}
          {filtered.length > 0 && (
            <div className="enterprise-card px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground font-medium">
                Showing 1-{filtered.length} of {filtered.length} employees
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled
                    className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    className="w-[34px] h-[34px] rounded-control border border-primary bg-primary text-primary-foreground flex items-center justify-center text-[0.8125rem] font-semibold"
                  >
                    1
                  </button>
                  <button
                    type="button"
                    disabled
                    className="w-[34px] h-[34px] rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
}

export default function TeamListPage() {
  return (
    <Suspense
      fallback={
        <PageWrapper title="Employee Directory" subtitle="Loading...">
          <InlineLoading />
        </PageWrapper>
      }
    >
      <TeamListInner />
    </Suspense>
  );
}
