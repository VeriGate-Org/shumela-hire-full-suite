'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { apiFetch } from '@/lib/api-fetch';
import ExecutiveTimeline, { TimelineItem } from '@/components/ExecutiveTimeline';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  HomeIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import {
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';

/**
 * What this page can actually say about the organisation.
 *
 * <p>Every field is nullable on purpose. The previous shape declared twelve non-null numbers and
 * filled them with `|| 0`, so a figure nobody could source rendered as a confident zero — headcount
 * 0, turnover 0%, average salary R0. Null forces each tile to decide between a number and an
 * honest absence.
 *
 * <p>Growth rates, engagement, diversity, remote-work share and average salary are gone rather
 * than nulled: no endpoint in this product computes them, so a tile promising them would be a
 * promise nothing can keep.
 */
interface OrganizationMetrics {
  totalEmployees: number | null;
  totalContractors: number | null;
  totalOpenPositions: number | null;
  averageTenure: number | null;
  turnoverRate: number | null;
  newHiresThisMonth: number | null;
}

/**
 * One executive figure, or an honest statement that it is not available.
 *
 * <p>A null value renders the reason in place of the number. The tiles this replaces rendered
 * `|| 0`, so an unsourceable figure read as a real zero — headcount 0, turnover 0%, average
 * salary R0 — on a screen executives use to judge the organisation.
 */
function MetricTile({ label, value, detail }: {
  label: string;
  value: string | null;
  detail: string;
}) {
  return (
    <div className="enterprise-card p-6">
      <p className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      {value === null ? (
        <p className="text-sm font-semibold text-muted-foreground mt-1.5">Not reported</p>
      ) : (
        <p className="text-2xl font-extrabold tracking-[-0.03em] text-foreground mt-1 tabular-nums">
          {value}
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-1">{detail}</p>
    </div>
  );
}

/**
 * A department, as this page can actually describe one.
 *
 * <p>Twelve fields stood here — headcount, budget, utilizationRate, averageSalary, growthTarget,
 * currentGrowth, productivity, satisfaction, retention, diversity, newHires, departures. The only
 * endpoint feeding them, /api/pipeline/analytics/departments, returns {stageName: count} per
 * department and has never returned any of the twelve, so every card rendered zeros and R0.
 */
interface Department {
  id: string;
  name: string;
  /** Candidates who reached the busiest stage in this department. */
  inPipeline: number;
  /** Reached-count per stage, as the endpoint returns it. */
  stages: Record<string, number>;
}

interface OrganizationalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'opportunity';
  category: 'headcount' | 'budget' | 'compliance' | 'performance' | 'culture';
  title: string;
  description: string;
  impact: string;
  department?: string;
  location?: string;
  recommendedAction: string;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: string;
  dueDate?: string;
}

interface CompanyMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'achievement' | 'launch' | 'expansion' | 'funding' | 'partnership';
  status: 'completed' | 'in_progress' | 'planned';
  impact: 'high' | 'medium' | 'low';
  departments: string[];
  metrics?: {
    employeesImpacted: number;
    budgetImpact: number;
    timelineWeeks: number;
  };
}

export default function OrganizationalOverviewPage() {
  const [orgMetrics, setOrgMetrics] = useState<OrganizationMetrics | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [alerts, setAlerts] = useState<OrganizationalAlert[]>([]);
  const [milestones, _setMilestones] = useState<CompanyMilestone[]>([]);
  const [activeView, setActiveView] = useState<'overview' | 'departments' | 'insights'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [_filterDepartment, _setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationalData();
  }, [selectedPeriod]);

  const loadOrganizationalData = async () => {
    setLoading(true);
    try {
      const [hrRes, kpisRes, deptRes, alertsRes] = await Promise.allSettled([
        apiFetch('/api/analytics/hr-overview'),
        apiFetch('/api/analytics/kpis'),
        apiFetch('/api/pipeline/analytics/departments'),
        apiFetch('/api/analytics/alerts'),
      ]);

      // Map dashboard + KPIs to OrganizationMetrics
      let hrData: any = null;
      if (hrRes.status === 'fulfilled' && hrRes.value.ok) {
        try {
          hrData = await hrRes.value.json();
        } catch {
          hrData = null;
        }
      }

      // Every figure here used to be read off /api/analytics/dashboard and /api/analytics/kpis:
      // totalEmployees, turnoverRate, averageTenure, engagementScore, diversityScore,
      // averageSalary and seven more. Those endpoints return {kpis, trends, alerts} and
      // {kpis} — none of the thirteen exists on either, so every one fell through `|| 0` and
      // this page has rendered thirteen zeros since it was written. `|| 0` hid it on every
      // SUCCESSFUL call, which is why it never looked broken.
      //
      // Headcount and turnover are real, from /api/analytics/hr-overview — the endpoint the
      // Executive role dashboard already uses for exactly these. The rest have no source in
      // this product at all and are no longer claimed; see ExecutiveOverviewMetrics.
      setOrgMetrics({
        totalEmployees: hrData?.headcount?.totalEmployees ?? null,
        totalContractors: hrData?.headcount?.contractors ?? null,
        totalOpenPositions: hrData?.headcount?.openPositions ?? null,
        averageTenure: hrData?.headcount?.averageTenureYears ?? null,
        turnoverRate: hrData?.turnover?.annualTurnoverRate ?? null,
        newHiresThisMonth: hrData?.headcount?.newHiresThisMonth ?? null,
      });

      // Map department pipeline stats
      if (deptRes.status === 'fulfilled' && deptRes.value.ok) {
        const deptData = await deptRes.value.json();

        // The key is departmentPipelines. This read `deptData.departments`, which does not exist,
        // then fell back to `deptData` itself — so Object.entries produced a single "department"
        // literally named "departmentPipelines", holding every real department as its stats.
        //
        // Those stats are {stageName: count}. The mapping below expected budget, utilizationRate,
        // averageSalary, growthTarget, productivity, satisfaction, retention and diversity, none
        // of which the endpoint has ever returned, so all of them rendered 0 — and averageSalary
        // fell back to averageTimeToFill, a different measure entirely, before reaching R0.
        //
        // What this endpoint can actually answer is: how many candidates reached each stage, per
        // department. That is what is kept.
        const pipelines: Record<string, Record<string, number>> = deptData?.departmentPipelines ?? {};

        const mappedDepts: Department[] = Object.entries(pipelines).map(([name, stages]) => {
          const counts = Object.values(stages ?? {}).filter((n) => typeof n === 'number');
          return {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            // Candidates who reached any stage in this department — the one figure here that is real.
            inPipeline: counts.length > 0 ? Math.max(...counts) : 0,
            stages: stages ?? {},
          };
        });

        setDepartments(mappedDepts);
      }

      // Map alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const alertData = await alertsRes.value.json();
        const alertItems = alertData.content || alertData.data || alertData || [];
        setAlerts(Array.isArray(alertItems) ? alertItems.map((a: any) => ({
          id: a.id || `alert-${Math.random()}`,
          type: (a.type || a.severity || 'info').toLowerCase() as OrganizationalAlert['type'],
          category: (a.category || 'performance') as OrganizationalAlert['category'],
          title: a.title || a.message || '',
          description: a.description || '',
          impact: a.impact || '',
          department: a.department,
          location: a.location,
          recommendedAction: a.recommendedAction || a.recommendation || '',
          urgency: (a.urgency || 'medium') as OrganizationalAlert['urgency'],
          timestamp: a.timestamp || a.createdAt || new Date().toISOString(),
          dueDate: a.dueDate,
        })) : []);
      }
    } catch (error) {
      console.error('Failed to load organizational data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-gold-50 border-violet-200 text-violet-800';
      case 'opportunity': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-muted border-border text-foreground';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ExclamationTriangleIconSolid className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5 text-violet-500" />;
      case 'opportunity': return <LightBulbIcon className="w-5 h-5 text-green-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };


  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'headquarters': return <BuildingOfficeIconSolid className="w-6 h-6 text-violet-500" />;
      case 'office': return <BuildingOffice2Icon className="w-6 h-6 text-green-500" />;
      case 'coworking': return <ComputerDesktopIcon className="w-6 h-6 text-purple-500" />;
      case 'remote_hub': return <HomeIcon className="w-6 h-6 text-orange-500" />;
      default: return <BuildingOfficeIcon className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = searchTerm === '' || 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const actions = (
    <div className="flex items-center gap-3">
      {activeView === 'departments' && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-border rounded-control text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
          />
        </div>
      )}
      
      {/* This select re-runs loadOrganizationalData on change, but none of the four fetches it
          triggers takes a period — so every option returned identical data. It is kept only
          because the effect it drives is the page's refresh; the options no longer claim to
          filter by period. */}
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value as any)}
        className="px-3 py-2 border border-border rounded-control text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="month">This Month</option>
        <option value="quarter">This Quarter</option>
        <option value="year">This Year</option>
      </select>
      
      {/* "Export Report" stood here with no onClick — it exported nothing, ever. Removed rather
          than wired: this product has a Reports screen that builds and schedules real exports, and
          a second half-built path to the same thing is worse than one that works. */}
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
        <IdentityBand eyebrow="Organisation" title="Organisational Overview" subtitle="Loading…" actions={actions} />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Organisation"
        title="Organisational Overview"
        subtitle={
          orgMetrics?.totalEmployees != null
            ? `${orgMetrics.totalEmployees.toLocaleString()} people · ${departments.length} ${departments.length === 1 ? 'department' : 'departments'}`
            : 'Headcount not reported'
        }
        figures={[
          ...(orgMetrics?.turnoverRate != null
            ? [{ label: 'Annual turnover', value: `${orgMetrics.turnoverRate}%` }]
            : []),
          ...(alerts.length > 0
            ? [{ label: 'Open alerts', value: alerts.length, tone: 'warning' as const }]
            : []),
        ]}
        actions={actions}
      />

      <div className="space-y-4">
        {/* View Navigation */}
        <div className="bg-card rounded-control shadow p-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Executive Summary', icon: ChartBarIcon },
              { id: 'departments', name: 'Department Analysis', icon: UserGroupIcon },
              { id: 'insights', name: 'Strategic Insights', icon: LightBulbIcon }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-control text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-gold-100 text-violet-700'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Executive Summary */}
        {activeView === 'overview' && orgMetrics && (
          <div className="space-y-6">
            {/* Key Organizational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {/* Four tiles stood here. Three of them — Growth Rate, Engagement Score and
                  Remote Work — read fields no endpoint in this product returns, so they rendered
                  0%, 0/5.0 and 0% permanently. Remote Work also carried the fixed caption "Above
                  industry average", a claim with nothing behind it at all. They are gone rather
                  than nulled: a tile that can never be filled should not hold a place.

                  What remains is sourced from /api/analytics/hr-overview, and each states its own
                  absence rather than showing a zero. */}
              <MetricTile
                label="Total workforce"
                value={
                  orgMetrics.totalEmployees === null
                    ? null
                    : (orgMetrics.totalEmployees + (orgMetrics.totalContractors ?? 0)).toLocaleString()
                }
                detail={
                  orgMetrics.totalEmployees === null
                    ? 'Headcount not reported'
                    : `${orgMetrics.totalEmployees.toLocaleString()} employees${
                        orgMetrics.totalContractors ? `, ${orgMetrics.totalContractors} contractors` : ''
                      }`
                }
              />

              <MetricTile
                label="Open positions"
                value={orgMetrics.totalOpenPositions?.toLocaleString() ?? null}
                detail={
                  orgMetrics.newHiresThisMonth
                    ? `${orgMetrics.newHiresThisMonth} hired this month`
                    : 'No hires recorded this month'
                }
              />

              <MetricTile
                label="Annual turnover"
                value={orgMetrics.turnoverRate === null ? null : `${orgMetrics.turnoverRate}%`}
                detail="Rolling twelve months"
              />

              <MetricTile
                label="Average tenure"
                value={
                  orgMetrics.averageTenure === null
                    ? null
                    : `${orgMetrics.averageTenure} ${orgMetrics.averageTenure === 1 ? 'year' : 'years'}`
                }
                detail="Across active employees"
              />
            </div>

            {/* Critical Alerts */}
            <div className="bg-card rounded-control shadow p-6">
              <ExecutiveTimeline
                title="Critical Organizational Alerts"
                variant="alert"
                maxItems={3}
                items={alerts
                  .filter(alert => alert.urgency === 'high' || alert.type === 'critical')
                  .map((alert): TimelineItem => ({
                    id: alert.id,
                    title: alert.title,
                    description: alert.description,
                    timestamp: alert.timestamp,
                    severity: alert.type as TimelineItem['severity'],
                    status: alert.urgency,
                    statusDomain: 'urgency',
                    meta: {
                      ...(alert.impact ? { impact: alert.impact } : {}),
                      ...(alert.department ? { department: alert.department } : {}),
                      ...(alert.recommendedAction ? { recommendation: alert.recommendedAction } : {}),
                      ...(alert.dueDate ? { due: new Date(alert.dueDate).toLocaleDateString() } : {}),
                    },
                  }))}
                emptyMessage="No critical alerts at this time."
              />
            </div>

            {/* Company Milestones */}
            <div className="bg-card rounded-control shadow p-6">
              <ExecutiveTimeline
                title="Strategic Milestones"
                variant="milestone"
                maxItems={4}
                items={milestones.map((milestone): TimelineItem => ({
                  id: milestone.id,
                  title: milestone.title,
                  description: milestone.description,
                  timestamp: milestone.date,
                  status: milestone.status,
                  statusDomain: 'goalStatus',
                  meta: {
                    ...(milestone.metrics ? {
                      'employees impacted': milestone.metrics.employeesImpacted.toLocaleString(),
                      budget: `R${(milestone.metrics.budgetImpact / 1000000).toFixed(0)}M`,
                      timeline: `${milestone.metrics.timelineWeeks} weeks`,
                    } : {}),
                  },
                  expandedContent: milestone.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {milestone.departments.map((dept, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                          {dept}
                        </span>
                      ))}
                    </div>
                  ) : undefined,
                }))}
                emptyMessage="No milestones recorded yet."
              />
            </div>
          </div>
        )}

        {/* Department Analysis */}
        {/* Department Analysis
            Every card here rendered budget, utilisation, average salary, growth target, current
            growth, productivity, satisfaction, retention, new hires, departures and promotions.
            /api/pipeline/analytics/departments returns {stageName: count} per department and has
            never returned any of them, so all eleven read 0 or R0. What it can answer — how many
            candidates reached each stage — is what is shown. */}
        {activeView === 'departments' && (
          <div className="space-y-4">
            {departments.length === 0 ? (
              <div className="enterprise-card p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No department pipeline data has been recorded yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredDepartments.map((dept) => (
                  <div key={dept.id} className="enterprise-card p-6">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <h3 className="text-base font-extrabold tracking-[-0.02em] text-foreground">
                        {dept.name}
                      </h3>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {dept.inPipeline} in pipeline
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      {Object.entries(dept.stages).map(([stage, count]) => (
                        <div key={stage} className="flex items-center justify-between gap-3">
                          <span className="text-sm text-muted-foreground">{stage}</span>
                          <span className="text-sm font-bold text-foreground tabular-nums">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* "Location Portfolio" stood here — a nav tab and eighty lines of offices, capacity,
            utilisation and operational cost. Its state setter is _setLocations, never called by
            anything, so the tab has always rendered an empty grid. Removed along with its nav
            entry: a tab that can never show anything is worse than one fewer tab. */}

        {activeView === 'insights' && (
          <div className="space-y-6">
            {/* "Organizational Health Score" and "Growth Trajectory" stood here — two full
                cards of engagement, diversity and monthly/quarterly/yearly growth bars. Every
                figure in both came from fields /api/analytics/dashboard and /api/analytics/kpis
                do not return, so the bars sat at 0% and the health score at 0/5.0 permanently.
                Removed rather than nulled: two cards of "Not reported" is not an insight screen.
                The alerts below are real. */}

            <div className="bg-card rounded-control shadow p-6">
              <ExecutiveTimeline
                title="All Organizational Alerts"
                variant="alert"
                items={alerts.map((alert): TimelineItem => ({
                  id: alert.id,
                  title: alert.title,
                  description: alert.description,
                  timestamp: alert.timestamp,
                  severity: alert.type as TimelineItem['severity'],
                  status: alert.category,
                  statusDomain: 'category',
                  meta: {
                    ...(alert.impact ? { impact: alert.impact } : {}),
                    ...(alert.department ? { department: alert.department } : {}),
                    ...(alert.location ? { location: alert.location } : {}),
                    ...(alert.recommendedAction ? { recommendation: alert.recommendedAction } : {}),
                    ...(alert.dueDate ? { due: new Date(alert.dueDate).toLocaleDateString() } : {}),
                  },
                }))}
                emptyMessage="No organizational alerts."
              />
            </div>
          </div>
        )}

        {/* Department Details Modal */}
        {/* A department detail modal stood here — productivity, satisfaction, retention,
            diversity, critical open roles, locations and budget across 135 lines. Every field came
            from the same eleven that /api/pipeline/analytics/departments has never returned, so it
            opened onto zeros. Removed with them; the cards above show what the endpoint can
            actually answer, and clicking one no longer promises more. */}
      </div>
    </PageWrapper>
  );
}
