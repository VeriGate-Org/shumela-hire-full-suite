import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import AdvancedReportBuilder from './AdvancedReportBuilder';

interface ReportType {
  name: string;
  description: string;
  fields: string[];
}

interface ReportConfig {
  reportType: string;
  startDate: string;
  endDate: string;
  status?: string;
  fields?: string[];
  filters?: Record<string, string>;
}

interface ScheduledReport {
  id: number;
  reportType: string;
  frequency: string;
  nextRun: string;
  status: string;
}

const ReportingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [reportTypes, setReportTypes] = useState<Record<string, ReportType>>({});
  const [selectedReportType, setSelectedReportType] = useState('');
  const [reportConfig, setReportConfig] = useState<ReportConfig>({
    reportType: '',
    startDate: '',
    endDate: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);
  const [bulkExportConfig, setBulkExportConfig] = useState({
    reportTypes: [] as string[],
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchReportTypes();
    fetchScheduledReports();
  }, []);

  const fetchReportTypes = async () => {
    try {
      const response = await apiFetch('/api/reports/types');
      const data = await response.json();
      setReportTypes(data);
    } catch (error) {
      console.error('Error fetching report types:', error);
    }
  };

  const fetchScheduledReports = async () => {
    try {
      const response = await apiFetch('/api/reports/scheduled');
      const data = await response.json();
      setScheduledReports(data);
    } catch (error) {
      console.error('Error fetching scheduled reports:', error);
    }
  };

  const handleGenerateReport = async (reportType: string, format: string = 'csv') => {
    setIsGenerating(true);
    try {
      const params = new URLSearchParams();
      if (reportConfig.startDate) params.append('startDate', reportConfig.startDate);
      if (reportConfig.endDate) params.append('endDate', reportConfig.endDate);
      if (reportConfig.status) params.append('status', reportConfig.status);

      const pathMap: Record<string, string> = {
        applications: `/api/reports/applications/csv?${params}`,
        interviews: `/api/reports/interviews/csv?${params}`,
        applicants: '/api/reports/applicants/csv',
        performance: `/api/reports/performance/csv?${params}`,
        trends: '/api/reports/hiring-trends/csv',
        executive: `/api/reports/executive-summary/csv?${params}`,
      };

      const path = pathMap[reportType];
      if (!path) throw new Error('Unknown report type');

      const response = await apiFetch(path);
      if (!response.ok) throw new Error('Failed to generate report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}_report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvancedReport = async (advancedConfig: any) => {
    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/reports/custom/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(advancedConfig),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `advanced_${advancedConfig.reportType}_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate advanced report');
      }
    } catch (error) {
      console.error('Error generating advanced report:', error);
      alert('Error generating advanced report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomReport = async () => {
    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/reports/custom/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportConfig),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `custom_${reportConfig.reportType}_report.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate custom report');
      }
    } catch (error) {
      console.error('Error generating custom report:', error);
      alert('Error generating custom report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBulkExport = async () => {
    setIsGenerating(true);
    try {
      const response = await apiFetch('/api/reports/bulk/zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkExportConfig),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bulk_reports_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate bulk export');
      }
    } catch (error) {
      console.error('Error generating bulk export:', error);
      alert('Error generating bulk export. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewReport = async (reportType: string) => {
    try {
      const params = new URLSearchParams();
      if (reportConfig.startDate) params.append('startDate', reportConfig.startDate);
      if (reportConfig.endDate) params.append('endDate', reportConfig.endDate);
      params.append('limit', '5');

      const response = await apiFetch(`/api/reports/preview/${reportType}?${params}`);
      const data = await response.json();
      setPreviewData(data);
    } catch (error) {
      console.error('Error previewing report:', error);
    }
  };

  const QuickReportsSection = () => (
    <div className="bg-white rounded-sm shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(reportTypes).map(([key, reportType]) => (
          <div key={key} className="border border-gray-200 rounded-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">{reportType.name}</h4>
              <span className="text-xs text-gray-500 uppercase tracking-wide">{key}</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{reportType.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerateReport(key)}
                disabled={isGenerating}
                className="flex-1 bg-gold-500 text-violet-950 px-3 py-2 rounded text-sm hover:bg-gold-600 disabled:bg-gray-400 transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Download CSV'}
              </button>
              <button
                onClick={() => handlePreviewReport(key)}
                className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const CustomReportSection = () => (
    <div className="bg-white rounded-sm shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Report Builder</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportConfig.reportType}
              onChange={(e) => setReportConfig({ ...reportConfig, reportType: e.target.value })}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            >
              <option value="">Select Report Type</option>
              {Object.entries(reportTypes).map(([key, reportType]) => (
                <option key={key} value={key}>{reportType.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={reportConfig.startDate}
                onChange={(e) => setReportConfig({ ...reportConfig, startDate: e.target.value })}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={reportConfig.endDate}
                onChange={(e) => setReportConfig({ ...reportConfig, endDate: e.target.value })}
                className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
              />
            </div>
          </div>

          {reportConfig.reportType && reportTypes[reportConfig.reportType] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Fields</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {reportTypes[reportConfig.reportType].fields.map((field) => (
                  <label key={field} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.fields?.includes(field) || false}
                      onChange={(e) => {
                        const currentFields = reportConfig.fields || [];
                        if (e.target.checked) {
                          setReportConfig({ ...reportConfig, fields: [...currentFields, field] });
                        } else {
                          setReportConfig({ ...reportConfig, fields: currentFields.filter(f => f !== field) });
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 capitalize">{field.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCustomReport}
              disabled={!reportConfig.reportType || isGenerating}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Custom Report'}
            </button>
            <button
              onClick={() => reportConfig.reportType && handlePreviewReport(reportConfig.reportType)}
              disabled={!reportConfig.reportType}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:bg-gray-100 transition-colors"
            >
              Preview
            </button>
          </div>
        </div>

        {previewData && (
          <div className="border border-gray-200 rounded-sm p-4">
            <h4 className="font-medium text-gray-900 mb-3">Report Preview</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Type:</span> {previewData.reportType}</p>
              <p><span className="font-medium">Estimated Rows:</span> {previewData.estimatedRows}</p>
              <p><span className="font-medium">Available Fields:</span> {previewData.availableFields?.join(', ')}</p>
            </div>
            
            {previewData.sampleData && previewData.sampleData.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-800 mb-2">Sample Data:</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(previewData.sampleData[0]).map((key) => (
                          <th key={key} className="px-2 py-1 text-left font-medium text-gray-700 capitalize">
                            {key.replace('_', ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.sampleData.map((row: any, index: number) => (
                        <tr key={index} className="border-t border-gray-200">
                          {Object.values(row).map((value: any, cellIndex) => (
                            <td key={cellIndex} className="px-2 py-1 text-gray-600">
                              {value || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const BulkExportSection = () => (
    <div className="bg-white rounded-sm shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Export</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Report Types</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(reportTypes).map(([key, reportType]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={bulkExportConfig.reportTypes.includes(key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBulkExportConfig({
                        ...bulkExportConfig,
                        reportTypes: [...bulkExportConfig.reportTypes, key]
                      });
                    } else {
                      setBulkExportConfig({
                        ...bulkExportConfig,
                        reportTypes: bulkExportConfig.reportTypes.filter(type => type !== key)
                      });
                    }
                  }}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700">{reportType.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input
              type="date"
              value={bulkExportConfig.startDate}
              onChange={(e) => setBulkExportConfig({ ...bulkExportConfig, startDate: e.target.value })}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <input
              type="date"
              value={bulkExportConfig.endDate}
              onChange={(e) => setBulkExportConfig({ ...bulkExportConfig, endDate: e.target.value })}
              className="w-full border border-gray-300 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold-500/60"
            />
          </div>
        </div>

        <button
          onClick={handleBulkExport}
          disabled={bulkExportConfig.reportTypes.length === 0 || isGenerating}
          className="w-full bg-gold-500 text-violet-950 px-4 py-3 rounded hover:bg-gold-600 disabled:bg-gray-400 transition-colors"
        >
          {isGenerating ? 'Generating Bulk Export...' : `Export ${bulkExportConfig.reportTypes.length} Reports as ZIP`}
        </button>
      </div>
    </div>
  );

  const AdvancedReportsSection = () => (
    <div className="space-y-6">
      <AdvancedReportBuilder
        onGenerateReport={handleAdvancedReport}
        reportTypes={reportTypes}
        isGenerating={isGenerating}
      />
    </div>
  );

  const ScheduledReportsSection = () => (
    <div className="bg-white rounded-sm shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Scheduled Reports</h3>
        <button className="bg-gold-500 text-violet-950 px-3 py-1 rounded text-sm hover:bg-gold-600 transition-colors">
          New Schedule
        </button>
      </div>

      {scheduledReports.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No scheduled reports yet.</p>
          <p className="text-sm mt-1">Create automated reports to run on a schedule.</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Report Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Frequency</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Next Run</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {scheduledReports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm text-gray-900 capitalize">{report.reportType}</td>
                  <td className="px-4 py-2 text-sm text-gray-600 capitalize">{report.frequency}</td>
                  <td className="px-4 py-2 text-sm text-gray-600">{new Date(report.nextRun).toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      report.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <button className="text-gold-600 hover:text-gold-800 mr-2 rounded-full">Edit</button>
                    <button className="text-red-600 hover:text-red-800 rounded-full">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reporting & Export</h1>
        <p className="mt-2 text-gray-600">Generate, export, and schedule comprehensive recruitment reports</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'generate', label: 'Quick Reports', icon: '📊' },
            { id: 'custom', label: 'Custom Builder', icon: '🔧' },
            { id: 'advanced', label: 'Advanced Builder', icon: '🎛️' },
            { id: 'bulk', label: 'Bulk Export', icon: '📦' },
            { id: 'scheduled', label: 'Scheduled', icon: '⏰' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'generate' && <QuickReportsSection />}
        {activeTab === 'custom' && <CustomReportSection />}
        {activeTab === 'advanced' && <AdvancedReportsSection />}
        {activeTab === 'bulk' && <BulkExportSection />}
        {activeTab === 'scheduled' && <ScheduledReportsSection />}
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gold-50 border border-violet-200 rounded-sm p-6">
        <h3 className="text-lg font-medium text-violet-900 mb-2">📖 Reporting Help</h3>
        <div className="text-sm text-violet-800 space-y-1">
          <p>• <strong>Quick Reports:</strong> Download pre-configured reports instantly</p>
          <p>• <strong>Custom Builder:</strong> Select specific fields and date ranges for tailored reports</p>
          <p>• <strong>Advanced Builder:</strong> Full-featured report builder with filtering, grouping, and sorting</p>
          <p>• <strong>Bulk Export:</strong> Download multiple reports together as a ZIP file</p>
          <p>• <strong>Scheduled:</strong> Set up automated reports to run on a recurring schedule</p>
        </div>
      </div>
    </div>
  );
};

export default ReportingDashboard;
