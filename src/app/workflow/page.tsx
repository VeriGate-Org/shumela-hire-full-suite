'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import PageWrapper from '../../components/PageWrapper';
import { 
  WorkflowBuilder,
  WorkflowManager,
  WorkflowLibrary,
  ApprovalCenter,
  WorkflowDefinition,
  WorkflowExecution,
  ApprovalRequest
} from '../../components/workflow';
import {
  Cog6ToothIcon,
  PlayCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function WorkflowPage() {
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'manager' | 'builder' | 'library' | 'approvals'>('manager');
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = () => {
    // Demo workflows
    const demoWorkflows: WorkflowDefinition[] = [
      {
        id: 'wf-001',
        name: 'New Application Processing',
        description: 'Automated workflow for processing new job applications',
        trigger: {
          id: 'trigger-001',
          name: 'Application Received',
          description: 'Triggered when a new job application is received',
          type: 'application_received',
          conditions: [],
        },
        steps: [
          {
            id: 'step-001',
            name: 'Initial Screening',
            description: 'Automatically screen incoming applications',
            actions: [
              {
                id: 'action-001',
                name: 'Screen Application',
                description: 'Send acknowledgment email to applicant',
                type: 'send_email',
                config: {
                  template: 'application_received',
                  recipient: 'applicant',
                },
              },
            ],
          },
          {
            id: 'step-002',
            name: 'HR Review',
            description: 'Human Resources team review',
            actions: [],
            approvalRequired: true,
            approvers: ['hr@company.com'],
          },
        ],
        isActive: true,
        tags: ['application', 'screening', 'hr'],
        createdBy: 'John Doe',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        version: 1.2,
      },
      {
        id: 'wf-002',
        name: 'Interview Scheduling',
        description: 'Automated interview scheduling and coordination',
        trigger: {
          id: 'trigger-002',
          name: 'Application Approved',
          description: 'Manually triggered when an application is approved',
          type: 'manual',
          conditions: [],
        },
        steps: [
          {
            id: 'step-003',
            name: 'Schedule Interview',
            description: 'Create calendar event for interview',
            actions: [
              {
                id: 'action-002',
                name: 'Create Calendar Event',
                description: 'Schedule interview with candidate',
                type: 'schedule_interview',
                config: {
                  duration: 60,
                  buffer: 15,
                },
              },
            ],
          },
        ],
        isActive: true,
        tags: ['interview', 'scheduling'],
        createdBy: 'Jane Smith',
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T16:45:00Z',
        version: 2.0,
      },
    ];

    // Demo executions
    const demoExecutions: WorkflowExecution[] = [
      {
        id: 'exec-001',
        workflowId: 'wf-001',
        workflowName: 'New Application Processing',
        status: 'running',
        startedAt: '2024-01-22T08:30:00Z',
        triggeredBy: 'system',
        context: { applicantId: 'app-123', jobId: 'job-456' },
        currentStep: 1,
        totalSteps: 2,
        executionLog: [
          {
            id: 'log-001',
            timestamp: '2024-01-22T08:30:00Z',
            step: 1,
            action: 'Initial Screening',
            status: 'completed',
            message: 'Email sent to applicant',
            duration: 2000,
          },
        ],
      },
      {
        id: 'exec-002',
        workflowId: 'wf-001',
        workflowName: 'New Application Processing',
        status: 'completed',
        startedAt: '2024-01-21T14:15:00Z',
        completedAt: '2024-01-21T16:22:00Z',
        triggeredBy: 'john.doe@company.com',
        context: { applicantId: 'app-124', jobId: 'job-457' },
        currentStep: 2,
        totalSteps: 2,
        executionLog: [
          {
            id: 'log-002',
            timestamp: '2024-01-21T14:15:00Z',
            step: 1,
            action: 'Initial Screening',
            status: 'completed',
            message: 'Email sent to applicant',
            duration: 1800,
          },
          {
            id: 'log-003',
            timestamp: '2024-01-21T16:20:00Z',
            step: 2,
            action: 'HR Review',
            status: 'completed',
            message: 'Approved by HR team',
            duration: 120000,
          },
        ],
      },
    ];

    // Demo approval requests
    const demoApprovals: ApprovalRequest[] = [
      {
        id: 'appr-001',
        workflowId: 'wf-001',
        workflowName: 'New Application Processing',
        executionId: 'exec-003',
        stepId: 'step-002',
        stepName: 'HR Review',
        requester: {
          id: 'user-001',
          name: 'John Doe',
          email: 'john.doe@company.com',
        },
        approvers: [
          {
            id: 'user-002',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@company.com',
            isRequired: true,
          },
          {
            id: 'user-003',
            name: 'Mike Johnson',
            email: 'mike.johnson@company.com',
            isRequired: false,
          },
        ],
        title: 'Review Application for Senior Developer Position',
        description: 'Please review the application from Jane Smith for the Senior Developer position. The candidate has 5+ years of React experience.',
        priority: 'medium',
        status: 'pending',
        createdAt: '2024-01-22T09:15:00Z',
        context: {
          applicantName: 'Jane Smith',
          position: 'Senior Developer',
          resumeUrl: '/resumes/jane-smith.pdf',
        },
        approvals: [],
        comments: [
          {
            id: 'comment-001',
            authorId: 'user-001',
            authorName: 'John Doe',
            content: 'Strong technical background, meets all requirements.',
            timestamp: '2024-01-22T09:20:00Z',
          },
        ],
      },
    ];

    setWorkflows(demoWorkflows);
    setExecutions(demoExecutions);
    setApprovalRequests(demoApprovals);
  };

  // Workflow actions
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

  const handleSaveWorkflow = (workflow: WorkflowDefinition) => {
    if (isEditing && selectedWorkflow) {
      setWorkflows(prev => prev.map(w => w.id === workflow.id ? workflow : w));
    } else {
      setWorkflows(prev => [...prev, { ...workflow, id: `wf-${Date.now()}` }]);
    }
    setActiveView('manager');
    setSelectedWorkflow(null);
    setIsEditing(false);
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== workflowId));
  };

  const handleDuplicateWorkflow = (workflow: WorkflowDefinition) => {
    const duplicated = {
      ...workflow,
      id: `wf-${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setWorkflows(prev => [...prev, duplicated]);
  };

  const handleToggleWorkflow = (workflowId: string, isActive: boolean) => {
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId ? { ...w, isActive } : w
    ));
  };

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
  };

  const handleStopExecution = (executionId: string) => {
    setExecutions(prev => prev.map(e => 
      e.id === executionId ? { ...e, status: 'cancelled' as const, completedAt: new Date().toISOString() } : e
    ));
  };

  const handleViewExecution = (execution: WorkflowExecution) => {
    // Implementation for viewing execution details
    console.log('View execution:', execution);
  };

  const handleSelectWorkflow = (workflow: WorkflowDefinition) => {
    setSelectedWorkflow(workflow);
    setIsEditing(true);
    setActiveView('builder');
  };

  const handleImportWorkflow = () => {
    // Implementation for importing workflow
    console.log('Import workflow');
  };

  const handleExportWorkflow = (workflow: WorkflowDefinition) => {
    // Implementation for exporting workflow
    const dataStr = JSON.stringify(workflow, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
    link.click();
  };

  // Approval actions
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
    // Implementation for viewing approval details
    console.log('View approval details:', request);
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

  const actions = (
    <div className="flex items-center gap-3">
      {activeView !== 'builder' && (
        <button
          onClick={handleCreateWorkflow}
          className="px-4 py-2 text-sm font-medium bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full flex items-center gap-2"
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
              onTest={(workflow) => console.log('Test workflow:', workflow)}
              availableFields={[
                { id: 'applicant_name', name: 'Applicant Name', type: 'string' },
                { id: 'job_title', name: 'Job Title', type: 'string' },
                { id: 'experience_years', name: 'Years of Experience', type: 'number' },
                { id: 'skill_match', name: 'Skill Match %', type: 'number' },
              ]}
              availableUsers={[
                { id: 'user-001', name: 'John Doe', email: 'john.doe@company.com', role: 'HR_MANAGER' },
                { id: 'user-002', name: 'Sarah Wilson', email: 'sarah.wilson@company.com', role: 'RECRUITER' },
                { id: 'user-003', name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'Team Lead' },
              ]}
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
    </PageWrapper>
  );
}