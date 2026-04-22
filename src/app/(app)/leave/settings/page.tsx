'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { leaveService, LeavePolicy } from '@/services/leaveService';
import {
  ClockIcon,
  ArrowUpCircleIcon,
} from '@heroicons/react/24/outline';

export default function LeaveSettingsPage() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Escalation form state per policy
  const [escalationForms, setEscalationForms] = useState<Record<string, {
    enabled: boolean;
    escalationDays: number;
    escalateToRole: string;
  }>>({});

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    const data = await leaveService.getLeavePolicies();
    setPolicies(data);
    // Initialize escalation forms from policy data
    const forms: typeof escalationForms = {};
    data.forEach(p => {
      forms[p.id] = {
        enabled: !!(p as any).escalationDays,
        escalationDays: (p as any).escalationDays || 3,
        escalateToRole: (p as any).escalateToRole || 'HR_MANAGER',
      };
    });
    setEscalationForms(forms);
    setLoading(false);
  };

  const handleSaveEscalation = async (policyId: string) => {
    setSaving(policyId);
    setMessage(null);
    try {
      const form = escalationForms[policyId];
      const response = await fetch(`/api/leave/policies/${policyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalationDays: form.enabled ? form.escalationDays : null,
          escalateToRole: form.enabled ? form.escalateToRole : null,
        }),
      });
      if (!response.ok) throw new Error('Failed to update escalation settings');
      setMessage({ type: 'success', text: 'Escalation settings saved successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings.' });
    }
    setSaving(null);
  };

  const updateEscalation = (policyId: string, field: string, value: any) => {
    setEscalationForms(prev => ({
      ...prev,
      [policyId]: { ...prev[policyId], [field]: value },
    }));
  };

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="Leave Settings"
        subtitle="Configure leave policies and auto-escalation rules"
      >
        <div className="space-y-6">
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading policies...</div>
          ) : policies.length === 0 ? (
            <div className="text-center py-12 enterprise-card">
              <p className="text-sm text-muted-foreground">No leave policies found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Auto-Escalation Section */}
              <div className="enterprise-card p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ArrowUpCircleIcon className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-semibold text-foreground">Auto-Escalation Rules</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Configure automatic escalation of pending leave requests when approvers don&apos;t respond within the specified number of days.
                </p>

                <div className="space-y-4">
                  {policies.filter(p => p.isActive).map(policy => {
                    const form = escalationForms[policy.id];
                    if (!form) return null;

                    return (
                      <div key={policy.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-foreground">{policy.name}</h4>
                            <p className="text-xs text-muted-foreground">{policy.leaveTypeName}</p>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={form.enabled}
                              onChange={e => updateEscalation(policy.id, 'enabled', e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-xs font-medium text-muted-foreground">Enable</span>
                          </label>
                        </div>

                        {form.enabled && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                <ClockIcon className="w-3 h-3 inline mr-1" />
                                Escalation After (days)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="30"
                                value={form.escalationDays}
                                onChange={e => updateEscalation(policy.id, 'escalationDays', parseInt(e.target.value) || 3)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Escalate To Role
                              </label>
                              <select
                                value={form.escalateToRole}
                                onChange={e => updateEscalation(policy.id, 'escalateToRole', e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              >
                                <option value="HR_MANAGER">HR Manager</option>
                                <option value="LINE_MANAGER">Line Manager</option>
                                <option value="ADMIN">Administrator</option>
                                <option value="EXECUTIVE">Executive</option>
                              </select>
                            </div>
                            <div className="flex items-end">
                              <button
                                onClick={() => handleSaveEscalation(policy.id)}
                                disabled={saving === policy.id}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
                              >
                                {saving === policy.id ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
