'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import StatusPill from '@/components/StatusPill';

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

export function RecruiterDashboardFilters() {
  const [dateRange, setDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value)}
        className="border border-border bg-card text-foreground rounded-control px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="180">Last 6 months</option>
      </select>
      <select
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
        className="border border-border bg-card text-foreground rounded-control px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
    </div>
  );
}


const FUNNEL_STYLE_COLORS = [
  'var(--accent-navy)',
  'var(--accent-teal)',
  'var(--accent-gold)',
  'var(--accent-pink)',
  'var(--primary)',
];

const RecruiterDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({
    totalApplications: 0,
    activeJobPostings: 0,
    newApplicants: 0,
    conversionRates: { interviewRate: 0, hireRate: 0 },
  });
  const [applicationsPerVacancy, setApplicationsPerVacancy] = useState<any[]>([]);
  const [pipelineFunnel, setPipelineFunnel] = useState<any>({
    department: '',
    period: '',
    funnel: {},
  });
  const [timeToFill, setTimeToFill] = useState<any>({
    averageDays: 0,
    department: '',
    positions: [],
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any>({
    period: '',
    departments: {},
  });

  useEffect(() => {
    async function loadDashboardData() {
      const [dashboardRes, _kpisRes, pipelineRes, deptRes] = await Promise.allSettled([
        apiFetch('/api/analytics/dashboard'),
        apiFetch('/api/analytics/kpis'),
        apiFetch('/api/pipeline/analytics'),
        apiFetch('/api/pipeline/analytics/departments'),
      ]);

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        const data = await dashboardRes.value.json();
        setMetrics({
          totalApplications: data.totalApplications || 0,
          activeJobPostings: data.activeJobPostings || data.openPositions || 0,
          newApplicants: data.newApplicants || 0,
          conversionRates: {
            interviewRate: data.interviewRate || data.conversionRates?.interviewRate || 0,
            hireRate: data.hireRate || data.conversionRates?.hireRate || 0,
          },
        });
        if (data.recentActivity) setRecentActivity(data.recentActivity);
        if (data.timeToFill) setTimeToFill(data.timeToFill);
        if (data.applicationsPerVacancy) setApplicationsPerVacancy(data.applicationsPerVacancy);
      }

      if (pipelineRes.status === 'fulfilled' && pipelineRes.value.ok) {
        const data = await pipelineRes.value.json();
        if (data.funnel || data.stages) {
          setPipelineFunnel({
            department: data.department || 'All',
            period: data.period || 'Current',
            funnel: data.funnel || data.stages || {},
          });
        }
      }

      if (deptRes.status === 'fulfilled' && deptRes.value.ok) {
        const data = await deptRes.value.json();
        setDepartmentStats({
          period: data.period || 'Current',
          departments: data.departments || data || {},
        });
      }
    }
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">

      {/* ===== KPI Stats Bar ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Applications */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
              {metrics.totalApplications}
            </div>
            <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
              Total Applications
            </div>
          </div>
        </div>

        {/* Active Job Postings */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
              {metrics.activeJobPostings}
            </div>
            <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
              Active Job Postings
            </div>
          </div>
        </div>

        {/* Interview Rate */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
              {(metrics.conversionRates?.interviewRate ?? 0).toFixed(1)}%
            </div>
            <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
              Interview Rate
            </div>
          </div>
        </div>

        {/* Hire Rate */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
              {(metrics.conversionRates?.hireRate ?? 0).toFixed(1)}%
            </div>
            <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
              Hire Rate
            </div>
          </div>
        </div>
      </div>

      {/* ===== Content Grid: Pipeline + Applications per Vacancy ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recruitment Pipeline (Conversion Funnel style) */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Recruitment Pipeline</h2>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {pipelineFunnel.department} &middot; {pipelineFunnel.period}
            </span>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-0">
              {(Object.entries(pipelineFunnel.funnel) as [string, number][]).map(([stage, count], idx) => {
                const firstVal = (Object.values(pipelineFunnel.funnel) as number[])[0] ?? 0;
                const percentage = firstVal > 0 ? (count / firstVal) * 100 : 0;
                const barColor = FUNNEL_STYLE_COLORS[idx % FUNNEL_STYLE_COLORS.length];
                return (
                  <div key={stage} className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
                    <div className="w-[90px] text-[0.8125rem] font-semibold text-foreground flex-shrink-0 truncate">
                      {stage}
                    </div>
                    <div className="flex-1 h-6 bg-background rounded-control overflow-hidden">
                      <div
                        className="h-full rounded-control transition-all duration-500 flex items-center justify-end pr-2 text-[0.6875rem] font-bold text-white min-w-[30px]"
                        style={{ width: `${Math.max(percentage, 5)}%`, backgroundColor: barColor }}
                      >
                        {percentage > 15 ? count : ''}
                      </div>
                    </div>
                    <div className="w-10 text-right text-base font-extrabold text-foreground flex-shrink-0">
                      {count}
                    </div>
                    <div className="w-[50px] text-right flex-shrink-0">
                      {idx > 0 && (
                        <span className="text-xs font-bold text-accent-teal">
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Applications per Vacancy (Stacked bar chart style) */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Applications per Vacancy</h2>
            <button className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Details
            </button>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              {applicationsPerVacancy.slice(0, 6).map((vacancy) => {
                const maxApplications = Math.max(...applicationsPerVacancy.map(v => v.applications), 1);
                const percentage = maxApplications > 0 ? (vacancy.applications / maxApplications) * 100 : 0;
                return (
                  <div key={vacancy.jobId} className="flex items-center gap-3">
                    <div className="w-[160px] text-[0.8125rem] font-semibold text-foreground flex-shrink-0 truncate">
                      {vacancy.vacancy}
                    </div>
                    <div className="flex-1 h-7 bg-background rounded-control overflow-hidden">
                      <div
                        className="h-full rounded-control transition-all duration-300"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: 'var(--accent-teal)',
                        }}
                      />
                    </div>
                    <div className="w-10 text-right text-[0.8125rem] font-bold text-foreground flex-shrink-0">
                      {vacancy.applications}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Time to Fill */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Time to Fill</h2>
            <span className="text-xs font-medium text-muted-foreground">
              Avg: {timeToFill.averageDays.toFixed(1)} days
            </span>
          </div>
          <div className="p-5">
            <div className="space-y-0">
              {timeToFill.positions.slice(0, 5).map((position: any, index: number) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{position.jobTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{position.department}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className="font-extrabold text-sm text-foreground">{position.daysToFill} days</p>
                    <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                      {new Date(position.hiredDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="text-base font-bold text-foreground">Recent Activity</h2>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Latest
            </span>
          </div>
          <div className="p-5">
            <div className="space-y-0">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center py-3 border-b border-border last:border-b-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{activity.applicantName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{activity.jobTitle}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <StatusPill value={activity.status} domain="applicationStatus" size="sm" />
                    <p className="text-[0.6875rem] text-muted-foreground mt-1">
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Department Performance Table ===== */}
      <div className="enterprise-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-bold text-foreground">Department Performance</h2>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {departmentStats.period}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b border-border">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Department
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Applications
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Applicants
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Hired
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Avg. Time to Fill
                </th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(departmentStats.departments) as [string, any][]).map(([dept, stats], idx) => (
                <tr
                  key={dept}
                  className={`border-b border-border last:border-b-0 transition-colors hover:bg-surface-navy ${
                    idx % 2 === 1 ? 'bg-muted/50' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-bold text-foreground">{dept}</td>
                  <td className="text-right py-3 px-4 text-foreground">{stats.totalApplications}</td>
                  <td className="text-right py-3 px-4 text-foreground">{stats.uniqueApplicants}</td>
                  <td className="text-right py-3 px-4 font-bold text-foreground">{stats.hired}</td>
                  <td className="text-right py-3 px-4 text-foreground">{stats.averageTimeToFill.toFixed(1)} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;
