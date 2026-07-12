'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  WorkflowBuilder,
  WorkflowManager,
  WorkflowLibrary,
  ApprovalCenter,
  WorkflowDefinition,
  WorkflowExecution,
  ApprovalRequest
} from '@/components/workflow';
import {
  Cog6ToothIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PlusIcon,
  ClipboardDocumentCheckIcon,
  BoltIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Maps backend entity to frontend WorkflowDefinition
function fromBackend(entity: any): WorkflowDefinition {
  return {
    id: String(entity.id),
    name: entity.name || '',
    description: entity.description || '',
    trigger: entity.triggerConfig ? JSON.parse(entity.triggerConfig) : { id: 'manual', type: 'manual', name: 'Manual', description: 'Manually triggered' },
    steps: entity.stepsJson ? JSON.parse(entity.stepsJson) : [],
    isActive: entity.isActive ?? entity.active ?? false,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    createdBy: entity.createdBy,
    version: entity.version ?? 0,
    tags: entity.category ? [entity.category] : [],
  };
}

// Maps frontend WorkflowDefinition to backend entity shape
function toBackend(workflow: WorkflowDefinition) {
  return {
    name: workflow.name,
    description: workflow.description,
    category: workflow.tags?.[0] || null,
    triggerType: workflow.trigger?.type || 'manual',
    triggerConfig: JSON.stringify(workflow.trigger),
    stepsJson: JSON.stringify(workflow.steps),
    createdBy: workflow.createdBy,
  };
}

export default function WorkflowPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<'manager' | 'builder' | 'library' | 'approvals'>('manager');
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [availableUsers, setAvailableUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [deleteWorkflowId, setDeleteWorkflowId] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load workflows from backend
  const loadWorkflows = useCallback(async () => {
    try {
      const response = await apiFetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        const mapped = (Array.isArray(data) ? data : []).map(fromBackend);
        setWorkflows(mapped);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await apiFetch('/api/auth/interviewers');
        if (response.ok) {
          const data = await response.json();
          setAvailableUsers(data.map((u: any) => ({
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role,
          })));
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    void loadUsers();
  }, []);

  // Workflow CRUD actions (persisted to backend)
  const handleCreateWorkflow = () => {
    setSelectedWorkflow(null);
    setIsEditing(false);
    setActiveView('builder');
  };

  const handleEditWorkflow = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    setIsEditing(true);
    setActiveView('builder');
  };

  const handleSaveWorkflow = async (workflow: WorkflowDefinition) => {
    try {
      if (isEditing && selectedWorkflow?.id) {
        const response = await apiFetch(`/api/workflows/${selectedWorkflow.id}`, {
          method: 'PUT',
          body: JSON.stringify(toBackend(workflow)),
        });
        if (!response.ok) throw new Error('Failed to update workflow');
        toast('Workflow updated', 'success');
      } else {
        const response = await apiFetch('/api/workflows', {
          method: 'POST',
          body: JSON.stringify({ ...toBackend(workflow), createdBy: user?.name }),
        });
        if (!response.ok) throw new Error('Failed to create workflow');
        toast('Workflow created', 'success');
      }
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to save workflow:', error);
      toast('Failed to save workflow', 'error');
    }
    setActiveView('manager');
    setSelectedWorkflow(null);
    setIsEditing(false);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setDeleteWorkflowId(workflowId);
  };

  const confirmDeleteWorkflow = async () => {
    if (!deleteWorkflowId) return;
    const workflowId = deleteWorkflowId;
    setDeleteWorkflowId(null);
    try {
      const response = await apiFetch(`/api/workflows/${workflowId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete workflow');
      toast('Workflow deleted', 'success');
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to delete workflow:', error);
      toast('Failed to delete workflow', 'error');
    }
  };

  const handleDuplicateWorkflow = async (workflow: WorkflowDefinition) => {
    if (!workflow.id) return;
    try {
      const response = await apiFetch(`/api/workflows/${workflow.id}/duplicate`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to duplicate workflow');
      toast('Workflow duplicated', 'success');
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to duplicate workflow:', error);
      toast('Failed to duplicate workflow', 'error');
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      const response = await apiFetch(`/api/workflows/${workflowId}/toggle?isActive=${isActive}`, { method: 'PUT' });
      if (!response.ok) throw new Error('Failed to toggle workflow');
      toast(isActive ? 'Workflow activated' : 'Workflow deactivated', 'success');
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to toggle workflow:', error);
      toast('Failed to toggle workflow', 'error');
    }
  };

  // Execution actions (local-only — execution engine not yet implemented)
  const handleRunWorkflow = (workflowId: string) => {
    const workflow = workflows.find(w => w.id === workflowId);
    if (!workflow) return;

    const newExecution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId,
      workflowName: workflow.name,
      status: 'running',
      startedAt: new Date().toISOString(),
      triggeredBy: user?.name || 'Unknown User',
      context: {},
      currentStep: 0,
      totalSteps: workflow.steps.length,
      executionLog: [],
    };

    setExecutions(prev => [newExecution, ...prev]);
    toast('Workflow execution started (demo mode)', 'info');
  };

  const handleStopExecution = (executionId: string) => {
    setExecutions(prev => prev.map(e =>
      e.id === executionId ? { ...e, status: 'cancelled' as const, completedAt: new Date().toISOString() } : e
    ));
    toast('Execution stopped', 'success');
  };

  const handleViewExecution = (execution: WorkflowExecution) => {
    setSelectedExecution(execution);
  };

  const handleSelectWorkflow = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    setIsEditing(true);
    setActiveView('builder');
  };

  const handleImportWorkflow = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const response = await apiFetch('/api/workflows', {
        method: 'POST',
        body: JSON.stringify({
          ...toBackend(parsed),
          createdBy: user?.name,
        }),
      });
      if (!response.ok) throw new Error('Failed to import workflow');
      toast('Workflow imported', 'success');
      await loadWorkflows();
    } catch (error) {
      console.error('Failed to import workflow:', error);
      toast('Failed to import workflow. Ensure the file is valid JSON.', 'error');
    }
    e.target.value = '';
  };

  const handleExportWorkflow = (workflow: WorkflowDefinition) => {
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTestWorkflow = (workflow: WorkflowDefinition) => {
    toast(`Test run started for "${workflow.name}" (demo mode)`, 'info');
  };

  // Approval actions (local-only — no backend approval system yet)
  const handleApprove = (requestId: string, comment?: string) => {
    setApprovalRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const approval = {
          approverId: user?.id || 'current-user',
          approverName: user?.name || 'Current User',
          decision: 'approved' as const,
          comment,
          timestamp: new Date().toISOString(),
        };
        return {
          ...req,
          status: 'approved' as const,
          approvals: [...req.approvals, approval],
        };
      }
      return req;
    }));
  };

  const handleReject = (requestId: string, comment: string) => {
    setApprovalRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const approval = {
          approverId: user?.id || 'current-user',
          approverName: user?.name || 'Current User',
          decision: 'rejected' as const,
          comment,
          timestamp: new Date().toISOString(),
        };
        return {
          ...req,
          status: 'rejected' as const,
          approvals: [...req.approvals, approval],
        };
      }
      return req;
    }));
  };

  const handleAddComment = (requestId: string, comment: string) => {
    setApprovalRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const newComment = {
          id: `comment-${Date.now()}`,
          authorId: user?.id || 'current-user',
          authorName: user?.name || 'Current User',
          content: comment,
          timestamp: new Date().toISOString(),
        };
        return {
          ...req,
          comments: [...req.comments, newComment],
        };
      }
      return req;
    }));
  };

  const handleViewApprovalDetails = (request: ApprovalRequest) => {
    toast(`Viewing approval: ${request.workflowName}`, 'info');
  };

  if (!user) {
    return (
      <PageWrapper title="Access Denied" subtitle="Please log in to access the workflow automation system.">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">Please log in to access the workflow automation system.</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const canManageWorkflow = user.role === 'ADMIN' || user.role === 'HR_MANAGER';
  if (!canManageWorkflow) {
    return (
      <PageWrapper title="Access Denied" subtitle="You do not have permission to manage workflows.">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">Workflow management is available to administrators and HR managers.</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  // Derived stats
  const activeRuleCount = workflows.filter(w => w.isActive).length;
  const executionsTodayCount = executions.length;
  const completedCount = executions.filter(e => e.status === 'completed').length;
  const finishedCount = executions.filter(e => e.status !== 'running').length;
  const successRate = finishedCount > 0 ? Math.round((completedCount / finishedCount) * 100) : 0;

  const actions = (
    <div className="flex items-center gap-3">
      {activeView !== 'builder' && (
        <button
          onClick={handleCreateWorkflow}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-button text-[0.8125rem] font-semibold uppercase tracking-wider bg-cta text-cta-foreground border border-cta-border shadow-sm hover:bg-cta-hover hover:shadow-md hover:-translate-y-px transition-all"
        >
          <PlusIcon className="h-4 w-4" />
          Create Rule
        </button>
      )}
    </div>
  );

  return (
    <PageWrapper
      title="Workflow Management"
      subtitle="Automate hiring processes with event-driven rules and actions"
      actions={actions}
    >
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      <div className="space-y-6">
        {/* View Toggle Bar */}
        <div className="enterprise-card px-3 py-2 flex items-center gap-2 flex-wrap">
          <span className="text-[0.75rem] font-bold uppercase tracking-wider text-muted-foreground mr-2">
            View:
          </span>
          {[
            { id: 'manager' as const, name: 'Manager', icon: PlayCircleIcon },
            { id: 'builder' as const, name: 'Builder', icon: Cog6ToothIcon },
            { id: 'library' as const, name: 'Library', icon: DocumentTextIcon },
            { id: 'approvals' as const, name: 'Approvals', icon: CheckCircleIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-button text-[0.75rem] font-semibold border transition-all ${
                activeView === item.id
                  ? 'bg-primary text-white border-primary'
                  : 'border-border bg-transparent text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy'
              }`}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.name}
            </button>
          ))}
        </div>

        {/* Stats Bar — 3-column grid matching mock */}
        {activeView === 'manager' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                <ClipboardDocumentCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold leading-tight text-foreground">
                  {activeRuleCount}
                </div>
                <div className="text-[0.8125rem] text-muted-foreground mt-1">
                  Active Rules
                </div>
              </div>
            </div>

            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                <BoltIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold leading-tight text-foreground">
                  {executionsTodayCount}
                </div>
                <div className="text-[0.8125rem] text-muted-foreground mt-1">
                  Executions Today
                </div>
              </div>
            </div>

            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform">
              <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                <ShieldCheckIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold leading-tight text-foreground">
                  {successRate}%
                </div>
                <div className="text-[0.8125rem] text-muted-foreground mt-1">
                  Success Rate
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {activeView === 'manager' && (
            <WorkflowManager
              workflows={workflows}
              executions={executions}
              onCreateWorkflow={handleCreateWorkflow}
              onEditWorkflow={handleEditWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onDuplicateWorkflow={handleDuplicateWorkflow}
              onToggleWorkflow={handleToggleWorkflow}
              onRunWorkflow={handleRunWorkflow}
              onStopExecution={handleStopExecution}
              onViewExecution={handleViewExecution}
            />
          )}

          {activeView === 'builder' && (
            <WorkflowBuilder
              workflow={selectedWorkflow || undefined}
              onSave={handleSaveWorkflow}
              onTest={handleTestWorkflow}
              availableFields={[
                { id: 'applicant_name', name: 'Applicant Name', type: 'string' },
                { id: 'job_title', name: 'Job Title', type: 'string' },
                { id: 'experience_years', name: 'Years of Experience', type: 'number' },
                { id: 'skill_match', name: 'Skill Match %', type: 'number' },
              ]}
              availableUsers={availableUsers}
            />
          )}

          {activeView === 'library' && (
            <WorkflowLibrary
              workflows={workflows}
              onSelectWorkflow={handleSelectWorkflow}
              onCreateWorkflow={handleCreateWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onDuplicateWorkflow={handleDuplicateWorkflow}
              onImportWorkflow={handleImportWorkflow}
              onExportWorkflow={handleExportWorkflow}
            />
          )}

          {activeView === 'approvals' && (
            <ApprovalCenter
              requests={approvalRequests}
              currentUserId={user.id}
              onApprove={handleApprove}
              onReject={handleReject}
              onAddComment={handleAddComment}
              onViewDetails={handleViewApprovalDetails}
            />
          )}
        </div>
      </div>

      {/* Execution Detail Modal — matching mock modal styling */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-card rounded-[16px] shadow-lg w-full max-w-[640px] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6">
              <h2 className="text-xl font-bold text-foreground">Execution Details</h2>
              <button
                onClick={() => setSelectedExecution(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-6 space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Workflow</span>
                <span className="text-foreground font-medium">{selectedExecution.workflowName}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-button text-[0.6875rem] font-semibold ${
                  selectedExecution.status === 'completed' ? 'bg-surface-teal text-accent-teal' :
                  selectedExecution.status === 'failed' ? 'bg-icon-bg-pink text-accent-pink' :
                  selectedExecution.status === 'running' ? 'bg-icon-bg-navy text-accent-navy' :
                  'bg-icon-bg-gold text-accent-gold'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedExecution.status === 'completed' ? 'bg-accent-teal' :
                    selectedExecution.status === 'failed' ? 'bg-accent-pink' :
                    selectedExecution.status === 'running' ? 'bg-accent-navy' :
                    'bg-accent-gold'
                  }`} />
                  <span className="capitalize">{selectedExecution.status}</span>
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Started</span>
                <span className="text-foreground">{new Date(selectedExecution.startedAt).toLocaleString()}</span>
              </div>
              {selectedExecution.completedAt && (
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="font-semibold text-muted-foreground">Completed</span>
                  <span className="text-foreground">{new Date(selectedExecution.completedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Triggered By</span>
                <span className="text-foreground">{selectedExecution.triggeredBy}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="font-semibold text-muted-foreground">Progress</span>
                <span className="text-foreground">{selectedExecution.currentStep ?? 0} / {selectedExecution.totalSteps} steps</span>
              </div>
              {selectedExecution.executionLog.length > 0 && (
                <div className="pt-2">
                  <p className="text-[0.75rem] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-2 border-b border-border">
                    Execution Log
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-surface-navy p-3 rounded-control">
                    {selectedExecution.executionLog.map((entry) => (
                      <div key={entry.id} className="text-xs text-foreground">
                        <span className="text-muted-foreground">{new Date(entry.timestamp).toLocaleTimeString()}</span>{' '}
                        {entry.action} — <span className="capitalize">{entry.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedExecution(null)}
                className="inline-flex items-center px-5 py-2 text-sm font-semibold text-muted-foreground bg-transparent hover:bg-surface-navy hover:text-primary rounded-button transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteWorkflowId !== null}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDeleteWorkflow}
        onCancel={() => setDeleteWorkflowId(null)}
      />
    </PageWrapper>
  );
}
