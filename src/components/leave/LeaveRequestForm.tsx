'use client';

import { useState, useEffect } from 'react';
import { LeaveType, leaveService } from '@/services/leaveService';

interface LeaveRequestFormProps {
  employeeId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function LeaveRequestForm({ employeeId, onSubmit, onCancel }: LeaveRequestFormProps) {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayPeriod, setHalfDayPeriod] = useState('');
  const [reason, setReason] = useState('');
  const [medicalCertificateUrl, setMedicalCertificateUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    leaveService.getLeaveTypes(true).then(setLeaveTypes);
  }, []);

  const selectedType = leaveTypes.find((t) => t.id === leaveTypeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isHalfDay && endDate && startDate && endDate < startDate) {
      setError('End date must be on or after the start date.');
      return;
    }

    setSubmitting(true);

    try {
      await leaveService.createLeaveRequest(employeeId, {
        leaveTypeId,
        startDate,
        endDate: isHalfDay ? startDate : endDate,
        isHalfDay,
        halfDayPeriod: isHalfDay ? halfDayPeriod : null,
        reason,
        medicalCertificateUrl: medicalCertificateUrl || null,
      });
      onSubmit();
    } catch (err: any) {
      setError(err.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 enterprise-card p-6">
      <h2 className="text-lg font-semibold text-foreground">New Leave Request</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Leave Type</label>
        <select
          value={leaveTypeId}
          onChange={(e) => setLeaveTypeId(e.target.value)}
          required
          className="w-full border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:border-ring"
        >
          <option value="">Select leave type</option>
          {leaveTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name} ({type.defaultDaysPerYear} days/year)
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="halfDay"
          checked={isHalfDay}
          onChange={(e) => setIsHalfDay(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="halfDay" className="text-sm text-foreground">Half day</label>
      </div>

      {isHalfDay && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Period</label>
          <select
            value={halfDayPeriod}
            onChange={(e) => setHalfDayPeriod(e.target.value)}
            required
            className="w-full border border-border rounded-md px-3 py-2 text-sm"
          >
            <option value="">Select period</option>
            <option value="MORNING">Morning</option>
            <option value="AFTERNOON">Afternoon</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
            className="w-full border border-border rounded-md px-3 py-2 text-sm"
          />
        </div>
        {!isHalfDay && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              min={startDate}
              className="w-full border border-border rounded-md px-3 py-2 text-sm"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border border-border rounded-md px-3 py-2 text-sm"
          placeholder="Optional reason for leave"
        />
      </div>

      {selectedType?.requiresMedicalCertificate && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Medical Certificate URL
          </label>
          <input
            type="url"
            value={medicalCertificateUrl}
            onChange={(e) => setMedicalCertificateUrl(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Link to uploaded medical certificate"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Required for {selectedType.name} exceeding {selectedType.medicalCertThresholdDays} days
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="btn-cta disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}
