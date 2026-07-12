'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DocumentTemplate,
  DocumentTemplateType,
  DOCUMENT_TEMPLATE_TYPES,
} from '../../types/documentTemplate';
import { documentTemplateService } from '../../services/documentTemplateService';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import ErrorState from '@/components/ErrorState';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArchiveBoxXMarkIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  ClockIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface DocumentTemplateListProps {
  onEdit: (template: DocumentTemplate) => void;
  onCreateNew?: () => void;
  refreshKey?: number;
}

const DocumentTemplateList: React.FC<DocumentTemplateListProps> = ({ onEdit, onCreateNew, refreshKey }) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentTemplateType | ''>('');
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await documentTemplateService.getAllTemplates({
        search: search || undefined,
        type: typeFilter || undefined,
        showArchived,
      });
      setTemplates(results);
    } catch {
      setError('Failed to load templates');
      toast('Failed to load templates', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, showArchived, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates, refreshKey]);

  const handleDuplicate = async (t: DocumentTemplate) => {
    const result = await documentTemplateService.duplicateTemplate(t.id);
    if (result) {
      toast(`"${t.name}" duplicated`, 'success');
      fetchTemplates();
    } else {
      toast('Failed to duplicate', 'error');
    }
  };

  const handleSetDefault = async (t: DocumentTemplate) => {
    const result = await documentTemplateService.setDefault(t.id);
    if (result) {
      toast(`"${t.name}" set as default`, 'success');
      fetchTemplates();
    } else {
      toast('Failed to set default', 'error');
    }
  };

  const handleArchiveToggle = async (t: DocumentTemplate) => {
    const result = await documentTemplateService.updateTemplate(t.id, {
      isArchived: !t.isArchived,
    });
    if (result) {
      toast(`"${t.name}" ${t.isArchived ? 'unarchived' : 'archived'}`, 'success');
      fetchTemplates();
    } else {
      toast('Failed to update', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const success = await documentTemplateService.deleteTemplate(deleteTarget.id);
    if (success) {
      toast(`"${deleteTarget.name}" deleted`, 'success');
      fetchTemplates();
    } else {
      toast('Failed to delete', 'error');
    }
    setDeleteTarget(null);
  };

  /* Compute stats from the loaded data */
  const stats = useMemo(() => {
    const uniqueTypes = new Set(templates.map(t => t.type));
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentlyUpdated = templates.filter(t => new Date(t.updatedAt).getTime() > sevenDaysAgo).length;
    return {
      total: templates.length,
      categories: uniqueTypes.size,
      recentlyUpdated,
    };
  }, [templates]);

  const CATEGORY_BADGE_COLORS: Record<string, string> = {
    OFFER_LETTER: 'bg-surface-navy text-accent-navy',
    CONTRACT: 'bg-surface-teal text-accent-teal',
    REJECTION_EMAIL: 'bg-surface-pink text-accent-pink',
    WELCOME_EMAIL: 'bg-surface-teal text-accent-teal',
    NDA: 'bg-surface-gold text-accent-gold',
    PROBATION_LETTER: 'bg-surface-gold text-accent-gold',
    CONFIRMATION_LETTER: 'bg-surface-navy text-accent-navy',
  };

  /* Skeleton for stat cards */
  const StatCardSkeleton = () => (
    <div className="enterprise-card flex items-center gap-4 p-5 animate-pulse">
      <div className="w-12 h-12 rounded-xl loading-shimmer" />
      <div>
        <div className="h-5 w-10 loading-shimmer rounded mb-2" />
        <div className="h-3.5 w-24 loading-shimmer rounded" />
      </div>
    </div>
  );

  /* Skeleton for table */
  const TableSkeleton = () => (
    <div className="enterprise-card p-6 animate-pulse">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="h-5 w-36 loading-shimmer rounded mb-2" />
          <div className="h-3.5 w-52 loading-shimmer rounded" />
        </div>
        <div className="h-9 w-36 loading-shimmer rounded-full" />
      </div>
      <div className="h-11 w-full loading-shimmer rounded-t-control mb-px" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 w-full loading-shimmer mb-px" />
      ))}
      <div className="h-14 w-full loading-shimmer rounded-b-control" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="enterprise-card flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-navy text-accent-navy flex items-center justify-center shrink-0">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">{stats.total}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Total Templates</div>
            </div>
          </div>
          <div className="enterprise-card flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-teal text-accent-teal flex items-center justify-center shrink-0">
              <Squares2X2Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">{stats.categories}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Categories</div>
            </div>
          </div>
          <div className="enterprise-card flex items-center gap-4 p-5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-gold text-accent-gold flex items-center justify-center shrink-0">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">{stats.recentlyUpdated}</div>
              <div className="text-[0.8125rem] font-medium text-muted-foreground">Recently Updated</div>
            </div>
          </div>
        </div>
      )}

      {/* Template Table Card */}
      {loading ? (
        <TableSkeleton />
      ) : error && templates.length === 0 ? (
        <ErrorState
          title="Failed to load templates"
          message={error}
          onRetry={fetchTemplates}
        />
      ) : (
        <div className="enterprise-card p-6">
          {/* Card Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[1.0625rem] font-bold text-foreground">All Templates</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Manage your document templates</p>
            </div>
            {onCreateNew && (
              <button
                onClick={onCreateNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-primary text-white border-2 border-primary rounded-full hover:bg-primary/90 transition-all"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                New Template
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates..."
                aria-label="Search document templates"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-control bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as DocumentTemplateType | '')}
              aria-label="Filter by template type"
              className="px-3 py-2 text-sm border border-border rounded-control bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            >
              <option value="">All Types</option>
              {Object.entries(DOCUMENT_TEMPLATE_TYPES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              Show archived
            </label>
          </div>

          {/* Table */}
          {templates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground">No templates found</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first document template to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-6 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                      Last Modified
                    </th>
                    <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t, idx) => (
                    <tr
                      key={t.id}
                      className={`group hover:bg-surface-navy transition-colors ${
                        t.isArchived ? 'opacity-60' : ''
                      } ${idx === templates.length - 1 ? '' : ''}`}
                    >
                      <td className="px-6 py-3.5 text-sm font-semibold text-foreground border-b border-border last:border-b-0">
                        <div className="flex items-center gap-2">
                          {t.name}
                          {t.isDefault && (
                            <StarIconSolid className="h-4 w-4 text-gold-500 shrink-0" title="Default template" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 border-b border-border last:border-b-0">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${CATEGORY_BADGE_COLORS[t.type] || 'bg-muted text-muted-foreground'}`}>
                          {DOCUMENT_TEMPLATE_TYPES[t.type] || t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-foreground border-b border-border last:border-b-0">
                        {new Date(t.updatedAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border last:border-b-0">
                        {t.isArchived ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-navy text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Archived
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-bg text-success">
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 border-b border-border last:border-b-0">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEdit(t)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
                            aria-label={`Edit template ${t.name}`}
                            title="Edit"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(t)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
                            aria-label={`Duplicate template ${t.name}`}
                            title="Duplicate"
                          >
                            <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                          </button>
                          {!t.isDefault && (
                            <button
                              onClick={() => handleSetDefault(t)}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-gold-500 hover:text-gold-500 hover:bg-surface-gold transition-all"
                              aria-label={`Set template ${t.name} as default`}
                              title="Set as default"
                            >
                              <StarIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleArchiveToggle(t)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-gold-600 hover:text-gold-600 hover:bg-surface-gold transition-all"
                            aria-label={t.isArchived ? `Unarchive template ${t.name}` : `Archive template ${t.name}`}
                            title={t.isArchived ? 'Unarchive' : 'Archive'}
                          >
                            {t.isArchived ? (
                              <ArchiveBoxXMarkIcon className="h-3.5 w-3.5" />
                            ) : (
                              <ArchiveBoxIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-control border border-border bg-card text-muted-foreground hover:border-error hover:text-error hover:bg-error-bg transition-all"
                            aria-label={`Delete template ${t.name}`}
                            title="Delete"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Template"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DocumentTemplateList;
