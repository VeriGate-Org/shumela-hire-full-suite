'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';

interface AttendanceSummary {
  averageHoursPerDay: number;
  averageHoursPerWeek: number;
  lateArrivalRate: number;
  absenceRate: number;
  overtimeRate: number;
  presentRate: number;
  totalWorkingDaysThisMonth: number;
}

interface MonthlyTrend {
  month: string;
  avgHours: number;
  lateRate: number;
  absenceRate: number;
}

interface DeptAttendance {
  department: string;
  avgHours: number;
  lateRate: number;
  absenceRate: number;
}

interface DayDistribution {
  day: string;
  avgHours: number;
  lateRate: number;
}

interface OvertimeSummary {
  totalOvertimeHoursThisMonth: number;
  employeesWithOvertime: number;
  averageOvertimePerEmployee: number;
  topOvertimeDepartment: string;
}

export default function AttendanceAnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await hrAnalyticsService.getAttendanceAnalytics();
      setMetrics(data);
    } catch {
      toast('Failed to load attendance analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const summary = (metrics.summary || {}) as AttendanceSummary;
  const monthlyTrends = (metrics.monthlyTrends || []) as MonthlyTrend[];
  const deptAttendance = (metrics.departmentAttendance || []) as DeptAttendance[];
  const dayDistribution = (metrics.dayOfWeekDistribution || []) as DayDistribution[];
  const overtime = (metrics.overtime || {}) as OvertimeSummary;

  const maxAvgHours = Math.max(...monthlyTrends.map((t) => t.avgHours), 1);

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="Attendance Analytics" subtitle="Workforce attendance patterns and trends">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Avg Hours/Day', value: summary.averageHoursPerDay, color: '#8b5cf6' },
                { label: 'Avg Hours/Week', value: summary.averageHoursPerWeek, color: '#6366f1' },
                { label: 'Late Rate', value: `${summary.lateArrivalRate}%`, color: '#f59e0b' },
                { label: 'Absence Rate', value: `${summary.absenceRate}%`, color: '#ef4444' },
                { label: 'Overtime Rate', value: `${summary.overtimeRate}%`, color: '#06b6d4' },
                { label: 'Present Rate', value: `${summary.presentRate}%`, color: '#10b981' },
                { label: 'Working Days', value: summary.totalWorkingDaysThisMonth, color: '#a78bfa' },
              ].map((card) => (
                <div key={card.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: card.color }}>
                    {card.value ?? '-'}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Trends Bar Chart */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Monthly Average Hours</h3>
                <div className="flex items-end gap-1 h-44">
                  {monthlyTrends.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center">
                      <span className="text-[10px] text-gray-400 mb-1">{item.avgHours}h</span>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${(item.avgHours / maxAvgHours) * 100}%`,
                          backgroundColor: '#8b5cf6',
                          minHeight: '4px',
                        }}
                      />
                      <span className="text-[10px] text-gray-500 mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Attendance Table */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Department Attendance</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 font-medium">Department</th>
                        <th className="text-right py-2 font-medium">Avg Hours</th>
                        <th className="text-right py-2 font-medium">Late %</th>
                        <th className="text-right py-2 font-medium">Absence %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptAttendance.map((dept) => (
                        <tr key={dept.department} className="border-b border-gray-700/50">
                          <td className="py-2 text-gray-300">{dept.department}</td>
                          <td className="py-2 text-right text-violet-400 font-medium">{dept.avgHours}</td>
                          <td className="py-2 text-right">
                            <span className={dept.lateRate > 6 ? 'text-amber-400' : 'text-green-400'}>
                              {dept.lateRate}%
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            <span className={dept.absenceRate > 3 ? 'text-red-400' : 'text-green-400'}>
                              {dept.absenceRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Day of Week Distribution */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Day of Week Patterns</h3>
                <div className="space-y-3">
                  {dayDistribution.map((day) => (
                    <div key={day.day}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{day.day}</span>
                        <span className="text-gray-400">{day.avgHours}h avg | {day.lateRate}% late</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(day.avgHours / 9) * 100}%`,
                            backgroundColor: day.lateRate > 7 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overtime Summary */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Overtime Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase">Total OT Hours</p>
                    <p className="text-2xl font-bold text-cyan-400 mt-1">{overtime.totalOvertimeHoursThisMonth}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase">Employees with OT</p>
                    <p className="text-2xl font-bold text-violet-400 mt-1">{overtime.employeesWithOvertime}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase">Avg OT / Employee</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">{overtime.averageOvertimePerEmployee}h</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <p className="text-xs text-gray-400 uppercase">Top OT Dept</p>
                    <p className="text-lg font-bold text-green-400 mt-1">{overtime.topOvertimeDepartment}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
