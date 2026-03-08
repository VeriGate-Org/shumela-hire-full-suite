'use client';

import React, { useState, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import DocumentTemplateList from '@/components/templates/DocumentTemplateList';
import DocumentTemplateEditor from '@/components/templates/DocumentTemplateEditor';
import { DocumentTemplate } from '@/types/documentTemplate';
import { PlusIcon } from '@heroicons/react/24/outline';

type View = 'list' | 'editor';

export default function DocumentTemplatesPage() {
  const [view, setView] = useState<View>('list');
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = useCallback(() => {
    setEditingTemplate(undefined);
    setView('editor');
  }, []);

  const handleEdit = useCallback((template: DocumentTemplate) => {
    setEditingTemplate(template);
    setView('editor');
  }, []);

  const handleSave = useCallback(() => {
    setView('list');
    setEditingTemplate(undefined);
    setRefreshKey(k => k + 1);
  }, []);

  const handleCancel = useCallback(() => {
    setView('list');
    setEditingTemplate(undefined);
  }, []);

  return (
    <PageWrapper
      title="Document Templates"
      subtitle="Manage offer letters, contracts, emails, and other document templates"
      actions={
        <div className="flex gap-2">
          {view === 'editor' ? (
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-[2px] hover:bg-gray-50 transition-colors"
            >
              Back to List
            </button>
          ) : (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-[2px] hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              Create Template
            </button>
          )}
        </div>
      }
    >
      {view === 'list' ? (
        <DocumentTemplateList onEdit={handleEdit} refreshKey={refreshKey} />
      ) : (
        <DocumentTemplateEditor
          template={editingTemplate}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </PageWrapper>
  );
}
