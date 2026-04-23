'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import {
  ChartBarIcon,
  StarIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface RatingDist { name: string; value: number }
interface DeptRating { department: string; avgRating: number; count: number }
interface TopPerformer { name: string; department: string; rating: number; role: string }
interface StatusBreakdown { name: string; value: number }
interface PipStats { active: number; completedSuccessfully: number; terminated: number; averageDurationDays: number }

interface PerformanceMetrics {
  averageRating: number;
  reviewCompletionRate: number;
  goalAchievementRate: number;
  activePips: number;
  totalReviews: number;
  completedReviews: number;
  avgRatingByDepartment: DeptRating[];
  ratingDistribution: RatingDist[];
  reviewStatusBreakdown: StatusBreakdown[];
  topPerformers: TopPerformer[];
  pipStats: PipStats;
}

const RATING_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6'];

export default function PerformanceAnalyticsPage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await hrAnalyticsService.getPerformanceAnalytics();
      setMetrics(data as unknown as PerformanceMetrics);
    } catch {
      console.error('Failed to load performance analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <FeatureGate feature="PERFORMANCE_MANAGEMENT">
        <PageWrapper title="Performance Analytics" subtitle="Loading...">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (!metrics) {
    return (
      <FeatureGate feature="PERFORMANCE_MANAGEMENT">
        <PageWrapper title="Performance Analytics" subtitle="No data available">
          <div className="text-center py-12 text-muted-foreground">
            <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Unable to load performance metrics.</p>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  const ratingDistTotal = metrics.ratingDistribution?.reduce((s, r) => s + r.value, 0) || 1;
  const statusTotal = metrics.reviewStatusBreakdown?.reduce((s, r) => s + r.value, 0) || 1;
  const maxDeptCount = Math.max(...(metrics.avgRatingByDepartment?.map(d => d.count) || [1]));

  return (
    <FeatureGate feature="PERFORMANCE_MANAGEMENT">
      <PageWrapper title="Performance Analytics" subtitle="Rating distributions, completion rates, and department comparisons">
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard icon={StarIcon} label="Avg Rating" value={metrics.averageRating?.toFixed(1)} color="text-yellow-600" bg="bg-yellow-50" />
            <KpiCard icon={CheckBadgeIcon} label="Completion Rate" value={`${metrics.reviewCompletionRate?.toFixed(0)}%`} color="text-green-600" bg="bg-green-50" />
            <KpiCard icon={ArrowTrendingUpIcon} label="Goal Achievement" value={`${metrics.goalAchievementRate?.toFixed(0)}%`} color="text-blue-600" bg="bg-blue-50" />
            <KpiCard icon={UserGroupIcon} label="Total Reviews" value={metrics.totalReviews} color="text-indigo-600" bg="bg-indigo-50" />
            <KpiCard icon={CheckBadgeIcon} label="Completed" value={metrics.completedReviews} color="text-emerald-600" bg="bg-emerald-50" />
            <KpiCard icon={ExclamationTriangleIcon} label="Active PIPs" value={metrics.activePips} color="text-red-600" bg="bg-red-50" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {metrics.ratingDistribution?.map((r, i) => {
                  const pct = ((r.value / ratingDistTotal) * 100).toFixed(0);
                  return (
                    <div key={r.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{r.name}</span>
                      <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: RATING_COLORS[i] || '#6B7280' }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                          {r.value} ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review Status Breakdown */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Review Status Breakdown</h3>
              <div className="space-y-3">
                {metrics.reviewStatusBreakdown?.map(s => {
                  const pct = ((s.value / statusTotal) * 100).toFixed(0);
                  const color = s.name === 'Completed' ? '#22C55E' : s.name === 'Pending' ? '#EAB308' : '#3B82F6';
                  return (
                    <div key={s.name} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-36 shrink-0 truncate">{s.name}</span>
                      <div className="flex-1 h-7 bg-gray-100 rounded-full overflow-hidden relative">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                          {s.value} ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Completion gauge */}
              <div className="mt-6 text-center">
                <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-8 border-green-200 relative">
                  <svg className="absolute inset-0" viewBox="0 0 112 112">
                    <circle cx="56" cy="56" r="48" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                    <circle
                      cx="56" cy="56" r="48" fill="none" stroke="#22C55E" strokeWidth="8"
                      strokeDasharray={`${(metrics.reviewCompletionRate / 100) * 301.6} 301.6`}
                      strokeLinecap="round"
                      transform="rotate(-90 56 56)"
                    />
                  </svg>
                  <span className="text-lg font-bold text-green-700">{metrics.reviewCompletionRate?.toFixed(0)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Review Completion</p>
              </div>
            </div>
          </div>

          {/* Department Comparison */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Department Performance Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 text-xs font-medium text-muted-foreground">Department</th>
                    <th className="text-left pb-3 text-xs font-medium text-muted-foreground">Avg Rating</th>
                    <th className="text-left pb-3 text-xs font-medium text-muted-foreground w-1/2">Distribution</th>
                    <th className="text-right pb-3 text-xs font-medium text-muted-foreground">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.avgRatingByDepartment?.map(dept => {
                    const barPct = (dept.avgRating / 5) * 100;
                    const barColor = dept.avgRating >= 4 ? '#22C55E' : dept.avgRating >= 3.5 ? '#3B82F6' : dept.avgRating >= 3 ? '#EAB308' : '#EF4444';
                    return (
                      <tr key={dept.department} className="border-b last:border-0">
                        <td className="py-3 text-sm text-foreground font-medium">{dept.department}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">{dept.avgRating.toFixed(1)}</span>
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, backgroundColor: barColor }} />
                          </div>
                        </td>
                        <td className="py-3 text-right text-muted-foreground">{dept.count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Top Performers</h3>
              <div className="space-y-2">
                {metrics.topPerformers?.slice(0, 10).map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.role} — {p.department}</p>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
                      <StarIcon className="w-4 h-4" /> {p.rating.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* PIP Statistics */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Performance Improvement Plans</h3>
              {metrics.pipStats && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-red-50 text-center">
                    <p className="text-2xl font-bold text-red-700">{metrics.pipStats.active}</p>
                    <p className="text-xs text-red-600 mt-1">Active PIPs</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-50 text-center">
                    <p className="text-2xl font-bold text-green-700">{metrics.pipStats.completedSuccessfully}</p>
                    <p className="text-xs text-green-600 mt-1">Completed Successfully</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50 text-center">
                    <p className="text-2xl font-bold text-gray-700">{metrics.pipStats.terminated}</p>
                    <p className="text-xs text-gray-600 mt-1">Terminated</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 text-center">
                    <p className="text-2xl font-bold text-blue-700">{metrics.pipStats.averageDurationDays}</p>
                    <p className="text-xs text-blue-600 mt-1">Avg Duration (days)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}

function KpiCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className={`${bg} rounded-lg p-4 text-center`}>
      <Icon className={`w-6 h-6 ${color} mx-auto mb-1`} />
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
