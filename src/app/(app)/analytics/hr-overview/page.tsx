'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';

interface HeadcountData {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  onProbation: number;
  newHiresThisMonth: number;
  terminationsThisMonth: number;
}

interface TurnoverData {
  annualTurnoverRate: number;
  voluntaryTurnoverRate: number;
  involuntaryTurnoverRate: number;
  monthlyTurnoverRates: { month: string; rate: number }[];
}

interface TenureData {
  averageTenureYears: number;
  medianTenureYears: number;
  tenureBands: { band: string; count: number }[];
}

interface DeptDistribution {
  department: string;
  count: number;
  percentage: number;
}

interface KPIs {
  costPerHire: number;
  timeToFillDays: number;
  offerAcceptanceRate: number;
  employeeSatisfactionScore: number;
}

export default function HROverviewPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await hrAnalyticsService.getHROverview();
      setMetrics(data);
    } catch {
      toast('Failed to load HR overview analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const headcount = (metrics.headcount || {}) as HeadcountData;
  const turnover = (metrics.turnover || {}) as TurnoverData;
  const tenure = (metrics.tenure || {}) as TenureData;
  const deptDistribution = (metrics.departmentDistribution || []) as DeptDistribution[];
  const kpis = (metrics.kpis || {}) as KPIs;

  const maxDeptCount = Math.max(...deptDistribution.map((d) => d.count), 1);
  const maxTenureCount = Math.max(...(tenure.tenureBands || []).map((b) => b.count), 1);

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="HR Overview Analytics" subtitle="Key workforce metrics and organizational insights">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Headcount Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Total Employees', value: headcount.totalEmployees, color: '#8b5cf6' },
                { label: 'Active', value: headcount.activeEmployees, color: '#10b981' },
                { label: 'On Leave', value: headcount.onLeave, color: '#f59e0b' },
                { label: 'On Probation', value: headcount.onProbation, color: '#6366f1' },
                { label: 'New Hires (Month)', value: headcount.newHiresThisMonth, color: '#06b6d4' },
                { label: 'Terminations (Month)', value: headcount.terminationsThisMonth, color: '#ef4444' },
              ].map((card) => (
                <div key={card.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: card.color }}>
                    {card.value ?? '-'}
                  </p>
                </div>
              ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Cost per Hire', value: kpis.costPerHire ? `R${kpis.costPerHire?.toLocaleString()}` : '-', color: '#f59e0b' },
                { label: 'Time to Fill (days)', value: kpis.timeToFillDays ?? '-', color: '#8b5cf6' },
                { label: 'Offer Acceptance Rate', value: kpis.offerAcceptanceRate ? `${kpis.offerAcceptanceRate}%` : '-', color: '#10b981' },
                { label: 'Satisfaction Score', value: kpis.employeeSatisfactionScore ? `${kpis.employeeSatisfactionScore}/10` : '-', color: '#06b6d4' },
              ].map((card) => (
                <div key={card.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">{card.label}</p>
                  <p className="text-3xl font-bold mt-2" style={{ color: card.color }}>
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Turnover Rate Chart */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-1">Monthly Turnover Rate</h3>
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                  <span>Annual: <strong className="text-red-400">{turnover.annualTurnoverRate}%</strong></span>
                  <span>Voluntary: <strong className="text-amber-400">{turnover.voluntaryTurnoverRate}%</strong></span>
                  <span>Involuntary: <strong className="text-orange-400">{turnover.involuntaryTurnoverRate}%</strong></span>
                </div>
                <div className="flex items-end gap-1 h-40">
                  {(turnover.monthlyTurnoverRates || []).map((item) => (
                    <div key={item.month} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${(item.rate / 2) * 100}%`,
                          backgroundColor: '#ef4444',
                          minHeight: '4px',
                        }}
                      />
                      <span className="text-[10px] text-gray-500 mt-1">{item.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Distribution */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Department Distribution</h3>
                <div className="space-y-3">
                  {deptDistribution.map((dept) => (
                    <div key={dept.department}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{dept.department}</span>
                        <span className="text-gray-400">{dept.count} ({dept.percentage}%)</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(dept.count / maxDeptCount) * 100}%`,
                            backgroundColor: '#8b5cf6',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tenure Distribution */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-1">Tenure Distribution</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Average: <strong className="text-violet-400">{tenure.averageTenureYears} years</strong> |
                  Median: <strong className="text-violet-400">{tenure.medianTenureYears} years</strong>
                </p>
                <div className="flex items-end gap-2 h-40">
                  {(tenure.tenureBands || []).map((band) => (
                    <div key={band.band} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-gray-400 mb-1">{band.count}</span>
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${(band.count / maxTenureCount) * 100}%`,
                          backgroundColor: '#06b6d4',
                          minHeight: '4px',
                        }}
                      />
                      <span className="text-[10px] text-gray-500 mt-1 text-center leading-tight">{band.band}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employment Types */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Employment Types</h3>
                <div className="space-y-3">
                  {((metrics.employmentTypes || []) as { type: string; count: number; percentage: number }[]).map((et) => {
                    const colors: Record<string, string> = {
                      'Full-Time': '#10b981',
                      'Part-Time': '#f59e0b',
                      'Contract': '#6366f1',
                      'Intern': '#06b6d4',
                    };
                    return (
                      <div key={et.type}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">{et.type}</span>
                          <span className="text-gray-400">{et.count} ({et.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{
                              width: `${et.percentage}%`,
                              backgroundColor: colors[et.type] || '#8b5cf6',
                            }}
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
