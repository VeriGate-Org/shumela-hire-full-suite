'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  DocumentChartBarIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { apiFetch } from '@/lib/api-fetch';
import { DashboardWidget } from '../../dashboard';

interface ExecutiveDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface HrOverview {
  headcount?: {
    totalEmployees?: number;
    activeEmployees?: number;
    onLeave?: number;
    onProbation?: number;
    newHiresThisMonth?: number;
    terminationsThisMonth?: number;
  };
  turnover?: {
    annualTurnoverRate?: number;
    monthlyTurnoverRates?: Array<{ month: string; rate: number }>;
  };
  departmentDistribution?: Array<{ department: string; count: number; percentage: number }>;
  kpis?: {
    costPerHire?: number;
    timeToFillDays?: number;
    offerAcceptanceRate?: number;
    employeeSatisfactionScore?: number;
  };
}

interface LeadershipMember {
  id: string;
  name?: string;
  title?: string;
  department?: string;
  role?: string;
}

interface Requisition {
  id: string;
  title?: string;
  jobTitle?: string;
  department?: string;
  status?: string;
  createdAt?: string;
  hiringManagerName?: string;
}

interface KpiTileProps {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  tone: 'gold' | 'green' | 'orange' | 'red' | 'violet' | 'blue';
  href?: string;
  onClick?: () => void;
  hint?: string;
}

const toneClasses: Record<KpiTileProps['tone'], string> = {
  gold: 'text-gold-700 bg-gold-50',
  green: 'text-green-700 bg-green-50',
  orange: 'text-orange-700 bg-orange-50',
  red: 'text-red-700 bg-red-50',
  violet: 'text-violet-700 bg-violet-50',
  blue: 'text-blue-700 bg-blue-50',
};

function KpiTile({ label, value, icon: Icon, tone, href, onClick, hint }: KpiTileProps) {
  const router = useRouter();
  const handleClick = () => {
    if (onClick) onClick();
    else if (href) router.push(href);
  };
  const isClickable = Boolean(href || onClick);
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={`bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-4 text-left w-full transition-shadow ${
        isClickable ? 'hover:shadow-md cursor-pointer' : 'cursor-default'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
          {hint && <p className="mt-1 text-xs text-gray-500 truncate">{hint}</p>}
        </div>
        <div className={`p-2 rounded-full ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

function formatDate(value?: string): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return value;
  }
}

