'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService, ComplianceReminder } from '@/services/complianceService';
import { BellAlertIcon, CheckCircleIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function ComplianceRemindersPage() {
  const [reminders, setReminders] = useState<ComplianceReminder[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadData();
  }, [filter, page]);

  async function loadData() {
    setLoading(true);
    try {
      const [reminderData, statsData] = await Promise.all([
        complianceService.getReminders({ status: filter, page, size: 20 }),
        complianceService.getReminderStats(),
      ]);
      setReminders(reminderData.content);
      setTotalPages(reminderData.totalPages);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load reminders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge(id: number) {
    try {
      await complianceService.acknowledgeReminder(id);
      loadData();
    } catch (error: any) {
      alert(error.message || 'Failed to acknowledge reminder');
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'SENT': return <BellAlertIcon className="h-5 w-5 text-blue-500" />;
      case 'ACKNOWLEDGED': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'OVERDUE': return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SENT: 'bg-blue-100 text-blue-800',
      ACKNOWLEDGED: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const typeLabel = (type: string) => type.replace(/_/g, ' ');

  return (
    <FeatureGate feature="COMPLIANCE_REMINDERS">
      <PageWrapper title="Compliance Reminders" subtitle="Track certifications, warnings, and document expiries">
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', value: stats.pending || 0, color: 'text-yellow-600' },
              { label: 'Sent', value: stats.sent || 0, color: 'text-blue-600' },
              { label: 'Acknowledged', value: stats.acknowledged || 0, color: 'text-green-600' },
              { label: 'Overdue', value: stats.overdue || 0, color: 'text-red-600' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[undefined, 'PENDING', 'SENT', 'ACKNOWLEDGED', 'OVERDUE'].map((f) => (
              <button key={f || 'all'} onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {f || 'All'}
              </button>
            ))}
          </div>

          {/* Reminders */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <BellAlertIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No compliance reminders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div key={reminder.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {statusIcon(reminder.status)}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{reminder.title}</h4>
                        {reminder.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{reminder.description}</p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">{typeLabel(reminder.reminderType)}</span>
                          {reminder.employeeName && <span>Employee: {reminder.employeeName}</span>}
                          <span>Due: {new Date(reminder.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusBadge(reminder.status)}`}>{reminder.status}</span>
                      {(reminder.status === 'PENDING' || reminder.status === 'SENT') && (
                        <button onClick={() => handleAcknowledge(reminder.id)}
                          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Previous</button>
                  <span className="px-3 py-1 text-sm">Page {page + 1} of {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
