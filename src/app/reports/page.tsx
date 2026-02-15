'use client';

import React, { useState, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import {
  ReportBuilder,
  ReportLibrary,
  ReportViewer,
  ReportScheduler,
  type ReportConfig,
  type ReportField,
  type SavedReport,
  type ReportResult,
  type ReportSchedule,
} from '../../components/reports';
import {
  PlusIcon,
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';

// Mock data for available fields
const AVAILABLE_FIELDS: ReportField[] = [
  // Candidate fields
  { id: 'candidate_name', name: 'Candidate Name', type: 'string', category: 'candidate' },
  { id: 'candidate_email', name: 'Email Address', type: 'string', category: 'candidate' },
  { id: 'candidate_phone', name: 'Phone Number', type: 'string', category: 'candidate' },
  { id: 'candidate_score', name: 'Candidate Score', type: 'number', category: 'candidate', aggregatable: true },
  { id: 'candidate_source', name: 'Application Source', type: 'string', category: 'candidate' },
  { id: 'candidate_experience_years', name: 'Years of Experience', type: 'number', category: 'candidate', aggregatable: true },
  
  // Position fields
  { id: 'position_title', name: 'Position Title', type: 'string', category: 'position' },
  { id: 'position_department', name: 'Department', type: 'string', category: 'position' },
  { id: 'position_level', name: 'Job Level', type: 'string', category: 'position' },
  { id: 'position_salary_min', name: 'Minimum Salary', type: 'number', category: 'position', aggregatable: true },
  { id: 'position_salary_max', name: 'Maximum Salary', type: 'number', category: 'position', aggregatable: true },
  
  // Timeline fields
  { id: 'application_date', name: 'Application Date', type: 'date', category: 'timeline' },
  { id: 'interview_date', name: 'Interview Date', type: 'date', category: 'timeline' },
  { id: 'offer_date', name: 'Offer Date', type: 'date', category: 'timeline' },
  { id: 'hire_date', name: 'Hire Date', type: 'date', category: 'timeline' },
  { id: 'time_to_hire', name: 'Time to Hire (days)', type: 'number', category: 'timeline', aggregatable: true },
  
  // Performance fields
  { id: 'applications_count', name: 'Total Applications', type: 'number', category: 'performance', aggregatable: true },
  { id: 'interviews_count', name: 'Interviews Conducted', type: 'number', category: 'performance', aggregatable: true },
  { id: 'offers_count', name: 'Offers Made', type: 'number', category: 'performance', aggregatable: true },
  { id: 'hires_count', name: 'Successful Hires', type: 'number', category: 'performance', aggregatable: true },
  { id: 'conversion_rate', name: 'Conversion Rate (%)', type: 'number', category: 'performance', aggregatable: true },
  { id: 'cost_per_hire', name: 'Cost per Hire', type: 'number', category: 'performance', aggregatable: true },
];

// Mock saved reports
const MOCK_SAVED_REPORTS: SavedReport[] = [
  {
    id: '1',
    name: 'Monthly Recruitment Summary',
    description: 'Comprehensive overview of recruitment activities and performance',
    fields: ['position_title', 'applications_count', 'interviews_count', 'hires_count', 'conversion_rate'],
    filters: [
      {
        id: 'filter1',
        field: 'application_date',
        operator: 'between',
        value: ['2024-01-01', '2024-01-31'],
        label: 'January 2024',
      },
    ],
    visualization: { type: 'table' },
    dateRange: { start: '2024-01-01', end: '2024-01-31' },
    schedule: {
      enabled: true,
      frequency: 'monthly',
      recipients: ['hr-manager@company.com', 'recruiter@company.com'],
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    createdBy: 'john.doe@company.com',
    isShared: true,
    lastRun: '2024-01-31T23:00:00Z',
    runCount: 5,
    tags: ['monthly', 'summary', 'performance'],
  },
  {
    id: '2',
    name: 'Source Effectiveness Analysis',
    description: 'Compare recruitment sources by conversion rates and quality',
    fields: ['candidate_source', 'applications_count', 'conversion_rate', 'candidate_score'],
    filters: [],
    visualization: { type: 'bar', xAxis: 'candidate_source', yAxis: 'conversion_rate' },
    dateRange: { start: '2024-01-01', end: '2024-12-31' },
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-25T11:15:00Z',
    createdBy: 'jane.smith@company.com',
    isShared: false,
    runCount: 12,
    tags: ['source', 'analysis', 'conversion'],
  },
  {
    id: '3',
    name: 'Time to Hire Trends',
    description: 'Track hiring speed across departments and positions',
    fields: ['position_department', 'position_title', 'time_to_hire', 'hire_date'],
    filters: [
      {
        id: 'filter2',
        field: 'hire_date',
        operator: 'greater_than',
        value: '2023-12-01',
        label: 'Recent hires',
      },
    ],
    visualization: { type: 'line', xAxis: 'hire_date', yAxis: 'time_to_hire' },
    dateRange: { start: '2023-12-01', end: '2024-01-31' },
    createdAt: '2024-01-05T16:45:00Z',
    updatedAt: '2024-01-28T08:20:00Z',
    createdBy: 'mike.johnson@company.com',
    isShared: true,
    lastRun: '2024-01-28T09:00:00Z',
    runCount: 8,
    tags: ['time-to-hire', 'trends', 'efficiency'],
  },
];

// Mock schedules
const MOCK_SCHEDULES: ReportSchedule[] = [
  {
    id: 'sched1',
    reportId: '1',
    reportName: 'Monthly Recruitment Summary',
    frequency: 'monthly',
    recipients: ['hr-manager@company.com', 'recruiter@company.com'],
    enabled: true,
    nextRun: '2024-02-29T23:00:00Z',
    lastRun: '2024-01-31T23:00:00Z',
    createdAt: '2024-01-15T10:00:00Z',
    runCount: 5,
    lastStatus: 'success',
  },
  {
    id: 'sched2',
    reportId: '3',
    reportName: 'Time to Hire Trends',
    frequency: 'weekly',
    recipients: ['operations@company.com'],
    enabled: false,
    nextRun: '2024-02-05T09:00:00Z',
    lastRun: '2024-01-28T09:00:00Z',
    createdAt: '2024-01-05T16:45:00Z',
    runCount: 8,
    lastStatus: 'success',
  },
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'results' | 'scheduler'>('create');
  const [savedReports, setSavedReports] = useState<SavedReport[]>(MOCK_SAVED_REPORTS);
  const [reportResults, setReportResults] = useState<ReportResult[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>(MOCK_SCHEDULES);
  const [currentResult, setCurrentResult] = useState<ReportResult | null>(null);
  const [editingReport, setEditingReport] = useState<SavedReport | null>(null);

  // Report Builder handlers
  const handleSaveReport = useCallback((config: ReportConfig) => {
    const newReport: SavedReport = {
      ...config,
      id: `report_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'current-user@company.com',
      isShared: false,
      runCount: 0,
      tags: [],
    };
    
    setSavedReports(prev => [...prev, newReport]);
    alert('Report saved successfully!');
  }, []);

  const handleRunReport = useCallback(async (config: ReportConfig) => {
    // Simulate report execution
    const startTime = Date.now();
    
    // Mock data generation based on selected fields
    const mockData = Array.from({ length: Math.floor(Math.random() * 100) + 20 }, (_, i) => {
      const row: any = {};
      config.fields.forEach(fieldId => {
        const field = AVAILABLE_FIELDS.find(f => f.id === fieldId);
        if (field) {
          switch (field.type) {
            case 'string':
              if (fieldId.includes('name')) {
                row[fieldId] = `Sample Name ${i + 1}`;
              } else if (fieldId.includes('email')) {
                row[fieldId] = `user${i + 1}@company.com`;
              } else if (fieldId.includes('source')) {
                row[fieldId] = ['LinkedIn', 'Indeed', 'Company Site', 'Referral'][i % 4];
              } else if (fieldId.includes('department')) {
                row[fieldId] = ['Engineering', 'Product', 'Design', 'Sales'][i % 4];
              } else if (fieldId.includes('title')) {
                row[fieldId] = ['Developer', 'Manager', 'Analyst', 'Coordinator'][i % 4];
              } else {
                row[fieldId] = `Sample ${field.name} ${i + 1}`;
              }
              break;
            case 'number':
              if (fieldId.includes('score')) {
                row[fieldId] = Math.floor(Math.random() * 40) + 60; // 60-100
              } else if (fieldId.includes('salary')) {
                row[fieldId] = Math.floor(Math.random() * 50000) + 50000; // 50k-100k
              } else if (fieldId.includes('count')) {
                row[fieldId] = Math.floor(Math.random() * 20) + 1;
              } else if (fieldId.includes('rate')) {
                row[fieldId] = Math.random() * 30 + 5; // 5-35%
              } else {
                row[fieldId] = Math.floor(Math.random() * 1000);
              }
              break;
            case 'date':
              const days = Math.floor(Math.random() * 365);
              row[fieldId] = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
              break;
            default:
              row[fieldId] = `Sample ${i + 1}`;
          }
        }
      });
      return row;
    });

    const result: ReportResult = {
      id: `result_${Date.now()}`,
      config,
      data: mockData,
      generatedAt: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      rowCount: mockData.length,
    };

    setReportResults(prev => [result, ...prev]);
    setCurrentResult(result);
    setActiveTab('results');
  }, []);

  const handleExportReport = useCallback((config: ReportConfig, format: 'csv' | 'pdf' | 'xlsx') => {
    alert(`Exporting report "${config.name}" as ${format.toUpperCase()}`);
  }, []);

  // Library handlers
  const handleEditReport = useCallback((report: SavedReport) => {
    setEditingReport(report);
    setActiveTab('create');
  }, []);

  const handleDeleteReport = useCallback((reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
    }
  }, []);

  const handleDuplicateReport = useCallback((report: SavedReport) => {
    const duplicated: SavedReport = {
      ...report,
      id: `report_${Date.now()}`,
      name: `${report.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
      lastRun: undefined,
    };
    setSavedReports(prev => [...prev, duplicated]);
  }, []);

  const handleShareReport = useCallback((reportId: string) => {
    setSavedReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, isShared: true } : r
    ));
    alert('Report shared successfully!');
  }, []);

  const handleViewReport = useCallback((report: SavedReport) => {
    handleRunReport(report);
  }, [handleRunReport]);

  // Viewer handlers
  const handleExportResult = useCallback((format: 'csv' | 'pdf' | 'xlsx') => {
    if (currentResult) {
      alert(`Exporting "${currentResult.config.name}" as ${format.toUpperCase()}`);
    }
  }, [currentResult]);

  const handleShareResult = useCallback(() => {
    if (currentResult) {
      alert(`Sharing report result: ${currentResult.config.name}`);
    }
  }, [currentResult]);

  const handleEditFromViewer = useCallback(() => {
    if (currentResult) {
      const reportConfig = currentResult.config;
      setEditingReport(reportConfig as SavedReport);
      setActiveTab('create');
    }
  }, [currentResult]);

  // Scheduler handlers
  const handleCreateSchedule = useCallback((reportId: string, config: any) => {
    const report = savedReports.find(r => r.id === reportId);
    if (report) {
      const newSchedule: ReportSchedule = {
        id: `sched_${Date.now()}`,
        reportId,
        reportName: report.name,
        frequency: config.frequency,
        recipients: config.recipients,
        enabled: config.enabled,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        createdAt: new Date().toISOString(),
        runCount: 0,
        lastStatus: 'pending',
      };
      setSchedules(prev => [...prev, newSchedule]);
    }
  }, [savedReports]);

  const handleUpdateSchedule = useCallback((scheduleId: string, updates: Partial<ReportSchedule>) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, ...updates } : s
    ));
  }, []);

  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    if (confirm('Are you sure you want to delete this schedule?')) {
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    }
  }, []);

  const handleToggleSchedule = useCallback((scheduleId: string, enabled: boolean) => {
    setSchedules(prev => prev.map(s => 
      s.id === scheduleId ? { ...s, enabled } : s
    ));
  }, []);

  const handleRunScheduleNow = useCallback((scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
      const report = savedReports.find(r => r.id === schedule.reportId);
      if (report) {
        handleRunReport(report);
        setSchedules(prev => prev.map(s => 
          s.id === scheduleId ? { 
            ...s, 
            lastRun: new Date().toISOString(),
            runCount: s.runCount + 1,
            lastStatus: 'success' as const,
          } : s
        ));
      }
    }
  }, [schedules, savedReports, handleRunReport]);

  const tabs = [
    { id: 'create' as const, name: 'Create Report', icon: PlusIcon, count: undefined },
    { id: 'library' as const, name: 'Library', icon: BookOpenIcon, count: savedReports.length },
    { id: 'results' as const, name: 'Results', icon: PlayIcon, count: reportResults.length },
    { id: 'scheduler' as const, name: 'Scheduler', icon: ClockIcon, count: schedules.filter(s => s.enabled).length },
  ];

  return (
    <PageWrapper title="Custom Reports" subtitle="Create, manage, and automate recruitment reports">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
            <p className="text-gray-500 mt-1">
              Create, manage, and automate recruitment reports
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
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
        <div>
          {activeTab === 'create' && (
            <ReportBuilder
              availableFields={AVAILABLE_FIELDS}
              onSave={handleSaveReport}
              onRun={handleRunReport}
              onExport={handleExportReport}
              initialConfig={editingReport || undefined}
            />
          )}
          
          {activeTab === 'library' && (
            <ReportLibrary
              reports={savedReports}
              onRun={handleViewReport}
              onEdit={handleEditReport}
              onDelete={handleDeleteReport}
              onDuplicate={handleDuplicateReport}
              onShare={handleShareReport}
              onView={handleViewReport}
            />
          )}
          
          {activeTab === 'results' && (
            <div className="space-y-6">
              {currentResult ? (
                <ReportViewer
                  result={currentResult}
                  onExport={handleExportResult}
                  onShare={handleShareResult}
                  onEdit={handleEditFromViewer}
                />
              ) : (
                <EmptyState
                  icon={PlayIcon}
                  title="No results yet"
                  description="Run a report from the builder or library to see results here"
                />
              )}
              
              {reportResults.length > 1 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Results</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportResults.slice(1).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setCurrentResult(result)}
                        className="p-4 text-left border border-gray-200 rounded-lg hover:border-violet-300 hover:bg-violet-50"
                      >
                        <h4 className="font-medium text-gray-900">{result.config.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {result.rowCount} rows • {new Date(result.generatedAt).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'scheduler' && (
            <ReportScheduler
              schedules={schedules}
              availableReports={savedReports}
              onCreateSchedule={handleCreateSchedule}
              onUpdateSchedule={handleUpdateSchedule}
              onDeleteSchedule={handleDeleteSchedule}
              onToggleSchedule={handleToggleSchedule}
              onRunNow={handleRunScheduleNow}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
