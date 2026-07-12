'use client';

import React, { useState, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import DocumentTemplateList from '@/components/templates/DocumentTemplateList';
import DocumentTemplateEditor from '@/components/templates/DocumentTemplateEditor';
import { DocumentTemplate } from '@/types/documentTemplate';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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
      subtitle="Create and manage document templates with dynamic merge tags"
      actions={
        <div className="flex gap-2">
          {view === 'editor' ? (
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-2 border-border rounded-full hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
            >
              <ArrowLeftIcon className="h-3.5 w-3.5" />
              Back to List
            </button>
          ) : (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-wider bg-primary text-white border-2 border-primary rounded-full hover:bg-primary/90 transition-all"
            >
              <PlusIcon className="h-3.5 w-3.5" />
              New Template
            </button>
          )}
        </div>
      }
    >
      {view === 'list' ? (
        <DocumentTemplateList
          onEdit={handleEdit}
          onCreateNew={handleCreateNew}
          refreshKey={refreshKey}
        />
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
