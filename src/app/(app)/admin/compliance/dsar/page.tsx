'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService, DataSubjectRequest } from '@/services/complianceService';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export default function DsarPage() {
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadRequests();
  }, [filter, page]);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await complianceService.getAllDsars(filter, page, 20);
      setRequests(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load DSARs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(id: number, status: string) {
    try {
      await complianceService.updateDsarStatus(id, status);
      loadRequests();
    } catch (error: any) {
      alert(error.message || 'Failed to update status');
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      ACCESS: 'bg-blue-100 text-blue-800',
      RECTIFICATION: 'bg-yellow-100 text-yellow-800',
      ERASURE: 'bg-red-100 text-red-800',
      PORTABILITY: 'bg-purple-100 text-purple-800',
      OBJECTION: 'bg-orange-100 text-orange-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <FeatureGate feature="POPIA_COMPLIANCE">
      <PageWrapper title="Data Subject Access Requests" subtitle="Manage POPIA data subject requests">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[undefined, 'RECEIVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map((f) => (
              <button key={f || 'all'} onClick={() => { setFilter(f); setPage(0); }}
                className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {f ? f.replace('_', ' ') : 'All'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data subject requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <div key={req.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{req.requesterName}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${typeBadge(req.requestType)}`}>{req.requestType}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(req.status)}`}>{req.status}</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{req.requesterEmail}</p>
                      {req.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{req.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                        <span>Created: {new Date(req.createdAt).toLocaleDateString()}</span>
                        {req.dueDate && <span>Due: {new Date(req.dueDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {req.status === 'RECEIVED' && (
                        <button onClick={() => handleStatusUpdate(req.id, 'IN_PROGRESS')}
                          className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200">
                          Start Processing
                        </button>
                      )}
                      {req.status === 'IN_PROGRESS' && (
                        <button onClick={() => handleStatusUpdate(req.id, 'COMPLETED')}
                          className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200">
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Previous</button>
                  <span className="px-3 py-1 text-sm">Page {page + 1} of {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
