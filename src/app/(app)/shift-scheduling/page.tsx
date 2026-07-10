'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton } from '@/components/LoadingComponents';
import { ShiftSchedule, Shift, shiftService } from '@/services/shiftService';
import { useToast } from '@/components/Toast';
import Link from 'next/link';
import {
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  'bg-primary text-primary-foreground',
  'bg-accent-teal text-white',
  'bg-accent-pink text-white',
  'bg-accent-gold text-white',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface PopoverState {
  employeeName: string;
  employeeId: string;
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

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Group schedules by employee
  const employeeMap = useMemo(() => {
    const map = new Map<string, { id: string; department: string | null; schedules: ShiftSchedule[] }>();
    schedules.forEach((s) => {
      const key = s.employeeName;
      if (!map.has(key)) map.set(key, { id: s.employeeId, department: s.department, schedules: [] });
      map.get(key)!.schedules.push(s);
    });
    return map;
  }, [schedules]);

  // Compute stats
  const stats = useMemo(() => {
    const totalSlots = employeeMap.size * 7;
    const assignedSlots = schedules.length;
    const unassignedSlots = Math.max(0, totalSlots - assignedSlots);
    return { totalSlots, assignedSlots, unassignedSlots };
  }, [employeeMap, schedules]);

  const handleCellClick = (employeeName: string, employeeId: string, dateStr: string, dayIndex: number, existing?: ShiftSchedule) => {
    setPopover({ employeeName, employeeId, dateStr, dayIndex, existing });
  };

  const handleAssign = async (shiftId: string) => {
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

  /** Map a shift color code to Tailwind design system classes for the chip */
  function getShiftChipClasses(colorCode: string | undefined): string {
    if (!colorCode) return 'bg-surface-navy text-accent-navy border border-icon-bg-navy';
    const hex = colorCode.toLowerCase();
    // Map common shift colors to design system tints
    if (hex === '#047469' || hex === '#008c7f' || hex.includes('047469') || hex.includes('teal'))
      return 'bg-surface-teal text-accent-teal border border-icon-bg-teal';
    if (hex === '#d4a832' || hex === '#f1c54b' || hex.includes('d4a8') || hex.includes('gold') || hex.includes('f59e'))
      return 'bg-surface-gold text-accent-gold border border-icon-bg-gold';
    if (hex === '#05527e' || hex.includes('0552') || hex.includes('navy'))
      return 'bg-surface-navy text-accent-navy border border-icon-bg-navy';
    if (hex === '#d63050' || hex.includes('d630') || hex.includes('pink') || hex.includes('ef44'))
      return 'bg-surface-pink text-accent-pink border border-icon-bg-pink';
    if (hex === '#94a3b8' || hex.includes('94a3') || hex.includes('gray') || hex.includes('slate'))
      return 'bg-slate-50 text-slate-400 border border-slate-200';
    // Fallback: use navy tint
    return 'bg-surface-navy text-accent-navy border border-icon-bg-navy';
  }

  return (
    <FeatureGate feature="SHIFT_SCHEDULING">
      <PageWrapper
        title="Shift Scheduling"
        subtitle="Manage weekly shift assignments for your teams"
        actions={
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/shift-scheduling/manage"
              className="btn-cta inline-flex items-center gap-2">
              <Cog6ToothIcon className="w-4 h-4" /> Manage Shifts
            </Link>
          </div>
        }
      >
        <div className="space-y-4">

          {/* ====== Stats Bar ====== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Shifts Assigned */}
            <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-tight">
                  {stats.assignedSlots}
                  {stats.totalSlots > 0 && (
                    <span className="text-base font-medium text-muted-foreground">/{stats.totalSlots}</span>
                  )}
                </p>
                <p className="text-[0.8125rem] font-medium text-muted-foreground">Shifts Assigned</p>
              </div>
            </div>

            {/* Unassigned */}
            <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center">
                <ExclamationCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-tight">{stats.unassignedSlots}</p>
                <p className="text-[0.8125rem] font-medium text-muted-foreground">Unassigned</p>
              </div>
            </div>

            {/* Overtime Risk */}
            <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
              <div className="flex-shrink-0 w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-tight">0</p>
                <p className="text-[0.8125rem] font-medium text-muted-foreground">Overtime Risk</p>
              </div>
            </div>
          </div>

          {/* ====== Week Navigation Bar ====== */}
          <div className="enterprise-card px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={prevWeek}
                title="Previous Week"
                className="w-9 h-9 rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
              >
                <ChevronLeftIcon className="w-[18px] h-[18px]" />
              </button>
              <div>
                <span className="font-bold text-[1.0625rem] text-foreground">
                  {weekDates[0].toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} - {weekDates[6].toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                </span>
                <span className="text-sm font-medium text-muted-foreground ml-1">
                  {weekDates[6].getFullYear()}
                </span>
              </div>
              <button
                onClick={nextWeek}
                title="Next Week"
                className="w-9 h-9 rounded-control border border-border bg-card flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
              >
                <ChevronRightIcon className="w-[18px] h-[18px]" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Filter by department..."
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="text-sm font-medium px-3 py-2 border border-border rounded-control bg-card text-foreground focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-colors min-w-[180px]"
              />
              <button
                onClick={goToToday}
                className="btn-secondary inline-flex items-center gap-1.5 !py-2 !px-3 !text-xs"
              >
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                Today
              </button>
            </div>
          </div>

          {/* ====== Shift Legend ====== */}
          {shifts.length > 0 && (
            <div className="enterprise-card px-5 py-4 flex items-center gap-6 flex-wrap">
              <span className="text-[0.8125rem] font-semibold text-foreground">Shift Legend:</span>
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
                  <div
                    className={`w-7 h-4 rounded ${getShiftChipClasses(s.colorCode).split(' ').slice(0, 2).join(' ')}`}
                    style={
                      !getShiftChipClasses(s.colorCode).includes('surface-')
                        ? { backgroundColor: s.colorCode || undefined }
                        : undefined
                    }
                  />
                  {s.name} ({s.startTime}-{s.endTime})
                </div>
              ))}
            </div>
          )}

          {/* ====== Schedule Grid ====== */}
          {loading ? (
            <div className="enterprise-card p-6"><TableSkeleton /></div>
          ) : employeeMap.size === 0 ? (
            <div className="enterprise-card p-8 text-center text-muted-foreground">
              No shift schedules found for this period.
            </div>
          ) : (
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className="bg-background border-b border-border">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-[200px]">
                        Employee
                      </th>
                      {weekDates.map((d, i) => (
                        <th key={i} className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap min-w-[130px]">
                          {dayNames[i]}
                          <span className="block text-[0.6875rem] font-medium text-muted-foreground/70 normal-case tracking-normal mt-0.5">
                            {d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(employeeMap.entries()).map(([name, { id: empId, department: empDept, schedules: empSchedules }], rowIdx) => (
                      <tr
                        key={name}
                        className={`border-b border-border transition-colors hover:bg-surface-navy ${rowIdx % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
                      >
                        {/* Employee cell with avatar */}
                        <td className="px-4 py-2.5 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[0.6875rem] font-bold flex-shrink-0 ${getAvatarColor(name)}`}>
                              {getInitials(name)}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground text-sm leading-snug">{name}</span>
                              {empDept && (
                                <span className="text-xs text-muted-foreground leading-snug">{empDept}</span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Day cells */}
                        {weekDates.map((d, i) => {
                          const dateStr = formatDate(d);
                          const daySchedule = empSchedules.find((s) => s.scheduleDate === dateStr);
                          const isActive = popover?.employeeName === name && popover?.dateStr === dateStr;
                          return (
                            <td key={i} className="px-2 py-2 text-center align-middle relative">
                              {daySchedule ? (
                                <button
                                  onClick={() => handleCellClick(name, empId, dateStr, i, daySchedule)}
                                  className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-control text-xs font-semibold cursor-pointer transition-all hover:scale-[1.03] hover:shadow-sm ${getShiftChipClasses(daySchedule.shiftColorCode)} ${isActive ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                  title={`${daySchedule.shiftName} (${daySchedule.startTime} - ${daySchedule.endTime})`}
                                >
                                  {daySchedule.shiftCode || daySchedule.shiftName}
                                  <span className="text-[0.625rem] font-medium opacity-80">
                                    {daySchedule.startTime}-{daySchedule.endTime}
                                  </span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleCellClick(name, empId, dateStr, i)}
                                  className={`w-full flex items-center justify-center py-2 rounded-control border-2 border-dashed border-border text-muted-foreground cursor-pointer transition-all hover:border-primary hover:bg-surface-navy hover:text-primary min-h-[40px] ${isActive ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                  title="Click to assign shift"
                                >
                                  <PlusIcon className="w-[18px] h-[18px]" />
                                </button>
                              )}

                              {/* Popover */}
                              {isActive && (
                                <div ref={popoverRef}
                                  className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded-card shadow-lg p-4 min-w-[220px]">
                                  <div className="font-bold text-[0.8125rem] text-foreground mb-3 pb-2 border-b border-border flex items-center justify-between">
                                    <span>Assign Shift</span>
                                    <button onClick={() => setPopover(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                                      <XMarkIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="space-y-1">
                                    {shifts.map((s) => (
                                      <button
                                        key={s.id}
                                        onClick={() => handleAssign(s.id)}
                                        disabled={saving}
                                        className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[0.8125rem] font-medium text-foreground rounded-control hover:bg-background transition-colors disabled:opacity-50 text-left"
                                      >
                                        <span
                                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                          style={{ backgroundColor: s.colorCode || '#05527E' }}
                                        />
                                        <span>{s.name}</span>
                                        <span className="text-[0.6875rem] text-muted-foreground ml-auto">{s.startTime}-{s.endTime}</span>
                                      </button>
                                    ))}
                                  </div>
                                  {saving && (
                                    <p className="text-xs text-primary mt-3 text-center font-medium">Saving...</p>
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
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
