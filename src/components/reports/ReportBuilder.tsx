'use client';

import React, { useState, useCallback } from 'react';
import {
  ChartBarIcon,
  TableCellsIcon,
  CalendarIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PlayIcon,
  PauseIcon,
  BookmarkIcon,
  ShareIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

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

export default function ReportBuilder({
  availableFields,
  onSave,
  onRun,
  onExport,
  initialConfig,
  className = '',
}: ReportBuilderProps) {
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

  const [activeTab, setActiveTab] = useState<'fields' | 'filters' | 'visualization' | 'schedule'>('fields');
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
      alert('Please provide a report name');
      return;
    }

    setIsRunning(true);
    try {
      await onRun(config);
    } finally {
      setIsRunning(false);
    }
  }, [config, onRun]);

  const fieldsByCategory = availableFields.reduce((acc, field) => {
    if (!acc[field.category]) acc[field.category] = [];
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, ReportField[]>);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Custom Report Builder</h2>
            <p className="text-sm text-gray-500 mt-1">Create and configure custom recruitment reports</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExport(config, 'csv')}
              disabled={!config.name.trim()}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DocumentArrowDownIcon className="h-4 w-4 inline mr-1" />
              Export
            </button>
            
            <button
              onClick={() => onSave(config)}
              disabled={!config.name.trim()}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <BookmarkIcon className="h-4 w-4 inline mr-1" />
              Save
            </button>
            
            <button
              onClick={handleRun}
              disabled={isRunning || !config.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <PauseIcon className="h-4 w-4 inline mr-1" />
              ) : (
                <PlayIcon className="h-4 w-4 inline mr-1" />
              )}
              {isRunning ? 'Running...' : 'Run Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Name & Description */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Report Name *
            </label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter report name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={config.description || ''}
              onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={config.dateRange.start}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, start: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={config.dateRange.end}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, end: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="px-6 -mb-px flex space-x-8">
          {[
            { id: 'fields' as const, name: 'Fields', count: config.fields.length },
            { id: 'filters' as const, name: 'Filters', count: config.filters.length },
            { id: 'visualization' as const, name: 'Visualization' },
            { id: 'schedule' as const, name: 'Schedule' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'fields' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Select Fields to Include</h3>
              <p className="text-sm text-gray-500 mb-4">
                Choose the data fields you want to include in your report
              </p>
            </div>

            {Object.entries(fieldsByCategory).map(([category, fields]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 capitalize">
                  {category.replace('_', ' ')} Fields
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fields.map((field) => (
                    <label
                      key={field.id}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={config.fields.includes(field.id)}
                        onChange={() => handleFieldToggle(field.id)}
                        className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500/60"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{field.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Report Filters</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add filters to refine your report data
                </p>
              </div>
              <button
                onClick={handleAddFilter}
                className="px-3 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
              >
                Add Filter
              </button>
            </div>

            {config.filters.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No filters added yet. Click "Add Filter" to get started.
              </div>
            ) : (
              <div className="space-y-4">
                {config.filters.map((filter, index) => (
                  <div key={filter.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Field
                        </label>
                        <select
                          value={filter.field}
                          onChange={(e) => handleUpdateFilter(filter.id, { field: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                        >
                          {availableFields.map((field) => (
                            <option key={field.id} value={field.id}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Operator
                        </label>
                        <select
                          value={filter.operator}
                          onChange={(e) => handleUpdateFilter(filter.id, { operator: e.target.value as any })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                        >
                          {FILTER_OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Value
                        </label>
                        <input
                          type="text"
                          value={filter.value}
                          onChange={(e) => handleUpdateFilter(filter.id, { value: e.target.value })}
                          placeholder="Filter value..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={() => handleRemoveFilter(filter.id)}
                          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 w-full"
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
        )}

        {activeTab === 'visualization' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Choose Visualization Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {VISUALIZATION_TYPES.map((viz) => (
                  <button
                    key={viz.type}
                    onClick={() => handleVisualizationChange({ type: viz.type })}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      config.visualization.type === viz.type
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <viz.icon className={`h-6 w-6 mb-2 ${
                      config.visualization.type === viz.type ? 'text-violet-600' : 'text-gray-400'
                    }`} />
                    <div className="font-medium text-gray-900">{viz.name}</div>
                    <div className="text-sm text-gray-500 mt-1">{viz.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {config.visualization.type !== 'table' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    X-Axis Field
                  </label>
                  <select
                    value={config.visualization.xAxis || ''}
                    onChange={(e) => handleVisualizationChange({ xAxis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Y-Axis Field
                  </label>
                  <select
                    value={config.visualization.yAxis || ''}
                    onChange={(e) => handleVisualizationChange({ yAxis: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
        )}

        {activeTab === 'schedule' && (
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
                  className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500/60"
                />
                <span className="ml-2 text-sm font-medium text-gray-900">
                  Enable automated report scheduling
                </span>
              </label>
              <p className="text-sm text-gray-500 mt-1 ml-6">
                Automatically generate and send this report on a regular schedule
              </p>
            </div>

            {config.schedule?.enabled && (
              <div className="ml-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={config.schedule.frequency}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      schedule: {
                        ...prev.schedule!,
                        frequency: e.target.value as any,
                      }
                    }))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recipients (comma-separated emails)
                  </label>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
