'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeDashboardProps {
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

interface InternalJob {
  id: number | string;
  title: string;
  department: string;
  location: string;
  closingIn: number;
}

interface TrainingModule {
  id: number | string;
  title: string;
  progress: number;
  status: 'completed' | 'in_progress' | 'not_started';
}

const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({
  selectedTimeframe: _selectedTimeframe,
  onTimeframeChange: _onTimeframeChange,
}) => {
  const { user } = useAuth();
  const [internalJobs, setInternalJobs] = useState<InternalJob[]>([]);
  // Training modules endpoint does not exist yet — initialize as empty
  const [trainingModules] = useState<TrainingModule[]>([]);
  const [myApplicationsCount, setMyApplicationsCount] = useState(0);
  // BUG-005 fix: compute profile completeness from employee profile data
  const [profileCompleteness, setProfileCompleteness] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [jobsRes] = await Promise.all([
          apiFetch('/api/internal/jobs?size=5'),
        ]);

        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const items = jobsData.content ?? jobsData ?? [];
          setInternalJobs(
            items.map((job: Record<string, unknown>) => {
              // Compute closingIn from closingDate if available
              let closingIn = 0;
              if (job.closingDate) {
                const closing = new Date(job.closingDate as string);
                const now = new Date();
                closingIn = Math.max(0, Math.ceil((closing.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
              } else if (typeof job.closingIn === 'number') {
                closingIn = job.closingIn;
              }

              return {
                id: job.id,
                title: (job.title ?? job.jobTitle ?? '') as string,
                department: (job.department ?? '') as string,
                location: (job.location ?? '') as string,
                closingIn,
              };
            })
          );
        }

        // Try to get internal application count
        try {
          const appsRes = await apiFetch('/api/internal/applications?size=1');
          if (appsRes.ok) {
            const appsData = await appsRes.json();
            setMyApplicationsCount(appsData.totalElements ?? (appsData.content ?? appsData ?? []).length);
          }
        } catch {
          // Endpoint may not exist yet
        }

        // BUG-005 fix: fetch employee profile to compute completeness
        const employeeId = user?.employeeId || user?.id;
        if (employeeId) {
          try {
            const profileRes = await apiFetch(`/api/employee/profile?employeeId=${employeeId}`);
            if (profileRes.ok) {
              const profile = await profileRes.json();
              // Compute completeness based on key profile fields
              const fields = [
                profile.firstName, profile.lastName, profile.email,
                profile.phone, profile.department, profile.jobTitle,
                profile.hireDate, profile.physicalAddress, profile.city,
                profile.emergencyContactName,
              ];
              const filled = fields.filter((f) => f != null && f !== '').length;
              setProfileCompleteness(Math.round((filled / fields.length) * 100));
            }
          } catch {
            // Profile endpoint may fail — leave as null
          }
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-sm border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
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
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Open Internal Positions</h4>
          <p className="text-2xl font-bold text-gold-600 mt-1">{internalJobs.length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">My Applications</h4>
          <p className="text-2xl font-bold text-purple-600 mt-1">{myApplicationsCount}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Training Completed</h4>
          <p className="text-2xl font-bold text-green-600 mt-1">{trainingModules.filter(t => t.status === 'completed').length}</p>
        </div>
        <div className="bg-white rounded-sm border border-gray-200 p-5">
          <h4 className="text-sm font-medium text-gray-500">Profile Completeness</h4>
          {/* BUG-005 fix: show computed percentage or graceful fallback instead of hardcoded dash */}
          <p className="text-2xl font-bold text-teal-600 mt-1">
            {profileCompleteness != null ? `${profileCompleteness}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Internal Job Openings */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Internal Job Openings</h3>
          <Link href="/internal/jobs" className="text-sm font-medium text-gold-600 hover:text-gold-800">
            View All
          </Link>
        </div>
        {internalJobs.length === 0 ? (
          <p className="text-gray-500 text-sm">No internal positions available at this time.</p>
        ) : (
          <div className="space-y-3">
            {internalJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
                <div>
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.department} — {job.location}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Closes in {job.closingIn} days</p>
                  <Link href={`/internal/jobs/${job.id}`} className="text-sm font-medium text-gold-600 hover:text-gold-800">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Training Modules */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Training Modules</h3>
          <Link href="/training" className="text-sm font-medium text-gold-600 hover:text-gold-800">
            View All
          </Link>
        </div>
        {trainingModules.length === 0 ? (
          <p className="text-gray-500 text-sm">No training modules available at this time.</p>
        ) : (
          <div className="space-y-3">
            {trainingModules.map((module) => (
              <div key={module.id} className="p-4 bg-gray-50 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{module.title}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    module.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : module.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {module.status === 'completed' ? 'Completed' : module.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${module.status === 'completed' ? 'bg-green-500' : 'bg-gold-500'}`}
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{module.progress}% complete</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links — static UI config */}
      <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/profile" className="p-4 bg-gold-50 rounded-sm text-center hover:bg-gold-100 transition-colors">
            <p className="font-medium text-violet-900">My Profile</p>
            <p className="text-sm text-gold-600">Update your information</p>
          </Link>
          <Link href="/internal/jobs" className="p-4 bg-purple-50 rounded-sm text-center hover:bg-purple-100 transition-colors">
            <p className="font-medium text-purple-900">Internal Jobs</p>
            <p className="text-sm text-purple-600">Browse opportunities</p>
          </Link>
          <Link href="/training" className="p-4 bg-green-50 rounded-sm text-center hover:bg-green-100 transition-colors">
            <p className="font-medium text-green-900">Training</p>
            <p className="text-sm text-green-600">Continue learning</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
