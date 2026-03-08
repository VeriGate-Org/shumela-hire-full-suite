'use client';

import React, { useState, useEffect } from 'react';
import { SsoConfig, SsoConfigRequest, SsoTestResult, ssoService } from '@/services/ssoService';
import { useToast } from '@/components/Toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface SsoConfigFormProps {
  initialConfig: SsoConfig | null;
  onSaved?: (config: SsoConfig) => void;
}

const PROVIDER_OPTIONS = [
  { value: 'AZURE_AD', label: 'Azure Active Directory' },
  { value: 'ON_PREM_AD', label: 'On-Premises Active Directory (ADFS)' },
  { value: 'OKTA', label: 'Okta' },
  { value: 'CUSTOM_SAML', label: 'Custom SAML 2.0' },
];

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
];

export default function SsoConfigForm({ initialConfig, onSaved }: SsoConfigFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<SsoTestResult | null>(null);

  const [form, setForm] = useState<SsoConfigRequest>({
    provider: 'AZURE_AD',
    displayName: '',
    clientId: '',
    clientSecret: '',
    tenantIdentifier: '',
    discoveryUrl: '',
    metadataXml: '',
    isEnabled: false,
    autoProvisionUsers: false,
    defaultRole: 'EMPLOYEE',
    groupMappings: '',
  });

  useEffect(() => {
    if (initialConfig) {
      setForm({
        provider: initialConfig.provider,
        displayName: initialConfig.displayName,
        clientId: initialConfig.clientId || '',
        clientSecret: '',
        tenantIdentifier: initialConfig.tenantIdentifier || '',
        discoveryUrl: initialConfig.discoveryUrl || '',
        metadataXml: initialConfig.metadataXml || '',
        isEnabled: initialConfig.isEnabled,
        autoProvisionUsers: initialConfig.autoProvisionUsers,
        defaultRole: initialConfig.defaultRole || 'EMPLOYEE',
        groupMappings: initialConfig.groupMappings || '',
      });
    }
  }, [initialConfig]);

  const handleChange = (field: keyof SsoConfigRequest, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.displayName.trim()) {
      toast('Display name is required', 'error');
      return;
    }
    if (!form.provider) {
      toast('Provider is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const saved = await ssoService.saveConfig(form);
      toast('SSO configuration saved successfully', 'success');
      onSaved?.(saved);
    } catch (err: any) {
      toast(err.message || 'Failed to save SSO configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await ssoService.testConnection();
      setTestResult(result);
      if (result.success) {
        toast('Connection test successful', 'success');
      } else {
        toast(result.message || 'Connection test failed', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Connection test failed', 'error');
      setTestResult({ success: false, message: err.message, discoveredEndpoints: {} });
    } finally {
      setTesting(false);
    }
  };

  const showOAuthFields = form.provider === 'AZURE_AD' || form.provider === 'OKTA';
  const showSamlFields = form.provider === 'CUSTOM_SAML';
  const showAdfsFields = form.provider === 'ON_PREM_AD';

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Identity Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROVIDER_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => handleChange('provider', option.value)}
              className={`p-4 border-2 rounded-sm text-left transition-colors ${
                form.provider === option.value
                  ? 'border-violet-500 bg-violet-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheckIcon className={`w-6 h-6 ${
                  form.provider === option.value ? 'text-violet-600' : 'text-gray-400'
                }`} />
                <span className={`font-medium ${
                  form.provider === option.value ? 'text-violet-900' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Configuration */}
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => handleChange('displayName', e.target.value)}
              placeholder="e.g., Corporate Azure AD"
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Role</label>
            <select
              value={form.defaultRole}
              onChange={e => handleChange('defaultRole', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            >
              {ROLE_OPTIONS.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* OAuth/OIDC Fields (Azure AD, Okta) */}
      {(showOAuthFields || showAdfsFields) && (
        <div className="bg-white rounded-sm shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {showAdfsFields ? 'ADFS Configuration' : 'OAuth 2.0 / OIDC Configuration'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
              <input
                type="text"
                value={form.clientId}
                onChange={e => handleChange('clientId', e.target.value)}
                placeholder="Application (client) ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Client Secret
                {initialConfig && <span className="text-gray-400 ml-1">(leave blank to keep existing)</span>}
              </label>
              <input
                type="password"
                value={form.clientSecret}
                onChange={e => handleChange('clientSecret', e.target.value)}
                placeholder={initialConfig ? '********' : 'Client secret value'}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.provider === 'AZURE_AD' ? 'Azure AD Tenant ID' : 'Tenant/Org Identifier'}
              </label>
              <input
                type="text"
                value={form.tenantIdentifier}
                onChange={e => handleChange('tenantIdentifier', e.target.value)}
                placeholder={form.provider === 'AZURE_AD' ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : 'Organization identifier'}
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discovery URL</label>
              <input
                type="url"
                value={form.discoveryUrl}
                onChange={e => handleChange('discoveryUrl', e.target.value)}
                placeholder={
                  form.provider === 'AZURE_AD'
                    ? 'https://login.microsoftonline.com/{tenant}/.well-known/openid-configuration'
                    : form.provider === 'ON_PREM_AD'
                    ? 'https://adfs.yourdomain.com'
                    : 'https://dev-example.okta.com'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* SAML Fields */}
      {showSamlFields && (
        <div className="bg-white rounded-sm shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">SAML 2.0 Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discovery / Metadata URL</label>
              <input
                type="url"
                value={form.discoveryUrl}
                onChange={e => handleChange('discoveryUrl', e.target.value)}
                placeholder="https://idp.example.com/saml2/metadata"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Metadata XML (paste directly)</label>
              <textarea
                value={form.metadataXml}
                onChange={e => handleChange('metadataXml', e.target.value)}
                rows={8}
                placeholder="<EntityDescriptor ...>"
                className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400 font-mono text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Settings</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.isEnabled as boolean}
              onChange={e => handleChange('isEnabled', e.target.checked)}
              className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Enable SSO</span>
              <p className="text-xs text-gray-500">Allow users to sign in using this identity provider</p>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.autoProvisionUsers as boolean}
              onChange={e => handleChange('autoProvisionUsers', e.target.checked)}
              className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Auto-provision Users</span>
              <p className="text-xs text-gray-500">Automatically create user accounts on first SSO sign-in</p>
            </div>
          </label>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`rounded-sm border p-4 ${
          testResult.success
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {testResult.success
              ? <CheckCircleIcon className="w-5 h-5 text-green-600" />
              : <XCircleIcon className="w-5 h-5 text-red-600" />
            }
            <span className={`font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </span>
          </div>
          <p className={`text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
            {testResult.message}
          </p>
          {testResult.discoveredEndpoints && Object.keys(testResult.discoveredEndpoints).length > 0 && (
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700 mb-1">Discovered Endpoints:</p>
              <div className="bg-white rounded border border-gray-200 p-3 space-y-1">
                {Object.entries(testResult.discoveredEndpoints).map(([key, value]) => (
                  <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
                    <span className="font-mono text-gray-500 min-w-[200px]">{key}:</span>
                    <span className="font-mono text-gray-800 break-all">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 uppercase tracking-wider"
        >
          {saving ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            initialConfig ? 'Update Configuration' : 'Save Configuration'
          )}
        </button>

        <button
          onClick={handleTest}
          disabled={testing}
          className="inline-flex items-center px-6 py-2 border-2 border-gold-500 text-sm font-medium rounded-full shadow-sm text-gold-500 bg-transparent hover:bg-gold-500 hover:text-violet-950 disabled:opacity-50 uppercase tracking-wider"
        >
          {testing ? (
            <>
              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Connection'
          )}
        </button>
      </div>
    </div>
  );
}
