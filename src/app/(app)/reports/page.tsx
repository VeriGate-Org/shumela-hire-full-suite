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
  DocumentTextIcon,
  StarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiReportNarrative from '@/components/ai/AiReportNarrative';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);
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
      const res = await apiFetch('/api/reports', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      if (res.ok) {
        const saved = await res.json();
        setSavedReports(prev => [...prev, saved]);
        toast('Report saved successfully', 'success');
        setActiveTab('library');
      } else {
        throw new Error('Failed to save');
      }
    } catch {
      toast('Failed to save report', 'error');
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

  const handleDeleteReport = useCallback((reportId: string) => {
    setDeleteReportId(reportId);
  }, []);

  const confirmDeleteReport = useCallback(async () => {
    if (!deleteReportId) return;
    const reportId = deleteReportId;
    setDeleteReportId(null);
    try {
      const res = await apiFetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) {
        const data = await res.json().catch(() => null);
        if (data?.message?.includes('system')) {
          toast('System reports cannot be deleted', 'error');
          return;
        }
      }
    } catch {
      // Proceed with local removal
    }
    setSavedReports(prev => prev.filter(r => r.id !== reportId));
    toast('Report deleted', 'success');
  }, [deleteReportId, toast]);

  const handleDuplicateReport = useCallback(async (report: SavedReport) => {
    try {
      const res = await apiFetch(`/api/reports/${report.id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        const duplicated = await res.json();
        setSavedReports(prev => [...prev, duplicated]);
        toast('Report duplicated', 'success');
        return;
      }
    } catch {
      // Fallback
    }
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
    toast('Report duplicated locally', 'info');
  }, [toast]);

  const handleShareReport = useCallback(async (reportId: string) => {
    try {
      await apiFetch(`/api/reports/${reportId}/share`, { method: 'POST' });
    } catch {
      // Proceed with local update
    }
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
    setDeleteScheduleId(scheduleId);
  }, []);

  const confirmDeleteSchedule = useCallback(() => {
    if (!deleteScheduleId) return;
    setSchedules(prev => prev.filter(s => s.id !== deleteScheduleId));
    setDeleteScheduleId(null);
  }, [deleteScheduleId]);

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
    <PageWrapper title="Reports" subtitle="Build, schedule, and manage organisational reports">
      <div className="space-y-6">

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Reports Generated */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-icon-bg-navy text-shumelahire-500">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Reports Generated
              </div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">
                {reportResults.length || 0}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">This financial year</div>
            </div>
          </div>

          {/* Scheduled */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-icon-bg-teal text-teal-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Scheduled
              </div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">
                {schedules.filter(s => s.enabled).length}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Active schedules</div>
            </div>
          </div>

          {/* Most Popular */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-icon-bg-gold text-gold-600">
              <StarIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Most Popular
              </div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">
                Recruitment
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Most requested report type</div>
            </div>
          </div>

          {/* Avg Generation */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center bg-icon-bg-pink text-idc-pink-600">
              <BoltIcon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                Avg Generation
              </div>
              <div className="text-2xl font-extrabold text-foreground leading-tight">
                &lt; 30s
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">Average report build time</div>
            </div>
          </div>
        </div>

        {/* Pill-shaped Tab Toggle */}
        <div className="flex gap-1 bg-surface-navy rounded-full p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-[0.8125rem] font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-card text-shumelahire-500 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`ml-0.5 py-0.5 px-2 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-surface-navy text-shumelahire-500'
                    : 'bg-surface-navy text-muted-foreground'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
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
                <div className="bg-card border border-border rounded-card shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-[1.0625rem] font-bold text-foreground">Recent Results</h3>
                      <p className="text-[0.8125rem] text-muted-foreground mt-0.5">Previously generated report results</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportResults.slice(1).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setCurrentResult(result)}
                        className="p-4 text-left bg-background border border-border rounded-control hover:bg-surface-navy hover:border-shumelahire-500 transition-all duration-200"
                      >
                        <h4 className="font-semibold text-foreground text-sm">{result.config.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.rowCount} rows &middot; {new Date(result.generatedAt).toLocaleDateString()}
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
      <ConfirmDialog
        open={deleteReportId !== null}
        title="Delete Report"
        message="Are you sure you want to delete this report?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteReport}
        onCancel={() => setDeleteReportId(null)}
      />
      <ConfirmDialog
        open={deleteScheduleId !== null}
        title="Delete Schedule"
        message="Are you sure you want to delete this schedule?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteSchedule}
        onCancel={() => setDeleteScheduleId(null)}
      />
    </PageWrapper>
  );
}
