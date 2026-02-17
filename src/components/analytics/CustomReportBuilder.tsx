import React, { useState, useMemo } from 'react';
import {
  PlusIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ChartBarIcon,
  TableCellsIcon,
  EyeIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { RecruitmentLineChart, RecruitmentBarChart, RecruitmentPieChart } from '../charts';

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

// Sample data for preview
const generateSampleData = (config: ReportConfig) => {
  const sampleData = [];
  for (let i = 0; i < 10; i++) {
    const dataPoint: any = {};
    
    config.dimensions.forEach(dim => {
      const field = availableFields.find(f => f.id === dim);
      if (field) {
        switch (dim) {
          case 'department':
            dataPoint[dim] = ['Engineering', 'Product', 'Design', 'Marketing'][i % 4];
            break;
          case 'source':
            dataPoint[dim] = ['LinkedIn', 'Indeed', 'Referrals', 'Company Site'][i % 4];
            break;
          default:
            dataPoint[dim] = `${field.label} ${i + 1}`;
        }
      }
    });
    
    config.metrics.forEach(metric => {
      switch (metric) {
        case 'applications_count':
          dataPoint[metric] = Math.floor(Math.random() * 100) + 20;
          break;
        case 'conversion_rate':
          dataPoint[metric] = Math.random() * 25 + 5;
          break;
        case 'time_to_hire':
          dataPoint[metric] = Math.floor(Math.random() * 30) + 15;
          break;
        default:
          dataPoint[metric] = Math.floor(Math.random() * 50) + 10;
      }
    });
    
    sampleData.push(dataPoint);
  }
  return sampleData;
};

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

  const [activeTab, setActiveTab] = useState<'build' | 'preview' | 'schedule'>('build');
  const [draggedField, setDraggedField] = useState<ReportField | null>(null);

  const dimensionFields = availableFields.filter(f => f.type === 'dimension');
  const metricFields = availableFields.filter(f => f.type === 'metric');

  const sampleData = useMemo(() => {
    if (reportConfig.dimensions.length === 0 || reportConfig.metrics.length === 0) {
      return [];
    }
    return generateSampleData(reportConfig);
  }, [reportConfig.dimensions, reportConfig.metrics, reportConfig.filters]);

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

  const renderVisualization = () => {
    if (sampleData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[...reportConfig.dimensions, ...reportConfig.metrics].map(fieldId => {
                    const field = availableFields.find(f => f.id === fieldId);
                    return (
                      <th key={fieldId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {field?.label}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sampleData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {[...reportConfig.dimensions, ...reportConfig.metrics].map(fieldId => (
                      <td key={fieldId} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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

  return (
    <div className={`bg-white rounded-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <input
              type="text"
              value={reportConfig.name}
              onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
              className="text-xl font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0"
              placeholder="Report Name"
            />
            <textarea
              value={reportConfig.description}
              onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 text-sm text-gray-500 bg-transparent border-none p-0 resize-none focus:ring-0"
              placeholder="Add description..."
              rows={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
              <ShareIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => onSave?.(reportConfig)}
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 flex items-center gap-2"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              Save Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex px-6">
          {[
            { id: 'build', label: 'Build', icon: ChartBarIcon },
            { id: 'preview', label: 'Preview', icon: EyeIcon },
            { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'build' && (
          <div className="grid grid-cols-12 gap-6">
            {/* Field Library */}
            <div className="col-span-12 lg:col-span-3">
              <h4 className="font-medium text-gray-900 mb-3">Available Fields</h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Dimensions</h5>
                  <div className="space-y-1">
                    {dimensionFields.map(field => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(field)}
                        className="p-2 text-sm text-gray-600 bg-gray-50 rounded cursor-move hover:bg-gray-100"
                      >
                        {field.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Metrics</h5>
                  <div className="space-y-1">
                    {metricFields.map(field => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={() => handleDragStart(field)}
                        className="p-2 text-sm text-gray-600 bg-gray-50 rounded cursor-move hover:bg-gray-100"
                      >
                        {field.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Report Builder */}
            <div className="col-span-12 lg:col-span-9 space-y-6">
              {/* Drop Areas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Dimensions</h4>
                  <div
                    className="min-h-24 p-4 border-2 border-dashed border-gray-300 rounded-sm"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop('dimensions')}
                  >
                    {reportConfig.dimensions.map(dimId => {
                      const field = availableFields.find(f => f.id === dimId);
                      return (
                        <div key={dimId} className="flex items-center justify-between bg-gold-100 text-gold-800 px-3 py-2 rounded mb-2">
                          <span className="text-sm">{field?.label}</span>
                          <button onClick={() => removeField('dimensions', dimId)}>
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {reportConfig.dimensions.length === 0 && (
                      <p className="text-gray-500 text-sm">Drag dimensions here</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Metrics</h4>
                  <div
                    className="min-h-24 p-4 border-2 border-dashed border-gray-300 rounded-sm"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop('metrics')}
                  >
                    {reportConfig.metrics.map(metricId => {
                      const field = availableFields.find(f => f.id === metricId);
                      return (
                        <div key={metricId} className="flex items-center justify-between bg-green-100 text-green-800 px-3 py-2 rounded mb-2">
                          <span className="text-sm">{field?.label}</span>
                          <button onClick={() => removeField('metrics', metricId)}>
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {reportConfig.metrics.length === 0 && (
                      <p className="text-gray-500 text-sm">Drag metrics here</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Visualization Type */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Visualization</h4>
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm ${
                        reportConfig.visualization === viz.id
                          ? 'bg-gold-100 text-violet-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <h4 className="font-medium text-gray-900">Filters</h4>
                  <button
                    onClick={addFilter}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gold-600 hover:bg-gold-50 rounded"
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
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="Value"
                    />
                    
                    <button
                      onClick={() => removeFilter(filter.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'preview' && (
          <div>
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Report Preview</h4>
              <p className="text-sm text-gray-500">
                Preview based on sample data. Actual report will use live data.
              </p>
            </div>
            <div className="border border-gray-200 rounded-sm p-4">
              {renderVisualization()}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Schedule & Delivery</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Frequency
                </label>
                <select className="w-full border border-gray-300 rounded-sm px-3 py-2">
                  <option value="manual">Manual Only</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Recipients
                </label>
                <input
                  type="email"
                  placeholder="Enter email addresses"
                  className="w-full border border-gray-300 rounded-sm px-3 py-2"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomReportBuilder;
