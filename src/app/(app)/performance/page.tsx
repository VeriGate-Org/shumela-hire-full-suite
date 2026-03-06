'use client';

import React, { useState } from 'react';
import CycleManagement from '@/components/performance/CycleManagement';
import ContractBuilder from '@/components/performance/ContractBuilder';
import { PerformanceCycle } from '@/types/performance';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { getEnumLabel } from '@/utils/enumLabels';

export default function PerformanceDashboard() {
  const [selectedCycle, setSelectedCycle] = useState<PerformanceCycle | null>(null);
  const [showContractBuilder, setShowContractBuilder] = useState(false);

  const { tenantId } = useTenant();
  const { user } = useAuth();
  const userId = user?.id || 'anonymous';

  const handleCycleSelect = (cycle: PerformanceCycle) => {
    setSelectedCycle(cycle);
    setShowContractBuilder(false);
  };

  const handleCreateContract = () => {
    if (selectedCycle) {
      setShowContractBuilder(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage performance cycles, contracts, and reviews
              </p>
            </div>
            {selectedCycle && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Active Cycle:</span> {selectedCycle.name}
                </div>
                <button
                  onClick={handleCreateContract}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
                >
                  Create Contract
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cycle Management */}
          <div className="lg:col-span-2">
            <CycleManagement
              tenantId={tenantId}
              userId={userId}
              onCycleSelect={handleCycleSelect}
            />
          </div>

          {/* Quick Stats / Actions */}
          <div className="space-y-6">
            {/* Cycle Quick Stats */}
            {selectedCycle && (
              <div className="bg-white shadow rounded-sm">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Cycle Overview
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Status:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {getEnumLabel('cycleStatus', selectedCycle.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Start Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedCycle.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">End Date:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(selectedCycle.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-sm">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View All Contracts
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Performance Templates
                  </button>
                  <button className="w-full text-left px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50">
                    View Reports
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Builder Modal */}
        {showContractBuilder && selectedCycle && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto border w-full max-w-6xl shadow-lg rounded-sm bg-white">
              <ContractBuilder
                cycle={selectedCycle}
                tenantId={tenantId}
                userId={userId}
                onContractCreated={() => setShowContractBuilder(false)}
                onCancel={() => setShowContractBuilder(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}