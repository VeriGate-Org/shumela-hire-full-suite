'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeavePolicyForm from '@/components/leave/LeavePolicyForm';
import { LeavePolicy, LeaveType, leaveService } from '@/services/leaveService';
import { PlusIcon } from '@heroicons/react/24/outline';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';

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
            className="btn-cta inline-flex items-center gap-2"
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
            <h2 className="text-lg font-semibold text-foreground mb-3">Leave Types</h2>
            {loading ? (
              <div className="enterprise-card p-6"><TableSkeleton /></div>
            ) : (
              <div className="enterprise-card overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Days/Year</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Carry Forward</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Paid</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {leaveTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-muted">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: type.colorCode }} />
                            {type.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{type.code}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{type.defaultDaysPerYear}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{type.maxCarryForwardDays}</td>
                        <td className="px-4 py-3 text-sm">{type.isPaid ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-muted-foreground'}`}>
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
            <h2 className="text-lg font-semibold text-foreground mb-3">Policies</h2>
            {policies.length === 0 ? (
              <div className="enterprise-card p-6 text-center text-muted-foreground">No policies configured yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="enterprise-card p-4">
                    <h3 className="font-semibold text-foreground">{policy.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{policy.leaveTypeName}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Accrual:</span> {policy.accrualMethod}</div>
                      <div><span className="text-muted-foreground">Days/Cycle:</span> {policy.daysPerCycle}</div>
                      <div><span className="text-muted-foreground">Min Service:</span> {policy.minServiceMonths} months</div>
                      <div><span className="text-muted-foreground">Notice:</span> {policy.minNoticeDays} days</div>
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
