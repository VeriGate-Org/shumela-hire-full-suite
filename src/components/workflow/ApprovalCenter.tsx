'use client';

import React, { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  ExclamationTriangleIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  workflowName: string;
  executionId: string;
  stepId: string;
  stepName: string;
  requester: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  approvers: Array<{
    id: string;
    name: string;
    email: string;
    avatar?: string;
    isRequired: boolean;
  }>;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  dueDate?: string;
  context: Record<string, any>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  approvals: Array<{
    approverId: string;
    approverName: string;
    decision: 'approved' | 'rejected';
    comment?: string;
    timestamp: string;
  }>;
  comments: Array<{
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: string;
  }>;
}

interface ApprovalCenterProps {
  requests: ApprovalRequest[];
  currentUserId: string;
  onApprove: (requestId: string, comment?: string) => void;
  onReject: (requestId: string, comment: string) => void;
  onAddComment: (requestId: string, comment: string) => void;
  onViewDetails: (request: ApprovalRequest) => void;
  className?: string;
}

export default function ApprovalCenter({
  requests,
  currentUserId,
  onApprove,
  onReject,
  onAddComment,
  onViewDetails,
  className = '',
}: ApprovalCenterProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);

  // Filter requests based on current user and tab
  const getFilteredRequests = () => {
    let filtered = requests;

    // Filter by user involvement
    filtered = requests.filter(request => 
      request.approvers.some(approver => approver.id === currentUserId) ||
      request.requester.id === currentUserId
    );

    // Filter by status
    if (activeTab === 'pending') {
      filtered = filtered.filter(request => request.status === 'pending');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(request => 
        request.status === 'approved' || request.status === 'rejected' || request.status === 'expired'
      );
    }

    // Sort by priority and creation date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityA = priorityOrder[a.priority];
      const priorityB = priorityOrder[b.priority];
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const canUserApprove = (request: ApprovalRequest) => {
    return request.status === 'pending' && 
           request.approvers.some(approver => approver.id === currentUserId) &&
           !request.approvals.some(approval => approval.approverId === currentUserId);
  };

  const hasUserApproved = (request: ApprovalRequest) => {
    return request.approvals.some(approval => approval.approverId === currentUserId);
  };

  const getUserApproval = (request: ApprovalRequest) => {
    return request.approvals.find(approval => approval.approverId === currentUserId);
  };

  const handleApprovalAction = (request: ApprovalRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setShowCommentModal(true);
  };

  const handleSubmitAction = () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'approve') {
      onApprove(selectedRequest.id, comment);
    } else {
      onReject(selectedRequest.id, comment || 'No comment provided');
    }

    setShowCommentModal(false);
    setSelectedRequest(null);
    setActionType(null);
    setComment('');
  };

  const filteredRequests = getFilteredRequests();
  const pendingCount = requests.filter(r => 
    r.status === 'pending' && r.approvers.some(a => a.id === currentUserId)
  ).length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Approval Center</h2>
              <p className="text-sm text-gray-500">
                Manage workflow approval requests and decisions
              </p>
            </div>
          </div>
          
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-full">
              <BellIcon className="h-4 w-4" />
              <span className="text-sm font-medium">
                {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="px-6 -mb-px flex space-x-8">
          {[
            { 
              id: 'pending' as const, 
              name: 'Pending', 
              count: requests.filter(r => r.status === 'pending' && r.approvers.some(a => a.id === currentUserId)).length 
            },
            { 
              id: 'completed' as const, 
              name: 'Completed', 
              count: requests.filter(r => 
                (r.status === 'approved' || r.status === 'rejected' || r.status === 'expired') &&
                (r.approvers.some(a => a.id === currentUserId) || r.requester.id === currentUserId)
              ).length 
            },
            { 
              id: 'all' as const, 
              name: 'All', 
              count: requests.filter(r => 
                r.approvers.some(a => a.id === currentUserId) || r.requester.id === currentUserId
              ).length 
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No approval requests</h3>
            <p className="text-gray-500">
              {activeTab === 'pending' 
                ? 'No pending approvals require your attention' 
                : 'No approval requests found'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(request.status)}
                      <h4 className="font-medium text-gray-900">{request.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <div className="font-medium">Workflow</div>
                        <div>{request.workflowName}</div>
                      </div>
                      <div>
                        <div className="font-medium">Step</div>
                        <div>{request.stepName}</div>
                      </div>
                      <div>
                        <div className="font-medium">Requester</div>
                        <div className="flex items-center gap-1">
                          <UserIcon className="h-4 w-4" />
                          {request.requester.name}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Created</div>
                        <div>{formatTimeAgo(request.createdAt)}</div>
                      </div>
                    </div>

                    {/* Approvers Status */}
                    <div className="mb-3">
                      <div className="text-sm font-medium text-gray-700 mb-2">Approvers</div>
                      <div className="flex flex-wrap gap-2">
                        {request.approvers.map((approver) => {
                          const approval = request.approvals.find(a => a.approverId === approver.id);
                          return (
                            <div
                              key={approver.id}
                              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${
                                approval
                                  ? approval.decision === 'approved'
                                    ? 'bg-green-100 text-green-700 border-green-200'
                                    : 'bg-red-100 text-red-700 border-red-200'
                                  : approver.id === currentUserId
                                    ? 'bg-violet-100 text-violet-700 border-violet-200'
                                    : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              <UserIcon className="h-3 w-3" />
                              {approver.name}
                              {approval && (
                                approval.decision === 'approved' ? 
                                <CheckCircleIcon className="h-3 w-3" /> :
                                <XCircleIcon className="h-3 w-3" />
                              )}
                              {approver.isRequired && <span className="text-red-500">*</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* User's Previous Decision */}
                    {hasUserApproved(request) && (
                      <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">Your decision:</span>
                          {getUserApproval(request)?.decision === 'approved' ? (
                            <span className="text-green-600 flex items-center gap-1">
                              <CheckCircleIcon className="h-4 w-4" />
                              Approved
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1">
                              <XCircleIcon className="h-4 w-4" />
                              Rejected
                            </span>
                          )}
                        </div>
                        {getUserApproval(request)?.comment && (
                          <p className="text-sm text-gray-600 mt-1">
                            "{getUserApproval(request)?.comment}"
                          </p>
                        )}
                      </div>
                    )}

                    {/* Comments */}
                    {request.comments.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                          <ChatBubbleLeftRightIcon className="h-4 w-4" />
                          Comments ({request.comments.length})
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {request.comments.slice(-2).map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-2 rounded text-sm">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-700">{comment.authorName}</span>
                                <span className="text-xs text-gray-500">
                                  {formatTimeAgo(comment.timestamp)}
                                </span>
                              </div>
                              <p className="text-gray-600">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => onViewDetails(request)}
                      className="p-2 text-gray-400 hover:text-violet-600 rounded border border-gray-200 hover:border-violet-200"
                      title="View Details"
                    >
                      <EyeIcon className="h-4 w-4" />
                    </button>
                    
                    {canUserApprove(request) && (
                      <>
                        <button
                          onClick={() => handleApprovalAction(request, 'approve')}
                          className="p-2 text-white bg-green-600 hover:bg-green-700 rounded"
                          title="Approve"
                        >
                          <HandThumbUpIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleApprovalAction(request, 'reject')}
                          className="p-2 text-white bg-red-600 hover:bg-red-700 rounded"
                          title="Reject"
                        >
                          <HandThumbDownIcon className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {showCommentModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {actionType === 'approve' ? 'Approve Request' : 'Reject Request'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {actionType === 'approve' 
                ? 'Add an optional comment for your approval:'
                : 'Please provide a reason for rejection:'
              }
            </p>
            
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={actionType === 'approve' ? 'Optional comment...' : 'Reason for rejection...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              rows={3}
              required={actionType === 'reject'}
            />
            
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSubmitAction}
                disabled={actionType === 'reject' && !comment.trim()}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${
                  actionType === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setComment('');
                  setSelectedRequest(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
