'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  performanceEnhancementService,
  SkillGap,
  TrainingRecommendation,
} from '@/services/performanceEnhancementService';
import { useToast } from '@/components/Toast';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type ViewMode = 'employee' | 'department';

export default function SkillGapsPage() {
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<ViewMode>('employee');
  const [employeeId, setEmployeeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleEmployeeSearch() {
    if (!employeeId) {
      toast('Please enter an Employee ID', 'error');
      return;
    }
    setLoading(true);
    setSearched(true);
    setViewMode('employee');
    try {
      const [gapData, recData] = await Promise.all([
        performanceEnhancementService.getSkillGaps(employeeId),
        performanceEnhancementService.getTrainingRecommendations(employeeId),
      ]);
      setGaps(gapData);
      setRecommendations(recData);
    } catch (err: any) {
      toast(err.message || 'Failed to load skill gaps', 'error');
      setGaps([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDepartmentSearch() {
    if (!departmentId) {
      toast('Please enter a Department ID', 'error');
      return;
    }
    setLoading(true);
    setSearched(true);
    setViewMode('department');
    try {
      const gapData = await performanceEnhancementService.getDepartmentGaps(departmentId);
      setGaps(gapData);
      setRecommendations([]);
    } catch (err: any) {
      toast(err.message || 'Failed to load department gaps', 'error');
      setGaps([]);
    } finally {
      setLoading(false);
    }
  }

  function gapColor(gap: number) {
    if (gap >= 3) return 'bg-red-500';
    if (gap >= 2) return 'bg-orange-500';
    if (gap >= 1) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  function gapTextColor(gap: number) {
    if (gap >= 3) return 'text-red-700';
    if (gap >= 2) return 'text-orange-700';
    if (gap >= 1) return 'text-yellow-700';
    return 'text-green-700';
  }

  const categoryBadge = (category: string | null) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    const colors: Record<string, string> = {
      TECHNICAL: 'bg-blue-100 text-blue-800',
      LEADERSHIP: 'bg-purple-100 text-purple-800',
      COMMUNICATION: 'bg-teal-100 text-teal-800',
      MANAGEMENT: 'bg-indigo-100 text-indigo-800',
    };
    return colors[category.toUpperCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <FeatureGate feature="COMPETENCY_MAPPING">
      <PageWrapper title="Skill Gap Analysis" subtitle="Identify and address competency gaps">
        {/* Search Section */}
        <div className="bg-white rounded-[10px] border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Search */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MagnifyingGlassIcon className="h-4 w-4" />
                Employee Search
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="Employee ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                />
                <button
                  onClick={handleEmployeeSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-sm disabled:opacity-50"
                >
                  Search
                </button>
              </div>
            </div>

            {/* Department Search */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BuildingOfficeIcon className="h-4 w-4" />
                Department View
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  placeholder="Department ID"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-gold-500 focus:border-gold-500"
                />
                <button
                  onClick={handleDepartmentSearch}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  View Department Gaps
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500" />
          </div>
        )}

        {/* Gap Table */}
        {!loading && searched && (
          <>
            {gaps.length === 0 ? (
              <div className="bg-white rounded-[10px] border border-gray-200 p-6 text-center py-12">
                <ExclamationTriangleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No skill gaps found for this {viewMode}</p>
              </div>
            ) : (
              <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {viewMode === 'employee' ? 'Employee' : 'Department'} Skill Gaps
                  </h2>
                  <p className="text-sm text-gray-500">{gaps.length} gap(s) identified</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Competency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Current Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Target Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Gap
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {gaps.map((gap) => (
                        <tr key={gap.competencyId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {gap.competencyName}
                              </p>
                              {gap.frameworkName && (
                                <p className="text-xs text-gray-500">{gap.frameworkName}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs rounded-full ${categoryBadge(
                                gap.category
                              )}`}
                            >
                              {gap.category || 'General'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{gap.currentLevel}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{gap.targetLevel}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 max-w-[100px]">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${gapColor(gap.gap)}`}
                                    style={{
                                      width: `${Math.min((gap.gap / 5) * 100, 100)}%`,
                                    }}
                                  />
                                </div>
                              </div>
                              <span
                                className={`text-sm font-semibold ${gapTextColor(gap.gap)}`}
                              >
                                {gap.gap}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Training Recommendations (employee view only) */}
            {viewMode === 'employee' && recommendations.length > 0 && (
              <div className="bg-white rounded-[10px] border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <AcademicCapIcon className="h-5 w-5" />
                  Training Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.courseId}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-2">{rec.courseTitle}</h3>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {rec.category && (
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${categoryBadge(
                              rec.category
                            )}`}
                          >
                            {rec.category}
                          </span>
                        )}
                        {rec.deliveryMethod && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                            {rec.deliveryMethod}
                          </span>
                        )}
                      </div>
                      {rec.durationHours !== null && (
                        <p className="text-xs text-gray-500 mb-2">
                          Duration: {rec.durationHours} hour{rec.durationHours !== 1 ? 's' : ''}
                        </p>
                      )}
                      {rec.matchingCompetencies.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Matching Competencies:</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.matchingCompetencies.map((comp, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded-full bg-gold-50 text-gold-700 border border-gold-200"
                              >
                                {comp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
