'use client';

import React, { useState, useEffect } from 'react';
import { DashboardWidget } from '../../dashboard';
import { apiFetch } from '@/lib/api-fetch';

interface ApplicantDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface StatusCount {
  status: string;
  count: number;
  color: string;
}

interface Application {
  id: string;
  position: string;
  company: string;
  appliedDate: string;
  status: string;
  location: string;
  statusColor: string;
}

interface UpcomingInterview {
  id: string;
  company: string;
  position: string;
  date: string;
  time: string;
  type: string;
  color: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  APPLIED: 'bg-gold-100 text-gold-800',
  SUBMITTED: 'bg-gold-100 text-gold-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  IN_REVIEW: 'bg-yellow-100 text-yellow-800',
  INTERVIEW: 'bg-purple-100 text-purple-800',
  INTERVIEW_SCHEDULED: 'bg-purple-100 text-purple-800',
  OFFER: 'bg-green-100 text-green-800',
  OFFER_RECEIVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-800',
};

const STATUS_DISPLAY_MAP: Record<string, string> = {
  APPLIED: 'Applied',
  SUBMITTED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  IN_REVIEW: 'Under Review',
  INTERVIEW: 'Interview',
  INTERVIEW_SCHEDULED: 'Interview',
  OFFER: 'Offer',
  OFFER_RECEIVED: 'Offer Received',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

function getStatusColor(status: string): string {
  return STATUS_COLOR_MAP[status] ?? 'bg-gray-100 text-gray-800';
}

function getStatusDisplay(status: string): string {
  return STATUS_DISPLAY_MAP[status] ?? status;
}

function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return `${Math.floor(diffDays / 7)} weeks ago`;
  } catch {
    return dateString;
  }
}

