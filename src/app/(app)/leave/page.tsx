'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import LeaveBalanceCards from '@/components/leave/LeaveBalanceCards';
import { LeaveBalance, LeaveRequest, leaveService } from '@/services/leaveService';
import Link from 'next/link';
import {
  PlusIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import { useRouter } from 'next/navigation';

export default function LeaveDashboardPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated, isLoading: authLoading, hasPermission } = useAuth();
  const router = useRouter();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId ? parseInt(rawId, 10) : 0;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!employeeId) return;
    Promise.all([
      leaveService.getBalances(employeeId),
      leaveService.getLeaveRequests({ employeeId, page: 0, size: 5 }),
    ]).then(([bal, req]) => {
      setBalances(Array.isArray(bal) ? bal : []);
      setRecentRequests(Array.isArray(req?.content) ? req.content : []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [employeeId]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cta" />
      </div>
    );
  }

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="Leave Management"
        subtitle="Manage your leave balances and requests"
        actions={
          <Link
            href="/leave/request"
            className="btn-cta inline-flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" /> Request Leave
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link href="/leave/requests" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <ClipboardDocumentListIcon className="w-5 h-5 text-blue-500" /> My Requests
            </Link>
            <Link href="/leave/calendar" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <CalendarIcon className="w-5 h-5 text-green-500" /> Calendar
            </Link>
            {hasPermission('view_analytics') && (
              <Link href="/leave/analytics" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
                <ChartBarIcon className="w-5 h-5 text-purple-500" /> Analytics
              </Link>
            )}
            <Link href="/leave/policies" className="flex items-center gap-2 enterprise-card p-3 hover:bg-muted text-sm font-medium text-muted-foreground">
              <Cog6ToothIcon className="w-5 h-5 text-muted-foreground" /> Policies
            </Link>
          </div>

          {/* Balances */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-3">My Leave Balances</h2>
            <LeaveBalanceCards balances={balances} loading={loading} />
          </div>

          {/* Recent Requests */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-foreground">Recent Requests</h2>
              <Link href="/leave/requests" className="text-sm text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="enterprise-card p-6"><TableSkeleton /></div>
            ) : recentRequests.length === 0 ? (
              <div className="enterprise-card p-6 text-center text-muted-foreground">
                No leave requests yet.
              </div>
            ) : (
              <div className="enterprise-card overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Days</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted">
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.colorCode }} />
                            {req.leaveTypeName}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {req.startDate} — {req.endDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{req.totalDays}</td>
                        <td className="px-4 py-3 text-sm">
                          <StatusPill value={req.status} domain="leaveStatus" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
