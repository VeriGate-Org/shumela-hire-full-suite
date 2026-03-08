'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { OvertimeRecord, attendanceService, PageResponse } from '@/services/attendanceService';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function OvertimePage() {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [pendingRecords, setPendingRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', hours: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'my' | 'pending'>('my');

  const employeeId = 1; // TODO: Get from auth context

  useEffect(() => {
    Promise.all([
      attendanceService.getOvertime(employeeId, 0, 20),
      attendanceService.getPendingOvertime(0, 20),
    ]).then(([myData, pendingData]) => {
      setRecords(myData.content);
      setPendingRecords(pendingData.content);
      setLoading(false);
    });
  }, []);

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

  const handleApprove = async (id: number) => {
    try {
      const updated = await attendanceService.approveOvertime(id, employeeId);
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const updated = await attendanceService.rejectOvertime(id, employeeId);
      setPendingRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <FeatureGate feature="TIME_ATTENDANCE">
      <PageWrapper
        title="Overtime Management"
        subtitle="Submit and manage overtime requests"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Submit Overtime
          </button>
        }
      >
        <div className="space-y-6">
          {showForm && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Submit Overtime</h3>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                  <input type="number" step="0.5" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Optional reason" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleSubmit} disabled={submitting || !form.date || !form.hours}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b">
            <button onClick={() => setTab('my')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'my' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              My Overtime
            </button>
            <button onClick={() => setTab('pending')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === 'pending' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              Pending Approvals {pendingRecords.length > 0 && <span className="ml-1 bg-yellow-100 text-yellow-700 rounded-full px-2 py-0.5 text-xs">{pendingRecords.length}</span>}
            </button>
          </div>

          {loading ? (
            <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">Loading...</div>
          ) : tab === 'my' ? (
            records.length === 0 ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">No overtime records found.</div>
            ) : (
              <div className="bg-white rounded-lg shadow border overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {records.map((rec) => (
                      <tr key={rec.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{rec.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rec.hours}h</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{rec.reason || '—'}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[rec.status] || ''}`}>{rec.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            pendingRecords.length === 0 ? (
              <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">No pending overtime approvals.</div>
            ) : (
              <div className="space-y-3">
                {pendingRecords.map((rec) => (
                  <div key={rec.id} className="bg-white rounded-lg shadow border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{rec.employeeName}</p>
                      <p className="text-sm text-gray-500">{rec.date} — {rec.hours}h</p>
                      {rec.reason && <p className="text-sm text-gray-500">{rec.reason}</p>}
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
