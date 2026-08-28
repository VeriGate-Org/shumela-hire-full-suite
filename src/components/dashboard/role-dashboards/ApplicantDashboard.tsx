'use client';

import React, { useState, useEffect } from 'react';
import { DashboardWidget } from '../../dashboard';
import { getMyDashboardData } from '@/services/candidateService';
import { getEnumLabel } from '@/utils/enumLabels';
import { useAuth } from '@/contexts/AuthContext';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction } from '@/components/record/DecisionBar';

interface ApplicantDashboardProps {
  /** Handed down by the page, because this component owns the band. */
  actions?: React.ReactNode;
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
  WITHDRAWN: 'bg-muted text-foreground',
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
  return STATUS_COLOR_MAP[status] ?? 'bg-muted text-foreground';
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

export default function ApplicantDashboard({ selectedTimeframe: _selectedTimeframe, onTimeframeChange: _onTimeframeChange, actions }: ApplicantDashboardProps) {
  const { user } = useAuth();
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
      if (!user?.email) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        // GET /api/applications and /api/interviews are staff-only search
        // endpoints Applicants never had access to. getMyDashboardData
        // resolves the caller's own applicant record and walks their
        // applications/interviews via the endpoints actually opened up
        // for self-service roles.
        const { applications: items, upcomingInterviews: interviewItems } = await getMyDashboardData(user.email);

        // Compute status counts from all applications
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

        // Map recent applications (most recently submitted first)
        const recent = [...items].sort((a: any, b: any) => {
          const aDate = new Date(a.submittedAt ?? a.appliedDate ?? a.createdAt ?? 0).getTime();
          const bDate = new Date(b.submittedAt ?? b.appliedDate ?? b.createdAt ?? 0).getTime();
          return bDate - aDate;
        }).slice(0, 5);
        setRecentApplications(
          recent.map((app: Record<string, unknown>) => ({
            id: String(app.id ?? ''),
            position: (app.positionTitle ?? app.position ?? app.jobTitle ?? '') as string,
            company: (app.companyName ?? app.company ?? '') as string,
            appliedDate: formatRelativeDate((app.submittedAt ?? app.appliedDate ?? app.createdAt ?? '') as string),
            status: getStatusDisplay((app.status ?? 'APPLIED') as string),
            location: (app.location ?? '') as string,
            statusColor: getStatusColor((app.status ?? 'APPLIED') as string),
          }))
        );

        // Map upcoming interviews
        setUpcomingInterviews(
          interviewItems.slice(0, 5).map((item: Record<string, unknown>) => {
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
      } catch {
        // On error, keep empty defaults
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-full">
          <div className="lg:col-span-2 space-y-6 min-w-0">
            <div className="bg-card rounded-control border border-border p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-4" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded-control" />
                ))}
              </div>
            </div>
            <div className="bg-card rounded-control border border-border p-6 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded-control" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6 min-w-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-control border border-border p-6 animate-pulse">
                <div className="h-5 bg-muted rounded w-2/3 mb-4" />
                <div className="h-24 bg-muted rounded-control" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const liveApplications = recentApplications.length;
  const nextInterview = upcomingInterviews[0];

  return (
    <div className="space-y-4 max-w-full overflow-hidden">
      <IdentityBand
        eyebrow="Your job search"
        title={user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Your applications'}
        subtitle={`${liveApplications} ${liveApplications === 1 ? 'application' : 'applications'} · ${upcomingInterviews.length} ${upcomingInterviews.length === 1 ? 'interview' : 'interviews'} booked`}
        figures={[
          { label: 'Applications', value: liveApplications },
          {
            label: 'Interviews booked',
            value: upcomingInterviews.length,
            tone: (upcomingInterviews.length > 0 ? 'positive' : undefined) as 'positive' | undefined,
          },
        ]}
       actions={actions}
      />

      {nextInterview ? (
        <DecisionBar
          ask="You have an interview coming up."
          why={`${nextInterview.position ?? 'Interview'}${nextInterview.date ? ` · ${nextInterview.date}` : ''}`}
          tone="owed"
        >
          <PrimaryAction onClick={() => (window.location.href = '/candidate/interviews')}>
            View details
          </PrimaryAction>
        </DecisionBar>
      ) : (
        <DecisionBar
          ask="No interviews booked yet."
          why="You will be told here as soon as one is scheduled."
          tone="settled"
        />
      )}
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
                  <div key={item.status} className="text-center p-4 bg-muted rounded-control">
                    <div className={`text-2xl font-bold mb-2 px-3 py-1 rounded-full ${item.color} inline-block`}>
                      {item.count}
                    </div>
                    <p className="text-sm font-medium text-foreground">{item.status}</p>
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
                  <p className="text-muted-foreground text-sm">No applications yet. Start applying to jobs to see them here.</p>
                ) : (
                  recentApplications.map((application) => (
                    <div key={application.id} className="flex items-center justify-between p-4 border border-border rounded-control hover:bg-muted">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-foreground truncate">{application.position}</h4>
                        <p className="text-sm text-muted-foreground">{application.company}{application.location ? ` \u2022 ${application.location}` : ''}</p>
                        <p className="text-xs text-muted-foreground mt-1">Applied {application.appliedDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.statusColor}`}>
                          {application.status}
                        </span>
                        {/* Dead until now: no onClick. #299 gave the record an address, so this
                            has an obvious destination rather than needing a modal. */}
                        <button
                          onClick={() => {
                            window.location.href = `/applications/${encodeURIComponent(String(application.id))}`;
                          }}
                          className="text-accent-gold hover:underline text-sm font-medium rounded-full"
                        >
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
                  <span className="text-sm font-medium text-foreground">Profile Strength</span>
                  <span className="text-sm font-bold text-green-600">85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">{'\u2713'}</span>
                    <span className="text-muted-foreground">Resume uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">{'\u2713'}</span>
                    <span className="text-muted-foreground">Skills added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">{'\u25CB'}</span>
                    <span className="text-muted-foreground">Portfolio missing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">{'\u2713'}</span>
                    <span className="text-muted-foreground">References added</span>
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
                  <p className="text-muted-foreground text-sm">No upcoming interviews scheduled.</p>
                ) : (
                  upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-start gap-3 p-3 hover:bg-muted rounded-control">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${interview.color.replace('text-', 'bg-')}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{interview.company}</p>
                        <p className="text-xs text-muted-foreground truncate">{interview.position}</p>
                        <p className="text-xs text-muted-foreground mt-1">{interview.date} at {interview.time}</p>
                        <p className="text-xs text-muted-foreground">{getEnumLabel('interviewType', interview.type)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </DashboardWidget>
          </div>

          {/* Quick Actions — static UI config */}
          {/* "Quick Actions" was four buttons — Browse Jobs, Update Profile, Upload Resume,
              Messages — rendered from a map with no onClick on any of them, and Messages names a
              feature this product does not have. Removed rather than restyled: four controls that
              look like navigation and are not is worse than three fewer places to click. Browsing
              roles is reachable from the nav, and the decision bar above carries the real next
              action. */}
        </div>
      </div>
    </div>
  );
}
