'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useAuth } from '@/contexts/AuthContext';
import { customFieldService, CustomField } from '@/services/customFieldService';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

const ENTITY_TYPES = ['EMPLOYEE', 'JOB', 'APPLICATION', 'INTERVIEW'] as const;
type EntityType = (typeof ENTITY_TYPES)[number];

const FIELD_TYPES = ['TEXT', 'NUMBER', 'DATE', 'SELECT', 'BOOLEAN', 'TEXTAREA'] as const;

const emptyForm = {
  fieldName: '',
  fieldLabel: '',
  fieldType: 'TEXT',
  entityType: 'EMPLOYEE' as string,
  isRequired: false,
  isActive: true,
  options: '',
  defaultValue: '',
};

export default function CustomFieldsPage() {
  const { user } = useAuth();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<EntityType>('EMPLOYEE');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFields();
  }, [activeTab]);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await customFieldService.getAllFieldsByEntityType(activeTab);
      setFields(data);
    } catch {
      setFields([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ ...emptyForm, entityType: activeTab });
    setEditingId(null);
    setShowForm(false);
  };

  const handleAdd = () => {
    setForm({ ...emptyForm, entityType: activeTab });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (field: CustomField) => {
    setForm({
      fieldName: field.fieldName,
      fieldLabel: field.fieldLabel,
      fieldType: field.fieldType,
      entityType: field.entityType,
      isRequired: field.isRequired,
      isActive: field.isActive,
      options: field.options || '',
      defaultValue: field.defaultValue || '',
    });
    setEditingId(field.id);
    setShowForm(true);
  };

  const handleDelete = async (field: CustomField) => {
    if (!window.confirm(`Are you sure you want to delete the custom field "${field.fieldLabel}"?`)) {
      return;
    }
    try {
      await customFieldService.deleteField(field.id);
      loadFields();
    } catch (err: any) {
      alert(err.message || 'Failed to delete custom field');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<CustomField> = {
        fieldName: form.fieldName,
        fieldLabel: form.fieldLabel,
        fieldType: form.fieldType,
        entityType: form.entityType,
        isRequired: form.isRequired,
        isActive: form.isActive,
        options: form.fieldType === 'SELECT' ? form.options : null,
        defaultValue: form.defaultValue || null,
      };

      if (editingId) {
        await customFieldService.updateField(editingId, payload);
      } else {
        await customFieldService.createField(payload);
      }
      resetForm();
      loadFields();
    } catch (err: any) {
      alert(err.message || 'Failed to save custom field');
    } finally {
      setSaving(false);
    }
  };

  return (
    <FeatureGate feature="CUSTOM_FIELDS">
      <PageWrapper
        title="Custom Fields"
        subtitle="Define and manage custom fields for employees, jobs, applications, and interviews"
        actions={
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Add Custom Field
          </button>
        }
      >
        <div className="space-y-6">
          {/* Entity Type Filter Tabs */}
          <div className="flex gap-2">
            {ENTITY_TYPES.map((entityType) => (
              <button
                key={entityType}
                onClick={() => setActiveTab(entityType)}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  activeTab === entityType
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {entityType.charAt(0) + entityType.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Inline Add/Edit Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                {editingId ? 'Edit Custom Field' : 'Add New Custom Field'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Name *</label>
                  <input
                    type="text"
                    required
                    value={form.fieldName}
                    onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
                    placeholder="e.g. emergency_contact"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Label *</label>
                  <input
                    type="text"
                    required
                    value={form.fieldLabel}
                    onChange={(e) => setForm({ ...form, fieldLabel: e.target.value })}
                    placeholder="e.g. Emergency Contact"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Field Type *</label>
                  <select
                    required
                    value={form.fieldType}
                    onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft} value={ft}>{ft}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type *</label>
                  <select
                    required
                    value={form.entityType}
                    onChange={(e) => setForm({ ...form, entityType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    {ENTITY_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et.charAt(0) + et.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Value</label>
                  <input
                    type="text"
                    value={form.defaultValue}
                    onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                    placeholder="Optional default value"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="flex items-end gap-6 pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isRequired}
                      onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Required
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Options textarea - only shown when fieldType is SELECT */}
              {form.fieldType === 'SELECT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options (one per line) *
                  </label>
                  <textarea
                    required
                    value={form.options}
                    onChange={(e) => setForm({ ...form, options: e.target.value })}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    rows={4}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter each option on a separate line.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-cta inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Field' : 'Save Field'}
                </button>
              </div>
            </form>
          )}

          {/* Custom Fields Table */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading custom fields...</div>
          ) : fields.length === 0 ? (
            <div className="enterprise-card text-center py-12">
              <AdjustmentsHorizontalIcon className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-muted-foreground">
                No custom fields defined for {activeTab.charAt(0) + activeTab.slice(1).toLowerCase()} yet.
              </p>
              <button
                onClick={handleAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4" /> Add Custom Field
              </button>
            </div>
          ) : (
            <div className="enterprise-card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Label</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {fields.map((field) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <span className="font-medium text-gray-900 font-mono">{field.fieldName}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{field.fieldLabel}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {field.fieldType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {field.isRequired ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Yes</span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {field.isActive ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Active</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(field)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Edit field"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(field)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete field"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
