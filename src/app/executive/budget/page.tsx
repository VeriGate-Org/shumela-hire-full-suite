'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { formatCurrency } from '@/utils/currency';
import { 
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BanknotesIcon,
  CreditCardIcon,
  ReceiptPercentIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
  XMarkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  XCircleIcon as XCircleIconSolid,
  ClockIcon as ClockIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';

interface BudgetItem {
  id: string;
  category: 'recruitment' | 'compensation' | 'technology' | 'training' | 'operations' | 'benefits';
  subcategory: string;
  description: string;
  department: string;
  allocatedBudget: number;
  spentAmount: number;
  remainingAmount: number;
  projectedSpend: number;
  period: string;
  owner: string;
  status: 'on_track' | 'over_budget' | 'under_utilized' | 'needs_attention';
  variance: number;
  lastUpdated: string;
  approvals: Array<{
    id: string;
    amount: number;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedBy: string;
    requestedDate: string;
  }>;
}

interface ApprovalRequest {
  id: string;
  type: 'budget_increase' | 'new_position' | 'salary_adjustment' | 'vendor_contract' | 'bonus_approval' | 'equipment_purchase';
  title: string;
  description: string;
  amount: number;
  requestedBy: {
    name: string;
    title: string;
    department: string;
    email: string;
  };
  requestedDate: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected' | 'needs_info';
  approvalLevel: 'executive' | 'senior_management' | 'department_head';
  justification: string;
  businessImpact: string;
  alternatives: string[];
  supportingDocuments: string[];
  comments: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: string;
    type: 'comment' | 'question' | 'approval' | 'rejection';
  }>;
  deadline?: string;
  relatedBudgetCategory?: string;
}

interface BudgetAnalytics {
  totalAllocated: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationRate: number;
  projectedOverrun: number;
  costPerHire: number;
  monthlyBurnRate: number;
  forecastAccuracy: number;
}

