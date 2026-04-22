'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import {
  RecruitmentBarChart,
  RecruitmentPieChart,
  CHART_COLORS,
} from '@/components/charts/RecruitmentCharts';
import { TableSkeleton } from '@/components/LoadingComponents';

export default function PerformanceAnalyticsPage() {
  const [data, setData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hrAnalyticsService.getPerformanceAnalytics().then((metrics) => {
      setData(metrics);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Performance Analytics" subtitle="Insights across performance reviews and goals">
        <TableSkeleton />
      </PageWrapper>
    );
  }

  const avgRatingByDept = (data.avgRatingByDepartment || []) as any[];
  const ratingDist = (data.ratingDistribution || []) as any[];
  const statusBreakdown = (data.reviewStatusBreakdown || []) as any[];
  const topPerformers = (data.topPerformers || []) as any[];
  const pipStats = (data.pipStats || {}) as any;

  return (
    <PageWrapper title="Performance Analytics" subtitle="Insights across performance reviews and goals">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <p className="text-xs text-muted-foreground">Average Rating</p>
            <p className="text-3xl font-bold text-foreground mt-1">{data.averageRating ?? '—'}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
          </div>
          <div className="enterprise-card p-4">
            <p className="text-xs text-muted-foreground">Review Completion</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{data.reviewCompletionRate ?? 0}%</p>
          </div>
          <div className="enterprise-card p-4">
            <p className="text-xs text-muted-foreground">Goal Achievement</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{data.goalAchievementRate ?? 0}%</p>
          </div>
          <div className="enterprise-card p-4">
            <p className="text-xs text-muted-foreground">Active PIPs</p>
            <p className="text-3xl font-bold text-amber-600 mt-1">{data.activePips ?? 0}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Avg Rating by Department */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Average Rating by Department</h3>
            {avgRatingByDept.length > 0 ? (
              <RecruitmentBarChart
                data={avgRatingByDept}
                xKey="department"
                yKey="avgRating"
                height={280}
                color={CHART_COLORS.primary}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>

          {/* Rating Distribution */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Rating Distribution</h3>
            {ratingDist.length > 0 ? (
              <RecruitmentPieChart
                data={ratingDist}
                dataKey="value"
                height={280}
                innerRadius={50}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>
        </div>

        {/* Second Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Review Status Breakdown */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Review Status Breakdown</h3>
            {statusBreakdown.length > 0 ? (
              <RecruitmentPieChart
                data={statusBreakdown}
                dataKey="value"
                height={280}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No data available</p>
            )}
          </div>

          {/* PIP Stats */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">PIP Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Active PIPs</p>
                <p className="text-2xl font-bold text-amber-600">{pipStats.active ?? 0}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Completed Successfully</p>
                <p className="text-2xl font-bold text-green-600">{pipStats.completedSuccessfully ?? 0}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Terminated</p>
                <p className="text-2xl font-bold text-red-600">{pipStats.terminated ?? 0}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold text-foreground">{pipStats.averageDurationDays ?? 0}<span className="text-sm font-normal"> days</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performers Table */}
        <div className="enterprise-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Top Performers</h3>
          </div>
          {topPerformers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Department</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topPerformers.map((p: any, i: number) => (
                    <tr key={i} className="hover:bg-muted">
                      <td className="px-4 py-3 text-sm text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.role}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{p.department}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.rating >= 4.5 ? 'bg-green-100 text-green-700' :
                          p.rating >= 4.0 ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {p.rating}/5
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">No performance data available</div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
