'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { JobAdTemplate, JobAdDraft, TemplateStats } from '@/types/jobTemplate';
import { jobTemplateService } from '@/services/jobTemplateService';
import TemplateList from '@/components/templates/TemplateList';
import TemplateEditor from '@/components/templates/TemplateEditor';
import GenerateFromTemplate from '@/components/templates/GenerateFromTemplate';
import PageWrapper from '@/components/PageWrapper';
import ErrorState from '@/components/ErrorState';
import { useToast } from '@/components/Toast';
import {
  DocumentTextIcon,
  PlusIcon,
  SparklesIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const JobTemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'generate'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<JobAdTemplate | null>(null);
  const [stats, setStats] = useState<TemplateStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Bug 3: Read URL params on mount to restore the view
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'editor' || viewParam === 'generate') {
      setActiveView(viewParam);
    }
  }, []);

  // Bug 3: Update URL when switching views
  const updateViewUrl = useCallback((view: string, templateId?: string) => {
    const params = new URLSearchParams();
    if (view !== 'list') {
      params.set('view', view);
    }
    if (templateId) {
      params.set('id', templateId);
    }
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, []);

  const switchView = useCallback((view: 'list' | 'editor' | 'generate', template?: JobAdTemplate | null) => {
    setActiveView(view);
    updateViewUrl(view, template?.id);
  }, [updateViewUrl]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setStatsError(null);
        const templateStats = await jobTemplateService.getTemplateStats();
        setStats(templateStats);
      } catch (error) {
        console.error('Error initializing template data:', error);
        setStatsError('Failed to load template statistics');
      }
    };

    initializeData();
  }, []);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    switchView('editor');
  };

  const handleEdit = (template: JobAdTemplate) => {
    setSelectedTemplate(template);
    switchView('editor', template);
  };

  const handleGenerate = (template: JobAdTemplate) => {
    setSelectedTemplate(template);
    switchView('generate', template);
  };

  const handleSave = async (template: JobAdTemplate) => {
    console.log('Template saved:', template);
    switchView('list');
    setSelectedTemplate(null);

    const templateStats = await jobTemplateService.getTemplateStats();
    setStats(templateStats);
  };

  const handleGenerated = (draft: JobAdDraft) => {
    console.log('Job ad generated:', draft);
    toast('Job ad draft created successfully. In a real app, this would redirect to the draft editor.', 'success');
    switchView('list');
    setSelectedTemplate(null);
  };

  const handleCancel = () => {
    switchView('list');
    setSelectedTemplate(null);
  };

  const handleRetryStats = async () => {
    try {
      setStatsError(null);
      const templateStats = await jobTemplateService.getTemplateStats();
      setStats(templateStats);
    } catch {
      setStatsError('Failed to load template statistics');
    }
  };

  const actions = (
    <div className="flex items-center space-x-2">
      {stats && (
        <div className="hidden md:flex items-center space-x-4 mr-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold text-cta">{stats.activeTemplates}</div>
            <div className="text-muted-foreground text-xs uppercase tracking-[0.05em]">Active</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-foreground">{stats.totalTemplates}</div>
            <div className="text-muted-foreground text-xs uppercase tracking-[0.05em]">Total</div>
          </div>
          {stats.mostUsedTemplate && (
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{stats.mostUsedTemplate.usageCount}</div>
              <div className="text-muted-foreground text-xs uppercase tracking-[0.05em]">Most Used</div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => switchView('list')}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          activeView === 'list'
            ? 'border-2 border-cta text-cta bg-transparent'
            : 'border border-border text-muted-foreground hover:bg-accent'
        }`}
      >
        <DocumentTextIcon className="w-4 h-4 mr-2" />
        Templates
      </button>

      <button
        onClick={handleCreateNew}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          activeView === 'editor'
            ? 'border-2 border-cta text-cta bg-transparent'
            : 'border border-border text-muted-foreground hover:bg-accent'
        }`}
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Create
      </button>

      <button
        onClick={() => switchView('generate')}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-full transition-colors ${
          activeView === 'generate'
            ? 'border-2 border-cta text-cta bg-transparent'
            : 'border border-border text-muted-foreground hover:bg-accent'
        }`}
      >
        <SparklesIcon className="w-4 h-4 mr-2" />
        Generate
      </button>
    </div>
  );

  return (
    <PageWrapper
      title="Job Ad Templates"
      subtitle="Create, manage, and generate job advertisements from reusable templates"
      actions={actions}
    >
      {/* Stats error */}
      {statsError && (
        <ErrorState
          title="Failed to load statistics"
          message={statsError}
          onRetry={handleRetryStats}
        />
      )}

      {/* Main Content */}
      <div className="enterprise-card min-h-[600px]">
        {activeView === 'list' && (
          <TemplateList
            onEdit={handleEdit}
            onGenerate={handleGenerate}
            onCreateNew={handleCreateNew}
            className="p-4 md:p-5"
          />
        )}

        {activeView === 'editor' && (
          <TemplateEditor
            template={selectedTemplate || undefined}
            onSave={handleSave}
            onCancel={handleCancel}
            className="h-full"
          />
        )}

        {activeView === 'generate' && (
          <GenerateFromTemplate
            template={selectedTemplate || undefined}
            onGenerated={handleGenerated}
            onCancel={handleCancel}
            className="p-4 md:p-5"
          />
        )}
      </div>

      {/* Available Placeholders */}
      <div className="enterprise-card p-4 md:p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
          <ChartBarIcon className="w-4 h-4 mr-2" />
          Available Placeholders
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          {[
            '{{jobTitle}}', '{{department}}', '{{location}}', '{{employmentType}}',
            '{{salaryRange}}', '{{companyName}}', '{{contactEmail}}', '{{applicationDeadline}}'
          ].map((placeholder) => (
            <div key={placeholder} className="flex items-center">
              <code className="bg-muted px-2 py-1 rounded-control text-xs font-mono text-foreground">
                {placeholder}
              </code>
            </div>
          ))}
        </div>
        <p className="text-muted-foreground mt-3 text-xs">
          Use these placeholders in your templates to automatically populate job-specific information when generating ads.
        </p>
      </div>
    </PageWrapper>
  );
};

export default JobTemplatesPage;
