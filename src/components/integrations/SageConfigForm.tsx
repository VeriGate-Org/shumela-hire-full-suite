'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';
import {
  SageConnectorConfig,
  sageIntegrationService,
  CreateConnectorRequest,
} from '@/services/sageIntegrationService';

interface SageConfigFormProps {
  connector?: SageConnectorConfig | null;
  onSaved: () => void;
  onCancel: () => void;
}

const CONNECTOR_TYPES = [
  { value: 'SAGE_300_PEOPLE', label: 'Sage 300 People' },
  { value: 'SAGE_EVOLUTION', label: 'Sage Evolution' },
  { value: 'SAGE_BUSINESS_CLOUD', label: 'Sage Business Cloud' },
];

const AUTH_METHODS = [
  { value: 'API_KEY', label: 'API Key' },
  { value: 'OAUTH2', label: 'OAuth 2.0' },
  { value: 'BASIC_AUTH', label: 'Basic Authentication' },
  { value: 'CERTIFICATE', label: 'Client Certificate' },
];

export default function SageConfigForm({ connector, onSaved, onCancel }: SageConfigFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [form, setForm] = useState({
    name: '',
    connectorType: 'SAGE_300_PEOPLE',
    authMethod: 'API_KEY',
    baseUrl: '',
    apiKey: '',
    username: '',
    password: '',
    clientId: '',
    clientSecret: '',
    certificatePath: '',
  });

  useEffect(() => {
    if (connector) {
      setForm({
        name: connector.name,
        connectorType: connector.connectorType,
        authMethod: connector.authMethod,
        baseUrl: connector.baseUrl,
        apiKey: '',
        username: '',
        password: '',
        clientId: '',
        clientSecret: '',
        certificatePath: '',
      });
    }
  }, [connector]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const buildCredentials = (): Record<string, string> => {
    const creds: Record<string, string> = {};
    switch (form.authMethod) {
      case 'API_KEY':
        if (form.apiKey) creds.apiKey = form.apiKey;
        break;
      case 'BASIC_AUTH':
        if (form.username) creds.username = form.username;
        if (form.password) creds.password = form.password;
        break;
      case 'OAUTH2':
        if (form.clientId) creds.clientId = form.clientId;
        if (form.clientSecret) creds.clientSecret = form.clientSecret;
        break;
      case 'CERTIFICATE':
        if (form.certificatePath) creds.certificatePath = form.certificatePath;
        break;
    }
    return creds;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.baseUrl.trim()) {
      toast('Name and Base URL are required', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload: CreateConnectorRequest = {
        name: form.name,
        connectorType: form.connectorType,
        authMethod: form.authMethod,
        baseUrl: form.baseUrl,
        credentials: buildCredentials(),
      };

      if (connector) {
        await sageIntegrationService.updateConnector(connector.id, payload);
        toast('Connector updated successfully', 'success');
      } else {
        await sageIntegrationService.createConnector(payload);
        toast('Connector created successfully', 'success');
      }
      onSaved();
    } catch {
      toast('Failed to save connector configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!connector) {
      toast('Save the connector first before testing', 'error');
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const result = await sageIntegrationService.testConnector(connector.id);
      setTestResult({ success: result.success, message: result.message });
      if (result.success) {
        toast('Connection test passed', 'success');
      } else {
        toast(`Connection test failed: ${result.message}`, 'error');
      }
    } catch {
      setTestResult({ success: false, message: 'Connection test request failed' });
      toast('Failed to test connection', 'error');
    } finally {
      setTesting(false);
    }
  };

  const renderCredentialFields = () => {
    switch (form.authMethod) {
      case 'API_KEY':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder={connector ? '(unchanged)' : 'Enter API key'}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            />
          </div>
        );
      case 'BASIC_AUTH':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter username"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={connector ? '(unchanged)' : 'Enter password'}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
              />
            </div>
          </>
        );
      case 'OAUTH2':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={form.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder="Enter client ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Secret</label>
              <input
                type="password"
                value={form.clientSecret}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
                placeholder={connector ? '(unchanged)' : 'Enter client secret'}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
              />
            </div>
          </>
        );
      case 'CERTIFICATE':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Path</label>
            <input
              type="text"
              value={form.certificatePath}
              onChange={(e) => handleChange('certificatePath', e.target.value)}
              placeholder="/path/to/certificate.pem"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {connector ? 'Edit Connector' : 'New Connector'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connector Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Sage 300 People - Production"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            />
          </div>

          {/* Connector Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Connector Type <span className="text-red-500">*</span>
            </label>
            <select
              value={form.connectorType}
              onChange={(e) => handleChange('connectorType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            >
              {CONNECTOR_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Auth Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Authentication Method <span className="text-red-500">*</span>
            </label>
            <select
              value={form.authMethod}
              onChange={(e) => handleChange('authMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            >
              {AUTH_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={form.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder="https://sage-api.example.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 text-sm"
            />
          </div>
        </div>

        {/* Credential Fields */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
            Credentials
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCredentialFields()}
          </div>
        </div>

        {/* Test Connection Result */}
        {testResult && (
          <div
            className={`mt-4 flex items-center gap-2 p-3 rounded-sm text-sm ${
              testResult.success
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {testResult.success ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <XCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
            )}
            {testResult.message}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {connector && (
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border-2 border-violet-500 text-violet-700 hover:bg-violet-50 disabled:opacity-50 transition-colors"
            >
              {testing ? (
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
              ) : (
                <SignalIcon className="w-4 h-4" />
              )}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-full bg-gold-500 text-violet-950 hover:bg-gold-600 disabled:opacity-50 uppercase tracking-wider transition-colors"
          >
            {saving && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving...' : connector ? 'Update Connector' : 'Create Connector'}
          </button>
        </div>
      </div>
    </form>
  );
}
