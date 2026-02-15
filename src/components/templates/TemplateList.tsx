'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { JobAdTemplate, TemplateFilters } from '../../types/jobTemplate';
import { jobTemplateService } from '../../services/jobTemplateService';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

interface TemplateListProps {
  onEdit?: (template: JobAdTemplate) => void;
  onView?: (template: JobAdTemplate) => void;
  onGenerate?: (template: JobAdTemplate) => void;
  onCreateNew?: () => void;
  className?: string;
}

const TemplateList: React.FC<TemplateListProps> = ({
  onEdit,
  onView,
  onGenerate,
  onCreateNew,
  className = ''
}) => {
  const [templates, setTemplates] = useState<JobAdTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TemplateFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await jobTemplateService.getAllTemplates(filters);
      setTemplates(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  };

  const handleFilterChange = (key: keyof TemplateFilters, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleArchive = async (template: JobAdTemplate) => {
    try {
      if (template.isArchived) {
        await jobTemplateService.unarchiveTemplate(template.id);
      } else {
        await jobTemplateService.archiveTemplate(template.id);
      }
      await fetchTemplates();
    } catch (err) {
      setError('Failed to update template status');
    }
  };

  const handleDelete = async (template: JobAdTemplate) => {
    if (window.confirm(`Are you sure you want to permanently delete "${template.name}"? This action cannot be undone.`)) {
      try {
        await jobTemplateService.deleteTemplate(template.id);
        await fetchTemplates();
      } catch (err) {
        setError('Failed to delete template');
      }
    }
  };

  const handleDuplicate = async (template: JobAdTemplate) => {
    const newName = prompt(`Enter name for duplicated template:`, `${template.name} (Copy)`);
    if (newName) {
      try {
        await jobTemplateService.duplicateTemplate(template.id, newName);
        await fetchTemplates();
      } catch (err) {
        setError('Failed to duplicate template');
      }
    }
  };

  const toggleSelectTemplate = (templateId: string) => {
    const newSelected = new Set(selectedTemplates);
    if (newSelected.has(templateId)) {
      newSelected.delete(templateId);
    } else {
      newSelected.add(templateId);
    }
    setSelectedTemplates(newSelected);
  };

  const handleBulkAction = async (action: 'archive' | 'unarchive' | 'delete') => {
    if (selectedTemplates.size === 0) return;

    const confirmed = action === 'delete' 
      ? window.confirm(`Are you sure you want to delete ${selectedTemplates.size} template(s)? This action cannot be undone.`)
      : window.confirm(`Are you sure you want to ${action} ${selectedTemplates.size} template(s)?`);

    if (!confirmed) return;

    try {
      for (const templateId of selectedTemplates) {
        switch (action) {
          case 'archive':
            await jobTemplateService.archiveTemplate(templateId);
            break;
          case 'unarchive':
            await jobTemplateService.unarchiveTemplate(templateId);
            break;
          case 'delete':
            await jobTemplateService.deleteTemplate(templateId);
            break;
        }
      }
      setSelectedTemplates(new Set());
      await fetchTemplates();
    } catch (err) {
      setError(`Failed to ${action} templates`);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTemplateTypeColor = (employmentType: string) => {
    const colors: Record<string, string> = {
      'Full-time': 'bg-green-100 text-green-800',
      'Part-time': 'bg-violet-100 text-violet-800',
      'Contract': 'bg-purple-100 text-purple-800',
      'Internship': 'bg-orange-100 text-orange-800',
      'Remote': 'bg-gray-100 text-gray-800'
    };
    return colors[employmentType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-gray-500">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Job Ad Templates</h2>
          <p className="text-gray-600 mt-1">Create and manage reusable job posting templates</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Employment Type
                  </label>
                  <select
                    value={filters.employmentType || ''}
                    onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  >
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by location..."
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showArchived || false}
                      onChange={(e) => handleFilterChange('showArchived', e.target.checked)}
                      className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
                    />
                    <span className="ml-2 text-sm text-gray-700">Show archived</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.size > 0 && (
          <div className="p-4 bg-violet-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-800">
                {selectedTemplates.size} template(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('unarchive')}
                  className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Unarchive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">No templates found</div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow border ${
                template.isArchived ? 'opacity-60 border-gray-300' : 'border-gray-200 hover:shadow-md'
              } transition-shadow`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.has(template.id)}
                        onChange={() => toggleSelectTemplate(template.id)}
                        className="mr-3 rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
                      />
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {template.name}
                      </h3>
                      {template.isArchived && (
                        <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Archived
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Usage Count:</span>
                    <span className="font-medium">{template.usageCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Employment Type:</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getTemplateTypeColor(template.employmentType)}`}>
                      {template.employmentType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Location:</span>
                    <span className="font-medium truncate ml-2">{template.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Created:</span>
                    <span className="font-medium">{formatDate(template.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Updated:</span>
                    <span className="font-medium">{formatDate(template.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onView?.(template)}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => onEdit?.(template)}
                      className="p-2 text-gray-400 hover:text-violet-600 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleArchive(template)}
                      className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                      title={template.isArchived ? "Unarchive" : "Archive"}
                    >
                      {template.isArchived ? (
                        <ArchiveBoxXMarkIcon className="w-4 h-4" />
                      ) : (
                        <ArchiveBoxIcon className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(template)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {!template.isArchived && (
                    <button
                      onClick={() => onGenerate?.(template)}
                      className="px-3 py-1 text-sm bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                    >
                      Generate Ad
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateList;