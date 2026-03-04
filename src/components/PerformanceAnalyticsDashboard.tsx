'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Clock, DollarSign, Target,
  Star, AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';

interface PerformanceMetrics {
  recruitmentMetrics: {
    timeToHire: {
      averageDays: number;
      medianDays: number;
      byDepartment: Record<string, number>;
    };
    conversionRates: {
      applicationToScreening: number;
      screeningToInterview: number;
      interviewToOffer: number;
      offerToHire: number;
      overallConversion: number;
    };
    sourceEffectiveness: {
      bySource: Record<string, {
        totalApplications: number;
        hires: number;
        conversionRate: number;
      }>;
    };
    costMetrics: {
      totalHires: number;
      costPerHire: number;
      totalCost: number;
    };
  };
  interviewPerformance: {
    passRatesByStage: Record<string, number>;
    interviewerStats: Array<{
      interviewerName: string;
      totalInterviews: number;
      averageRating: number;
      averageTechnicalScore: number;
      averageCommunicationScore: number;
      averageCulturalScore: number;
    }>;
    feedbackTrends: {
      averageOverallRating: number;
      averageTechnicalScore: number;
      averageCommunicationScore: number;
      averageCulturalScore: number;
    };
    schedulingMetrics: {
      totalInterviews: number;
      completionRate: number;
      cancellationRate: number;
      averageDuration: number;
    };
  };
  hiringTrends: {
    monthlyTrends: Array<{
      month: number;
      year: number;
      hires: number;
      applications: number;
    }>;
    departmentPatterns: {
      byDepartment: Record<string, number>;
    };
  };
  candidateQuality: {
    qualityDistribution: Record<string, number>;
    skillsGaps: Array<{
      skill: string;
      demand: number;
      supply: number;
      gap: number;
    }>;
  };
  efficiencyMetrics: {
    bottlenecks: Array<{
      stage: string;
      averageDays: number;
      bottleneckScore: number;
      impact: string;
    }>;
    resourceMetrics: {
      metrics: Record<string, number>;
    };
  };
}

const PerformanceAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    fetchPerformanceMetrics();
  }, [dateRange]);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await apiFetch('/api/analytics/dashboard');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600';
    if (value >= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-gray-200 h-64 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load performance metrics</p>
          <button
            onClick={fetchPerformanceMetrics}
            className="mt-4 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider px-4 py-2 rounded-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Avg Time to Hire',
      value: `${metrics.recruitmentMetrics.timeToHire.averageDays} days`,
      icon: Clock,
      trend: -2.5,
      color: 'blue'
    },
    {
      title: 'Cost per Hire',
      value: formatCurrency(metrics.recruitmentMetrics.costMetrics.costPerHire),
      icon: DollarSign,
      trend: -8.2,
      color: 'green'
    },
    {
      title: 'Conversion Rate',
      value: `${formatNumber(metrics.recruitmentMetrics.conversionRates.overallConversion, 1)}%`,
      icon: Target,
      trend: 3.1,
      color: 'purple'
    },
    {
      title: 'Interview Rating',
      value: formatNumber(metrics.interviewPerformance.feedbackTrends.averageOverallRating, 1),
      icon: Star,
      trend: 1.8,
      color: 'orange'
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-gray-600">Comprehensive recruitment performance insights</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-sm px-3 py-2"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white p-6 rounded-sm shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{kpi.value}</p>
              </div>
              <kpi.icon className={`w-8 h-8 text-${kpi.color}-600`} />
            </div>
            <div className="flex items-center mt-4">
              {kpi.trend > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
              )}
              <span className={`text-sm font-medium ${kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(kpi.trend)}%
              </span>
              <span className="text-sm text-gray-600 ml-1">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'recruitment', label: 'Recruitment' },
            { id: 'interviews', label: 'Interviews' },
            { id: 'trends', label: 'Trends' },
            { id: 'efficiency', label: 'Efficiency' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {[
                { stage: 'Applications', rate: 100, count: 1000 },
                { stage: 'Screening', rate: metrics.recruitmentMetrics.conversionRates.applicationToScreening, count: Math.round(1000 * metrics.recruitmentMetrics.conversionRates.applicationToScreening / 100) },
                { stage: 'Interviews', rate: metrics.recruitmentMetrics.conversionRates.screeningToInterview, count: Math.round(1000 * metrics.recruitmentMetrics.conversionRates.screeningToInterview / 100) },
                { stage: 'Offers', rate: metrics.recruitmentMetrics.conversionRates.interviewToOffer, count: Math.round(1000 * metrics.recruitmentMetrics.conversionRates.interviewToOffer / 100) },
                { stage: 'Hires', rate: metrics.recruitmentMetrics.conversionRates.offerToHire, count: Math.round(1000 * metrics.recruitmentMetrics.conversionRates.offerToHire / 100) }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.stage}</span>
                      <span className="text-sm text-gray-600">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gold-500 h-2 rounded-full"
                        style={{ width: `${item.rate}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-900">
                    {formatNumber(item.rate, 1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Source Effectiveness */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Source Effectiveness</h3>
            <div className="space-y-4">
              {Object.entries(metrics.recruitmentMetrics.sourceEffectiveness.bySource)
                .sort((a, b) => b[1].conversionRate - a[1].conversionRate)
                .slice(0, 5)
                .map(([source, data]) => (
                <div key={source} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">{source}</span>
                      <span className="text-sm text-gray-600">{data.totalApplications} apps</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${Math.min(data.conversionRate, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-900">
                    {formatNumber(data.conversionRate, 1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interview Performance */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Interview Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(metrics.interviewPerformance.schedulingMetrics.completionRate, 1)}%
                </div>
                <div className="text-sm text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gold-600">
                  {formatNumber(metrics.interviewPerformance.feedbackTrends.averageOverallRating, 1)}
                </div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(metrics.interviewPerformance.schedulingMetrics.averageDuration)}m
                </div>
                <div className="text-sm text-gray-600">Avg Duration</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {metrics.interviewPerformance.schedulingMetrics.totalInterviews}
                </div>
                <div className="text-sm text-gray-600">Total Interviews</div>
              </div>
            </div>
          </div>

          {/* Top Bottlenecks */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Process Bottlenecks</h3>
            <div className="space-y-4">
              {metrics.efficiencyMetrics.bottlenecks
                .sort((a, b) => b.bottleneckScore - a.bottleneckScore)
                .slice(0, 3)
                .map((bottleneck, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center">
                    <AlertCircle className={`w-5 h-5 mr-3 ${
                      bottleneck.impact === 'High' ? 'text-red-500' :
                      bottleneck.impact === 'Medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{bottleneck.stage}</div>
                      <div className="text-sm text-gray-600">{bottleneck.averageDays} days average</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatNumber(bottleneck.bottleneckScore, 1)}
                    </div>
                    <div className="text-sm text-gray-600">{bottleneck.impact} Impact</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recruitment' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Time to Hire by Department */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Time to Hire by Department</h3>
            <div className="space-y-4">
              {Object.entries(metrics.recruitmentMetrics.timeToHire.byDepartment)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, days]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{dept}</span>
                  <span className={`text-sm font-medium ${getStatusColor(days, { good: 20, warning: 30 })}`}>
                    {days} days
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Analysis */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Cost Analysis</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gold-50 rounded">
                <span className="font-medium text-violet-900">Total Recruitment Cost</span>
                <span className="text-xl font-bold text-violet-900">
                  {formatCurrency(metrics.recruitmentMetrics.costMetrics.totalCost)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded">
                <span className="font-medium text-green-900">Cost per Hire</span>
                <span className="text-xl font-bold text-green-900">
                  {formatCurrency(metrics.recruitmentMetrics.costMetrics.costPerHire)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded">
                <span className="font-medium text-purple-900">Total Hires</span>
                <span className="text-xl font-bold text-purple-900">
                  {metrics.recruitmentMetrics.costMetrics.totalHires}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Interviewers */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Top Performing Interviewers</h3>
            <div className="space-y-4">
              {metrics.interviewPerformance.interviewerStats
                .sort((a, b) => b.averageRating - a.averageRating)
                .slice(0, 5)
                .map((interviewer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium text-gray-900">{interviewer.interviewerName}</div>
                    <div className="text-sm text-gray-600">{interviewer.totalInterviews} interviews</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="font-medium">{formatNumber(interviewer.averageRating, 1)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Tech: {formatNumber(interviewer.averageTechnicalScore, 1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Average Score Breakdown</h3>
            <div className="space-y-4">
              {[
                { label: 'Overall Rating', value: metrics.interviewPerformance.feedbackTrends.averageOverallRating, color: 'blue' },
                { label: 'Technical Score', value: metrics.interviewPerformance.feedbackTrends.averageTechnicalScore, color: 'green' },
                { label: 'Communication', value: metrics.interviewPerformance.feedbackTrends.averageCommunicationScore, color: 'purple' },
                { label: 'Cultural Fit', value: metrics.interviewPerformance.feedbackTrends.averageCulturalScore, color: 'orange' }
              ].map((score, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{score.label}</span>
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`bg-${score.color}-600 h-2 rounded-full`}
                        style={{ width: `${(score.value / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumber(score.value, 1)}/5.0
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Monthly Hiring Trends */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Monthly Hiring Trends</h3>
            <div className="h-64 flex items-end space-x-2">
              {metrics.hiringTrends.monthlyTrends.slice(-12).map((month, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="bg-violet-600 rounded-t w-full"
                    style={{ height: `${(month.hires / Math.max(...metrics.hiringTrends.monthlyTrends.map(m => m.hires))) * 200}px` }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2">
                    {month.month}/{month.year}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {month.hires}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Department Hiring Distribution */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Hiring by Department</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(metrics.hiringTrends.departmentPatterns.byDepartment).map(([dept, count]) => (
                <div key={dept} className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold text-gold-600">{count}</div>
                  <div className="text-sm text-gray-600">{dept}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'efficiency' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Resource Utilization */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Resource Utilization</h3>
            <div className="space-y-4">
              {Object.entries(metrics.efficiencyMetrics.resourceMetrics.metrics).map(([metric, value]) => (
                <div key={metric} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {metric.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                      <div
                        className={`h-2 rounded-full ${
                          value >= 80 ? 'bg-green-600' :
                          value >= 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatNumber(value, 1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Optimization */}
          <div className="bg-white p-6 rounded-sm shadow">
            <h3 className="text-lg font-semibold mb-4">Process Optimization Opportunities</h3>
            <div className="space-y-4">
              {metrics.efficiencyMetrics.bottlenecks.map((bottleneck, index) => (
                <div key={index} className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{bottleneck.stage}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bottleneck.impact === 'High' ? 'bg-red-100 text-red-800' :
                      bottleneck.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {bottleneck.impact} Impact
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Average duration: {bottleneck.averageDays} days
                  </div>
                  <div className="text-sm text-gray-600">
                    Bottleneck score: {formatNumber(bottleneck.bottleneckScore, 1)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalyticsDashboard;
