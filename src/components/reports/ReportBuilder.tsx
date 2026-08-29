'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import WizardShell, { WizardStep } from '@/components/WizardShell';
import {
  REPORT_SUBJECTS,
  ReportSubject,
  SubjectId,
  defaultColumns,
  subjectFor,
} from './subjects';

/** Kept for the saved-report and viewer types, which still carry it. Only a table is rendered. */
export interface ReportVisualization {
  type: 'table' | 'bar' | 'line' | 'pie' | 'funnel';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
}

export interface ReportFilter {
  field: string;
  operator: string;
  value: string;
}

/** Retained so existing saved reports still type-check; the wizard no longer offers a field list. */
export interface ReportField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  category: string;
  aggregatable?: boolean;
}

export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  /**
   * What each row is. This decides which columns and filters exist, and it is what the backend
   * switches on — it used to be derived from {@code name}, which could never match.
   */
  subject: SubjectId;
  fields: string[];
  filters: ReportFilter[];
  visualization: ReportVisualization;
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
  dateRange: {
    start: string;
    end: string;
  };
}

interface ReportBuilderProps {
  onSave: (config: ReportConfig) => void;
  onRun: (config: ReportConfig) => void;
  onExport: (config: ReportConfig, format: 'csv') => void;
  initialConfig?: ReportConfig;
  className?: string;
}

/**
 * Three steps, each answered by the backend.
 *
 * <p>The wizard it replaces had four — Fields, Filters, Visualization, Schedule — of which one did
 * anything. Fields and filters were collected and discarded, four of the five chart types rendered
 * a placeholder reading "Chart visualization will be displayed here", and the report's endpoint was
 * assembled from the name the user typed, so no run could succeed.
 *
 * <p>Subject comes first because the answer determines the question: applications, interviews and
 * analytics each expose their own columns and their own filters, and analytics accepts no filters
 * at all.
 */
const WIZARD_STEPS: WizardStep[] = [
  { id: 'subject', label: 'Subject', description: 'What the rows are' },
  { id: 'columns', label: 'Columns & period', description: 'What each row shows' },
  { id: 'filters', label: 'Narrow it', description: 'Optional', skippable: true },
];

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function monthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split('T')[0];
}

