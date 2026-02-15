'use client';

import React, { useState, useEffect } from 'react';
import { PerformanceCycle, CycleStatus, CreateCycleRequest, getCycleStatusColor, formatDate } from '@/types/performance';

interface CycleManagementProps {
  tenantId: string;
  userId: string;
  onCycleSelect?: (cycle: PerformanceCycle) => void;
}

export default function CycleManagement({ tenantId, userId, onCycleSelect }: CycleManagementProps) {
  const [cycles, setCycles] = useState<PerformanceCycle[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newCycle, setNewCycle] = useState<CreateCycleRequest>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    midYearDeadline: '',
    finalReviewDeadline: ''
  });

  useEffect(() => {
    fetchCycles();
  }, [tenantId]);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/performance/cycles', {
        headers: {
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCycles(data.content || []);
      } else {
        setError('Failed to load performance cycles');
      }
    } catch (err) {
      setError('Error loading performance cycles');
      console.error('Error fetching cycles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/performance/cycles', {
        method: 'POST',
        headers: {
          'X-Tenant-Id': tenantId,
          'X-User-Id': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newCycle)
      });
      
      if (response.ok) {
        const createdCycle = await response.json();
        setCycles(prev => [createdCycle, ...prev]);
        setShowCreateForm(false);
        setNewCycle({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          midYearDeadline: '',
          finalReviewDeadline: ''
        });
      } else {
        setError('Failed to create performance cycle');
      }
    } catch (err) {
      setError('Error creating performance cycle');
      console.error('Error creating cycle:', err);
    }
  };

  const handleActivateCycle = async (cycleId: string) => {
    try {
      const response = await fetch(`/api/performance/cycles/${cycleId}/activate`, {
        method: 'POST',
        headers: {
          'X-Tenant-Id': tenantId,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchCycles();
      } else {
        setError('Failed to activate cycle');
      }
    } catch (err) {
      setError('Error activating cycle');
      console.error('Error activating cycle:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Performance Cycles
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage performance review cycles and timelines
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500/60"
          >
            Create New Cycle
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Create Cycle Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Create New Performance Cycle
                </h3>
                <form onSubmit={handleCreateCycle} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cycle Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newCycle.name}
                      onChange={(e) => setNewCycle(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-violet-500/60 focus:border-violet-400"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={newCycle.description}
                      onChange={(e) => setNewCycle(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-violet-500/60 focus:border-violet-400"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newCycle.startDate}
                        onChange={(e) => setNewCycle(prev => ({ ...prev, startDate: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-violet-500/60 focus:border-violet-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newCycle.endDate}
                        onChange={(e) => setNewCycle(prev => ({ ...prev, endDate: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-violet-500/60 focus:border-violet-400"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Mid-Year Deadline
                      </label>
                      <input
                        type="date"
                        required
                        value={newCycle.midYearDeadline}
                        onChange={(e) => setNewCycle(prev => ({ ...prev, midYearDeadline: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-violet-500/60 focus:border-violet-400"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Final Review Deadline
                      </label>
                      <input
                        type="date"
                        required
                        value={newCycle.finalReviewDeadline}
                        onChange={(e) => setNewCycle(prev => ({ ...prev, finalReviewDeadline: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-violet-500/60 focus:border-violet-400"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-violet-600 hover:bg-violet-700"
                    >
                      Create Cycle
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Cycles List */}
        <div className="space-y-4">
          {cycles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No performance cycles found</p>
            </div>
          ) : (
            cycles.map((cycle) => (
              <div
                key={cycle.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onCycleSelect?.(cycle)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{cycle.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCycleStatusColor(cycle.status)}`}>
                        {cycle.status.replace('_', ' ')}
                      </span>
                    </div>
                    {cycle.description && (
                      <p className="text-sm text-gray-600 mt-1">{cycle.description}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Start:</span> {formatDate(cycle.startDate)}
                      </div>
                      <div>
                        <span className="font-medium">End:</span> {formatDate(cycle.endDate)}
                      </div>
                      <div>
                        <span className="font-medium">Mid-Year:</span> {formatDate(cycle.midYearDeadline)}
                      </div>
                      <div>
                        <span className="font-medium">Final:</span> {formatDate(cycle.finalReviewDeadline)}
                      </div>
                    </div>
                  </div>
                  {cycle.status === CycleStatus.PLANNING && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleActivateCycle(cycle.id);
                      }}
                      className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}