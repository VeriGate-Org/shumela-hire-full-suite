'use client';

import { SageSyncLog } from '@/services/sageIntegrationService';
import SageSyncStatus from './SageSyncStatus';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface SageSyncLogTableProps {
  logs: SageSyncLog[];
  loading: boolean;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return 'Running...';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diffMs = end - start;

  if (diffMs < 1000) return `${diffMs}ms`;
  if (diffMs < 60000) return `${Math.round(diffMs / 1000)}s`;
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.round((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

export default function SageSyncLogTable({ logs, loading }: SageSyncLogTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-sm shadow p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Loading sync logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-sm shadow p-8 text-center">
        <ClockIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No sync logs recorded yet.</p>
        <p className="text-gray-400 text-xs mt-1">Sync logs will appear here once a sync schedule runs.</p>
      </div>
    );
  }

  return (
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
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Records
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {log.connectorName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {log.entityType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    {log.direction === 'INBOUND' ? (
                      <ArrowDownIcon className="w-3.5 h-3.5 text-blue-500" />
                    ) : (
                      <ArrowUpIcon className="w-3.5 h-3.5 text-green-500" />
                    )}
                    {log.direction}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SageSyncStatus status={log.status} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-900">
                      {log.recordsSucceeded}/{log.recordsProcessed} succeeded
                    </span>
                    {log.recordsFailed > 0 && (
                      <span className="text-red-500 text-xs">
                        {log.recordsFailed} failed
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDuration(log.startedAt, log.completedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="flex flex-col">
                    <span>{formatDateTime(log.startedAt)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
