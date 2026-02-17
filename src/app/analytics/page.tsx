'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '../../components/PageWrapper';
import { 
  AdvancedAnalyticsDashboard, 
  RealTimeMetrics, 
  InteractiveFilters,
  FilterConfig,
  FilterValue 
} from '../../components/analytics';
import { useTheme } from '../../contexts/ThemeContext';
// Filter configuration for analytics
const analyticsFilters: FilterConfig[] = [
  {
    id: 'department',
    label: 'Department',
    type: 'select',
    options: [
      { value: 'engineering', label: 'Engineering' },
      { value: 'product', label: 'Product' },
      { value: 'design', label: 'Design' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'sales', label: 'Sales' },
    ],
    placeholder: 'Select department',
  },
  {
    id: 'position_level',
    label: 'Position Level',
    type: 'multiselect',
    options: [
      { value: 'entry', label: 'Entry Level' },
      { value: 'mid', label: 'Mid Level' },
      { value: 'senior', label: 'Senior Level' },
      { value: 'lead', label: 'Lead/Principal' },
      { value: 'manager', label: 'Manager' },
    ],
    placeholder: 'Select position levels',
  },
  {
    id: 'source',
    label: 'Application Source',
    type: 'multiselect',
    options: [
      { value: 'linkedin', label: 'LinkedIn' },
      { value: 'indeed', label: 'Indeed' },
      { value: 'company_site', label: 'Company Website' },
      { value: 'referrals', label: 'Employee Referrals' },
      { value: 'university', label: 'University Partnerships' },
    ],
    placeholder: 'Select sources',
  },
  {
    id: 'date_range',
    label: 'Date Range',
    type: 'daterange',
    placeholder: 'Select date range',
  },
  {
    id: 'experience_years',
    label: 'Years of Experience',
    type: 'range',
    min: 0,
    max: 20,
    placeholder: 'Select experience range',
  },
  {
    id: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search positions, candidates, or keywords...',
  },
];

export default function AnalyticsPage() {
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);
  const { setCurrentRole } = useTheme();

  // Set theme to executive for analytics
  useEffect(() => {
    setCurrentRole('EXECUTIVE');
  }, [setCurrentRole]);

  const handleFilterChange = (values: FilterValue[]) => {
    setFilterValues(values);
    // TODO: Apply filters to analytics data
    console.log('Applied filters:', values);
  };

  const handleFilterReset = () => {
    setFilterValues([]);
    console.log('Filters reset');
  };

  const actions = (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
      Live Data • Auto-refreshing
    </div>
  );

  return (
    <PageWrapper
      title="Advanced Analytics"
      subtitle="Comprehensive recruitment metrics, insights, and real-time performance monitoring"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Interactive Filters */}
        <InteractiveFilters
          filters={analyticsFilters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />

        {/* Real-Time Metrics Widget */}
        <RealTimeMetrics updateInterval={3000} />

        {/* Advanced Analytics Dashboard */}
        <AdvancedAnalyticsDashboard />

        {/* Additional Insights Section */}
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights & Recommendations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">📈 Performance Highlights</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  Referral program showing 23.3% conversion rate (highest)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-500">•</span>
                  Engineering positions filling 15% faster than Q3
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  Interview-to-offer ratio improved by 12% this month
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">⚠️ Areas for Improvement</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  Product Manager roles taking 25% longer than target
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  University recruitment showing low conversion (9%)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">•</span>
                  LinkedIn applications up 40% but conversion flat
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}