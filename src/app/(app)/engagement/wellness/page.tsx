'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, WellnessProgram } from '@/services/engagementService';
import { HeartIcon, UserGroupIcon } from '@heroicons/react/24/outline';

export default function WellnessPage() {
  const [programs, setPrograms] = useState<WellnessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadPrograms();
  }, []);

  async function loadPrograms() {
    setLoading(true);
    try {
      const data = await engagementService.getWellnessPrograms(0, 50);
      setPrograms(data.content);
    } catch (error) {
      console.error('Failed to load wellness programs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(programId: number) {
    const employeeId = prompt('Enter your employee ID:');
    if (!employeeId) return;
    try {
      await engagementService.joinWellnessProgram(programId, parseInt(employeeId));
      loadPrograms();
    } catch (error: any) {
      alert(error.message || 'Failed to join program');
    }
  }

  const typeColors: Record<string, string> = {
    PHYSICAL: 'bg-red-100 text-red-800',
    MENTAL: 'bg-blue-100 text-blue-800',
    FINANCIAL: 'bg-green-100 text-green-800',
    SOCIAL: 'bg-purple-100 text-purple-800',
  };

  const filteredPrograms = filter === 'all' ? programs :
    programs.filter(p => p.programType === filter);

  return (
    <FeatureGate feature="WELLNESS_PROGRAMS">
      <PageWrapper title="Wellness Programs" subtitle="Physical, mental, financial, and social wellness initiatives">
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'PHYSICAL', 'MENTAL', 'FINANCIAL', 'SOCIAL'].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm rounded-lg ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {f === 'all' ? 'All Programs' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Programs Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <HeartIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No wellness programs found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <div key={program.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{program.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${typeColors[program.programType] || 'bg-gray-100 text-gray-800'}`}>
                        {program.programType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{program.description}</p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                      {program.startDate && (
                        <p>Start: {new Date(program.startDate).toLocaleDateString()}</p>
                      )}
                      {program.endDate && (
                        <p>End: {new Date(program.endDate).toLocaleDateString()}</p>
                      )}
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-1" />
                        {program.currentParticipants} participants
                        {program.maxParticipants && ` / ${program.maxParticipants} max`}
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-4">
                    {program.isActive ? (
                      <button onClick={() => handleJoin(program.id)}
                        disabled={program.maxParticipants !== null && program.currentParticipants >= program.maxParticipants}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        {program.maxParticipants !== null && program.currentParticipants >= program.maxParticipants ? 'Full' : 'Join Program'}
                      </button>
                    ) : (
                      <span className="block text-center px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-sm">Inactive</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
