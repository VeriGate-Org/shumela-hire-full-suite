'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import {
  SageSyncSchedule,
  SageConnectorConfig,
  sageIntegrationService,
} from '@/services/sageIntegrationService';

interface SageScheduleFormProps {
  schedule?: SageSyncSchedule | null;
  connectors: SageConnectorConfig[];
  onSaved: () => void;
  onCancel: () => void;
}

const ENTITY_TYPES = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'POSITION', label: 'Position' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'LEAVE', label: 'Leave' },
  { value: 'COST_CENTRE', label: 'Cost Centre' },
  { value: 'TAX', label: 'Tax' },
  { value: 'BENEFITS', label: 'Benefits' },
];

const DIRECTIONS = [
  { value: 'INBOUND', label: 'Inbound (Sage to ShumelaHire)' },
  { value: 'OUTBOUND', label: 'Outbound (ShumelaHire to Sage)' },
  { value: 'BIDIRECTIONAL', label: 'Bidirectional' },
];

const FREQUENCIES = [
  { value: 'EVERY_15_MINUTES', label: 'Every 15 Minutes', cron: '0 */15 * * * *' },
  { value: 'EVERY_30_MINUTES', label: 'Every 30 Minutes', cron: '0 */30 * * * *' },
  { value: 'HOURLY', label: 'Hourly', cron: '0 0 * * * *' },
  { value: 'EVERY_6_HOURS', label: 'Every 6 Hours', cron: '0 0 */6 * * *' },
  { value: 'DAILY', label: 'Daily (midnight)', cron: '0 0 0 * * *' },
  { value: 'WEEKLY', label: 'Weekly (Sunday midnight)', cron: '0 0 0 * * SUN' },
  { value: 'MONTHLY', label: 'Monthly (1st at midnight)', cron: '0 0 0 1 * *' },
  { value: 'CUSTOM', label: 'Custom Cron Expression', cron: '' },
];

export default function SageScheduleForm({ schedule, connectors, onSaved, onCancel }: SageScheduleFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    connectorId: connectors[0]?.id ?? 0,
    entityType: 'EMPLOYEE',
    direction: 'INBOUND',
    frequency: 'DAILY',
    cronExpression: '0 0 0 * * *',
  });

  useEffect(() => {
    if (schedule) {
      const matchedFrequency = FREQUENCIES.find((f) => f.cron === schedule.cronExpression);
      setForm({
        connectorId: schedule.connectorId,
        entityType: schedule.entityType,
        direction: schedule.direction,
        frequency: matchedFrequency ? matchedFrequency.value : 'CUSTOM',
        cronExpression: schedule.cronExpression,
      });
    }
  }, [schedule]);

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-set cron expression when frequency changes
      if (field === 'frequency') {
        const freqOption = FREQUENCIES.find((f) => f.value === value);
        if (freqOption && freqOption.value !== 'CUSTOM') {
          updated.cronExpression = freqOption.cron;
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.connectorId || !form.cronExpression.trim()) {
      toast('Connector and cron expression are required', 'error');
      return;
    }

    setSaving(true);
    try {
      if (schedule) {
        await sageIntegrationService.updateSchedule(schedule.id, {
          entityType: form.entityType,
          direction: form.direction,
          frequency: form.frequency,
          cronExpression: form.cronExpression,
        });
        toast('Schedule updated successfully', 'success');
      } else {
        await sageIntegrationService.createSchedule({
          connectorId: form.connectorId,
          entityType: form.entityType,
          direction: form.direction,
          frequency: form.frequency,
          cronExpression: form.cronExpression,
        });
        toast('Schedule created successfully', 'success');
      }
      onSaved();
    } catch {
      toast('Failed to save schedule', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {schedule ? 'Edit Sync Schedule' : 'New Sync Schedule'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Connector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connector <span className="text-red-500">*</span>
            </label>
            <select
              value={form.connectorId}
              onChange={(e) => handleChange('connectorId', Number(e.target.value))}
              disabled={!!schedule}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {connectors.length === 0 && (
                <option value="">No connectors available</option>
              )}
              {connectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.entityType}
              onChange={(e) => handleChange('entityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            >
              {ENTITY_TYPES.map((et) => (
                <option key={et.value} value={et.value}>
                  {et.label}
                </option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sync Direction <span className="text-red-500">*</span>
            </label>
            <select
              value={form.direction}
              onChange={(e) => handleChange('direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            >
              {DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency <span className="text-red-500">*</span>
            </label>
            <select
              value={form.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            >
              {FREQUENCIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Cron Expression */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cron Expression <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.cronExpression}
              onChange={(e) => handleChange('cronExpression', e.target.value)}
              disabled={form.frequency !== 'CUSTOM'}
              placeholder="0 0 0 * * *"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              Format: second minute hour day-of-month month day-of-week
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || connectors.length === 0}
          className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gold-500 text-violet-950 hover:bg-gold-600 disabled:opacity-50 uppercase tracking-wider transition-colors"
        >
          {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
          {saving ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
        </button>
      </div>
    </form>
  );
}
