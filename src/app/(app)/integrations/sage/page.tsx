'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SageSyncStatus from '@/components/integrations/SageSyncStatus';
import {
  sageIntegrationService,
  SageConnectorConfig,
  SageSyncLog,
} from '@/services/sageIntegrationService';
import {
  Cog6ToothIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  SignalIcon,
  LinkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

export default function SageDashboardPage() {
  const [connectors, setConnectors] = useState<SageConnectorConfig[]>([]);
  const [recentLogs, setRecentLogs] = useState<SageSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [connectorsData, logsData] = await Promise.all([
        sageIntegrationService.getConnectors(),
        sageIntegrationService.getLogs(0, 5),
      ]);
      setConnectors(connectorsData);
      setRecentLogs(logsData.content);
    } catch {
      toast('Failed to load Sage integration dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeConnectors = connectors.filter((c) => c.isActive);
  const lastTestedConnectors = connectors.filter((c) => c.lastTestedAt);
  const successfulTests = lastTestedConnectors.filter((c) => c.lastTestSuccess);

  const actions = (
    <button
      onClick={loadDashboard}
      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider transition-colors"
    >
      <ArrowPathIcon className="w-4 h-4 mr-2" />
      Refresh
    </button>
  );

  return (
    <FeatureGate feature="SAGE_300_PEOPLE">
      <PageWrapper
        title="Sage Integration"
        subtitle="Monitor and manage Sage payroll integration connectors"
        actions={actions}
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/integrations/sage/config"
                className="flex items-center gap-2 bg-white rounded-sm shadow border p-4 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5 text-violet-500" />
                Connector Configuration
              </Link>
              <Link
                href="/integrations/sage/schedules"
                className="flex items-center gap-2 bg-white rounded-sm shadow border p-4 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                <CalendarDaysIcon className="w-5 h-5 text-green-500" />
                Sync Schedules
              </Link>
              <Link
                href="/integrations/sage/logs"
                className="flex items-center gap-2 bg-white rounded-sm shadow border p-4 hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
              >
                <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" />
                Sync Logs
              </Link>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <LinkIcon className="w-8 h-8 text-violet-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Connectors</p>
                    <p className="text-2xl font-semibold text-gray-900">{connectors.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active</p>
                    <p className="text-2xl font-semibold text-gray-900">{activeConnectors.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <SignalIcon className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Tested</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {successfulTests.length}/{lastTestedConnectors.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <ClockIcon className="w-8 h-8 text-yellow-500" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Recent Syncs</p>
                    <p className="text-2xl font-semibold text-gray-900">{recentLogs.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connector Status */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Connector Status</h2>
                <Link
                  href="/integrations/sage/config"
                  className="text-sm text-gold-600 hover:underline"
                >
                  Manage connectors
                </Link>
              </div>
              {connectors.length === 0 ? (
                <div className="bg-white rounded-sm shadow border p-6 text-center text-gray-500">
                  No connectors configured.{' '}
                  <Link href="/integrations/sage/config" className="text-gold-600 hover:underline">
                    Create one now
                  </Link>.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {connectors.map((connector) => (
                    <div key={connector.id} className="bg-white rounded-sm shadow border p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{connector.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{connector.connectorType.replace(/_/g, ' ')}</p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            connector.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {connector.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p>Auth: {connector.authMethod.replace(/_/g, ' ')}</p>
                        <p className="truncate">URL: {connector.baseUrl}</p>
                        {connector.lastTestedAt && (
                          <div className="flex items-center gap-1 pt-1">
                            {connector.lastTestSuccess ? (
                              <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <XCircleIcon className="w-3.5 h-3.5 text-red-500" />
                            )}
                            <span>
                              Last tested: {new Date(connector.lastTestedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sync Activity */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Recent Sync Activity</h2>
                <Link
                  href="/integrations/sage/logs"
                  className="text-sm text-gold-600 hover:underline"
                >
                  View all logs
                </Link>
              </div>
              {recentLogs.length === 0 ? (
                <div className="bg-white rounded-sm shadow border p-6 text-center text-gray-500">
                  No sync activity recorded yet.
                </div>
              ) : (
                <div className="bg-white rounded-sm shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Connector
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Entity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Records
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {log.connectorName}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{log.entityType}</td>
                          <td className="px-4 py-3">
                            <SageSyncStatus status={log.status} size="sm" />
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {log.recordsSucceeded}/{log.recordsProcessed}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(log.startedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
