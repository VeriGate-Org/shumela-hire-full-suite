'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import PageWrapper from '@/components/PageWrapper';
import StatusPill from '@/components/StatusPill';
import { formatCurrency } from '@/utils/currency';
import ExecutiveTimeline, { TimelineItem } from '@/components/ExecutiveTimeline';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserIcon,
  EyeIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  MinusIcon,
  XMarkIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import {
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
  const [analytics, _setAnalytics] = useState<BudgetAnalytics | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'budget' | 'approvals' | 'analytics'>('overview');
  const [_filterCategory, _setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    try {
      const [budgetRes, _analyticsRes] = await Promise.allSettled([
        apiFetch('/api/executive/budget'),
        apiFetch('/api/executive/budget/analytics'),
      ]);

      if (budgetRes.status === 'fulfilled' && budgetRes.value.ok) {
        const data = await budgetRes.value.json();
        if (Array.isArray(data.budgetItems) && data.budgetItems.length > 0) {
          setBudgetItems(data.budgetItems);
        }
      }
    } catch (error) {
      console.error('Failed to load budget data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBudgetData();
  }, [loadBudgetData]);

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
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="needs_info">Needs Info</option>
          </select>
        </>
      )}
      
      <button className="flex items-center px-4 py-2 bg-transparent border-2 border-gold-500 text-primary hover:bg-gold-500 hover:text-primary uppercase tracking-wider rounded-full text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        New Request
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Budget & Approvals" subtitle="Loading financial data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
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
        <div className="bg-card rounded-sm shadow p-4">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-gold-100 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
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
              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <CurrencyDollarIconSolid className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(analytics.totalAllocated)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(analytics.totalSpent)} spent
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ReceiptPercentIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Utilization Rate</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {analytics.utilizationRate}%
                    </p>
                    <p className="text-xs text-green-600">Within target range</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ClockIconSolid className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {approvalRequests.filter(r => r.status === 'pending').length}
                    </p>
                    <p className="text-xs text-orange-600">Require attention</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Projected Overrun</p>
                    <p className="text-2xl font-semibold text-foreground">
                      {formatCurrency(analytics.projectedOverrun)}
                    </p>
                    <p className="text-xs text-red-600">Monitor closely</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Budget Status Overview */}
            <div className="bg-card rounded-sm shadow p-6">
              <ExecutiveTimeline
                title="Budget Status by Category"
                variant="goal"
                showTimestamps={false}
                items={budgetItems.map((item): TimelineItem => ({
                  id: item.id,
                  title: item.subcategory,
                  description: item.department,
                  status: item.status,
                  statusDomain: 'budgetStatus',
                  progress: Math.round((item.spentAmount / item.allocatedBudget) * 100),
                  // variant default icon is used
                  meta: {
                    allocated: formatCurrency(item.allocatedBudget),
                    spent: formatCurrency(item.spentAmount),
                    remaining: formatCurrency(item.remainingAmount),
                    owner: item.owner,
                  },
                }))}
                emptyMessage="No budget data available."
              />
            </div>

            {/* Critical Approvals */}
            <div className="bg-card rounded-sm shadow p-6">
              <ExecutiveTimeline
                title="Critical Approvals Required"
                variant="approval"
                maxItems={3}
                items={approvalRequests
                  .filter(r => r.status === 'pending' && (r.urgency === 'critical' || r.urgency === 'high'))
                  .map((request): TimelineItem => ({
                    id: request.id,
                    title: request.title,
                    description: request.description,
                    timestamp: request.requestedDate,
                    severity: request.urgency === 'critical' ? 'critical' : 'warning',
                    status: request.urgency,
                    statusDomain: 'urgency',
                    meta: {
                      'requested by': request.requestedBy.name,
                      amount: formatCurrency(request.amount),
                      department: request.requestedBy.department,
                    },
                    actions: [
                      { label: 'Review', onClick: () => setSelectedRequest(request), variant: 'primary' },
                    ],
                  }))}
                emptyMessage="No critical approvals pending."
              />
            </div>
          </div>
        )}

        {/* Budget Management View */}
        {activeView === 'budget' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {budgetItems.map((item) => (
                <div key={item.id} className="bg-card rounded-sm shadow border-l-4 border-l-primary">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getCategoryIcon(item.category)}
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{item.subcategory}</h3>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      <StatusPill value={item.status} domain="budgetStatus" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Allocated</p>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(item.allocatedBudget)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Spent</p>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(item.spentAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(item.remainingAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Projected</p>
                        <p className={`text-lg font-semibold ${item.projectedSpend > item.allocatedBudget ? 'text-red-600' : 'text-foreground'}`}>
                          {formatCurrency(item.projectedSpend)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Utilization</span>
                        <span className="font-medium">{Math.round((item.spentAmount / item.allocatedBudget) * 100)}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            item.status === 'over_budget' ? 'bg-red-500' :
                            item.status === 'on_track' ? 'bg-green-500' :
                            item.status === 'under_utilized' ? 'bg-gold-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((item.spentAmount / item.allocatedBudget) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border text-sm">
                      <div>
                        <span className="text-muted-foreground">Owner: </span>
                        <span className="font-medium">{item.owner}</span>
                      </div>
                      <div className="text-muted-foreground">
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
              <div key={request.id} className="bg-card rounded-sm shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{request.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <span className="text-muted-foreground">
                          Requested by: <span className="font-medium text-foreground">{request.requestedBy.name}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Amount: <span className="font-semibold text-green-600">{formatCurrency(request.amount)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Date: {new Date(request.requestedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <StatusPill value={request.status} domain="budgetStatus" />
                      <StatusPill value={request.urgency} domain="urgency" />
                      {request.deadline && (
                        <span className="text-xs text-red-600">
                          Deadline: {new Date(request.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-foreground mb-2">Business Justification</h4>
                    <p className="text-sm text-foreground">{request.justification}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <button
                      onClick={() => setSelectedRequest(request)}
                      className="flex items-center px-3 py-2 border border-border text-sm font-medium rounded-full text-foreground bg-card hover:bg-muted"
                    >
                      <EyeIcon className="w-4 h-4 mr-2" />
                      View Details
                    </button>
                    
                    {request.status === 'pending' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApprovalAction(request.id, 'request_info')}
                          className="flex items-center px-3 py-2 border border-yellow-300 text-sm font-medium rounded-full text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                        >
                          <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                          Request Info
                        </button>

                        <button
                          onClick={() => handleApprovalAction(request.id, 'reject')}
                          className="flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-full text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <HandThumbDownIcon className="w-4 h-4 mr-2" />
                          Reject
                        </button>

                        <button
                          onClick={() => handleApprovalAction(request.id, 'approve')}
                          className="flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
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
              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cost Per Hire</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(analytics.costPerHire)}</p>
                  </div>
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Monthly Burn Rate</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCurrency(analytics.monthlyBurnRate)}</p>
                  </div>
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Forecast Accuracy</p>
                    <p className="text-2xl font-semibold text-foreground">{analytics.forecastAccuracy}%</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-primary" />
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Budget Variance</p>
                    <p className="text-2xl font-semibold text-red-600">-{formatCurrency(analytics.projectedOverrun)}</p>
                  </div>
                  <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-sm shadow p-6">
              <h3 className="text-lg font-medium text-foreground mb-6">Detailed Financial Analytics</h3>
              <div className="text-center py-12">
                <ChartBarIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">Advanced Analytics Dashboard</h4>
                <p className="text-muted-foreground">
                  Comprehensive financial reporting and predictive analytics will be available in the next release.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Approval Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedRequest.title}</h2>
                    <p className="text-muted-foreground mt-1">{selectedRequest.description}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <StatusPill value={selectedRequest.status} domain="budgetStatus" />
                      <StatusPill value={selectedRequest.urgency} domain="urgency" />
                      <span className="text-sm text-muted-foreground">
                        Amount: <span className="font-semibold text-green-600">{formatCurrency(selectedRequest.amount)}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="text-muted-foreground hover:text-muted-foreground"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Request Details</h3>
                      <div className="bg-muted rounded-sm p-4 space-y-3">
                        <div>
                          <span className="font-medium text-foreground">Requested by:</span>
                          <div className="mt-1">
                            <p className="text-sm text-foreground">{selectedRequest.requestedBy.name}</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest.requestedBy.title}</p>
                            <p className="text-sm text-muted-foreground">{selectedRequest.requestedBy.department}</p>
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">Request Date:</span>
                          <p className="text-sm text-foreground mt-1">{new Date(selectedRequest.requestedDate).toLocaleDateString()}</p>
                        </div>
                        {selectedRequest.deadline && (
                          <div>
                            <span className="font-medium text-foreground">Deadline:</span>
                            <p className="text-sm text-red-600 mt-1">{new Date(selectedRequest.deadline).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Business Justification</h3>
                      <p className="text-sm text-foreground">{selectedRequest.justification}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Business Impact</h3>
                      <p className="text-sm text-foreground">{selectedRequest.businessImpact}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Alternative Options</h3>
                      <ul className="space-y-2">
                        {selectedRequest.alternatives.map((alt, index) => (
                          <li key={index} className="flex items-start text-sm text-foreground">
                            <MinusIcon className="w-4 h-4 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                            {alt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Supporting Documents</h3>
                      <div className="space-y-2">
                        {selectedRequest.supportingDocuments.map((doc, index) => (
                          <div key={index} className="flex items-center p-2 bg-muted rounded-sm">
                            <DocumentTextIcon className="w-5 h-5 text-primary mr-3" />
                            <span className="text-sm text-foreground">{doc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Comments & Discussion</h3>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedRequest.comments.map((comment) => (
                          <div key={comment.id} className="bg-muted rounded-sm p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm text-foreground">{comment.author}</span>
                              <span className="text-xs text-muted-foreground">{new Date(comment.timestamp).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-foreground">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <textarea
                          placeholder="Add a comment..."
                          className="w-full px-3 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
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
                        <p className="text-xs text-muted-foreground mt-1">Ctrl+Enter to submit</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="px-4 py-2 bg-muted-foreground text-white rounded-full hover:bg-foreground"
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
                        className="flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-full text-yellow-700 bg-yellow-50 hover:bg-yellow-100"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                        Request Info
                      </button>

                      <button
                        onClick={() => {
                          handleApprovalAction(selectedRequest.id, 'reject');
                          setSelectedRequest(null);
                        }}
                        className="flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-full text-red-700 bg-red-50 hover:bg-red-100"
                      >
                        <HandThumbDownIcon className="w-4 h-4 mr-2" />
                        Reject
                      </button>

                      <button
                        onClick={() => {
                          handleApprovalAction(selectedRequest.id, 'approve');
                          setSelectedRequest(null);
                        }}
                        className="flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-green-600 hover:bg-green-700"
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