export default function ApplicantDashboard({ selectedTimeframe, onTimeframeChange }: ApplicantDashboardProps) {
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([
    { status: 'Applied', count: 0, color: 'bg-gold-100 text-gold-800' },
    { status: 'Under Review', count: 0, color: 'bg-yellow-100 text-yellow-800' },
    { status: 'Interview', count: 0, color: 'bg-purple-100 text-purple-800' },
    { status: 'Offer', count: 0, color: 'bg-green-100 text-green-800' },
  ]);
  const [recentApplications, setRecentApplications] = useState<Application[]>([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState<UpcomingInterview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [allAppsRes, recentAppsRes, interviewsRes] = await Promise.all([
          apiFetch('/api/applications?size=100'),
          apiFetch('/api/applications?sortBy=submittedAt&sortDirection=desc&size=5'),
          apiFetch('/api/interviews?status=SCHEDULED&size=5'),
        ]);

        // Compute status counts from all applications
        if (allAppsRes.ok) {
          const allAppsData = await allAppsRes.json();
          const items = allAppsData.content ?? allAppsData ?? [];
          const counts: Record<string, number> = {};
          for (const app of items) {
            const status = (app.status as string) ?? 'APPLIED';
            const display = getStatusDisplay(status);
            counts[display] = (counts[display] ?? 0) + 1;
          }
          setStatusCounts([
            { status: 'Applied', count: counts['Applied'] ?? 0, color: 'bg-gold-100 text-gold-800' },
            { status: 'Under Review', count: counts['Under Review'] ?? 0, color: 'bg-yellow-100 text-yellow-800' },
            { status: 'Interview', count: counts['Interview'] ?? 0, color: 'bg-purple-100 text-purple-800' },
            { status: 'Offer', count: (counts['Offer'] ?? 0) + (counts['Offer Received'] ?? 0), color: 'bg-green-100 text-green-800' },
          ]);
        }

        // Map recent applications
        if (recentAppsRes.ok) {
          const recentData = await recentAppsRes.json();
          const items = recentData.content ?? recentData ?? [];
          setRecentApplications(
            items.map((app: Record<string, unknown>) => ({
              id: String(app.id ?? ''),
              position: (app.positionTitle ?? app.position ?? app.jobTitle ?? '') as string,
              company: (app.companyName ?? app.company ?? '') as string,
              appliedDate: formatRelativeDate((app.submittedAt ?? app.appliedDate ?? app.createdAt ?? '') as string),
              status: getStatusDisplay((app.status ?? 'APPLIED') as string),
              location: (app.location ?? '') as string,
              statusColor: getStatusColor((app.status ?? 'APPLIED') as string),
            }))
          );
        }

        // Map upcoming interviews
        if (interviewsRes.ok) {
          const interviewData = await interviewsRes.json();
          const items = interviewData.content ?? interviewData ?? [];
          setUpcomingInterviews(
            items.map((item: Record<string, unknown>) => {
              const scheduledDate = (item.scheduledDate ?? item.date ?? '') as string;
              let displayDate = scheduledDate;
              try {
                const date = new Date(scheduledDate);
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (date.toDateString() === today.toDateString()) {
                  displayDate = 'Today';
                } else if (date.toDateString() === tomorrow.toDateString()) {
                  displayDate = 'Tomorrow';
                } else {
                  displayDate = date.toLocaleDateString('en-ZA', { weekday: 'long' });
                }
              } catch {
                // keep raw date
              }

              return {
                id: String(item.id ?? ''),
                company: (item.companyName ?? item.company ?? '') as string,
                position: (item.positionTitle ?? item.position ?? '') as string,
                date: displayDate,
                time: (item.scheduledTime ?? item.time ?? '') as string,
                type: (item.interviewType ?? item.type ?? 'Interview') as string,
                color: (item.interviewType ?? item.type ?? '') === 'On-site' ? 'text-purple-600' : 'text-gold-600',
              };
            })
          );
        }
      } catch {
        // On error, keep empty defaults
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <div className="bg-white rounded-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-sm" />
                ))}
              </div>
            </div>
            <div className="bg-white rounded-sm border border-gray-200 p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-sm" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6 min-w-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-sm border border-gray-200 p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
                <div className="h-24 bg-gray-100 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Applicant Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
        {/* Main Applicant Content */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Application Status Overview */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="application-status"
              title="My Applications Status"
              subtitle="Track the progress of your job applications"
              refreshable={true}
              size="large"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statusCounts.map((item) => (
                  <div key={item.status} className="text-center p-4 bg-gray-50 rounded-sm">
                    <div className={`text-2xl font-bold mb-2 px-3 py-1 rounded-full ${item.color} inline-block`}>
                      {item.count}
                    </div>
                    <p className="text-sm font-medium text-gray-700">{item.status}</p>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>

          {/* Recent Applications */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="recent-applications"
              title="Recent Applications"
              subtitle="Your latest job applications"
              refreshable={true}
              size="large"
            >
              <div className="space-y-4">
                {recentApplications.length === 0 ? (
                  <p className="text-gray-500 text-sm">No applications yet. Start applying to jobs to see them here.</p>
                ) : (
                  recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-sm hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">{application.position}</h4>
                        <p className="text-sm text-gray-600">{application.company}{application.location ? ` \u2022 ${application.location}` : ''}</p>
                        <p className="text-xs text-gray-500 mt-1">Applied {application.appliedDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.statusColor}`}>
                          {application.status}
                        </span>
                        <button className="text-gold-600 hover:text-gold-800 text-sm font-medium rounded-full">
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardWidget>
          </div>
        </div>

        {/* Applicant Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Profile Completion — static UI config */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="profile-completion"
              title="Profile Completion"
              subtitle="Improve your profile visibility"
              size="small"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Profile Strength</span>
                  <span className="text-sm font-bold text-green-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">{'\u2713'}</span>
                    <span className="text-gray-600">Resume uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">{'\u2713'}</span>
                    <span className="text-gray-600">Skills added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">{'\u25CB'}</span>
                    <span className="text-gray-600">Portfolio missing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">{'\u2713'}</span>
                    <span className="text-gray-600">References added</span>
                  </div>
                </div>
              </div>
            </DashboardWidget>
          </div>

          {/* Upcoming Interviews */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="upcoming-interviews"
              title="Upcoming Interviews"
              subtitle="Your scheduled interviews"
              refreshable={true}
              size="small"
            >
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {upcomingInterviews.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming interviews scheduled.</p>
                ) : (
                  upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${interview.color.replace('text-', 'bg-')}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{interview.company}</p>
                        <p className="text-xs text-gray-500 truncate">{interview.position}</p>
                        <p className="text-xs text-gray-600 mt-1">{interview.date} at {interview.time}</p>
                        <p className="text-xs text-gray-500">{interview.type}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardWidget>
          </div>

          {/* Quick Actions — static UI config */}
          <div className="w-full overflow-hidden">
            <DashboardWidget
              id="applicant-actions"
              title="Quick Actions"
              subtitle="Manage your job search"
              size="small"
            >
              <div className="grid grid-cols-1 gap-2">
                {[
                  { label: 'Browse Jobs', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Update Profile', color: 'bg-green-600 text-white' },
                  { label: 'Upload Resume', color: 'bg-gold-500 text-violet-950' },
                  { label: 'Messages', color: 'bg-orange-600 text-white' },
                ].map((action) => (
                  <button
                    key={action.label}
                    className={`${action.color} p-3 rounded-full hover:opacity-90 transition-opacity text-sm font-medium text-center w-full`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </DashboardWidget>
          </div>
        </div>
      </div>
    </div>
  );
}
