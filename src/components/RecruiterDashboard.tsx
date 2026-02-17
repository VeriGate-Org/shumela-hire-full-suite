'use client';

import React, { useState } from 'react';

// Mock data
const mockMetrics = {
  totalApplications: 1284,
  activeJobPostings: 23,
  newApplicants: 187,
  applicationsByStatus: {
    Applied: 412,
    Screening: 298,
    Interview: 186,
    Offer: 47,
    Hired: 34,
    Rejected: 307,
  },
  conversionRates: {
    screeningRate: 72.3,
    interviewRate: 45.6,
    hireRate: 8.2,
  },
  dailyTrends: {},
};

const mockApplicationsPerVacancy = [
  { vacancy: 'Senior Software Engineer', applications: 142, jobId: 1 },
  { vacancy: 'Product Manager', applications: 98, jobId: 2 },
  { vacancy: 'UX Designer', applications: 87, jobId: 3 },
  { vacancy: 'Data Analyst', applications: 76, jobId: 4 },
  { vacancy: 'DevOps Engineer', applications: 63, jobId: 5 },
  { vacancy: 'Marketing Coordinator', applications: 51, jobId: 6 },
];

const mockPipelineFunnel = {
  funnel: {
    Applied: 1284,
    Screening: 926,
    'Phone Interview': 584,
    'On-site Interview': 312,
    'Final Round': 128,
    Offer: 47,
    Hired: 34,
  },
  department: 'All Departments',
  period: 'Last 30 days',
};

const mockTimeToFill = {
  averageDays: 32.4,
  positions: [
    { jobTitle: 'Senior Software Engineer', department: 'Engineering', daysToFill: 45, hiredDate: '2026-02-03' },
    { jobTitle: 'Product Manager', department: 'Product', daysToFill: 38, hiredDate: '2026-01-28' },
    { jobTitle: 'UX Designer', department: 'Design', daysToFill: 29, hiredDate: '2026-02-10' },
    { jobTitle: 'Data Analyst', department: 'Engineering', daysToFill: 22, hiredDate: '2026-02-12' },
    { jobTitle: 'Marketing Coordinator', department: 'Marketing', daysToFill: 18, hiredDate: '2026-01-20' },
  ],
  department: 'All Departments',
};

const mockRecentActivity = [
  { id: 1, applicantName: 'Thabo Mokoena', jobTitle: 'Senior Software Engineer', status: 'interview_scheduled', action: 'Interview scheduled', timestamp: '2026-02-17T09:30:00', department: 'Engineering' },
  { id: 2, applicantName: 'Naledi Dlamini', jobTitle: 'Product Manager', status: 'hired', action: 'Offer accepted', timestamp: '2026-02-16T14:15:00', department: 'Product' },
  { id: 3, applicantName: 'Sipho Ndlovu', jobTitle: 'UX Designer', status: 'screening', action: 'Moved to screening', timestamp: '2026-02-16T11:00:00', department: 'Design' },
  { id: 4, applicantName: 'Lerato Mahlangu', jobTitle: 'Data Analyst', status: 'rejected', action: 'Application rejected', timestamp: '2026-02-15T16:45:00', department: 'Engineering' },
  { id: 5, applicantName: 'Kamogelo Sithole', jobTitle: 'DevOps Engineer', status: 'interview_scheduled', action: 'Final round scheduled', timestamp: '2026-02-15T10:20:00', department: 'Engineering' },
  { id: 6, applicantName: 'Zanele Khumalo', jobTitle: 'Marketing Coordinator', status: 'hired', action: 'Offer accepted', timestamp: '2026-02-14T13:00:00', department: 'Marketing' },
  { id: 7, applicantName: 'Bongani Mthembu', jobTitle: 'Senior Software Engineer', status: 'screening', action: 'CV reviewed', timestamp: '2026-02-14T09:10:00', department: 'Engineering' },
];

const mockDepartmentStats = {
  departments: {
    Engineering: { totalApplications: 486, uniqueApplicants: 312, hired: 14, averageTimeToFill: 38.2 },
    Product: { totalApplications: 198, uniqueApplicants: 145, hired: 6, averageTimeToFill: 34.5 },
    Design: { totalApplications: 164, uniqueApplicants: 118, hired: 4, averageTimeToFill: 28.1 },
    Marketing: { totalApplications: 152, uniqueApplicants: 110, hired: 5, averageTimeToFill: 21.3 },
    Sales: { totalApplications: 178, uniqueApplicants: 134, hired: 3, averageTimeToFill: 25.7 },
    Operations: { totalApplications: 106, uniqueApplicants: 82, hired: 2, averageTimeToFill: 30.9 },
  },
  period: 'Last 30 days',
};

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

const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'hired': return 'bg-green-100 text-green-800';
    case 'interview_scheduled': return 'bg-gold-100 text-gold-800';
    case 'screening': return 'bg-yellow-100 text-yellow-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'withdrawn': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const RecruiterDashboard: React.FC = () => {
  const metrics = mockMetrics;
  const applicationsPerVacancy = mockApplicationsPerVacancy;
  const pipelineFunnel = mockPipelineFunnel;
  const timeToFill = mockTimeToFill;
  const recentActivity = mockRecentActivity;
  const departmentStats = mockDepartmentStats;

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
              {Object.entries(pipelineFunnel.funnel).map(([stage, count]) => {
                const percentage = Object.values(pipelineFunnel.funnel)[0] > 0 
                  ? (count / Object.values(pipelineFunnel.funnel)[0]) * 100 
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
              {timeToFill.positions.slice(0, 5).map((position, index) => (
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
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(activity.status)}`}>
                    {activity.status.replace('_', ' ')}
                  </span>
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
                {Object.entries(departmentStats.departments).map(([dept, stats]) => (
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
