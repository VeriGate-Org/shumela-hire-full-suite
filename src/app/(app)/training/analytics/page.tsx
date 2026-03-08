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
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { aiTrainingService } from '@/services/aiTrainingService';
import { TrainingRoiResult } from '@/types/ai';

export default function TrainingAnalyticsPage() {
  const [analytics, setAnalytics] = useState<TrainingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiRoi, setAiRoi] = useState<TrainingRoiResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    trainingService.getAnalytics().then(data => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  async function analyzeRoi() {
    if (!analytics) return;
    setAiLoading(true);
    try {
      const result = await aiTrainingService.analyzeRoi({
        courseName: 'All Courses',
        enrollmentCount: analytics.totalEnrollments || 0,
        completionCount: analytics.completedEnrollments || 0,
        totalCost: 0,
        department: 'All Departments',
      });
      setAiRoi(result);
    } catch (error) {
      console.error('AI ROI analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

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
        actions={
          <button onClick={analyzeRoi} disabled={aiLoading || !analytics}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            {aiLoading ? 'Analysing...' : 'AI ROI Analysis'}
          </button>
        }
      >
        <div className="space-y-6">
          {aiRoi && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-purple-900 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  AI Training ROI Analysis
                </h3>
                <button onClick={() => setAiRoi(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
              </div>
              <p className="text-sm text-gray-700 mb-3">{aiRoi.roiSummary}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-700">{aiRoi.estimatedRoiPercentage}%</p>
                  <p className="text-xs text-gray-500">Estimated ROI</p>
                </div>
                <div className="bg-white p-3 rounded-lg text-center">
                  <p className="text-lg font-bold text-gray-700">{aiRoi.effectivenessRating}</p>
                  <p className="text-xs text-gray-500">Effectiveness</p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Recommendations</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {aiRoi.recommendations?.slice(0, 3).map((r, i) => <li key={i}>- {r}</li>)}
                  </ul>
                </div>
              </div>
              {aiRoi.keyFindings?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Key Findings</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {aiRoi.keyFindings.map((f, i) => <li key={i}>- {f}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

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
