'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  DocumentTextIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  ClockIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
  StarIcon,
  LightBulbIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  ChartBarIcon as ChartBarIconSolid,
  StarIcon as StarIconSolid 
} from '@heroicons/react/24/solid';

interface StrategicGoal {
  id: string;
  title: string;
  description: string;
  category: 'growth' | 'efficiency' | 'innovation' | 'culture' | 'financial';
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
  progress: number;
  startDate: string;
  targetDate: string;
  owner: string;
  department: string;
  budget: number;
  actualSpend: number;
  kpis: Array<{
    name: string;
    current: number;
    target: number;
    unit: string;
  }>;
  milestones: Array<{
    id: string;
    title: string;
    date: string;
    status: 'completed' | 'pending' | 'overdue';
    description: string;
  }>;
  risks: Array<{
    id: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    probability: 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
}

interface MarketInsight {
  id: string;
  title: string;
  category: 'talent_market' | 'compensation' | 'industry_trends' | 'competitor_analysis';
  summary: string;
  impact: 'positive' | 'negative' | 'neutral';
  urgency: 'immediate' | 'short_term' | 'long_term';
  source: string;
  date: string;
  recommendations: string[];
}

interface CapacityPlan {
  department: string;
  currentHeadcount: number;
  targetHeadcount: number;
  openPositions: number;
  budgetAllocated: number;
  budgetUsed: number;
  projectedHiringCost: number;
  averageTimeToFill: number;
  retentionRate: number;
  skillGaps: string[];
}

export default function StrategicPlanningPage() {
  const [goals, setGoals] = useState<StrategicGoal[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [capacityPlans, setCapacityPlans] = useState<CapacityPlan[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<StrategicGoal | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'goals' | 'insights' | 'capacity' | 'forecasting'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStrategicData();
  }, []);

  const loadStrategicData = async () => {
    setLoading(true);
    // TODO: Replace with actual API calls
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800 border-green-300';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300';
      case 'completed': return 'bg-gold-100 text-gold-800 border-violet-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'growth': return <ArrowTrendingUpIcon className="w-5 h-5" />;
      case 'efficiency': return <ChartBarIcon className="w-5 h-5" />;
      case 'innovation': return <LightBulbIcon className="w-5 h-5" />;
      case 'culture': return <UserGroupIcon className="w-5 h-5" />;
      case 'financial': return <CurrencyDollarIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      case 'neutral': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const filteredGoals = goals.filter(goal => {
    const matchesCategory = filterCategory === 'all' || goal.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || goal.status === filterStatus;
    return matchesCategory && matchesStatus;
  });

  const actions = (
    <div className="flex items-center gap-3">
      <select
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="all">All Categories</option>
        <option value="growth">Growth</option>
        <option value="efficiency">Efficiency</option>
        <option value="innovation">Innovation</option>
        <option value="culture">Culture</option>
        <option value="financial">Financial</option>
      </select>
      
      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="all">All Status</option>
        <option value="on_track">On Track</option>
        <option value="at_risk">At Risk</option>
        <option value="delayed">Delayed</option>
        <option value="completed">Completed</option>
      </select>
      
      <button className="flex items-center px-4 py-2 bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        New Strategic Goal
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Strategic Planning" subtitle="Loading strategic insights..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Strategic Planning"
      subtitle="Executive oversight of organizational hiring strategy and long-term planning"
      actions={actions}
    >
      <div className="space-y-6">
        {/* View Navigation */}
        <div className="bg-white rounded-sm shadow p-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Executive Overview', icon: ChartBarIcon },
              { id: 'goals', name: 'Strategic Goals', icon: StarIcon },
              { id: 'insights', name: 'Market Insights', icon: LightBulbIcon },
              { id: 'capacity', name: 'Capacity Planning', icon: UserGroupIcon },
              { id: 'forecasting', name: 'Workforce Forecasting', icon: ArrowTrendingUpIcon }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-gold-100 text-violet-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Executive Overview */}
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Goals On Track</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {goals.filter(g => g.status === 'on_track').length}/{goals.length}
                    </p>
                    <p className="text-xs text-green-600">
                      {Math.round((goals.filter(g => g.status === 'on_track').length / goals.length) * 100)}% success rate
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-8 h-8 text-violet-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Investment</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      R{goals.reduce((sum, g) => sum + g.budget, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      R{goals.reduce((sum, g) => sum + g.actualSpend, 0).toLocaleString()} spent
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <UserGroupIcon className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Planned Headcount</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {capacityPlans.reduce((sum, p) => sum + p.targetHeadcount, 0)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {capacityPlans.reduce((sum, p) => sum + p.currentHeadcount, 0)} current
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">At Risk Goals</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {goals.filter(g => g.status === 'at_risk' || g.status === 'delayed').length}
                    </p>
                    <p className="text-xs text-orange-600">Require attention</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Goals Progress */}
            <div className="bg-white rounded-sm shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Strategic Goals Progress</h3>
              </div>
              <div className="p-6 space-y-4">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{goal.title}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(goal.status)}`}>
                          {goal.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gold-500 h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{goal.progress}% complete</span>
                        <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Market Insights */}
            <div className="bg-white rounded-sm shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Market Insights</h3>
              </div>
              <div className="p-6 space-y-4">
                {insights.slice(0, 3).map((insight) => (
                  <div key={insight.id} className="border-l-4 border-violet-400 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{insight.summary}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{insight.source}</span>
                          <span>{new Date(insight.date).toLocaleDateString()}</span>
                          <span className={`font-medium ${getImpactColor(insight.impact)}`}>
                            {insight.impact.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Strategic Goals View */}
        {activeView === 'goals' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-sm shadow border-l-4 border-l-violet-500">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        {getCategoryIcon(goal.category)}
                        <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(goal.status)}`}>
                          {goal.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(goal.priority)}`}>
                          {goal.priority.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{goal.description}</p>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gold-500 h-2 rounded-full transition-all"
                          style={{ width: `${goal.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-gray-500">Owner:</span>
                        <p className="font-medium">{goal.owner}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Department:</span>
                        <p className="font-medium">{goal.department}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Budget:</span>
                        <p className="font-medium">R{goal.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Spent:</span>
                        <p className="font-medium">R{goal.actualSpend.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Target: {new Date(goal.targetDate).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => setSelectedGoal(goal)}
                        className="flex items-center px-3 py-1 text-xs font-medium text-gold-600 bg-gold-50 rounded-full hover:bg-gold-100"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market Insights View */}
        {activeView === 'insights' && (
          <div className="space-y-6">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-sm shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.summary}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        insight.impact === 'positive' ? 'bg-green-100 text-green-800' :
                        insight.impact === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {insight.impact.toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        insight.urgency === 'immediate' ? 'bg-red-100 text-red-800' :
                        insight.urgency === 'short_term' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {insight.urgency.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                    <ul className="space-y-1">
                      {insight.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-500 pt-4 border-t border-gray-200">
                    <span>Source: {insight.source}</span>
                    <span>{new Date(insight.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Capacity Planning View */}
        {activeView === 'capacity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {capacityPlans.map((plan) => (
                <div key={plan.department} className="bg-white rounded-sm shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.department}</h3>
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 bg-gold-50 rounded-sm">
                        <p className="text-2xl font-bold text-gold-600">{plan.currentHeadcount}</p>
                        <p className="text-sm text-gray-600">Current</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-sm">
                        <p className="text-2xl font-bold text-green-600">{plan.targetHeadcount}</p>
                        <p className="text-sm text-gray-600">Target</p>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Open Positions:</span>
                        <span className="font-medium">{plan.openPositions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Budget Utilization:</span>
                        <span className="font-medium">
                          {Math.round((plan.budgetUsed / plan.budgetAllocated) * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Avg. Time to Fill:</span>
                        <span className="font-medium">{plan.averageTimeToFill} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Retention Rate:</span>
                        <span className="font-medium">{plan.retentionRate}%</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Key Skill Gaps</h4>
                      <div className="flex flex-wrap gap-2">
                        {plan.skillGaps.map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workforce Forecasting View */}
        {activeView === 'forecasting' && (
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Workforce Forecasting Dashboard</h3>
            <div className="text-center py-12">
              <ChartBarIconSolid className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h4>
              <p className="text-gray-600">
                Comprehensive workforce forecasting with predictive analytics and scenario modeling will be available in the next release.
              </p>
            </div>
          </div>
        )}

        {/* Goal Details Modal */}
        {selectedGoal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedGoal.title}</h2>
                    <p className="text-gray-600 mt-1">{selectedGoal.description}</p>
                  </div>
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Performance Indicators</h3>
                      <div className="space-y-3">
                        {selectedGoal.kpis.map((kpi, index) => (
                          <div key={index} className="bg-gray-50 rounded-sm p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">{kpi.name}</span>
                              <span className="text-sm text-gray-500">{kpi.unit}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-gold-600">{kpi.current}</span>
                              <span className="text-sm text-gray-500">Target: {kpi.target}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                              <div 
                                className="bg-gold-500 h-1 rounded-full"
                                style={{ width: `${Math.min((kpi.current / kpi.target) * 100, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Milestones</h3>
                      <div className="space-y-3">
                        {selectedGoal.milestones.map((milestone) => (
                          <div key={milestone.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                milestone.status === 'completed' ? 'bg-green-100' :
                                milestone.status === 'overdue' ? 'bg-red-100' : 'bg-gray-100'
                              }`}>
                                {milestone.status === 'completed' ? (
                                  <CheckCircleIcon className="w-4 h-4 text-green-600" />
                                ) : milestone.status === 'overdue' ? (
                                  <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                                ) : (
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(milestone.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Goal Details</h3>
                      <div className="bg-gray-50 rounded-sm p-4 space-y-3">
                        <div className="flex justify-between">
                          <span className="font-medium">Owner:</span>
                          <span>{selectedGoal.owner}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Department:</span>
                          <span>{selectedGoal.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Start Date:</span>
                          <span>{new Date(selectedGoal.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Target Date:</span>
                          <span>{new Date(selectedGoal.targetDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Budget:</span>
                          <span>R{selectedGoal.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Spent:</span>
                          <span>R{selectedGoal.actualSpend.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk Assessment</h3>
                      <div className="space-y-3">
                        {selectedGoal.risks.map((risk) => (
                          <div key={risk.id} className="bg-red-50 border border-red-200 rounded-sm p-4">
                            <p className="font-medium text-red-800 mb-2">{risk.description}</p>
                            <div className="flex justify-between text-sm mb-2">
                              <span>Impact: <span className="font-medium">{risk.impact}</span></span>
                              <span>Probability: <span className="font-medium">{risk.probability}</span></span>
                            </div>
                            <p className="text-sm text-red-700">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedGoal(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
