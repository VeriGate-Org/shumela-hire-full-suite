import React, { useState, useMemo, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowDownTrayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { RecruitmentBarChart, RecruitmentLineChart, RecruitmentPieChart } from '../charts';
import DashboardWidget from './DashboardWidget';

interface DataPoint {
  [key: string]: any;
}

interface Column {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'percentage' | 'currency';
  sortable?: boolean;
  filterable?: boolean;
}

interface SavedView {
  id: string;
  name: string;
  filters: Record<string, any>;
  sort: { key: string; direction: 'asc' | 'desc' } | null;
  pageSize: number;
  searchTerm: string;
}

interface DataExplorerProps {
  data: DataPoint[];
  columns: Column[];
  title: string;
  subtitle?: string;
  defaultView?: 'table' | 'chart';
  exportable?: boolean;
  className?: string;
  tableId?: string;
}

const DataExplorer: React.FC<DataExplorerProps> = ({
  data,
  columns,
  title,
  subtitle,
  defaultView = 'table',
  exportable = true,
  className = '',
  tableId,
}) => {
  const [view, setView] = useState<'table' | 'chart'>(defaultView);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedColumns, setSelectedColumns] = useState<{ x: string; y: string }>({
    x: columns.find(c => c.type === 'string')?.key || columns[0]?.key || '',
    y: columns.find(c => c.type === 'number')?.key || columns[1]?.key || '',
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showSavePopover, setShowSavePopover] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  // Saved views persistence
  const storageKey = `talentgate-saved-views-${tableId || 'default'}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setSavedViews(JSON.parse(stored));
    } catch {}
  }, [storageKey]);

  const persistViews = (views: SavedView[]) => {
    setSavedViews(views);
    localStorage.setItem(storageKey, JSON.stringify(views));
  };

  const handleSaveView = () => {
    if (!newViewName.trim()) return;
    const view: SavedView = {
      id: Date.now().toString(),
      name: newViewName.trim(),
      filters,
      sort: sortConfig,
      pageSize,
      searchTerm,
    };
    persistViews([...savedViews, view]);
    setNewViewName('');
    setShowSavePopover(false);
  };

  const handleApplyView = (view: SavedView) => {
    setFilters(view.filters);
    setSortConfig(view.sort);
    setPageSize(view.pageSize);
    setSearchTerm(view.searchTerm);
    setCurrentPage(1);
  };

  const handleDeleteView = (viewId: string) => {
    persistViews(savedViews.filter(v => v.id !== viewId));
  };

  // Data processing
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        filtered = filtered.filter(row => {
          const rowValue = row[key];
          if (typeof value === 'string') {
            return String(rowValue).toLowerCase().includes(value.toLowerCase());
          }
          return rowValue === value;
        });
      }
    });

    // Apply sorting
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, filters, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const totalPages = Math.ceil(processedData.length / pageSize);

  const handleSort = (columnKey: string) => {
    setSortConfig(current => {
      if (current?.key === columnKey) {
        return current.direction === 'asc'
          ? { key: columnKey, direction: 'desc' }
          : null;
      }
      return { key: columnKey, direction: 'asc' };
    });
  };

  const formatValue = (value: any, type: Column['type']) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'percentage':
        return `${Number(value).toFixed(1)}%`;
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  };

  const exportData = () => {
    const csvContent = [
      columns.map(col => col.label).join(','),
      ...processedData.map(row =>
        columns.map(col => `"${formatValue(row[col.key], col.type)}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '_').toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderChart = () => {
    const chartData = processedData.slice(0, 50); // Limit for performance
    
    switch (chartType) {
      case 'line':
        return (
          <RecruitmentLineChart
            data={chartData}
            xKey={selectedColumns.x}
            yKey={selectedColumns.y}
            height={300}
          />
        );
      case 'pie':
        return (
          <RecruitmentPieChart
            data={chartData}
            dataKey={selectedColumns.y}
            nameKey={selectedColumns.x}
            height={300}
          />
        );
      default:
        return (
          <RecruitmentBarChart
            data={chartData}
            xKey={selectedColumns.x}
            yKey={selectedColumns.y}
            height={300}
          />
        );
    }
  };

  return (
    <DashboardWidget
      id={`data-explorer-${title.toLowerCase().replace(/\s+/g, '-')}`}
      title={title}
      subtitle={subtitle}
      className={className}
      refreshable={false}
      configurable={true}
      size="large"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('table')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TableCellsIcon className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setView('chart')}
                className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium transition-colors ${
                  view === 'chart'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ChartBarIcon className="w-4 h-4" />
                Chart
              </button>
            </div>

            {/* Chart Type Selection (when in chart view) */}
            {view === 'chart' && (
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Line Chart</option>
                <option value="pie">Pie Chart</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-transparent"
              />
            </div>

            {/* Saved Views */}
            <div className="relative flex items-center gap-2">
              {savedViews.length > 0 && (
                <div className="relative">
                  <select
                    onChange={(e) => {
                      const view = savedViews.find(v => v.id === e.target.value);
                      if (view) handleApplyView(view);
                      e.target.value = '';
                    }}
                    defaultValue=""
                    className="text-sm border border-gray-300 rounded-md px-2 py-1.5 pr-8 bg-white"
                  >
                    <option value="" disabled>Saved Views ({savedViews.length})</option>
                    {savedViews.map(view => (
                      <option key={view.id} value={view.id}>{view.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowSavePopover(!showSavePopover)}
                  className="text-sm px-3 py-1.5 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Save View
                </button>

                {showSavePopover && (
                  <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 w-64">
                    <input
                      type="text"
                      value={newViewName}
                      onChange={(e) => setNewViewName(e.target.value)}
                      placeholder="View name..."
                      className="w-full text-sm p-2 border border-gray-300 rounded-md mb-2"
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveView()}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowSavePopover(false)}
                        className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveView}
                        disabled={!newViewName.trim()}
                        className="text-xs px-3 py-1 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Export Button */}
            {exportable && (
              <button
                onClick={exportData}
                className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Saved View Tags */}
        {savedViews.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {savedViews.map(view => (
              <span key={view.id} className="inline-flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md">
                <button onClick={() => handleApplyView(view)} className="hover:underline">
                  {view.name}
                </button>
                <button
                  onClick={() => handleDeleteView(view.id)}
                  className="text-violet-400 hover:text-violet-600 ml-1"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Chart Column Selection */}
        {view === 'chart' && (
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">X-Axis</label>
              <select
                value={selectedColumns.x}
                onChange={(e) => setSelectedColumns(prev => ({ ...prev, x: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {columns.map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Y-Axis</label>
              <select
                value={selectedColumns.y}
                onChange={(e) => setSelectedColumns(prev => ({ ...prev, y: e.target.value }))}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {columns.filter(col => col.type === 'number' || col.type === 'percentage' || col.type === 'currency').map(col => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Data Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
          <span>
            Showing {processedData.length.toLocaleString()} of {data.length.toLocaleString()} records
            {searchTerm && ` (filtered)`}
          </span>
          {view === 'table' && (
            <div className="flex items-center gap-2">
              <span>Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {view === 'table' ? (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((column) => (
                        <th
                          key={column.key}
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                          }`}
                          onClick={column.sortable !== false ? () => handleSort(column.key) : undefined}
                        >
                          <div className="flex items-center gap-1">
                            <span>{column.label}</span>
                            {sortConfig?.key === column.key && (
                              <span className="text-violet-600">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {columns.map((column) => (
                          <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatValue(row[column.key], column.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <p className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Chart View */
            <div className="p-4">
              {renderChart()}
            </div>
          )}
        </div>
      </div>
    </DashboardWidget>
  );
};

export default DataExplorer;
