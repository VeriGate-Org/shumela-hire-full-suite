'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';

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

  const maxCategoryCount = Math.max(...(recognition.topRecognitionCategories || []).map((c) => c.count), 1);

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="Engagement Analytics" subtitle="Employee engagement, survey participation, and recognition metrics">
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
