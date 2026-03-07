'use client';

import React, { useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { formatEnumValue } from '@/utils/enumLabels';
import {
  ChartBarIcon,
  TableCellsIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PlayIcon,
  PauseIcon,
  BookmarkIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';
import WizardShell, { WizardStep } from '@/components/WizardShell';

export interface ReportField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  category: 'candidate' | 'position' | 'timeline' | 'performance';
  aggregatable?: boolean;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in';
  value: any;
  label: string;
}

export interface ReportVisualization {
  type: 'table' | 'bar' | 'line' | 'pie' | 'funnel' | 'scatter';
  xAxis?: string;
  yAxis?: string;
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

export interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
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
  availableFields: ReportField[];
  onSave: (config: ReportConfig) => void;
  onRun: (config: ReportConfig) => void;
  onExport: (config: ReportConfig, format: 'csv' | 'pdf' | 'xlsx') => void;
  initialConfig?: ReportConfig;
  className?: string;
}

const WIZARD_STEPS: WizardStep[] = [
  { id: 'fields', label: 'Fields', description: 'Select data columns' },
  { id: 'filters', label: 'Filters', description: 'Refine your data' },
  { id: 'visualization', label: 'Visualization', description: 'Choose chart type' },
  { id: 'schedule', label: 'Schedule', description: 'Set up delivery', skippable: true },
];

const VISUALIZATION_TYPES = [
  { type: 'table' as const, name: 'Table', icon: TableCellsIcon, description: 'Detailed data in rows and columns' },
  { type: 'bar' as const, name: 'Bar Chart', icon: ChartBarIcon, description: 'Compare values across categories' },
  { type: 'line' as const, name: 'Line Chart', icon: ChartBarIcon, description: 'Show trends over time' },
  { type: 'pie' as const, name: 'Pie Chart', icon: ChartBarIcon, description: 'Show proportions of a whole' },
  { type: 'funnel' as const, name: 'Funnel', icon: FunnelIcon, description: 'Visualize process stages' },
];

const FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'contains', label: 'Contains' },
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In' },
  { value: 'not_in', label: 'Not in' },
];

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/30 focus:border-primary';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em] mb-1.5';

