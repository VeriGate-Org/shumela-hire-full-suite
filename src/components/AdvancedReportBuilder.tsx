import React, { useState } from 'react';

interface AdvancedReportConfig {
  reportType: string;
  dateRange: {
    startDate: string;
    endDate: string;
    preset?: string;
  };
  filters: {
    status?: string[];
    jobTitles?: string[];
    departments?: string[];
    sources?: string[];
    ratingRange?: {
      min: number;
      max: number;
    };
  };
  fields: string[];
  format: 'csv' | 'excel' | 'pdf';
  groupBy?: string[];
  sortBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  includeCharts?: boolean;
  includeAnalytics?: boolean;
}

interface AdvancedReportBuilderProps {
  onGenerateReport: (config: AdvancedReportConfig) => void;
  reportTypes: Record<string, any>;
  isGenerating: boolean;
}

const AdvancedReportBuilder: React.FC<AdvancedReportBuilderProps> = ({
  onGenerateReport,
  reportTypes,
  isGenerating
}) => {
  const [config, setConfig] = useState<AdvancedReportConfig>({
    reportType: '',
    dateRange: {
      startDate: '',
      endDate: '',
    },
    filters: {},
    fields: [],
    format: 'csv',
  });

  const [activeSection, setActiveSection] = useState('basic');

  const datePresets = [
    { label: 'Last 7 days', value: 'last-7-days' },
    { label: 'Last 30 days', value: 'last-30-days' },
    { label: 'Last 3 months', value: 'last-3-months' },
    { label: 'Last 6 months', value: 'last-6-months' },
    { label: 'This year', value: 'this-year' },
    { label: 'Custom range', value: 'custom' },
  ];

  const statusOptions = [
    'SUBMITTED', 'SCREENING', 'PHONE_SCREEN', 'TECHNICAL', 
    'FINAL_ROUND', 'OFFER', 'HIRED', 'REJECTED'
  ];

  const sourceOptions = [
    'LinkedIn', 'Company Website', 'Indeed', 'Glassdoor', 
    'Job Board', 'Referral', 'Career Fair', 'Direct Application'
  ];

  const handleDatePresetChange = (preset: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (preset) {
      case 'last-7-days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last-30-days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-3-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'last-6-months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    setConfig({
      ...config,
      dateRange: {
        ...config.dateRange,
        preset,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      }
    });
  };

  const toggleField = (field: string) => {
    const currentFields = config.fields;
    if (currentFields.includes(field)) {
      setConfig({
        ...config,
        fields: currentFields.filter(f => f !== field)
      });
    } else {
      setConfig({
        ...config,
        fields: [...currentFields, field]
      });
    }
  };

  const toggleFilterValue = (filterType: string, value: string) => {
    const currentFilters = { ...config.filters };
    const currentValues = (currentFilters[filterType as keyof typeof currentFilters] as string[]) || [];
    
    if (currentValues.includes(value)) {
      currentFilters[filterType as keyof typeof currentFilters] = currentValues.filter(v => v !== value) as any;
    } else {
      currentFilters[filterType as keyof typeof currentFilters] = [...currentValues, value] as any;
    }

    setConfig({ ...config, filters: currentFilters });
  };

  const BasicConfiguration = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select
            value={config.reportType}
            onChange={(e) => setConfig({ ...config, reportType: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
          >
            <option value="">Select Report Type</option>
            {Object.entries(reportTypes).map(([key, reportType]) => (
              <option key={key} value={key}>{reportType.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Output Format</label>
          <select
            value={config.format}
            onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
          >
            <option value="csv">CSV</option>
            <option value="excel">Excel (Coming Soon)</option>
            <option value="pdf">PDF (Coming Soon)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          {datePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleDatePresetChange(preset.value)}
              className={`px-3 py-1 text-sm rounded border ${
                config.dateRange.preset === preset.value
                  ? 'bg-violet-500 text-white border-violet-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input
              type="date"
              value={config.dateRange.startDate}
              onChange={(e) => setConfig({
                ...config,
                dateRange: { ...config.dateRange, startDate: e.target.value, preset: 'custom' }
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={config.dateRange.endDate}
              onChange={(e) => setConfig({
                ...config,
                dateRange: { ...config.dateRange, endDate: e.target.value, preset: 'custom' }
              })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const FieldSelection = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Select Fields to Include</label>
        {config.reportType && reportTypes[config.reportType] && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
            {reportTypes[config.reportType].fields.map((field: string) => (
              <label key={field} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.fields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {field.replace(/_/g, ' ')}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {config.fields.length > 0 && (
        <div className="bg-violet-50 p-3 rounded-md">
          <div className="text-sm font-medium text-violet-900 mb-2">Selected Fields ({config.fields.length}):</div>
          <div className="flex flex-wrap gap-2">
            {config.fields.map((field) => (
              <span
                key={field}
                className="inline-flex items-center px-2 py-1 bg-violet-100 text-violet-800 text-xs rounded-full"
              >
                {field.replace(/_/g, ' ')}
                <button
                  onClick={() => toggleField(field)}
                  className="ml-1 text-violet-600 hover:text-violet-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const FiltersConfiguration = () => (
    <div className="space-y-6">
      {config.reportType === 'applications' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Application Status</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statusOptions.map((status) => (
                <label key={status} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.filters.status?.includes(status) || false}
                    onChange={() => toggleFilterValue('status', status)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {status.replace(/_/g, ' ').toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Application Source</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {sourceOptions.map((source) => (
                <label key={source} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={config.filters.sources?.includes(source) || false}
                    onChange={() => toggleFilterValue('sources', source)}
                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
                  />
                  <span className="text-sm text-gray-700">{source}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Rating Range</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Minimum Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.filters.ratingRange?.min || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: {
                      ...config.filters,
                      ratingRange: {
                        ...config.filters.ratingRange,
                        min: Number(e.target.value),
                        max: config.filters.ratingRange?.max || 5
                      }
                    }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Maximum Rating</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={config.filters.ratingRange?.max || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    filters: {
                      ...config.filters,
                      ratingRange: {
                        min: config.filters.ratingRange?.min || 1,
                        max: Number(e.target.value)
                      }
                    }
                  })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const AdvancedOptions = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
          <select
            value={config.groupBy?.[0] || ''}
            onChange={(e) => setConfig({
              ...config,
              groupBy: e.target.value ? [e.target.value] : undefined
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
          >
            <option value="">No Grouping</option>
            <option value="status">Status</option>
            <option value="job_title">Job Title</option>
            <option value="source">Source</option>
            <option value="month">Month</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <div className="flex space-x-2">
            <select
              value={config.sortBy?.field || ''}
              onChange={(e) => setConfig({
                ...config,
                sortBy: e.target.value ? {
                  field: e.target.value,
                  direction: config.sortBy?.direction || 'desc'
                } : undefined
              })}
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            >
              <option value="">Default Order</option>
              <option value="submitted_date">Date</option>
              <option value="rating">Rating</option>
              <option value="applicant_name">Name</option>
            </select>
            <select
              value={config.sortBy?.direction || 'desc'}
              onChange={(e) => setConfig({
                ...config,
                sortBy: config.sortBy ? {
                  ...config.sortBy,
                  direction: e.target.value as 'asc' | 'desc'
                } : undefined
              })}
              disabled={!config.sortBy?.field}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/60 disabled:bg-gray-100"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Additional Options</label>
        <div className="space-y-3">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.includeCharts || false}
              onChange={(e) => setConfig({ ...config, includeCharts: e.target.checked })}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
            />
            <span className="text-sm text-gray-700">Include Charts and Visualizations</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.includeAnalytics || false}
              onChange={(e) => setConfig({ ...config, includeAnalytics: e.target.checked })}
              className="rounded border-gray-300 text-violet-600 focus:ring-violet-500/60"
            />
            <span className="text-sm text-gray-700">Include Summary Analytics</span>
          </label>
        </div>
      </div>
    </div>
  );

  const ConfigurationSummary = () => (
    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
      <h4 className="font-medium text-gray-900">Report Configuration Summary</h4>
      <div className="text-sm space-y-1">
        <div><span className="font-medium">Type:</span> {config.reportType ? reportTypes[config.reportType]?.name : 'Not selected'}</div>
        <div><span className="font-medium">Date Range:</span> {config.dateRange.startDate} to {config.dateRange.endDate}</div>
        <div><span className="font-medium">Fields:</span> {config.fields.length} selected</div>
        <div><span className="font-medium">Format:</span> {config.format.toUpperCase()}</div>
        {config.filters.status && <div><span className="font-medium">Status Filters:</span> {config.filters.status.length} selected</div>}
        {config.groupBy && <div><span className="font-medium">Group By:</span> {config.groupBy[0]}</div>}
      </div>
      
      <button
        onClick={() => onGenerateReport(config)}
        disabled={!config.reportType || !config.dateRange.startDate || !config.dateRange.endDate || config.fields.length === 0 || isGenerating}
        className="w-full bg-violet-600 text-white px-4 py-2 rounded hover:bg-violet-700 disabled:bg-gray-400 transition-colors"
      >
        {isGenerating ? 'Generating Advanced Report...' : 'Generate Advanced Report'}
      </button>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Report Builder</h3>
      
      {/* Section Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-6">
          {[
            { id: 'basic', label: 'Basic', icon: '⚙️' },
            { id: 'fields', label: 'Fields', icon: '📋' },
            { id: 'filters', label: 'Filters', icon: '🔍' },
            { id: 'advanced', label: 'Advanced', icon: '🎯' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === section.id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{section.icon}</span>
              {section.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {activeSection === 'basic' && <BasicConfiguration />}
          {activeSection === 'fields' && <FieldSelection />}
          {activeSection === 'filters' && <FiltersConfiguration />}
          {activeSection === 'advanced' && <AdvancedOptions />}
        </div>
        
        <div className="lg:col-span-1">
          <ConfigurationSummary />
        </div>
      </div>
    </div>
  );
};

export default AdvancedReportBuilder;
