'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { CustomReportBuilder } from '../../../components/analytics';
import { apiFetch } from '@/lib/api-fetch';
import {
  DocumentChartBarIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function CustomReportsPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [savedReports, setSavedReports] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const response = await apiFetch('/api/reports/scheduled');
      if (response.ok) {
        const data = await response.json();
        setSavedReports(Array.isArray(data) ? data : data.content || []);
      }
    } catch (error) {
      console.error('Failed to load reports:', error);
    }
  };

  const handleSaveReport = (reportConfig: any) => {
    console.log('Saving report:', reportConfig);
    // In real app, would save to backend
    setShowBuilder(false);
  };

  const handleDeleteReport = (reportId: string) => {
    setSavedReports(prev => prev.filter(r => r.id !== reportId));
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (showBuilder) {
    return (
      <PageWrapper title="Custom Reports" subtitle="Build personalized reports with drag-and-drop interface">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Custom Report</h1>
              <p className="text-gray-500 mt-1">
                Build personalized reports with drag-and-drop interface
              </p>
            </div>
            <button
              onClick={() => setShowBuilder(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-full hover:bg-gray-50"
            >
              Back to Reports
            </button>
          </div>
          
          <CustomReportBuilder onSave={handleSaveReport} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Custom Reports" subtitle="Build personalized reports with drag-and-drop interface">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Custom Reports</h1>
            <p className="text-gray-500 mt-1">
              Create, manage, and schedule custom recruitment reports
            </p>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600"
          >
            <PlusIcon className="w-4 h-4" />
            Create New Report
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{savedReports.length}</p>
              </div>
              <DocumentChartBarIcon className="w-8 h-8 text-gold-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {savedReports.filter(r => r.status === 'active').length}
                </p>
              </div>
              <EyeIcon className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scheduled Reports</p>
                <p className="text-2xl font-bold text-gray-900">
                  {savedReports.filter(r => r.frequency !== 'Manual').length}
                </p>
              </div>
              <CalendarIcon className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {savedReports.reduce((sum, r) => sum + r.recipients, 0)}
                </p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Report Templates */}
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                name: 'Hiring Pipeline Report',
                description: 'Track candidates through each stage of your hiring process',
                icon: '📊',
                preset: 'pipeline',
              },
              {
                name: 'Source Performance Report',
                description: 'Analyze effectiveness of different recruitment channels',
                icon: '🎯',
                preset: 'sources',
              },
              {
                name: 'Time to Hire Analysis',
                description: 'Monitor hiring speed and identify bottlenecks',
                icon: '⏱️',
                preset: 'time_to_hire',
              },
            ].map((template) => (
              <div
                key={template.preset}
                className="p-4 border border-gray-200 rounded-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setShowBuilder(true)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    <button className="text-gold-600 text-sm font-medium mt-2 hover:text-gold-700 rounded-full">
                      Use Template →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Reports */}
        <div className="bg-white rounded-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Saved Reports</h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage your custom reports and delivery schedules
            </p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {savedReports.map((report) => (
              <div key={report.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      {getStatusBadge(report.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{report.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>Last run: {report.lastRun}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Frequency: {report.frequency}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{report.recipients} recipients</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-gold-600 rounded-full hover:bg-gold-50">
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-orange-600 rounded-full hover:bg-orange-50">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {savedReports.length === 0 && (
            <EmptyState
              icon={DocumentChartBarIcon}
              title="No reports yet"
              description="Create your first custom report to get started with personalized analytics."
              action={{
                label: 'Create Your First Report',
                onClick: () => setShowBuilder(true),
              }}
            />
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
