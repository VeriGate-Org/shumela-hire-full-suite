'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  performanceEnhancementService,
  SkillGap,
  TrainingRecommendation,
} from '@/services/performanceEnhancementService';
import { AcademicCapIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function SkillGapsPage() {
  const { user } = useAuth();
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [viewMode, setViewMode] = useState<'employee' | 'department'>('employee');
  const [departmentId, setDepartmentId] = useState('');

  const isManager = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  async function loadGaps() {
    if (viewMode === 'employee' && !employeeId) return;
    if (viewMode === 'department' && !departmentId) return;

    setLoading(true);
    setSearched(true);
    try {
      if (viewMode === 'employee') {
        const id = parseInt(employeeId);
        const [gapData, recData] = await Promise.all([
          performanceEnhancementService.getSkillGaps(id),
          performanceEnhancementService.getTrainingRecommendations(id),
        ]);
        setGaps(gapData);
        setRecommendations(recData);
      } else {
        const gapData = await performanceEnhancementService.getDepartmentGaps(parseInt(departmentId));
        setGaps(gapData);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Failed to load skill gaps:', error);
    } finally {
      setLoading(false);
    }
  }

  const getGapColor = (gap: number) => {
    if (gap <= 0) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (gap === 1) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getGapBarColor = (gap: number) => {
    if (gap <= 0) return 'bg-green-500';
    if (gap === 1) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <FeatureGate feature="SKILL_GAP_ANALYSIS">
      <PageWrapper title="Skill Gap Analysis" subtitle="Identify competency gaps and recommended training">
        <div className="space-y-6">
          {/* View Toggle + Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {isManager && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setViewMode('employee')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    viewMode === 'employee'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Employee View
                </button>
                <button
                  onClick={() => setViewMode('department')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    viewMode === 'department'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Department View
                </button>
              </div>
            )}
            <div className="flex gap-4">
              {viewMode === 'employee' ? (
                <input
                  type="number"
                  placeholder="Enter Employee ID"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              ) : (
                <input
                  type="text"
                  placeholder="Enter Department ID"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              )}
              <button
                onClick={loadGaps}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Analyze Gaps
              </button>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          )}

          {/* No Gaps */}
          {!loading && searched && gaps.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No skill gaps found. All competencies are at or above target levels.</p>
            </div>
          )}

          {/* Gap Table */}
          {!loading && gaps.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" />
                  Competency Gaps ({gaps.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Competency
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Current
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Target
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Gap
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Gap Indicator
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {gaps.map((gap) => (
                      <tr key={gap.competencyId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {gap.competencyName}
                          </div>
                          {gap.frameworkName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {gap.frameworkName}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {gap.category || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                          {gap.currentLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                          {gap.targetLevel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGapColor(gap.gap)}`}>
                            -{gap.gap}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getGapBarColor(gap.gap)}`}
                              style={{ width: `${Math.min((gap.gap / 5) * 100, 100)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Training Recommendations */}
          {!loading && recommendations.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5 text-blue-500" />
                  Recommended Training ({recommendations.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recommendations.map((rec) => (
                  <div key={rec.courseId} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {rec.courseTitle}
                        </h4>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {rec.category && <span>{rec.category}</span>}
                          {rec.deliveryMethod && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700">
                              {rec.deliveryMethod}
                            </span>
                          )}
                          {rec.durationHours && <span>{rec.durationHours}h</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 ml-4">
                        {rec.matchingCompetencies.map((comp) => (
                          <span
                            key={comp}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
