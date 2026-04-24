'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

interface RetentionPolicy {
  id: string;
  documentTypeCode: string;
  retentionDays: number;
  action: string;
  isActive: boolean;
  notifyDaysBeforeAction: number | null;
  createdAt: string;
}

interface PreviewResult {
  totalAffected: number;
  policies: {
    documentType: string;
    action: string;
    retentionDays: number;
    affectedCount: number;
  }[];
}

const ACTIONS = ['DELETE', 'ARCHIVE', 'NOTIFY'];

export default function DocumentRetentionPage() {
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [documentTypes, setDocumentTypes] = useState<{ code: string; name: string }[]>([]);

  const [form, setForm] = useState({
    documentTypeCode: '',
    retentionDays: 365,
    action: 'ARCHIVE',
    notifyDaysBeforeAction: 30,
    isActive: true,
  });

  const { toast } = useToast();

  useEffect(() => {
    loadPolicies();
    loadDocumentTypes();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    const res = await apiFetch('/api/admin/retention-policies');
    if (res.ok) {
      setPolicies(await res.json());
    }
    setLoading(false);
  };

  const loadDocumentTypes = async () => {
    const res = await apiFetch('/api/employee/document-types');
    if (res.ok) {
      const data = await res.json();
      setDocumentTypes(data.map((t: any) => ({ code: t.code, name: t.name })));
    }
  };

  const resetForm = () => {
    setForm({ documentTypeCode: '', retentionDays: 365, action: 'ARCHIVE', notifyDaysBeforeAction: 30, isActive: true });
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (policy: RetentionPolicy) => {
    setForm({
      documentTypeCode: policy.documentTypeCode,
      retentionDays: policy.retentionDays,
      action: policy.action,
      notifyDaysBeforeAction: policy.notifyDaysBeforeAction ?? 30,
      isActive: policy.isActive,
    });
    setEditingId(policy.id);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId
      ? `/api/admin/retention-policies/${editingId}`
      : '/api/admin/retention-policies';

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast(editingId ? 'Policy updated' : 'Policy created', 'success');
      setShowModal(false);
      resetForm();
      loadPolicies();
    } else {
      const err = await res.json();
      toast(err.error || 'Failed to save policy', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/admin/retention-policies/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Policy deleted', 'success');
      setDeleteId(null);
      loadPolicies();
    }
  };

  const handlePreview = async () => {
    setPreviewLoading(true);
    setShowPreview(true);
    const res = await apiFetch('/api/admin/retention-policies/preview', { method: 'POST' });
    if (res.ok) {
      setPreview(await res.json());
    } else {
      toast('Failed to load preview', 'error');
    }
    setPreviewLoading(false);
  };

  const formatDays = (days: number) => {
    if (days >= 365) return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} (${days}d)`;
    if (days >= 30) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} (${days}d)`;
    return `${days} days`;
  };

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      DELETE: 'bg-red-100 text-red-800',
      ARCHIVE: 'bg-blue-100 text-blue-800',
      NOTIFY: 'bg-yellow-100 text-yellow-800',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[action] || 'bg-gray-100 text-gray-800'}`}>
        {action}
      </span>
    );
  };

  return (
    <FeatureGate feature="DOCUMENT_RETENTION">
      <PageWrapper
        title="Document Retention Policies"
        subtitle="Configure automatic retention rules for employee documents"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handlePreview} className="inline-flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-muted">
              <EyeIcon className="w-4 h-4" /> Preview Impact
            </button>
            <button onClick={openCreate} className="btn-cta inline-flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> Add Policy
            </button>
          </div>
        }
      >
        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  {editingId ? 'Edit Retention Policy' : 'Create Retention Policy'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }}
                  className="text-muted-foreground hover:text-foreground">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Document Type *</label>
                  <select required value={form.documentTypeCode}
                    onChange={e => setForm({ ...form, documentTypeCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Select type...</option>
                    {documentTypes.map(t => (
                      <option key={t.code} value={t.code}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Retention Period (days) *</label>
                  <input type="number" required min={1} value={form.retentionDays}
                    onChange={e => setForm({ ...form, retentionDays: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">{formatDays(form.retentionDays)}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Action *</label>
                  <select required value={form.action}
                    onChange={e => setForm({ ...form, action: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    {ACTIONS.map(a => (
                      <option key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Notify Days Before Action</label>
                  <input type="number" min={0} value={form.notifyDaysBeforeAction}
                    onChange={e => setForm({ ...form, notifyDaysBeforeAction: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded border-border" />
                  Policy is active
                </label>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                  <button type="submit" className="btn-cta">
                    {editingId ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Retention Policy Preview</h3>
                <button onClick={() => setShowPreview(false)}
                  className="text-muted-foreground hover:text-foreground">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              {previewLoading ? (
                <div className="py-8 text-center text-muted-foreground">Loading preview...</div>
              ) : preview ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm font-medium text-amber-800">
                      {preview.totalAffected} document{preview.totalAffected !== 1 ? 's' : ''} would be affected by active policies
                    </p>
                  </div>
                  {preview.policies.length > 0 ? (
                    <table className="min-w-full divide-y divide-border text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase">Retention</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-muted-foreground uppercase">Affected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {preview.policies.map((p, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{p.documentType.replace(/_/g, ' ')}</td>
                            <td className="px-3 py-2">{getActionBadge(p.action)}</td>
                            <td className="px-3 py-2 text-muted-foreground">{formatDays(p.retentionDays)}</td>
                            <td className="px-3 py-2 text-right font-medium">{p.affectedCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No active retention policies found.</p>
                  )}
                  <div className="flex justify-end pt-2">
                    <button onClick={() => setShowPreview(false)}
                      className="px-4 py-2 text-sm border rounded-lg hover:bg-muted">Close</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Failed to load preview.</p>
              )}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Retention Policy"
          message="Are you sure you want to delete this retention policy?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />

        {loading ? (
          <div className="enterprise-card p-6"><TableSkeleton /></div>
        ) : policies.length === 0 ? (
          <EmptyState icon={ClockIcon} title="No Retention Policies" description="Create your first document retention policy to automate document lifecycle management." />
        ) : (
          <div className="enterprise-card overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Document Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Retention Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Notify Before</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {policies.map(policy => (
                  <tr key={policy.id} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">
                      {policy.documentTypeCode.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDays(policy.retentionDays)}
                    </td>
                    <td className="px-4 py-3 text-sm">{getActionBadge(policy.action)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {policy.notifyDaysBeforeAction ? `${policy.notifyDaysBeforeAction} days` : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        policy.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {policy.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(policy)}
                          className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(policy.id)}
                          className="p-1 text-red-600 hover:text-red-800 rounded hover:bg-red-50">
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
      </PageWrapper>
    </FeatureGate>
  );
}
