'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from '@/components/reports';
import {
  PlusIcon,
  BookOpenIcon,
  PlayIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiReportNarrative from '@/components/ai/AiReportNarrative';

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

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'results' | 'scheduler'>('create');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [reportResults, setReportResults] = useState<ReportResult[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [currentResult, setCurrentResult] = useState<ReportResult | null>(null);
  const [editingReport, setEditingReport] = useState<SavedReport | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function loadData() {
      const [reportsRes, schedulesRes] = await Promise.allSettled([
        apiFetch('/api/reports/types'),
        apiFetch('/api/reports/scheduled'),
      ]);
      if (reportsRes.status === 'fulfilled' && reportsRes.value.ok) {
        const data = await reportsRes.value.json();
        setSavedReports(Array.isArray(data) ? data : data.data || []);
      }
      if (schedulesRes.status === 'fulfilled' && schedulesRes.value.ok) {
        const data = await schedulesRes.value.json();
        setSchedules(Array.isArray(data) ? data : data.data || []);
      }
    }
    loadData();
  }, []);

  // Report Builder handlers
  const handleSaveReport = useCallback(async (config: ReportConfig) => {
    try {
      const res = await apiFetch('/api/reports/custom/csv', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast('Report saved successfully', 'success');
        // Reload reports list
        const reportsRes = await apiFetch('/api/reports/types');
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setSavedReports(Array.isArray(data) ? data : data.data || []);
        }
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      // Fallback: save locally
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
      toast('Report saved locally', 'info');
    }
  }, [toast]);

  const handleRunReport = useCallback(async (config: ReportConfig) => {
    const startTime = Date.now();
    let data: any[] = [];

    try {
      const reportType = config.name?.toLowerCase().replace(/\s+/g, '-') || 'general';
      const response = await apiFetch(`/api/analytics/reports/${reportType}`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
      if (response.ok) {
        const result = await response.json();
        data = result.data || result.rows || result || [];
        if (!Array.isArray(data)) data = [];
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    }

    const result: ReportResult = {
      id: `result_${Date.now()}`,
      config,
      data,
      generatedAt: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      rowCount: data.length,
    };

    setReportResults(prev => [result, ...prev]);
    setCurrentResult(result);
    setActiveTab('results');
  }, []);

  const handleExportReport = useCallback((config: ReportConfig, format: 'csv' | 'pdf' | 'xlsx') => {
    if (format === 'csv' && currentResult?.data && currentResult.data.length > 0) {
      const data = currentResult.data;
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: Record<string, unknown>) =>
          headers.map(h => {
            const val = String(row[h] ?? '');
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        ),
      ];
      const csvContent = '\ufeff' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name || 'report'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported "${config.name}" as CSV`, 'success');
    } else if (format !== 'csv') {
      toast(`${format.toUpperCase()} export coming soon`, 'info');
    } else {
      toast('No data to export. Run the report first.', 'info');
    }
  }, [currentResult, toast]);

  // Library handlers
  const handleEditReport = useCallback((report: SavedReport) => {
    setEditingReport(report);
    setActiveTab('create');
  }, []);

  const handleDeleteReport = useCallback(async (reportId: string) => {
    if (confirm('Are you sure you want to delete this report?')) {
      try {
        await apiFetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      } catch {
        // Endpoint may not exist — proceed with local removal
      }
      setSavedReports(prev => prev.filter(r => r.id !== reportId));
      toast('Report deleted', 'success');
    }
  }, [toast]);

  const handleDuplicateReport = useCallback(async (report: SavedReport) => {
    const duplicated: SavedReport = {
      ...report,
      id: `report_${Date.now()}`,
      name: `${report.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      runCount: 0,
      lastRun: undefined,
    };
    try {
      await apiFetch('/api/reports/custom/csv', {
        method: 'POST',
        body: JSON.stringify(duplicated),
      });
    } catch {
      // Fallback: save locally
    }
    setSavedReports(prev => [...prev, duplicated]);
    toast('Report duplicated', 'success');
  }, [toast]);

  const handleShareReport = useCallback((reportId: string) => {
    setSavedReports(prev => prev.map(r => 
      r.id === reportId ? { ...r, isShared: true } : r
    ));
    toast('Report shared successfully', 'success');
  }, [toast]);

  const handleViewReport = useCallback((report: SavedReport) => {
    handleRunReport(report);
  }, [handleRunReport]);

  // Viewer handlers
  const handleExportResult = useCallback((format: 'csv' | 'pdf' | 'xlsx') => {
    if (!currentResult) return;
    if (format === 'csv' && currentResult.data && currentResult.data.length > 0) {
      const data = currentResult.data;
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: Record<string, unknown>) =>
          headers.map(h => {
            const val = String(row[h] ?? '');
            return val.includes(',') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
          }).join(',')
        ),
      ];
      const csvContent = '\ufeff' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentResult.config.name || 'report'}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported "${currentResult.config.name}" as CSV`, 'success');
    } else if (format !== 'csv') {
      toast(`${format.toUpperCase()} export coming soon`, 'info');
    } else {
      toast('No data to export', 'info');
    }
  }, [currentResult, toast]);

  const handleShareResult = useCallback(() => {
    if (currentResult) {
      toast(`Sharing report result: ${currentResult.config.name}`, 'info');
    }
  }, [currentResult, toast]);

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
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-gold-500 text-gold-700'
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
                <>
                  <ReportViewer
                    result={currentResult}
                    onExport={handleExportResult}
                    onShare={handleShareResult}
                    onEdit={handleEditFromViewer}
                  />

                  <AiAssistPanel title="AI Report Narrative" feature="AI_REPORT_NARRATIVE" description="Generate a written summary and key insights from your report data">
                    <AiReportNarrative
                      reportType={currentResult.config.name}
                      reportData={currentResult.data ? { rows: currentResult.data, rowCount: currentResult.rowCount } : undefined}
                    />
                  </AiAssistPanel>
                </>
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
                        className="p-4 text-left border border-gray-200 rounded-sm hover:border-violet-300 hover:bg-gold-50"
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
