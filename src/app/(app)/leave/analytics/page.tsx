'use client';

import { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveAnalyticsCharts from '@/components/leave/LeaveAnalyticsCharts';
import { aiLeaveService } from '@/services/aiLeaveService';
import { LeavePatternResult } from '@/types/ai';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function LeaveAnalyticsPage() {
  const [aiInsights, setAiInsights] = useState<LeavePatternResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function analyzePatterns() {
    setAiLoading(true);
    try {
      const result = await aiLeaveService.analyzePatterns({
        department: 'All Departments',
        totalEmployees: 50,
        leaveData: [],
        avgLeaveDaysPerEmployee: 15,
        year: new Date().getFullYear(),
      });
      setAiInsights(result);
    } catch (error) {
      console.error('AI leave analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="Leave Analytics"
        subtitle="Insights and trends on leave usage"
        actions={
          <button onClick={analyzePatterns} disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            {aiLoading ? 'Analysing...' : 'AI Pattern Analysis'}
          </button>
        }
      >
        {aiInsights && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-900 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                AI Leave Pattern Analysis
              </h3>
              <button onClick={() => setAiInsights(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{aiInsights.overallAnalysis}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiInsights.patterns?.length > 0 && (
                <div className="enterprise-card p-3">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Patterns Detected</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">{aiInsights.patterns.map((p, i) => <li key={i}>- {p}</li>)}</ul>
                </div>
              )}
              {aiInsights.burnoutWarnings?.length > 0 && (
                <div className="enterprise-card p-3">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Burnout Warnings</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">{aiInsights.burnoutWarnings.map((w, i) => <li key={i}>- {w}</li>)}</ul>
                </div>
              )}
              {aiInsights.coverageRisks?.length > 0 && (
                <div className="enterprise-card p-3">
                  <h4 className="text-sm font-medium text-amber-700 mb-1">Coverage Risks</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">{aiInsights.coverageRisks.map((r, i) => <li key={i}>- {r}</li>)}</ul>
                </div>
              )}
              {aiInsights.staffingRecommendations?.length > 0 && (
                <div className="enterprise-card p-3">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Staffing Recommendations</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">{aiInsights.staffingRecommendations.map((r, i) => <li key={i}>- {r}</li>)}</ul>
                </div>
              )}
            </div>
            {aiInsights.forecast?.length > 0 && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Leave Forecast</h4>
                <div className="flex gap-2 overflow-x-auto">
                  {aiInsights.forecast.map((f, i) => (
                    <div key={i} className="enterprise-card p-2 min-w-[120px] text-center">
                      <p className="text-xs font-medium text-foreground">{f.month}</p>
                      <p className={`text-xs font-bold ${f.expectedLeaveLevel === 'High' || f.expectedLeaveLevel === 'Critical' ? 'text-red-600' : 'text-green-600'}`}>
                        {f.expectedLeaveLevel}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <LeaveAnalyticsCharts />
      </PageWrapper>
    </FeatureGate>
  );
}
