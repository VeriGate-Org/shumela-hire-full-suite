'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import { ShieldCheckIcon, DocumentTextIcon, BellAlertIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ComplianceDashboardPage() {
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [reminderStats, setReminderStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [dashData, remStats] = await Promise.all([
        complianceService.getDashboard(),
        complianceService.getReminderStats(),
      ]);
      setDashboard(dashData);
      setReminderStats(remStats);
    } catch (error) {
      console.error('Failed to load compliance dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const consentStats = dashboard.consentStats || {};
  const dsarStats = dashboard.dsarStats || {};

  if (loading) {
    return (
      <PageWrapper title="Compliance Dashboard" subtitle="POPIA compliance and data governance overview">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Compliance Dashboard" subtitle="POPIA compliance and data governance overview">
      <div className="space-y-6">
        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/compliance/consents">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Consent Records</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{consentStats.totalRecords || 0}</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/compliance/dsar">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-blue-500 p-3 rounded-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Open DSARs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(dsarStats.received || 0) + (dsarStats.inProgress || 0)}
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/admin/compliance/reminders">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-yellow-500 p-3 rounded-lg">
                  <BellAlertIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pending Reminders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{reminderStats.pending || 0}</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <div className="flex items-center">
              <div className="bg-red-500 p-3 rounded-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Overdue Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{reminderStats.overdue || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Consent Overview */}
        <FeatureGate feature="POPIA_COMPLIANCE">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consent Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Granted</span>
                  <span className="text-lg font-bold text-green-600">{consentStats.totalGranted || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Withdrawn</span>
                  <span className="text-lg font-bold text-red-600">{consentStats.totalWithdrawn || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Total Records</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{consentStats.totalRecords || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">DSAR Status</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Received</span>
                  <span className="text-lg font-bold text-blue-600">{dsarStats.received || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">In Progress</span>
                  <span className="text-lg font-bold text-yellow-600">{dsarStats.inProgress || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Completed</span>
                  <span className="text-lg font-bold text-green-600">{dsarStats.completed || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Total Requests</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{dsarStats.totalRequests || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </FeatureGate>
      </div>
    </PageWrapper>
  );
}
