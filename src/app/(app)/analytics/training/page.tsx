'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';

interface TrainingSummary {
  totalCourses: number;
  activeCourses: number;
  totalEnrollments: number;
  completionRate: number;
  averageScore: number;
  totalTrainingHours: number;
  trainingSpendYTD: number;
  costPerEmployee: number;
}

interface PopularCourse {
  courseName: string;
  enrollments: number;
  completionRate: number;
  avgScore: number;
}

interface DeptParticipation {
  department: string;
  enrollments: number;
  completionRate: number;
  hoursSpent: number;
}

interface MonthlyCompletion {
  month: string;
  completed: number;
  enrolled: number;
}

interface SpendItem {
  category: string;
  amount: number;
  percentage: number;
}

export default function TrainingAnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await hrAnalyticsService.getTrainingAnalytics();
      setMetrics(data);
    } catch {
      toast('Failed to load training analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const summary = (metrics.summary || {}) as TrainingSummary;
  const popularCourses = (metrics.popularCourses || []) as PopularCourse[];
  const deptParticipation = (metrics.departmentParticipation || []) as DeptParticipation[];
  const monthlyCompletions = (metrics.monthlyCompletions || []) as MonthlyCompletion[];
  const spendBreakdown = (metrics.spendBreakdown || []) as SpendItem[];

  const maxEnrolled = Math.max(...monthlyCompletions.map((m) => m.enrolled), 1);

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="Training Analytics" subtitle="Learning and development metrics across the organization">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Courses', value: summary.totalCourses, colorClass: 'text-accent-navy' },
                { label: 'Active Courses', value: summary.activeCourses, colorClass: 'text-accent-teal' },
                { label: 'Total Enrollments', value: summary.totalEnrollments?.toLocaleString(), colorClass: 'text-primary' },
                { label: 'Completion Rate', value: `${summary.completionRate}%`, colorClass: 'text-accent-gold' },
                { label: 'Average Score', value: `${summary.averageScore}%`, colorClass: 'text-accent-navy' },
                { label: 'Training Hours', value: summary.totalTrainingHours?.toLocaleString(), colorClass: 'text-primary' },
                { label: 'Spend YTD', value: `R${summary.trainingSpendYTD?.toLocaleString()}`, colorClass: 'text-accent-pink' },
                { label: 'Cost / Employee', value: `R${summary.costPerEmployee?.toLocaleString()}`, colorClass: 'text-accent-teal' },
              ].map((card) => (
                <div key={card.label} className="enterprise-card p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${card.colorClass}`}>
                    {card.value ?? '-'}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Completions Chart */}
              <div className="enterprise-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Enrollments vs Completions</h3>
                <div className="flex items-end gap-1 h-44">
                  {monthlyCompletions.map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <span className="text-[9px] text-muted-foreground">{item.completed}/{item.enrolled}</span>
                      <div className="w-full flex gap-0.5" style={{ height: `${(item.enrolled / maxEnrolled) * 100}%`, minHeight: '8px' }}>
                        <div className="flex-1 rounded-t bg-accent-navy" />
                        <div
                          className="flex-1 rounded-t bg-accent-teal"
                          style={{
                            height: `${(item.completed / item.enrolled) * 100}%`,
                            alignSelf: 'flex-end',
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-accent-navy" /> Enrolled
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-accent-teal" /> Completed
                  </span>
                </div>
              </div>

              {/* Popular Courses */}
              <div className="enterprise-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Popular Courses</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b border-border">
                        <th className="text-left py-2 font-medium">Course</th>
                        <th className="text-right py-2 font-medium">Enrolled</th>
                        <th className="text-right py-2 font-medium">Completion</th>
                        <th className="text-right py-2 font-medium">Avg Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {popularCourses.map((course) => (
                        <tr key={course.courseName} className="border-b border-border/50">
                          <td className="py-2 text-foreground max-w-[160px] truncate">{course.courseName}</td>
                          <td className="py-2 text-right text-accent-navy">{course.enrollments}</td>
                          <td className="py-2 text-right">
                            <span className={course.completionRate >= 80 ? 'text-accent-teal' : 'text-accent-gold'}>
                              {course.completionRate}%
                            </span>
                          </td>
                          <td className="py-2 text-right text-primary">{course.avgScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Participation */}
              <div className="enterprise-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Department Participation</h3>
                <div className="space-y-3">
                  {deptParticipation.map((dept) => (
                    <div key={dept.department}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{dept.department}</span>
                        <span className="text-muted-foreground">{dept.enrollments} enrolled | {dept.completionRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${dept.completionRate >= 80 ? 'bg-accent-teal' : 'bg-accent-gold'}`}
                          style={{ width: `${dept.completionRate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Spend Breakdown */}
              <div className="enterprise-card p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Training Spend Breakdown</h3>
                <div className="space-y-3">
                  {spendBreakdown.map((item, idx) => {
                    const barColors = ['bg-accent-navy', 'bg-primary', 'bg-accent-teal', 'bg-accent-gold', 'bg-accent-pink'];
                    return (
                      <div key={item.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">{item.category}</span>
                          <span className="text-muted-foreground">R{item.amount.toLocaleString()} ({item.percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${barColors[idx % barColors.length]}`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
