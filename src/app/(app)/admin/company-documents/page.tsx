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
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface CompanyDocument {
  id: string;
  title: string;
  description: string | null;
  category: string;
  filename: string;
  fileUrl: string;
  fileSize: number | null;
  version: number;
  isPublished: boolean;
  requiresAcknowledgement: boolean;
  uploadedBy: string;
  createdAt: string;
  publishedAt: string | null;
}

const CATEGORIES = ['POLICY', 'HANDBOOK', 'PROCEDURE', 'FORM', 'TEMPLATE', 'ANNOUNCEMENT'];

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  POLICY: 'bg-icon-bg-navy text-accent-navy',
  HANDBOOK: 'bg-icon-bg-teal text-accent-teal',
  PROCEDURE: 'bg-icon-bg-teal text-accent-teal',
  FORM: 'bg-icon-bg-gold text-accent-gold',
  TEMPLATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  ANNOUNCEMENT: 'bg-icon-bg-pink text-accent-pink',
};

function getFileTypeStyle(filename: string): string {
  const ext = filename?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'bg-error-bg text-error';
  if (ext === 'doc' || ext === 'docx') return 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  if (ext === 'xls' || ext === 'xlsx') return 'bg-success-bg text-success';
  return 'bg-surface-navy text-accent-navy';
}

