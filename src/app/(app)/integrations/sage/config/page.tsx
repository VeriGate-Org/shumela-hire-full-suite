'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SageConfigForm from '@/components/integrations/SageConfigForm';
import {
  sageIntegrationService,
  SageConnectorConfig,
} from '@/services/sageIntegrationService';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

export default function SageConfigPage() {
  const [connectors, setConnectors] = useState<SageConnectorConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingConnector, setEditingConnector] = useState<SageConnectorConfig | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConnectors();
  }, []);

  const loadConnectors = async () => {
    setLoading(true);
    try {
      const data = await sageIntegrationService.getConnectors();
      setConnectors(data);
    } catch {
      toast('Failed to load connectors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingConnector(null);
    loadConnectors();
  };

  const handleEdit = (connector: SageConnectorConfig) => {
    setEditingConnector(connector);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingConnector(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConnector(null);
  };

  const handleTestConnection = async (connectorId: number) => {
    setTestingId(connectorId);
    try {
      const result = await sageIntegrationService.testConnector(connectorId);
      if (result.success) {
        toast('Connection test passed', 'success');
      } else {
        toast(`Connection test failed: ${result.message}`, 'error');
      }
      loadConnectors();
    } catch {
      toast('Failed to test connection', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (connector: SageConnectorConfig) => {
    try {
      await sageIntegrationService.updateConnector(connector.id, {
        isActive: !connector.isActive,
      });
      toast(
        `Connector ${connector.isActive ? 'deactivated' : 'activated'} successfully`,
        'success'
      );
      loadConnectors();
    } catch {
      toast('Failed to update connector status', 'error');
    }
  };

  const actions = !showForm ? (
    <button
      onClick={handleCreate}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-gold-500 text-violet-950 hover:bg-gold-600 uppercase tracking-wider transition-colors"
    >
      <PlusIcon className="w-4 h-4" />
      New Connector
    </button>
  ) : undefined;

  return (
    <FeatureGate feature="SAGE_300_PEOPLE">
      <PageWrapper
        title="Sage Connector Configuration"
        subtitle="Configure and manage connections to Sage payroll systems"
        actions={actions}
      >
        {showForm ? (
          <SageConfigForm
            connector={editingConnector}
            onSaved={handleFormSaved}
            onCancel={handleCancel}
          />
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        ) : connectors.length === 0 ? (
          <div className="bg-white rounded-sm shadow p-12 text-center">
            <SignalIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Connectors Configured</h3>
            <p className="text-gray-500 text-sm mb-6">
              Set up a connector to integrate with Sage 300 People, Sage Evolution, or Sage Business Cloud.
            </p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gold-500 text-violet-950 hover:bg-gold-600 uppercase tracking-wider transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create First Connector
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {connectors.map((connector) => (
              <div
                key={connector.id}
                className="bg-white rounded-sm shadow border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{connector.name}</h3>
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

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Type:</span>{' '}
                          <span className="text-gray-900 font-medium">
                            {connector.connectorType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Auth:</span>{' '}
                          <span className="text-gray-900 font-medium">
                            {connector.authMethod.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">URL:</span>{' '}
                          <span className="text-gray-900 font-medium truncate block max-w-xs">
                            {connector.baseUrl}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Created:</span>{' '}
                          <span className="text-gray-900 font-medium">
                            {new Date(connector.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {connector.lastTestedAt && (
                        <div className="flex items-center gap-1.5 mt-2 text-sm">
                          {connector.lastTestSuccess ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-gray-500">
                            Last tested:{' '}
                            {new Date(connector.lastTestedAt).toLocaleString()} -{' '}
                            {connector.lastTestSuccess ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleTestConnection(connector.id)}
                        disabled={testingId === connector.id}
                        title="Test connection"
                        className="p-2 text-gray-500 hover:text-violet-700 hover:bg-violet-50 rounded-full transition-colors disabled:opacity-50"
                      >
                        {testingId === connector.id ? (
                          <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        ) : (
                          <SignalIcon className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(connector)}
                        title="Edit connector"
                        className="p-2 text-gray-500 hover:text-gold-700 hover:bg-gold-50 rounded-full transition-colors"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(connector)}
                        title={connector.isActive ? 'Deactivate' : 'Activate'}
                        className={`p-2 rounded-full transition-colors ${
                          connector.isActive
                            ? 'text-red-500 hover:text-red-700 hover:bg-red-50'
                            : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {connector.isActive ? (
                          <XCircleIcon className="w-5 h-5" />
                        ) : (
                          <CheckCircleIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
