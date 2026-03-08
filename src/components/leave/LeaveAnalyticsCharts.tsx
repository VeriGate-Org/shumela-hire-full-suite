'use client';

import { useState, useEffect } from 'react';
import { leaveService } from '@/services/leaveService';

export default function LeaveAnalyticsCharts() {
  const [analytics, setAnalytics] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaveService.getAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="bg-white rounded-lg shadow border p-8 text-center text-gray-500">Loading analytics...</div>;
  }

  const byType = (analytics.currentMonthByType || {}) as Record<string, number>;
  const byDepartment = (analytics.currentMonthByDepartment || {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-sm text-gray-500">Pending Requests</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{analytics.pendingRequests ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-sm text-gray-500">On Leave Today</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{analytics.employeesOnLeaveToday ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow border p-4">
          <p className="text-sm text-gray-500">Days Taken This Month</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{analytics.totalDaysTakenThisMonth ?? 0}</p>
        </div>
      </div>

      {/* By Type */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Leave by Type (Current Month)</h3>
        {Object.keys(byType).length === 0 ? (
          <p className="text-sm text-gray-500">No leave data for this month</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-40 truncate">{type}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4">
                  <div className="bg-blue-500 h-4 rounded-full" style={{ width: `${Math.min(100, (count / Math.max(...Object.values(byType))) * 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* By Department */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Leave by Department (Current Month)</h3>
        {Object.keys(byDepartment).length === 0 ? (
          <p className="text-sm text-gray-500">No department data for this month</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-40 truncate">{dept}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4">
                  <div className="bg-green-500 h-4 rounded-full" style={{ width: `${Math.min(100, (count / Math.max(...Object.values(byDepartment))) * 100)}%` }} />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
