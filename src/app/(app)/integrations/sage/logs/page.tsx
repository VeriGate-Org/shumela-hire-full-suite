'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SageSyncLogTable from '@/components/integrations/SageSyncLogTable';
import {
  sageIntegrationService,
  SageSyncLog,
} from '@/services/sageIntegrationService';
import {
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

export default function SageLogsPage() {
  const [logs, setLogs] = useState<SageSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize] = useState(20);
  const { toast } = useToast();

  useEffect(() => {
    loadLogs(0);
  }, []);

  const loadLogs = async (page: number) => {
    setLoading(true);
    try {
      const data = await sageIntegrationService.getLogs(page, pageSize);
      setLogs(data.content);
      setCurrentPage(data.number);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      toast('Failed to load sync logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 0 && page < totalPages) {
      loadLogs(page);
    }
  };

  const actions = (
    <button
      onClick={() => loadLogs(currentPage)}
      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider transition-colors"
    >
      <ArrowPathIcon className="w-4 h-4 mr-2" />
      Refresh
    </button>
  );

  return (
    <FeatureGate feature="SAGE_300_PEOPLE">
      <PageWrapper
        title="Sync Logs"
        subtitle="View history and status of data synchronization operations"
        actions={actions}
      >
        <div className="space-y-4">
          {/* Summary */}
          {!loading && totalElements > 0 && (
            <div className="text-sm text-gray-600">
              Showing {logs.length} of {totalElements.toLocaleString()} sync log entries
            </div>
          )}

          {/* Log Table */}
          <SageSyncLogTable logs={logs} loading={loading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-sm shadow px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages} ({totalElements.toLocaleString()} total)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    currentPage === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i;
                  } else if (currentPage < 3) {
                    pageNum = i;
                  } else if (currentPage > totalPages - 4) {
                    pageNum = totalPages - 5 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-10 h-10 text-sm font-medium rounded-full transition-colors ${
                        pageNum === currentPage
                          ? 'bg-gold-500 text-violet-950'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    currentPage >= totalPages - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
