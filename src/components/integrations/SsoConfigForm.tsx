'use client';

import React, { useState, useEffect } from 'react';
import { SsoConfig, SsoConfigRequest, SsoTestResult, ssoService } from '@/services/ssoService';
import { useToast } from '@/components/Toast';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ArrowsRightLeftIcon,
  Cog6ToothIcon,
  ArrowRightIcon,
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

const ATTRIBUTE_MAPPINGS = [
  { ssoAttr: 'displayName', appField: 'Full Name' },
  { ssoAttr: 'mail', appField: 'Email' },
  { ssoAttr: 'department', appField: 'Department' },
  { ssoAttr: 'jobTitle', appField: 'Position' },
  { ssoAttr: 'employeeId', appField: 'Employee Number' },
];

interface GroupMappingRow {
  adGroup: string;
  role: string;
}

export default function SsoConfigForm({ initialConfig, onSaved }: SsoConfigFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<SsoTestResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [groupMappings, setGroupMappings] = useState<GroupMappingRow[]>([
    { adGroup: '', role: 'HR_MANAGER' },
    { adGroup: '', role: 'RECRUITER' },
    { adGroup: '', role: 'EMPLOYEE' },
  ]);

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
      // Parse group mappings if they exist
      if (initialConfig.groupMappings) {
        try {
          const parsed = JSON.parse(initialConfig.groupMappings);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setGroupMappings(parsed.map((m: any) => ({
              adGroup: m.adGroupName || m.adGroup || '',
              role: m.mappedRole || m.role || 'EMPLOYEE',
            })));
          }
        } catch {
          // Keep default mappings
        }
      }
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
      const mappingsJson = JSON.stringify(
        groupMappings
          .filter(m => m.adGroup.trim())
          .map(m => ({ adGroupName: m.adGroup, mappedRole: m.role }))
      );
      const saved = await ssoService.saveConfig({ ...form, groupMappings: mappingsJson });
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

  const handleDiscard = () => {
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
    toast('Changes discarded.', 'info');
  };

  const addGroupMapping = () => {
    setGroupMappings(prev => [...prev, { adGroup: '', role: 'EMPLOYEE' }]);
    toast('New group mapping added. Configure the AD group name and role.', 'info');
  };

  const updateGroupMapping = (index: number, field: 'adGroup' | 'role', value: string) => {
    setGroupMappings(prev =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const showOAuthFields = form.provider === 'AZURE_AD' || form.provider === 'OKTA';
  const showSamlFields = form.provider === 'CUSTOM_SAML';
  const showAdfsFields = form.provider === 'ON_PREM_AD';

  return (
    <div className="space-y-6 pb-24">
      {/* Connection Settings Card */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5 text-[1.0625rem] font-bold text-foreground">
              <LockClosedIcon className="w-[18px] h-[18px] text-primary" />
              Connection Settings
            </div>
            <div className="text-[0.8125rem] text-muted-foreground mt-0.5">
              Configure your identity provider connection details
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Provider Select */}
          <div>
            <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
              Identity Provider <span className="text-error">*</span>
            </label>
            <select
              value={form.provider}
              onChange={e => handleChange('provider', e.target.value)}
              className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card appearance-none pr-9 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
            >
              {PROVIDER_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
              Display Name <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={e => handleChange('displayName', e.target.value)}
              placeholder="e.g., Corporate Azure AD"
              className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
            />
          </div>

          {/* OAuth/ADFS fields */}
          {(showOAuthFields || showAdfsFields) && (
            <>
              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  {form.provider === 'AZURE_AD' ? 'Tenant ID' : 'Tenant/Org Identifier'} <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.tenantIdentifier}
                  onChange={e => handleChange('tenantIdentifier', e.target.value)}
                  placeholder={form.provider === 'AZURE_AD' ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : 'Organization identifier'}
                  className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                />
              </div>

              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Client ID <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={form.clientId}
                  onChange={e => handleChange('clientId', e.target.value)}
                  placeholder="Application (client) ID"
                  className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                />
              </div>

              <div>
                <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Client Secret <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.clientSecret}
                    onChange={e => handleChange('clientSecret', e.target.value)}
                    placeholder={initialConfig ? '********' : 'Client secret value'}
                    className="w-full px-3.5 py-2.5 pr-10 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1 transition-colors"
                    title="Toggle visibility"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {initialConfig && (
                  <div className="text-xs text-muted-foreground mt-1">Leave blank to keep existing secret</div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Discovery URL <span className="text-error">*</span>
                </label>
                <input
                  type="url"
                  value={form.discoveryUrl}
                  onChange={e => handleChange('discoveryUrl', e.target.value)}
                  placeholder={
                    form.provider === 'AZURE_AD'
                      ? 'https://login.microsoftonline.com/{tenant}/v2.0/.well-known/openid-configuration'
                      : form.provider === 'ON_PREM_AD'
                      ? 'https://adfs.yourdomain.com'
                      : 'https://dev-example.okta.com'
                  }
                  className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                />
                <div className="text-xs text-muted-foreground mt-1">
                  The OpenID Connect discovery endpoint for your identity provider
                </div>
              </div>
            </>
          )}

          {/* SAML Fields */}
          {showSamlFields && (
            <>
              <div className="md:col-span-2">
                <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Discovery / Metadata URL
                </label>
                <input
                  type="url"
                  value={form.discoveryUrl}
                  onChange={e => handleChange('discoveryUrl', e.target.value)}
                  placeholder="https://idp.example.com/saml2/metadata"
                  className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                  Metadata XML (paste directly)
                </label>
                <textarea
                  value={form.metadataXml}
                  onChange={e => handleChange('metadataXml', e.target.value)}
                  rows={8}
                  placeholder="<EntityDescriptor ...>"
                  className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card font-mono focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                />
              </div>
            </>
          )}
        </div>

        {/* Test Connection Area */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-border text-muted-foreground bg-transparent font-bold text-xs rounded-full uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy disabled:opacity-50 transition-all"
          >
            {testing ? (
              <>
                <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                TESTING...
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5" />
                TEST CONNECTION
              </>
            )}
          </button>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm font-semibold ${
              testResult.success ? 'text-success' : 'text-error'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                testResult.success ? 'bg-success-bg' : 'bg-error-bg'
              }`}>
                {testResult.success ? (
                  <CheckCircleIcon className="w-3.5 h-3.5" />
                ) : (
                  <XCircleIcon className="w-3.5 h-3.5" />
                )}
              </div>
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Discovered Endpoints */}
        {testResult?.discoveredEndpoints && Object.keys(testResult.discoveredEndpoints).length > 0 && (
          <div className="mt-4 p-4 bg-surface-navy rounded-control border border-border">
            <p className="text-sm font-semibold text-foreground mb-2">Discovered Endpoints:</p>
            <div className="space-y-1">
              {Object.entries(testResult.discoveredEndpoints).map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:items-center gap-1 text-xs">
                  <span className="font-mono text-muted-foreground min-w-[200px]">{key}:</span>
                  <span className="font-mono text-foreground break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attribute Mappings Card */}
      <div className="enterprise-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2.5 text-[1.0625rem] font-bold text-foreground">
              <ArrowsRightLeftIcon className="w-[18px] h-[18px] text-accent-teal" />
              Attribute Mappings
            </div>
            <div className="text-[0.8125rem] text-muted-foreground mt-0.5">
              Map identity provider attributes to ShumelaHire user fields
            </div>
          </div>
        </div>

        <div className="overflow-x-auto -mx-6">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-6 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                  SSO Attribute
                </th>
                <th className="text-center px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                  Direction
                </th>
                <th className="text-left px-6 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                  ShumelaHire Field
                </th>
                <th className="text-left px-6 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {ATTRIBUTE_MAPPINGS.map((mapping, idx) => (
                <tr
                  key={mapping.ssoAttr}
                  className={`hover:bg-surface-navy transition-colors ${
                    idx < ATTRIBUTE_MAPPINGS.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <td className="px-6 py-3.5 text-sm text-foreground">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[0.8125rem] font-semibold bg-surface-navy text-primary">
                      {mapping.ssoAttr}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center text-primary font-bold">
                      <ArrowRightIcon className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-foreground">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[0.8125rem] font-semibold bg-surface-teal text-accent-teal">
                      {mapping.appField}
                    </span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-bg text-success">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Settings Card */}
      <div className="enterprise-card p-6">
        {/* Collapsible Header */}
        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="flex items-center gap-2.5 w-full px-4 py-3.5 bg-surface-navy rounded-control hover:bg-icon-bg-navy transition-colors cursor-pointer select-none"
        >
          <div className="w-7 h-7 rounded-full bg-icon-bg-navy text-primary flex items-center justify-center flex-shrink-0">
            <Cog6ToothIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-foreground flex-1 text-left">Advanced Settings</span>
          <ChevronDownIcon
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              advancedOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Collapsible Body */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            advancedOpen ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Enable SSO Toggle */}
          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Enable SSO</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Allow users to sign in using this identity provider
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={form.isEnabled as boolean}
                onChange={e => handleChange('isEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-sm peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Auto-provisioning Toggle */}
          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Auto-provisioning</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Automatically create ShumelaHire accounts when users authenticate via SSO for the first time
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={form.autoProvisionUsers as boolean}
                onChange={e => handleChange('autoProvisionUsers', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-all after:shadow-sm peer-checked:after:translate-x-5" />
            </label>
          </div>

          {/* Default Role */}
          <div className="flex items-center justify-between py-3.5 border-b border-border">
            <div className="flex-1">
              <div className="text-sm font-semibold text-foreground">Default Role</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Role assigned to auto-provisioned users when no group mapping applies
              </div>
            </div>
            <div className="w-[200px]">
              <select
                value={form.defaultRole}
                onChange={e => handleChange('defaultRole', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-control text-sm text-foreground bg-card appearance-none pr-9 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
              >
                {ROLE_OPTIONS.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Group Mapping */}
          <div className="py-3.5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-foreground">Group Mapping</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Map Active Directory groups to ShumelaHire roles
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {groupMappings.map((mapping, index) => (
                <div key={index} className="grid grid-cols-[1fr_40px_1fr] gap-2 items-center">
                  <input
                    type="text"
                    value={mapping.adGroup}
                    onChange={e => updateGroupMapping(index, 'adGroup', e.target.value)}
                    placeholder="AD Group name"
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm text-foreground bg-card focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                  />
                  <div className="flex items-center justify-center text-primary">
                    <ArrowRightIcon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                  </div>
                  <select
                    value={mapping.role}
                    onChange={e => updateGroupMapping(index, 'role', e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-control text-sm text-foreground bg-card appearance-none pr-9 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.1)] transition-all"
                  >
                    {ROLE_OPTIONS.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <button
              onClick={addGroupMapping}
              className="inline-flex items-center gap-1.5 py-2 mt-2 text-[0.8125rem] font-semibold text-primary hover:text-accent-teal transition-colors bg-transparent border-none cursor-pointer"
            >
              <PlusIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
              Add Group Mapping
            </button>
          </div>
        </div>
      </div>

      {/* Fixed Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleDiscard}
            className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-border text-muted-foreground bg-transparent font-bold text-xs rounded-full uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
          >
            DISCARD
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-cta border-2 border-cta text-cta-foreground font-extrabold text-xs rounded-full uppercase tracking-wider hover:bg-cta-hover hover:border-cta-hover disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                SAVING...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                SAVE CONFIGURATION
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
