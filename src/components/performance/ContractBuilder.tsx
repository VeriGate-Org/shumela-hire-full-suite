'use client';

import React, { useState } from 'react';
import {
  PerformanceContract,
  PerformanceCycle,
  CreateContractRequest,
  CreateGoalRequest,
  GoalType,
  getGoalTypeColor
} from '@/types/performance';
import { apiFetch } from '@/lib/api-fetch';

interface ContractBuilderProps {
  cycle: PerformanceCycle;
  tenantId: string;
  userId: string;
  onContractCreated?: (contract: PerformanceContract) => void;
  onCancel?: () => void;
}

export default function ContractBuilder({
  cycle,
  tenantId: _tenantId,
  userId,
  onContractCreated,
  onCancel
}: ContractBuilderProps) {
  const [contract, setContract] = useState<CreateContractRequest>({
    cycleId: cycle.id,
    employeeId: '',
    employeeName: '',
    employeeNumber: '',
    managerId: userId,
    managerName: '',
    department: '',
    jobTitle: '',
    jobLevel: '',
    goals: []
  });

  const [currentGoal, setCurrentGoal] = useState<CreateGoalRequest>({
    title: '',
    description: '',
    type: GoalType.OPERATIONAL,
    weighting: 0,
    targetValue: '',
    measurementCriteria: '',
    kpis: []
  });

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addGoal = () => {
    if (!currentGoal.title || currentGoal.weighting <= 0) {
      setError('Please fill in all required goal fields');
      return;
    }

    const totalWeighting = contract.goals.reduce((sum, goal) => sum + goal.weighting, 0) + currentGoal.weighting;
    
    if (totalWeighting > 100) {
      setError('Total goal weighting cannot exceed 100%');
      return;
    }

    setContract(prev => ({
      ...prev,
      goals: [...prev.goals, { ...currentGoal }]
    }));

    setCurrentGoal({
      title: '',
      description: '',
      type: GoalType.OPERATIONAL,
      weighting: 0,
      targetValue: '',
      measurementCriteria: '',
      kpis: []
    });

    setShowGoalForm(false);
    setError(null);
  };

  const removeGoal = (index: number) => {
    setContract(prev => ({
      ...prev,
      goals: prev.goals.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!contract.employeeId || !contract.employeeName || contract.goals.length === 0) {
      setError('Please fill in all required fields and add at least one goal');
      return;
    }

    const totalWeighting = contract.goals.reduce((sum, goal) => sum + goal.weighting, 0);
    if (totalWeighting !== 100) {
      setError('Goal weightings must sum to exactly 100%');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/performance/contracts', {
        method: 'POST',
        body: JSON.stringify(contract)
      });

      if (response.ok) {
        const createdContract = await response.json();
        onContractCreated?.(createdContract);
      } else {
        setError('Failed to create performance contract');
      }
    } catch (err) {
      setError('Error creating performance contract');
      console.error('Error creating contract:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalWeighting = contract.goals.reduce((sum, goal) => sum + goal.weighting, 0);

  return (
    <div className="bg-white shadow rounded-sm">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Create Performance Contract
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              For cycle: {cycle.name}
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-sm">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Contract Details Form */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee ID *
              </label>
              <input
                type="text"
                required
                value={contract.employeeId}
                onChange={(e) => setContract(prev => ({ ...prev, employeeId: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee Name *
              </label>
              <input
                type="text"
                required
                value={contract.employeeName}
                onChange={(e) => setContract(prev => ({ ...prev, employeeName: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee Number
              </label>
              <input
                type="text"
                value={contract.employeeNumber}
                onChange={(e) => setContract(prev => ({ ...prev, employeeNumber: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Manager Name *
              </label>
              <input
                type="text"
                required
                value={contract.managerName}
                onChange={(e) => setContract(prev => ({ ...prev, managerName: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department
              </label>
              <input
                type="text"
                value={contract.department}
                onChange={(e) => setContract(prev => ({ ...prev, department: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Title
              </label>
              <input
                type="text"
                value={contract.jobTitle}
                onChange={(e) => setContract(prev => ({ ...prev, jobTitle: e.target.value }))}
                className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
          </div>

          {/* Goals Section */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-lg font-medium text-gray-900">Performance Goals</h4>
                <p className="text-sm text-gray-500">
                  Total weighting: {totalWeighting}% / 100%
                </p>
              </div>
              <button
                onClick={() => setShowGoalForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-green-600 hover:bg-green-700"
              >
                Add Goal
              </button>
            </div>

            {/* Existing Goals */}
            <div className="space-y-3 mb-4">
              {contract.goals.map((goal, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h5 className="font-medium text-gray-900">{goal.title}</h5>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getGoalTypeColor(goal.type)}`}>
                          {goal.type}
                        </span>
                        <span className="text-sm text-gray-500">{goal.weighting}%</span>
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                      )}
                      {goal.targetValue && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Target:</span> {goal.targetValue}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeGoal(index)}
                      className="text-red-400 hover:text-red-600 ml-4"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Goal Form Modal */}
            {showGoalForm && (
              <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-sm bg-white">
                  <div className="mt-3">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Add Performance Goal
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Goal Title *
                        </label>
                        <input
                          type="text"
                          required
                          value={currentGoal.title}
                          onChange={(e) => setCurrentGoal(prev => ({ ...prev, title: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description
                        </label>
                        <textarea
                          rows={3}
                          value={currentGoal.description}
                          onChange={(e) => setCurrentGoal(prev => ({ ...prev, description: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Goal Type *
                          </label>
                          <select
                            value={currentGoal.type}
                            onChange={(e) => setCurrentGoal(prev => ({ ...prev, type: e.target.value as GoalType }))}
                            className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
                          >
                            {Object.values(GoalType).map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Weighting (%) *
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            required
                            value={currentGoal.weighting}
                            onChange={(e) => setCurrentGoal(prev => ({ ...prev, weighting: parseInt(e.target.value) || 0 }))}
                            className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Target Value
                        </label>
                        <input
                          type="text"
                          value={currentGoal.targetValue}
                          onChange={(e) => setCurrentGoal(prev => ({ ...prev, targetValue: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Measurement Criteria
                        </label>
                        <textarea
                          rows={2}
                          value={currentGoal.measurementCriteria}
                          onChange={(e) => setCurrentGoal(prev => ({ ...prev, measurementCriteria: e.target.value }))}
                          className="mt-1 block w-full border border-gray-300 rounded-sm px-3 py-2 focus:ring-gold-500/60 focus:border-violet-400"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        onClick={() => setShowGoalForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={addGoal}
                        className="px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
                      >
                        Add Goal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading || totalWeighting !== 100}
              className={`px-4 py-2 border border-transparent rounded-sm text-sm font-medium text-white 
                ${loading || totalWeighting !== 100 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-violet-600 hover:bg-gold-600'}`}
            >
              {loading ? 'Creating...' : 'Create Contract'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}