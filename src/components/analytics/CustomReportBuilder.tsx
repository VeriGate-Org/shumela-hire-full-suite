import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  TableCellsIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { RecruitmentLineChart, RecruitmentBarChart, RecruitmentPieChart } from '../charts';
import WizardShell, { WizardStep } from '../WizardShell';

interface ReportField {
  id: string;
  label: string;
  type: 'dimension' | 'metric';
  dataType: 'string' | 'number' | 'date';
}

interface ReportFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
}

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  dimensions: string[];
  metrics: string[];
  filters: ReportFilter[];
  visualization: 'table' | 'line' | 'bar' | 'pie';
  dateRange: { start: string; end: string };
  refreshInterval?: number;
}

// Available fields for report building
const availableFields: ReportField[] = [
  // Dimensions
  { id: 'department', label: 'Department', type: 'dimension', dataType: 'string' },
  { id: 'position_title', label: 'Position Title', type: 'dimension', dataType: 'string' },
  { id: 'source', label: 'Application Source', type: 'dimension', dataType: 'string' },
  { id: 'hiring_manager', label: 'Hiring Manager', type: 'dimension', dataType: 'string' },
  { id: 'location', label: 'Location', type: 'dimension', dataType: 'string' },
  { id: 'experience_level', label: 'Experience Level', type: 'dimension', dataType: 'string' },
  { id: 'application_date', label: 'Application Date', type: 'dimension', dataType: 'date' },

  // Metrics
  { id: 'applications_count', label: 'Application Count', type: 'metric', dataType: 'number' },
  { id: 'interviews_count', label: 'Interview Count', type: 'metric', dataType: 'number' },
  { id: 'offers_count', label: 'Offer Count', type: 'metric', dataType: 'number' },
  { id: 'hires_count', label: 'Hire Count', type: 'metric', dataType: 'number' },
  { id: 'time_to_hire', label: 'Average Time to Hire', type: 'metric', dataType: 'number' },
  { id: 'conversion_rate', label: 'Conversion Rate', type: 'metric', dataType: 'number' },
  { id: 'cost_per_hire', label: 'Cost per Hire', type: 'metric', dataType: 'number' },
];

// TODO: Replace with actual report data from API
const generateSampleData = (_config: ReportConfig): any[] => {
  return [];
};

const WIZARD_STEPS: WizardStep[] = [
  { id: 'build', label: 'Build', description: 'Select fields and chart type' },
  { id: 'preview', label: 'Preview', description: 'Review your report' },
  { id: 'schedule', label: 'Schedule', description: 'Set up delivery', skippable: true },
];

const inputClass =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-[2px] bg-white dark:bg-charcoal text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/30 focus:border-primary';

const labelClass =
  'block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em] mb-1.5';

interface CustomReportBuilderProps {
  className?: string;
  onSave?: (config: ReportConfig) => void;
}