export default function ReportBuilder({
  availableFields,
  onSave,
  onRun,
  onExport,
  initialConfig,
  className = '',
}: ReportBuilderProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>(
    initialConfig || {
      name: '',
      description: '',
      fields: [],
      filters: [],
      visualization: { type: 'table' },
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      },
    }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const handleFieldToggle = useCallback((fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(fieldId)
        ? prev.fields.filter(id => id !== fieldId)
        : [...prev.fields, fieldId]
    }));
  }, []);

  const handleAddFilter = useCallback(() => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: availableFields[0]?.id || '',
      operator: 'equals',
      value: '',
      label: `Filter ${config.filters.length + 1}`,
    };

    setConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }));
  }, [availableFields, config.filters.length]);

  const handleUpdateFilter = useCallback((filterId: string, updates: Partial<ReportFilter>) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      )
    }));
  }, []);

  const handleRemoveFilter = useCallback((filterId: string) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId)
    }));
  }, []);

  const handleVisualizationChange = useCallback((updates: Partial<ReportVisualization>) => {
    setConfig(prev => ({
      ...prev,
      visualization: { ...prev.visualization, ...updates }
    }));
  }, []);

  const handleRun = useCallback(async () => {
    if (!config.name.trim()) {
      toast('Please provide a report name', 'info');
      return;
    }

    setIsRunning(true);
    try {
      await onRun(config);
    } finally {
      setIsRunning(false);
    }
  }, [config, onRun, toast]);

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Fields
        return config.name.trim().length > 0 && config.fields.length > 0;
      case 1: // Filters
        return true;
      case 2: // Visualization
        return true;
      case 3: // Schedule
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderFieldsStep = () => (
    <div className="space-y-6">
      {/* Report Name & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Report Name *</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter report name..."
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={config.description || ''}
            onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Start Date</label>
          <input
            type="date"
            value={config.dateRange.start}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, start: e.target.value }
            }))}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>End Date</label>
          <input
            type="date"
            value={config.dateRange.end}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              dateRange: { ...prev.dateRange, end: e.target.value }
            }))}
            className={inputClass}
          />
        </div>
      </div>

      {/* Field Selection */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Select Fields to Include</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Choose the data fields you want to include in your report
        </p>
      </div>

      {Object.entries(fieldsByCategory).map(([category, fields]) => (
        <div key={category} className="space-y-3">
          <h4 className={labelClass}>
            {formatEnumValue(category)} Fields
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {fields.map((field) => (
              <label
                key={field.id}
                className={`flex items-center p-3 border rounded-[2px] cursor-pointer transition-colors ${
                  config.fields.includes(field.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-off-white dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.fields.includes(field.id)}
                  onChange={() => handleFieldToggle(field.id)}
                  className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{field.name}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em]">{field.type}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderFiltersStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Report Filters</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Add filters to refine your report data
          </p>
        </div>
        <button
          onClick={handleAddFilter}
          className="px-3 py-2 text-sm font-medium text-primary bg-primary/5 rounded-full hover:bg-primary/10 transition-colors"
        >
          Add Filter
        </button>
      </div>

      {config.filters.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <FunnelIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No filters added yet</p>
          <p className="text-xs mt-1">Filters are optional — click &quot;Add Filter&quot; or proceed to the next step</p>
        </div>
      ) : (
        <div className="space-y-4">
          {config.filters.map((filter) => (
            <div key={filter.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-[2px]">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Field</label>
                  <select
                    value={filter.field}
                    onChange={(e) => handleUpdateFilter(filter.id, { field: e.target.value })}
                    className={inputClass}
                  >
                    {availableFields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Operator</label>
                  <select
                    value={filter.operator}
                    onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value as any })}
                    className={inputClass}
                  >
                    {FILTER_OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Value</label>
                  <input
                    type="text"
                    value={filter.value}
                    onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                    placeholder="Filter value..."
                    className={inputClass}
                  />
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => handleRemoveFilter(filter.id)}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-500/10 rounded-[2px] hover:bg-red-100 dark:hover:bg-red-500/20 w-full transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVisualizationStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Choose Visualization Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {VISUALIZATION_TYPES.map((viz) => (
            <button
              key={viz.type}
              onClick={() => handleVisualizationChange({ type: viz.type })}
              className={`p-4 border-2 rounded-[2px] text-left transition-all ${
                config.visualization.type === viz.type
                  ? 'border-cta bg-cta/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <viz.icon className={`h-6 w-6 mb-2 ${
                config.visualization.type === viz.type ? 'text-cta' : 'text-gray-400 dark:text-gray-500'
              }`} />
              <div className="font-medium text-gray-900 dark:text-gray-100">{viz.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{viz.description}</div>
            </button>
          ))}
        </div>
      </div>

      {config.visualization.type !== 'table' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>X-Axis Field</label>
            <select
              value={config.visualization.xAxis || ''}
              onChange={(e) => handleVisualizationChange({ xAxis: e.target.value })}
              className={inputClass}
            >
              <option value="">Select field...</option>
              {config.fields.map((fieldId) => {
                const field = availableFields.find(f => f.id === fieldId);
                return field ? (
                  <option key={fieldId} value={fieldId}>
                    {field.name}
                  </option>
                ) : null;
              })}
            </select>
          </div>

          <div>
            <label className={labelClass}>Y-Axis Field</label>
            <select
              value={config.visualization.yAxis || ''}
              onChange={(e) => handleVisualizationChange({ yAxis: e.target.value })}
              className={inputClass}
            >
              <option value="">Select field...</option>
              {config.fields.map((fieldId) => {
                const field = availableFields.find(f => f.id === fieldId);
                return field && field.type === 'number' ? (
                  <option key={fieldId} value={fieldId}>
                    {field.name}
                  </option>
                ) : null;
              })}
            </select>
          </div>
        </div>
      )}
    </div>
  );

  const renderScheduleStep = () => (
    <div className="space-y-6">
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.schedule?.enabled || false}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              schedule: {
                enabled: e.target.checked,
                frequency: 'weekly',
                recipients: [],
                ...prev.schedule,
              }
            }))}
            className="h-4 w-4 text-primary border-gray-300 dark:border-gray-600 rounded-[2px] focus:ring-primary/30"
          />
          <span className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            Enable automated report scheduling
          </span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
          Automatically generate and send this report on a regular schedule
        </p>
      </div>

      {config.schedule?.enabled && (
        <div className="ml-6 space-y-4">
          <div>
            <label className={labelClass}>Frequency</label>
            <select
              value={config.schedule.frequency}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                schedule: {
                  ...prev.schedule!,
                  frequency: e.target.value as any,
                }
              }))}
              className={`${inputClass} max-w-xs`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Recipients (comma-separated emails)</label>
            <textarea
              value={config.schedule.recipients.join(', ')}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                schedule: {
                  ...prev.schedule!,
                  recipients: e.target.value.split(',').map(email => email.trim()).filter(Boolean),
                }
              }))}
              placeholder="user1@company.com, user2@company.com"
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderFieldsStep();
      case 1:
        return renderFiltersStep();
      case 2:
        return renderVisualizationStep();
      case 3:
        return renderScheduleStep();
      default:
        return null;
    }
  };

  const finalFooter = currentStep === WIZARD_STEPS.length - 1 ? (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <ArrowLeftIcon className="w-3.5 h-3.5" />
        Back
      </button>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onExport(config, 'csv')}
          disabled={!config.name.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Export
        </button>
        <button
          onClick={() => onSave(config)}
          disabled={!config.name.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <BookmarkIcon className="h-4 w-4" />
          Save
        </button>
        <button
          onClick={handleRun}
          disabled={isRunning || !config.name.trim()}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-cta text-deep-navy rounded-full hover:bg-cta/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <PauseIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
          {isRunning ? 'Running...' : 'Run Report'}
        </button>
      </div>
    </div>
  ) : undefined;

  return (
    <div className={className}>
      <WizardShell
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        canProceed={canProceedFromStep(currentStep)}
        title="Custom Report Builder"
        subtitle="Create and configure custom recruitment reports"
        footer={finalFooter}
      >
        {renderStepContent()}
      </WizardShell>
    </div>
  );
}
