'use client';

import React, { useState, useCallback } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  Cog6ToothIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export interface WorkflowTrigger {
  id: string;
  type: 'application_received' | 'interview_scheduled' | 'interview_completed' | 'offer_extended' | 'offer_accepted' | 'manual' | 'scheduled';
  name: string;
  description: string;
  conditions?: WorkflowCondition[];
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  id: string;
  type: 'send_email' | 'create_task' | 'update_status' | 'schedule_interview' | 'generate_report' | 'approve_request' | 'reject_request' | 'assign_recruiter' | 'notify_team';
  name: string;
  description: string;
  config: Record<string, any>;
  delay?: number; // in minutes
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  actions: WorkflowAction[];
  conditions?: WorkflowCondition[];
  approvalRequired?: boolean;
  approvers?: string[];
  timeoutMinutes?: number;
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  version: number;
  tags: string[];
}

interface WorkflowBuilderProps {
  workflow?: WorkflowDefinition;
  onSave: (workflow: WorkflowDefinition) => void;
  onTest: (workflow: WorkflowDefinition) => void;
  availableFields: { id: string; name: string; type: string }[];
  availableUsers: { id: string; name: string; email: string; role: string }[];
  className?: string;
}

const WORKFLOW_TRIGGERS: WorkflowTrigger[] = [
  {
    id: 'app_received',
    type: 'application_received',
    name: 'Application Received',
    description: 'Triggered when a new job application is submitted',
  },
  {
    id: 'interview_scheduled',
    type: 'interview_scheduled',
    name: 'Interview Scheduled',
    description: 'Triggered when an interview is scheduled with a candidate',
  },
  {
    id: 'interview_completed',
    type: 'interview_completed',
    name: 'Interview Completed',
    description: 'Triggered when an interview is marked as completed',
  },
  {
    id: 'offer_extended',
    type: 'offer_extended',
    name: 'Offer Extended',
    description: 'Triggered when a job offer is extended to a candidate',
  },
  {
    id: 'offer_accepted',
    type: 'offer_accepted',
    name: 'Offer Accepted',
    description: 'Triggered when a candidate accepts a job offer',
  },
  {
    id: 'manual',
    type: 'manual',
    name: 'Manual Trigger',
    description: 'Manually triggered by a user when needed',
  },
];

const ACTION_TYPES = [
  {
    type: 'send_email',
    name: 'Send Email',
    description: 'Send automated email to specified recipients',
    icon: '📧',
    config: {
      recipients: { type: 'array', label: 'Recipients', required: true },
      subject: { type: 'string', label: 'Subject', required: true },
      template: { type: 'select', label: 'Email Template', required: true },
    },
  },
  {
    type: 'create_task',
    name: 'Create Task',
    description: 'Create a task for team members',
    icon: '✅',
    config: {
      assignee: { type: 'select', label: 'Assignee', required: true },
      title: { type: 'string', label: 'Task Title', required: true },
      description: { type: 'text', label: 'Description', required: false },
      dueDate: { type: 'number', label: 'Due in (days)', required: false },
    },
  },
  {
    type: 'update_status',
    name: 'Update Status',
    description: 'Update application or candidate status',
    icon: '🔄',
    config: {
      entity: { type: 'select', label: 'Entity Type', required: true },
      status: { type: 'select', label: 'New Status', required: true },
    },
  },
  {
    type: 'schedule_interview',
    name: 'Schedule Interview',
    description: 'Automatically schedule interview with candidate',
    icon: '📅',
    config: {
      interviewer: { type: 'select', label: 'Interviewer', required: true },
      duration: { type: 'number', label: 'Duration (minutes)', required: true },
      type: { type: 'select', label: 'Interview Type', required: true },
    },
  },
  {
    type: 'generate_report',
    name: 'Generate Report',
    description: 'Generate and send automated report',
    icon: '📊',
    config: {
      reportTemplate: { type: 'select', label: 'Report Template', required: true },
      recipients: { type: 'array', label: 'Recipients', required: true },
    },
  },
  {
    type: 'approve_request',
    name: 'Approve Request',
    description: 'Automatically approve pending requests',
    icon: '✅',
    config: {
      requestType: { type: 'select', label: 'Request Type', required: true },
    },
  },
  {
    type: 'notify_team',
    name: 'Notify Team',
    description: 'Send notification to team members',
    icon: '🔔',
    config: {
      team: { type: 'select', label: 'Team', required: true },
      message: { type: 'text', label: 'Message', required: true },
      channel: { type: 'select', label: 'Notification Channel', required: true },
    },
  },
];

