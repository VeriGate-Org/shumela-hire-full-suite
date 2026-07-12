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
  ChartBarIcon,
  StarIcon,
  ClockIcon,
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
    <div className="flex items-center gap-2 flex-wrap">
      {/* View toggle pill group */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-button p-1 shadow-sm">
        <button
          onClick={() => switchView('list')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] rounded-button transition-colors ${
            activeView === 'list'
              ? 'bg-primary text-white'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <DocumentTextIcon className="w-3.5 h-3.5" />
          Templates
        </button>
        <button
          onClick={handleCreateNew}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] rounded-button transition-colors ${
            activeView === 'editor'
              ? 'bg-primary text-white'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Create
        </button>
        <button
          onClick={() => switchView('generate')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.05em] rounded-button transition-colors ${
            activeView === 'generate'
              ? 'bg-primary text-white'
              : 'bg-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          Generate
        </button>
      </div>

      {/* CTA button */}
      <button
        onClick={handleCreateNew}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-cta border-2 border-cta text-foreground rounded-button font-semibold text-sm uppercase tracking-[0.05em] transition-colors hover:bg-cta-hover hover:border-cta-hover"
      >
        <PlusIcon className="w-4 h-4" />
        Create Template
      </button>
    </div>
  );

  return (
    <PageWrapper
      title="Job Templates"
      subtitle="Create and manage reusable job description templates"
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

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Templates */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-primary flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            {stats ? (
              <>
                <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{stats.totalTemplates}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Total Templates</div>
              </>
            ) : (
              <>
                <div className="h-7 w-14 rounded-control bg-muted animate-pulse mb-1" />
                <div className="h-3.5 w-24 rounded-control bg-muted animate-pulse" />
              </>
            )}
          </div>
        </div>

        {/* Most Used Template */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
            <StarIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            {stats ? (
              <>
                <div className="text-base font-extrabold leading-snug text-foreground truncate">
                  {stats.mostUsedTemplate?.name || 'N/A'}
                </div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Most Used Template</div>
              </>
            ) : (
              <>
                <div className="h-5 w-32 rounded-control bg-muted animate-pulse mb-1" />
                <div className="h-3.5 w-28 rounded-control bg-muted animate-pulse" />
              </>
            )}
          </div>
        </div>

        {/* Active Templates */}
        <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
          <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
            <ClockIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            {stats ? (
              <>
                <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{stats.activeTemplates}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Active Templates</div>
              </>
            ) : (
              <>
                <div className="h-7 w-10 rounded-control bg-muted animate-pulse mb-1" />
                <div className="h-3.5 w-28 rounded-control bg-muted animate-pulse" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two-column content layout (list view) */}
      {activeView === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          {/* Left: Template List Panel */}
          <div className="enterprise-card overflow-hidden flex flex-col max-h-[680px] lg:max-h-[680px]">
            <TemplateList
              onEdit={handleEdit}
              onGenerate={handleGenerate}
              onCreateNew={handleCreateNew}
              className=""
            />
          </div>

          {/* Right: Editor Panel */}
          <div className="enterprise-card overflow-hidden flex flex-col min-h-[500px]">
            <TemplateEditor
              template={selectedTemplate || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              className="h-full"
            />
          </div>
        </div>
      )}

      {/* Full-width editor view */}
      {activeView === 'editor' && (
        <div className="enterprise-card overflow-hidden min-h-[600px]">
          <TemplateEditor
            template={selectedTemplate || undefined}
            onSave={handleSave}
            onCancel={handleCancel}
            className="h-full"
          />
        </div>
      )}

      {/* Full-width generate view */}
      {activeView === 'generate' && (
        <div className="enterprise-card overflow-hidden min-h-[600px]">
          <GenerateFromTemplate
            template={selectedTemplate || undefined}
            onGenerated={handleGenerated}
            onCancel={handleCancel}
            className="p-4 md:p-5"
          />
        </div>
      )}

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
