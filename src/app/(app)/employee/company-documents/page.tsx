'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import EmptyState from '@/components/EmptyState';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
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
  createdAt: string;
  publishedAt: string | null;
}

const CATEGORY_ORDER = ['POLICY', 'HANDBOOK', 'PROCEDURE', 'FORM', 'TEMPLATE', 'ANNOUNCEMENT'];

export default function EmployeeCompanyDocumentsPage() {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || '';
  const { toast } = useToast();

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const res = await apiFetch('/api/company-documents');
    if (res.ok) {
      const data = await res.json();
      setDocuments(data);
    }
    setLoading(false);
  };

  const handleDownload = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/company-documents/${docId}/download?requestingUserId=${employeeId}`);
      if (!res.ok) throw new Error('Download failed');
      const data = await res.json();
      window.open(data.downloadUrl, '_blank');
    } catch {
      toast('Failed to download document', 'error');
    }
  };

  const handleAcknowledge = async (docId: string) => {
    try {
      const res = await apiFetch(`/api/company-documents/${docId}/acknowledge?employeeId=${employeeId}`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to acknowledge');
      }
      setAcknowledged(prev => new Set(prev).add(docId));
      toast('Document acknowledged', 'success');
    } catch (err: any) {
      toast(err.message || 'Failed to acknowledge', 'error');
    }
  };

  const grouped = useMemo(() => {
    const filtered = filterCategory === 'ALL' ? documents : documents.filter(d => d.category === filterCategory);
    const groups: Record<string, CompanyDocument[]> = {};
    for (const doc of filtered) {
      const cat = doc.category || 'OTHER';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    }
    return Object.entries(groups).sort(
      ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
    );
  }, [documents, filterCategory]);

  const categories = useMemo(() => {
    return [...new Set(documents.map(d => d.category))];
  }, [documents]);

  return (
    <FeatureGate feature="COMPANY_DOCUMENTS">
      <PageWrapper
        title="Company Documents"
        subtitle="Access company policies, handbooks, and shared documents"
      >
        {/* Category filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`px-3 py-1.5 text-sm rounded-lg border ${filterCategory === 'ALL' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-border text-muted-foreground hover:bg-muted'}`}>
            All
          </button>
          {categories.map(cat => (
            <button key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-sm rounded-lg border ${filterCategory === cat ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-border text-muted-foreground hover:bg-muted'}`}>
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="enterprise-card p-6"><TableSkeleton /></div>
        ) : documents.length === 0 ? (
          <EmptyState icon={DocumentTextIcon} title="No Documents" description="No company documents are available at this time." />
        ) : (
          <div className="space-y-6">
            {grouped.map(([category, docs]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {category.charAt(0) + category.slice(1).toLowerCase()}
                </h3>
                <div className="enterprise-card divide-y divide-border">
                  {docs.map(doc => (
                    <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted">
                      <div className="flex items-center gap-3">
                        <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{doc.title}</p>
                          {doc.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">v{doc.version} &middot; {doc.filename}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleDownload(doc.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                          <ArrowDownTrayIcon className="w-4 h-4" /> Download
                        </button>
                        {doc.requiresAcknowledgement && !acknowledged.has(doc.id) && (
                          <button onClick={() => handleAcknowledge(doc.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-green-50 rounded-lg hover:bg-green-100">
                            <CheckCircleIcon className="w-4 h-4" /> Acknowledge
                          </button>
                        )}
                        {acknowledged.has(doc.id) && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <CheckCircleIcon className="w-4 h-4" /> Acknowledged
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
