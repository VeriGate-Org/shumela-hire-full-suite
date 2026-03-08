'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
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
    });
  }, []);

  const handleCreateShift = async () => {
    setSubmitting(true);
    setError('');
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
        parseInt(assignForm.employeeId),
        parseInt(assignForm.shiftId),
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
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-md hover:bg-gray-50">
              <ClockIcon className="w-4 h-4" /> Assign Shift
            </button>
            <button onClick={() => { setShowForm(!showForm); setShowAssignForm(false); }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
              <PlusIcon className="w-4 h-4" /> New Shift
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Create Shift Form */}
          {showForm && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Shift</h3>
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Morning Shift" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. AM" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input type="color" value={form.colorCode} onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                    className="w-full h-[38px] border rounded-md px-1 py-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Break (min)</label>
                  <input type="number" value={form.breakMinutes} onChange={(e) => setForm({ ...form, breakMinutes: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleCreateShift} disabled={submitting || !form.name || !form.code}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Shift'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {/* Assign Shift Form */}
          {showAssignForm && (
            <div className="bg-white rounded-lg shadow border p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Assign Shift to Employee</h3>
              {assignError && <p className="mb-3 text-sm text-red-600">{assignError}</p>}
              {assignSuccess && <p className="mb-3 text-sm text-green-600">{assignSuccess}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input type="number" value={assignForm.employeeId} onChange={(e) => setAssignForm({ ...assignForm, employeeId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Employee ID" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select value={assignForm.shiftId} onChange={(e) => setAssignForm({ ...assignForm, shiftId: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm">
                    <option value="">Select shift...</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={assignForm.date} onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                    className="w-full border rounded-md px-3 py-2 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={handleAssignShift} disabled={assigning || !assignForm.employeeId || !assignForm.shiftId || !assignForm.date}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
                <button onClick={() => setShowAssignForm(false)} className="px-4 py-2 border text-sm rounded-md hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          )}

          {/* Shift List */}
          {loading ? (
            <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">Loading...</div>
          ) : shifts.length === 0 ? (
            <div className="bg-white rounded-lg shadow border p-6 text-center text-gray-500">
              No shifts configured. Create one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts.map((shift) => (
                <div key={shift.id} className="bg-white rounded-lg shadow border p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: shift.colorCode || '#6366f1' }} />
                    <div>
                      <h3 className="font-medium text-gray-900">{shift.name}</h3>
                      <p className="text-xs text-gray-500">Code: {shift.code}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-400">Start:</span> {shift.startTime}
                    </div>
                    <div>
                      <span className="text-gray-400">End:</span> {shift.endTime}
                    </div>
                    <div>
                      <span className="text-gray-400">Break:</span> {shift.breakMinutes}min
                    </div>
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${shift.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
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
