'use client';

import React, { useState } from 'react';
import CycleManagement from '@/components/performance/CycleManagement';
import ContractBuilder from '@/components/performance/ContractBuilder';
import { PerformanceCycle } from '@/types/performance';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { getEnumLabel } from '@/utils/enumLabels';
import { aiPerformanceService } from '@/services/aiPerformanceService';
import { ReviewDraftResult, GoalSuggestionResult } from '@/types/ai';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function PerformanceDashboard() {
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null);
  const [showContractBuilder, setShowContractBuilder] = useState(false);
  const [aiDraft, setAiDraft] = useState<ReviewDraftResult | null>(null);
  const [aiGoals, setAiGoals] = useState<GoalSuggestionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const { tenantId } = useTenant();
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage performance cycles, contracts, and reviews
              </p>
            </div>
            {selectedCycle && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Active Cycle:</span> {selectedCycle.name}
                </div>
                <button
                  onClick={handleCreateContract}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
                >
                  Create Contract
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cycle Management */}
          <div className="lg:col-span-2">
            <CycleManagement
              tenantId={tenantId}
              userId={userId}
              onCycleSelect={handleCycleSelect}
            />
          </div>

          {/* Quick Stats / Actions */}
          <div className="space-y-6">
            {/* Cycle Quick Stats */}
            {selectedCycle && (
              <div className="bg-white shadow rounded-sm">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Cycle Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getEnumLabel('cycleStatus', selectedCycle.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Start Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedCycle.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">End Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedCycle.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-sm">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View All Contracts
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Performance Templates
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View Reports
                  </button>
                </div>
              </div>
            </div>

            {/* AI Tools */}
            <div className="bg-white shadow rounded-sm">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  AI Assistant
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={generateAiDraft}
                    disabled={aiLoading}
                    className="w-full px-4 py-2 text-sm text-left bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 disabled:opacity-50"
                  >
                    {aiLoading ? 'Generating...' : 'Draft Performance Review'}
                  </button>
                  <button
                    onClick={generateAiGoals}
                    disabled={aiLoading}
                    className="w-full px-4 py-2 text-sm text-left bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 disabled:opacity-50"
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
          <div className="lg:col-span-3 bg-white shadow rounded-sm">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5 text-purple-500" />
                  AI Insights
                </h3>
                <button onClick={() => setShowAiPanel(false)} className="text-gray-400 hover:text-gray-600 text-sm">
                  Close
                </button>
              </div>
              {aiDraft && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Review Narrative</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{aiDraft.narrative}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-1">Strengths</h4>
                      <p className="text-sm text-green-700">{aiDraft.strengthsSummary}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg">
                      <h4 className="font-medium text-amber-800 mb-1">Development Areas</h4>
                      <p className="text-sm text-amber-700">{aiDraft.developmentAreas}</p>
                    </div>
                  </div>
                  {aiDraft.suggestedGoals && aiDraft.suggestedGoals.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Suggested Goals</h4>
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {aiDraft.suggestedGoals.map((g, i) => <li key={i}>{g}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {aiGoals && aiGoals.goals && (
                <div className="space-y-3">
                  {aiGoals.goals.map((goal, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-800">{goal.goal}</h4>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">{goal.category}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{goal.measurableTarget}</p>
                      <p className="text-xs text-gray-500 mt-1">Timeline: {goal.timeframe} | {goal.rationale}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contract Builder Modal */}
        {showContractBuilder && selectedCycle && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto border w-full max-w-6xl shadow-lg rounded-sm bg-white">
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
      </div>
    </div>
  );
}