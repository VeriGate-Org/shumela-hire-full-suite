'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeavePolicyForm from '@/components/leave/LeavePolicyForm';
import { LeavePolicy, LeaveType, leaveService } from '@/services/leaveService';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function LeavePoliciesPage() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const [p, t] = await Promise.all([
      leaveService.getLeavePolicies(),
      leaveService.getLeaveTypes(),
    ]);
    setPolicies(p);
    setLeaveTypes(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="Leave Policies"
        subtitle="Configure leave policies and types"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> New Policy
          </button>
        }
      >
        <div className="space-y-6">
          {showForm && (
            <LeavePolicyForm
              onSubmit={() => { setShowForm(false); load(); }}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/* Leave Types */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Leave Types</h2>
            {loading ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">Loading...</div>
            ) : (
              <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days/Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carry Forward</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaveTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.colorCode }} />
                            {type.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{type.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{type.defaultDaysPerYear}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{type.maxCarryForwardDays}</td>
                        <td className="px-4 py-3 text-sm">{type.isPaid ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {type.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Policies */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Policies</h2>
            {policies.length === 0 ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">No policies configured yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="bg-white rounded-lg shadow border p-4">
                    <h3 className="font-semibold text-gray-900">{policy.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{policy.leaveTypeName}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Accrual:</span> {policy.accrualMethod}</div>
                      <div><span className="text-gray-500">Days/Cycle:</span> {policy.daysPerCycle}</div>
                      <div><span className="text-gray-500">Min Service:</span> {policy.minServiceMonths} months</div>
                      <div><span className="text-gray-500">Notice:</span> {policy.minNoticeDays} days</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
