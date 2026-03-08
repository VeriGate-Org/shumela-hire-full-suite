'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, CompetencyFramework } from '@/services/performanceEnhancementService';
import { AcademicCapIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function CompetenciesPage() {
  const [frameworks, setFrameworks] = useState<CompetencyFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadFrameworks();
  }, []);

  async function loadFrameworks() {
    setLoading(true);
    try {
      const data = await performanceEnhancementService.getFrameworks();
      setFrameworks(data);
    } catch (error) {
      console.error('Failed to load frameworks:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FeatureGate feature="COMPETENCY_MAPPING">
      <PageWrapper title="Competency Frameworks" subtitle="Define and manage organizational competencies"
        actions={
          <Link href="/competencies/profile"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            My Competency Profile
          </Link>
        }>
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : frameworks.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No competency frameworks defined yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {frameworks.map((framework) => (
                <div key={framework.id} className="bg-white dark:bg-gray-800 rounded-lg shadow">
                  <button onClick={() => setExpandedId(expandedId === framework.id ? null : framework.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{framework.name}</h3>
                        {!framework.isActive && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{framework.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {framework.competencies?.length || 0} competencies
                      </p>
                    </div>
                    <ChevronRightIcon className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedId === framework.id ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {expandedId === framework.id && framework.competencies && (
                    <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="mt-4 space-y-3">
                        {framework.competencies.map((comp) => (
                          <div key={comp.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{comp.name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{comp.description}</p>
                              </div>
                              {comp.category && (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{comp.category}</span>
                              )}
                            </div>
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
