'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { formatEnumValue } from '@/utils/enumLabels';

interface KPI {
  value: number;
  trend: string;
  variance: number;
  status: string;
}

interface Alert {
  metric: string;
  value: number;
  target: number;
  variance: number;
  department: string;
  date: string;
}

interface TrendData {
  date: string;
  value: number;
  trend: string;
}

interface DashboardData {
  kpis: Record<string, KPI>;
  trends: Record<string, TrendData[]>;
  alerts: Alert[];
}

const METRIC_CATEGORIES = [
  { value: 'APPLICATIONS', label: 'Applications', icon: '📋', color: 'blue' },
  { value: 'INTERVIEWS', label: 'Interviews', icon: '🎤', color: 'purple' },
  { value: 'OFFERS', label: 'Offers', icon: '💰', color: 'green' },
  { value: 'PIPELINE', label: 'Pipeline', icon: '🔄', color: 'orange' },
  { value: 'EFFICIENCY', label: 'Efficiency', icon: '⚡', color: 'yellow' },
  { value: 'KPI', label: 'KPIs', icon: '📊', color: 'red' }
];

const REPORT_TYPES = [
  { value: 'EXECUTIVE_SUMMARY', label: 'Executive Summary' },
  { value: 'DEPARTMENT_PERFORMANCE', label: 'Department Performance' },
  { value: 'RECRUITER_SCORECARD', label: 'Recruiter Scorecard' },
  { value: 'PIPELINE_ANALYSIS', label: 'Pipeline Analysis' }
];

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const _currentRole = user?.role || 'recruiter';
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    kpis: {},
    trends: {},
    alerts: []
  });
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('KPI');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [detailedData, setDetailedData] = useState<any>(null);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDepartment) {
        params.append('department', selectedDepartment);
      }

      const response = await apiFetch(`/api/analytics/dashboard?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDepartment]);

  const loadDetailedData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      if (selectedDepartment) {
        params.append('department', selectedDepartment);
      }

      const response = await apiFetch(`/api/analytics/detailed?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDetailedData(data);
      }
    } catch (error) {
      console.error('Error loading detailed data:', error);
    }
  }, [selectedCategory, dateRange, selectedDepartment]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (selectedCategory) {
      loadDetailedData();
    }
  }, [selectedCategory, loadDetailedData]);

  const generateReport = async () => {
    if (!selectedReportType) return;

    try {
      setLoading(true);
      const response = await apiFetch(`/api/analytics/reports/${selectedReportType}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          department: selectedDepartment
        })
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(0);
  };

  const formatPercentage = (value: number): string => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'UP': return '📈';
      case 'DOWN': return '📉';
      case 'STABLE': return '➡️';
      case 'VOLATILE': return '📊';
      default: return '❓';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'UP': return 'text-green-600';
      case 'DOWN': return 'text-red-600';
      case 'STABLE': return 'text-gray-600';
      case 'VOLATILE': return 'text-yellow-600';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'EXCEEDING': return 'bg-green-100 text-green-800 border-green-200';
      case 'ON_TARGET': return 'bg-gold-100 text-gold-800 border-violet-200';
      case 'BELOW_TARGET': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderKPICard = (name: string, kpi: KPI) => (
    <div key={name} className="bg-white rounded-sm shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-700 capitalize">
          {formatEnumValue(name)}
        </h3>
        <span className={`text-lg ${getTrendColor(kpi.trend)}`}>
          {getTrendIcon(kpi.trend)}
        </span>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {formatNumber(kpi.value)}
          </p>
          <p className={`text-sm ${kpi.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercentage(kpi.variance)}
          </p>
        </div>
        
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(kpi.status)}`}>
          {formatEnumValue(kpi.status)}
        </span>
      </div>
    </div>
  );

  const renderSimpleChart = (data: TrendData[], title: string) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="bg-white rounded-sm shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-64 flex items-end space-x-2">
          {data.map((point, index) => {
            const height = ((point.value - minValue) / range) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gold-500 rounded-t transition-all duration-300 hover:bg-gold-600"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${point.date}: ${formatNumber(point.value)}`}
                />
                <span className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                  {new Date(point.date).toLocaleDateString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-sm shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Recruitment metrics and performance insights</p>
          </div>
          
          <div className="flex flex-wrap items-center space-x-4">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
            </select>
            
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
            />
            
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-sm text-sm"
            />
            
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 text-sm"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {dashboardData.alerts && dashboardData.alerts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-3">⚠️ Performance Alerts</h3>
          <div className="space-y-2">
            {dashboardData.alerts.slice(0, 3).map((alert, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-yellow-700">
                  {formatEnumValue(alert.metric)} in {alert.department}
                </span>
                <span className="font-medium text-yellow-800">
                  {formatNumber(alert.value)} (Target: {formatNumber(alert.target)})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(dashboardData.kpis).map(([name, kpi]) => 
          renderKPICard(name, kpi)
        )}
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-sm shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {METRIC_CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedCategory === category.value
                    ? 'border-gold-500 text-gold-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.label}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Category Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trends Chart */}
              {detailedData?.trends && Object.entries(detailedData.trends).map(([metric, data]) => 
                renderSimpleChart(data as TrendData[], formatEnumValue(metric))
              )}
              
              {/* Statistics */}
              {detailedData?.statistics && (
                <div className="bg-gray-50 rounded-sm p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Statistics</h3>
                  <div className="space-y-3">
                    {detailedData.statistics.map((stat: any, index: number) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{stat.metric}</span>
                        <span className="text-sm font-medium text-gray-900">
                          Avg: {formatNumber(stat.average)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full m-4 max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Generate Report</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-sm"
                >
                  <option value="">Select report type...</option>
                  {REPORT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {reportData && (
                <div className="mt-6 max-h-96 overflow-y-auto">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Report Results</h4>
                  <pre className="bg-gray-50 p-4 rounded-sm text-xs overflow-x-auto">
                    {JSON.stringify(reportData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-sm hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={generateReport}
                disabled={!selectedReportType || loading}
                className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}