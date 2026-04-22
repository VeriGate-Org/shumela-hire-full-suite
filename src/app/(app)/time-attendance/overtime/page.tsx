'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { OvertimeRecord, attendanceService, PageResponse } from '@/services/attendanceService';
import { PlusIcon, CheckIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import StatusPill from '@/components/StatusPill';
import { TableSkeleton } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';

export default function OvertimePage() {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', hours: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'my' | 'pending'>('my');

  const { user } = useAuth();
  const rawId = user?.employeeId || user?.id;
  const employeeId = rawId || '';
  const { toast } = useToast();
  // BUG-001 fix: track whether profile is resolved to prevent rendering actions
  const profileResolved = !!employeeId;

  useEffect(() => {
    if (!employeeId) {
      // BUG-001 fix: gracefully handle missing profile instead of crashing
      setError('Your employee profile could not be resolved. Please contact your administrator.');
      setLoading(false);
      return;
    }
    Promise.all([
      attendanceService.getOvertime(employeeId, 0, 20),
      attendanceService.getPendingOvertime(0, 20),
    ]).then(([myData, pendingData]) => {
      // BUG-001 fix: defensive guard — API may return unexpected shape
      setRecords(Array.isArray(myData?.content) ? myData.content : []);
      setPendingRecords(Array.isArray(pendingData?.content) ? pendingData.content : []);
      setLoading(false);
    }).catch((e) => {
      setError(e?.message || 'Failed to load overtime data');
      setLoading(false);
    });
  }, [employeeId]);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const record = await attendanceService.submitOvertime(
        employeeId,
        form.date,
        parseFloat(form.hours),
        form.reason || undefined,
      );
      setRecords((prev) => [record, ...prev]);
      setShowForm(false);
      setForm({ date: '', hours: '', reason: '' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await attendanceService.approveOvertime(id, employeeId);
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
      toast('Overtime approved', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to approve overtime', 'error');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await attendanceService.rejectOvertime(id, employeeId);
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
      toast('Overtime rejected', 'success');
    } catch (e: any) {
      toast(e.message || 'Failed to reject overtime', 'error');
    }
  };

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper
        title="Overtime Management"
        subtitle="Submit and manage overtime requests"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            disabled={!profileResolved}
            className="btn-cta inline-flex items-center gap-2 disabled:opacity-50"
          >
            <PlusIcon className="w-4 h-4" /> Submit Overtime
          </button>
        }
      >
        <div className="space-y-6">
          {/* BUG-001 fix: show error banner when profile unresolved or fetch failed */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}
          {showForm && profileResolved && (
            <div className="enterprise-card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Submit Overtime</h3>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Hours</label>
                  <input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Reason</label>
                  <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Optional reason" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleSubmit} disabled={submitting || !form.date || !form.hours}
                  className="btn-cta disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b">
            <button onClick={() => setTab('my')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'my' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              My Overtime
            </button>
            <button onClick={() => setTab('pending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              Pending Approvals {pendingRecords.length > 0 && <span className="ml-1 bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 text-xs">{pendingRecords.length}</span>}
            </button>
          </div>

          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : tab === 'my' ? (
            records.length === 0 ? (
              <EmptyState icon={ClockIcon} title="No Overtime" description="No overtime records found." />
            ) : (
              <div className="enterprise-card overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-muted">
                        <td className="px-4 py-3 text-sm text-foreground">{rec.date}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{rec.hours}h</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{rec.reason || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <StatusPill value={rec.status} domain="overtimeStatus" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            pendingRecords.length === 0 ? (
              <EmptyState icon={ClockIcon} title="No Pending Approvals" description="No pending overtime approvals." />
            ) : (
              <div className="space-y-3">
                {pendingRecords.map((rec) => (
                  <div key={rec.id} className="enterprise-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{rec.employeeName}</p>
                      <p className="text-sm text-muted-foreground">{rec.date} — {rec.hours}h</p>
                      {rec.reason && <p className="text-sm text-muted-foreground">{rec.reason}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(rec.id)}
                        className="p-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleReject(rec.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100">
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
