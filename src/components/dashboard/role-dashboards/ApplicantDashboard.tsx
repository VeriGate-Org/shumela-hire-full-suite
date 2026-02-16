'use client';

import React from 'react';
import { DashboardWidget } from '../../dashboard';

interface ApplicantDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export default function ApplicantDashboard({ selectedTimeframe, onTimeframeChange }: ApplicantDashboardProps) {
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
                {[
                  { status: 'Applied', count: 8, color: 'bg-gold-100 text-gold-800' },
                  { status: 'Under Review', count: 3, color: 'bg-yellow-100 text-yellow-800' },
                  { status: 'Interview', count: 2, color: 'bg-purple-100 text-purple-800' },
                  { status: 'Offer', count: 1, color: 'bg-green-100 text-green-800' },
                ].map((item) => (
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
                {[
                  {
                    id: '1',
                    position: 'Senior Frontend Developer',
                    company: 'TechCorp Inc.',
                    appliedDate: '2 days ago',
                    status: 'Under Review',
                    location: 'San Francisco, CA',
                    statusColor: 'bg-yellow-100 text-yellow-800',
                  },
                  {
                    id: '2',
                    position: 'Product Manager',
                    company: 'StartupXYZ',
                    appliedDate: '5 days ago',
                    status: 'Interview Scheduled',
                    location: 'Remote',
                    statusColor: 'bg-purple-100 text-purple-800',
                  },
                  {
                    id: '3',
                    position: 'UX Designer',
                    company: 'DesignStudio',
                    appliedDate: '1 week ago',
                    status: 'Applied',
                    location: 'New York, NY',
                    statusColor: 'bg-gold-100 text-gold-800',
                  },
                  {
                    id: '4',
                    position: 'Full Stack Developer',
                    company: 'Enterprise Corp',
                    appliedDate: '2 weeks ago',
                    status: 'Offer Received',
                    location: 'Austin, TX',
                    statusColor: 'bg-green-100 text-green-800',
                  },
                ].map((application) => (
                  <div key={application.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-sm hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-semibold text-gray-900 truncate">{application.position}</h4>
                      <p className="text-sm text-gray-600">{application.company} • {application.location}</p>
                      <p className="text-xs text-gray-500 mt-1">Applied {application.appliedDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${application.statusColor}`}>
                        {application.status}
                      </span>
                      <button className="text-gold-600 hover:text-gold-800 text-sm font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>
        </div>

        {/* Applicant Sidebar */}
        <div className="space-y-6 min-w-0">
          {/* Profile Completion */}
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
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-600">Resume uploaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-600">Skills added</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600">○</span>
                    <span className="text-gray-600">Portfolio missing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
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
                {[
                  {
                    id: '1',
                    company: 'StartupXYZ',
                    position: 'Product Manager',
                    date: 'Tomorrow',
                    time: '2:00 PM',
                    type: 'Video Call',
                    color: 'text-gold-600',
                  },
                  {
                    id: '2',
                    company: 'TechCorp Inc.',
                    position: 'Senior Frontend Developer',
                    date: 'Friday',
                    time: '10:30 AM',
                    type: 'On-site',
                    color: 'text-purple-600',
                  },
                ].map((interview) => (
                  <div key={interview.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-sm">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${interview.color.replace('text-', 'bg-')}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{interview.company}</p>
                      <p className="text-xs text-gray-500 truncate">{interview.position}</p>
                      <p className="text-xs text-gray-600 mt-1">{interview.date} at {interview.time}</p>
                      <p className="text-xs text-gray-500">{interview.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardWidget>
          </div>

          {/* Quick Actions */}
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
