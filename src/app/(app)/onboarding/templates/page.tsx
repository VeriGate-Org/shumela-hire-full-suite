'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  onboardingService,
  OnboardingTemplate,
  OnboardingTemplateItem,
} from '@/services/onboardingService';
import {
  PlusIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

type ItemCategory = 'DOCUMENTS' | 'IT_SETUP' | 'ORIENTATION' | 'COMPLIANCE' | 'BENEFITS';

const CATEGORIES: ItemCategory[] = ['DOCUMENTS', 'IT_SETUP', 'ORIENTATION', 'COMPLIANCE', 'BENEFITS'];

const categoryColors: Record<string, string> = {
  DOCUMENTS: 'bg-blue-100 text-blue-800',
  IT_SETUP: 'bg-purple-100 text-purple-800',
  ORIENTATION: 'bg-green-100 text-green-800',
  COMPLIANCE: 'bg-red-100 text-red-800',
  BENEFITS: 'bg-amber-100 text-amber-800',
};

export default function OnboardingTemplatesPage() {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', department: '' });
  const [creating, setCreating] = useState(false);
  const [showAddItem, setShowAddItem] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState({
    title: '',
    description: '',
    category: 'DOCUMENTS' as ItemCategory,
    dueOffsetDays: '7',
    isRequired: true,
  });
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const data = await onboardingService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTemplate() {
    if (!createForm.name) return;
    setCreating(true);
    try {
      await onboardingService.createTemplate({
        name: createForm.name,
        description: createForm.description || null,
        department: createForm.department || null,
        isActive: true,
        items: [],
      });
      setShowCreateForm(false);
      setCreateForm({ name: '', description: '', department: '' });
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to create template');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddItem(templateId: string) {
    if (!itemForm.title) return;
    setAddingItem(true);
    try {
      const template = templates.find((t) => t.id === templateId);
      if (!template) return;

      const newItem: OnboardingTemplateItem = {
        title: itemForm.title,
        description: itemForm.description || null,
        category: itemForm.category,
        dueOffsetDays: parseInt(itemForm.dueOffsetDays, 10) || 7,
        isRequired: itemForm.isRequired,
        sortOrder: (template.items?.length || 0) + 1,
      };

      await onboardingService.updateTemplate(templateId, {
        items: [...(template.items || []), newItem],
      });

      setShowAddItem(null);
      setItemForm({
        title: '',
        description: '',
        category: 'DOCUMENTS',
        dueOffsetDays: '7',
        isRequired: true,
      });
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setAddingItem(false);
    }
  }

  async function handleToggleActive(template: OnboardingTemplate) {
    try {
      await onboardingService.updateTemplate(template.id, { isActive: !template.isActive });
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to update template');
    }
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await onboardingService.deleteTemplate(id);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Failed to delete template');
    }
  }

  function toggleExpanded(id: string) {
    setExpandedId(expandedId === id ? null : id);
    setShowAddItem(null);
  }

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="Onboarding Templates"
        subtitle="Create and manage onboarding checklist templates"
      >
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <PlusIcon className="h-4 w-4 mr-2" /> Create Template
            </button>
          </div>

          {/* Create Template Modal */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-sm font-semibold text-foreground mb-4">
                  Create Onboarding Template
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Template Name
                    </label>
                    <input
                      value={createForm.name}
                      onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Standard Employee Onboarding"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Description
                    </label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Brief description of this template"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      Department
                    </label>
                    <input
                      value={createForm.department}
                      onChange={(e) =>
                        setCreateForm((f) => ({ ...f, department: e.target.value }))
                      }
                      placeholder="e.g. Engineering, HR, Finance (optional)"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateForm({ name: '', description: '', department: '' });
                    }}
                    className="px-4 py-2 text-gray-600 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTemplate}
                    disabled={creating || !createForm.name}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No onboarding templates created yet.</p>
              <p className="text-xs mt-1">Click &ldquo;Create Template&rdquo; to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="enterprise-card">
                  {/* Template Header */}
                  <div
                    className="p-6 cursor-pointer"
                    onClick={() => toggleExpanded(template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {expandedId === template.id ? (
                          <ChevronDownIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold text-foreground">
                              {template.name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                template.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {template.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                            {template.department && <span>Department: {template.department}</span>}
                            <span>{template.items?.length || 0} items</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleToggleActive(template)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium ${
                            template.isActive
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {template.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete template"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {expandedId === template.id && (
                    <div className="border-t px-6 pb-6">
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-4 mb-3">
                          {template.description}
                        </p>
                      )}

                      {/* Items Table */}
                      {template.items && template.items.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {template.items.map((item, idx) => (
                            <div
                              key={item.id || idx}
                              className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-foreground">
                                    {item.title}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                                      categoryColors[item.category] || 'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    {item.category?.replace('_', ' ')}
                                  </span>
                                  {item.isRequired && (
                                    <span className="text-xs text-red-500 font-medium">
                                      Required
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                                Due: +{item.dueOffsetDays} days
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-4">
                          No items added yet.
                        </p>
                      )}

                      {/* Add Item Button / Form */}
                      {showAddItem === template.id ? (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-xs font-semibold text-foreground mb-3">
                            Add Checklist Item
                          </h4>
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Title
                              </label>
                              <input
                                value={itemForm.title}
                                onChange={(e) =>
                                  setItemForm((f) => ({ ...f, title: e.target.value }))
                                }
                                placeholder="e.g. Submit ID copy"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Description
                              </label>
                              <input
                                value={itemForm.description}
                                onChange={(e) =>
                                  setItemForm((f) => ({ ...f, description: e.target.value }))
                                }
                                placeholder="Optional description"
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                  Category
                                </label>
                                <select
                                  value={itemForm.category}
                                  onChange={(e) =>
                                    setItemForm((f) => ({
                                      ...f,
                                      category: e.target.value as ItemCategory,
                                    }))
                                  }
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat.replace('_', ' ')}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1">
                                  Due Offset (days)
                                </label>
                                <input
                                  type="number"
                                  value={itemForm.dueOffsetDays}
                                  onChange={(e) =>
                                    setItemForm((f) => ({ ...f, dueOffsetDays: e.target.value }))
                                  }
                                  min="1"
                                  className="w-full px-3 py-2 border rounded-lg text-sm"
                                />
                              </div>
                              <div className="flex items-end">
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={itemForm.isRequired}
                                    onChange={(e) =>
                                      setItemForm((f) => ({ ...f, isRequired: e.target.checked }))
                                    }
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Required
                                  </span>
                                </label>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-4">
                            <button
                              onClick={() => setShowAddItem(null)}
                              className="px-3 py-1.5 text-gray-600 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleAddItem(template.id)}
                              disabled={addingItem || !itemForm.title}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                            >
                              {addingItem ? 'Adding...' : 'Add Item'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddItem(template.id)}
                          className="mt-4 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          <PlusIcon className="h-3.5 w-3.5" /> Add Item
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
