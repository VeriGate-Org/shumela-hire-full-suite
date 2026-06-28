'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AuditLogEntry } from '../types/workflow';
import { apiFetch } from '@/lib/api-fetch';
import ErrorState from '@/components/ErrorState';
import { TableSkeleton } from '@/components/LoadingComponents';

interface AuditLogViewerProps {
  requisitionId: string;
  className?: string;
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ requisitionId, className = '' }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/api/audit/entity/REQUISITION/${requisitionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const result = await response.json();
      setAuditLogs(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatAction = (action: string) => {
    return action
      .replace(/[_-]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDetails = (details: string | Record<string, unknown> | null) => {
    if (!details) return '-';

    // Backend stores details as a plain string
    if (typeof details === 'string') {
      return details || '-';
    }

    // Handle structured details (future-proofing)
    if (typeof details === 'object' && Object.keys(details).length === 0) {
      return '-';
    }

    return JSON.stringify(details);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('approve') || action.includes('created')) {
      return 'bg-green-100 text-green-800';
    }
    if (action.includes('reject')) {
      return 'bg-red-100 text-red-800';
    }
    if (action.includes('updated')) {
      return 'bg-gold-100 text-gold-800';
    }
    return 'bg-muted text-muted-foreground';
  };

  // Pagination logic
  const totalPages = Math.ceil(auditLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = auditLogs.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className={className}>
        <TableSkeleton rows={5} columns={6} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <ErrorState
          title="Failed to load audit logs"
          message={error}
          onRetry={fetchAuditLogs}
        />
      </div>
    );
  }

  if (auditLogs.length === 0) {
    return (
      <div className={`text-center p-8 text-muted-foreground ${className}`}>
        No audit logs found for this requisition.
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Entity Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Entity ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-accent">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">{log.userId}</div>
                    <div className="text-xs text-muted-foreground">{log.userRole}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {log.entityType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                    {log.entityId}
                  </td>
                  <td className="px-6 py-4 text-sm text-foreground max-w-xs">
                    <div className="truncate" title={formatDetails(log.details)}>
                      {formatDetails(log.details)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
                className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-control text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-control text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, auditLogs.length)}</span> of{' '}
                  <span className="font-medium">{auditLogs.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-control shadow-sm -space-x-px" aria-label="Audit log pagination">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Go to previous page"
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        aria-label={`Go to page ${pageNum}`}
                        aria-current={currentPage === pageNum ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-primary/10 border-primary text-primary'
                            : 'bg-card border-border text-muted-foreground hover:bg-accent'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Go to next page"
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-border bg-card text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogViewer;
