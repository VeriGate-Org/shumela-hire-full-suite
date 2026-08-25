'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { JobAdTemplate, JobAdDraft } from '@/types/jobTemplate';
import { jobTemplateService } from '@/services/jobTemplateService';
import TemplateList from '@/components/templates/TemplateList';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import { TEMPLATE_PLACEHOLDERS } from '@/types/jobTemplate';
import {
  LibraryCounts,
  REVISION_CYCLE_MONTHS,
  busiest,
  countLibrary,
  hasUsageData,
  monthsSinceRevision,
  overdueTemplates,
} from './library';
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
} from '@heroicons/react/24/outline';

const JobTemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'generate'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<JobAdTemplate | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<JobAdTemplate[]>([]);

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
        // Archived included: the library's shape is part of what this page reports, and the
        // archived count was computed by getTemplateStats and displayed nowhere.
        //
        // Every figure the band shows is derived from these rows, so the separate stats call is
        // gone — one source rather than two that can disagree.
        setTemplates(await jobTemplateService.getAllTemplates({ showArchived: true }));
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

    setTemplates(await jobTemplateService.getAllTemplates({ showArchived: true }));
  };

  const handleGenerated = (draft: JobAdDraft) => {
    console.log('Job ad generated:', draft);
    // Was: '... In a real app, this would redirect to the draft editor.' — developer copy, shipped,
    // on a screen a client uses. The draft is genuinely created; it is the navigation that is
    // missing, and saying so plainly is better than admitting to being a prototype.
    toast('Job ad draft created. Open it from Job Postings to publish it.', 'success');
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
      setTemplates(await jobTemplateService.getAllTemplates({ showArchived: true }));
    } catch {
      setStatsError('Failed to load the template library');
    }
  };

  const counts: LibraryCounts | null = templates.length > 0 ? countLibrary(templates) : null;
  const usageKnown = hasUsageData(templates);
  const mostUsed = busiest(templates);
  // Worst first, so the decision bar names the template carrying the most exposure.
  const overdue = overdueTemplates(templates);

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
          title="Failed to load the template library"
          message={statsError}
          onRetry={handleRetryStats}
        />
      )}

      <IdentityBand
        eyebrow="Job ad template library"
        title="Job Templates"
        subtitle={
          counts
            ? `${counts.total} ${counts.total === 1 ? 'template' : 'templates'} · source copy for every advert`
            : 'Library unavailable'
        }
        figures={
          counts
            ? [
                ...(usageKnown
                  ? [{ label: 'Adverts generated', value: counts.advertsGenerated }]
                  : []),
                { label: 'In use', value: counts.inUse },
                {
                  label: 'Overdue revision',
                  value: counts.overdueRevision,
                  tone: (counts.overdueRevision > 0 ? 'critical' : undefined) as
                    | 'critical'
                    | undefined,
                },
                {
                  label: 'Never used',
                  value: counts.neverUsed,
                  tone: (counts.neverUsed > 0 ? 'warning' : undefined) as 'warning' | undefined,
                },
              ]
            : []
        }
      />

      {counts && usageKnown && (overdue.length > 0 || mostUsed) && (
        <DecisionBar
          ask={
            overdue.length > 0
              ? `${overdue.length} ${
                  overdue.length === 1 ? 'template is' : 'templates are'
                } writing adverts nobody has revised in over ${REVISION_CYCLE_MONTHS} months.`
              : `${mostUsed!.name} has produced ${mostUsed!.usageCount} of the ${
                  counts.advertsGenerated
                } adverts on this tenant.`
          }
          why={
            overdue.length > 0
              ? `${overdue[0].name} has produced ${overdue[0].usageCount} adverts and was last revised ${
                  monthsSinceRevision(overdue[0]) ?? '—'
                } months ago. Every advert a template writes carries whatever is wrong with it.`
              : 'Every advert a template writes carries whatever is wrong with it, so the one doing most of the work is the one worth reviewing first.'
          }
          tone="owed"
        >
          <PrimaryAction onClick={() => handleEdit(overdue[0] ?? mostUsed!)}>
            Review {(overdue[0] ?? mostUsed!).name}
          </PrimaryAction>
          <SecondaryAction onClick={handleCreateNew}>New template</SecondaryAction>
        </DecisionBar>
      )}

      {counts ? (
        <DistributionStrip
          buckets={[
            { label: 'In use', count: counts.inUse, detail: 'Produced an advert' },
            {
              label: 'Overdue revision',
              count: counts.overdueRevision,
              detail: `In use, unrevised ${REVISION_CYCLE_MONTHS}+ months`,
            },
            { label: 'Never used', count: counts.neverUsed, detail: 'Created, never drawn on' },
            { label: 'Archived', count: counts.archived, detail: 'Hidden by default' },
          ]}
          footnote={
            usageKnown ? (
              <>
                A template is load-bearing when it is generating adverts — those are the ones worth
                reviewing.
              </>
            ) : (
              <>
                {/* True and useful: the demo seed sets usageCount to 0 for every template, so a
                    ranking there would say nothing. Better to say the data is absent than to show
                    a library that looks entirely unused. */}
                <b className="font-bold text-foreground">No usage recorded yet</b> — every template
                reads zero adverts produced, so this library cannot yet be ranked by what it is
                doing.
              </>
            )
          }
        />
      ) : (
        !statsError && (
          <p className="text-sm text-muted-foreground px-1">Library counts are unavailable.</p>
        )
      )}

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
        {/* From TEMPLATE_PLACEHOLDERS rather than a second hardcoded list beside it. The page
            held eight bare strings duplicating a source that already carries a label, a
            description and an example for each — two lists that must agree, with nothing keeping
            them in step. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          {TEMPLATE_PLACEHOLDERS.map((placeholder) => (
            <div key={placeholder.key} className="min-w-0">
              <code className="bg-muted px-2 py-1 rounded-control text-xs font-mono text-foreground">
                {placeholder.key}
              </code>
              {placeholder.example && (
                <p className="text-xs text-muted-foreground mt-1 truncate" title={placeholder.example}>
                  e.g. {placeholder.example}
                </p>
              )}
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
