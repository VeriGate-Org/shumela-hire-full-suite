'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, TrainingAnalytics } from '@/services/trainingService';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function TrainingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trainingService.getAnalytics().then(data => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Training Analytics" subtitle="Loading...">
          <div className="text-center py-12 text-gray-500">Loading analytics...</div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  const stats = [
    { label: 'Total Courses', value: analytics?.totalCourses ?? 0, icon: AcademicCapIcon, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active Courses', value: analytics?.activeCourses ?? 0, icon: AcademicCapIcon, color: 'text-green-600 bg-green-50' },
    { label: 'Mandatory Courses', value: analytics?.mandatoryCourses ?? 0, icon: AcademicCapIcon, color: 'text-red-600 bg-red-50' },
    { label: 'Total Sessions', value: analytics?.totalSessions ?? 0, icon: CalendarDaysIcon, color: 'text-purple-600 bg-purple-50' },
    { label: 'Upcoming Sessions', value: analytics?.upcomingSessions ?? 0, icon: CalendarDaysIcon, color: 'text-orange-600 bg-orange-50' },
    { label: 'Open Sessions', value: analytics?.openSessions ?? 0, icon: CalendarDaysIcon, color: 'text-teal-600 bg-teal-50' },
    { label: 'Total Enrollments', value: analytics?.totalEnrollments ?? 0, icon: UserGroupIcon, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Completed', value: analytics?.completedEnrollments ?? 0, icon: CheckCircleIcon, color: 'text-green-600 bg-green-50' },
    { label: 'Active Certifications', value: analytics?.activeCertifications ?? 0, icon: ShieldCheckIcon, color: 'text-blue-600 bg-blue-50' },
    { label: 'Expiring Soon', value: analytics?.expiringCertifications ?? 0, icon: ExclamationTriangleIcon, color: 'text-yellow-600 bg-yellow-50' },
    { label: 'Expired Certs', value: analytics?.expiredCertifications ?? 0, icon: ExclamationTriangleIcon, color: 'text-red-600 bg-red-50' },
  ];

  const completionRate = analytics && analytics.totalEnrollments > 0
    ? Math.round((analytics.completedEnrollments / analytics.totalEnrollments) * 100)
    : 0;

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Training Analytics"
        subtitle="Overview of training and development metrics"
      >
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="bg-white rounded-lg shadow border p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Training Completion Rate</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
              <span className="text-lg font-bold text-gray-900">{completionRate}%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {analytics?.completedEnrollments ?? 0} completed out of {analytics?.totalEnrollments ?? 0} total enrollments
            </p>
          </div>

          {/* Categories */}
          {analytics?.categories && analytics.categories.length > 0 && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Course Categories</h3>
              <div className="flex flex-wrap gap-2">
                {analytics.categories.map(cat => (
                  <span key={cat} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
