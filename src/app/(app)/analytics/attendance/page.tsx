'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';
import { aiAttendanceService } from '@/services/aiAttendanceService';
import { AttendanceAnomalyResult } from '@/types/ai';
import { SparklesIcon } from '@heroicons/react/24/outline';

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
  const [aiAnomalies, setAiAnomalies] = useState<AttendanceAnomalyResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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

  async function detectAnomalies() {
    setAiLoading(true);
    try {
      const result = await aiAttendanceService.detectAnomalies({
        department: 'All Departments',
        records: [],
        periodDays: 30,
      });
      setAiAnomalies(result);
    } catch (error) {
      console.error('AI anomaly detection failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  const maxAvgHours = Math.max(...monthlyTrends.map((t) => t.avgHours), 1);

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="Attendance Analytics" subtitle="Workforce attendance patterns and trends"
        actions={
          <button onClick={detectAnomalies} disabled={aiLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1">
            <SparklesIcon className="h-4 w-4" />
            {aiLoading ? 'Detecting...' : 'AI Anomaly Detection'}
          </button>
        }
      >
        {aiAnomalies && (
          <div className="mb-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                AI Anomaly Detection Results
              </h3>
              <button onClick={() => setAiAnomalies(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{aiAnomalies.overallAssessment}</p>
            {aiAnomalies.anomalies?.length > 0 && (
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Detected Anomalies</h4>
                <div className="space-y-2">
                  {aiAnomalies.anomalies.map((a, i) => {
                    const severityColors: Record<string, string> = {
                      CRITICAL: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                      HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
                      MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                      LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
                    };
                    return (
                      <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg flex items-start gap-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${severityColors[a.severity] || severityColors.LOW}`}>
                          {a.severity}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.anomalyType} — {a.employeeName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{a.description}</p>
                          {a.suggestedAction && <p className="text-xs text-gray-500 mt-1">Action: {a.suggestedAction}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiAnomalies.fatigueWarnings?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Fatigue Warnings</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiAnomalies.fatigueWarnings.map((w, i) => <li key={i}>- {w}</li>)}
                  </ul>
                </div>
              )}
              {aiAnomalies.policyViolations?.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">Policy Violations</h4>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                    {aiAnomalies.policyViolations.map((v, i) => <li key={i}>- {v}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
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
