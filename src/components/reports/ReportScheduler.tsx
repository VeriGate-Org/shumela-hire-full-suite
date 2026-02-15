'use client';

import React, { useState, useCallback } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  EnvelopeIcon,
  PauseIcon,
  PlayIcon,
  Cog6ToothIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { SavedReport } from './ReportLibrary';

export interface ReportSchedule {
  id: string;
  reportId: string;
  reportName: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  enabled: boolean;
  nextRun: string;
  lastRun?: string;
  createdAt: string;
  runCount: number;
  lastStatus: 'success' | 'failed' | 'running' | 'pending';
  errorMessage?: string;
}

interface ReportSchedulerProps {
  schedules: ReportSchedule[];
  availableReports: SavedReport[];
  onCreateSchedule: (reportId: string, config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    enabled: boolean;
  }) => void;
  onUpdateSchedule: (scheduleId: string, updates: Partial<ReportSchedule>) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onToggleSchedule: (scheduleId: string, enabled: boolean) => void;
  onRunNow: (scheduleId: string) => void;
  className?: string;
}

export default function ReportScheduler({
  schedules,
  availableReports,
  onCreateSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
  onToggleSchedule,
  onRunNow,
  className = '',
}: ReportSchedulerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    reportId: '',
    frequency: 'weekly' as const,
    recipients: '',
    enabled: true,
  });

  const handleCreateSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.reportId || !formData.recipients.trim()) {
      return;
    }

    const recipients = formData.recipients
      .split(',')
      .map(email => email.trim())
      .filter(email => email.includes('@'));

    onCreateSchedule(formData.reportId, {
      frequency: formData.frequency,
      recipients,
      enabled: formData.enabled,
    });

    // Reset form
    setFormData({
      reportId: '',
      frequency: 'weekly',
      recipients: '',
      enabled: true,
    });
    setShowCreateForm(false);
  }, [formData, onCreateSchedule]);

  const formatNextRun = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: ReportSchedule['lastStatus']) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'running':
        return 'text-violet-600 bg-violet-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Report Scheduler</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage automated report generation and delivery
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
          >
            Schedule New Report
          </button>
        </div>
      </div>

      {/* Create Schedule Form */}
      {showCreateForm && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Report *
                </label>
                <select
                  value={formData.reportId}
                  onChange={(e) => setFormData(prev => ({ ...prev, reportId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  required
                >
                  <option value="">Choose a report...</option>
                  {availableReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.name}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipients (comma-separated emails) *
              </label>
              <textarea
                value={formData.recipients}
                onChange={(e) => setFormData(prev => ({ ...prev, recipients: e.target.value }))}
                placeholder="user1@company.com, user2@company.com"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                required
              />
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500/60"
                />
                <span className="ml-2 text-sm text-gray-700">Enable schedule immediately</span>
              </label>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
              >
                Create Schedule
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Schedules List */}
      <div className="divide-y divide-gray-200">
        {schedules.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No scheduled reports</h3>
            <p className="text-gray-500 mb-4">
              Create automated schedules to deliver reports regularly to your team
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
            >
              Schedule Your First Report
            </button>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div key={schedule.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {schedule.reportName}
                    </h3>
                    
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(schedule.lastStatus)}`}>
                      {schedule.lastStatus}
                    </span>
                    
                    {!schedule.enabled && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                        Paused
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      <span>{getFrequencyLabel(schedule.frequency)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-2" />
                      <span>Next: {formatNextRun(schedule.nextRun)}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2" />
                      <span>{schedule.recipients.length} recipients</span>
                    </div>
                  </div>
                  
                  {schedule.lastRun && (
                    <div className="mt-2 text-sm text-gray-500">
                      Last run: {new Date(schedule.lastRun).toLocaleString()} ({schedule.runCount} total runs)
                    </div>
                  )}
                  
                  {schedule.errorMessage && (
                    <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                      Error: {schedule.errorMessage}
                    </div>
                  )}
                  
                  <div className="mt-3">
                    <details className="group">
                      <summary className="cursor-pointer text-sm text-violet-600 hover:text-violet-700">
                        View recipients ({schedule.recipients.length})
                      </summary>
                      <div className="mt-2 pl-4 text-sm text-gray-600">
                        {schedule.recipients.map((email, index) => (
                          <div key={index}>{email}</div>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onRunNow(schedule.id)}
                    disabled={schedule.lastStatus === 'running'}
                    className="p-2 text-gray-400 hover:text-violet-600 rounded disabled:opacity-50"
                    title="Run now"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onToggleSchedule(schedule.id, !schedule.enabled)}
                    className={`p-2 rounded ${
                      schedule.enabled
                        ? 'text-gray-400 hover:text-yellow-600'
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                    title={schedule.enabled ? 'Pause' : 'Resume'}
                  >
                    {schedule.enabled ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                  </button>
                  
                  <button
                    onClick={() => setEditingSchedule(schedule.id)}
                    className="p-2 text-gray-400 hover:text-violet-600 rounded"
                    title="Edit"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onDeleteSchedule(schedule.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
