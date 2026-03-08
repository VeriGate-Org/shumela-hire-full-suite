'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface PlatformFeature {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  includedPlans: string;
  active: boolean;
}

const PLAN_OPTIONS = ['TRIAL', 'STARTER', 'STANDARD', 'ENTERPRISE'];

const CATEGORY_OPTIONS = [
  'ai', 'analytics', 'automation', 'compliance', 'customization',
  'engagement', 'hr_core', 'integrations', 'recruitment', 'talent_development',
];

const CATEGORY_STYLES: Record<string, string> = {
  recruitment: 'bg-blue-50 text-blue-700 border-blue-200',
  ai: 'bg-violet-50 text-violet-700 border-violet-200',
  analytics: 'bg-amber-50 text-amber-700 border-amber-200',
  compliance: 'bg-red-50 text-red-700 border-red-200',
  integrations: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  customization: 'bg-pink-50 text-pink-700 border-pink-200',
  hr_core: 'bg-sky-50 text-sky-700 border-sky-200',
  talent_development: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  engagement: 'bg-rose-50 text-rose-700 border-rose-200',
  automation: 'bg-teal-50 text-teal-700 border-teal-200',
};

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI',
  analytics: 'Analytics',
  automation: 'Automation',
  compliance: 'Compliance',
  customization: 'Customisation',
  engagement: 'Engagement',
  hr_core: 'HR Core',
  integrations: 'Integrations',
  recruitment: 'Recruitment',
  talent_development: 'Talent Development',
};

export default function FeaturesPage() {
  const { toast } = useToast();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
    includedPlans: [] as string[],
    isActive: true,
  });
  const [deleteFeatureId, setDeleteFeatureId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchFeatures = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/platform/features');
      if (response.ok) {
        setFeatures(await response.json());
      }
    } catch {
      toast('Failed to load features', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  const resetForm = () => {
    setForm({ code: '', name: '', description: '', category: '', includedPlans: [], isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (feature: PlatformFeature) => {
    setForm({
      code: feature.code,
      name: feature.name,
      description: feature.description || '',
      category: feature.category,
      includedPlans: feature.includedPlans ? feature.includedPlans.split(',') : [],
      isActive: feature.active,
    });
    setEditingId(feature.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const body = {
      code: form.code,
      name: form.name,
      description: form.description,
      category: form.category,
      includedPlans: form.includedPlans.join(','),
      isActive: form.isActive,
    };

    try {
      const url = editingId ? `/api/platform/features/${editingId}` : '/api/platform/features';
      const method = editingId ? 'PUT' : 'POST';
      const response = await apiFetch(url, { method, body: JSON.stringify(body) });

      if (response.ok) {
        toast(editingId ? 'Feature updated' : 'Feature created', 'success');
        resetForm();
        fetchFeatures();
      } else {
        const err = await response.json();
        toast(err.error || 'Failed to save feature', 'error');
      }
    } catch {
      toast('Failed to save feature', 'error');
    }
  };

  const deleteFeature = (id: number) => {
    setDeleteFeatureId(id);
  };

  const confirmDeleteFeature = async () => {
    if (deleteFeatureId === null) return;
    const id = deleteFeatureId;
    setDeleteFeatureId(null);
    try {
      const response = await apiFetch(`/api/platform/features/${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast('Feature deleted', 'success');
        setFeatures(prev => prev.filter(f => f.id !== id));
      } else {
        toast('Failed to delete feature', 'error');
      }
    } catch {
      toast('Failed to delete feature', 'error');
    }
  };

  const togglePlan = (plan: string) => {
    setForm(prev => ({
      ...prev,
      includedPlans: prev.includedPlans.includes(plan)
        ? prev.includedPlans.filter(p => p !== plan)
        : [...prev.includedPlans, plan],
    }));
  };

  return (
    <PageWrapper
      title="Feature Registry"
      subtitle="Manage platform features and their plan defaults"
      actions={
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-4 py-2 bg-cta text-deep-navy text-sm font-medium rounded-full hover:bg-cta/90 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Add Feature
        </button>
      }
    >
      <div className="space-y-6">
        {/* Create/Edit Form */}
        {showForm && (
          <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {editingId ? 'Edit Feature' : 'New Feature'}
              </h3>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') }))}
                  disabled={!!editingId}
                  placeholder="FEATURE_CODE"
                  className="w-full px-3 py-2 rounded-[2px] border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-charcoal focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Feature Name"
                  className="w-full px-3 py-2 rounded-[2px] border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-charcoal focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this feature"
                className="w-full px-3 py-2 rounded-[2px] border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-charcoal focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 rounded-[2px] border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-charcoal focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select category...</option>
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-[0.05em] mb-1">Included Plans</label>
              <div className="flex gap-2 mt-1">
                {PLAN_OPTIONS.map(plan => (
                  <button
                    key={plan}
                    onClick={() => togglePlan(plan)}
                    className={`px-3 py-1.5 rounded-[2px] text-xs font-medium border transition-colors ${
                      form.includedPlans.includes(plan)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-charcoal text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  form.isActive ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                  form.isActive ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSubmit}
                disabled={!form.code || !form.name || !form.category || form.includedPlans.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-full hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckIcon className="h-4 w-4" />
                {editingId ? 'Update' : 'Create'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-[2px] text-xs font-medium border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-primary text-white border-primary'
                : 'bg-white dark:bg-charcoal text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary'
            }`}
          >
            All ({features.length})
          </button>
          {CATEGORY_OPTIONS.map(cat => {
            const count = features.filter(f => f.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-[2px] text-xs font-medium border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-primary text-white border-primary'
                    : CATEGORY_STYLES[cat] || 'bg-gray-50 text-gray-600 border-gray-200'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Feature Table */}
        <div className="bg-white dark:bg-charcoal border border-gray-200 dark:border-gray-700 rounded-[2px] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Feature</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Code</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Category</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Plans</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Status</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400 uppercase text-xs tracking-[0.05em]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">Loading features...</td>
                </tr>
              ) : features.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">No features defined</td>
                </tr>
              ) : (
                features.filter(f => categoryFilter === 'all' || f.category === categoryFilter).map(feature => (
                  <tr key={feature.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <Link href={`/platform/features/${feature.id}`} className="hover:text-primary transition-colors">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{feature.name}</div>
                        {feature.description && (
                          <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{feature.description}</div>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-600 dark:text-gray-400">{feature.code}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded-[2px] text-xs font-medium border ${CATEGORY_STYLES[feature.category] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {CATEGORY_LABELS[feature.category] || feature.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1 flex-wrap">
                        {feature.includedPlans?.split(',').map(plan => (
                          <span key={plan} className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-[2px] text-[10px] font-medium">
                            {plan}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block w-2 h-2 rounded-full ${feature.active ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(feature)}
                          className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteFeature(feature.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        open={deleteFeatureId !== null}
        title="Delete Feature"
        message="Are you sure you want to delete this feature? This may affect all tenants using it."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteFeature}
        onCancel={() => setDeleteFeatureId(null)}
      />
    </PageWrapper>
  );
}
