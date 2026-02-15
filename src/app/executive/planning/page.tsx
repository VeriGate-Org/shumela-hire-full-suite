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

    // Mock strategic goals
    const mockGoals: StrategicGoal[] = [
      {
        id: 'goal_001',
        title: 'Scale Engineering Team by 40%',
        description: 'Expand our engineering capabilities to support new product initiatives and improve development velocity',
        category: 'growth',
        priority: 'critical',
        status: 'on_track',
        progress: 65,
        startDate: '2025-01-01T00:00:00Z',
        targetDate: '2025-06-30T23:59:59Z',
        owner: 'Sarah Martinez',
        department: 'Engineering',
        budget: 2500000,
        actualSpend: 1450000,
        kpis: [
          { name: 'Team Size', current: 45, target: 63, unit: 'people' },
          { name: 'Time to Fill', current: 32, target: 25, unit: 'days' },
          { name: 'Quality Score', current: 8.2, target: 8.5, unit: 'rating' }
        ],
        milestones: [
          {
            id: 'milestone_001',
            title: 'Q1 Hiring Goals',
            date: '2025-03-31T00:00:00Z',
            status: 'completed',
            description: 'Hire 8 senior engineers and 4 mid-level developers'
          },
          {
            id: 'milestone_002',
            title: 'Q2 Team Expansion',
            date: '2025-06-30T00:00:00Z',
            status: 'pending',
            description: 'Complete remaining hires and team integration'
          }
        ],
        risks: [
          {
            id: 'risk_001',
            description: 'Competitive market for senior engineers',
            impact: 'high',
            probability: 'high',
            mitigation: 'Increase compensation packages and improve employer branding'
          }
        ]
      },
      {
        id: 'goal_002',
        title: 'Implement AI-Driven Recruitment',
        description: 'Deploy advanced AI tools to improve candidate sourcing, screening, and matching processes',
        category: 'innovation',
        priority: 'high',
        status: 'at_risk',
        progress: 35,
        startDate: '2025-02-01T00:00:00Z',
        targetDate: '2025-08-31T23:59:59Z',
        owner: 'Michael Chen',
        department: 'HR Technology',
        budget: 800000,
        actualSpend: 320000,
        kpis: [
          { name: 'Screening Efficiency', current: 15, target: 40, unit: '%' },
          { name: 'Match Accuracy', current: 72, target: 85, unit: '%' },
          { name: 'ROI', current: 0, target: 25, unit: '%' }
        ],
        milestones: [
          {
            id: 'milestone_003',
            title: 'AI Platform Selection',
            date: '2025-03-15T00:00:00Z',
            status: 'completed',
            description: 'Evaluate and select AI recruitment platform'
          },
          {
            id: 'milestone_004',
            title: 'Pilot Implementation',
            date: '2025-05-31T00:00:00Z',
            status: 'overdue',
            description: 'Deploy pilot program in Engineering department'
          }
        ],
        risks: [
          {
            id: 'risk_002',
            description: 'Integration complexity with existing systems',
            impact: 'medium',
            probability: 'high',
            mitigation: 'Engage dedicated integration team and extend timeline if needed'
          }
        ]
      },
      {
        id: 'goal_003',
        title: 'Global Talent Hub Expansion',
        description: 'Establish recruitment presence in 3 new international markets to access diverse talent pools',
        category: 'growth',
        priority: 'high',
        status: 'on_track',
        progress: 50,
        startDate: '2025-01-15T00:00:00Z',
        targetDate: '2025-12-31T23:59:59Z',
        owner: 'Lisa Rodriguez',
        department: 'Global HR',
        budget: 1200000,
        actualSpend: 580000,
        kpis: [
          { name: 'Markets Active', current: 1, target: 3, unit: 'locations' },
          { name: 'International Hires', current: 12, target: 50, unit: 'people' },
          { name: 'Cost per Hire', current: 8500, target: 7000, unit: 'ZAR' }
        ],
        milestones: [
          {
            id: 'milestone_005',
            title: 'European Hub Launch',
            date: '2025-04-30T00:00:00Z',
            status: 'completed',
            description: 'Establish recruitment operations in Berlin'
          },
          {
            id: 'milestone_006',
            title: 'APAC Hub Launch',
            date: '2025-08-31T00:00:00Z',
            status: 'pending',
            description: 'Launch recruitment center in Singapore'
          }
        ],
        risks: [
          {
            id: 'risk_003',
            description: 'Regulatory compliance in new markets',
            impact: 'high',
            probability: 'medium',
            mitigation: 'Engage local legal counsel and compliance experts'
          }
        ]
      },
      {
        id: 'goal_004',
        title: 'Diversity & Inclusion Enhancement',
        description: 'Achieve 40% diverse representation across all leadership positions by end of year',
        category: 'culture',
        priority: 'critical',
        status: 'on_track',
        progress: 72,
        startDate: '2025-01-01T00:00:00Z',
        targetDate: '2025-12-31T23:59:59Z',
        owner: 'David Park',
        department: 'Diversity & Inclusion',
        budget: 500000,
        actualSpend: 285000,
        kpis: [
          { name: 'Leadership Diversity', current: 28, target: 40, unit: '%' },
          { name: 'Pipeline Diversity', current: 45, target: 50, unit: '%' },
          { name: 'Retention Rate', current: 87, target: 90, unit: '%' }
        ],
        milestones: [
          {
            id: 'milestone_007',
            title: 'Bias Training Completion',
            date: '2025-03-31T00:00:00Z',
            status: 'completed',
            description: 'Complete unconscious bias training for all hiring managers'
          },
          {
            id: 'milestone_008',
            title: 'Partnership Program',
            date: '2025-06-30T00:00:00Z',
            status: 'pending',
            description: 'Launch partnerships with diversity-focused organizations'
          }
        ],
        risks: [
          {
            id: 'risk_004',
            description: 'Limited diverse talent pool in certain roles',
            impact: 'medium',
            probability: 'medium',
            mitigation: 'Expand sourcing channels and partner with specialized recruiters'
          }
        ]
      },
      {
        id: 'goal_005',
        title: 'Recruitment Cost Optimization',
        description: 'Reduce overall cost-per-hire by 25% while maintaining quality standards',
        category: 'efficiency',
        priority: 'medium',
        status: 'delayed',
        progress: 20,
        startDate: '2025-01-01T00:00:00Z',
        targetDate: '2025-09-30T23:59:59Z',
        owner: 'Jennifer Liu',
        department: 'Finance & Operations',
        budget: 300000,
        actualSpend: 180000,
        kpis: [
          { name: 'Cost per Hire', current: 12500, target: 9375, unit: 'ZAR' },
          { name: 'Quality Score', current: 8.1, target: 8.0, unit: 'rating' },
          { name: 'Process Efficiency', current: 10, target: 30, unit: '%' }
        ],
        milestones: [
          {
            id: 'milestone_009',
            title: 'Process Automation',
            date: '2025-04-30T00:00:00Z',
            status: 'overdue',
            description: 'Implement automated screening and scheduling tools'
          },
          {
            id: 'milestone_010',
            title: 'Vendor Renegotiation',
            date: '2025-07-31T00:00:00Z',
            status: 'pending',
            description: 'Renegotiate contracts with recruitment agencies'
          }
        ],
        risks: [
          {
            id: 'risk_005',
            description: 'Quality degradation due to cost cutting',
            impact: 'high',
            probability: 'medium',
            mitigation: 'Implement robust quality metrics and monitoring'
          }
        ]
      }
    ];

    // Mock market insights
    const mockInsights: MarketInsight[] = [
      {
        id: 'insight_001',
        title: 'Software Engineer Salaries Rising 15% YoY',
        category: 'compensation',
        summary: 'Market data shows significant salary inflation in tech roles, particularly for senior positions.',
        impact: 'negative',
        urgency: 'immediate',
        source: 'Industry Salary Survey 2025',
        date: '2025-01-20T00:00:00Z',
        recommendations: [
          'Review and adjust compensation bands for tech roles',
          'Consider alternative compensation strategies (equity, benefits)',
          'Expedite hiring decisions to avoid further inflation'
        ]
      },
      {
        id: 'insight_002',
        title: 'Remote Work Preferences Stabilizing',
        category: 'talent_market',
        summary: 'After post-pandemic volatility, remote work preferences are stabilizing with hybrid models gaining popularity.',
        impact: 'positive',
        urgency: 'short_term',
        source: 'Future of Work Research Institute',
        date: '2025-01-18T00:00:00Z',
        recommendations: [
          'Optimize hybrid work policies to attract top talent',
          'Invest in collaboration tools and remote onboarding',
          'Consider office locations and amenities strategically'
        ]
      },
      {
        id: 'insight_003',
        title: 'AI Skills Gap Widening in Market',
        category: 'industry_trends',
        summary: 'Demand for AI/ML expertise continues to outpace supply, creating competitive recruitment landscape.',
        impact: 'negative',
        urgency: 'immediate',
        source: 'Tech Talent Analytics Q1 2025',
        date: '2025-01-15T00:00:00Z',
        recommendations: [
          'Develop internal AI training programs',
          'Partner with universities for early talent pipeline',
          'Consider acquisition or partnership strategies'
        ]
      }
    ];

    // Mock capacity plans
    const mockCapacityPlans: CapacityPlan[] = [
      {
        department: 'Engineering',
        currentHeadcount: 45,
        targetHeadcount: 63,
        openPositions: 12,
        budgetAllocated: 2500000,
        budgetUsed: 1450000,
        projectedHiringCost: 950000,
        averageTimeToFill: 32,
        retentionRate: 94,
        skillGaps: ['Machine Learning', 'DevOps', 'Frontend (React)']
      },
      {
        department: 'Product',
        currentHeadcount: 18,
        targetHeadcount: 25,
        openPositions: 5,
        budgetAllocated: 1200000,
        budgetUsed: 720000,
        projectedHiringCost: 420000,
        averageTimeToFill: 28,
        retentionRate: 89,
        skillGaps: ['Data Analytics', 'UX Research', 'Product Strategy']
      },
      {
        department: 'Sales',
        currentHeadcount: 32,
        targetHeadcount: 42,
        openPositions: 8,
        budgetAllocated: 800000,
        budgetUsed: 480000,
        projectedHiringCost: 280000,
        averageTimeToFill: 24,
        retentionRate: 85,
        skillGaps: ['Enterprise Sales', 'Technical Sales', 'Customer Success']
      },
      {
        department: 'Marketing',
        currentHeadcount: 15,
        targetHeadcount: 20,
        openPositions: 3,
        budgetAllocated: 450000,
        budgetUsed: 270000,
        projectedHiringCost: 165000,
        averageTimeToFill: 26,
        retentionRate: 92,
        skillGaps: ['Digital Marketing', 'Content Strategy', 'Marketing Automation']
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setGoals(mockGoals);
      setInsights(mockInsights);
      setCapacityPlans(mockCapacityPlans);
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800 border-green-300';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300';
      case 'completed': return 'bg-violet-100 text-violet-800 border-violet-300';
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
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
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
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
      >
        <option value="all">All Status</option>
        <option value="on_track">On Track</option>
        <option value="at_risk">At Risk</option>
        <option value="delayed">Delayed</option>
        <option value="completed">Completed</option>
      </select>
      
      <button className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        New Strategic Goal
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Strategic Planning" subtitle="Loading strategic insights..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
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
        <div className="bg-white rounded-lg shadow p-4">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-violet-100 text-violet-700'
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
              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow">
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
                          className="bg-violet-600 h-2 rounded-full transition-all" 
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
            <div className="bg-white rounded-lg shadow">
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
                <div key={goal.id} className="bg-white rounded-lg shadow border-l-4 border-l-violet-500">
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
                          className="bg-violet-600 h-2 rounded-full transition-all" 
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
                        className="flex items-center px-3 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100"
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
              <div key={insight.id} className="bg-white rounded-lg shadow">
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
                <div key={plan.department} className="bg-white rounded-lg shadow">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{plan.department}</h3>
                      <BuildingOfficeIcon className="w-6 h-6 text-gray-400" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 bg-violet-50 rounded-lg">
                        <p className="text-2xl font-bold text-violet-600">{plan.currentHeadcount}</p>
                        <p className="text-sm text-gray-600">Current</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
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
          <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-gray-900">{kpi.name}</span>
                              <span className="text-sm text-gray-500">{kpi.unit}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-violet-600">{kpi.current}</span>
                              <span className="text-sm text-gray-500">Target: {kpi.target}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                              <div 
                                className="bg-violet-600 h-1 rounded-full" 
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
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                          <div key={risk.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
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
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
