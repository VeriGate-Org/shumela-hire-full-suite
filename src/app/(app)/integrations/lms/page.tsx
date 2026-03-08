'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { lmsService, LmsConnector, LmsSyncLog } from '@/services/lmsService';
import { useToast } from '@/components/Toast';

export default function LmsIntegrationPage() {
  const [connectors, setConnectors] = useState<LmsConnector[]>([]);
  const [syncLogs, setSyncLogs] = useState<LmsSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [syncing, setSyncing] = useState<Record<number, boolean>>({});
  const [testing, setTesting] = useState<Record<number, boolean>>({});
  const [newConnector, setNewConnector] = useState({
    name: '',
    providerType: 'MOODLE',
    baseUrl: '',
    apiKey: '',
    isActive: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [connectorsData, logsData] = await Promise.all([
        lmsService.getConnectors(),
        lmsService.getSyncLogs(0, 10),
      ]);
      setConnectors(connectorsData);
      setSyncLogs(logsData.content);
    } catch {
      toast('Failed to load LMS integration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnector = async () => {
    try {
      await lmsService.createConnector(newConnector);
      toast('LMS connector created successfully', 'success');
      setShowCreateForm(false);
      setNewConnector({ name: '', providerType: 'MOODLE', baseUrl: '', apiKey: '', isActive: false });
      const data = await lmsService.getConnectors();
      setConnectors(data);
    } catch {
      toast('Failed to create connector', 'error');
    }
  };

  const handleTestConnection = async (id: number) => {
    setTesting((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await lmsService.testConnection(id);
      toast(result.message, result.success ? 'success' : 'error');
    } catch {
      toast('Connection test failed', 'error');
    } finally {
      setTesting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSync = async (id: number, syncType: string) => {
    setSyncing((prev) => ({ ...prev, [id]: true }));
    try {
      const log = await lmsService.triggerSync(id, syncType);
      toast(
        log.status === 'COMPLETED'
          ? `Sync completed: ${log.recordsSynced} records`
          : `Sync ${log.status.toLowerCase()}`,
        log.status === 'COMPLETED' ? 'success' : 'error',
      );
      // Refresh logs
      const logsData = await lmsService.getSyncLogs(0, 10);
      setSyncLogs(logsData.content);
      // Refresh connectors (for lastSyncedAt)
      const connectorsData = await lmsService.getConnectors();
      setConnectors(connectorsData);
    } catch {
      toast('Sync failed', 'error');
    } finally {
      setSyncing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleActive = async (connector: LmsConnector) => {
    try {
      await lmsService.updateConnector(connector.id, { isActive: !connector.isActive });
      toast(`Connector ${!connector.isActive ? 'activated' : 'deactivated'}`, 'success');
      const data = await lmsService.getConnectors();
      setConnectors(data);
    } catch {
      toast('Failed to update connector', 'error');
    }
  };

  const handleDeleteConnector = async (id: number) => {
    if (!confirm('Are you sure you want to delete this connector?')) return;
    try {
      await lmsService.deleteConnector(id);
      toast('Connector deleted', 'success');
      const data = await lmsService.getConnectors();
      setConnectors(data);
    } catch {
      toast('Failed to delete connector', 'error');
    }
  };

  const getProviderLabel = (type: string) => {
    switch (type) {
      case 'MOODLE': return 'Moodle';
      case 'CANVAS': return 'Canvas LMS';
      case 'BLACKBOARD': return 'Blackboard';
      case 'CUSTOM': return 'Custom';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-400 bg-green-900/50';
      case 'RUNNING': return 'text-blue-400 bg-blue-900/50';
      case 'FAILED': return 'text-red-400 bg-red-900/50';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  return (
    <FeatureGate feature="LMS_INTEGRATION">
      <PageWrapper title="LMS Integration" subtitle="Connect and sync with your Learning Management System">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Total Connectors</p>
                <p className="text-2xl font-bold text-violet-400 mt-1">{connectors.length}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Active</p>
                <p className="text-2xl font-bold text-green-400 mt-1">
                  {connectors.filter((c) => c.isActive).length}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Recent Syncs</p>
                <p className="text-2xl font-bold text-cyan-400 mt-1">{syncLogs.length}</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Failed Syncs</p>
                <p className="text-2xl font-bold text-red-400 mt-1">
                  {syncLogs.filter((l) => l.status === 'FAILED').length}
                </p>
              </div>
            </div>

            {/* Create Connector Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 uppercase tracking-wider transition-colors"
              >
                {showCreateForm ? 'Cancel' : 'Add LMS Connector'}
              </button>
            </div>

            {/* Create Connector Form */}
            {showCreateForm && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">New LMS Connector</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={newConnector.name}
                      onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                      placeholder="e.g. Company Moodle"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Provider</label>
                    <select
                      value={newConnector.providerType}
                      onChange={(e) => setNewConnector({ ...newConnector, providerType: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                    >
                      <option value="MOODLE">Moodle</option>
                      <option value="CANVAS">Canvas LMS</option>
                      <option value="BLACKBOARD">Blackboard</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Base URL</label>
                    <input
                      type="url"
                      value={newConnector.baseUrl}
                      onChange={(e) => setNewConnector({ ...newConnector, baseUrl: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                      placeholder="https://lms.company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">API Key</label>
                    <input
                      type="password"
                      value={newConnector.apiKey}
                      onChange={(e) => setNewConnector({ ...newConnector, apiKey: e.target.value })}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                      placeholder="API key"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={newConnector.isActive}
                      onChange={(e) => setNewConnector({ ...newConnector, isActive: e.target.checked })}
                      className="rounded border-gray-600 bg-gray-900 text-violet-600 focus:ring-violet-500"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-400">Activate immediately</label>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleCreateConnector}
                    disabled={!newConnector.name || !newConnector.baseUrl}
                    className="px-4 py-2 text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 uppercase tracking-wider transition-colors"
                  >
                    Save Connector
                  </button>
                </div>
              </div>
            )}

            {/* Connectors List */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">LMS Connectors</h3>
              {connectors.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No LMS connectors configured yet.</p>
              ) : (
                <div className="space-y-4">
                  {connectors.map((connector) => (
                    <div key={connector.id} className="bg-gray-900 rounded-lg p-4 border border-gray-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-white font-medium">{connector.name}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-violet-900/50 text-violet-400">
                              {getProviderLabel(connector.providerType)}
                            </span>
                            <span>{connector.baseUrl}</span>
                            {connector.lastSyncedAt && (
                              <span>Last sync: {new Date(connector.lastSyncedAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              connector.isActive
                                ? 'bg-green-900/50 text-green-400'
                                : 'bg-gray-700 text-gray-400'
                            }`}
                          >
                            {connector.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleTestConnection(connector.id)}
                          disabled={testing[connector.id]}
                          className="px-3 py-1 text-xs font-medium rounded-full border border-cyan-500 text-cyan-400 hover:bg-cyan-900/30 disabled:opacity-50 uppercase tracking-wider transition-colors"
                        >
                          {testing[connector.id] ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          onClick={() => handleSync(connector.id, 'COURSES')}
                          disabled={syncing[connector.id] || !connector.isActive}
                          className="px-3 py-1 text-xs font-medium rounded-full border border-green-500 text-green-400 hover:bg-green-900/30 disabled:opacity-50 uppercase tracking-wider transition-colors"
                        >
                          {syncing[connector.id] ? 'Syncing...' : 'Sync Courses'}
                        </button>
                        <button
                          onClick={() => handleSync(connector.id, 'ENROLLMENTS')}
                          disabled={syncing[connector.id] || !connector.isActive}
                          className="px-3 py-1 text-xs font-medium rounded-full border border-blue-500 text-blue-400 hover:bg-blue-900/30 disabled:opacity-50 uppercase tracking-wider transition-colors"
                        >
                          Sync Enrollments
                        </button>
                        <button
                          onClick={() => handleToggleActive(connector)}
                          className="px-3 py-1 text-xs font-medium rounded-full border border-amber-500 text-amber-400 hover:bg-amber-900/30 uppercase tracking-wider transition-colors"
                        >
                          {connector.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteConnector(connector.id)}
                          className="px-3 py-1 text-xs font-medium rounded-full border border-red-500 text-red-400 hover:bg-red-900/30 uppercase tracking-wider transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Logs */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Sync Logs</h3>
              {syncLogs.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No sync logs yet. Trigger a sync to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 font-medium">Connector</th>
                        <th className="text-left py-2 font-medium">Sync Type</th>
                        <th className="text-center py-2 font-medium">Status</th>
                        <th className="text-right py-2 font-medium">Records</th>
                        <th className="text-right py-2 font-medium">Started</th>
                        <th className="text-right py-2 font-medium">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {syncLogs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-700/50">
                          <td className="py-2 text-gray-300">{log.connectorName}</td>
                          <td className="py-2 text-gray-400">{log.syncType}</td>
                          <td className="py-2 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-2 text-right text-violet-400">{log.recordsSynced}</td>
                          <td className="py-2 text-right text-gray-500 text-xs">
                            {log.startedAt ? new Date(log.startedAt).toLocaleString() : '-'}
                          </td>
                          <td className="py-2 text-right text-gray-500 text-xs">
                            {log.completedAt ? new Date(log.completedAt).toLocaleString() : '-'}
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