export default function BudgetApprovalsPage() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'budget' | 'approvals' | 'analytics'>('overview');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    setLoading(true);

    // Mock budget items
    const mockBudgetItems: BudgetItem[] = [
      {
        id: 'budget_001',
        category: 'recruitment',
        subcategory: 'External Recruiting',
        description: 'Third-party recruiting agencies and platforms',
        department: 'Engineering',
        allocatedBudget: 42500000, // R42.5M
        spentAmount: 31450000, // R31.45M
        remainingAmount: 11050000, // R11.05M
        projectedSpend: 46750000, // R46.75M
        period: 'Q1-Q2 2025',
        owner: 'Sarah Martinez',
        status: 'over_budget',
        variance: -4250000, // -R4.25M
        lastUpdated: '2025-01-20T14:30:00Z',
        approvals: [
          {
            id: 'approval_001',
            amount: 2550000, // R2.55M
            description: 'Additional budget for senior engineers',
            status: 'pending',
            requestedBy: 'John Doe',
            requestedDate: '2025-01-19T10:00:00Z'
          }
        ]
      },
      {
        id: 'budget_002',
        category: 'compensation',
        subcategory: 'Salary Adjustments',
        description: 'Market-based salary corrections and promotions',
        department: 'Product',
        allocatedBudget: 30600000, // R30.6M
        spentAmount: 20400000, // R20.4M
        remainingAmount: 10200000, // R10.2M
        projectedSpend: 28050000, // R28.05M
        period: 'Q1-Q2 2025',
        owner: 'Michael Chen',
        status: 'on_track',
        variance: 2550000, // R2.55M
        lastUpdated: '2025-01-18T09:15:00Z',
        approvals: []
      },
      {
        id: 'budget_003',
        category: 'technology',
        subcategory: 'HR Tech Stack',
        description: 'ATS, HRIS, and recruitment automation tools',
        department: 'HR Technology',
        allocatedBudget: 13600000, // R13.6M
        spentAmount: 5440000, // R5.44M
        remainingAmount: 8160000, // R8.16M
        projectedSpend: 12240000, // R12.24M
        period: 'Q1-Q2 2025',
        owner: 'Lisa Rodriguez',
        status: 'under_utilized',
        variance: 1360000, // R1.36M
        lastUpdated: '2025-01-15T16:45:00Z',
        approvals: []
      },
      {
        id: 'budget_004',
        category: 'benefits',
        subcategory: 'Signing Bonuses',
        description: 'Competitive signing bonuses for key hires',
        department: 'Sales',
        allocatedBudget: 10200000, // R10.2M
        spentAmount: 8160000, // R8.16M
        remainingAmount: 2040000, // R2.04M
        projectedSpend: 11050000, // R11.05M
        period: 'Q1-Q2 2025',
        owner: 'David Park',
        status: 'needs_attention',
        variance: -850000, // -R850K
        lastUpdated: '2025-01-22T11:20:00Z',
        approvals: [
          {
            id: 'approval_002',
            amount: 1275000, // R1.275M
            description: 'Senior Sales Director signing bonus',
            status: 'approved',
            requestedBy: 'Jennifer Liu',
            requestedDate: '2025-01-20T14:00:00Z'
          }
        ]
      },
      {
        id: 'budget_005',
        category: 'training',
        subcategory: 'Leadership Development',
        description: 'Executive coaching and leadership programs',
        department: 'Executive Team',
        allocatedBudget: 5100000, // R5.1M
        spentAmount: 2125000, // R2.125M
        remainingAmount: 2975000, // R2.975M
        projectedSpend: 4760000, // R4.76M
        period: 'Q1-Q2 2025',
        owner: 'Amanda Zhang',
        status: 'on_track',
        variance: 340000, // R340K
        lastUpdated: '2025-01-17T13:30:00Z',
        approvals: []
      }
    ];

    // Mock approval requests
    const mockApprovalRequests: ApprovalRequest[] = [
      {
        id: 'request_001',
        type: 'budget_increase',
        title: 'Engineering Recruitment Budget Increase',
        description: 'Request for additional R8.5M to meet aggressive hiring targets for Q2 2025',
        amount: 8500000, // R8.5M
        requestedBy: {
          name: 'Sarah Martinez',
          title: 'VP of Engineering',
          department: 'Engineering',
          email: 'sarah.martinez@company.com'
        },
        requestedDate: '2025-01-20T10:30:00Z',
        urgency: 'critical',
        status: 'pending',
        approvalLevel: 'executive',
        justification: 'Market competition for senior engineers has intensified, requiring higher compensation packages and signing bonuses. Current budget insufficient to meet Q2 hiring targets of 15 senior engineers.',
        businessImpact: 'Failure to hire could delay product roadmap by 2-3 months, impacting revenue targets of R850M for 2025. Engineering productivity would remain constrained.',
        alternatives: [
          'Reduce hiring targets from 15 to 10 engineers',
          'Extend hiring timeline to Q3, accepting product delays',
          'Focus on mid-level hires with internal promotion path'
        ],
        supportingDocuments: [
          'Market Salary Analysis Q1 2025.pdf',
          'Engineering Headcount Plan.xlsx',
          'Competitor Analysis - Tech Salaries.pdf'
        ],
        deadline: '2025-01-25T23:59:59Z',
        relatedBudgetCategory: 'recruitment',
        comments: [
          {
            id: 'comment_001',
            author: 'CFO Jennifer Liu',
            content: 'What is the expected ROI timeline for this investment? Need to understand revenue impact.',
            timestamp: '2025-01-21T09:15:00Z',
            type: 'question'
          },
          {
            id: 'comment_002',
            author: 'Sarah Martinez',
            content: 'Expected productivity impact within 6 months, revenue contribution starting Q4 2025. Each senior engineer contributes ~R51M annual value.',
            timestamp: '2025-01-21T14:20:00Z',
            type: 'comment'
          }
        ]
      },
      {
        id: 'request_002',
        type: 'new_position',
        title: 'Chief Data Officer Position',
        description: 'Create new executive position to lead data strategy and AI initiatives',
        amount: 5950000, // R5.95M
        requestedBy: {
          name: 'Michael Chen',
          title: 'CEO',
          department: 'Executive',
          email: 'michael.chen@company.com'
        },
        requestedDate: '2025-01-18T15:45:00Z',
        urgency: 'high',
        status: 'needs_info',
        approvalLevel: 'executive',
        justification: 'Data and AI becoming critical competitive advantage. Need executive-level leadership to drive strategy, coordinate across departments, and ensure regulatory compliance.',
        businessImpact: 'Enhanced data capabilities could improve operational efficiency by 15-20% and unlock new revenue streams worth R340M+ annually.',
        alternatives: [
          'Promote existing senior data scientist to VP level',
          'Hire consulting firm for strategy development',
          'Distribute responsibilities across existing executives'
        ],
        supportingDocuments: [
          'Data Strategy Roadmap 2025.pdf',
          'CDO Role Benchmarking.pdf',
          'AI Investment Proposal.pdf'
        ],
        comments: [
          {
            id: 'comment_003',
            author: 'Board Chair Tom Wilson',
            content: 'Need more details on reporting structure and integration with existing tech leadership.',
            timestamp: '2025-01-19T10:30:00Z',
            type: 'question'
          }
        ]
      },
      {
        id: 'request_003',
        type: 'salary_adjustment',
        title: 'Market Adjustment - Product Team',
        description: 'Salary adjustments for 8 product managers to match market rates',
        amount: 4760000, // R4.76M
        requestedBy: {
          name: 'Lisa Park',
          title: 'VP of Product',
          department: 'Product',
          email: 'lisa.park@company.com'
        },
        requestedDate: '2025-01-16T11:20:00Z',
        urgency: 'medium',
        status: 'approved',
        approvalLevel: 'executive',
        justification: 'Recent market analysis shows product manager salaries 15-20% below market. Risk of losing key talent to competitors.',
        businessImpact: 'Retention of critical product knowledge and avoiding 6-month replacement cycles. Each PM manages R170M+ product revenue.',
        alternatives: [
          'Implement equity compensation to bridge gap',
          'Selective adjustments for only top performers',
          'Accelerate promotion timeline with salary increases'
        ],
        supportingDocuments: [
          'PM Market Analysis 2025.pdf',
          'Retention Risk Assessment.xlsx'
        ],
        comments: [
          {
            id: 'comment_004',
            author: 'CFO Jennifer Liu',
            content: 'Approved. Please implement in February payroll. Monitor ongoing market trends.',
            timestamp: '2025-01-17T16:15:00Z',
            type: 'approval'
          }
        ]
      },
      {
        id: 'request_004',
        type: 'vendor_contract',
        title: 'Global Executive Search Firm',
        description: 'Annual contract with executive search firm for C-level and VP hiring',
        amount: 12750000, // R12.75M
        requestedBy: {
          name: 'David Rodriguez',
          title: 'Chief Human Resources Officer',
          department: 'HR',
          email: 'david.rodriguez@company.com'
        },
        requestedDate: '2025-01-15T09:30:00Z',
        urgency: 'low',
        status: 'pending',
        approvalLevel: 'executive',
        justification: 'Need specialized expertise for executive-level searches. Firm has 85% success rate and 90-day average placement time.',
        businessImpact: 'Faster executive hiring reduces interim costs and accelerates strategic initiatives. Each successful placement saves ~R3.4M in opportunity costs.',
        alternatives: [
          'Use multiple boutique firms on project basis',
          'Build internal executive recruiting capability',
          'Leverage board network for executive referrals'
        ],
        supportingDocuments: [
          'Executive Search RFP Responses.pdf',
          'Firm Performance Benchmarking.xlsx'
        ],
        comments: []
      },
      {
        id: 'request_005',
        type: 'bonus_approval',
        title: 'Q1 Performance Bonuses',
        description: 'Performance bonuses for top 15% of employees based on Q1 results',
        amount: 7225000, // R7.225M
        requestedBy: {
          name: 'Amanda Thompson',
          title: 'VP of People Operations',
          department: 'HR',
          email: 'amanda.thompson@company.com'
        },
        requestedDate: '2025-01-22T14:15:00Z',
        urgency: 'medium',
        status: 'pending',
        approvalLevel: 'executive',
        justification: 'Q1 performance exceeded targets by 12%. Bonus program essential for retention and motivation of top performers.',
        businessImpact: 'Maintains high performance culture and reduces risk of losing top talent. Historical data shows 95% retention rate for bonus recipients.',
        alternatives: [
          'Reduce bonus pool by 25% to R320K',
          'Defer bonuses to Q2 based on continued performance',
          'Replace cash bonuses with additional equity grants'
        ],
        supportingDocuments: [
          'Q1 Performance Results.pdf',
          'Bonus Calculation Methodology.xlsx',
          'Retention Impact Analysis.pdf'
        ],
        comments: [
          {
            id: 'comment_005',
            author: 'CEO Michael Chen',
            content: 'Strong Q1 results justify recognition. What is the distribution across departments?',
            timestamp: '2025-01-22T16:30:00Z',
            type: 'question'
          }
        ]
      }
    ];

    // Mock analytics
    const mockAnalytics: BudgetAnalytics = {
      totalAllocated: 102000000, // R102M
      totalSpent: 67575000, // R67.575M
      totalRemaining: 34425000, // R34.425M
      utilizationRate: 66.3,
      projectedOverrun: 5525000, // R5.525M
      costPerHire: 2125000, // R2.125M
      monthlyBurnRate: 13515000, // R13.515M
      forecastAccuracy: 87.5
    };

    // Simulate loading delay
    setTimeout(() => {
      setBudgetItems(mockBudgetItems);
      setApprovalRequests(mockApprovalRequests);
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  };

  const handleApprovalAction = (requestId: string, action: 'approve' | 'reject' | 'request_info') => {
    setApprovalRequests(prev => 
      prev.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_info' 
            }
          : request
      )
    );
    
    if (selectedRequest?.id === requestId) {
      setSelectedRequest(prev => 
        prev ? { 
          ...prev, 
          status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'needs_info' 
        } : null
      );
    }
  };

  const addComment = (requestId: string, content: string) => {
    const newComment = {
      id: `comment_${Date.now()}`,
      author: 'Executive User',
      content,
      timestamp: new Date().toISOString(),
      type: 'comment' as const
    };

    setApprovalRequests(prev =>
      prev.map(request =>
        request.id === requestId
          ? { ...request, comments: [...request.comments, newComment] }
          : request
      )
    );

    if (selectedRequest?.id === requestId) {
      setSelectedRequest(prev =>
        prev ? { ...prev, comments: [...prev.comments, newComment] } : null
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'over_budget': case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'under_utilized': return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'needs_attention': case 'needs_info': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recruitment': return <UserGroupIcon className="w-5 h-5" />;
      case 'compensation': return <CurrencyDollarIcon className="w-5 h-5" />;
      case 'technology': return <BuildingOfficeIcon className="w-5 h-5" />;
      case 'training': return <UserIcon className="w-5 h-5" />;
      case 'operations': return <ChartBarIcon className="w-5 h-5" />;
      case 'benefits': return <BanknotesIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const filteredRequests = approvalRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const actions = (
    <div className="flex items-center gap-3">
      {activeView === 'approvals' && (
        <>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_info">Needs Info</option>
          </select>
        </>
      )}
      
      <button className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        New Request
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Budget & Approvals" subtitle="Loading financial data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Budget & Approvals"
      subtitle="Executive oversight of budget allocation and approval workflows"
      actions={actions}
    >
      <div className="space-y-6">
        {/* View Navigation */}
        <div className="bg-white rounded-lg shadow p-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Executive Overview', icon: ChartBarIcon },
              { id: 'budget', name: 'Budget Management', icon: CurrencyDollarIcon },
              { id: 'approvals', name: 'Pending Approvals', icon: CheckCircleIcon },
              { id: 'analytics', name: 'Financial Analytics', icon: ReceiptPercentIcon }
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
        {activeView === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Key Financial Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <CurrencyDollarIconSolid className="w-8 h-8 text-violet-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Budget</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analytics.totalAllocated)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatCurrency(analytics.totalSpent)} spent
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ReceiptPercentIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Utilization Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {analytics.utilizationRate}%
                    </p>
                    <p className="text-xs text-green-600">Within target range</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ClockIconSolid className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {approvalRequests.filter(r => r.status === 'pending').length}
                    </p>
                    <p className="text-xs text-orange-600">Require attention</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Projected Overrun</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(analytics.projectedOverrun)}
                    </p>
                    <p className="text-xs text-red-600">Monitor closely</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Status Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Budget Status by Category</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {budgetItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(item.category)}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{item.subcategory}</h4>
                          <p className="text-sm text-gray-600">{item.department}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.spentAmount)} / {formatCurrency(item.allocatedBudget)}
                          </p>
                          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                item.status === 'over_budget' ? 'bg-red-500' :
                                item.status === 'on_track' ? 'bg-green-500' :
                                item.status === 'under_utilized' ? 'bg-violet-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${Math.min((item.spentAmount / item.allocatedBudget) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Critical Approvals */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Critical Approvals Required</h3>
              </div>
              <div className="p-6 space-y-4">
                {approvalRequests.filter(r => r.status === 'pending' && (r.urgency === 'critical' || r.urgency === 'high')).slice(0, 3).map((request) => (
                  <div key={request.id} className="border-l-4 border-l-orange-400 pl-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{request.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{request.requestedBy.name}</span>
                          <span>{formatCurrency(request.amount)}</span>
                          <span className={`px-2 py-1 rounded-full ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="flex items-center px-3 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Budget Management View */}
        {activeView === 'budget' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {budgetItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow border-l-4 border-l-violet-500">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(item.category)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{item.subcategory}</h3>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Allocated</p>
                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(item.allocatedBudget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Spent</p>
                        <p className="text-lg font-semibold text-gray-900">{formatCurrency(item.spentAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Remaining</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(item.remainingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Projected</p>
                        <p className={`text-lg font-semibold ${item.projectedSpend > item.allocatedBudget ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatCurrency(item.projectedSpend)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Utilization</span>
                        <span className="font-medium">{Math.round((item.spentAmount / item.allocatedBudget) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.status === 'over_budget' ? 'bg-red-500' :
                            item.status === 'on_track' ? 'bg-green-500' :
                            item.status === 'under_utilized' ? 'bg-violet-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((item.spentAmount / item.allocatedBudget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 text-sm">
                      <div>
                        <span className="text-gray-500">Owner: </span>
                        <span className="font-medium">{item.owner}</span>
                      </div>
                      <div className="text-gray-500">
                        {item.period}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approvals View */}
        {activeView === 'approvals' && (
          <div className="space-y-6">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="text-gray-500">
                          Requested by: <span className="font-medium text-gray-900">{request.requestedBy.name}</span>
                        </span>
                        <span className="text-gray-500">
                          Amount: <span className="font-semibold text-green-600">{formatCurrency(request.amount)}</span>
                        </span>
                        <span className="text-gray-500">
                          Date: {new Date(request.requestedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency)}`}>
                        {request.urgency.toUpperCase()}
                      </span>
                      {request.deadline && (
                        <span className="text-xs text-red-600">
                          Deadline: {new Date(request.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Business Justification</h4>
                    <p className="text-sm text-gray-700">{request.justification}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {request.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApprovalAction(request.id, 'request_info')}
                          className="flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                          Request Info
                        </button>
                        
                        <button
                          onClick={() => handleApprovalAction(request.id, 'reject')}
                          className="flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <HandThumbDownIcon className="w-4 h-4 mr-2" />
                          Reject
                        </button>
                        
                        <button
                          onClick={() => handleApprovalAction(request.id, 'approve')}
                          className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <HandThumbUpIcon className="w-4 h-4 mr-2" />
                          Approve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cost Per Hire</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.costPerHire)}</p>
                  </div>
                  <UserIcon className="w-8 h-8 text-violet-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Monthly Burn Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(analytics.monthlyBurnRate)}</p>
                  </div>
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Forecast Accuracy</p>
                    <p className="text-2xl font-semibold text-gray-900">{analytics.forecastAccuracy}%</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Budget Variance</p>
                    <p className="text-2xl font-semibold text-red-600">-{formatCurrency(analytics.projectedOverrun)}</p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">Detailed Financial Analytics</h3>
              <div className="text-center py-12">
                <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Dashboard</h4>
                <p className="text-gray-600">
                  Comprehensive financial reporting and predictive analytics will be available in the next release.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedRequest.title}</h2>
                    <p className="text-gray-600 mt-1">{selectedRequest.description}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(selectedRequest.urgency)}`}>
                        {selectedRequest.urgency.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Amount: <span className="font-semibold text-green-600">{formatCurrency(selectedRequest.amount)}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Request Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="font-medium text-gray-700">Requested by:</span>
                          <div className="mt-1">
                            <p className="text-sm text-gray-900">{selectedRequest.requestedBy.name}</p>
                            <p className="text-sm text-gray-600">{selectedRequest.requestedBy.title}</p>
                            <p className="text-sm text-gray-600">{selectedRequest.requestedBy.department}</p>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Request Date:</span>
                          <p className="text-sm text-gray-900 mt-1">{new Date(selectedRequest.requestedDate).toLocaleDateString()}</p>
                        </div>
                        {selectedRequest.deadline && (
                          <div>
                            <span className="font-medium text-gray-700">Deadline:</span>
                            <p className="text-sm text-red-600 mt-1">{new Date(selectedRequest.deadline).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Justification</h3>
                      <p className="text-sm text-gray-700">{selectedRequest.justification}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Impact</h3>
                      <p className="text-sm text-gray-700">{selectedRequest.businessImpact}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Alternative Options</h3>
                      <ul className="space-y-2">
                        {selectedRequest.alternatives.map((alt, index) => (
                          <li key={index} className="flex items-start text-sm text-gray-700">
                            <MinusIcon className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Supporting Documents</h3>
                      <div className="space-y-2">
                        {selectedRequest.supportingDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center p-2 bg-gray-50 rounded-lg">
                            <DocumentTextIcon className="w-5 h-5 text-violet-500 mr-3" />
                            <span className="text-sm text-gray-900">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Comments & Discussion</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedRequest.comments.map((comment) => (
                          <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-gray-900">{comment.author}</span>
                              <span className="text-xs text-gray-500">{new Date(comment.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <textarea
                          placeholder="Add a comment..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                          rows={3}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              const target = e.target as HTMLTextAreaElement;
                              if (target.value.trim()) {
                                addComment(selectedRequest.id, target.value.trim());
                                target.value = '';
                              }
                            }
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-1">Ctrl+Enter to submit</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Close
                  </button>
                  
                  {selectedRequest.status === 'pending' && (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          handleApprovalAction(selectedRequest.id, 'request_info');
                          setSelectedRequest(null);
                        }}
                        className="flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-lg text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                        Request Info
                      </button>
                      
                      <button
                        onClick={() => {
                          handleApprovalAction(selectedRequest.id, 'reject');
                          setSelectedRequest(null);
                        }}
                        className="flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <HandThumbDownIcon className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                      
                      <button
                        onClick={() => {
                          handleApprovalAction(selectedRequest.id, 'approve');
                          setSelectedRequest(null);
                        }}
                        className="flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700"
                      >
                        <HandThumbUpIcon className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
