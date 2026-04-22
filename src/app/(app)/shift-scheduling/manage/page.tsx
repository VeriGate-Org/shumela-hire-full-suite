'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';
import EmptyState from '@/components/EmptyState';
import { Shift, shiftService } from '@/services/shiftService';
import { PlusIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ManageShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '', code: '', startTime: '08:00', endTime: '17:00', breakMinutes: '60', colorCode: '#6366f1',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Assign shift form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignForm, setAssignForm] = useState({ employeeId: '', shiftId: '', date: '' });
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  useEffect(() => {
    shiftService.getShifts().then((data) => {
      setShifts(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleCreateShift = async () => {
    setSubmitting(true);
    setError('');

    if (form.endTime <= form.startTime) {
      setError('End time must be after start time.');
      setSubmitting(false);
      return;
    }

    try {
      const shift = await shiftService.createShift({
        name: form.name,
        code: form.code,
        startTime: form.startTime,
        endTime: form.endTime,
        breakMinutes: parseInt(form.breakMinutes) || 0,
        colorCode: form.colorCode,
      });
      setShifts((prev) => [...prev, shift]);
      setShowForm(false);
      setForm({ name: '', code: '', startTime: '08:00', endTime: '17:00', breakMinutes: '60', colorCode: '#6366f1' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignShift = async () => {
    setAssigning(true);
    setAssignError('');
    setAssignSuccess('');
    try {
      await shiftService.assignShift(
        assignForm.employeeId,
        assignForm.shiftId,
        assignForm.date,
      );
      setAssignSuccess('Shift assigned successfully');
      setAssignForm({ employeeId: '', shiftId: '', date: '' });
    } catch (e: any) {
      setAssignError(e.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <FeatureGate feature="SHIFT_SCHEDULING">
      <PageWrapper
        title="Manage Shifts"
        subtitle="Create shifts and assign employees to schedules"
        actions={
          <div className="flex gap-2">
            <button onClick={() => { setShowAssignForm(!showAssignForm); setShowForm(false); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-muted">
              <ClockIcon className="w-4 h-4" /> Assign Shift
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowAssignForm(false); }}
              className="btn-cta inline-flex items-center gap-2">
              <PlusIcon className="w-4 h-4" /> New Shift
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Create Shift Form */}
          {showForm && (
            <div className="enterprise-card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Create New Shift</h3>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Morning Shift" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Code</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. AM" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Color</label>
                  <input type="color" value={form.colorCode} onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                    className="w-full h-[38px] border rounded-md px-1 py-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Break (min)</label>
                  <input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleCreateShift} disabled={submitting || !form.name || !form.code}
                  className="btn-cta disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Shift'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* Assign Shift Form */}
          {showAssignForm && (
            <div className="enterprise-card p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Assign Shift to Employee</h3>
              {assignError && <p className="mb-3 text-sm text-red-600">{assignError}</p>}
              {assignSuccess && <p className="mb-3 text-sm text-green-600">{assignSuccess}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Employee ID</label>
                  <input type="text" value={assignForm.employeeId} onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Employee ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Shift</label>
                  <select value={assignForm.shiftId} onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">Select shift...</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                  <input type="date" value={assignForm.date} onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAssignShift} disabled={assigning || !assignForm.employeeId || !assignForm.shiftId || !assignForm.date}
                  className="btn-cta disabled:opacity-50">
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
                <button onClick={() => setShowAssignForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-muted">Cancel</button>
              </div>
            </div>
          )}

          {/* Shift List */}
          {loading ? (
            <InlineLoading />
          ) : shifts.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="No shifts configured"
              description="Create one to get started."
              action={{ label: 'New Shift', onClick: () => { setShowForm(true); setShowAssignForm(false); } }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="enterprise-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: shift.colorCode || '#6366f1' }} />
                    <div>
                      <h3 className="font-medium text-foreground">{shift.name}</h3>
                      <p className="text-xs text-muted-foreground">Code: {shift.code}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground">Start:</span> {shift.startTime}
                    </div>
                    <div>
                      <span className="text-muted-foreground">End:</span> {shift.endTime}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Break:</span> {shift.breakMinutes}min
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${shift.isActive ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                        {shift.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
