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
      DELETE: 'bg-icon-bg-pink text-accent-pink',
      ARCHIVE: 'bg-icon-bg-navy text-accent-navy',
      NOTIFY: 'bg-icon-bg-gold text-accent-gold',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wide ${styles[action] || 'bg-muted text-muted-foreground'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${
          action === 'DELETE' ? 'bg-accent-pink' : action === 'ARCHIVE' ? 'bg-accent-navy' : action === 'NOTIFY' ? 'bg-accent-gold' : 'bg-muted-foreground'
        }`} />
        {action}
      </span>
    );
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wide bg-icon-bg-teal text-accent-teal">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wide bg-muted text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        Inactive
      </span>
    );
  };

  /* ---------- derived stats ---------- */
  const totalPolicies = policies.length;
  const activePolicies = policies.filter(p => p.isActive).length;
  const archivePolicies = policies.filter(p => p.action === 'ARCHIVE').length;
  const deletePolicies = policies.filter(p => p.action === 'DELETE').length;

  return (
    <FeatureGate feature="DOCUMENT_RETENTION">
      <PageWrapper
        title="Document Retention Policies"
        subtitle="Manage document lifecycle, retention periods, and compliance"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={handlePreview}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button text-[0.8125rem] font-semibold uppercase tracking-wider border border-border bg-card text-foreground hover:bg-surface-navy hover:border-primary hover:text-primary transition-all duration-200"
            >
              <EyeIcon className="w-4 h-4" />
              Preview Impact
            </button>
            <button onClick={openCreate} className="btn-cta inline-flex items-center gap-2">
              <PlusIcon className="w-4 h-4" />
              Create Policy
            </button>
          </div>
        }
      >
        {/* ====== CREATE / EDIT MODAL ====== */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-6">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-xl font-bold text-foreground">
                  {editingId ? 'Edit Retention Policy' : 'Create Retention Policy'}
                </h2>
                <button
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleSubmit} className="px-6 py-6">
                <div className="space-y-4">
                  {/* Document Type */}
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Document Type <span className="text-error">*</span>
                    </label>
                    <select
                      required
                      value={form.documentTypeCode}
                      onChange={e => setForm({ ...form, documentTypeCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-border bg-card rounded-control text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/10"
                    >
                      <option value="">Select type...</option>
                      {documentTypes.map(t => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Two-column row: Retention + Action */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                        Retention Period (days) <span className="text-error">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={form.retentionDays}
                        onChange={e => setForm({ ...form, retentionDays: parseInt(e.target.value) || 0 })}
                        className="w-full px-3.5 py-2.5 border border-border bg-card rounded-control text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/10"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{formatDays(form.retentionDays)}</p>
                    </div>
                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                        Action <span className="text-error">*</span>
                      </label>
                      <select
                        required
                        value={form.action}
                        onChange={e => setForm({ ...form, action: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-border bg-card rounded-control text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/10"
                      >
                        {ACTIONS.map(a => (
                          <option key={a} value={a}>{a.charAt(0) + a.slice(1).toLowerCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Notify Days Before */}
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Notify Days Before Action
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.notifyDaysBeforeAction}
                      onChange={e => setForm({ ...form, notifyDaysBeforeAction: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 border border-border bg-card rounded-control text-sm text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-ring/10"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Number of days before the action to send a notification</p>
                  </div>

                  {/* Active Toggle Row */}
                  <div className="flex items-center justify-between py-3 border-y border-border">
                    <div>
                      <p className="text-[0.8125rem] font-semibold text-foreground">Policy is active</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Enable or disable this retention policy</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-border rounded-full peer-checked:bg-accent-teal transition-colors duration-200 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:shadow-sm after:transition-transform after:duration-200 peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-5 py-2.5 rounded-button text-[0.8125rem] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-cta">
                    {editingId ? 'Update Policy' : 'Create Policy'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ====== PREVIEW MODAL ====== */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-6">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-[560px] max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-xl font-bold text-foreground">Retention Policy Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all duration-200"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6">
                {previewLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading preview...</div>
                ) : preview ? (
                  <div className="space-y-4">
                    {/* Warning banner */}
                    <div className="flex items-start gap-3 p-4 bg-surface-gold border border-gold-200 rounded-card">
                      <ClockIcon className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-semibold text-foreground">
                        {preview.totalAffected} document{preview.totalAffected !== 1 ? 's' : ''} would be affected by active policies
                      </p>
                    </div>

                    {preview.policies.length > 0 ? (
                      <div className="overflow-x-auto rounded-card border border-border">
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border">Type</th>
                              <th className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border">Action</th>
                              <th className="px-4 py-3 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border">Retention</th>
                              <th className="px-4 py-3 text-right text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border">Affected</th>
                            </tr>
                          </thead>
                          <tbody>
                            {preview.policies.map((p, i) => (
                              <tr key={i} className="border-b border-border last:border-b-0 hover:bg-surface-navy transition-colors duration-150">
                                <td className="px-4 py-3 text-[0.8125rem] font-semibold text-foreground">{p.documentType.replace(/_/g, ' ')}</td>
                                <td className="px-4 py-3">{getActionBadge(p.action)}</td>
                                <td className="px-4 py-3 text-[0.8125rem] text-muted-foreground">{formatDays(p.retentionDays)}</td>
                                <td className="px-4 py-3 text-right text-[0.8125rem] font-bold text-foreground">{p.affectedCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No active retention policies found.</p>
                    )}

                    {/* Modal Footer */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setShowPreview(false)}
                        className="px-5 py-2.5 rounded-button text-[0.8125rem] font-semibold uppercase tracking-wider border border-border bg-card text-foreground hover:bg-surface-navy hover:border-primary transition-all duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Failed to load preview.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Retention Policy"
          message="Are you sure you want to delete this retention policy? This action cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />

        {loading ? (
          <div className="space-y-6">
            {/* Skeleton stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="enterprise-card p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-card bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton table */}
            <div className="enterprise-card p-6">
              <TableSkeleton />
            </div>
          </div>
        ) : policies.length === 0 ? (
          <EmptyState
            icon={ClockIcon}
            title="No Retention Policies"
            description="Create your first document retention policy to automate document lifecycle management."
          />
        ) : (
          <div className="space-y-6">

            {/* ====== STAT CARDS ====== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Total Policies */}
              <div className="enterprise-card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-foreground">{totalPolicies}</p>
                    <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Policies</p>
                  </div>
                </div>
              </div>

              {/* Active Policies */}
              <div className="enterprise-card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-foreground">{activePolicies}</p>
                    <p className="text-[0.8125rem] text-muted-foreground mt-1">Active</p>
                  </div>
                </div>
              </div>

              {/* Archive Policies */}
              <div className="enterprise-card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-foreground">{archivePolicies}</p>
                    <p className="text-[0.8125rem] text-muted-foreground mt-1">Archive Rules</p>
                  </div>
                </div>
              </div>

              {/* Delete Policies */}
              <div className="enterprise-card p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold leading-none text-foreground">{deletePolicies}</p>
                    <p className="text-[0.8125rem] text-muted-foreground mt-1">Delete Rules</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ====== COMPLIANCE OVERVIEW BAR ====== */}
            {policies.length > 0 && (
              <div className="enterprise-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-foreground">Compliance Overview</h2>
                  <span className="text-xs text-muted-foreground">{activePolicies} of {totalPolicies} policies active</span>
                </div>
                <div className="h-8 rounded-control overflow-hidden flex">
                  {activePolicies > 0 && (
                    <div
                      className="h-full bg-accent-teal flex items-center justify-center text-[0.6875rem] font-bold text-white tracking-wide transition-all duration-500"
                      style={{ width: `${Math.round((activePolicies / totalPolicies) * 100)}%` }}
                    >
                      {Math.round((activePolicies / totalPolicies) * 100)}% Active
                    </div>
                  )}
                  {(totalPolicies - activePolicies) > 0 && (
                    <div
                      className="h-full bg-accent-gold flex items-center justify-center text-[0.6875rem] font-bold text-foreground tracking-wide transition-all duration-500"
                      style={{ width: `${Math.round(((totalPolicies - activePolicies) / totalPolicies) * 100)}%` }}
                    >
                      {Math.round(((totalPolicies - activePolicies) / totalPolicies) * 100)}%
                    </div>
                  )}
                </div>
                <div className="flex gap-6 mt-3">
                  <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-teal flex-shrink-0" />
                    <span>Active <strong className="font-bold text-foreground">{activePolicies}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-accent-gold flex-shrink-0" />
                    <span>Inactive <strong className="font-bold text-foreground">{totalPolicies - activePolicies}</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* ====== RETENTION POLICIES TABLE ====== */}
            <div className="enterprise-card overflow-hidden">
              {/* Section Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Retention Policies</h2>
                <button
                  onClick={handlePreview}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-button text-xs font-semibold uppercase tracking-wider border border-border bg-card text-foreground hover:bg-surface-navy hover:border-primary hover:text-primary transition-all duration-200"
                >
                  <EyeIcon className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap">Document Type</th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap">Retention Period</th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap">Action</th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap">Notify Before</th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap">Status</th>
                      <th className="px-4 py-3.5 text-right text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy, index) => (
                      <tr
                        key={policy.id}
                        className={`border-b border-border last:border-b-0 hover:bg-surface-navy transition-colors duration-150 ${
                          index % 2 === 1 ? 'bg-background/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex-shrink-0 w-9 h-9 rounded-control flex items-center justify-center ${
                              policy.action === 'DELETE' ? 'bg-icon-bg-pink text-accent-pink' :
                              policy.action === 'ARCHIVE' ? 'bg-icon-bg-navy text-accent-navy' :
                              'bg-icon-bg-gold text-accent-gold'
                            }`}>
                              <ClockIcon className="w-[18px] h-[18px]" />
                            </div>
                            <div>
                              <p className="text-[0.8125rem] font-semibold text-foreground">
                                {policy.documentTypeCode.replace(/_/g, ' ')}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[0.8125rem] text-foreground">
                          {formatDays(policy.retentionDays)}
                        </td>
                        <td className="px-4 py-3">
                          {getActionBadge(policy.action)}
                        </td>
                        <td className="px-4 py-3 text-[0.8125rem] text-muted-foreground">
                          {policy.notifyDaysBeforeAction ? `${policy.notifyDaysBeforeAction} days` : '--'}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(policy.isActive)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(policy)}
                              title="Edit Policy"
                              className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all duration-200"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(policy.id)}
                              title="Delete Policy"
                              className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-all duration-200"
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
            </div>

          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
