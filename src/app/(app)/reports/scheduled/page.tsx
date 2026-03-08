'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PlusIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface ScheduledReport {
  id: number | string;
  reportName: string;
  reportType: string;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  nextRun: string | null;
  recipients: string;
  enabled: boolean;
  createdAt: string;
}

const REPORT_TYPES = [
  'HEADCOUNT',
  'TURNOVER',
  'LEAVE_SUMMARY',
  'ATTENDANCE_SUMMARY',
  'PAYROLL_SUMMARY',
] as const;

const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'] as const;

export default function ScheduledReportsPage() {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    reportName: '',
    reportType: REPORT_TYPES[0] as string,
    frequency: 'WEEKLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY',
    recipients: '',
    enabled: true,
  });

  const loadSchedules = useCallback(async () => {
    try {
      const response = await apiFetch('/api/reports/scheduled');
      if (response.ok) {
        const data = await response.json();
        setSchedules(Array.isArray(data) ? data : data.data || []);
      } else if (response.status === 404) {
        // No backend yet, show empty state
        setSchedules([]);
      } else {
        setSchedules([]);
      }
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const handleToggle = useCallback(
    async (id: number | string, enabled: boolean) => {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, enabled } : s))
      );
      try {
        const response = await apiFetch(`/api/reports/scheduled/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ enabled }),
        });
        if (!response.ok && response.status !== 404) {
          // Revert on failure
          setSchedules((prev) =>
            prev.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s))
          );
          toast('Failed to update schedule', 'error');
        }
      } catch {
        // API may not exist yet, keep local state
      }
    },
    [toast]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.reportName.trim()) {
        toast('Please enter a report name', 'error');
        return;
      }
      if (!formData.recipients.trim()) {
        toast('Please enter at least one recipient email', 'error');
        return;
      }

      setSubmitting(true);
      try {
        const response = await apiFetch('/api/reports/scheduled', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const created = await response.json();
          setSchedules((prev) => [...prev, created]);
          toast('Scheduled report created successfully', 'success');
          setShowForm(false);
          setFormData({
            reportName: '',
            reportType: REPORT_TYPES[0],
            frequency: 'WEEKLY',
            recipients: '',
            enabled: true,
          });
        } else if (response.status === 404) {
          toast(
            'Scheduled reports API is not available yet. The schedule was saved locally.',
            'info'
          );
          const localSchedule: ScheduledReport = {
            id: `local_${Date.now()}`,
            reportName: formData.reportName,
            reportType: formData.reportType,
            frequency: formData.frequency,
            nextRun: null,
            recipients: formData.recipients,
            enabled: formData.enabled,
            createdAt: new Date().toISOString(),
          };
          setSchedules((prev) => [...prev, localSchedule]);
          setShowForm(false);
          setFormData({
            reportName: '',
            reportType: REPORT_TYPES[0],
            frequency: 'WEEKLY',
            recipients: '',
            enabled: true,
          });
        } else {
          const err = await response.json().catch(() => null);
          toast(err?.error || 'Failed to create scheduled report', 'error');
        }
      } catch {
        toast(
          'Scheduled reports API is not available yet. The schedule was saved locally.',
          'info'
        );
        const localSchedule: ScheduledReport = {
          id: `local_${Date.now()}`,
          reportName: formData.reportName,
          reportType: formData.reportType,
          frequency: formData.frequency,
          nextRun: null,
          recipients: formData.recipients,
          enabled: formData.enabled,
          createdAt: new Date().toISOString(),
        };
        setSchedules((prev) => [...prev, localSchedule]);
        setShowForm(false);
        setFormData({
          reportName: '',
          reportType: REPORT_TYPES[0],
          frequency: 'WEEKLY',
          recipients: '',
          enabled: true,
        });
      } finally {
        setSubmitting(false);
      }
    },
    [formData, toast]
  );

  const formatNextRun = (nextRun: string | null) => {
    if (!nextRun) return 'Not scheduled';
    try {
      return new Date(nextRun).toLocaleString();
    } catch {
      return nextRun;
    }
  };

  const frequencyBadgeColor = (frequency: string) => {
    switch (frequency) {
      case 'DAILY':
        return 'bg-blue-100 text-blue-800';
      case 'WEEKLY':
        return 'bg-green-100 text-green-800';
      case 'MONTHLY':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PageWrapper
      title="Scheduled Reports"
      subtitle="Manage automated report generation and delivery"
      actions={
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Reports
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            New Schedule
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Create New Schedule Form */}
        {showForm && (
          <div className="bg-white rounded-[10px] border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New Scheduled Report
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={formData.reportName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reportName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Weekly Headcount Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={formData.reportType}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        reportType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  >
                    {REPORT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        frequency: e.target.value as 'DAILY' | 'WEEKLY' | 'MONTHLY',
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  >
                    {FREQUENCIES.map((freq) => (
                      <option key={freq} value={freq}>
                        {freq.charAt(0) + freq.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (email)
                  </label>
                  <input
                    type="email"
                    value={formData.recipients}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recipients: e.target.value,
                      }))
                    }
                    placeholder="e.g., hr@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enabled: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-gold-500 border-gray-300 rounded focus:ring-gold-500"
                  />
                  Enabled
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    'Save Schedule'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scheduled Reports Table */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Scheduled Reports
          </h3>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No scheduled reports
              </h4>
              <p className="text-sm text-gray-500 mb-4">
                Create a schedule to automatically generate and deliver reports.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors text-sm font-medium"
              >
                <PlusIcon className="h-4 w-4" />
                Create First Schedule
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enabled
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {schedule.reportName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.reportType?.replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${frequencyBadgeColor(schedule.frequency)}`}
                        >
                          {schedule.frequency}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatNextRun(schedule.nextRun)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {schedule.recipients || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() =>
                            handleToggle(schedule.id, !schedule.enabled)
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 ${
                            schedule.enabled ? 'bg-gold-500' : 'bg-gray-200'
                          }`}
                          role="switch"
                          aria-checked={schedule.enabled}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              schedule.enabled
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back link */}
        <div className="pt-2">
          <Link
            href="/reports"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
}
