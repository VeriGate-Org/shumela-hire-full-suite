'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import { ScaleIcon, ExclamationTriangleIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function LabourRelationsDashboardPage() {
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await complianceService.getLabourDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load labour relations dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const disciplinaryStats = dashboard.disciplinaryStats || {};
  const grievanceStats = dashboard.grievanceStats || {};

  if (loading) {
    return (
      <PageWrapper title="Labour Relations" subtitle="Manage disciplinary cases and employee grievances">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <FeatureGate feature="LABOUR_RELATIONS">
      <PageWrapper title="Labour Relations" subtitle="Manage disciplinary cases and employee grievances">
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/labour-relations/disciplinary">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-red-500 p-3 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Open Cases</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(disciplinaryStats.open || 0) + (disciplinaryStats.investigation || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/labour-relations/disciplinary">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-yellow-500 p-3 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hearings Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {disciplinaryStats.hearingScheduled || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/labour-relations/grievances">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Grievances</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(grievanceStats.filed || 0) + (grievanceStats.underReview || 0) + (grievanceStats.mediation || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <ScaleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(disciplinaryStats.closed || 0) + (grievanceStats.resolved || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disciplinary Cases Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disciplinary Cases</h3>
                <Link href="/admin/labour-relations/disciplinary"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Open</span>
                  <span className="text-lg font-bold text-red-600">{disciplinaryStats.open || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Under Investigation</span>
                  <span className="text-lg font-bold text-orange-600">{disciplinaryStats.investigation || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hearing Scheduled</span>
                  <span className="text-lg font-bold text-yellow-600">{disciplinaryStats.hearingScheduled || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hearing Completed</span>
                  <span className="text-lg font-bold text-blue-600">{disciplinaryStats.hearingCompleted || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Closed</span>
                  <span className="text-lg font-bold text-green-600">{disciplinaryStats.closed || 0}</span>
                </div>
              </div>
            </div>

            {/* Grievances Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grievances</h3>
                <Link href="/admin/labour-relations/grievances"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Filed</span>
                  <span className="text-lg font-bold text-blue-600">{grievanceStats.filed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Under Review</span>
                  <span className="text-lg font-bold text-yellow-600">{grievanceStats.underReview || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Mediation</span>
                  <span className="text-lg font-bold text-orange-600">{grievanceStats.mediation || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Escalated</span>
                  <span className="text-lg font-bold text-red-600">{grievanceStats.escalated || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Resolved</span>
                  <span className="text-lg font-bold text-green-600">{grievanceStats.resolved || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
