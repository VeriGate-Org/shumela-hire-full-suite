'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import { aiHrGeneralService } from '@/services/aiHrGeneralService';
import { CaseAnalysisResult } from '@/types/ai';
import { ScaleIcon, ExclamationTriangleIcon, DocumentTextIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

type TabId = 'all' | 'open' | 'investigation' | 'resolved';
type TypeFilter = 'all' | 'grievance' | 'disciplinary' | 'misconduct';

export default function LabourRelationsDashboardPage() {
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<CaseAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseForm, setCaseForm] = useState({ caseType: 'Misconduct', description: '', employeeRole: '', department: '', severity: 'Medium' });
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const data = await complianceService.getLabourDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to load labour relations dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function analyzeCase() {
    if (!caseForm.description) return;
    setAiLoading(true);
    try {
      const result = await aiHrGeneralService.analyzeCase({
        caseType: caseForm.caseType,
        description: caseForm.description,
        employeeRole: caseForm.employeeRole,
        department: caseForm.department,
        severity: caseForm.severity,
      });
      setAiAnalysis(result);
      setShowCaseModal(false);
    } catch (error) {
      console.error('AI case analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  const disciplinaryStats = dashboard.disciplinaryStats || {};
  const grievanceStats = dashboard.grievanceStats || {};

  const activeCases = (disciplinaryStats.open || 0) + (disciplinaryStats.investigation || 0) + (grievanceStats.filed || 0) + (grievanceStats.underReview || 0) + (grievanceStats.mediation || 0);
  const totalResolved = (disciplinaryStats.closed || 0) + (grievanceStats.resolved || 0);
  const totalCases = activeCases + totalResolved + (disciplinaryStats.hearingScheduled || 0) + (disciplinaryStats.hearingCompleted || 0) + (grievanceStats.escalated || 0);
  const resolutionRate = totalCases > 0 ? Math.round((totalResolved / totalCases) * 100) : 0;

  const openCount = (disciplinaryStats.open || 0) + (grievanceStats.filed || 0);
  const investigationCount = (disciplinaryStats.investigation || 0) + (grievanceStats.underReview || 0) + (grievanceStats.mediation || 0);
  const resolvedCount = totalResolved;

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: totalCases },
    { id: 'open', label: 'Open', count: openCount },
    { id: 'investigation', label: 'Under Investigation', count: investigationCount },
    { id: 'resolved', label: 'Resolved', count: resolvedCount },
  ];

  const typeFilters: { id: TypeFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'grievance', label: 'Grievances' },
    { id: 'disciplinary', label: 'Disciplinary' },
    { id: 'misconduct', label: 'Misconduct' },
  ];

  if (loading) {
    return (
      <PageWrapper title="Labour Relations" subtitle="Manage grievances, disciplinary cases, and dispute resolution per the LRA and BCEA">
        {/* Skeleton Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="enterprise-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-card bg-slate-200 animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 animate-pulse rounded w-1/2 mb-2" />
                  <div className="h-3 bg-slate-200 animate-pulse rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton Tabs */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex gap-4 px-6 py-4 border-b border-border">
            {[60, 70, 130, 80].map((w, i) => (
              <div key={i} className="h-5 bg-slate-200 animate-pulse rounded" style={{ width: w }} />
            ))}
          </div>
          <div className="p-6">
            <div className="flex gap-2 mb-5">
              {[60, 90, 100, 90].map((w, i) => (
                <div key={i} className="h-8 bg-slate-200 animate-pulse rounded-button" style={{ width: w }} />
              ))}
            </div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-slate-200 animate-pulse rounded-card mb-4" />
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <FeatureGate feature="LABOUR_RELATIONS">
      <PageWrapper
        title="Labour Relations"
        subtitle="Manage grievances, disciplinary cases, and dispute resolution per the LRA and BCEA"
        actions={
          <button
            onClick={() => setShowCaseModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta border-2 border-cta text-cta-foreground font-semibold text-[0.8125rem] uppercase tracking-wider hover:bg-cta-hover hover:border-cta-hover transition-all duration-200"
          >
            <SparklesIcon className="h-4 w-4" />
            AI Case Advisor
          </button>
        }
      >
        <div className="space-y-6">

          {/* ====== AI CASE ANALYSIS MODAL ====== */}
          {showCaseModal && (
            <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-8 animate-in fade-in duration-200">
              <div className="bg-card rounded-card shadow-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                  <h2 className="text-lg font-bold text-foreground">AI Case Analysis</h2>
                  <button
                    onClick={() => setShowCaseModal(false)}
                    className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-all duration-200"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                {/* Modal Body */}
                <div className="p-6 space-y-5">
                  <div>
                    <label className="block font-semibold text-sm text-foreground mb-1.5">Case Type <span className="text-error">*</span></label>
                    <select
                      value={caseForm.caseType}
                      onChange={e => setCaseForm(f => ({...f, caseType: e.target.value}))}
                      className="w-full px-3.5 py-2.5 border border-border rounded-control bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                    >
                      <option>Misconduct</option><option>Grievance</option><option>Poor Performance</option>
                      <option>Absenteeism</option><option>Harassment</option><option>Insubordination</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-sm text-foreground mb-1.5">Description <span className="text-error">*</span></label>
                    <textarea
                      value={caseForm.description}
                      onChange={e => setCaseForm(f => ({...f, description: e.target.value}))}
                      placeholder="Describe the case..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 border border-border rounded-control bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-sm text-foreground mb-1.5">Employee Role</label>
                      <input
                        value={caseForm.employeeRole}
                        onChange={e => setCaseForm(f => ({...f, employeeRole: e.target.value}))}
                        placeholder="Employee Role"
                        className="w-full px-3.5 py-2.5 border border-border rounded-control bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-sm text-foreground mb-1.5">Department</label>
                      <input
                        value={caseForm.department}
                        onChange={e => setCaseForm(f => ({...f, department: e.target.value}))}
                        placeholder="Department"
                        className="w-full px-3.5 py-2.5 border border-border rounded-control bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-sm text-foreground mb-1.5">Severity <span className="text-error">*</span></label>
                    <select
                      value={caseForm.severity}
                      onChange={e => setCaseForm(f => ({...f, severity: e.target.value}))}
                      className="w-full px-3.5 py-2.5 border border-border rounded-control bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                    >
                      <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                    </select>
                  </div>
                  {/* Info callout */}
                  <div className="flex items-center gap-2 px-3 py-3 bg-surface-navy border border-shumelahire-100 rounded-control text-[0.8125rem] text-primary">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Cases are processed in accordance with the Labour Relations Act 66 of 1995 and the BCEA.
                  </div>
                </div>
                {/* Modal Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
                  <button
                    onClick={() => setShowCaseModal(false)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-border bg-transparent text-muted-foreground font-semibold text-[0.8125rem] uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={analyzeCase}
                    disabled={aiLoading || !caseForm.description}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-teal-600 border-2 border-teal-600 text-white font-semibold text-[0.8125rem] uppercase tracking-wider hover:bg-teal-700 hover:border-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? 'Analysing...' : 'Analyse Case'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ====== AI ANALYSIS RESULT BANNER ====== */}
          {aiAnalysis && (
            <div className="enterprise-card border-teal-200 bg-surface-teal p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                  <SparklesIcon className="h-5 w-5 text-accent-teal" />
                  AI Case Analysis
                </h3>
                <button onClick={() => setAiAnalysis(null)} className="text-muted-foreground hover:text-foreground text-[0.8125rem] font-semibold uppercase tracking-wider transition-colors duration-200">Dismiss</button>
              </div>
              <p className="text-sm text-foreground/80 mb-4">{aiAnalysis.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-card rounded-card p-4 border border-border">
                  <h4 className="text-[0.8125rem] font-bold text-accent-navy uppercase tracking-wider mb-2">Recommended Steps</h4>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    {aiAnalysis.recommendedSteps?.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
                <div className="bg-card rounded-card p-4 border border-border">
                  <h4 className="text-[0.8125rem] font-bold text-error uppercase tracking-wider mb-2">Legal Considerations</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">{aiAnalysis.legalConsiderations?.map((l, i) => <li key={i}>- {l}</li>)}</ul>
                </div>
                <div className="bg-card rounded-card p-4 border border-border">
                  <h4 className="text-[0.8125rem] font-bold text-accent-gold uppercase tracking-wider mb-2">Documentation Required</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">{aiAnalysis.documentationRequired?.map((d, i) => <li key={i}>- {d}</li>)}</ul>
                </div>
                <div className="bg-card rounded-card p-4 border border-border">
                  <h4 className="text-[0.8125rem] font-bold text-success uppercase tracking-wider mb-2">Risk Assessment</h4>
                  <p className="text-xs text-muted-foreground">{aiAnalysis.riskAssessment}</p>
                </div>
              </div>
              <div className="mt-3 bg-card rounded-card p-4 border border-border">
                <h4 className="text-[0.8125rem] font-bold text-accent-teal uppercase tracking-wider mb-2">Suggested Resolution</h4>
                <p className="text-xs text-muted-foreground">{aiAnalysis.suggestedResolution}</p>
              </div>
            </div>
          )}

          {/* ====== STAT CARDS STRIP ====== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Link href="/admin/labour-relations/disciplinary">
              <div className="enterprise-card p-5 hover:-translate-y-px transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-card bg-icon-bg-navy flex items-center justify-center shrink-0">
                    <DocumentTextIcon className="w-6 h-6 text-accent-navy" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-extrabold leading-tight text-foreground">{activeCases}</div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Active Cases</div>
                  </div>
                </div>
              </div>
            </Link>

            <div className="enterprise-card p-5 hover:-translate-y-px transition-all">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-card bg-icon-bg-teal flex items-center justify-center shrink-0">
                  <ScaleIcon className="w-6 h-6 text-accent-teal" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-extrabold leading-tight text-foreground">{resolutionRate}%</div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Resolution Rate</div>
                </div>
              </div>
            </div>

            <Link href="/admin/labour-relations/disciplinary">
              <div className="enterprise-card p-5 hover:-translate-y-px transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-card bg-icon-bg-gold flex items-center justify-center shrink-0">
                    <ClockIcon className="w-6 h-6 text-accent-gold" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-extrabold leading-tight text-foreground">{disciplinaryStats.hearingScheduled || 0}</div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Hearings Scheduled</div>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/labour-relations/grievances">
              <div className="enterprise-card p-5 hover:-translate-y-px transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-[52px] h-[52px] rounded-card bg-icon-bg-pink flex items-center justify-center shrink-0">
                    <ExclamationTriangleIcon className="w-6 h-6 text-accent-pink" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-extrabold leading-tight text-foreground">
                      {(grievanceStats.filed || 0) + (grievanceStats.underReview || 0) + (grievanceStats.mediation || 0)}
                    </div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">Active Grievances</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* ====== TABBED CONTENT CONTAINER ====== */}
          <div className="enterprise-card overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-border px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-5 text-sm font-semibold relative top-px border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-primary'
                  }`}
                >
                  {tab.label}
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[0.6875rem] font-bold ml-1.5 ${
                    activeTab === tab.id
                      ? 'bg-shumelahire-100 text-primary'
                      : 'bg-background text-muted-foreground'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Panel Content */}
            <div className="p-6 animate-in fade-in duration-300">
              {/* Type Filter Bar */}
              <div className="flex items-center gap-2 mb-5 flex-wrap">
                {typeFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setTypeFilter(filter.id)}
                    className={`px-3.5 py-1.5 rounded-button border text-xs font-semibold transition-all duration-200 ${
                      typeFilter === filter.id
                        ? 'bg-primary border-primary text-white'
                        : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* ====== DISCIPLINARY CASES SECTION ====== */}
              {(activeTab === 'all' || activeTab === 'open' || activeTab === 'investigation' || activeTab === 'resolved') && (
                <>
                  {/* Disciplinary Cases */}
                  {(typeFilter === 'all' || typeFilter === 'disciplinary') && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-foreground">Disciplinary Cases</h3>
                        <Link
                          href="/admin/labour-relations/disciplinary"
                          className="text-[0.8125rem] font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
                        >
                          View All
                        </Link>
                      </div>

                      {/* Disciplinary stat rows rendered as case-card style */}
                      <div className="space-y-3">
                        {activeTab !== 'resolved' && activeTab !== 'investigation' && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-icon-bg-pink flex items-center justify-center shrink-0">
                                <ExclamationTriangleIcon className="w-5 h-5 text-accent-pink" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">DISCIPLINARY</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Open Cases</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Cases currently open and awaiting initial investigation or hearing
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-warning-bg text-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                  Open
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{disciplinaryStats.open || 0}</span>
                                <span className="text-xs text-muted-foreground">cases</span>
                              </div>
                              <Link href="/admin/labour-relations/disciplinary" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'investigation') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-icon-bg-navy flex items-center justify-center shrink-0">
                                <DocumentTextIcon className="w-5 h-5 text-accent-navy" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">DISCIPLINARY</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Under Investigation</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Cases actively being investigated with evidence gathering underway
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-shumelahire-100 text-primary">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  Investigation
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{disciplinaryStats.investigation || 0}</span>
                                <span className="text-xs text-muted-foreground">cases</span>
                              </div>
                              <Link href="/admin/labour-relations/disciplinary" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'open') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-icon-bg-gold flex items-center justify-center shrink-0">
                                <ClockIcon className="w-5 h-5 text-accent-gold" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">DISCIPLINARY</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Hearing Scheduled</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Cases with scheduled hearings pending per the employer&apos;s disciplinary code
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-icon-bg-gold text-accent-gold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                  Hearing
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{disciplinaryStats.hearingScheduled || 0}</span>
                                <span className="text-xs text-muted-foreground">cases</span>
                              </div>
                              <Link href="/admin/labour-relations/disciplinary" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'resolved') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-success-bg flex items-center justify-center shrink-0">
                                <ScaleIcon className="w-5 h-5 text-success" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">DISCIPLINARY</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Closed</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Completed cases with final outcomes recorded
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-success-bg text-green-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                  Closed
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{disciplinaryStats.closed || 0}</span>
                                <span className="text-xs text-muted-foreground">cases</span>
                              </div>
                              <Link href="/admin/labour-relations/disciplinary" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ====== GRIEVANCES SECTION ====== */}
                  {(typeFilter === 'all' || typeFilter === 'grievance') && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-foreground">Grievances</h3>
                        <Link
                          href="/admin/labour-relations/grievances"
                          className="text-[0.8125rem] font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="space-y-3">
                        {activeTab !== 'resolved' && activeTab !== 'investigation' && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-icon-bg-navy flex items-center justify-center shrink-0">
                                <DocumentTextIcon className="w-5 h-5 text-accent-navy" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">GRIEVANCE</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Filed</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Grievances formally filed and awaiting initial review
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-shumelahire-100 text-primary">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  Filed
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{grievanceStats.filed || 0}</span>
                                <span className="text-xs text-muted-foreground">grievances</span>
                              </div>
                              <Link href="/admin/labour-relations/grievances" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'investigation') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-icon-bg-gold flex items-center justify-center shrink-0">
                                <ClockIcon className="w-5 h-5 text-accent-gold" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">GRIEVANCE</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Under Review</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Grievances being reviewed by the designated officer
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-warning-bg text-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                                  Review
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{grievanceStats.underReview || 0}</span>
                                <span className="text-xs text-muted-foreground">grievances</span>
                              </div>
                              <Link href="/admin/labour-relations/grievances" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'investigation') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-icon-bg-pink flex items-center justify-center shrink-0">
                                <ExclamationTriangleIcon className="w-5 h-5 text-accent-pink" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">GRIEVANCE</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Mediation</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Grievances referred to mediation for dispute resolution
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-icon-bg-pink text-accent-pink">
                                  <span className="w-1.5 h-1.5 rounded-full bg-idc-pink-600" />
                                  Mediation
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{grievanceStats.mediation || 0}</span>
                                <span className="text-xs text-muted-foreground">grievances</span>
                              </div>
                              <Link href="/admin/labour-relations/grievances" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'open') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-error-bg flex items-center justify-center shrink-0">
                                <ExclamationTriangleIcon className="w-5 h-5 text-error" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">GRIEVANCE</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Escalated</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Grievances escalated to CCMA or higher authority
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-error-bg text-red-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-error" />
                                  Escalated
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{grievanceStats.escalated || 0}</span>
                                <span className="text-xs text-muted-foreground">grievances</span>
                              </div>
                              <Link href="/admin/labour-relations/grievances" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}

                        {(activeTab === 'all' || activeTab === 'resolved') && (
                          <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-11 h-11 rounded-full bg-success-bg flex items-center justify-center shrink-0">
                                <ScaleIcon className="w-5 h-5 text-success" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary uppercase tracking-wider">GRIEVANCE</div>
                                <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Resolved</div>
                                <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                  Grievances that have been fully resolved and closed
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-success-bg text-green-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                                  Resolved
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-border">
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-extrabold text-foreground">{grievanceStats.resolved || 0}</span>
                                <span className="text-xs text-muted-foreground">grievances</span>
                              </div>
                              <Link href="/admin/labour-relations/grievances" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                                VIEW
                              </Link>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Misconduct filter - show combined relevant info */}
                  {typeFilter === 'misconduct' && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-bold text-foreground">Misconduct Cases</h3>
                        <Link
                          href="/admin/labour-relations/disciplinary"
                          className="text-[0.8125rem] font-semibold text-primary hover:text-primary/80 transition-colors duration-200"
                        >
                          View All
                        </Link>
                      </div>

                      <div className="space-y-3">
                        <div className="border border-border rounded-card p-5 bg-card hover:shadow-sm hover:border-shumelahire-100 transition-all duration-200 cursor-pointer">
                          <div className="flex items-start gap-3.5 mb-3">
                            <div className="w-11 h-11 rounded-full bg-error-bg flex items-center justify-center shrink-0">
                              <ExclamationTriangleIcon className="w-5 h-5 text-error" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-primary uppercase tracking-wider">MISCONDUCT</div>
                              <div className="font-bold text-[0.9375rem] text-foreground mt-0.5">Active Misconduct Cases</div>
                              <div className="text-[0.8125rem] text-muted-foreground mt-1 line-clamp-2">
                                Misconduct cases requiring investigation per Schedule 8 of the LRA Code of Good Practice
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-button text-xs font-semibold bg-error-bg text-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-error" />
                                Misconduct
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-4">
                              <span className="text-2xl font-extrabold text-foreground">{(disciplinaryStats.open || 0) + (disciplinaryStats.investigation || 0)}</span>
                              <span className="text-xs text-muted-foreground">active cases</span>
                            </div>
                            <Link href="/admin/labour-relations/disciplinary" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200">
                              VIEW
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state when no data */}
                  {totalCases === 0 && (
                    <div className="text-center py-12 px-6">
                      <div className="w-20 h-20 mx-auto mb-4 bg-background rounded-full flex items-center justify-center">
                        <DocumentTextIcon className="w-9 h-9 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-1">No cases found</h3>
                      <p className="text-sm text-muted-foreground mb-5">No labour relations cases match the current filters.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
