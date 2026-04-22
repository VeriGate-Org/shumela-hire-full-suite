'use client';

import { useState, useEffect } from 'react';
import { LeaveCalendarEntry, leaveService } from '@/services/leaveService';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface LeaveCalendarProps {
  department?: string;
}

export default function LeaveCalendar({ department }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [entries, setEntries] = useState<LeaveCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  useEffect(() => {
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;

    setLoading(true);
    leaveService.getCalendar(startDate, endDate, department).then((data) => {
      setEntries(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      // BUG-003 fix: gracefully handle fetch failures
      setEntries([]);
      setLoading(false);
    });
  }, [year, month, daysInMonth, department]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEntriesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.filter((e) => dateStr >= e.startDate && dateStr <= e.endDate);
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="bg-white rounded-lg shadow border">
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronLeftIcon className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {monthNames[month]} {year}
        </h3>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
          <ChevronRightIcon className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading calendar...</div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-px">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfWeek }, (_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] bg-gray-50 rounded" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayEntries = getEntriesForDay(day);
              const isWeekend = new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

              return (
                <div
                  key={day}
                  className={`min-h-[80px] border border-gray-100 rounded p-1 ${isWeekend ? 'bg-gray-50' : ''}`}
                >
                  <span className="text-xs font-medium text-gray-700">{day}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayEntries.slice(0, 3).map((entry) => {
                      // BUG-003 fix: guard against null/undefined employeeName and leaveTypeName
                      const displayName = entry.employeeName || entry.leaveTypeName || 'Leave';
                      return (
                      <div
                        key={entry.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: entry.colorCode || '#3b82f6' }}
                        title={`${entry.employeeName ?? 'Unknown'} - ${entry.leaveTypeName ?? 'Leave'}`}
                      >
                        {displayName.split(' ')[0]}
                      </div>
                      );
                    })}
                    {dayEntries.length > 3 && (
                      <div className="text-[10px] text-gray-500">
                        +{dayEntries.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
