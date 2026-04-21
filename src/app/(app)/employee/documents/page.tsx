'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import EmptyState from '@/components/EmptyState';
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';

interface EmployeeDocument {
  id: number;
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
}

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    filename: '',
    fileUrl: '',
    contentType: '',
  });

  const { user } = useAuth();
  const employeeId = user?.id ? parseInt(user.id, 10) : 0;
  const { toast } = useToast();

  useEffect(() => {
    loadDocuments();
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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await apiFetch(`/api/employee/documents?employeeId=${employeeId}`, {
        method: 'POST',
        body: JSON.stringify(uploadForm),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to upload document');
      }
      setShowUpload(false);
      setUploadForm({ title: '', description: '', filename: '', fileUrl: '', contentType: '' });
      loadDocuments();
    } catch (err: any) {
      toast(err.message || 'Failed to upload document', 'error');
    }
  };

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

  return (
    <FeatureGate feature="EMPLOYEE_DOCUMENTS">
      <PageWrapper
        title="My Documents"
        subtitle="View and manage your employee documents"
        actions={
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="btn-cta inline-flex items-center gap-2"
          >
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload Document
          </button>
        }
      >
        <div className="space-y-6">
          {/* Upload Form */}
          {showUpload && (
            <form onSubmit={handleUpload} className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Upload New Document</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Document Title *</label>
                  <input type="text" required value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Filename *</label>
                  <input type="text" required value={uploadForm.filename}
                    onChange={e => setUploadForm({ ...uploadForm, filename: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="document.pdf" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">File URL *</label>
                  <input type="url" required value={uploadForm.fileUrl}
                    onChange={e => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
                  <textarea rows={2} value={uploadForm.description}
                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-sm text-muted-foreground border rounded-lg hover:bg-muted">Cancel</button>
                <button type="submit"
                  className="btn-cta">Upload</button>
              </div>
            </form>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : documents.length === 0 ? (
            <EmptyState icon={DocumentTextIcon} title="No Documents" description="No documents found. Upload your first document to get started." />
          ) : (
            <div className="enterprise-card overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Version</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Uploaded</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-foreground">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{doc.documentType?.replace('_', ' ') || '-'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">v{doc.version}</td>
                      <td className="px-4 py-3 text-sm">
                        {doc.expiryDate ? (
                          <span className={`flex items-center gap-1 ${isExpired(doc.expiryDate) ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {isExpired(doc.expiryDate) && <ExclamationTriangleIcon className="w-4 h-4" />}
                            {doc.expiryDate}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('en-ZA')}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800">
                            <EyeIcon className="w-4 h-4 inline" />
                          </a>
                        )}
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