export default function ReportBuilder({
  onSave,
  onRun,
  onExport,
  initialConfig,
  className = '',
}: ReportBuilderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [config, setConfig] = useState<ReportConfig>(
    initialConfig ?? {
      name: '',
      subject: 'applications',
      fields: defaultColumns(subjectFor('applications')),
      filters: [],
      visualization: { type: 'table' },
      dateRange: { start: monthsAgo(3), end: today() },
    },
  );
  const [isRunning, setIsRunning] = useState(false);

  const subject = useMemo(() => subjectFor(config.subject), [config.subject]);

  /** Changing subject replaces the columns, because the old ones do not exist on the new one. */
  const chooseSubject = useCallback((next: ReportSubject) => {
    setConfig((prev) => ({
      ...prev,
      subject: next.id,
      fields: defaultColumns(next),
      filters: [],
    }));
  }, []);

  const toggleColumn = useCallback((id: string) => {
    setConfig((prev) => ({
      ...prev,
      fields: prev.fields.includes(id)
        ? prev.fields.filter((f) => f !== id)
        : [...prev.fields, id],
    }));
  }, []);

  const setFilter = useCallback((field: string, value: string) => {
    setConfig((prev) => ({
      ...prev,
      filters: value
        ? [...prev.filters.filter((f) => f.field !== field), { field, operator: 'equals', value }]
        : prev.filters.filter((f) => f.field !== field),
    }));
  }, []);

  const filterValue = (field: string) => config.filters.find((f) => f.field === field)?.value ?? '';

  const canProceed = (step: number) => {
    if (step === 0) return Boolean(config.subject);
    if (step === 1) return config.fields.length > 0 && Boolean(config.dateRange.start && config.dateRange.end);
    return true;
  };

  const run = async () => {
    setIsRunning(true);
    try {
      await onRun(config);
    } finally {
      setIsRunning(false);
    }
  };

  const labelClass = 'text-sm font-semibold text-foreground';
  const inputClass =
    'w-full rounded-control border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors focus:border-primary focus:outline-none';

  const stepSubject = (
    <div className="space-y-3">
      <div>
        <h3 className={labelClass}>Each row in this report is one…</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          This decides which columns and filters are available — they differ by subject.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {REPORT_SUBJECTS.map((s) => {
          const chosen = s.id === config.subject;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => chooseSubject(s)}
              aria-pressed={chosen}
              className={`rounded-card border p-3 text-left transition-colors ${
                chosen ? 'border-cta bg-surface-gold' : 'border-border hover:bg-muted'
              }`}
            >
              <span className="block text-sm font-semibold text-foreground">{s.noun}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{s.description}</span>
              <span className="mt-2 block text-[11px] font-semibold text-accent-teal">
                {s.columns.length} columns ·{' '}
                {s.filters.length === 0 ? 'no filters' : `${s.filters.length} filter${s.filters.length === 1 ? '' : 's'}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const stepColumns = (
    <div className="space-y-5">
      <div>
        <h3 className={labelClass}>Columns</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Every one of these is a field this report can fill. The name it is sent under is shown
          beside it.
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {subject.columns.map((column) => {
            const chosen = config.fields.includes(column.id);
            return (
              <button
                key={column.id}
                type="button"
                onClick={() => toggleColumn(column.id)}
                aria-pressed={chosen}
                className={`flex items-center gap-2.5 rounded-control border px-3 py-2 text-left transition-colors ${
                  chosen ? 'border-accent-teal bg-surface-teal' : 'border-border hover:bg-muted'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-4 w-4 flex-none place-items-center rounded border ${
                    chosen ? 'border-accent-teal bg-accent-teal text-cta-foreground' : 'border-muted-foreground'
                  }`}
                >
                  {chosen && <CheckIcon className="h-3 w-3" />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground">{column.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">{column.id}</span>
              </button>
            );
          })}
        </div>
        {config.fields.length === 0 && (
          <p className="mt-2 text-xs text-error-on-tint">Choose at least one column.</p>
        )}
      </div>

      <div>
        <h3 className={labelClass}>Period</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={config.dateRange.start}
            onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, start: e.target.value } })}
            className={`${inputClass} max-w-[190px]`}
            aria-label="Period start"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={config.dateRange.end}
            onChange={(e) => setConfig({ ...config, dateRange: { ...config.dateRange, end: e.target.value } })}
            className={`${inputClass} max-w-[190px]`}
            aria-label="Period end"
          />
        </div>
      </div>

      <div className="rounded-card border border-border">
        <div className="border-b border-border px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Your columns, in order
        </div>
        <div className="overflow-x-auto px-3 py-2">
          <code className="font-mono text-xs text-foreground">
            {config.fields.length ? config.fields.join(', ') : 'none chosen'}
          </code>
        </div>
      </div>
    </div>
  );

  const stepFilters = (
    <div className="space-y-3">
      <div>
        <h3 className={labelClass}>Narrow it</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Only the filters this report accepts are offered.
        </p>
      </div>
      {subject.filters.length === 0 ? (
        <div className="rounded-card border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          This report takes no filters. Choose a period on the previous step and run it.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {subject.filters.map((filter) => (
            <label key={filter.id} className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">{filter.label}</span>
              {filter.options ? (
                <select
                  value={filterValue(filter.id)}
                  onChange={(e) => setFilter(filter.id, e.target.value)}
                  className={inputClass}
                >
                  <option value="">Any</option>
                  {filter.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={filterValue(filter.id)}
                  onChange={(e) => setFilter(filter.id, e.target.value)}
                  placeholder="Any"
                  className={inputClass}
                />
              )}
            </label>
          ))}
        </div>
      )}
    </div>
  );

  const steps = [stepSubject, stepColumns, stepFilters];

  const footer = currentStep === WIZARD_STEPS.length - 1 ? (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={isRunning || config.fields.length === 0}
        className="rounded-button border-2 border-cta bg-cta px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-cta-foreground transition-colors hover:bg-cta-hover disabled:opacity-60"
      >
        {isRunning ? 'Running…' : 'Run report'}
      </button>
      <button
        type="button"
        onClick={() => onSave(config)}
        className="rounded-button border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => onExport(config, 'csv')}
        className="rounded-button border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
      >
        Download CSV
      </button>
      <span className="ml-auto text-xs text-muted-foreground">
        {subject.aggregate
          ? 'Returns measures for the period'
          : `${config.fields.length} column${config.fields.length === 1 ? '' : 's'} · ${config.dateRange.start} to ${config.dateRange.end}`}
      </span>
    </div>
  ) : undefined;

  return (
    <div className={className}>
      <WizardShell
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onNext={() => setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))}
        onBack={() => setCurrentStep((s) => Math.max(s - 1, 0))}
        onSkip={() => setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1))}
        canProceed={canProceed(currentStep)}
        title="Build a report"
        subtitle="Pick a subject, choose your columns, run it"
        footer={footer}
      >
        {steps[currentStep]}
      </WizardShell>
    </div>
  );
}
