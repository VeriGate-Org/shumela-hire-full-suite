'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import StatusPill from '@/components/StatusPill';

const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

export function RecruiterDashboardFilters() {
  const [dateRange, setDateRange] = useState('30');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  return (
    <div className="flex gap-4">
      <select
        value={dateRange}
        onChange={(e) => setDateRange(e.target.value)}
        className="border border-gray-300 rounded-sm px-3 py-2 text-sm"
      >
        <option value="7">Last 7 days</option>
        <option value="30">Last 30 days</option>
        <option value="90">Last 90 days</option>
        <option value="180">Last 6 months</option>
      </select>
      <select
        value={selectedDepartment}
        onChange={(e) => setSelectedDepartment(e.target.value)}
        className="border border-gray-300 rounded-sm px-3 py-2 text-sm"
      >
        <option value="">All Departments</option>
        {departments.map((dept) => (
          <option key={dept} value={dept}>{dept}</option>
        ))}
      </select>
    </div>
  );
}


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
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Applications</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.totalApplications}</p>
                <p className="text-xs text-gray-500">{metrics.newApplicants} new applicants</p>
              </div>
              <div className="p-3 bg-gold-100 rounded-full">
                <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Job Postings</p>
                <p className="text-2xl font-bold text-gray-900">{metrics.activeJobPostings}</p>
                <p className="text-xs text-gray-500">Open positions</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0H8m8 0v1.5a2.5 2.5 0 002.5 2.5v0a2.5 2.5 0 002.5-2.5V6z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Interview Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(metrics.conversionRates?.interviewRate ?? 0).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Screening to interview</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hire Rate</p>
                <p className="text-2xl font-bold text-gray-900">{(metrics.conversionRates?.hireRate ?? 0).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">Application to hire</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Pipeline</h3>
          <p className="text-sm text-gray-600 mb-6">{pipelineFunnel.department} - {pipelineFunnel.period}</p>
            <div className="space-y-4">
              {(Object.entries(pipelineFunnel.funnel) as [string, number][]).map(([stage, count]) => {
                const firstVal = (Object.values(pipelineFunnel.funnel) as number[])[0] ?? 0;
                const percentage = firstVal > 0
                  ? (count / firstVal) * 100
                  : 0;
                return (
                  <div key={stage} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{stage}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gold-500 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Applications per Vacancy */}
        <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applications per Vacancy</h3>
            <p className="text-sm text-gray-600 mb-6">Job postings with highest application volume</p>
            <div className="space-y-3">
              {applicationsPerVacancy.slice(0, 6).map((vacancy) => {
                const maxApplications = Math.max(...applicationsPerVacancy.map(v => v.applications));
                const percentage = maxApplications > 0 ? (vacancy.applications / maxApplications) * 100 : 0;
                return (
                  <div key={vacancy.jobId} className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 truncate">{vacancy.vacancy}</span>
                        <span className="text-sm text-gray-600 ml-2">{vacancy.applications}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        {/* Time to Fill */}
        <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Time to Fill</h3>
          <p className="text-sm text-gray-600 mb-6">
            Average: {timeToFill.averageDays.toFixed(1)} days ({timeToFill.department})
            </p>
            <div className="space-y-4">
              {timeToFill.positions.slice(0, 5).map((position: any, index: number) => (
                <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-3">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{position.jobTitle}</p>
                    <p className="text-sm text-gray-600">{position.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{position.daysToFill} days</p>
                    <p className="text-xs text-gray-500">{new Date(position.hiredDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <p className="text-sm text-gray-600 mb-6">Latest recruitment activities</p>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center border-b border-gray-200 pb-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.applicantName}</p>
                  <p className="text-sm text-gray-600">{activity.jobTitle}</p>
                </div>
                <div className="text-right">
                  <StatusPill value={activity.status} domain="applicationStatus" size="sm" />
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      <div className="bg-white p-6 rounded-sm shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
        <p className="text-sm text-gray-600 mb-6">Statistics by department for {departmentStats.period}</p>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Department</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Applications</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Applicants</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Hired</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-900">Avg. Time to Fill</th>
                </tr>
              </thead>
              <tbody>
                {(Object.entries(departmentStats.departments) as [string, any][]).map(([dept, stats]) => (
                  <tr key={dept} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{dept}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{stats.totalApplications}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{stats.uniqueApplicants}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{stats.hired}</td>
                    <td className="text-right py-3 px-4 text-gray-900">{stats.averageTimeToFill.toFixed(1)} days</td>
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