export default function AdminCompanyDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ackStatus, setAckStatus] = useState<Record<string, { acknowledgedCount: number }>>({});

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'POLICY', requiresAcknowledgement: false });

  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const res = await apiFetch('/api/company-documents/all');
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
      // Load ack status for each doc requiring it
      for (const doc of data) {
        if (doc.requiresAcknowledgement) {
          const ackRes = await apiFetch(`/api/company-documents/${doc.id}/acknowledgements`);
          if (ackRes.ok) {
            const ackData = await ackRes.json();
            setAckStatus(prev => ({ ...prev, [doc.id]: ackData }));
          }
        }
      }
    }
    setLoading(false);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);
    setUploadProgress(30);

    const formData = new FormData();
    formData.append('file', selectedFile);

    const params = new URLSearchParams({
      title: form.title,
      category: form.category,
      uploadedBy: user?.id || '',
    });
    if (form.description) params.append('description', form.description);
    if (form.requiresAcknowledgement) params.append('requiresAcknowledgement', 'true');

    try {
      setUploadProgress(60);
      const res = await apiFetch(`/api/company-documents?${params.toString()}`, {
        method: 'POST',
        body: formData,
        headers: {},
      });
      setUploadProgress(100);
      if (!res.ok) throw new Error('Upload failed');
      toast('Document uploaded', 'success');
      setShowUpload(false);
      setSelectedFile(null);
      setForm({ title: '', description: '', category: 'POLICY', requiresAcknowledgement: false });
      loadDocuments();
    } catch {
      toast('Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (doc: CompanyDocument) => {
    const endpoint = doc.isPublished ? 'unpublish' : 'publish';
    const res = await apiFetch(`/api/company-documents/${doc.id}/${endpoint}`, { method: 'PUT' });
    if (res.ok) {
      toast(`Document ${doc.isPublished ? 'unpublished' : 'published'}`, 'success');
      loadDocuments();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await apiFetch(`/api/company-documents/${deleteId}`, { method: 'DELETE' });
    if (res.ok) {
      toast('Document deleted', 'success');
      setDeleteId(null);
      loadDocuments();
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  /* ---------- Derived stats ---------- */
  const stats = useMemo(() => {
    const total = documents.length;
    const published = documents.filter(d => d.isPublished).length;
    const drafts = documents.filter(d => !d.isPublished).length;
    const docsWithAck = documents.filter(d => d.requiresAcknowledgement);
    const totalAck = docsWithAck.reduce((sum, d) => sum + (ackStatus[d.id]?.acknowledgedCount ?? 0), 0);
    const ackRate = docsWithAck.length > 0 ? Math.round((totalAck / Math.max(docsWithAck.length, 1)) * 100) / 100 : 0;
    return { total, published, drafts, ackRate: docsWithAck.length > 0 ? `${totalAck}` : '0' };
  }, [documents, ackStatus]);

  /* ---------- Filtered documents ---------- */
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      if (activeCategory !== 'ALL' && doc.category !== activeCategory) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (
          !doc.title.toLowerCase().includes(term) &&
          !doc.filename.toLowerCase().includes(term) &&
          !doc.category.toLowerCase().includes(term)
        ) return false;
      }
      return true;
    });
  }, [documents, activeCategory, searchTerm]);

  return (
    <FeatureGate feature="COMPANY_DOCUMENTS">
      <PageWrapper
        title="Company Documents"
        subtitle="Manage organisation-wide policies, procedures, and compliance documents"
        actions={
          <button onClick={() => setShowUpload(true)} className="btn-cta inline-flex items-center gap-2">
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload Document
          </button>
        }
      >
        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-6">
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 pb-0">
                <h2 className="text-xl font-bold text-foreground">Upload Document</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all"
                >
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
                />
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                    Document Title <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Leave Policy 2026"
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                    Category <span className="text-error">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.8125rem] font-semibold text-foreground mb-1.5">
                    Description <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Brief description of the document..."
                    className="w-full px-3.5 py-2.5 border border-border rounded-control text-sm bg-card text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors resize-y min-h-[80px]"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresAcknowledgement}
                    onChange={e => setForm({ ...form, requiresAcknowledgement: e.target.checked })}
                    className="rounded border-border"
                  />
                  Requires employee acknowledgement
                </label>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-button hover:bg-surface-navy hover:text-primary hover:border-primary transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="btn-cta inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Document"
          message="Are you sure you want to delete this document?"
          confirmLabel="Delete"
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />

        {loading ? (
          /* ===== Skeleton Loading State ===== */
          <div className="space-y-6">
            {/* Skeleton Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="enterprise-card flex items-center gap-4 p-5">
                  <div className="w-12 h-12 rounded-card bg-border animate-pulse" />
                  <div className="flex-1">
                    <div className="h-6 w-14 bg-border rounded animate-pulse mb-2" />
                    <div className="h-3 w-24 bg-border rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton Filter */}
            <div className="enterprise-card p-4">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-8 rounded-button bg-border animate-pulse" style={{ width: `${60 + i * 10}px` }} />
                ))}
                <div className="ml-auto h-9 w-48 rounded-control bg-border animate-pulse" />
              </div>
            </div>
            {/* Skeleton Table */}
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          </div>
        ) : documents.length === 0 ? (
          <EmptyState icon={DocumentTextIcon} title="No Company Documents" description="Upload your first company document to get started." />
        ) : (
          <div className="space-y-6">
            {/* ===== Stats Bar ===== */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="enterprise-card flex items-center gap-4 p-5 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-navy text-accent-navy">
                  <DocumentTextIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-none text-foreground">{stats.total}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Documents</p>
                </div>
              </div>
              <div className="enterprise-card flex items-center gap-4 p-5 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-teal text-accent-teal">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-none text-foreground">{stats.published}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Published</p>
                </div>
              </div>
              <div className="enterprise-card flex items-center gap-4 p-5 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-gold text-accent-gold">
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-none text-foreground">{stats.drafts}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Drafts</p>
                </div>
              </div>
              <div className="enterprise-card flex items-center gap-4 p-5 hover:-translate-y-px transition-transform">
                <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-pink text-accent-pink">
                  <ClipboardDocumentCheckIcon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold leading-none text-foreground">{stats.ackRate}</p>
                  <p className="text-[0.8125rem] text-muted-foreground mt-1">Acknowledged</p>
                </div>
              </div>
            </div>

            {/* ===== Filter Bar ===== */}
            <div className="enterprise-card p-4 sm:p-5">
              {/* Category tabs */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1.5 flex-wrap flex-1">
                  <button
                    onClick={() => setActiveCategory('ALL')}
                    className={`px-3.5 py-1.5 rounded-button text-xs font-semibold border transition-all ${
                      activeCategory === 'ALL'
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary hover:bg-surface-navy'
                    }`}
                  >
                    All
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-button text-xs font-semibold border transition-all ${
                        activeCategory === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary hover:bg-surface-navy'
                      }`}
                    >
                      {cat.charAt(0) + cat.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
              {/* Search */}
              <div className="mt-3 flex items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Search documents..."
                    className="w-full pl-9 pr-3 py-2 rounded-control border border-border text-[0.8125rem] text-foreground bg-card placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* ===== Documents Table ===== */}
            {filteredDocuments.length === 0 ? (
              <EmptyState
                icon={DocumentTextIcon}
                title="No matching documents"
                description="Try adjusting your filters or search terms."
              />
            ) : (
              <div className="enterprise-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-surface-navy border-b-2 border-border">
                        <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap" style={{ width: '30%' }}>
                          Document Name
                        </th>
                        <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Category
                        </th>
                        <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Version
                        </th>
                        <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Acknowledgments
                        </th>
                        <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc, idx) => (
                        <tr
                          key={doc.id}
                          className={`border-b border-border transition-colors hover:bg-surface-navy ${
                            idx % 2 === 1 ? 'bg-muted/30' : ''
                          }`}
                        >
                          {/* Document Name */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-control flex items-center justify-center flex-shrink-0 ${getFileTypeStyle(doc.filename)}`}>
                                <DocumentTextIcon className="w-[18px] h-[18px]" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[0.8125rem] font-semibold text-foreground truncate">{doc.title}</p>
                                <p className="text-[0.6875rem] text-muted-foreground mt-0.5 truncate">{doc.filename}</p>
                              </div>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wide ${
                              CATEGORY_BADGE_STYLES[doc.category] || 'bg-surface-navy text-accent-navy'
                            }`}>
                              {doc.category?.charAt(0) + doc.category?.slice(1).toLowerCase()}
                            </span>
                          </td>

                          {/* Version Badge */}
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-button text-[0.6875rem] font-bold bg-surface-navy text-primary font-mono">
                              v{doc.version}
                            </span>
                          </td>

                          {/* Published Toggle */}
                          <td className="px-4 py-3">
                            <button
                              onClick={() => togglePublish(doc)}
                              className="group inline-flex items-center gap-2"
                            >
                              <span
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                  doc.isPublished ? 'bg-success' : 'bg-border'
                                }`}
                              >
                                <span
                                  className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-transform ${
                                    doc.isPublished ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </span>
                              <span className={`text-[0.6875rem] font-semibold ${
                                doc.isPublished ? 'text-success' : 'text-muted-foreground'
                              }`}>
                                {doc.isPublished ? 'Published' : 'Draft'}
                              </span>
                            </button>
                          </td>

                          {/* Acknowledgments */}
                          <td className="px-4 py-3">
                            {doc.requiresAcknowledgement ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[0.8125rem] font-semibold text-foreground">
                                  {ackStatus[doc.id]?.acknowledgedCount ?? 0}
                                </span>
                                <div className="w-12 h-1.5 bg-border rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-accent-teal rounded-full transition-all duration-300"
                                    style={{
                                      width: `${Math.min(100, (ackStatus[doc.id]?.acknowledgedCount ?? 0) * 10)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-[0.8125rem] text-muted-foreground">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {doc.fileUrl && (
                                <a
                                  href={doc.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all"
                                  title="View"
                                >
                                  <EyeIcon className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => setDeleteId(doc.id)}
                                className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-all"
                                title="Delete"
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
            )}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
