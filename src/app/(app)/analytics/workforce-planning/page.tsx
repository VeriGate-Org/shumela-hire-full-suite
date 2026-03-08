'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { hrAnalyticsService } from '@/services/hrAnalyticsService';
import { useToast } from '@/components/Toast';

interface AttritionRisk {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  riskScore: number;
  riskLevel: string;
  factors: string;
  calculatedAt: string;
}

interface SuccessionPlan {
  id: number;
  positionTitle: string;
  department: string;
  currentHolderId: number | null;
  currentHolderName: string | null;
  successorId: number | null;
  successorName: string | null;
  readinessLevel: string;
  developmentActions: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function WorkforcePlanningPage() {
  const [riskScores, setRiskScores] = useState<AttritionRisk[]>([]);
  const [successionPlans, setSuccessionPlans] = useState<SuccessionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'risk' | 'succession'>('risk');
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    positionTitle: '',
    department: '',
    readinessLevel: 'DEVELOPMENT_NEEDED',
    developmentActions: '',
    status: 'DRAFT',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [risks, plans] = await Promise.all([
        hrAnalyticsService.getAttritionRisk(),
        hrAnalyticsService.getSuccessionPlans(),
      ]);
      setRiskScores(risks as unknown as AttritionRisk[]);
      setSuccessionPlans(plans as unknown as SuccessionPlan[]);
    } catch {
      toast('Failed to load workforce planning data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRisk = async () => {
    setCalculating(true);
    try {
      await hrAnalyticsService.calculateAttritionRisk();
      toast('Attrition risk scores recalculated', 'success');
      const risks = await hrAnalyticsService.getAttritionRisk();
      setRiskScores(risks as unknown as AttritionRisk[]);
    } catch {
      toast('Failed to calculate attrition risk', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleCreatePlan = async () => {
    try {
      await hrAnalyticsService.createSuccessionPlan(newPlan);
      toast('Succession plan created', 'success');
      setShowCreatePlan(false);
      setNewPlan({ positionTitle: '', department: '', readinessLevel: 'DEVELOPMENT_NEEDED', developmentActions: '', status: 'DRAFT' });
      const plans = await hrAnalyticsService.getSuccessionPlans();
      setSuccessionPlans(plans as unknown as SuccessionPlan[]);
    } catch {
      toast('Failed to create succession plan', 'error');
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getReadinessLabel = (level: string) => {
    switch (level) {
      case 'READY_NOW': return 'Ready Now';
      case 'READY_1_YEAR': return 'Ready in 1 Year';
      case 'READY_2_YEARS': return 'Ready in 2 Years';
      case 'DEVELOPMENT_NEEDED': return 'Development Needed';
      default: return level;
    }
  };

  const getReadinessColor = (level: string) => {
    switch (level) {
      case 'READY_NOW': return '#10b981';
      case 'READY_1_YEAR': return '#06b6d4';
      case 'READY_2_YEARS': return '#f59e0b';
      case 'DEVELOPMENT_NEEDED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Risk distribution summary
  const riskDistribution = {
    CRITICAL: riskScores.filter((r) => r.riskLevel === 'CRITICAL').length,
    HIGH: riskScores.filter((r) => r.riskLevel === 'HIGH').length,
    MEDIUM: riskScores.filter((r) => r.riskLevel === 'MEDIUM').length,
    LOW: riskScores.filter((r) => r.riskLevel === 'LOW').length,
  };

  return (
    <FeatureGate feature="PREDICTIVE_ANALYTICS">
      <PageWrapper title="Workforce Planning" subtitle="Attrition risk analysis and succession planning">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tab Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('risk')}
                className={`px-5 py-2 rounded-full text-sm font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'risk'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                }`}
              >
                Attrition Risk
              </button>
              <button
                onClick={() => setActiveTab('succession')}
                className={`px-5 py-2 rounded-full text-sm font-medium uppercase tracking-wider transition-colors ${
                  activeTab === 'succession'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:text-white'
                }`}
              >
                Succession Plans
              </button>
            </div>

            {activeTab === 'risk' && (
              <>
                {/* Risk Distribution Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Critical', count: riskDistribution.CRITICAL, color: '#ef4444' },
                    { label: 'High', count: riskDistribution.HIGH, color: '#f97316' },
                    { label: 'Medium', count: riskDistribution.MEDIUM, color: '#f59e0b' },
                    { label: 'Low', count: riskDistribution.LOW, color: '#10b981' },
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-800 rounded-xl p-5 border border-gray-700">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label} Risk</p>
                      <p className="text-3xl font-bold mt-2" style={{ color: item.color }}>
                        {item.count}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recalculate Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleCalculateRisk}
                    disabled={calculating}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 disabled:opacity-50 uppercase tracking-wider transition-colors"
                  >
                    {calculating ? 'Calculating...' : 'Recalculate Risk Scores'}
                  </button>
                </div>

                {/* Risk Scores Table */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Employee Attrition Risk Scores</h3>
                  {riskScores.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No risk scores calculated yet. Click &quot;Recalculate Risk Scores&quot; to generate.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="text-left py-2 font-medium">Employee</th>
                            <th className="text-left py-2 font-medium">Department</th>
                            <th className="text-center py-2 font-medium">Risk Score</th>
                            <th className="text-center py-2 font-medium">Risk Level</th>
                            <th className="text-left py-2 font-medium">Contributing Factors</th>
                            <th className="text-right py-2 font-medium">Calculated</th>
                          </tr>
                        </thead>
                        <tbody>
                          {riskScores.map((score) => (
                            <tr key={score.id} className="border-b border-gray-700/50">
                              <td className="py-2 text-gray-300 font-medium">{score.employeeName}</td>
                              <td className="py-2 text-gray-400">{score.department || '-'}</td>
                              <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 bg-gray-700 rounded-full h-2">
                                    <div
                                      className="h-2 rounded-full"
                                      style={{
                                        width: `${score.riskScore * 100}%`,
                                        backgroundColor: getRiskColor(score.riskLevel),
                                      }}
                                    />
                                  </div>
                                  <span className="text-gray-300 text-xs">{(score.riskScore * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="py-2 text-center">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${getRiskColor(score.riskLevel)}20`,
                                    color: getRiskColor(score.riskLevel),
                                  }}
                                >
                                  {score.riskLevel}
                                </span>
                              </td>
                              <td className="py-2 text-gray-400 text-xs max-w-xs truncate">{score.factors || '-'}</td>
                              <td className="py-2 text-right text-gray-500 text-xs">
                                {score.calculatedAt ? new Date(score.calculatedAt).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'succession' && (
              <>
                {/* Create Plan Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowCreatePlan(!showCreatePlan)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 uppercase tracking-wider transition-colors"
                  >
                    {showCreatePlan ? 'Cancel' : 'Create Succession Plan'}
                  </button>
                </div>

                {/* Create Plan Form */}
                {showCreatePlan && (
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4">New Succession Plan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Position Title</label>
                        <input
                          type="text"
                          value={newPlan.positionTitle}
                          onChange={(e) => setNewPlan({ ...newPlan, positionTitle: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                          placeholder="e.g. VP of Engineering"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Department</label>
                        <input
                          type="text"
                          value={newPlan.department}
                          onChange={(e) => setNewPlan({ ...newPlan, department: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                          placeholder="e.g. Engineering"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Readiness Level</label>
                        <select
                          value={newPlan.readinessLevel}
                          onChange={(e) => setNewPlan({ ...newPlan, readinessLevel: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                        >
                          <option value="READY_NOW">Ready Now</option>
                          <option value="READY_1_YEAR">Ready in 1 Year</option>
                          <option value="READY_2_YEARS">Ready in 2 Years</option>
                          <option value="DEVELOPMENT_NEEDED">Development Needed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-1">Status</label>
                        <select
                          value={newPlan.status}
                          onChange={(e) => setNewPlan({ ...newPlan, status: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="ACTIVE">Active</option>
                          <option value="COMPLETED">Completed</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-400 mb-1">Development Actions</label>
                        <textarea
                          value={newPlan.developmentActions}
                          onChange={(e) => setNewPlan({ ...newPlan, developmentActions: e.target.value })}
                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
                          rows={3}
                          placeholder="Describe development actions required..."
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleCreatePlan}
                        disabled={!newPlan.positionTitle}
                        className="px-4 py-2 text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 uppercase tracking-wider transition-colors"
                      >
                        Save Plan
                      </button>
                    </div>
                  </div>
                )}

                {/* Succession Plans Table */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Succession Plans</h3>
                  {successionPlans.length === 0 ? (
                    <p className="text-gray-400 text-center py-8">
                      No succession plans created yet. Click &quot;Create Succession Plan&quot; to get started.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-400 border-b border-gray-700">
                            <th className="text-left py-2 font-medium">Position</th>
                            <th className="text-left py-2 font-medium">Department</th>
                            <th className="text-left py-2 font-medium">Current Holder</th>
                            <th className="text-left py-2 font-medium">Successor</th>
                            <th className="text-center py-2 font-medium">Readiness</th>
                            <th className="text-center py-2 font-medium">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {successionPlans.map((plan) => (
                            <tr key={plan.id} className="border-b border-gray-700/50">
                              <td className="py-2 text-gray-300 font-medium">{plan.positionTitle}</td>
                              <td className="py-2 text-gray-400">{plan.department || '-'}</td>
                              <td className="py-2 text-gray-300">{plan.currentHolderName || '-'}</td>
                              <td className="py-2 text-gray-300">{plan.successorName || '-'}</td>
                              <td className="py-2 text-center">
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: `${getReadinessColor(plan.readinessLevel)}20`,
                                    color: getReadinessColor(plan.readinessLevel),
                                  }}
                                >
                                  {getReadinessLabel(plan.readinessLevel)}
                                </span>
                              </td>
                              <td className="py-2 text-center">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    plan.status === 'ACTIVE'
                                      ? 'bg-green-900/50 text-green-400'
                                      : plan.status === 'COMPLETED'
                                      ? 'bg-blue-900/50 text-blue-400'
                                      : 'bg-gray-700 text-gray-400'
                                  }`}
                                >
                                  {plan.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
