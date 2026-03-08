'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTemplate,
  DocumentTemplateType,
  DOCUMENT_TEMPLATE_TYPES,
} from '../../types/documentTemplate';
import { documentTemplateService } from '../../services/documentTemplateService';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  MagnifyingGlassIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  StarIcon,
  ArchiveBoxIcon,
  TrashIcon,
  ArchiveBoxXMarkIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface DocumentTemplateListProps {
  onEdit: (template: DocumentTemplate) => void;
  refreshKey?: number;
}

const DocumentTemplateList: React.FC<DocumentTemplateListProps> = ({ onEdit, refreshKey }) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentTemplateType | ''>('');
  const [showArchived, setShowArchived] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | null>(null);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const results = await documentTemplateService.getAllTemplates({
        search: search || undefined,
        type: typeFilter || undefined,
        showArchived,
      });
      setTemplates(results);
    } catch {
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

  const TYPE_BADGE_COLORS: Record<string, string> = {
    OFFER_LETTER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    CONTRACT: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    REJECTION_EMAIL: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    WELCOME_EMAIL: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    NDA: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    PROBATION_LETTER: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    CONFIRMATION_LETTER: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as DocumentTemplateType | '')}
          className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ring/30"
        >
          <option value="">All Types</option>
          {Object.entries(DOCUMENT_TEMPLATE_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="w-3.5 h-3.5"
          />
          Show archived
        </label>
      </div>

      {/* Template cards */}
      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">No templates found</p>
          <p className="text-xs text-gray-400 mt-1">Create your first document template to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {templates.map(t => (
            <div
              key={t.id}
              className={`bg-white dark:bg-charcoal border rounded-[2px] p-4 hover:shadow-sm transition-shadow ${
                t.isArchived
                  ? 'border-gray-200 dark:border-gray-700 opacity-60'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{t.name}</h4>
                    {t.isDefault && (
                      <StarIconSolid className="h-3.5 w-3.5 text-yellow-500 flex-shrink-0" title="Default template" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] ${TYPE_BADGE_COLORS[t.type] || 'bg-gray-100 text-gray-600'}`}>
                      {DOCUMENT_TEMPLATE_TYPES[t.type] || t.type}
                    </span>
                    {t.isArchived && (
                      <span className="text-[10px] text-gray-400">Archived</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-[10px] text-gray-400 mb-3">
                Created {new Date(t.createdAt).toLocaleDateString()} by {t.createdBy}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => onEdit(t)}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                  title="Edit"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDuplicate(t)}
                  className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                  title="Duplicate"
                >
                  <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                </button>
                {!t.isDefault && (
                  <button
                    onClick={() => handleSetDefault(t)}
                    className="p-1.5 text-gray-400 hover:text-yellow-500 transition-colors"
                    title="Set as default"
                  >
                    <StarIcon className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleArchiveToggle(t)}
                  className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
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
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-auto"
                  title="Delete"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
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
