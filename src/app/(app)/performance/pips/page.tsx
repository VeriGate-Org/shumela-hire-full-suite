'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, Pip } from '@/services/performanceEnhancementService';
import { ExclamationTriangleIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function PipsPage() {
  const [pips, setPips] = useState<Pip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPips();
  }, []);

  async function loadPips() {
    setLoading(true);
    try {
      const data = await performanceEnhancementService.getActivePips(0, 50);
      setPips(data.content);
    } catch (error) {
      console.error('Failed to load PIPs:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800',
      EXTENDED: 'bg-blue-100 text-blue-800',
      TERMINATED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const milestoneStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'MET': return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'MISSED': return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <FeatureGate feature="PERFORMANCE_PIP">
      <PageWrapper title="Performance Improvement Plans" subtitle="Manage PIPs and track employee progress">
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : pips.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active Performance Improvement Plans</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pips.map((pip) => (
                <div key={pip.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        <Link href={`/performance/pips/${pip.id}`} className="hover:text-gold-600 hover:underline">
                          {pip.employeeName}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Manager: {pip.managerName}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusBadge(pip.status)}`}>{pip.status}</span>
                  </div>

                  {pip.reason && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{pip.reason}</p>
                  )}

                  <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Start: {new Date(pip.startDate).toLocaleDateString()}</span>
                    <span>End: {new Date(pip.endDate).toLocaleDateString()}</span>
                  </div>

                  {pip.milestones && pip.milestones.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Milestones</h4>
                      <div className="space-y-2">
                        {pip.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center gap-2">
                              {milestoneStatusIcon(milestone.status)}
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{milestone.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Target: {new Date(milestone.targetDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              milestone.status === 'MET' ? 'bg-green-100 text-green-800' :
                              milestone.status === 'MISSED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {milestone.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
