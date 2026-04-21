'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';
import { ShiftSchedule, Shift, shiftService } from '@/services/shiftService';
import Link from 'next/link';
import { Cog6ToothIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function ShiftSchedulingPage() {
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);
  const startDate = formatDate(weekDates[0]);
  const endDate = formatDate(weekDates[6]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      shiftService.getSchedules(startDate, endDate, department || undefined),
      shiftService.getShifts(true),
    ]).then(([sched, sh]) => {
      setSchedules(sched);
      setShifts(sh);
      setLoading(false);
    });
  }, [startDate, endDate, department]);

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  // Group schedules by employee
  const employeeMap = useMemo(() => {
    const map = new Map<string, ShiftSchedule[]>();
    schedules.forEach((s) => {
      const key = s.employeeName;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    });
    return map;
  }, [schedules]);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <FeatureGate feature="SHIFT_SCHEDULING">
      <PageWrapper
        title="Shift Scheduling"
        subtitle="View and manage employee shift assignments"
        actions={
          <Link href="/shift-scheduling/manage"
            className="btn-cta inline-flex items-center gap-2">
            <Cog6ToothIcon className="w-4 h-4" /> Manage Shifts
          </Link>
        }
      >
        <div className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between enterprise-card p-3">
            <button onClick={prevWeek} className="p-1 hover:bg-muted rounded">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {weekDates[0].toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} — {weekDates[6].toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button onClick={nextWeek} className="p-1 hover:bg-muted rounded">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Department Filter */}
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Filter by department..."
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="flex-1 max-w-xs border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Schedule Grid */}
          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : employeeMap.size === 0 ? (
            <div className="enterprise-card p-6 text-center text-muted-foreground">
              No shift schedules found for this period.
            </div>
          ) : (
            <div className="enterprise-card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase sticky left-0 bg-muted min-w-[150px]">Employee</th>
                    {weekDates.map((d, i) => (
                      <th key={i} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase min-w-[100px]">
                        <div>{dayNames[i]}</div>
                        <div className="text-gray-400">{d.getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from(employeeMap.entries()).map(([name, empSchedules]) => (
                    <tr key={name} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 bg-white">{name}</td>
                      {weekDates.map((d, i) => {
                        const dateStr = formatDate(d);
                        const daySchedule = empSchedules.find((s) => s.scheduleDate === dateStr);
                        return (
                          <td key={i} className="px-2 py-2 text-center">
                            {daySchedule ? (
                              <div
                                className="rounded px-2 py-1 text-xs font-medium text-white"
                                style={{ backgroundColor: daySchedule.shiftColorCode || '#6366f1' }}
                                title={`${daySchedule.shiftName} (${daySchedule.startTime} - ${daySchedule.endTime})`}
                              >
                                {daySchedule.shiftCode || daySchedule.shiftName}
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Shift Legend */}
          {shifts.length > 0 && (
            <div className="flex flex-wrap gap-3 enterprise-card p-3">
              <span className="text-xs font-medium text-muted-foreground">Shifts:</span>
              {shifts.map((s) => (
                <span key={s.id} className="inline-flex items-center gap-1 text-xs">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: s.colorCode || '#6366f1' }} />
                  {s.name} ({s.startTime}–{s.endTime})
                </span>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
