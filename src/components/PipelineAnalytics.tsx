'use client';

import React, { useState } from 'react';

interface PipelineAnalyticsData {
  funnel: Record<string, number>;
  averageStageDurations: Record<string, number>;
  conversions: Record<string, Record<string, number>>;
  successRates: Record<string, number>;
  velocity: Record<string, number>;
  automation: Record<string, number>;
}

interface PipelineAnalyticsProps {
  analytics: PipelineAnalyticsData;
  onRefresh?: () => void;
}

export default function PipelineAnalytics({ analytics, onRefresh }: PipelineAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'durations' | 'conversions' | 'velocity'>('overview');

  // Calculate key metrics
  const getTotalApplications = () => {
    return Object.values(analytics.funnel).reduce((sum, count) => sum + count, 0);
  };

  const getSuccessfulApplications = () => {
    return (analytics.funnel['Offer Accepted'] || 0) + (analytics.funnel['Hired'] || 0);
  };

  const getRejectedApplications = () => {
    return analytics.funnel['Rejected'] || 0;
  };

  const getWithdrawnApplications = () => {
    return analytics.funnel['Withdrawn'] || 0;
  };

  const getOverallSuccessRate = () => {
    const total = getTotalApplications();
    const successful = getSuccessfulApplications();
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0';
  };

  const getAverageVelocity = () => {
    const velocityValues = Object.values(analytics.velocity);
    const average = velocityValues.length > 0 ? 
      velocityValues.reduce((sum, val) => sum + val, 0) / velocityValues.length : 0;
    return average.toFixed(1);
  };

  const getAutomationRate = () => {
    const automated = analytics.automation['Automated'] || 0;
    const manual = analytics.automation['Manual'] || 0;
    const total = automated + manual;
    return total > 0 ? ((automated / total) * 100).toFixed(1) : '0.0';
  };

  // Get top and bottom performing stages
  const getStagePerformance = () => {
    const rates = Object.entries(analytics.successRates)
      .map(([stage, rate]) => ({ stage, rate }))
      .sort((a, b) => b.rate - a.rate);
    
    return {
      best: rates[0] || { stage: 'N/A', rate: 0 },
      worst: rates[rates.length - 1] || { stage: 'N/A', rate: 0 }
    };
  };

  // Get longest duration stages
  const getLongestDurations = () => {
    return Object.entries(analytics.averageStageDurations)
      .map(([stage, hours]) => ({ stage, hours, days: (hours / 24).toFixed(1) }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  };

  const performance = getStagePerformance();
  const longestDurations = getLongestDurations();

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'durations', label: 'Stage Durations', icon: '⏱️' },
    { id: 'conversions', label: 'Conversions', icon: '🔄' },
    { id: 'velocity', label: 'Velocity', icon: '🚀' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Pipeline Analytics</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-4 py-2 text-sm text-gold-600 hover:text-gold-800 font-medium"
          >
            🔄 Refresh Data
          </button>
        )}
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gold-50 rounded-control p-4 border border-violet-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <p className="text-sm font-medium text-violet-900">Total Pipeline</p>
              <p className="text-xl font-bold text-gold-600">{getTotalApplications()}</p>
              <p className="text-xs text-violet-700">applications processed</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-control p-4 border border-green-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-sm font-medium text-green-900">Success Rate</p>
              <p className="text-xl font-bold text-green-600">{getOverallSuccessRate()}%</p>
              <p className="text-xs text-green-700">{getSuccessfulApplications()} successful hires</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-control p-4 border border-purple-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            <div>
              <p className="text-sm font-medium text-purple-900">Daily Velocity</p>
              <p className="text-xl font-bold text-purple-600">{getAverageVelocity()}</p>
              <p className="text-xs text-purple-700">avg transitions per day</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-control p-4 border border-yellow-200">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🤖</span>
            <div>
              <p className="text-sm font-medium text-yellow-900">Automation</p>
              <p className="text-xl font-bold text-yellow-600">{getAutomationRate()}%</p>
              <p className="text-xs text-yellow-700">automated transitions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-control shadow">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Stage Performance */}
              <div>
                <h3 className="text-lg font-medium mb-4">Stage Performance</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-control p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-900">Best Performing Stage</p>
                        <p className="text-lg font-bold text-green-600">{performance.best.stage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{performance.best.rate.toFixed(1)}%</p>
                        <p className="text-xs text-green-700">success rate</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-control p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-900">Needs Attention</p>
                        <p className="text-lg font-bold text-red-600">{performance.worst.stage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">{performance.worst.rate.toFixed(1)}%</p>
                        <p className="text-xs text-red-700">success rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pipeline Breakdown */}
              <div>
                <h3 className="text-lg font-medium mb-4">Pipeline Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-control">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">✅</span>
                      <span className="font-medium">Successful</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">{getSuccessfulApplications()}</p>
                      <p className="text-xs text-gray-600">{getOverallSuccessRate()}%</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-control">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">❌</span>
                      <span className="font-medium">Rejected</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{getRejectedApplications()}</p>
                      <p className="text-xs text-gray-600">
                        {getTotalApplications() > 0 ? ((getRejectedApplications() / getTotalApplications()) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-control">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">↩️</span>
                      <span className="font-medium">Withdrawn</span>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-600">{getWithdrawnApplications()}</p>
                      <p className="text-xs text-gray-600">
                        {getTotalApplications() > 0 ? ((getWithdrawnApplications() / getTotalApplications()) * 100).toFixed(1) : '0.0'}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage Durations Tab */}
        {activeTab === 'durations' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Average Time Spent in Each Stage</h3>
            <div className="space-y-3">
              {longestDurations.map((duration, index) => (
                <div key={duration.stage} className="flex items-center justify-between p-4 border rounded-control">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-red-500' : 
                      index === 1 ? 'bg-orange-500' : 
                      index === 2 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{duration.stage}</p>
                      <p className="text-sm text-gray-600">Stage duration</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{duration.days} days</p>
                    <p className="text-sm text-gray-600">{duration.hours.toFixed(1)} hours</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversions Tab */}
        {activeTab === 'conversions' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Stage-to-Stage Conversion Matrix</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      From Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      To Stage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(analytics.conversions).map(([fromStage, transitions]) =>
                    Object.entries(transitions).map(([toStage, count]) => (
                      <tr key={`${fromStage}-${toStage}`}>
                        <td className="px-4 py-3 text-sm text-gray-900">{fromStage}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{toStage}</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Velocity Tab */}
        {activeTab === 'velocity' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Daily Pipeline Velocity</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analytics.velocity).slice(-14).map(([date, count]) => (
                  <div key={date} className="flex items-center justify-between p-3 border rounded-control">
                    <div>
                      <p className="font-medium text-gray-900">{new Date(date).toLocaleDateString()}</p>
                      <p className="text-sm text-gray-600">Transitions</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gold-600">{count}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div className="bg-gold-50 border border-violet-200 rounded-control p-4">
        <h4 className="font-medium text-violet-900 mb-2">💡 Recommendations</h4>
        <ul className="text-sm text-violet-800 space-y-1">
          {performance.worst.rate < 50 && (
            <li>• Review the {performance.worst.stage} stage process to improve success rates</li>
          )}
          {longestDurations[0]?.hours > 168 && (
            <li>• Consider optimizing the {longestDurations[0].stage} stage to reduce time-to-hire</li>
          )}
          {parseFloat(getAutomationRate()) < 30 && (
            <li>• Increase automation to improve pipeline efficiency and reduce manual work</li>
          )}
          {parseFloat(getOverallSuccessRate()) < 20 && (
            <li>• Overall success rate is low - review screening criteria and job requirements</li>
          )}
        </ul>
      </div>
    </div>
  );
}