'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import CycleManagement from '@/components/performance/CycleManagement';
import ContractBuilder from '@/components/performance/ContractBuilder';
import { PerformanceCycle } from '@/types/performance';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { getEnumLabel } from '@/utils/enumLabels';
import { aiPerformanceService } from '@/services/aiPerformanceService';
import { ReviewDraftResult, GoalSuggestionResult } from '@/types/ai';
import { SparklesIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function PerformanceDashboard() {
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null);
  const [showContractBuilder, setShowContractBuilder] = useState(false);
  const [aiDraft, setAiDraft] = useState<ReviewDraftResult | null>(null);
  const [aiGoals, setAiGoals] = useState<GoalSuggestionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const { tenantId } = useTenant();
  const { user, hasPermission } = useAuth();
  const userId = user?.id || 'anonymous';
  const canViewPerformance = hasPermission('view_performance');
  const canManagePerformance = hasPermission('manage_performance');

  if (!canViewPerformance) {
    return (
      <PageWrapper title="Performance Management">
        <div className="text-center py-16 enterprise-card max-w-lg mx-auto">
          <ShieldExclamationIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-foreground mb-2">Access restricted</p>
          <p className="text-sm text-muted-foreground mb-4">
            This page is for HR managers and administrators. To view your own performance data, visit your personal performance page.
          </p>
          <Link
            href="/employee/performance"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-control bg-cta text-cta-foreground hover:bg-cta/90 transition-colors"
          >
            Go to My Performance
          </Link>
        </div>
      </PageWrapper>
    );
  }

  const handleCycleSelect = (cycle: PerformanceCycle) => {
    setSelectedCycle(cycle);
    setShowContractBuilder(false);
  };

  const handleCreateContract = () => {
    if (selectedCycle) {
      setShowContractBuilder(true);
    }
  };

  async function generateAiDraft() {
    setAiLoading(true);
    try {
      const result = await aiPerformanceService.draftReview({
        employeeName: 'Selected Employee',
        jobTitle: 'Employee Role',
        department: 'Department',
        reviewPeriod: selectedCycle?.name || 'Current Period',
        goals: [],
        achievements: [],
      });
      setAiDraft(result);
      setShowAiPanel(true);
    } catch (error) {
      console.error('AI draft generation failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  async function generateAiGoals() {
    setAiLoading(true);
    try {
      const result = await aiPerformanceService.suggestGoals({
        employeeName: 'Selected Employee',
        jobTitle: 'Employee Role',
        department: 'Department',
      });
      setAiGoals(result);
      setShowAiPanel(true);
    } catch (error) {
      console.error('AI goal suggestion failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  const actions = selectedCycle ? (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        <span className="font-medium">Active Cycle:</span> {selectedCycle.name}
      </span>
      {canManagePerformance && (
        <button
          onClick={handleCreateContract}
          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-control bg-cta text-cta-foreground hover:bg-cta/90 transition-colors"
        >
          Create Contract
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <PageWrapper
      title="Performance Management"
      subtitle="Manage performance cycles, contracts, and reviews"
      actions={actions}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cycle Management */}
        <div className="lg:col-span-2">
          <CycleManagement
            tenantId={tenantId}
            userId={userId}
            onCycleSelect={handleCycleSelect}
            canManage={canManagePerformance}
          />
        </div>

        {/* Quick Stats / Actions */}
        <div className="space-y-4">
          {/* Cycle Quick Stats */}
          {selectedCycle && (
            <div className="enterprise-card">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Cycle Overview
                </h3>
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <span className="text-xs font-medium text-foreground">
                      {getEnumLabel('cycleStatus', selectedCycle.status)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Start Date:</span>
                    <span className="text-xs font-medium text-foreground">
                      {new Date(selectedCycle.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">End Date:</span>
                    <span className="text-xs font-medium text-foreground">
                      {new Date(selectedCycle.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="enterprise-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 border border-border rounded-control text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  View All Contracts
                </button>
                <button className="w-full text-left px-3 py-2 border border-border rounded-control text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  Performance Templates
                </button>
                <button className="w-full text-left px-3 py-2 border border-border rounded-control text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  View Reports
                </button>
              </div>
            </div>
          </div>

          {/* AI Tools */}
          <div className="enterprise-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-purple-500" />
                AI Assistant
              </h3>
              <div className="space-y-2">
                <button
                  onClick={generateAiDraft}
                  disabled={aiLoading}
                  className="w-full px-3 py-2 text-xs text-left bg-purple-500/10 hover:bg-purple-500/15 rounded-control text-purple-700 dark:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  {aiLoading ? 'Generating...' : 'Draft Performance Review'}
                </button>
                <button
                  onClick={generateAiGoals}
                  disabled={aiLoading}
                  className="w-full px-3 py-2 text-xs text-left bg-purple-500/10 hover:bg-purple-500/15 rounded-control text-purple-700 dark:text-purple-300 disabled:opacity-50 transition-colors"
                >
                  {aiLoading ? 'Generating...' : 'Suggest Goals'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Results Panel */}
      {showAiPanel && (aiDraft || aiGoals) && (
        <div className="enterprise-card mt-4">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <SparklesIcon className="h-4 w-4 text-purple-500" />
                AI Insights
              </h3>
              <button onClick={() => setShowAiPanel(false)} className="text-muted-foreground hover:text-foreground text-xs transition-colors">
                Close
              </button>
            </div>
            {aiDraft && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-medium text-foreground mb-1">Review Narrative</h4>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{aiDraft.narrative}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-500/10 p-3 rounded-control">
                    <h4 className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Strengths</h4>
                    <p className="text-xs text-green-600 dark:text-green-400">{aiDraft.strengthsSummary}</p>
                  </div>
                  <div className="bg-amber-500/10 p-3 rounded-control">
                    <h4 className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">Development Areas</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400">{aiDraft.developmentAreas}</p>
                  </div>
                </div>
                {aiDraft.suggestedGoals && aiDraft.suggestedGoals.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-foreground mb-1">Suggested Goals</h4>
                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                      {aiDraft.suggestedGoals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {aiGoals && aiGoals.goals && (
              <div className="space-y-3">
                {aiGoals.goals.map((goal, i) => (
                  <div key={i} className="bg-muted p-3 rounded-control">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-foreground">{goal.goal}</h4>
                      <span className="text-[10px] px-2 py-0.5 bg-cta/10 text-cta rounded-full">{goal.category}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{goal.measurableTarget}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">Timeline: {goal.timeframe} | {goal.rationale}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contract Builder Modal */}
      {showContractBuilder && selectedCycle && (
        <div className="fixed inset-0 bg-black/30 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto border border-border w-full max-w-6xl shadow-lg rounded-card bg-card">
            <ContractBuilder
              cycle={selectedCycle}
              tenantId={tenantId}
              userId={userId}
              onContractCreated={() => setShowContractBuilder(false)}
              onCancel={() => setShowContractBuilder(false)}
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
