'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveApprovalCard from '@/components/leave/LeaveApprovalCard';
import { LeaveRequest, leaveService } from '@/services/leaveService';
import EmptyState from '@/components/EmptyState';
import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';

export default function LeaveApprovalsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const managerId = rawId || '';

  const loadPending = async () => {
    setLoading(true);
    try {
      const result = await leaveService.getPendingApprovals(managerId);
      setRequests(Array.isArray(result?.content) ? result.content : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (managerId) loadPending(); }, [managerId]);

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper title="Leave Approvals" subtitle="Review and approve pending leave requests">
        {loading ? (
          <div className="enterprise-card p-6"><InlineLoading /></div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={CheckBadgeIcon}
            title="No Pending Approvals"
            description="All leave requests have been processed. You're all caught up!"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <LeaveApprovalCard
                key={req.id}
                request={req}
                approverId={managerId}
                onDecision={loadPending}
              />
            ))}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
