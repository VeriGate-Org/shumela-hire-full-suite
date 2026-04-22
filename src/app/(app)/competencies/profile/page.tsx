'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, EmployeeCompetency } from '@/services/performanceEnhancementService';
import { AcademicCapIcon } from '@heroicons/react/24/outline';

export default function CompetencyProfilePage() {
  const [competencies, setCompetencies] = useState<EmployeeCompetency[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<string>('');
  const [searched, setSearched] = useState(false);

  async function loadProfile() {
    if (!employeeId) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await performanceEnhancementService.getEmployeeCompetencies(employeeId);
      setCompetencies(data);
    } catch (error) {
      console.error('Failed to load competency profile:', error);
    } finally {
      setLoading(false);
    }
  }

  const getLevelColor = (current: number, target: number) => {
    if (current >= target) return 'text-green-600';
    if (current >= target - 1) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelBar = (level: number, maxLevel = 5) => {
    return Array.from({ length: maxLevel }, (_, i) => (
      <div key={i} className={`h-2 w-6 rounded ${i < level ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
    ));
  };

  return (
    <FeatureGate feature="COMPETENCY_MAPPING">
      <PageWrapper title="Competency Profile" subtitle="View employee competency assessments and gaps">
        <div className="space-y-6">
          {/* Search */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex gap-4">
              <input type="text" placeholder="Enter Employee ID" value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <button onClick={loadProfile}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Load Profile
              </button>
            </div>
          </div>

          {/* Competencies */}
          {loading && searched ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : searched && competencies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No competency assessments found for this employee</p>
            </div>
          ) : competencies.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {competencies[0]?.employeeName}&apos;s Competency Profile
                </h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {competencies.map((comp) => (
                  <div key={comp.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{comp.competencyName}</h4>
                        {comp.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">{comp.category}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-bold ${getLevelColor(comp.currentLevel, comp.targetLevel)}`}>
                          {comp.currentLevel}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400"> / {comp.targetLevel}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Current:</span>
                      <div className="flex gap-1">{getLevelBar(comp.currentLevel)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-16">Target:</span>
                      <div className="flex gap-1">{getLevelBar(comp.targetLevel)}</div>
                    </div>
                    {comp.assessorName && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Assessed by {comp.assessorName} {comp.assessedAt && `on ${new Date(comp.assessedAt).toLocaleDateString()}`}
                      </p>
                    )}
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
