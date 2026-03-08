'use client';

import React, { useState, useEffect } from 'react';
import { SsoGroupMapping, ssoService } from '@/services/ssoService';
import { useToast } from '@/components/Toast';
import {
  PlusIcon,
  TrashIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const AVAILABLE_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'HIRING_MANAGER', label: 'Hiring Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'INTERVIEWER', label: 'Interviewer' },
];

export default function SsoGroupMappingTable() {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<SsoGroupMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadMappings();
  }, []);

  const loadMappings = async () => {
    setLoading(true);
    try {
      const data = await ssoService.getMappings();
      setMappings(data);
      setHasChanges(false);
    } catch (err: any) {
      toast(err.message || 'Failed to load group mappings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = () => {
    setMappings(prev => [...prev, { adGroupName: '', mappedRole: 'EMPLOYEE' }]);
    setHasChanges(true);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(prev => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  const handleUpdateMapping = (index: number, field: keyof SsoGroupMapping, value: string) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validate mappings
    const invalidMappings = mappings.filter(m => !m.adGroupName.trim());
    if (invalidMappings.length > 0) {
      toast('All mappings must have an AD group name', 'error');
      return;
    }

    // Check for duplicate group names
    const groupNames = mappings.map(m => m.adGroupName.trim().toLowerCase());
    const duplicates = groupNames.filter((name, i) => groupNames.indexOf(name) !== i);
    if (duplicates.length > 0) {
      toast('Duplicate AD group names found: ' + [...new Set(duplicates)].join(', '), 'error');
      return;
    }

    setSaving(true);
    try {
      const updated = await ssoService.updateMappings(mappings);
      setMappings(updated);
      setHasChanges(false);
      toast('Group mappings saved successfully', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to save group mappings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-sm shadow p-8 text-center">
        <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Loading group mappings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-violet-50 border border-violet-200 rounded-sm p-4">
        <div className="flex items-start gap-3">
          <UserGroupIcon className="w-5 h-5 text-violet-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-violet-900">Active Directory Group Mappings</h4>
            <p className="text-sm text-violet-700 mt-1">
              Map AD security groups to ShumelaHire roles. When a user signs in via SSO,
              their AD group membership determines their role in the system.
              If no mapping matches, the default role from the SSO configuration is used.
            </p>
          </div>
        </div>
      </div>

      {/* Mappings Table */}
      <div className="bg-white rounded-sm shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Group Mappings ({mappings.length})
          </h3>
          <button
            onClick={handleAddMapping}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200"
          >
            <PlusIcon className="w-4 h-4 mr-1" />
            Add Mapping
          </button>
        </div>

        {mappings.length === 0 ? (
          <div className="p-8 text-center">
            <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No group mappings configured</p>
            <p className="text-gray-400 text-xs mt-1">
              Click &quot;Add Mapping&quot; to map an AD group to a ShumelaHire role
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AD Group Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mapped Role
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mappings.map((mapping, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={mapping.adGroupName}
                        onChange={e => handleUpdateMapping(index, 'adGroupName', e.target.value)}
                        placeholder="e.g., ShumelaHire-Admins"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={mapping.mappedRole}
                        onChange={e => handleUpdateMapping(index, 'mappedRole', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                      >
                        {AVAILABLE_ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleRemoveMapping(index)}
                        className="inline-flex items-center p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                        title="Remove mapping"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Button */}
      {hasChanges && (
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
              'Save Mappings'
            )}
          </button>
          <button
            onClick={loadMappings}
            disabled={saving}
            className="inline-flex items-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 uppercase tracking-wider"
          >
            Discard Changes
          </button>
        </div>
      )}
    </div>
  );
}
