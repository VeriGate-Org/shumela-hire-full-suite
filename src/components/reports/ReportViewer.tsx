'use client';

import React, { useState, useCallback } from 'react';
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  ShareIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { ReportConfig } from './ReportBuilder';
import EmptyState from '@/components/EmptyState';
import { formatEnumValue } from '@/utils/enumLabels';

export interface ReportResult {
  id: string;
  config: ReportConfig;
  data: any[];
  generatedAt: string;
  executionTime: number;
  rowCount: number;
  error?: string;
}

interface ReportViewerProps {
  result: ReportResult;
  onExport: (format: 'csv' | 'pdf' | 'xlsx') => void;
  onShare: () => void;
  onEdit: () => void;
  className?: string;
}

export default function ReportViewer({
  result,
  onExport,
  onShare,
  onEdit,
  className = '',
}: ReportViewerProps) {
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return result.data.slice(startIndex, startIndex + pageSize);
  }, [result.data, currentPage, pageSize]);

  const totalPages = Math.ceil(result.data.length / pageSize);

  const formatValue = useCallback((value: any, type?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'ZAR',
        }).format(value);
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  }, []);

  const getColumnType = useCallback((key: string, value: any) => {
    if (typeof value === 'number') {
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')) {
        return 'percentage';
      }
      if (key.toLowerCase().includes('cost') || key.toLowerCase().includes('salary')) {
        return 'currency';
      }
      return 'number';
    }
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return 'date';
    }
    return 'string';
  }, []);

  const renderTableView = () => {
    if (!result.data.length) {
      return (
        <EmptyState
          icon={DocumentTextIcon}
          title="No data available"
          description="The report query returned no results. Try adjusting your filters."
        />
      );
    }

    const columns = Object.keys(result.data[0] || {});

    return (
      <div className="space-y-4">
        {/* Table Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Rows per page:</label>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, result.data.length)} of {result.data.length} results
            </div>
          </div>
          
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-gray-200 rounded-control">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {formatEnumValue(column)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-gray-200">
                {paginatedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {columns.map((column) => {
                      const value = row[column];
                      const type = getColumnType(column, value);
                      
                      return (
                        <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatValue(value, type)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
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
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm font-medium rounded-full ${
                      currentPage === pageNum
                        ? 'bg-gold-500 text-violet-950'
                        : 'text-gray-700 bg-card border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };


  if (result.error) {
    return (
      <div className={`bg-card rounded-control shadow-sm border border-error ${className}`}>
        {/* One statement of what went wrong, not two. The header said "Report Generation Failed"
            and the body said "Error generating report" directly beneath it, which pushed the only
            useful line — the reason — down the card. The reason is the heading now. */}
        <div className="px-6 py-4 border-b border-error bg-error-bg">
          <h2 className="text-sm font-bold uppercase tracking-wider text-error-on-tint">
            {result.config.name || 'This report'} did not run
          </h2>
        </div>
        <div className="p-6">
          <p className="text-base font-medium text-foreground">{result.error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing was produced, so there are no rows to show. Change the subject, the columns or
            the period and run it again.
          </p>
          <button
            onClick={onEdit}
            className="mt-5 rounded-full bg-cta px-[18px] py-2.5 text-xs font-extrabold uppercase tracking-[0.07em] text-cta-foreground transition-colors hover:bg-cta-hover"
          >
            Back to the builder
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-card rounded-control shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{result.config.name}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span>Generated: {new Date(result.generatedAt).toLocaleString()}</span>
              <span>•</span>
              <span>{result.rowCount.toLocaleString()} rows</span>
              <span>•</span>
              <span>{result.executionTime}ms</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <button className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border border-gray-300 rounded-full hover:bg-gray-50">
                <ArrowDownTrayIcon className="h-4 w-4 inline mr-1" />
                Export
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-card rounded-control shadow-lg border border-gray-200 hidden group-hover:block">
                <div className="py-1">
                  <button
                    onClick={() => onExport('csv')}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Export as CSV
                  </button>
                  <button
                    onClick={() => onExport('xlsx')}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => onExport('pdf')}
                    className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => window.print()}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border border-gray-300 rounded-full hover:bg-gray-50"
            >
              <PrinterIcon className="h-4 w-4 inline mr-1" />
              Print
            </button>
            
            <button
              onClick={onShare}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-card border border-gray-300 rounded-full hover:bg-gray-50"
            >
              <ShareIcon className="h-4 w-4 inline mr-1" />
              Share
            </button>
            
            <button
              onClick={onEdit}
              className="px-3 py-2 text-sm font-medium text-white bg-violet-600 rounded-full hover:bg-gold-600"
            >
              <Cog6ToothIcon className="h-4 w-4 inline mr-1" />
              Edit
            </button>
          </div>
        </div>
        
        {result.config.description && (
          <p className="text-sm text-gray-600 mt-2">{result.config.description}</p>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {renderTableView()}
      </div>
    </div>
  );
}
