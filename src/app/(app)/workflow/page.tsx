'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import PageWrapper from '@/components/PageWrapper';
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

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Please log in to access the workflow automation system.</p>
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
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">Workflow management is available to administrators and HR managers.</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  const actions = (
    <div className="flex items-center gap-3">
      {activeView !== 'builder' && (
        <button
          onClick={handleCreateWorkflow}
          className="px-4 py-2 text-sm font-medium bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full flex items-center gap-2"
        >
          <PlusIcon className="h-4 w-4" />
          Create Workflow
        </button>
      )}
    </div>
  );

  return (
    <PageWrapper
      title="Workflow Automation"
      subtitle="Design, manage, and monitor automated recruitment workflows"
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
        {/* Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'manager' as const, name: 'Manager', icon: PlayCircleIcon, desc: 'Monitor workflows and executions' },
              { id: 'builder' as const, name: 'Builder', icon: Cog6ToothIcon, desc: 'Design and edit workflows' },
              { id: 'library' as const, name: 'Library', icon: DocumentTextIcon, desc: 'Browse workflow templates' },
              { id: 'approvals' as const, name: 'Approvals', icon: CheckCircleIcon, desc: 'Manage approval requests' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-gold-100 text-violet-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <div className="text-left">
                  <div>{item.name}</div>
                  <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
              </button>
            ))}
          </nav>
        </div>

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

      {/* Execution Detail Modal */}
      {selectedExecution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-sm shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Execution Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Workflow</span>
                <span>{selectedExecution.workflowName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Status</span>
                <span className="capitalize">{selectedExecution.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Started</span>
                <span>{new Date(selectedExecution.startedAt).toLocaleString()}</span>
              </div>
              {selectedExecution.completedAt && (
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Completed</span>
                  <span>{new Date(selectedExecution.completedAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Triggered By</span>
                <span>{selectedExecution.triggeredBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-600">Progress</span>
                <span>{selectedExecution.currentStep ?? 0} / {selectedExecution.totalSteps} steps</span>
              </div>
              {selectedExecution.executionLog.length > 0 && (
                <div>
                  <p className="font-medium text-gray-600 mb-2">Execution Log</p>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 p-2 rounded-sm">
                    {selectedExecution.executionLog.map((entry) => (
                      <div key={entry.id} className="text-xs text-gray-700">
                        <span className="text-gray-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>{' '}
                        {entry.action} — <span className="capitalize">{entry.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedExecution(null)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
