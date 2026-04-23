'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { engagementService, WellnessProgram } from '@/services/engagementService';
import {
  HeartIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  FireIcon,
  FaceSmileIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

interface EngagementDriver {
  driver: string;
  score: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

interface EngagementTrend {
  quarter: string;
  engagementScore: number;
  eNPS: number;
  participationRate: number;
}

interface EngagementSummary {
  overallEngagementScore: number;
  eNPSScore: number;
  surveyParticipationRate: number;
  averageSentimentScore: number;
}

function computeBurnoutRisk(drivers: EngagementDriver[]): { level: string; score: number; factors: string[] } {
  const riskFactors: string[] = [];
  let riskPoints = 0;

  const workLife = drivers.find(d => d.driver.toLowerCase().includes('work-life'));
  if (workLife) {
    if (workLife.score < 6) { riskPoints += 3; riskFactors.push('Low work-life balance score'); }
    else if (workLife.score < 7) { riskPoints += 1; }
    if (workLife.trend === 'DOWN') { riskPoints += 1; riskFactors.push('Declining work-life balance trend'); }
  }

  const compensation = drivers.find(d => d.driver.toLowerCase().includes('compensation'));
  if (compensation) {
    if (compensation.score < 6) { riskPoints += 2; riskFactors.push('Low compensation satisfaction'); }
    if (compensation.trend === 'DOWN') { riskPoints += 1; riskFactors.push('Declining compensation sentiment'); }
  }

  const career = drivers.find(d => d.driver.toLowerCase().includes('career'));
  if (career) {
    if (career.score < 6.5) { riskPoints += 2; riskFactors.push('Limited career growth perception'); }
    if (career.trend === 'DOWN') { riskPoints += 1; riskFactors.push('Declining career growth outlook'); }
  }

  const management = drivers.find(d => d.driver.toLowerCase().includes('management'));
  if (management && management.score < 6.5) { riskPoints += 1; riskFactors.push('Management quality concerns'); }

  if (riskPoints >= 5) return { level: 'HIGH', score: Math.min(riskPoints, 10), factors: riskFactors };
  if (riskPoints >= 3) return { level: 'MODERATE', score: riskPoints, factors: riskFactors };
  return { level: 'LOW', score: riskPoints, factors: riskFactors };
}

export default function WellnessIndicatorsPage() {
  const [drivers, setDrivers] = useState<EngagementDriver[]>([]);
  const [trends, setTrends] = useState<EngagementTrend[]>([]);
  const [summary, setSummary] = useState<EngagementSummary | null>(null);
  const [programs, setPrograms] = useState<WellnessProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [analytics, progs] = await Promise.all([
        hrAnalyticsService.getEngagementAnalytics(),
        engagementService.getActiveWellnessPrograms(),
      ]);
      const data = analytics as any;
      setDrivers(data?.engagementDrivers || []);
      setTrends(data?.engagementTrends || []);
      setSummary(data?.summary || null);
      setPrograms(progs || []);
    } catch {
      console.error('Failed to load wellness data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <FeatureGate feature="WELLNESS_PROGRAMS">
        <PageWrapper title="Wellness Indicators" subtitle="Loading...">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  const burnout = computeBurnoutRisk(drivers);
  const burnoutColor = burnout.level === 'HIGH' ? 'red' : burnout.level === 'MODERATE' ? 'yellow' : 'green';
  const totalParticipants = programs.reduce((s, p) => s + p.currentParticipants, 0);
  const programsByType = programs.reduce((acc, p) => {
    acc[p.programType] = (acc[p.programType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const trendIcon = (trend: string) => {
    if (trend === 'UP') return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
    if (trend === 'DOWN') return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
    return <MinusIcon className="w-4 h-4 text-gray-400" />;
  };

  const driverColor = (score: number) => {
    if (score >= 7.5) return 'text-green-700 bg-green-50';
    if (score >= 6.5) return 'text-blue-700 bg-blue-50';
    if (score >= 5.5) return 'text-yellow-700 bg-yellow-50';
    return 'text-red-700 bg-red-50';
  };

  return (
    <FeatureGate feature="WELLNESS_PROGRAMS">
      <PageWrapper title="Wellness Indicators" subtitle="Employee wellness monitoring, burnout risk assessment, and program participation">
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`rounded-lg p-4 text-center bg-${burnoutColor}-50`}>
              <FireIcon className={`w-6 h-6 text-${burnoutColor}-600 mx-auto mb-1`} />
              <p className={`text-xl font-bold text-${burnoutColor}-700`}>{burnout.level}</p>
              <p className="text-xs text-muted-foreground">Burnout Risk</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-blue-50">
              <FaceSmileIcon className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-blue-700">{summary?.averageSentimentScore?.toFixed(1) || '—'}/5</p>
              <p className="text-xs text-muted-foreground">Sentiment Score</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-green-50">
              <HeartIcon className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-green-700">{programs.length}</p>
              <p className="text-xs text-muted-foreground">Active Programs</p>
            </div>
            <div className="rounded-lg p-4 text-center bg-purple-50">
              <UserGroupIcon className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-purple-700">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Total Participants</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Burnout Risk Assessment */}
            <div className="enterprise-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FireIcon className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-semibold text-foreground">Burnout Risk Assessment</h3>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${
                  burnout.level === 'HIGH' ? 'border-red-300 bg-red-50' :
                  burnout.level === 'MODERATE' ? 'border-yellow-300 bg-yellow-50' :
                  'border-green-300 bg-green-50'
                }`}>
                  <span className={`text-lg font-bold ${
                    burnout.level === 'HIGH' ? 'text-red-700' :
                    burnout.level === 'MODERATE' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>{burnout.score}/10</span>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${
                    burnout.level === 'HIGH' ? 'text-red-700' :
                    burnout.level === 'MODERATE' ? 'text-yellow-700' :
                    'text-green-700'
                  }`}>
                    {burnout.level} Risk
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on engagement driver analysis
                  </p>
                </div>
              </div>
              {burnout.factors.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-muted-foreground">Contributing Factors:</p>
                  {burnout.factors.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <ExclamationTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {burnout.factors.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>No significant risk factors detected</span>
                </div>
              )}
            </div>

            {/* Engagement Drivers */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Wellness Drivers</h3>
              <div className="space-y-3">
                {drivers.map(d => {
                  const pct = (d.score / 10) * 100;
                  return (
                    <div key={d.driver}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground font-medium">{d.driver}</span>
                        <div className="flex items-center gap-2">
                          {trendIcon(d.trend)}
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${driverColor(d.score)}`}>
                            {d.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: d.score >= 7.5 ? '#22C55E' : d.score >= 6.5 ? '#3B82F6' : d.score >= 5.5 ? '#EAB308' : '#EF4444',
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
          {trends.length > 0 && (
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Wellness Engagement Trends</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left pb-3 text-xs font-medium text-muted-foreground">Period</th>
                      <th className="text-center pb-3 text-xs font-medium text-muted-foreground">Engagement Score</th>
                      <th className="text-center pb-3 text-xs font-medium text-muted-foreground">eNPS</th>
                      <th className="text-center pb-3 text-xs font-medium text-muted-foreground">Participation</th>
                      <th className="text-center pb-3 text-xs font-medium text-muted-foreground">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t, i) => {
                      const prev = i > 0 ? trends[i - 1] : null;
                      const scoreDelta = prev ? t.engagementScore - prev.engagementScore : 0;
                      return (
                        <tr key={t.quarter} className="border-b last:border-0">
                          <td className="py-3 font-medium text-foreground">{t.quarter}</td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              t.engagementScore >= 7.5 ? 'bg-green-100 text-green-700' :
                              t.engagementScore >= 6.5 ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>{t.engagementScore.toFixed(1)}</span>
                          </td>
                          <td className="py-3 text-center text-foreground">{t.eNPS}</td>
                          <td className="py-3 text-center text-muted-foreground">{t.participationRate}%</td>
                          <td className="py-3 text-center">
                            {scoreDelta > 0 && <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mx-auto" />}
                            {scoreDelta < 0 && <ArrowTrendingDownIcon className="w-4 h-4 text-red-500 mx-auto" />}
                            {scoreDelta === 0 && i > 0 && <MinusIcon className="w-4 h-4 text-gray-400 mx-auto" />}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Program Participation by Type */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Program Participation by Category</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries({
                  PHYSICAL: { label: 'Physical', color: 'red', icon: '💪' },
                  MENTAL: { label: 'Mental Health', color: 'blue', icon: '🧠' },
                  FINANCIAL: { label: 'Financial', color: 'green', icon: '💰' },
                  SOCIAL: { label: 'Social', color: 'purple', icon: '🤝' },
                }).map(([type, meta]) => {
                  const count = programsByType[type] || 0;
                  const typePrograms = programs.filter(p => p.programType === type);
                  const participants = typePrograms.reduce((s, p) => s + p.currentParticipants, 0);
                  return (
                    <div key={type} className={`p-3 rounded-lg bg-${meta.color}-50 text-center`}>
                      <span className="text-2xl">{meta.icon}</span>
                      <p className={`text-lg font-bold text-${meta.color}-700 mt-1`}>{count}</p>
                      <p className="text-xs text-muted-foreground">{meta.label} Programs</p>
                      <p className="text-xs text-muted-foreground">{participants} participants</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* EAP & Resources */}
            <div className="enterprise-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-semibold text-foreground">Employee Assistance Programme (EAP)</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">24/7 Confidential Support Line</p>
                  <div className="flex items-center gap-2 mt-1">
                    <PhoneIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-semibold">0800 123 4567</span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">Free, confidential counselling for all employees and their families</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Mental Health Support', desc: 'Counselling, stress management, and psychological support' },
                    { label: 'Financial Wellness', desc: 'Debt counselling, budgeting, and financial planning' },
                    { label: 'Legal Advisory', desc: 'Free legal consultation for personal matters' },
                    { label: 'Substance Abuse', desc: 'Confidential rehabilitation support and referrals' },
                  ].map(resource => (
                    <div key={resource.label} className="flex items-start gap-2 p-2 rounded hover:bg-muted/50">
                      <HeartIcon className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{resource.label}</p>
                        <p className="text-xs text-muted-foreground">{resource.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <Link href="/engagement/wellness" className="text-sm text-blue-600 hover:underline">
                  View all wellness programs →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
