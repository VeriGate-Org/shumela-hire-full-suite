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

type TabId = 'myRequests' | 'teamRequests' | 'leaveCalendar';

export default function LeaveDashboardPage() {
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('myRequests');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const { user, isAuthenticated, isLoading: authLoading, hasPermission } = useAuth();
  const router = useRouter();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';

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

  // Filtered requests
  const filteredRequests = recentRequests.filter((req) => {
    if (filterStatus !== 'all' && req.status?.toLowerCase() !== filterStatus.toLowerCase()) {
      return false;
    }
    if (filterType !== 'all' && req.leaveTypeCode?.toLowerCase() !== filterType.toLowerCase()) {
      return false;
    }
    return true;
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: 'myRequests', label: 'My Requests' },
    { id: 'teamRequests', label: 'Team Requests' },
    { id: 'leaveCalendar', label: 'Leave Calendar' },
  ];

  return (
    <FeatureGate feature="LEAVE_MANAGEMENT">
      <PageWrapper
        title="Leave Management"
        subtitle="Request leave, view balances, and track approval status"
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

          {/* ====== BALANCE STRIP ====== */}
          <LeaveBalanceCards balances={balances} loading={loading} />

          {/* ====== TABBED CONTENT ====== */}
          <div className="enterprise-card overflow-hidden">
            {/* Tabs Header */}
            <div className="flex border-b border-border px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-5 text-sm font-semibold relative top-px border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'text-primary border-primary'
                      : 'text-muted-foreground border-transparent hover:text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ====== TAB 1: MY REQUESTS ====== */}
            {activeTab === 'myRequests' && (
              <div className="p-6 animate-in fade-in duration-300">
                {/* Filter Bar */}
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="text-sm border border-border rounded-lg bg-card text-foreground px-3 py-2 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-sm border border-border rounded-lg bg-card text-foreground px-3 py-2 min-w-[150px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  >
                    <option value="all">All Leave Types</option>
                    {balances.map((b) => (
                      <option key={b.leaveTypeCode} value={b.leaveTypeCode}>
                        {b.leaveTypeName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Requests Table */}
                {loading ? (
                  <TableSkeleton />
                ) : filteredRequests.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarIcon className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-1">No leave requests found</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {recentRequests.length === 0
                        ? "You haven't submitted any leave requests yet."
                        : 'No requests match the selected filters.'}
                    </p>
                    {recentRequests.length === 0 && (
                      <Link href="/leave/request" className="btn-cta inline-flex items-center gap-2 text-sm">
                        <PlusIcon className="w-4 h-4" /> Request Leave
                      </Link>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50">
                              Type
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50">
                              Start Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50">
                              End Date
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50">
                              Days
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50">
                              Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((req) => (
                            <tr
                              key={req.id}
                              className="border-b border-border last:border-b-0 hover:bg-primary/[0.03] transition-colors"
                            >
                              <td className="px-4 py-3.5 text-sm text-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: req.colorCode }}
                                  />
                                  {req.leaveTypeName}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 text-sm text-foreground">
                                {req.startDate}
                              </td>
                              <td className="px-4 py-3.5 text-sm text-foreground">
                                {req.endDate}
                              </td>
                              <td className="px-4 py-3.5 text-sm text-muted-foreground">
                                {req.totalDays} {req.totalDays === 1 ? 'day' : 'days'}
                              </td>
                              <td className="px-4 py-3.5 text-sm">
                                <StatusPill value={req.status} domain="leaveStatus" />
                              </td>
                              <td className="px-4 py-3.5 text-sm">
                                <Link
                                  href={`/leave/requests`}
                                  className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide border border-border rounded-full px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                                >
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-2">
                      <span className="text-xs text-muted-foreground">
                        Showing 1-{filteredRequests.length} of {filteredRequests.length} requests
                      </span>
                      <Link
                        href="/leave/requests"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        View all requests
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ====== TAB 2: TEAM REQUESTS ====== */}
            {activeTab === 'teamRequests' && (
              <div className="p-6 animate-in fade-in duration-300">
                {hasPermission('manage_leave_approvals') ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Review and action pending leave requests from your team.
                    </p>
                    <Link
                      href="/leave/approvals"
                      className="btn-cta inline-flex items-center gap-2 text-sm"
                    >
                      <ClipboardDocumentListIcon className="w-4 h-4" />
                      Go to Approvals
                    </Link>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <ClipboardDocumentListIcon className="w-9 h-9 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-base font-semibold text-foreground mb-1">No Access</h3>
                    <p className="text-sm text-muted-foreground">
                      You don&apos;t have permission to view team requests. Contact your administrator.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ====== TAB 3: LEAVE CALENDAR ====== */}
            {activeTab === 'leaveCalendar' && (
              <div className="p-6 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    View your leave schedule alongside your team&apos;s leave on the calendar.
                  </p>
                  <Link
                    href="/leave/calendar"
                    className="btn-cta inline-flex items-center gap-2 text-sm"
                  >
                    <CalendarIcon className="w-4 h-4" />
                    Open Calendar
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ====== QUICK LINKS ====== */}
          <div>
            <h2 className="text-base font-bold text-foreground mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/leave/requests"
                className="enterprise-card p-4 flex items-center gap-3 hover:bg-primary/[0.03] transition-colors"
              >
                <ClipboardDocumentListIcon className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">My Requests</span>
              </Link>
              <Link
                href="/leave/calendar"
                className="enterprise-card p-4 flex items-center gap-3 hover:bg-primary/[0.03] transition-colors"
              >
                <CalendarIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">Calendar</span>
              </Link>
              {hasPermission('view_analytics') && (
                <Link
                  href="/leave/analytics"
                  className="enterprise-card p-4 flex items-center gap-3 hover:bg-primary/[0.03] transition-colors"
                >
                  <ChartBarIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground">Analytics</span>
                </Link>
              )}
              <Link
                href="/leave/policies"
                className="enterprise-card p-4 flex items-center gap-3 hover:bg-primary/[0.03] transition-colors"
              >
                <Cog6ToothIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-semibold text-foreground">Policies</span>
              </Link>
            </div>
          </div>

        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
