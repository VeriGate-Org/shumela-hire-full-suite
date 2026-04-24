'use client';

import { useState, useEffect } from 'react';
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

  return (
    <FeatureGate feature="COMPANY_DOCUMENTS">
      <PageWrapper
        title="Company Documents"
        subtitle="Manage company policies, handbooks, and shared documents"
        actions={
          <button onClick={() => setShowUpload(true)} className="btn-cta inline-flex items-center gap-2">
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload Document
          </button>
        }
      >
        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Company Document</h3>
                <button onClick={() => setShowUpload(false)} className="text-muted-foreground hover:text-foreground">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
                  <input type="text" required value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Category *</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                  <textarea rows={2} value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.requiresAcknowledgement}
                    onChange={e => setForm({ ...form, requiresAcknowledgement: e.target.checked })}
                    className="rounded border-border" />
                  Requires employee acknowledgement
                </label>
                <FileUploadDropzone
                  onFileSelect={setSelectedFile}
                  selectedFile={selectedFile}
                  onClear={() => setSelectedFile(null)}
                  uploading={uploading}
                  progress={uploadProgress}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowUpload(false)}
                    className="px-4 py-2 text-sm border rounded-lg hover:bg-muted">Cancel</button>
                  <button type="submit" disabled={uploading || !selectedFile}
                    className="btn-cta disabled:opacity-50">
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
          <div className="enterprise-card p-6"><TableSkeleton /></div>
        ) : documents.length === 0 ? (
          <EmptyState icon={DocumentTextIcon} title="No Company Documents" description="Upload your first company document to get started." />
        ) : (
          <div className="enterprise-card overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Version</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Published</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ack %</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {documents.map(doc => (
                  <tr key={doc.id} className="hover:bg-muted">
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium text-foreground">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.filename}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {doc.category?.charAt(0) + doc.category?.slice(1).toLowerCase()}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">v{doc.version}</td>
                    <td className="px-4 py-3 text-sm">
                      <button onClick={() => togglePublish(doc)}
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          doc.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {doc.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {doc.requiresAcknowledgement
                        ? (ackStatus[doc.id]?.acknowledgedCount ?? 0) + ' acknowledged'
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setDeleteId(doc.id)}
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
