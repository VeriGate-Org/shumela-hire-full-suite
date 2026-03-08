'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';

interface ComplianceSummary {
  overallComplianceScore: number;
  expiringCertifications: number;
  expiredCertifications: number;
  openDisciplinaryCases: number;
  pendingPolicyAcknowledgements: number;
  overdueTraining: number;
  popiaComplianceRate: number;
}

interface ExpiringCert {
  employeeName: string;
  department: string;
  certification: string;
  expiryDate: string;
  daysUntilExpiry: number;
}

interface OpenCase {
  caseId: string;
  type: string;
  status: string;
  department: string;
  openedDate: string;
}

interface PendingAck {
  policyName: string;
  totalEmployees: number;
  acknowledged: number;
  pending: number;
  deadline: string;
}

interface ComplianceTrend {
  month: string;
  complianceScore: number;
  openCases: number;
  expiringCerts: number;
}

interface DeptCompliance {
  department: string;
  score: number;
  issues: number;
}

export default function ComplianceAnalyticsPage() {
  const [metrics, setMetrics] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await hrAnalyticsService.getComplianceAnalytics();
      setMetrics(data);
    } catch {
      toast('Failed to load compliance analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  const summary = (metrics.summary || {}) as ComplianceSummary;
  const expiringCerts = (metrics.expiringCertifications || []) as ExpiringCert[];
  const openCases = (metrics.openCases || []) as OpenCase[];
  const pendingAcks = (metrics.pendingAcknowledgements || []) as PendingAck[];
  const trends = (metrics.complianceTrends || []) as ComplianceTrend[];
  const deptCompliance = (metrics.departmentCompliance || []) as DeptCompliance[];

  return (
    <FeatureGate feature="ADVANCED_ANALYTICS">
      <PageWrapper title="Compliance Analytics" subtitle="Regulatory compliance, certifications, and policy adherence">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: 'Compliance Score', value: `${summary.overallComplianceScore}%`, color: summary.overallComplianceScore >= 90 ? '#10b981' : '#f59e0b' },
                { label: 'Expiring Certs', value: summary.expiringCertifications, color: '#f59e0b' },
                { label: 'Expired Certs', value: summary.expiredCertifications, color: '#ef4444' },
                { label: 'Open Cases', value: summary.openDisciplinaryCases, color: '#ec4899' },
                { label: 'Pending Acks', value: summary.pendingPolicyAcknowledgements, color: '#6366f1' },
                { label: 'Overdue Training', value: summary.overdueTraining, color: '#f97316' },
                { label: 'POPIA Rate', value: `${summary.popiaComplianceRate}%`, color: '#06b6d4' },
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
              {/* Expiring Certifications */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Expiring Certifications (90 Days)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 font-medium">Employee</th>
                        <th className="text-left py-2 font-medium">Certification</th>
                        <th className="text-right py-2 font-medium">Days Left</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringCerts.map((cert) => (
                        <tr key={`${cert.employeeName}-${cert.certification}`} className="border-b border-gray-700/50">
                          <td className="py-2">
                            <div className="text-gray-300">{cert.employeeName}</div>
                            <div className="text-xs text-gray-500">{cert.department}</div>
                          </td>
                          <td className="py-2 text-gray-400">{cert.certification}</td>
                          <td className="py-2 text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                cert.daysUntilExpiry <= 30
                                  ? 'bg-red-900/50 text-red-400'
                                  : cert.daysUntilExpiry <= 60
                                  ? 'bg-amber-900/50 text-amber-400'
                                  : 'bg-green-900/50 text-green-400'
                              }`}
                            >
                              {cert.daysUntilExpiry}d
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Open Disciplinary Cases */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Open Disciplinary Cases</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-700">
                        <th className="text-left py-2 font-medium">Case ID</th>
                        <th className="text-left py-2 font-medium">Type</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-left py-2 font-medium">Dept</th>
                      </tr>
                    </thead>
                    <tbody>
                      {openCases.map((c) => (
                        <tr key={c.caseId} className="border-b border-gray-700/50">
                          <td className="py-2 text-violet-400 font-medium">{c.caseId}</td>
                          <td className="py-2 text-gray-300">{c.type}</td>
                          <td className="py-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-900/50 text-amber-400">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400">{c.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Policy Acknowledgements */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Pending Policy Acknowledgements</h3>
                <div className="space-y-4">
                  {pendingAcks.map((ack) => (
                    <div key={ack.policyName} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-gray-200 font-medium">{ack.policyName}</p>
                          <p className="text-xs text-gray-500">Deadline: {ack.deadline}</p>
                        </div>
                        <span className="text-sm font-medium text-amber-400">{ack.pending} pending</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${(ack.acknowledged / ack.totalEmployees) * 100}%`,
                            backgroundColor: ack.pending <= 5 ? '#10b981' : '#f59e0b',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{ack.acknowledged}/{ack.totalEmployees} acknowledged</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Compliance Scores */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Department Compliance Scores</h3>
                <div className="space-y-3">
                  {deptCompliance.map((dept) => (
                    <div key={dept.department}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{dept.department}</span>
                        <span className="text-gray-400">{dept.score}% | {dept.issues} issues</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${dept.score}%`,
                            backgroundColor: dept.score >= 95 ? '#10b981' : dept.score >= 90 ? '#06b6d4' : dept.score >= 85 ? '#f59e0b' : '#ef4444',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Compliance Trends */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Compliance Trends</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 font-medium">Month</th>
                      <th className="text-right py-2 font-medium">Score</th>
                      <th className="text-right py-2 font-medium">Open Cases</th>
                      <th className="text-right py-2 font-medium">Expiring Certs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((t) => (
                      <tr key={t.month} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-300">{t.month}</td>
                        <td className="py-2 text-right">
                          <span className={t.complianceScore >= 90 ? 'text-green-400' : 'text-amber-400'}>
                            {t.complianceScore}%
                          </span>
                        </td>
                        <td className="py-2 text-right text-pink-400">{t.openCases}</td>
                        <td className="py-2 text-right text-amber-400">{t.expiringCerts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
