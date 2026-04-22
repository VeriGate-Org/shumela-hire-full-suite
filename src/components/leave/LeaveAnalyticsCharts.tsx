'use client';

import { useState, useEffect } from 'react';
import { leaveService } from '@/services/leaveService';
import {
  RecruitmentLineChart,
  RecruitmentBarChart,
  CHART_COLORS,
  CHART_COLOR_PALETTE,
  useChartColors,
} from '@/components/charts/RecruitmentCharts';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function LeaveAnalyticsCharts() {
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [trends, setTrends] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const { grid, axis } = useChartColors();

  useEffect(() => {
    Promise.all([
      leaveService.getAnalytics(),
      leaveService.getAnalyticsTrends(),
    ]).then(([anl, trd]) => {
      setAnalytics(anl);
      setTrends(trd);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="enterprise-card p-8 text-center text-muted-foreground">Loading analytics...</div>;
  }

  const _byType = analytics.currentMonthByType || {};
  const byDepartment = (analytics.currentMonthByDepartment || {}) as Record<string, number>;
  const monthlyTrends = (trends.monthlyTrends || []) as any[];

  // Prepare stacked area data — extract unique leave types
  const allTypes = new Set<string>();
  monthlyTrends.forEach((m: any) => {
    if (m.byType) Object.keys(m.byType).forEach((t) => allTypes.add(t));
  });
  const typeList = Array.from(allTypes);
  const stackedData = monthlyTrends.map((m: any) => {
    const point: Record<string, any> = { month: m.month, totalDays: Number(m.totalDays) || 0 };
    typeList.forEach((t) => { point[t] = (m.byType && m.byType[t]) || 0; });
    return point;
  });

  const deptData = Object.entries(byDepartment).map(([dept, count]) => ({ department: dept, count }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground">Pending Requests</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{analytics.pendingRequests ?? 0}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground">On Leave Today</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.employeesOnLeaveToday ?? 0}</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground">Utilization Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{trends.utilizationRate ?? 0}%</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground">Absenteeism Rate</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{trends.absenteeismRate ?? 0}%</p>
        </div>
        <div className="enterprise-card p-4">
          <p className="text-xs text-muted-foreground">Avg Approval Time</p>
          <p className="text-3xl font-bold text-foreground mt-1">{trends.averageApprovalTimeDays ?? 0}<span className="text-sm font-normal"> days</span></p>
        </div>
      </div>

      {/* 12-Month Leave Trend */}
      <div className="enterprise-card p-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">12-Month Leave Trend</h3>
        {stackedData.length > 0 ? (
          <RecruitmentLineChart
            data={stackedData}
            xKey="month"
            yKey="totalDays"
            height={280}
            color={CHART_COLORS.primary}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No trend data available</p>
        )}
      </div>

      {/* Stacked Area by Type + Department Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leave by Type Over Time</h3>
          {stackedData.length > 0 && typeList.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stackedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} />
                <XAxis dataKey="month" stroke={axis} fontSize={12} />
                <YAxis stroke={axis} fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '4px' }} />
                <Legend />
                {typeList.map((type, i) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    stackId="1"
                    stroke={CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length]}
                    fill={CHART_COLOR_PALETTE[i % CHART_COLOR_PALETTE.length]}
                    fillOpacity={0.6}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No data available</p>
          )}
        </div>

        <div className="enterprise-card p-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">Leave by Department (Current Month)</h3>
          {deptData.length > 0 ? (
            <RecruitmentBarChart
              data={deptData}
              xKey="department"
              yKey="count"
              height={280}
              color={CHART_COLORS.secondary}
            />
          ) : (
            <p className="text-sm text-muted-foreground">No department data for this month</p>
          )}
        </div>
      </div>
    </div>
  );
}