const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  className = '',
  onSave,
}) => {
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    id: '',
    name: 'Untitled Report',
    description: '',
    dimensions: [],
    metrics: [],
    filters: [],
    visualization: 'table',
    dateRange: { start: '', end: '' },
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [draggedField, setDraggedField] = useState<ReportField | null>(null);
  const [scheduleFrequency, setScheduleFrequency] = useState('manual');
  const [scheduleEmail, setScheduleEmail] = useState('');

  const dimensionFields = availableFields.filter(f => f.type === 'dimension');
  const metricFields = availableFields.filter(f => f.type === 'metric');

  const sampleData = useMemo(() => {
    if (reportConfig.dimensions.length === 0 || reportConfig.metrics.length === 0) {
      return [];
    }
    return generateSampleData(reportConfig);
  }, [reportConfig]);

  const handleDragStart = (field: ReportField) => {
    setDraggedField(field);
  };

  const handleDrop = (area: 'dimensions' | 'metrics') => {
    if (!draggedField) return;

    if (area === 'dimensions' && draggedField.type === 'dimension') {
      if (!reportConfig.dimensions.includes(draggedField.id)) {
        setReportConfig(prev => ({
          ...prev,
          dimensions: [...prev.dimensions, draggedField.id],
        }));
      }
    } else if (area === 'metrics' && draggedField.type === 'metric') {
      if (!reportConfig.metrics.includes(draggedField.id)) {
        setReportConfig(prev => ({
          ...prev,
          metrics: [...prev.metrics, draggedField.id],
        }));
      }
    }

    setDraggedField(null);
  };

  const removeField = (area: 'dimensions' | 'metrics', fieldId: string) => {
    setReportConfig(prev => ({
      ...prev,
      [area]: prev[area].filter(id => id !== fieldId),
    }));
  };

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: availableFields[0].id,
      operator: 'equals',
      value: '',
    };

    setReportConfig(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter],
    }));
  };

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.map(filter =>
        filter.id === filterId ? { ...filter, ...updates } : filter
      ),
    }));
  };

  const removeFilter = (filterId: string) => {
    setReportConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(filter => filter.id !== filterId),
    }));
  };

  const canProceedFromStep = (step: number): boolean => {
    switch (step) {
      case 0: // Build
        return reportConfig.name.trim().length > 0 &&
          (reportConfig.dimensions.length > 0 || reportConfig.metrics.length > 0);
      case 1: // Preview
        return true;
      case 2: // Schedule
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

  const renderVisualization = () => {
    if (sampleData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          Add dimensions and metrics to see preview
        </div>
      );
    }

    const xKey = reportConfig.dimensions[0];
    const yKey = reportConfig.metrics[0];

    switch (reportConfig.visualization) {
      case 'line':
        return (
          <RecruitmentLineChart
            data={sampleData}
            xKey={xKey}
            yKey={yKey}
            height={300}
          />
        );
      case 'bar':
        return (
          <RecruitmentBarChart
            data={sampleData}
            xKey={xKey}
            yKey={yKey}
            height={300}
          />
        );
      case 'pie':
        return (
          <RecruitmentPieChart
            data={sampleData}
            dataKey={yKey}
            nameKey={xKey}
            height={300}
          />
        );
      default:
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-off-white dark:bg-gray-800">
                <tr>
                  {[...reportConfig.dimensions, ...reportConfig.metrics].map(fieldId => {
                    const field = availableFields.find(f => f.id === fieldId);
                    return (
                      <th key={fieldId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-[0.05em]">
                        {field?.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-charcoal divide-y divide-gray-200 dark:divide-gray-700">
                {sampleData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {[...reportConfig.dimensions, ...reportConfig.metrics].map(fieldId => (
                      <td key={fieldId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {row[fieldId]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  const renderBuildStep = () => (
    <div className="space-y-6">
      {/* Report Name & Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Report Name</label>
          <input
            type="text"
            value={reportConfig.name}
            onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
            className={inputClass}
            placeholder="Report Name"
          />
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input
            type="text"
            value={reportConfig.description}
            onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
            className={inputClass}
            placeholder="Add description..."
          />
        </div>
      </div>

      {/* Field Selection via Drag & Drop */}
      <div className="grid grid-cols-12 gap-6">
        {/* Field Library */}
        <div className="col-span-12 lg:col-span-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Available Fields</h4>

          <div className="space-y-4">
            <div>
              <h5 className={labelClass}>Dimensions</h5>
              <div className="space-y-1">
                {dimensionFields.map(field => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(field)}
                    className="p-2 text-sm text-gray-600 dark:text-gray-400 bg-off-white dark:bg-gray-800 rounded-[2px] cursor-move hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {field.label}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h5 className={labelClass}>Metrics</h5>
              <div className="space-y-1">
                {metricFields.map(field => (
                  <div
                    key={field.id}
                    draggable
                    onDragStart={() => handleDragStart(field)}
                    className="p-2 text-sm text-gray-600 dark:text-gray-400 bg-off-white dark:bg-gray-800 rounded-[2px] cursor-move hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {field.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Drop Areas */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Dimensions</h4>
              <div
                className="min-h-24 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-[2px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop('dimensions')}
              >
                {reportConfig.dimensions.map(dimId => {
                  const field = availableFields.find(f => f.id === dimId);
                  return (
                    <div key={dimId} className="flex items-center justify-between bg-primary/10 text-primary px-3 py-2 rounded-[2px] mb-2">
                      <span className="text-sm">{field?.label}</span>
                      <button onClick={() => removeField('dimensions', dimId)}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {reportConfig.dimensions.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Drag dimensions here</p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Metrics</h4>
              <div
                className="min-h-24 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-[2px]"
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop('metrics')}
              >
                {reportConfig.metrics.map(metricId => {
                  const field = availableFields.find(f => f.id === metricId);
                  return (
                    <div key={metricId} className="flex items-center justify-between bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-[2px] mb-2">
                      <span className="text-sm">{field?.label}</span>
                      <button onClick={() => removeField('metrics', metricId)}>
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                {reportConfig.metrics.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Drag metrics here</p>
                )}
              </div>
            </div>
          </div>

          {/* Visualization Type */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Visualization</h4>
            <div className="flex gap-2">
              {[
                { id: 'table', label: 'Table', icon: TableCellsIcon },
                { id: 'line', label: 'Line Chart', icon: ChartBarIcon },
                { id: 'bar', label: 'Bar Chart', icon: ChartBarIcon },
                { id: 'pie', label: 'Pie Chart', icon: ChartBarIcon },
              ].map(viz => (
                <button
                  key={viz.id}
                  onClick={() => setReportConfig(prev => ({ ...prev, visualization: viz.id as any }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm transition-colors ${
                    reportConfig.visualization === viz.id
                      ? 'bg-cta text-deep-navy font-semibold'
                      : 'bg-off-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <viz.icon className="w-4 h-4" />
                  {viz.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filters</h4>
              <button
                onClick={addFilter}
                className="flex items-center gap-1 px-3 py-1 text-sm text-primary hover:bg-primary/5 rounded-full transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Add Filter
              </button>
            </div>

            {reportConfig.filters.map(filter => (
              <div key={filter.id} className="flex items-center gap-2 mb-2">
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                  className={inputClass}
                >
                  {availableFields.map(field => (
                    <option key={field.id} value={field.id}>
                      {field.label}
                    </option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                  className={inputClass}
                >
                  <option value="equals">Equals</option>
                  <option value="not_equals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greater_than">Greater Than</option>
                  <option value="less_than">Less Than</option>
                </select>

                <input
                  type="text"
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                  className={inputClass}
                  placeholder="Value"
                />

                <button
                  onClick={() => removeFilter(filter.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-[2px] transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewStep = () => (
    <div>
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Report Preview</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Preview based on sample data. Actual report will use live data.
        </p>
      </div>
      <div className="border border-gray-200 dark:border-gray-700 rounded-[2px] p-4">
        {renderVisualization()}
      </div>

      {/* Summary of selections */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <ReviewCard label="Dimensions" value={reportConfig.dimensions.length > 0 ? reportConfig.dimensions.map(d => availableFields.find(f => f.id === d)?.label).join(', ') : 'None selected'} />
        <ReviewCard label="Metrics" value={reportConfig.metrics.length > 0 ? reportConfig.metrics.map(m => availableFields.find(f => f.id === m)?.label).join(', ') : 'None selected'} />
        <ReviewCard label="Chart Type" value={reportConfig.visualization.charAt(0).toUpperCase() + reportConfig.visualization.slice(1)} />
        <ReviewCard label="Filters" value={reportConfig.filters.length > 0 ? `${reportConfig.filters.length} active` : 'None'} />
      </div>
    </div>
  );

  const renderScheduleStep = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Schedule & Delivery</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Delivery Frequency</label>
          <select
            value={scheduleFrequency}
            onChange={(e) => setScheduleFrequency(e.target.value)}
            className={inputClass}
          >
            <option value="manual">Manual Only</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Email Recipients</label>
          <input
            type="email"
            value={scheduleEmail}
            onChange={(e) => setScheduleEmail(e.target.value)}
            placeholder="Enter email addresses"
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBuildStep();
      case 1:
        return renderPreviewStep();
      case 2:
        return renderScheduleStep();
      default:
        return null;
    }
  };

  const saveFooter = currentStep === WIZARD_STEPS.length - 1 ? (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        Back
      </button>
      <div className="flex items-center gap-2">
        <button
          className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ShareIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onSave?.(reportConfig)}
          className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold bg-cta text-deep-navy rounded-full hover:bg-cta/90 transition-colors"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          Save Report
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
        subtitle="Build, preview, and schedule custom recruitment reports"
        footer={saveFooter}
      >
        {renderStepContent()}
      </WizardShell>
    </div>
  );
};

function ReviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-off-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-[2px] p-3">
      <div className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-[0.05em] mb-1">
        {label}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {value}
      </div>
    </div>
  );
}

export default CustomReportBuilder;
