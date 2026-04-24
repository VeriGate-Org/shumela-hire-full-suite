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

  // ── Helpers ──

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

  const getCardBorderClass = (doc: EmployeeDocument) => {
    if (isExpired(doc.expiryDate)) return 'border-l-red-500';
    if (isExpiringSoon(doc.expiryDate)) return 'border-l-amber-500';
    if (doc.eSignatureStatus === 'sent') return 'border-l-purple-500';
    if (doc.eSignatureStatus === 'completed') return 'border-l-green-500';
    return 'border-l-transparent';
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

  // ── Computed values ──

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
        title="My Documents"
        subtitle="View and manage your employee documents"
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
          {/* Upload Modal */}
          {showUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Upload Document</h3>
                  <button onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                    className="text-muted-foreground hover:text-foreground">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleUpload} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Document Type *</label>
                    <select required value={uploadType}
                      onChange={e => setUploadType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm">
                      <option value="">Select type...</option>
                      {documentTypes.map(t => (
                        <option key={t.code} value={t.code}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                    <input type="text" required value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                    <textarea rows={2} value={uploadDescription}
                      onChange={e => setUploadDescription(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  {selectedTypeConfig?.requiresExpiry && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Expiry Date</label>
                      <input type="date" value={uploadExpiryDate}
                        onChange={e => setUploadExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  )}
                  <FileUploadDropzone
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                    onClear={() => setSelectedFile(null)}
                    uploading={uploading}
                    progress={uploadProgress}
                    multiple={false}
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button"
                      onClick={() => { setShowUploadModal(false); resetUploadForm(); }}
                      className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">
                      Cancel
                    </button>
                    <button type="submit" disabled={uploading || !selectedFile}
                      className="btn-cta disabled:opacity-50">
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* E-Signature Modal */}
          {signatureDocId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Request Signature</h3>
                  <button onClick={() => setSignatureDocId(null)}
                    className="text-muted-foreground hover:text-foreground">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleSendForSignature} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Signer Email *</label>
                    <input type="email" required value={signerEmail}
                      onChange={e => setSignerEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Signer Name *</label>
                    <input type="text" required value={signerName}
                      onChange={e => setSignerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setSignatureDocId(null)}
                      className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                    <button type="submit" disabled={sendingSignature}
                      className="btn-cta disabled:opacity-50">
                      {sendingSignature ? 'Sending...' : 'Send for Signature'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Bulk Action Bar */}
          {selectedIds.size > 0 && (
            <div className="enterprise-card p-3 flex items-center gap-4 sticky bottom-4 z-10 shadow-lg">
              <span className="text-sm font-medium text-foreground">{selectedIds.size} selected</span>
              <button onClick={handleBulkDownload}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                <ArrowDownTrayIcon className="w-4 h-4" /> Download ZIP
              </button>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 bg-red-50 rounded-lg hover:bg-red-100">
                <TrashIcon className="w-4 h-4" /> Delete
              </button>
              <button onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-sm text-muted-foreground hover:text-foreground">Clear</button>
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

          {/* Summary Stats */}
          {!loading && documents.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setStatusFilter('all')}
                className={`enterprise-card p-4 text-left transition-all ${statusFilter === 'all' ? 'ring-2 ring-blue-500' : 'hover:shadow-md'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DocumentTextIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Documents</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')}
                className={`enterprise-card p-4 text-left transition-all ${statusFilter === 'expiring' ? 'ring-2 ring-amber-500' : 'hover:shadow-md'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.expiringSoon}</p>
                    <p className="text-xs text-muted-foreground">Expiring Soon</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'awaiting_signature' ? 'all' : 'awaiting_signature')}
                className={`enterprise-card p-4 text-left transition-all ${statusFilter === 'awaiting_signature' ? 'ring-2 ring-purple-500' : 'hover:shadow-md'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <PencilSquareIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.awaitingSignature}</p>
                    <p className="text-xs text-muted-foreground">Awaiting Signature</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
                className={`enterprise-card p-4 text-left transition-all ${statusFilter === 'expired' ? 'ring-2 ring-red-500' : 'hover:shadow-md'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
                    <p className="text-xs text-muted-foreground">Expired</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          {!loading && documents.length > 0 && (
            <div className="enterprise-card p-4">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm bg-background"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-background"
                >
                  <option value="">All Types</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{formatTypeName(type)}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-background"
                >
                  <option value="all">All Status</option>
                  <option value="expiring">Expiring Soon</option>
                  <option value="expired">Expired</option>
                  <option value="awaiting_signature">Awaiting Signature</option>
                  <option value="signed">Signed</option>
                </select>
                <div className="flex gap-1 border rounded-lg p-0.5 self-center">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Grid view"
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    title="List view"
                  >
                    <ListBulletIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {filteredDocuments.length !== documents.length && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing {filteredDocuments.length} of {documents.length} documents
                  {(searchQuery || typeFilter || statusFilter !== 'all') && (
                    <button onClick={() => { setSearchQuery(''); setTypeFilter(''); setStatusFilter('all'); }}
                      className="ml-2 text-blue-600 hover:underline">Clear filters</button>
                  )}
                </p>
              )}
            </div>
          )}

          {/* Select All */}
          {!loading && filteredDocuments.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-border"
              />
              <span className="text-xs text-muted-foreground">
                Select all ({filteredDocuments.length})
              </span>
            </div>
          )}

          {/* Document Cards */}
          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : documents.length === 0 ? (
            <EmptyState icon={DocumentTextIcon} title="No Documents" description="No documents found. Upload your first document to get started." />
          ) : filteredDocuments.length === 0 ? (
            <EmptyState icon={MagnifyingGlassIcon} title="No Results" description="No documents match your search or filters." />
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                : 'space-y-3'
            }>
              {filteredDocuments.map(doc => {
                const fileType = getFileTypeInfo(doc.contentType, doc.filename);
                const borderClass = getCardBorderClass(doc);

                return (
                  <div
                    key={doc.id}
                    className={`enterprise-card border-l-4 ${borderClass} transition-all hover:shadow-md ${
                      selectedIds.has(doc.id) ? 'ring-2 ring-blue-500 bg-blue-50/30' : ''
                    } ${viewMode === 'list' ? 'flex items-center gap-4 p-4' : 'p-4'}`}
                  >
                    {/* Checkbox + File Type */}
                    <div className={`flex items-start gap-3 ${viewMode === 'list' ? 'flex-shrink-0' : 'mb-3'}`}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                        className="rounded border-border mt-0.5"
                      />
                      <div className={`px-2 py-1 rounded text-xs font-bold ${fileType.bg} ${fileType.text}`}>
                        {fileType.label}
                      </div>
                      {viewMode === 'grid' && (
                        <span className="ml-auto text-xs text-muted-foreground">v{doc.version}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                      <h4 className="font-medium text-foreground text-sm leading-tight">{doc.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {doc.filename}
                        {doc.fileSize ? ` \u00b7 ${formatFileSize(doc.fileSize)}` : ''}
                        {viewMode === 'list' && ` \u00b7 v${doc.version}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                          {formatTypeName(doc.documentType)}
                        </span>
                        {doc.expiryDate && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            isExpired(doc.expiryDate)
                              ? 'bg-red-100 text-red-800'
                              : isExpiringSoon(doc.expiryDate)
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isExpired(doc.expiryDate) && <ExclamationTriangleIcon className="w-3 h-3" />}
                            {isExpiringSoon(doc.expiryDate) && <ClockIcon className="w-3 h-3" />}
                            {isExpired(doc.expiryDate) ? 'Expired' : 'Expires'} {doc.expiryDate}
                          </span>
                        )}
                        {getSignatureStatusBadge(doc.eSignatureStatus)}
                      </div>
                      {doc.description && viewMode === 'grid' && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{doc.description}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={`flex items-center gap-2 ${
                      viewMode === 'list' ? 'flex-shrink-0' : 'mt-3 pt-3 border-t border-border'
                    }`}>
                      <button
                        onClick={() => handleDownload(doc.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Download
                      </button>
                      {!doc.eSignatureStatus && (
                        <button
                          onClick={() => setSignatureDocId(doc.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <PencilSquareIcon className="w-3.5 h-3.5" /> Sign
                        </button>
                      )}
                      {doc.eSignatureStatus === 'completed' && (
                        <button
                          onClick={() => handleDownloadSigned(doc.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <CheckCircleIcon className="w-3.5 h-3.5" /> Signed Copy
                        </button>
                      )}
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('en-ZA')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
