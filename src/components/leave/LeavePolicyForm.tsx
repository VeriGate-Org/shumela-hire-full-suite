'use client';

import { useState, useEffect } from 'react';
import { LeaveType, leaveService } from '@/services/leaveService';

interface LeavePolicyFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export default function LeavePolicyForm({ onSubmit, onCancel }: LeavePolicyFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [accrualMethod, setAccrualMethod] = useState('ANNUAL');
  const [daysPerCycle, setDaysPerCycle] = useState('');
  const [cycleStartMonth, setCycleStartMonth] = useState('1');
  const [minServiceMonths, setMinServiceMonths] = useState('0');
  const [allowNegativeBalance, setAllowNegativeBalance] = useState(false);
  const [maxConsecutiveDays, setMaxConsecutiveDays] = useState('');
  const [minNoticeDays, setMinNoticeDays] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    leaveService.getLeaveTypes().then(setLeaveTypes);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await leaveService.createLeavePolicy({
        leaveTypeId,
        name,
        description: description || null,
        accrualMethod,
        daysPerCycle: Number(daysPerCycle),
        cycleStartMonth: Number(cycleStartMonth),
        minServiceMonths: Number(minServiceMonths),
        allowNegativeBalance,
        maxConsecutiveDays: maxConsecutiveDays ? Number(maxConsecutiveDays) : null,
        minNoticeDays: Number(minNoticeDays),
      });
      onSubmit();
    } catch (err: any) {
      setError(err.message || 'Failed to create policy');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow border">
      <h2 className="text-lg font-semibold text-gray-900">New Leave Policy</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
          <select value={leaveTypeId} onChange={(e) => setLeaveTypeId(Number(e.target.value))} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="">Select type</option>
            {leaveTypes.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Policy Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accrual Method</label>
          <select value={accrualMethod} onChange={(e) => setAccrualMethod(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            <option value="ANNUAL">Annual</option>
            <option value="MONTHLY">Monthly</option>
            <option value="BIWEEKLY">Bi-Weekly</option>
            <option value="ON_HIRE_DATE">On Hire Date</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Days Per Cycle</label>
          <input type="number" step="0.5" value={daysPerCycle} onChange={(e) => setDaysPerCycle(e.target.value)} required className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Start Month</label>
          <select value={cycleStartMonth} onChange={(e) => setCycleStartMonth(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Service Months</label>
          <input type="number" value={minServiceMonths} onChange={(e) => setMinServiceMonths(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max Consecutive Days</label>
          <input type="number" value={maxConsecutiveDays} onChange={(e) => setMaxConsecutiveDays(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" placeholder="No limit" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Notice Days</label>
          <input type="number" value={minNoticeDays} onChange={(e) => setMinNoticeDays(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="negBalance" checked={allowNegativeBalance} onChange={(e) => setAllowNegativeBalance(e.target.checked)} className="rounded border-gray-300" />
        <label htmlFor="negBalance" className="text-sm text-gray-700">Allow negative balance</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Policy'}
        </button>
      </div>
    </form>
  );
}
