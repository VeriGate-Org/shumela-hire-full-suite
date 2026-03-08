'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { apiFetch } from '@/lib/api-fetch';
import {
  DocumentTextIcon,
  ArrowUpTrayIcon,
  EyeIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

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

  // TODO: Get from auth context
  const employeeId = 1;

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
      alert(err.message);
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
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="My Documents"
        subtitle="View and manage your employee documents"
        actions={
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <ArrowUpTrayIcon className="w-4 h-4" /> Upload Document
          </button>
        }
      >
        <div className="space-y-6">
          {/* Upload Form */}
          {showUpload && (
            <form onSubmit={handleUpload} className="bg-white rounded-lg shadow border p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Upload New Document</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Document Title *</label>
                  <input type="text" required value={uploadForm.title}
                    onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Filename *</label>
                  <input type="text" required value={uploadForm.filename}
                    onChange={e => setUploadForm({ ...uploadForm, filename: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="document.pdf" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">File URL *</label>
                  <input type="url" required value={uploadForm.fileUrl}
                    onChange={e => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="https://..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={2} value={uploadForm.description}
                    onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowUpload(false)}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Upload</button>
              </div>
            </form>
          )}

          {/* Documents List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow border">
              <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No documents found. Upload your first document to get started.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Version</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map(doc => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <DocumentTextIcon className="w-4 h-4 text-blue-500" />
                          <div>
                            <p className="font-medium text-gray-900">{doc.title}</p>
                            <p className="text-xs text-gray-500">{doc.filename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{doc.documentType?.replace('_', ' ') || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatFileSize(doc.fileSize)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">v{doc.version}</td>
                      <td className="px-4 py-3 text-sm">
                        {doc.expiryDate ? (
                          <span className={`flex items-center gap-1 ${isExpired(doc.expiryDate) ? 'text-red-600' : 'text-gray-600'}`}>
                            {isExpired(doc.expiryDate) && <ExclamationTriangleIcon className="w-4 h-4" />}
                            {doc.expiryDate}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
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
