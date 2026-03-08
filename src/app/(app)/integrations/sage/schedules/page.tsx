'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SageScheduleForm from '@/components/integrations/SageScheduleForm';
import SageSyncStatus from '@/components/integrations/SageSyncStatus';
import {
  sageIntegrationService,
  SageSyncSchedule,
  SageConnectorConfig,
} from '@/services/sageIntegrationService';
import {
  PlusIcon,
  PencilSquareIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

export default function SageSchedulesPage() {
  const [schedules, setSchedules] = useState<SageSyncSchedule[]>([]);
  const [connectors, setConnectors] = useState<SageConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SageSyncSchedule | null>(null);
  const [runningId, setRunningId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedulesData, connectorsData] = await Promise.all([
        sageIntegrationService.getSchedules(),
        sageIntegrationService.getConnectors(),
      ]);
      setSchedules(schedulesData);
      setConnectors(connectorsData);
    } catch {
      toast('Failed to load schedules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingSchedule(null);
    loadData();
  };

  const handleEdit = (schedule: SageSyncSchedule) => {
    setEditingSchedule(schedule);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingSchedule(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSchedule(null);
  };

  const handleRunNow = async (scheduleId: number) => {
    setRunningId(scheduleId);
    try {
      await sageIntegrationService.runSchedule(scheduleId);
      toast('Sync triggered successfully', 'success');
      loadData();
    } catch {
      toast('Failed to trigger sync', 'error');
    } finally {
      setRunningId(null);
    }
  };

  const handleToggleActive = async (schedule: SageSyncSchedule) => {
    try {
      await sageIntegrationService.updateSchedule(schedule.id, {
        isActive: !schedule.isActive,
      });
      toast(
        `Schedule ${schedule.isActive ? 'paused' : 'activated'} successfully`,
        'success'
      );
      loadData();
    } catch {
      toast('Failed to update schedule', 'error');
    }
  };

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case 'INBOUND':
        return <ArrowDownIcon className="w-4 h-4 text-blue-500" />;
      case 'OUTBOUND':
        return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
      case 'BIDIRECTIONAL':
        return <ArrowsRightLeftIcon className="w-4 h-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  const activeConnectors = connectors.filter((c) => c.isActive);

  const actions = !showForm ? (
    <button
      onClick={handleCreate}
      disabled={activeConnectors.length === 0}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gold-500 text-violet-950 hover:bg-gold-600 disabled:opacity-50 uppercase tracking-wider transition-colors"
      title={activeConnectors.length === 0 ? 'No active connectors available' : undefined}
    >
      <PlusIcon className="w-4 h-4" />
      New Schedule
    </button>
  ) : undefined;

  return (
    <FeatureGate feature="SAGE_300_PEOPLE">
      <PageWrapper
        title="Sync Schedules"
        subtitle="Manage automated synchronization schedules between ShumelaHire and Sage"
        actions={actions}
      >
        {showForm ? (
          <SageScheduleForm
            schedule={editingSchedule}
            connectors={activeConnectors}
            onSaved={handleFormSaved}
            onCancel={handleCancel}
          />
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-sm shadow p-12 text-center">
            <CalendarDaysIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sync Schedules</h3>
            <p className="text-gray-500 text-sm mb-6">
              Create a sync schedule to automatically synchronize data between ShumelaHire and Sage.
            </p>
            {activeConnectors.length > 0 ? (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gold-500 text-violet-950 hover:bg-gold-600 uppercase tracking-wider transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Schedule
              </button>
            ) : (
              <p className="text-sm text-orange-600">
                You need at least one active connector before creating schedules.
              </p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-sm shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Connector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Run
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Next Run
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {schedule.connectorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {schedule.entityType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          {getDirectionIcon(schedule.direction)}
                          {schedule.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>
                          <span>{schedule.frequency.replace(/_/g, ' ')}</span>
                          <p className="text-xs text-gray-400 font-mono mt-0.5">
                            {schedule.cronExpression}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <SageSyncStatus
                          status={schedule.isActive ? 'SCHEDULED' : 'PAUSED'}
                          size="sm"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(schedule.lastRunAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {schedule.isActive ? formatDateTime(schedule.nextRunAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleRunNow(schedule.id)}
                            disabled={runningId === schedule.id}
                            title="Run now"
                            className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
                          >
                            {runningId === schedule.id ? (
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                            ) : (
                              <PlayIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleToggleActive(schedule)}
                            title={schedule.isActive ? 'Pause schedule' : 'Activate schedule'}
                            className={`p-2 rounded-full transition-colors ${
                              schedule.isActive
                                ? 'text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50'
                                : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                            }`}
                          >
                            {schedule.isActive ? (
                              <PauseIcon className="w-4 h-4" />
                            ) : (
                              <PlayIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(schedule)}
                            title="Edit schedule"
                            className="p-2 text-gray-500 hover:text-gold-700 hover:bg-gold-50 rounded-full transition-colors"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
