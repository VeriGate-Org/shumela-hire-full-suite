'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { reportExportService, ReportExportJob } from '@/services/reportExportService';
import {
  DocumentArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const REPORT_TYPES = [
  { value: 'EMPLOYEE_ROSTER', label: 'Employee Roster', description: 'Complete list of all active employees' },
  { value: 'HEADCOUNT', label: 'Headcount Report', description: 'Headcount by department, division, and location' },
  { value: 'TURNOVER', label: 'Turnover Report', description: 'Employee turnover analysis and trends' },
  { value: 'LEAVE_BALANCES', label: 'Leave Balances', description: 'All employee leave balances and usage' },
  { value: 'TRAINING_COMPLETION', label: 'Training Completion', description: 'Training course completion rates' },
  { value: 'CERTIFICATIONS', label: 'Certifications Report', description: 'Employee certifications and expiry tracking' },
  { value: 'RECRUITMENT_PIPELINE', label: 'Recruitment Pipeline', description: 'Active recruitment pipeline status' },
  { value: 'DIVERSITY', label: 'Diversity Report', description: 'Workforce diversity and EE statistics' },
  { value: 'ATTENDANCE', label: 'Attendance Report', description: 'Employee attendance and time tracking' },
  { value: 'PAYROLL_SUMMARY', label: 'Payroll Summary', description: 'Monthly payroll summary report' },
];

const FORMAT_OPTIONS = [
  { value: 'PDF', label: 'PDF', icon: '📄' },
  { value: 'EXCEL', label: 'Excel', icon: '📊' },
  { value: 'CSV', label: 'CSV', icon: '📋' },
];

export default function ReportExportPage() {
  const [jobs, setJobs] = useState<ReportExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedReport, setSelectedReport] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('PDF');

  // TODO: Get from auth context
  const employeeId = 1;

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    const data = await reportExportService.getJobs(employeeId);
    setJobs(data);
    setLoading(false);
  };

  const handleExport = async () => {
    if (!selectedReport) {
      alert('Please select a report type');
      return;
    }
    setExporting(true);
    try {
      await reportExportService.exportReport({
        reportType: selectedReport,
        format: selectedFormat,
        requestedBy: employeeId,
      });
      loadJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to export report');
    } finally {
      setExporting(false);
    }
  };

  const statusConfig: Record<string, { icon: typeof CheckCircleIcon; color: string; label: string }> = {
    QUEUED: { icon: ClockIcon, color: 'text-yellow-600', label: 'Queued' },
    PROCESSING: { icon: CogIcon, color: 'text-blue-600', label: 'Processing' },
    COMPLETED: { icon: CheckCircleIcon, color: 'text-green-600', label: 'Completed' },
    FAILED: { icon: XCircleIcon, color: 'text-red-600', label: 'Failed' },
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <FeatureGate feature="REPORT_EXPORT">
      <PageWrapper
        title="Report Export"
        subtitle="Generate and download HR reports"
      >
        <div className="space-y-6">
          {/* Export Form */}
          <div className="bg-white rounded-lg shadow border p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Generate New Report</h3>

            {/* Report Type Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Select Report Type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {REPORT_TYPES.map(report => (
                  <button
                    key={report.value}
                    type="button"
                    onClick={() => setSelectedReport(report.value)}
                    className={`text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedReport === report.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">{report.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{report.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">Export Format</label>
              <div className="flex gap-3">
                {FORMAT_OPTIONS.map(format => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => setSelectedFormat(format.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                      selectedFormat === format.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={handleExport}
                disabled={!selectedReport || exporting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="w-4 h-4" /> Export Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Export History */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Export History</h3>
                <button onClick={loadJobs} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  <ArrowPathIcon className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading export history...</div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No exports yet. Generate your first report above.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Format</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map(job => {
                    const status = statusConfig[job.status] || statusConfig.QUEUED;
                    const StatusIcon = status.icon;
                    return (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium text-gray-900">
                            {REPORT_TYPES.find(r => r.value === job.reportType)?.label || job.reportType}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                            {job.format}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-xs font-medium">{status.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatFileSize(job.fileSize)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(job.createdAt).toLocaleString('en-ZA')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {job.status === 'COMPLETED' && job.fileUrl && (
                            <a href={job.fileUrl} download
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-medium">
                              <DocumentArrowDownIcon className="w-4 h-4" /> Download
                            </a>
                          )}
                          {job.status === 'FAILED' && job.errorMessage && (
                            <span className="text-xs text-red-500" title={job.errorMessage}>Error</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
