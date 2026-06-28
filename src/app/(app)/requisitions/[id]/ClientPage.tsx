'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import WorkflowStatusBadge from '@/components/WorkflowStatusBadge';
import WorkflowActions from '@/components/WorkflowActions';
import ApprovalTimeline, { ApprovalStep } from '@/components/ApprovalTimeline';
import AuditLogViewer from '@/components/AuditLogViewer';
import ErrorState from '@/components/ErrorState';
import { FormSkeleton } from '@/components/LoadingComponents';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/Toast';
import { approvalTimelineService } from '@/services/approvalTimelineService';
import { formatSalaryRange } from '@/utils/currency';
import { getEnumLabel } from '@/utils/enumLabels';
import { RequisitionData, ApprovalRole, WorkflowAction } from '@/types/workflow';
import { apiFetch } from '@/lib/api-fetch';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function RequisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const requisitionId = params.id as string;
  const { user } = useAuth();
  const { toast } = useToast();

  const [requisition, setRequisition] = useState<RequisitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'audit'>('timeline');
  const [timelineSteps, setTimelineSteps] = useState<ApprovalStep[]>([]);

  const fetchRequisitionDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(`/api/requisitions/${requisitionId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Requisition not found');
        }
        throw new Error('Failed to fetch requisition details');
      }

      const data = await response.json();
      setRequisition(data);

      const steps = await approvalTimelineService.getApprovalTimelineForRequisition(requisitionId);
      setTimelineSteps(steps);
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

  const handleWorkflowAction = async (action: WorkflowAction, comment?: string) => {
    if (!user || !requisition) return;

    try {
      let endpoint = '';
      const body: Record<string, unknown> = { userId: user.id, comment };

      switch (action) {
        case WorkflowAction.SUBMIT:
          endpoint = `/api/requisitions/${requisition.id}/submit`;
          break;
        case WorkflowAction.APPROVE:
          endpoint = `/api/requisitions/${requisition.id}/approve?role=${encodeURIComponent(user.role)}`;
          break;
        case WorkflowAction.REJECT:
          endpoint = `/api/requisitions/${requisition.id}/reject?role=${encodeURIComponent(user.role)}`;
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (response.ok) {
        await fetchRequisitionDetails();
        toast('Action completed successfully', 'success');
      } else {
        const result = await response.json().catch(() => null);
        toast(`Error: ${result?.message || 'Action failed'}`, 'error');
      }
    } catch (err) {
      console.error('Error performing workflow action:', err);
      toast('An error occurred while processing the action', 'error');
    }
  };

  const actions = (
    <div className="flex items-center gap-3">
      {user && requisition && (
        <WorkflowActions
          requisition={requisition}
          userRole={user.role as ApprovalRole}
          onAction={(action, comment) => handleWorkflowAction(action, comment)}
        />
      )}
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Requisition Details" subtitle="Loading requisition..." actions={actions}>
        <div className="space-y-6">
          <FormSkeleton />
          <FormSkeleton />
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Requisition Details" subtitle="An error occurred">
        <ErrorState
          title={error}
          message="Please try again or go back to the requisitions list."
          onRetry={fetchRequisitionDetails}
        />
      </PageWrapper>
    );
  }

  if (!requisition) {
    return (
      <PageWrapper title="Requisition Details" subtitle="Requisition not found">
        <div className="enterprise-card p-12 text-center">
          <BriefcaseIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">Requisition not found</h3>
          <p className="text-sm text-muted-foreground mb-6">The requisition you are looking for does not exist.</p>
          <Link
            href="/requisitions"
            className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
          >
            Back to Requisitions
          </Link>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title={requisition.jobTitle}
      subtitle={`Requisition #${requisition.id}`}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Back link */}
        <button
          onClick={() => router.push('/requisitions')}
          aria-label="Navigate back to requisitions list"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold-600 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Requisitions
        </button>

        {/* Status + Summary Card */}
        <div className="enterprise-card p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">{requisition.jobTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {requisition.department} &middot; {requisition.location}
              </p>
            </div>
            <WorkflowStatusBadge status={requisition.status} showProgress size="md" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                <BuildingOfficeIcon className="w-4 h-4 text-gold-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</p>
                <p className="text-sm text-foreground mt-0.5">{requisition.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPinIcon className="w-4 h-4 text-gold-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Location</p>
                <p className="text-sm text-foreground mt-0.5">{requisition.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                <BriefcaseIcon className="w-4 h-4 text-gold-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Employment Type</p>
                <p className="text-sm text-foreground mt-0.5">{requisition.employmentType ? getEnumLabel('employmentType', requisition.employmentType) : 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                <CurrencyDollarIcon className="w-4 h-4 text-gold-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Salary Range</p>
                <p className="text-sm text-foreground mt-0.5">{formatSalaryRange(requisition.salaryMin, requisition.salaryMax)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-border">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created By</p>
                <p className="text-sm text-foreground mt-0.5">{requisition.createdBy}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
                <p className="text-sm text-foreground mt-0.5">{formatDate(String(requisition.createdAt))}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Job Description */}
        {requisition.description && (
          <div className="enterprise-card p-6">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Job Description</h3>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{requisition.description}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="enterprise-card overflow-hidden">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6" aria-label="Requisition detail tabs">
              <button
                onClick={() => setActiveTab('timeline')}
                aria-selected={activeTab === 'timeline'}
                role="tab"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'timeline'
                    ? 'border-gold-500 text-gold-700'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Approval Timeline
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                aria-selected={activeTab === 'audit'}
                role="tab"
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'audit'
                    ? 'border-gold-500 text-gold-700'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                Audit Log
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'timeline' && (
              <div>
                {timelineSteps.length > 0 ? (
                  <ApprovalTimeline steps={timelineSteps} />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No approval timeline available yet.
                  </div>
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete audit trail showing all actions performed on this requisition.
                </p>
                <AuditLogViewer requisitionId={requisitionId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
