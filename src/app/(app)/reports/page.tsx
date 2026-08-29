'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import DecisionBar, { PrimaryAction, SecondaryAction } from '@/components/record/DecisionBar';
import DistributionStrip from '@/components/record/DistributionStrip';
import {
  ReportBuilder,
  ReportLibrary,
  ReportViewer,
  ReportScheduler,
  type ReportConfig,
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
import { useToast } from '@/components/Toast';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import { parseReportCsv } from '@/components/reports/subjects';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiReportNarrative from '@/components/ai/AiReportNarrative';
import ConfirmDialog from '@/components/ConfirmDialog';

// Mock data for available fields

const TABS = ['create', 'library', 'results', 'scheduler'] as const;
type ReportTab = (typeof TABS)[number];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('create');

  // Custom Reports and Scheduled Reports were separate destinations over these same endpoints and
  // both were unreachable from the menu. They now redirect here with the tab they used to be, so
  // an old link still lands on the thing it named.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    // `results` is excluded deliberately. Results are session state that starts empty on every
    // load, so a link asking for that tab would always arrive at an empty one — the builder is
    // where the person landing on it can actually get a result.
    if (requested && requested !== 'results' && (TABS as readonly string[]).includes(requested)) {
      setActiveTab(requested as ReportTab);
    }
  }, []);
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
    let data: Record<string, string>[] = [];
    let failure: string | null = null;

    try {
      // The subject is what the backend switches on. It used to be derived from the report's name
      // — lowercased and hyphenated — against an endpoint that matches upper snake case, so no run
      // could ever succeed and the failure was swallowed into an empty table.
      const res = await apiFetch('/api/reports/custom/csv', {
        method: 'POST',
        body: JSON.stringify({
          reportType: config.subject,
          startDate: config.dateRange.start,
          endDate: config.dateRange.end,
          fields: config.fields,
          filters: Object.fromEntries(config.filters.map((f) => [f.field, f.value])),
        }),
      });

      if (res.ok) {
        data = parseReportCsv(await res.text(), config.fields);
      } else {
        failure = await refusalMessage(res);
      }
    } catch {
      failure = 'The report could not be generated. Check your connection and try again.';
    }

    const result: ReportResult = {
      id: `result_${Date.now()}`,
      config,
      data,
      generatedAt: new Date().toISOString(),
      executionTime: Date.now() - startTime,
      rowCount: data.length,
      // Stated rather than swallowed. A refused run used to arrive as zero rows beside an
      // execution time, which reads as an answer.
      error: failure ?? undefined,
    };

    setReportResults(prev => [result, ...prev]);
    setCurrentResult(result);
    setActiveTab('results');
    if (failure) toast(failure, 'error');
  }, [toast]);

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
  /**
   * Schedules now persist.
   *
   * <p>Every handler below used to mutate React state and nothing else — the create form never
   * called an endpoint, because until now there was none to call. A schedule survived until the
   * user navigated away. Each one is a real request, and the list is re-read from the server after
   * a change rather than patched locally, so what is on screen is what was stored.
   */
  const reloadSchedules = useCallback(async () => {
    try {
      const res = await apiFetch('/api/reports/scheduled');
      if (res.ok) setSchedules(await res.json());
    } catch {
      // Leave the current list alone — a failed refresh should not blank the tab.
    }
  }, []);

  const handleCreateSchedule = useCallback(async (reportId: string, config: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    enabled: boolean;
  }) => {
    try {
      const res = await apiFetch('/api/reports/schedule', {
        method: 'POST',
        body: JSON.stringify({ reportId, ...config }),
      });
      if (!res.ok) {
        toast(await refusalMessage(res), 'error');
        return;
      }
      await reloadSchedules();
      toast('Schedule created', 'success');
    } catch {
      toast('Could not create the schedule. Try again.', 'error');
    }
  }, [reloadSchedules, toast]);

  const handleUpdateSchedule = useCallback(async (scheduleId: string, updates: Partial<ReportSchedule>) => {
    try {
      const res = await apiFetch(`/api/reports/schedule/${scheduleId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        toast(await refusalMessage(res), 'error');
        return;
      }
      await reloadSchedules();
    } catch {
      toast('Could not update the schedule. Try again.', 'error');
    }
  }, [reloadSchedules, toast]);

  const handleDeleteSchedule = useCallback((scheduleId: string) => {
    setDeleteScheduleId(scheduleId);
  }, []);

  const confirmDeleteSchedule = useCallback(async () => {
    if (!deleteScheduleId) return;
    const id = deleteScheduleId;
    setDeleteScheduleId(null);
    try {
      const res = await apiFetch(`/api/reports/schedule/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast(await refusalMessage(res), 'error');
        return;
      }
      await reloadSchedules();
      toast('Schedule removed', 'success');
    } catch {
      toast('Could not remove the schedule. Try again.', 'error');
    }
  }, [deleteScheduleId, reloadSchedules, toast]);

  const handleToggleSchedule = useCallback(async (scheduleId: string, enabled: boolean) => {
    try {
      const res = await apiFetch(`/api/reports/schedule/${scheduleId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        toast(await refusalMessage(res), 'error');
        return;
      }
      await reloadSchedules();
    } catch {
      toast('Could not change the schedule. Try again.', 'error');
    }
  }, [reloadSchedules, toast]);

  const handleRunScheduleNow = useCallback(async (scheduleId: string) => {
    try {
      const res = await apiFetch(`/api/reports/schedule/${scheduleId}/run`, { method: 'POST' });
      if (!res.ok) {
        toast(await refusalMessage(res), 'error');
        return;
      }
      // The server records a failure as a stored status rather than an error response, so read the
      // result and say which happened instead of assuming success.
      const updated: ReportSchedule = await res.json();
      await reloadSchedules();
      if (updated.lastStatus === 'failed') {
        toast(`${updated.reportName} failed: ${updated.errorMessage ?? 'no reason given'}`, 'error');
      } else {
        toast(`${updated.reportName} ran`, 'success');
      }
    } catch {
      toast('Could not run the schedule. Try again.', 'error');
    }
  }, [reloadSchedules, toast]);

  /**
   * When a schedule last produced something.
   *
   * <p>Read from the schedules, not from the session's results. `reportResults` is component state
   * that starts empty on every page load, so anything derived from it describes this browser tab
   * rather than the tenant — which is how "Reports Generated · This financial year" came to be a
   * counter that reset when you refreshed.
   */
  const lastRunLabel = (() => {
    const stamps = schedules
      .map((s) => s.lastRun)
      .filter((value): value is string => Boolean(value))
      .map((value) => new Date(value).getTime())
      .filter((value) => !Number.isNaN(value));

    if (stamps.length === 0) return 'Never';
    return new Date(Math.max(...stamps)).toLocaleString('en-ZA', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  /**
   * The four states a schedule can be in, and the only ones this page can honestly report.
   *
   * <p>`failing` is the one that matters: a schedule with recipients that last ran and failed means
   * people who expect a report in their inbox did not get one, and nothing on this page said so.
   */
  const failing = schedules.filter((s) => s.enabled && s.lastStatus === 'failed');
  const paused = schedules.filter((s) => !s.enabled);
  const neverRun = schedules.filter((s) => s.enabled && s.runCount === 0);
  const healthy = schedules.filter(
    (s) => s.enabled && s.runCount > 0 && s.lastStatus !== 'failed',
  );

  // Who is waiting on a report that did not arrive.
  const affectedRecipients = new Set(failing.flatMap((s) => s.recipients ?? []));

  /**
   * A result is something that happened, not a place you go.
   *
   * <p>`reportResults` is session state — it starts empty on every page load and is never fetched —
   * so a permanent Results tab read "No results yet" on arrival, every time, for every user. It is
   * now a fourth tab that appears once a run has produced something, carrying the row count so a
   * run that matched nothing still reads as an answer rather than as an empty tab.
   */
  const hasResult = reportResults.length > 0;

  const tabs = [
    { id: 'create' as const, name: 'Build', icon: PlusIcon, count: undefined, showZero: false },
    { id: 'library' as const, name: 'Saved', icon: BookOpenIcon, count: savedReports.length, showZero: false },
    {
      id: 'scheduler' as const,
      name: 'Scheduled',
      icon: ClockIcon,
      count: schedules.filter((s) => s.enabled).length,
      showZero: false,
    },
    // Zero rows is a finding. It is shown, where an absent count elsewhere just means "nothing yet".
    ...(hasResult
      ? [{
          id: 'results' as const,
          name: 'Result',
          icon: PlayIcon,
          count: currentResult?.rowCount ?? 0,
          showZero: true,
        }]
      : []),
  ];

  return (
    <PageWrapper>
      <IdentityBand
        eyebrow="Reporting"
        title="Reports"
        subtitle={`Build a report, or manage what already runs. Last scheduled run: ${lastRunLabel}. Ready-made extracts are on Standard extracts.`}
        // Three, not four. Last run was the fourth, and it is a timestamp rather than a count —
        // it reads as prose beside three tallies, and past three figures none of them registers.
        // It is now in the sentence above, where a timestamp belongs.
        figures={[
          { label: 'Saved', value: savedReports.length },
          { label: 'Scheduled', value: schedules.length === 0 ? 'None' : healthy.length + neverRun.length },
          {
            label: 'Failing',
            value: failing.length,
            tone: (failing.length > 0 ? 'critical' : undefined) as 'critical' | undefined,
          },
        ]}
      />

      {failing.length > 0 && (
        <DecisionBar
          ask={`${failing.length} scheduled ${failing.length === 1 ? 'report' : 'reports'} failed to run.`}
          why={
            affectedRecipients.size > 0
              ? `${affectedRecipients.size} ${affectedRecipients.size === 1 ? 'person is' : 'people are'} expecting ${failing.length === 1 ? 'it' : 'these'} and did not receive ${failing.length === 1 ? 'it' : 'them'}. A report that fails quietly looks the same to them as one nobody asked for. ${failing[0].errorMessage ?? ''}`
              : `${failing[0].reportName} last failed and has not produced anything since. ${failing[0].errorMessage ?? ''}`
          }
          tone="stopped"
        >
          <PrimaryAction onClick={() => setActiveTab('scheduler')}>
            Open scheduler
          </PrimaryAction>
          <SecondaryAction onClick={() => handleRunScheduleNow(failing[0].id)}>
            Run {failing[0].reportName} now
          </SecondaryAction>
        </DecisionBar>
      )}

      {schedules.length > 0 && (
        <DistributionStrip
          buckets={[
            { label: 'Running', count: healthy.length, detail: 'Ran, and last run succeeded', tone: 'positive' },
            {
              label: 'Failing',
              count: failing.length,
              detail: 'Enabled, last run failed',
              tone: (failing.length > 0 ? 'critical' : undefined) as 'critical' | undefined,
            },
            {
              label: 'Never run',
              count: neverRun.length,
              detail: 'Scheduled, no run yet',
              tone: (neverRun.length > 0 ? 'warning' : undefined) as 'warning' | undefined,
            },
            { label: 'Paused', count: paused.length, detail: 'Switched off deliberately' },
          ]}
          footnote={
            <>
              <b className="font-bold text-foreground">A paused schedule is a decision; a failing one is not.</b>{' '}
              Only the schedules are counted here — running a report in this tab does not change them.
            </>
          }
        />
      )}

      <div className="space-y-6">

        {/* Pill-shaped Tab Toggle */}
        <div className="flex gap-1 bg-surface-navy rounded-full p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-[0.8125rem] font-semibold transition-all duration-200 flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.name}
              {tab.count !== undefined && (tab.count > 0 || tab.showZero) && (
                <span className={`ml-0.5 py-0.5 px-2 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-surface-navy text-primary'
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

          {activeTab === 'results' && currentResult && (
            <div className="space-y-6">
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

              {reportResults.length > 1 && (
                <div className="bg-card border border-border rounded-card shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      {/* Named for what it is. These are not stored anywhere; closing the tab
                          loses them, and "Recent results" implied otherwise. */}
                      <h3 className="text-[1.0625rem] font-bold text-foreground">Earlier runs in this session</h3>
                      <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                        Not saved. Save the report to keep it, or export the rows.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Everything except the one on screen. `slice(1)` assumed the newest was
                        always the one being viewed, so opening an earlier run hid the newest
                        and listed the open one back at you. */}
                    {reportResults.filter((result) => result.id !== currentResult.id).map((result) => (
                      <button
                        key={result.id}
                        onClick={() => setCurrentResult(result)}
                        className="p-4 text-left bg-background border border-border rounded-control hover:bg-surface-navy hover:border-shumelahire-500 transition-all duration-200"
                      >
                        <h4 className="font-semibold text-foreground text-sm">{result.config.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} &middot;{' '}
                          {new Date(result.generatedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
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
