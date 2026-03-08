'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import { aiHrGeneralService } from '@/services/aiHrGeneralService';
import { CaseAnalysisResult } from '@/types/ai';
import { ScaleIcon, ExclamationTriangleIcon, DocumentTextIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function LabourRelationsDashboardPage() {
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<CaseAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseForm, setCaseForm] = useState({ caseType: 'Misconduct', description: '', employeeRole: '', department: '', severity: 'Medium' });

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

  if (loading) {
    return (
      <PageWrapper title="Labour Relations" subtitle="Manage disciplinary cases and employee grievances">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <FeatureGate feature="LABOUR_RELATIONS">
      <PageWrapper title="Labour Relations" subtitle="Manage disciplinary cases and employee grievances"
        actions={
          <button onClick={() => setShowCaseModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            AI Case Advisor
          </button>
        }>
        <div className="space-y-6">
          {showCaseModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                <h3 className="text-lg font-medium mb-4">AI Case Analysis</h3>
                <div className="space-y-3">
                  <select value={caseForm.caseType} onChange={e => setCaseForm(f => ({...f, caseType: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>Misconduct</option><option>Grievance</option><option>Poor Performance</option>
                    <option>Absenteeism</option><option>Harassment</option><option>Insubordination</option>
                  </select>
                  <textarea value={caseForm.description} onChange={e => setCaseForm(f => ({...f, description: e.target.value}))}
                    placeholder="Describe the case..." rows={4} className="w-full px-3 py-2 border rounded-lg text-sm" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={caseForm.employeeRole} onChange={e => setCaseForm(f => ({...f, employeeRole: e.target.value}))}
                      placeholder="Employee Role" className="px-3 py-2 border rounded-lg text-sm" />
                    <input value={caseForm.department} onChange={e => setCaseForm(f => ({...f, department: e.target.value}))}
                      placeholder="Department" className="px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <select value={caseForm.severity} onChange={e => setCaseForm(f => ({...f, severity: e.target.value}))}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option>Low</option><option>Medium</option><option>High</option><option>Critical</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setShowCaseModal(false)} className="px-4 py-2 text-gray-600 text-sm">Cancel</button>
                  <button onClick={analyzeCase} disabled={aiLoading || !caseForm.description}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50">
                    {aiLoading ? 'Analysing...' : 'Analyse Case'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {aiAnalysis && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-purple-900 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  AI Case Analysis
                </h3>
                <button onClick={() => setAiAnalysis(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
              </div>
              <p className="text-sm text-gray-700 mb-3">{aiAnalysis.summary}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Steps</h4>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    {aiAnalysis.recommendedSteps?.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Legal Considerations</h4>
                  <ul className="text-xs text-gray-600 space-y-1">{aiAnalysis.legalConsiderations?.map((l, i) => <li key={i}>- {l}</li>)}</ul>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-700 mb-1">Documentation Required</h4>
                  <ul className="text-xs text-gray-600 space-y-1">{aiAnalysis.documentationRequired?.map((d, i) => <li key={i}>- {d}</li>)}</ul>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Risk Assessment</h4>
                  <p className="text-xs text-gray-600">{aiAnalysis.riskAssessment}</p>
                </div>
              </div>
              <div className="mt-3 bg-white p-3 rounded-lg">
                <h4 className="text-sm font-medium text-purple-700 mb-1">Suggested Resolution</h4>
                <p className="text-xs text-gray-600">{aiAnalysis.suggestedResolution}</p>
              </div>
            </div>
          )}
          {/* Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/labour-relations/disciplinary">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-red-500 p-3 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Open Cases</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(disciplinaryStats.open || 0) + (disciplinaryStats.investigation || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/labour-relations/disciplinary">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-yellow-500 p-3 rounded-lg">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Hearings Scheduled</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {disciplinaryStats.hearingScheduled || 0}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/admin/labour-relations/grievances">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Grievances</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {(grievanceStats.filed || 0) + (grievanceStats.underReview || 0) + (grievanceStats.mediation || 0)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
              <div className="flex items-center">
                <div className="bg-green-500 p-3 rounded-lg">
                  <ScaleIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(disciplinaryStats.closed || 0) + (grievanceStats.resolved || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Disciplinary Cases Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Disciplinary Cases</h3>
                <Link href="/admin/labour-relations/disciplinary"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Open</span>
                  <span className="text-lg font-bold text-red-600">{disciplinaryStats.open || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Under Investigation</span>
                  <span className="text-lg font-bold text-orange-600">{disciplinaryStats.investigation || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hearing Scheduled</span>
                  <span className="text-lg font-bold text-yellow-600">{disciplinaryStats.hearingScheduled || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hearing Completed</span>
                  <span className="text-lg font-bold text-blue-600">{disciplinaryStats.hearingCompleted || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Closed</span>
                  <span className="text-lg font-bold text-green-600">{disciplinaryStats.closed || 0}</span>
                </div>
              </div>
            </div>

            {/* Grievances Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Grievances</h3>
                <Link href="/admin/labour-relations/grievances"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Filed</span>
                  <span className="text-lg font-bold text-blue-600">{grievanceStats.filed || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Under Review</span>
                  <span className="text-lg font-bold text-yellow-600">{grievanceStats.underReview || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Mediation</span>
                  <span className="text-lg font-bold text-orange-600">{grievanceStats.mediation || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Escalated</span>
                  <span className="text-lg font-bold text-red-600">{grievanceStats.escalated || 0}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-3 border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">Resolved</span>
                  <span className="text-lg font-bold text-green-600">{grievanceStats.resolved || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
