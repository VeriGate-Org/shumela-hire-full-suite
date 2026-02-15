'use client';

import React, { useState, useEffect } from 'react';
import {
  PlayIcon,
  PencilIcon,
  TrashIcon,
  ShareIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentDuplicateIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { ReportConfig } from './ReportBuilder';

export interface SavedReport extends ReportConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  isShared: boolean;
  lastRun?: string;
  runCount: number;
  tags: string[];
}

interface ReportLibraryProps {
  reports: SavedReport[];
  onRun: (report: SavedReport) => void;
  onEdit: (report: SavedReport) => void;
  onDelete: (reportId: string) => void;
  onDuplicate: (report: SavedReport) => void;
  onShare: (reportId: string) => void;
  onView: (report: SavedReport) => void;
  className?: string;
}

const REPORT_CATEGORIES = [
  { id: 'all', name: 'All Reports', count: 0 },
  { id: 'recruitment', name: 'Recruitment', count: 0 },
  { id: 'performance', name: 'Performance', count: 0 },
  { id: 'pipeline', name: 'Pipeline', count: 0 },
  { id: 'shared', name: 'Shared with Me', count: 0 },
  { id: 'scheduled', name: 'Scheduled', count: 0 },
];

export default function ReportLibrary({
  reports,
  onRun,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
  onView,
  className = '',
}: ReportLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'runs'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Calculate category counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = REPORT_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.id]: 0 }), {});
    
    reports.forEach(report => {
      counts.all++;
      
      // Categorize based on report content/fields
      if (report.fields.some(field => field.includes('candidate') || field.includes('application'))) {
        counts.recruitment++;
      }
      if (report.fields.some(field => field.includes('performance') || field.includes('metric'))) {
        counts.performance++;
      }
      if (report.fields.some(field => field.includes('pipeline') || field.includes('stage'))) {
        counts.pipeline++;
      }
      if (report.isShared) {
        counts.shared++;
      }
      if (report.schedule?.enabled) {
        counts.scheduled++;
      }
    });
    
    return counts;
  }, [reports]);

  // Filter and sort reports
  const filteredReports = React.useMemo(() => {
    let filtered = reports.filter(report => {
      // Category filter
      if (selectedCategory !== 'all') {
        switch (selectedCategory) {
          case 'recruitment':
            if (!report.fields.some(field => field.includes('candidate') || field.includes('application'))) return false;
            break;
          case 'performance':
            if (!report.fields.some(field => field.includes('performance') || field.includes('metric'))) return false;
            break;
          case 'pipeline':
            if (!report.fields.some(field => field.includes('pipeline') || field.includes('stage'))) return false;
            break;
          case 'shared':
            if (!report.isShared) return false;
            break;
          case 'scheduled':
            if (!report.schedule?.enabled) return false;
            break;
        }
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          report.name.toLowerCase().includes(query) ||
          report.description?.toLowerCase().includes(query) ||
          report.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }

      return true;
    });

    // Sort reports
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'created':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'updated':
          aVal = new Date(a.updatedAt).getTime();
          bVal = new Date(b.updatedAt).getTime();
          break;
        case 'runs':
          aVal = a.runCount;
          bVal = b.runCount;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return filtered;
  }, [reports, selectedCategory, searchQuery, sortBy, sortOrder]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'bar':
      case 'line':
      case 'pie':
      case 'funnel':
        return ChartBarIcon;
      default:
        return ChartBarIcon;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Report Library</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage your saved reports and templates
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            </div>
            
            {/* Sort */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as any);
                setSortOrder(order as any);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            >
              <option value="updated-desc">Recently Updated</option>
              <option value="created-desc">Recently Created</option>
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="runs-desc">Most Used</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Categories</h3>
            <nav className="space-y-1">
              {REPORT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                    selectedCategory === category.id
                      ? 'bg-violet-100 text-violet-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5">
                    {categoryCounts[category.id] || 0}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {filteredReports.length === 0 ? (
            <div className="p-12 text-center">
              <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery 
                  ? "Try adjusting your search terms or filters" 
                  : "Create your first report to get started"}
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredReports.map((report) => {
                  const VisualizationIcon = getVisualizationIcon(report.visualization.type);
                  
                  return (
                    <div
                      key={report.id}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      {/* Report Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <VisualizationIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {report.name}
                            </h4>
                            {report.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {report.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Status Indicators */}
                        <div className="flex items-center gap-1 ml-2">
                          {report.schedule?.enabled && (
                            <ClockIcon className="h-4 w-4 text-green-500" title="Scheduled" />
                          )}
                          {report.isShared && (
                            <ShareIcon className="h-4 w-4 text-violet-500" title="Shared" />
                          )}
                        </div>
                      </div>

                      {/* Report Stats */}
                      <div className="grid grid-cols-2 gap-4 mb-4 text-xs text-gray-500">
                        <div>
                          <div className="font-medium">Created</div>
                          <div>{formatDate(report.createdAt)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Runs</div>
                          <div>{report.runCount}</div>
                        </div>
                      </div>

                      {/* Tags */}
                      {report.tags.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {report.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                              >
                                {tag}
                              </span>
                            ))}
                            {report.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{report.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onView(report)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
                            title="View"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onEdit(report)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 rounded"
                            title="Edit"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDuplicate(report)}
                            className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onShare(report.id)}
                            className="p-1.5 text-gray-400 hover:text-violet-600 rounded"
                            title="Share"
                          >
                            <ShareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDelete(report.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => onRun(report)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
                        >
                          <PlayIcon className="h-3 w-3 inline mr-1" />
                          Run
                        </button>
                      </div>

                      {/* Last Run Info */}
                      {report.lastRun && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500">
                            Last run: {formatDate(report.lastRun)}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
