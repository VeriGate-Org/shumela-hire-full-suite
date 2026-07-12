'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import EmptyState from '@/components/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import FileUploadDropzone from '@/components/documents/FileUploadDropzone';
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface EmployeeDocument {
  id: string;
  documentType: string;
  title: string;
  description: string | null;
  filename: string;
  fileUrl: string;
  fileSize: number | null;
  contentType: string | null;
  version: number;
  expiryDate: string | null;
  isActive: boolean;
  uploadedBy: string | null;
  createdAt: string;
  eSignatureStatus: string | null;
  eSignatureEnvelopeId: string | null;
  eSignatureCompletedAt: string | null;
  eSignatureSignerEmail: string | null;
}

interface DocumentTypeConfig {
  id: string;
  code: string;
  name: string;
  requiresExpiry: boolean;
  isRequired: boolean;
}

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentTypes, setDocumentTypes] = useState<DocumentTypeConfig[]>([]);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadExpiryDate, setUploadExpiryDate] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // E-signature modal
  const [signatureDocId, setSignatureDocId] = useState<string | null>(null);
  const [signerEmail, setSignerEmail] = useState('');
  const [signerName, setSignerName] = useState('');
  const [sendingSignature, setSendingSignature] = useState(false);

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';
  const { toast } = useToast();

  const selectedTypeConfig = useMemo(
    () => documentTypes.find(t => t.code === uploadType),
    [documentTypes, uploadType]
  );

  useEffect(() => {
    loadDocuments();
    loadDocumentTypes();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const response = await apiFetch(`/api/employee/documents?employeeId=${employeeId}`);
    if (response.ok) {
      const data = await response.json();
      setDocuments(data);
    }
    setLoading(false);
  };

  const loadDocumentTypes = async () => {
    const response = await apiFetch('/api/employee/document-types');
    if (response.ok) {
      const data = await response.json();
      setDocumentTypes(data);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadType('');
    setUploadTitle('');
    setUploadDescription('');
    setUploadExpiryDate('');
    setUploadProgress(0);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !uploadType || !uploadTitle) return;

    setUploading(true);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const params = new URLSearchParams({
        employeeId,
        type: uploadType,
        title: uploadTitle,
      });
      if (uploadDescription) params.append('description', uploadDescription);
      if (uploadExpiryDate) params.append('expiryDate', uploadExpiryDate);

      setUploadProgress(30);

      const response = await apiFetch(`/api/employee/documents?${params.toString()}`, {
        method: 'POST',
        body: formData,
        headers: {},
      });

      setUploadProgress(90);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || 'Failed to upload document');
      }

      setUploadProgress(100);
      setShowUploadModal(false);
      resetUploadForm();
      toast('Document uploaded successfully', 'success');
      loadDocuments();
    } catch (err: any) {
      toast(err.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleBulkUpload = async (files: File[]) => {
    if (!uploadType || !uploadTitle) return;

    setUploading(true);
    let success = 0;

    for (let i = 0; i < files.length; i++) {
      setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      try {
        const formData = new FormData();
        formData.append('file', files[i]);

        const params = new URLSearchParams({
          employeeId,
          type: uploadType,
          title: files.length === 1 ? uploadTitle : `${uploadTitle} (${i + 1})`,
        });
        if (uploadDescription) params.append('description', uploadDescription);
        if (uploadExpiryDate) params.append('expiryDate', uploadExpiryDate);

        const response = await apiFetch(`/api/employee/documents?${params.toString()}`, {
          method: 'POST',
          body: formData,
          headers: {},
        });

        if (response.ok) success++;
      } catch { /* continue with next file */ }
    }

    setUploading(false);
    setShowUploadModal(false);
    resetUploadForm();
    toast(`${success} of ${files.length} documents uploaded`, success > 0 ? 'success' : 'error');
    loadDocuments();
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/employee/documents/${docId}/download?employeeId=${employeeId}`);
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      window.open(data.downloadUrl, '_blank');
    } catch {
      toast('Failed to download document', 'error');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocuments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredDocuments.map(d => d.id)));
    }
  };

  const handleBulkDownload = async () => {
    try {
      const res = await apiFetch(`/api/employees/${employeeId}/documents/bulk-download`, {
        method: 'POST',
        body: JSON.stringify(Array.from(selectedIds)),
      });
      if (!res.ok) throw new Error('Bulk download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documents.zip';
      a.click();
      URL.revokeObjectURL(url);
      setSelectedIds(new Set());
    } catch {
      toast('Failed to download documents', 'error');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await apiFetch(`/api/employees/${employeeId}/documents/bulk-delete`, {
        method: 'POST',
        body: JSON.stringify(Array.from(selectedIds)),
      });
      if (!res.ok) throw new Error('Bulk delete failed');
      toast('Documents deleted successfully', 'success');
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
      loadDocuments();
    } catch {
      toast('Failed to delete documents', 'error');
    }
  };

  const handleSendForSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatureDocId || !signerEmail || !signerName) return;
    setSendingSignature(true);
    try {
      const res = await apiFetch(`/api/esignature/documents/${signatureDocId}/send`, {
        method: 'POST',
        body: JSON.stringify({ signerEmail, signerName }),
      });
      if (!res.ok) throw new Error('Failed to send for signature');
      toast('Document sent for signature', 'success');
      setSignatureDocId(null);
      setSignerEmail('');
      setSignerName('');
      loadDocuments();
    } catch (err: any) {
      toast(err.message || 'Failed to send for signature', 'error');
    } finally {
      setSendingSignature(false);
    }
  };

  const handleDownloadSigned = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/esignature/documents/${docId}/signed-document`);
      if (!res.ok) throw new Error('Failed to download signed document');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'signed-document.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast('Failed to download signed document', 'error');
    }
  };

  // -- Helpers --

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isExpired = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false;
    const expiry = new Date(date);
    const today = new Date();
    if (expiry <= today) return false;
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);
    return expiry <= thirtyDays;
  };

  const getFileTypeInfo = (contentType: string | null, filename: string | null) => {
    const ct = contentType?.toLowerCase() || '';
    const fn = filename?.toLowerCase() || '';
    if (ct.includes('pdf') || fn.endsWith('.pdf'))
      return { label: 'PDF', bg: 'bg-red-100', text: 'text-red-700' };
    if (ct.includes('word') || fn.endsWith('.docx') || fn.endsWith('.doc'))
      return { label: 'DOC', bg: 'bg-blue-100', text: 'text-blue-700' };
    if (ct.includes('image') || fn.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/))
      return { label: 'IMG', bg: 'bg-emerald-100', text: 'text-emerald-700' };
    if (ct.includes('spreadsheet') || fn.endsWith('.xlsx') || fn.endsWith('.xls') || fn.endsWith('.csv'))
      return { label: 'XLS', bg: 'bg-green-100', text: 'text-green-700' };
    if (ct.includes('presentation') || fn.endsWith('.pptx') || fn.endsWith('.ppt'))
      return { label: 'PPT', bg: 'bg-orange-100', text: 'text-orange-700' };
    return { label: 'FILE', bg: 'bg-gray-100', text: 'text-gray-600' };
  };

  const getDocExpiryStatus = (doc: EmployeeDocument) => {
    if (isExpired(doc.expiryDate)) return 'expired';
    if (isExpiringSoon(doc.expiryDate)) return 'expiring';
    return 'valid';
  };

  const getSignatureStatusBadge = (status: string | null) => {
    if (!status) return null;
    const styles: Record<string, string> = {
      sent: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      voided: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<string, string> = {
      sent: 'Awaiting Signature',
      completed: 'Signed',
      declined: 'Declined',
      voided: 'Voided',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status === 'completed' && <CheckCircleIcon className="w-3 h-3" />}
        {status === 'sent' && <ClockIcon className="w-3 h-3" />}
        {labels[status] || status}
      </span>
    );
  };

  const formatTypeName = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '-';
  };

  /** Map document type to a category badge palette */
  const getCategoryBadgeClasses = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('id') || t.includes('identity') || t.includes('passport'))
      return 'bg-icon-bg-navy text-accent-navy';
    if (t.includes('qualification') || t.includes('degree') || t.includes('diploma'))
      return 'bg-icon-bg-teal text-accent-teal';
    if (t.includes('certificate') || t.includes('cert'))
      return 'bg-icon-bg-gold text-accent-gold';
    if (t.includes('contract') || t.includes('agreement'))
      return 'bg-purple-100 text-purple-700';
    if (t.includes('medical') || t.includes('health'))
      return 'bg-icon-bg-pink text-accent-pink';
    return 'bg-slate-100 text-slate-500';
  };

  // -- Computed values --

  const stats = useMemo(() => ({
    total: documents.length,
    expired: documents.filter(d => isExpired(d.expiryDate)).length,
    expiringSoon: documents.filter(d => isExpiringSoon(d.expiryDate)).length,
    awaitingSignature: documents.filter(d => d.eSignatureStatus === 'sent').length,
  }), [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = doc.title.toLowerCase().includes(q) ||
          doc.filename?.toLowerCase().includes(q) ||
          doc.documentType?.toLowerCase().includes(q) ||
          doc.description?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (typeFilter && doc.documentType !== typeFilter) return false;
      if (statusFilter !== 'all') {
        switch (statusFilter) {
          case 'expired': if (!isExpired(doc.expiryDate)) return false; break;
          case 'expiring': if (!isExpiringSoon(doc.expiryDate)) return false; break;
          case 'awaiting_signature': if (doc.eSignatureStatus !== 'sent') return false; break;
          case 'signed': if (doc.eSignatureStatus !== 'completed') return false; break;
        }
      }
      return true;
    });
  }, [documents, searchQuery, typeFilter, statusFilter]);

  const uniqueTypes = useMemo(() => {
    const types = [...new Set(documents.map(d => d.documentType).filter(Boolean))];
    return types.sort();
  }, [documents]);

  return (
    <FeatureGate feature="EMPLOYEE_DOCUMENTS">
      <PageWrapper
        title="Documents"
        subtitle="Manage employee documents, certificates, and compliance records"
        actions={
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn-cta inline-flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload Document
          </button>
        }
      >
        <div className="space-y-6">
          {/* ===== Upload Document Modal ===== */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-6">
              <div className="bg-card rounded-2xl shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 pb-0">
                  <h2 className="text-xl font-bold text-foreground">Upload Document</h2>
                  <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpload} className="p-6 space-y-4">
                  <FileUploadDropzone
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClear={() => setSelectedFile(null)}
                    uploading={uploading}
                    progress={uploadProgress}
                    multiple={false}
                  />

                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Document Type <span className="text-destructive">*</span>
                    </label>
                    <select required value={uploadType}
                      onChange={e => setUploadType(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer">
                      <option value="">Select type...</option>
                      {documentTypes.map(t => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Title <span className="text-destructive">*</span>
                    </label>
                    <input type="text" required value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      placeholder="Enter document name"
                      className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Description <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <textarea rows={2} value={uploadDescription}
                      onChange={e => setUploadDescription(e.target.value)}
                      placeholder="Add any relevant notes about this document..."
                      className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none resize-y min-h-[80px]" />
                  </div>
                  {selectedTypeConfig?.requiresExpiry && (
                    <div>
                      <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                        Expiry Date <span className="text-muted-foreground font-normal">(optional)</span>
                      </label>
                      <input type="date" value={uploadExpiryDate}
                        onChange={e => setUploadExpiryDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                    </div>
                  )}
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button type="button"
                      onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                      className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-surface-navy hover:text-primary rounded-button transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={uploading || !selectedFile}
                      className="btn-cta inline-flex items-center gap-2 disabled:opacity-50">
                      <ArrowUpTrayIcon className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ===== E-Signature Modal ===== */}
          {signatureDocId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-6">
              <div className="bg-card rounded-2xl shadow-xl w-full max-w-[480px]">
                <div className="flex items-center justify-between p-6 pb-0">
                  <h2 className="text-xl font-bold text-foreground">Request Signature</h2>
                  <button onClick={() => setSignatureDocId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSendForSignature} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Signer Email <span className="text-destructive">*</span>
                    </label>
                    <input type="email" required value={signerEmail}
                      onChange={e => setSignerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                  </div>
                  <div>
                    <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                      Signer Name <span className="text-destructive">*</span>
                    </label>
                    <input type="text" required value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none" />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button type="button" onClick={() => setSignatureDocId(null)}
                      className="px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-surface-navy hover:text-primary rounded-button transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={sendingSignature}
                      className="btn-cta disabled:opacity-50">
                      {sendingSignature ? 'Sending...' : 'Send for Signature'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ===== Bulk Action Bar ===== */}
          {selectedIds.size > 0 && (
            <div className="enterprise-card p-3 flex items-center gap-4 sticky bottom-4 z-10 shadow-lg">
              <span className="text-sm font-semibold text-foreground">{selectedIds.size} selected</span>
              <button onClick={handleBulkDownload}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-accent-navy bg-surface-navy rounded-button hover:bg-icon-bg-navy transition-colors">
                <ArrowDownTrayIcon className="w-4 h-4" /> Download ZIP
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-destructive bg-error-bg rounded-button hover:bg-red-200 transition-colors">
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors">Clear</button>
            </div>
          )}

          <ConfirmDialog
            open={showDeleteConfirm}
            title="Delete Documents"
            message={`Are you sure you want to delete ${selectedIds.size} document(s)? This action cannot be undone.`}
            confirmLabel="Delete"
            variant="danger"
            onConfirm={handleBulkDelete}
            onCancel={() => setShowDeleteConfirm(false)}
          />

          {/* ===== Stats Bar (4-col grid matching mock) ===== */}
          {!loading && documents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`enterprise-card flex items-center gap-4 p-5 text-left transition-all hover:-translate-y-px ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[1.5rem] font-extrabold leading-none text-foreground">{stats.total}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Documents</p>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')}
                className={`enterprise-card flex items-center gap-4 p-5 text-left transition-all hover:-translate-y-px border-l-[3px] border-l-warning ${statusFilter === 'expiring' ? 'ring-2 ring-warning' : ''}`}
              >
                <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[1.5rem] font-extrabold leading-none text-foreground">{stats.expiringSoon}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Expiring Soon</p>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'awaiting_signature' ? 'all' : 'awaiting_signature')}
                className={`enterprise-card flex items-center gap-4 p-5 text-left transition-all hover:-translate-y-px ${statusFilter === 'awaiting_signature' ? 'ring-2 ring-purple-500' : ''}`}
              >
                <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                  <PencilSquareIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[1.5rem] font-extrabold leading-none text-foreground">{stats.awaitingSignature}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Awaiting Signature</p>
                </div>
              </button>

              <button
                onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                className={`enterprise-card flex items-center gap-4 p-5 text-left transition-all hover:-translate-y-px border-l-[3px] border-l-destructive ${statusFilter === 'expired' ? 'ring-2 ring-destructive' : ''}`}
              >
                <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
                  <ExclamationCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[1.5rem] font-extrabold leading-none text-foreground">{stats.expired}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Expired</p>
                </div>
              </button>
            </div>
          )}

          {/* ===== Filter & View Bar (two-row layout matching mock) ===== */}
          {!loading && documents.length > 0 && (
            <div className="enterprise-card p-4 md:p-5">
              {/* Top row: Category filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setTypeFilter('')}
                  className={`px-3.5 py-1.5 rounded-button text-xs font-semibold border transition-all ${
                    typeFilter === ''
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-transparent border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy'
                  }`}
                >
                  All
                </button>
                {uniqueTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(typeFilter === type ? '' : type)}
                    className={`px-3.5 py-1.5 rounded-button text-xs font-semibold border transition-all ${
                      typeFilter === type
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-transparent border-border text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy'
                    }`}
                  >
                    {formatTypeName(type)}
                  </button>
                ))}
              </div>

              {/* Bottom row: Status select + Search + View toggle */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mt-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="text-sm font-medium px-3 py-2 border border-border rounded-control bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="awaiting_signature">Awaiting Signature</option>
                  <option value="signed">Signed</option>
                </select>

                <div className="relative flex-1 max-w-xs">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-control bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  />
                </div>

                <div className="flex items-center gap-0 flex-shrink-0 self-center md:self-auto ml-auto">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`w-[38px] h-[38px] rounded-l-control border flex items-center justify-center transition-all ${
                      viewMode === 'grid'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-muted-foreground hover:bg-surface-navy hover:text-primary'
                    }`}
                    title="Grid View"
                  >
                    <Squares2X2Icon className="w-[18px] h-[18px]" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`w-[38px] h-[38px] rounded-r-control border border-l-0 flex items-center justify-center transition-all ${
                      viewMode === 'list'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'bg-card border-border text-muted-foreground hover:bg-surface-navy hover:text-primary'
                    }`}
                    title="List View"
                  >
                    <ListBulletIcon className="w-[18px] h-[18px]" />
                  </button>
                </div>
              </div>

              {/* Filter result count */}
              {filteredDocuments.length !== documents.length && (
                <p className="text-xs text-muted-foreground mt-3">
                  Showing {filteredDocuments.length} of {documents.length} documents
                  {(searchQuery || typeFilter || statusFilter !== 'all') && (
                    <button onClick={() => { setSearchQuery(''); setTypeFilter(''); setStatusFilter('all'); }}
                      className="ml-2 text-link hover:underline font-semibold">Clear filters</button>
                  )}
                </p>
              )}
            </div>
          )}

          {/* ===== Select All ===== */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-border"
              />
              <span className="text-xs text-muted-foreground font-medium">
                Select all ({filteredDocuments.length})
              </span>
            </div>
          )}

          {/* ===== Document Content ===== */}
          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : documents.length === 0 ? (
            <EmptyState icon={DocumentTextIcon} title="No Documents Found" description="Upload your first document to get started. Keep all your important employee documents organized in one place." />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState icon={MagnifyingGlassIcon} title="No documents match your filters" description="Try adjusting your search or filters to find what you are looking for." />
          ) : viewMode === 'grid' ? (
            /* ===== Grid View (3-col matching mock) ===== */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredDocuments.map(doc => {
                const fileType = getFileTypeInfo(doc.contentType, doc.filename);
                const expiryStatus = getDocExpiryStatus(doc);

                return (
                  <div
                    key={doc.id}
                    className={`enterprise-card p-5 transition-all hover:-translate-y-1 hover:shadow-xl cursor-pointer relative ${
                      selectedIds.has(doc.id) ? 'ring-2 ring-primary bg-surface-navy/30' : ''
                    }`}
                  >
                    {/* Card header: file icon + checkbox */}
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 rounded-card flex items-center justify-center text-[0.6875rem] font-extrabold uppercase tracking-wide ${fileType.bg} ${fileType.text}`}>
                        {fileType.label}
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-border mt-1"
                      />
                    </div>

                    {/* Document name */}
                    <h4 className="text-[0.9375rem] font-bold text-foreground leading-snug mb-2">{doc.title}</h4>

                    {/* Category badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wider mb-3 ${getCategoryBadgeClasses(doc.documentType)}`}>
                      {formatTypeName(doc.documentType)}
                    </span>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" />
                        {new Date(doc.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <DocumentTextIcon className="w-3.5 h-3.5" />
                        {formatFileSize(doc.fileSize)}
                      </span>
                      <span className="text-muted-foreground/60">v{doc.version}</span>
                    </div>

                    {/* Signature badge */}
                    {doc.eSignatureStatus && (
                      <div className="mb-3">{getSignatureStatusBadge(doc.eSignatureStatus)}</div>
                    )}

                    {/* Description (in grid only) */}
                    {doc.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{doc.description}</p>
                    )}

                    {/* Expiry status footer */}
                    <div className={`flex items-center gap-1.5 pt-3 border-t border-border text-xs font-semibold ${
                      expiryStatus === 'expired' ? 'text-destructive' :
                      expiryStatus === 'expiring' ? 'text-warning' :
                      'text-success'
                    }`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        expiryStatus === 'expired' ? 'bg-destructive' :
                        expiryStatus === 'expiring' ? 'bg-warning' :
                        'bg-success'
                      }`} />
                      {doc.expiryDate ? (
                        isExpired(doc.expiryDate) ? `Expired ${doc.expiryDate}` :
                        isExpiringSoon(doc.expiryDate) ? `Expires ${doc.expiryDate}` :
                        `Expires ${doc.expiryDate}`
                      ) : 'Valid'}
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownload(doc.id); }}
                        className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                      </button>
                      {!doc.eSignatureStatus && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setSignatureDocId(doc.id); }}
                          className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all"
                          title="Request Signature"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                        </button>
                      )}
                      {doc.eSignatureStatus === 'completed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownloadSigned(doc.id); }}
                          className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-teal hover:text-accent-teal transition-all"
                          title="Download Signed Copy"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ===== List / Table View (matching mock table layout) ===== */
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-border"
                        />
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Document
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Category
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Type
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Size
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Uploaded
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Expiry
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Status
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc, idx) => {
                      const fileType = getFileTypeInfo(doc.contentType, doc.filename);
                      const expiryStatus = getDocExpiryStatus(doc);

                      return (
                        <tr
                          key={doc.id}
                          className={`border-b border-border transition-colors hover:bg-surface-navy ${
                            idx % 2 === 1 ? 'bg-slate-50' : ''
                          } ${selectedIds.has(doc.id) ? 'bg-surface-navy/50' : ''}`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-3 align-middle">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(doc.id)}
                              onChange={() => toggleSelect(doc.id)}
                              className="rounded border-border"
                            />
                          </td>

                          {/* Document name cell with mini icon */}
                          <td className="px-4 py-3 text-[0.8125rem] text-foreground align-middle">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-control flex items-center justify-center text-[0.5625rem] font-extrabold uppercase tracking-wider flex-shrink-0 ${fileType.bg} ${fileType.text}`}>
                                {fileType.label}
                              </div>
                              <span className="font-semibold">{doc.title}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3 align-middle">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.625rem] font-semibold uppercase tracking-wider ${getCategoryBadgeClasses(doc.documentType)}`}>
                              {formatTypeName(doc.documentType)}
                            </span>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground align-middle">
                            {fileType.label}
                          </td>

                          {/* Size */}
                          <td className="px-4 py-3 text-[0.8125rem] text-foreground align-middle">
                            {formatFileSize(doc.fileSize)}
                          </td>

                          {/* Uploaded date */}
                          <td className="px-4 py-3 text-[0.8125rem] text-foreground align-middle">
                            {new Date(doc.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>

                          {/* Expiry */}
                          <td className="px-4 py-3 text-xs text-muted-foreground align-middle">
                            {doc.expiryDate || 'No expiry'}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 align-middle">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-button text-[0.6875rem] font-semibold ${
                              expiryStatus === 'expired' ? 'bg-error-bg text-destructive' :
                              expiryStatus === 'expiring' ? 'bg-warning-bg text-warning' :
                              'bg-success-bg text-success'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                expiryStatus === 'expired' ? 'bg-destructive' :
                                expiryStatus === 'expiring' ? 'bg-warning' :
                                'bg-success'
                              }`} />
                              {expiryStatus === 'expired' ? 'Expired' : expiryStatus === 'expiring' ? 'Expiring Soon' : 'Valid'}
                            </span>
                            {doc.eSignatureStatus && (
                              <span className="ml-1.5">{getSignatureStatusBadge(doc.eSignatureStatus)}</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDownload(doc.id)}
                                className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all"
                                title="Download"
                              >
                                <ArrowDownTrayIcon className="w-4 h-4" />
                              </button>
                              {!doc.eSignatureStatus && (
                                <button
                                  onClick={() => setSignatureDocId(doc.id)}
                                  className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all"
                                  title="Request Signature"
                                >
                                  <PencilSquareIcon className="w-4 h-4" />
                                </button>
                              )}
                              {doc.eSignatureStatus === 'completed' && (
                                <button
                                  onClick={() => handleDownloadSigned(doc.id)}
                                  className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-teal hover:text-accent-teal transition-all"
                                  title="Download Signed Copy"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
