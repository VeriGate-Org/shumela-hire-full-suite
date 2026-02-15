'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { RequisitionData } from '../../../types/workflow';
import ApprovalTimeline, { ApprovalStep } from '../../../components/ApprovalTimeline';
import AuditLogViewer from '../../../components/AuditLogViewer';
import { approvalTimelineService } from '../../../services/approvalTimelineService';
import { requisitionService } from '../../../services/requisitionService';
import { formatSalaryRange } from '@/utils/currency';

const RequisitionDetailPage: React.FC = () => {
  const params = useParams();
  const requisitionId = params.id as string;
  
  const [requisition, setRequisition] = useState<RequisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline');
  const [timelineSteps, setTimelineSteps] = useState<ApprovalStep[]>([]);

  const fetchRequisitionDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Initialize demo data first (in case it hasn't been loaded yet)
      await requisitionService.initializeDemoData();

      // Fetch requisition data
      const response = await fetch(`/api/requisitions/${requisitionId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Requisition not found');
        }
        throw new Error('Failed to fetch requisition details');
      }

      const result = await response.json();
      
      if (result.success) {
        setRequisition(result.data);
        
        // Fetch approval timeline steps
        const steps = await approvalTimelineService.getApprovalTimelineForRequisition(requisitionId);
        setTimelineSteps(steps);
      } else {
        throw new Error(result.message || 'Failed to fetch requisition details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [requisitionId]);

  useEffect(() => {
    if (requisitionId) {
      fetchRequisitionDetails();
    }
  }, [requisitionId, fetchRequisitionDetails]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading requisition details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-700 mt-1">{error}</div>
          <button 
            onClick={fetchRequisitionDetails}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!requisition) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center text-gray-500">
          Requisition not found.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{requisition.jobTitle}</h1>
            <p className="text-gray-600 mt-1">Requisition #{requisition.id}</p>
          </div>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(requisition.status)}`}>
            {requisition.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Requisition Details */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Job Details</h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Department</label>
                  <p className="text-gray-900">{requisition.department}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Location</label>
                  <p className="text-gray-900">{requisition.location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Employment Type</label>
                  <p className="text-gray-900">{requisition.employmentType}</p>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Salary Range</label>
                  <p className="text-gray-900">{formatSalaryRange(requisition.salaryMin, requisition.salaryMax)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-gray-900">{requisition.createdBy}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-gray-900">{new Date(requisition.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="text-sm font-medium text-gray-500">Job Description</label>
            <p className="text-gray-900 mt-2 whitespace-pre-wrap">{requisition.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'timeline'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Approval Timeline
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'audit'
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Log
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'timeline' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Timeline</h3>
              {timelineSteps.length > 0 ? (
                <ApprovalTimeline steps={timelineSteps} />
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No approval timeline available yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Audit Log</h3>
              <p className="text-gray-600 mb-4">
                Complete audit trail showing all actions performed on this requisition.
              </p>
              <AuditLogViewer requisitionId={requisitionId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequisitionDetailPage;