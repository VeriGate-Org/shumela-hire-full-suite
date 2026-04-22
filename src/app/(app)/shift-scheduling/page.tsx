'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton } from '@/components/LoadingComponents';
import { ShiftSchedule, Shift, shiftService } from '@/services/shiftService';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import { Cog6ToothIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

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

interface PopoverState {
  employeeName: string;
  employeeId: number;
  dateStr: string;
  dayIndex: number;
  existing?: ShiftSchedule;
}

export default function ShiftSchedulingPage() {
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const popoverRef = useRef<HTMLDivElement>(null);

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
    }).catch(() => {
      setLoading(false);
    });
  }, [startDate, endDate, department]);

  // Close popover on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopover(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
    const map = new Map<string, { id: number; schedules: ShiftSchedule[] }>();
    schedules.forEach((s) => {
      const key = s.employeeName;
      if (!map.has(key)) map.set(key, { id: s.employeeId, schedules: [] });
      map.get(key)!.schedules.push(s);
    });
    return map;
  }, [schedules]);

  const handleCellClick = (employeeName: string, employeeId: number, dateStr: string, dayIndex: number, existing?: ShiftSchedule) => {
    setPopover({ employeeName, employeeId, dateStr, dayIndex, existing });
  };

  const handleAssign = async (shiftId: number) => {
    if (!popover) return;
    setSaving(true);
    try {
      const newSchedule = await shiftService.assignShift(popover.employeeId, shiftId, popover.dateStr);
      setSchedules((prev) => {
        // Remove existing for same employee+date, add new
        const filtered = prev.filter(
          (s) => !(s.employeeId === popover.employeeId && s.scheduleDate === popover.dateStr)
        );
        return [...filtered, newSchedule];
      });
      toast('Shift assigned', 'success');
      setPopover(null);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

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
            <div className="enterprise-card overflow-x-auto relative">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase sticky left-0 bg-muted min-w-[150px]">Employee</th>
                    {weekDates.map((d, i) => (
                      <th key={i} className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase min-w-[100px]">
                        <div>{dayNames[i]}</div>
                        <div className="text-muted-foreground">{d.getDate()}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {Array.from(employeeMap.entries()).map(([name, { id: empId, schedules: empSchedules }]) => (
                    <tr key={name} className="hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm font-medium text-foreground sticky left-0 bg-card">{name}</td>
                      {weekDates.map((d, i) => {
                        const dateStr = formatDate(d);
                        const daySchedule = empSchedules.find((s) => s.scheduleDate === dateStr);
                        const isActive = popover?.employeeName === name && popover?.dateStr === dateStr;
                        return (
                          <td key={i} className="px-2 py-2 text-center relative">
                            <button
                              onClick={() => handleCellClick(name, empId, dateStr, i, daySchedule)}
                              className={`w-full rounded px-2 py-1 text-xs font-medium transition-colors min-h-[32px] ${
                                daySchedule
                                  ? 'text-white hover:opacity-80'
                                  : 'text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-dashed border-transparent hover:border-blue-300'
                              } ${isActive ? 'ring-2 ring-blue-500' : ''}`}
                              style={daySchedule ? { backgroundColor: daySchedule.shiftColorCode || '#6366f1' } : undefined}
                              title={daySchedule ? `${daySchedule.shiftName} (${daySchedule.startTime} - ${daySchedule.endTime})` : 'Click to assign shift'}
                            >
                              {daySchedule ? (daySchedule.shiftCode || daySchedule.shiftName) : '—'}
                            </button>

                            {/* Popover */}
                            {isActive && (
                              <div ref={popoverRef}
                                className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded-lg shadow-lg p-3 min-w-[160px]">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-foreground">Assign Shift</p>
                                  <button onClick={() => setPopover(null)} className="text-muted-foreground hover:text-foreground">
                                    <XMarkIcon className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="space-y-1">
                                  {shifts.map((s) => (
                                    <button
                                      key={s.id}
                                      onClick={() => handleAssign(s.id)}
                                      disabled={saving}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors disabled:opacity-50"
                                    >
                                      <span className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: s.colorCode || '#6366f1' }} />
                                      <span className="text-foreground">{s.name}</span>
                                      <span className="text-muted-foreground ml-auto">{s.startTime}–{s.endTime}</span>
                                    </button>
                                  ))}
                                </div>
                                {saving && (
                                  <p className="text-xs text-blue-600 mt-2 text-center">Saving...</p>
                                )}
                              </div>
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
