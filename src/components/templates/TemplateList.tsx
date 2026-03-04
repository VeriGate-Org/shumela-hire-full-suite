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
    } catch {
      setError('Failed to fetch templates');
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
    } catch {
      setError('Failed to update template status');
    }
  };

  const handleDelete = async (template: JobAdTemplate) => {
    if (window.confirm(`Are you sure you want to permanently delete "${template.name}"? This action cannot be undone.`)) {
      try {
        await jobTemplateService.deleteTemplate(template.id);
        await fetchTemplates();
      } catch {
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
      } catch {
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
    } catch {
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
      'Part-time': 'bg-gold-100 text-gold-800',
      'Contract': 'bg-purple-100 text-purple-800',
      'Internship': 'bg-orange-100 text-orange-800',
      'Remote': 'bg-muted text-muted-foreground'
    };
    return colors[employmentType] || 'bg-muted text-muted-foreground';
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-muted-foreground">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-foreground">Job Ad Templates</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Create and manage reusable job posting templates</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground uppercase tracking-wider transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Template
        </button>
      </div>

      {/* Search and Filters */}
      <div className="border border-border rounded-card mb-5">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                value={filters.search || ''}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-control bg-background text-foreground text-sm focus:ring-2 focus:ring-cta/40 focus:border-primary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-3 py-2 border border-border rounded-control text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={filters.employmentType || ''}
                    onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                    className="w-full border border-border rounded-control px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-cta/40 focus:border-primary"
                  >
                    <option value="">All Types</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground uppercase tracking-[0.05em] mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by location..."
                    value={filters.location || ''}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="w-full border border-border rounded-control px-3 py-2 bg-background text-foreground text-sm focus:ring-2 focus:ring-cta/40 focus:border-primary"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.showArchived || false}
                      onChange={(e) => handleFilterChange('showArchived', e.target.checked)}
                      className="rounded-control border-border text-cta focus:ring-cta/40"
                    />
                    <span className="ml-2 text-sm text-foreground">Show archived</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedTemplates.size > 0 && (
          <div className="p-4 bg-cta/10 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">
                {selectedTemplates.size} template(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('archive')}
                  className="px-3 py-1 text-sm border border-border rounded-full text-muted-foreground hover:bg-accent transition-colors"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction('unarchive')}
                  className="px-3 py-1 text-sm border border-border rounded-full text-muted-foreground hover:bg-accent transition-colors"
                >
                  Unarchive
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 text-sm bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
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
        <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-card">
          <div className="text-red-800 text-sm">{error}</div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">No templates found</div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-4 py-2 border-2 border-cta text-sm font-medium rounded-full text-cta bg-transparent hover:bg-cta hover:text-foreground uppercase tracking-wider transition-colors"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Your First Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`rounded-card border ${
                template.isArchived ? 'opacity-60 border-border' : 'border-border hover:shadow-md'
              } transition-shadow bg-card`}
            >
              {/* Card Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTemplates.has(template.id)}
                        onChange={() => toggleSelectTemplate(template.id)}
                        className="mr-3 rounded-control border-border text-cta focus:ring-cta/40"
                      />
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {template.name}
                      </h3>
                      {template.isArchived && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          Archived
                        </span>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 pl-8">
                        {template.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Usage Count</span>
                    <span className="font-medium text-foreground">{template.usageCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Employment Type</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getTemplateTypeColor(template.employmentType)}`}>
                      {template.employmentType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-foreground truncate ml-2">{template.location}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium text-foreground">{formatDate(template.createdAt)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium text-foreground">{formatDate(template.updatedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onView?.(template)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-control hover:bg-accent"
                      title="Preview"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onEdit?.(template)}
                      className="p-1.5 text-muted-foreground hover:text-cta transition-colors rounded-control hover:bg-accent"
                      title="Edit"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-1.5 text-muted-foreground hover:text-green-600 transition-colors rounded-control hover:bg-accent"
                      title="Duplicate"
                    >
                      <DocumentDuplicateIcon className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleArchive(template)}
                      className="p-1.5 text-muted-foreground hover:text-orange-600 transition-colors rounded-control hover:bg-accent"
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
                      className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors rounded-control hover:bg-accent"
                      title="Delete"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {!template.isArchived && (
                    <button
                      onClick={() => onGenerate?.(template)}
                      className="px-3 py-1 text-xs border-2 border-cta text-cta rounded-full hover:bg-cta hover:text-foreground transition-colors font-medium uppercase tracking-wider"
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