export default function WorkflowBuilder({
  workflow,
  onSave,
  onTest,
  availableFields,
  availableUsers,
  className = '',
}: WorkflowBuilderProps) {
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowDefinition>(
    workflow || {
      name: '',
      description: '',
      trigger: WORKFLOW_TRIGGERS[0],
      steps: [],
      isActive: false,
      version: 1,
      tags: [],
    }
  );

  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleUpdateWorkflow = useCallback((updates: Partial<WorkflowDefinition>) => {
    setCurrentWorkflow(prev => ({ ...prev, ...updates }));
  }, []);

  const handleAddStep = useCallback(() => {
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      name: `Step ${currentWorkflow.steps.length + 1}`,
      description: '',
      actions: [],
    };
    
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    setActiveStep(newStep.id);
  }, [currentWorkflow.steps]);

  const handleUpdateStep = useCallback((stepId: string, updates: Partial<WorkflowStep>) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const handleDeleteStep = useCallback((stepId: string) => {
    setCurrentWorkflow(prev => ({
      ...prev,
      steps: prev.steps.filter(step => step.id !== stepId)
    }));
    if (activeStep === stepId) {
      setActiveStep(null);
    }
  }, [activeStep]);

  const handleAddAction = useCallback((stepId: string, actionType: string) => {
    const actionConfig = ACTION_TYPES.find(at => at.type === actionType);
    if (!actionConfig) return;

    const newAction: WorkflowAction = {
      id: `action_${Date.now()}`,
      type: actionType as any,
      name: actionConfig.name,
      description: actionConfig.description,
      config: {},
    };

    handleUpdateStep(stepId, {
      actions: [...(currentWorkflow.steps.find(s => s.id === stepId)?.actions || []), newAction]
    });
  }, [currentWorkflow.steps, handleUpdateStep]);

  const handleUpdateAction = useCallback((stepId: string, actionId: string, updates: Partial<WorkflowAction>) => {
    const step = currentWorkflow.steps.find(s => s.id === stepId);
    if (!step) return;

    const updatedActions = step.actions.map(action =>
      action.id === actionId ? { ...action, ...updates } : action
    );

    handleUpdateStep(stepId, { actions: updatedActions });
  }, [currentWorkflow.steps, handleUpdateStep]);

  const handleDeleteAction = useCallback((stepId: string, actionId: string) => {
    const step = currentWorkflow.steps.find(s => s.id === stepId);
    if (!step) return;

    handleUpdateStep(stepId, {
      actions: step.actions.filter(action => action.id !== actionId)
    });
  }, [currentWorkflow.steps, handleUpdateStep]);

  const renderActionConfig = (action: WorkflowAction, stepId: string) => {
    const actionType = ACTION_TYPES.find(at => at.type === action.type);
    if (!actionType) return null;

    return (
      <div className="mt-4 space-y-3">
        {Object.entries(actionType.config).map(([key, configField]) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {(configField as any).label}
              {(configField as any).required && <span className="text-red-500 ml-1">*</span>}
            </label>
            
            {(configField as any).type === 'string' && (
              <input
                type="text"
                value={action.config[key] || ''}
                onChange={(e) => handleUpdateAction(stepId, action.id, {
                  config: { ...action.config, [key]: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            )}
            
            {(configField as any).type === 'text' && (
              <textarea
                value={action.config[key] || ''}
                onChange={(e) => handleUpdateAction(stepId, action.id, {
                  config: { ...action.config, [key]: e.target.value }
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            )}
            
            {(configField as any).type === 'number' && (
              <input
                type="number"
                value={action.config[key] || ''}
                onChange={(e) => handleUpdateAction(stepId, action.id, {
                  config: { ...action.config, [key]: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            )}
            
            {(configField as any).type === 'select' && (
              <select
                value={action.config[key] || ''}
                onChange={(e) => handleUpdateAction(stepId, action.id, {
                  config: { ...action.config, [key]: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              >
                <option value="">Select...</option>
                {key === 'assignee' || key === 'interviewer' ? (
                  availableUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))
                ) : (
                  <option value="sample">Sample Option</option>
                )}
              </select>
            )}
          </div>
        ))}
        
        {action.type !== 'send_email' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delay (minutes)
            </label>
            <input
              type="number"
              value={action.delay || 0}
              onChange={(e) => handleUpdateAction(stepId, action.id, {
                delay: parseInt(e.target.value) || 0
              })}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Wait time before executing this action
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflow Builder</h2>
            <p className="text-sm text-gray-500 mt-1">
              Create automated workflows to streamline recruitment processes
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTest(currentWorkflow)}
              disabled={!currentWorkflow.name.trim()}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <PlayIcon className="h-4 w-4 inline mr-1" />
              Test
            </button>
            
            <button
              onClick={() => onSave(currentWorkflow)}
              disabled={!currentWorkflow.name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              Save Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Workflow Configuration */}
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              value={currentWorkflow.name}
              onChange={(e) => handleUpdateWorkflow({ name: e.target.value })}
              placeholder="Enter workflow name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={currentWorkflow.isActive}
                onChange={(e) => handleUpdateWorkflow({ isActive: e.target.checked })}
                className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500/60"
              />
              <label className="ml-2 text-sm text-gray-700">
                Active (workflow will run automatically)
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={currentWorkflow.description}
            onChange={(e) => handleUpdateWorkflow({ description: e.target.value })}
            placeholder="Describe what this workflow does..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>

        {/* Trigger Configuration */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Trigger Configuration</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trigger Event
            </label>
            <select
              value={currentWorkflow.trigger.id}
              onChange={(e) => {
                const trigger = WORKFLOW_TRIGGERS.find(t => t.id === e.target.value);
                if (trigger) {
                  handleUpdateWorkflow({ trigger });
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            >
              {WORKFLOW_TRIGGERS.map((trigger) => (
                <option key={trigger.id} value={trigger.id}>
                  {trigger.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {currentWorkflow.trigger.description}
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-gray-900">Workflow Steps</h3>
            <button
              onClick={handleAddStep}
              className="px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
            >
              Add Step
            </button>
          </div>

          {currentWorkflow.steps.length === 0 ? (
            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No steps added yet</p>
              <p className="text-sm">Click "Add Step" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentWorkflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`border rounded-lg ${
                    activeStep === step.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{step.name}</h4>
                          {step.description && (
                            <p className="text-sm text-gray-500">{step.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {step.actions.length} actions
                        </span>
                        <button
                          onClick={() => setActiveStep(activeStep === step.id ? null : step.id)}
                          className="p-1 text-gray-400 hover:text-violet-600"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteStep(step.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <XCircleIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Step Configuration */}
                    {activeStep === step.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Step Name
                            </label>
                            <input
                              type="text"
                              value={step.name}
                              onChange={(e) => handleUpdateStep(step.id, { name: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Timeout (minutes)
                            </label>
                            <input
                              type="number"
                              value={step.timeoutMinutes || 0}
                              onChange={(e) => handleUpdateStep(step.id, { 
                                timeoutMinutes: parseInt(e.target.value) || undefined 
                              })}
                              min="0"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={step.description}
                            onChange={(e) => handleUpdateStep(step.id, { description: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                          />
                        </div>

                        {/* Approval Configuration */}
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={step.approvalRequired || false}
                              onChange={(e) => handleUpdateStep(step.id, { 
                                approvalRequired: e.target.checked 
                              })}
                              className="h-4 w-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500/60"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                              Require approval before executing this step
                            </span>
                          </label>
                          
                          {step.approvalRequired && (
                            <div className="mt-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Approvers
                              </label>
                              <select
                                multiple
                                value={step.approvers || []}
                                onChange={(e) => {
                                  const values = Array.from(e.target.selectedOptions, option => option.value);
                                  handleUpdateStep(step.id, { approvers: values });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                                size={3}
                              >
                                {availableUsers.map(user => (
                                  <option key={user.id} value={user.id}>
                                    {user.name} ({user.role})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-sm font-medium text-gray-900">Actions</h5>
                            <div className="relative group">
                              <button className="px-2 py-1 text-sm font-medium text-violet-600 bg-violet-50 rounded hover:bg-violet-100">
                                Add Action
                              </button>
                              <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                                <div className="py-1 max-h-64 overflow-y-auto">
                                  {ACTION_TYPES.map((actionType) => (
                                    <button
                                      key={actionType.type}
                                      onClick={() => handleAddAction(step.id, actionType.type)}
                                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                    >
                                      <span className="mr-2">{actionType.icon}</span>
                                      <div>
                                        <div className="font-medium">{actionType.name}</div>
                                        <div className="text-xs text-gray-500">{actionType.description}</div>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {step.actions.length === 0 ? (
                            <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded">
                              No actions configured
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {step.actions.map((action) => {
                                const actionType = ACTION_TYPES.find(at => at.type === action.type);
                                return (
                                  <div key={action.id} className="p-3 border border-gray-200 rounded bg-gray-50">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{actionType?.icon}</span>
                                        <div>
                                          <div className="font-medium text-sm">{action.name}</div>
                                          <div className="text-xs text-gray-500">{action.description}</div>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleDeleteAction(step.id, action.id)}
                                        className="p-1 text-gray-400 hover:text-red-600"
                                      >
                                        <XCircleIcon className="h-4 w-4" />
                                      </button>
                                    </div>
                                    {renderActionConfig(action, step.id)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={currentWorkflow.tags.join(', ')}
            onChange={(e) => handleUpdateWorkflow({ 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
            })}
            placeholder="automation, onboarding, notifications..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>
      </div>
    </div>
  );
}
