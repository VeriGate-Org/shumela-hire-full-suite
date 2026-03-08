'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';
import { aiEngagementService } from '@/services/aiEngagementService';
import { aiAttritionService } from '@/services/aiAttritionService';
import { SentimentAnalysisResult, WorkforceAnalysisResult } from '@/types/ai';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface EngagementSummary {
  overallEngagementScore: number;
  eNPSScore: number;
  surveyParticipationRate: number;
  totalSurveysCompleted: number;
  totalRecognitionsGiven: number;
  recognitionsThisMonth: number;
  averageSentimentScore: number;
}

interface SurveyParticipation {
  department: string;
  invitedCount: number;
  respondedCount: number;
  participationRate: number;
}

interface RecognitionData {
  totalRecognitions: number;
  topRecognitionCategories: { category: string; count: number }[];
  topRecognizedEmployees: { employeeName: string; department: string; recognitionsReceived: number }[];
}

interface EngagementTrend {
  quarter: string;
  engagementScore: number;
  eNPS: number;
  participationRate: number;
}

interface EngagementDriver {
  driver: string;
  score: number;
  trend: string;
}

export default function EngagementAnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [aiSentiment, setAiSentiment] = useState<SentimentAnalysisResult | null>(null);
  const [aiWorkforce, setAiWorkforce] = useState<WorkforceAnalysisResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await hrAnalyticsService.getEngagementAnalytics();
      setMetrics(data);
    } catch {
      toast('Failed to load engagement analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const summary = (metrics.summary || {}) as EngagementSummary;
  const surveyParticipation = (metrics.surveyParticipation || []) as SurveyParticipation[];
  const recognition = (metrics.recognition || {}) as RecognitionData;
  const trends = (metrics.engagementTrends || []) as EngagementTrend[];
  const drivers = (metrics.engagementDrivers || []) as EngagementDriver[];

  async function analyzeSentiment() {
    setAiLoading(true);
    try {
      const result = await aiEngagementService.analyzeSentiment({
        surveyName: 'Engagement Survey',
        surveyType: 'Quarterly',
        totalResponses: summary.totalSurveysCompleted || 0,
        eNpsScore: summary.eNPSScore || 0,
        responses: drivers.map(d => ({
          question: d.driver,
          avgRating: d.score / 2,
          freeTextResponses: [],
        })),
      });
      setAiSentiment(result);
    } catch (error) {
      console.error('AI sentiment analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  async function analyzeWorkforce() {
    setAiLoading(true);
    try {
      const result = await aiAttritionService.analyzeWorkforce({
        department: 'All Departments',
        totalHeadcount: 0,
        avgTenureMonths: 0,
        turnoverRateLast12Months: 0,
        openPositions: 0,
        avgPerformanceRating: 0,
        avgEngagementScore: summary.overallEngagementScore || 0,
      });
      setAiWorkforce(result);
    } catch (error) {
      console.error('AI workforce analysis failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  const maxCategoryCount = Math.max(...(recognition.topRecognitionCategories || []).map((c) => c.count), 1);

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="Engagement Analytics" subtitle="Employee engagement, survey participation, and recognition metrics"
        actions={
          <div className="flex gap-2">
            <button onClick={analyzeSentiment} disabled={aiLoading || loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1">
              <SparklesIcon className="h-4 w-4" />
              {aiLoading ? 'Analysing...' : 'AI Sentiment'}
            </button>
            <button onClick={analyzeWorkforce} disabled={aiLoading || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-50 flex items-center gap-1">
              <SparklesIcon className="h-4 w-4" />
              Workforce Health
            </button>
          </div>
        }
      >
        {aiSentiment && (
          <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                AI Sentiment Analysis
              </h3>
              <button onClick={() => setAiSentiment(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{aiSentiment.executiveSummary}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-purple-700">{aiSentiment.overallSentiment}</p>
                <p className="text-xs text-gray-500">Overall Sentiment</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center">
                <p className="text-lg font-bold text-blue-700">{Math.round(aiSentiment.sentimentScore * 100)}%</p>
                <p className="text-xs text-gray-500">Sentiment Score</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-green-700 mb-1">Key Positives</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">{aiSentiment.positives?.slice(0, 3).map((p, i) => <li key={i}>- {p}</li>)}</ul>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-red-700 mb-1">Key Concerns</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">{aiSentiment.concerns?.slice(0, 3).map((c, i) => <li key={i}>- {c}</li>)}</ul>
              </div>
            </div>
            {aiSentiment.actionItems?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <h4 className="text-xs font-medium text-blue-700 mb-1">Action Items</h4>
                <ul className="text-xs text-gray-600 space-y-0.5">{aiSentiment.actionItems.map((a, i) => <li key={i}>- {a}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        {aiWorkforce && (
          <div className="mb-6 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                AI Workforce Health Assessment
              </h3>
              <button onClick={() => setAiWorkforce(null)} className="text-indigo-400 hover:text-indigo-600 text-sm">Dismiss</button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{aiWorkforce.overallHealthAssessment}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiWorkforce.keyRisks?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-red-700 mb-1">Key Risks</h4>
                  <ul className="text-xs text-gray-600 space-y-0.5">{aiWorkforce.keyRisks.map((r, i) => <li key={i}>- {r}</li>)}</ul>
                </div>
              )}
              {aiWorkforce.strengths?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-green-700 mb-1">Strengths</h4>
                  <ul className="text-xs text-gray-600 space-y-0.5">{aiWorkforce.strengths.map((s, i) => <li key={i}>- {s}</li>)}</ul>
                </div>
              )}
              {aiWorkforce.retentionStrategies?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-blue-700 mb-1">Retention Strategies</h4>
                  <ul className="text-xs text-gray-600 space-y-0.5">{aiWorkforce.retentionStrategies.map((s, i) => <li key={i}>- {s}</li>)}</ul>
                </div>
              )}
              {aiWorkforce.hiringRecommendations?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-xs font-medium text-purple-700 mb-1">Hiring Recommendations</h4>
                  <ul className="text-xs text-gray-600 space-y-0.5">{aiWorkforce.hiringRecommendations.map((h, i) => <li key={i}>- {h}</li>)}</ul>
                </div>
              )}
            </div>
            {aiWorkforce.forecastSummary && (
              <p className="text-xs text-indigo-600 mt-2">Forecast: {aiWorkforce.forecastSummary}</p>
            )}
          </div>
        )}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Engagement Score', value: `${summary.overallEngagementScore}/10`, color: '#8b5cf6' },
                { label: 'eNPS Score', value: summary.eNPSScore, color: summary.eNPSScore >= 30 ? '#10b981' : '#f59e0b' },
                { label: 'Survey Participation', value: `${summary.surveyParticipationRate}%`, color: '#06b6d4' },
                { label: 'Surveys Completed', value: summary.totalSurveysCompleted, color: '#6366f1' },
                { label: 'Total Recognitions', value: summary.totalRecognitionsGiven, color: '#ec4899' },
                { label: 'Recognitions (Month)', value: summary.recognitionsThisMonth, color: '#14b8a6' },
                { label: 'Sentiment Score', value: `${summary.averageSentimentScore}/5`, color: '#f59e0b' },
              ].map((card) => (
                <div key={card.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: card.color }}>
                    {card.value ?? '-'}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Survey Participation by Department */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Survey Participation by Department</h3>
                <div className="space-y-3">
                  {surveyParticipation.map((dept) => (
                    <div key={dept.department}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{dept.department}</span>
                        <span className="text-gray-400">{dept.respondedCount}/{dept.invitedCount} ({dept.participationRate}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${dept.participationRate}%`,
                            backgroundColor: dept.participationRate >= 85 ? '#10b981' : dept.participationRate >= 75 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recognition Categories */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Recognition Categories</h3>
                <div className="flex items-end gap-2 h-40">
                  {(recognition.topRecognitionCategories || []).map((cat) => (
                    <div key={cat.category} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-gray-400 mb-1">{cat.count}</span>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${(cat.count / maxCategoryCount) * 100}%`,
                          backgroundColor: '#ec4899',
                          minHeight: '4px',
                        }}
                      />
                      <span className="text-[9px] text-gray-500 mt-1 text-center leading-tight">{cat.category}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Recognized Employees */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Top Recognized Employees</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 font-medium">#</th>
                        <th className="text-left py-2 font-medium">Employee</th>
                        <th className="text-left py-2 font-medium">Department</th>
                        <th className="text-right py-2 font-medium">Recognitions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(recognition.topRecognizedEmployees || []).map((emp, idx) => (
                        <tr key={emp.employeeName} className="border-b border-gray-700/50">
                          <td className="py-2 text-violet-400 font-bold">{idx + 1}</td>
                          <td className="py-2 text-gray-300">{emp.employeeName}</td>
                          <td className="py-2 text-gray-400">{emp.department}</td>
                          <td className="py-2 text-right text-pink-400 font-medium">{emp.recognitionsReceived}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Engagement Drivers */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Engagement Drivers</h3>
                <div className="space-y-3">
                  {drivers.map((driver) => {
                    const trendIcon = driver.trend === 'UP' ? ' /' : driver.trend === 'DOWN' ? ' \\' : ' -';
                    const trendColor = driver.trend === 'UP' ? 'text-green-400' : driver.trend === 'DOWN' ? 'text-red-400' : 'text-gray-400';
                    return (
                      <div key={driver.driver}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{driver.driver}</span>
                          <span className="text-gray-400">
                            {driver.score}/10 <span className={trendColor}>{trendIcon}</span>
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${(driver.score / 10) * 100}%`,
                              backgroundColor: driver.score >= 7.5 ? '#10b981' : driver.score >= 6.5 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Engagement Trends */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Quarterly Engagement Trends</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 font-medium">Quarter</th>
                      <th className="text-right py-2 font-medium">Engagement Score</th>
                      <th className="text-right py-2 font-medium">eNPS</th>
                      <th className="text-right py-2 font-medium">Participation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t) => (
                      <tr key={t.quarter} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-300">{t.quarter}</td>
                        <td className="py-2 text-right text-violet-400 font-medium">{t.engagementScore}/10</td>
                        <td className="py-2 text-right">
                          <span className={t.eNPS >= 30 ? 'text-green-400' : 'text-amber-400'}>{t.eNPS}</span>
                        </td>
                        <td className="py-2 text-right text-cyan-400">{t.participationRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