function formatCurrencyZar(value?: number): string {
  if (value == null || Number.isNaN(value)) return '—';
  if (value >= 1_000_000) return `R${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `R${(value / 1_000).toFixed(0)}K`;
  return `R${Math.round(value).toLocaleString()}`;
}

export default function ExecutiveDashboard({ selectedTimeframe: _selectedTimeframe }: ExecutiveDashboardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hrOverview, setHrOverview] = useState<HrOverview | null>(null);
  const [departmentCounts, setDepartmentCounts] = useState<Record<string, number>>({});
  const [leadership, setLeadership] = useState<LeadershipMember[]>([]);
  const [openRequisitions, setOpenRequisitions] = useState<Requisition[]>([]);
  const [pendingRequisitions, setPendingRequisitions] = useState<Requisition[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      setLoading(true);

      const [
        hrOverviewRes,
        deptCountsRes,
        leadershipRes,
        openReqsRes,
        pendingReqsRes,
      ] = await Promise.allSettled([
        apiFetch('/api/analytics/hr-overview'),
        apiFetch('/api/employees/department-counts'),
        apiFetch('/api/executive/leadership/team'),
        apiFetch('/api/requisitions?status=APPROVED&size=10'),
        apiFetch('/api/requisitions?status=PENDING_APPROVAL&size=10'),
      ]);

      if (cancelled) return;

      if (hrOverviewRes.status === 'fulfilled' && hrOverviewRes.value.ok) {
        try {
          const data = await hrOverviewRes.value.json();
          setHrOverview(data || null);
        } catch { /* keep null */ }
      }

      if (deptCountsRes.status === 'fulfilled' && deptCountsRes.value.ok) {
        try {
          const data = await deptCountsRes.value.json();
          if (data && typeof data === 'object') {
            setDepartmentCounts(data as Record<string, number>);
          }
        } catch { /* keep empty */ }
      }

      if (leadershipRes.status === 'fulfilled' && leadershipRes.value.ok) {
        try {
          const data = await leadershipRes.value.json();
          setLeadership(Array.isArray(data) ? data : []);
        } catch { /* keep empty */ }
      }

      if (openReqsRes.status === 'fulfilled' && openReqsRes.value.ok) {
        try {
          const data = await openReqsRes.value.json();
          const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
          setOpenRequisitions(items);
        } catch { /* keep empty */ }
      }

      if (pendingReqsRes.status === 'fulfilled' && pendingReqsRes.value.ok) {
        try {
          const data = await pendingReqsRes.value.json();
          const items = Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
          setPendingRequisitions(items);
        } catch { /* keep empty */ }
      }

      setLoading(false);
    }

    fetchAll();
    return () => { cancelled = true; };
  }, []);

  const headcount = hrOverview?.headcount;
  const turnoverRate = hrOverview?.turnover?.annualTurnoverRate;
  const kpis = hrOverview?.kpis;

  const departmentEntries = useMemo(() => {
    if (hrOverview?.departmentDistribution?.length) {
      return hrOverview.departmentDistribution
        .map((d) => ({ name: d.department, count: d.count, percentage: d.percentage }))
        .sort((a, b) => b.count - a.count);
    }
    const total = Object.values(departmentCounts).reduce((s, n) => s + (Number(n) || 0), 0);
    return Object.entries(departmentCounts)
      .map(([name, count]) => ({
        name,
        count: Number(count) || 0,
        percentage: total > 0 ? Math.round((Number(count) * 1000) / total) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [hrOverview?.departmentDistribution, departmentCounts]);

  const totalHeadcount =
    headcount?.totalEmployees ??
    departmentEntries.reduce((s, d) => s + d.count, 0);

  const activeHeadcount = headcount?.activeEmployees ?? totalHeadcount;
  const newHiresMonth = headcount?.newHiresThisMonth ?? 0;
  const terminationsMonth = headcount?.terminationsThisMonth ?? 0;
  const departmentCount = departmentEntries.length;
  const openRequisitionsCount = openRequisitions.length;
  const pendingRequisitionsCount = pendingRequisitions.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-200 p-4 animate-pulse h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-sm border border-gray-200 p-6 animate-pulse h-64" />
          <div className="bg-white rounded-sm border border-gray-200 p-6 animate-pulse h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiTile
          label="Total Headcount"
          value={totalHeadcount.toLocaleString()}
          icon={UserGroupIcon}
          tone="violet"
          href="/executive/overview"
          hint={`${activeHeadcount.toLocaleString()} active`}
        />
        <KpiTile
          label="New Hires (Month)"
          value={newHiresMonth}
          icon={ArrowTrendingUpIcon}
          tone="green"
          href="/reports"
          hint={terminationsMonth > 0 ? `${terminationsMonth} terminations` : undefined}
        />
        <KpiTile
          label="Annual Turnover"
          value={turnoverRate != null ? `${turnoverRate}%` : '—'}
          icon={ArrowTrendingDownIcon}
          tone="orange"
          href="/executive/overview"
        />
        <KpiTile
          label="Open Requisitions"
          value={openRequisitionsCount}
          icon={BriefcaseIcon}
          tone="gold"
          href="/requisitions"
          hint={pendingRequisitionsCount > 0 ? `${pendingRequisitionsCount} pending approval` : undefined}
        />
        <KpiTile
          label="Departments"
          value={departmentCount}
          icon={BuildingOffice2Icon}
          tone="blue"
          href="/executive/overview"
        />
        <KpiTile
          label="Time to Fill"
          value={kpis?.timeToFillDays != null ? `${kpis.timeToFillDays}d` : '—'}
          icon={ChartBarIcon}
          tone="red"
          href="/reports"
          hint={kpis?.costPerHire ? `${formatCurrencyZar(kpis.costPerHire)} / hire` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <DashboardWidget
            id="executive-department-distribution"
            title="Headcount by Department"
            subtitle="Workforce distribution across the organization"
            size="medium"
          >
            {departmentEntries.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No department data available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {departmentEntries.slice(0, 8).map((dept) => (
                  <div key={dept.name} className="p-3 bg-muted rounded-card">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground truncate">{dept.name || 'Unspecified'}</span>
                      <span className="text-sm text-muted-foreground flex-shrink-0">
                        {dept.count} {dept.count === 1 ? 'person' : 'people'}
                        {dept.percentage > 0 && ` · ${dept.percentage}%`}
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-violet-600"
                        style={{ width: `${Math.min(100, Math.max(2, dept.percentage || (totalHeadcount > 0 ? (dept.count * 100) / totalHeadcount : 0)))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget
            id="executive-open-requisitions"
            title="Open Requisitions"
            subtitle="Approved hires currently in flight"
            size="medium"
          >
            {openRequisitions.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No open requisitions.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {openRequisitions.slice(0, 6).map((req) => (
                  <button
                    key={req.id}
                    onClick={() => router.push(`/requisitions/${req.id}`)}
                    className="w-full text-left flex items-center justify-between py-3 hover:bg-gray-50 rounded-sm px-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {req.title || req.jobTitle || 'Untitled requisition'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {req.department || ''} {req.hiringManagerName ? `· ${req.hiringManagerName}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-gray-700 font-medium flex-shrink-0 ml-3">
                      {formatDate(req.createdAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </DashboardWidget>
        </div>

        <div className="lg:col-span-1 space-y-6 min-w-0 max-w-full">
          <DashboardWidget
            id="executive-pending-approvals"
            title="Pending Approvals"
            subtitle="Requisitions awaiting your sign-off"
            size="small"
          >
            {pendingRequisitions.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                You&apos;re all caught up.
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequisitions.slice(0, 5).map((req) => (
                  <button
                    key={req.id}
                    onClick={() => router.push(`/requisitions/${req.id}`)}
                    className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm"
                  >
                    <ClipboardDocumentCheckIcon className="h-4 w-4 text-gold-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {req.title || req.jobTitle || 'Untitled requisition'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {req.department || ''} {req.createdAt ? `· ${formatDate(req.createdAt)}` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget
            id="executive-leadership"
            title="Leadership Team"
            subtitle={`${leadership.length} leader${leadership.length === 1 ? '' : 's'}`}
            size="small"
          >
            {leadership.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500">
                No leadership data available.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {leadership.slice(0, 8).map((leader) => {
                  const initials = (leader.name || '')
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0])
                    .join('')
                    .toUpperCase() || '?';
                  return (
                    <div
                      key={leader.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-sm"
                    >
                      <div className="h-8 w-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {leader.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {leader.title || leader.role || ''}
                          {leader.department ? ` · ${leader.department}` : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </DashboardWidget>

          <DashboardWidget
            id="executive-quick-actions"
            title="Executive Tools"
            subtitle="Strategic decisions and reports"
            size="small"
          >
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Approve Requisitions', href: '/requisitions', color: 'bg-gold-500 text-violet-950', icon: ClipboardDocumentCheckIcon },
                { label: 'Strategic Reports', href: '/reports', color: 'bg-violet-700 text-white', icon: DocumentChartBarIcon },
                { label: 'Budget Planning', href: '/executive/budget', color: 'bg-orange-600 text-white', icon: CurrencyDollarIcon },
                { label: 'Leadership Pipeline', href: '/executive/leadership', color: 'bg-green-600 text-white', icon: UserGroupIcon },
                { label: 'Organizational Overview', href: '/executive/overview', color: 'bg-blue-700 text-white', icon: BuildingOffice2Icon },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`${action.color} p-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium text-center w-full flex items-center justify-center gap-2`}
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </button>
              ))}
            </div>
          </DashboardWidget>

          {kpis && (kpis.offerAcceptanceRate != null || kpis.employeeSatisfactionScore != null) && (
            <DashboardWidget
              id="executive-additional-kpis"
              title="People KPIs"
              subtitle="Hiring quality and engagement"
              size="small"
            >
              <div className="space-y-3">
                {kpis.offerAcceptanceRate != null && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-card">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-gray-700">Offer acceptance</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{kpis.offerAcceptanceRate}%</span>
                  </div>
                )}
                {kpis.employeeSatisfactionScore != null && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-card">
                    <div className="flex items-center gap-2">
                      <ChartBarIcon className="h-4 w-4 text-violet-600" />
                      <span className="text-sm text-gray-700">Satisfaction</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{kpis.employeeSatisfactionScore}/10</span>
                  </div>
                )}
              </div>
            </DashboardWidget>
          )}
        </div>
      </div>
    </div>
  );
}
