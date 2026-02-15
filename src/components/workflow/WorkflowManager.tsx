'use client';

import React, { useState, useCallback } from 'react';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { WorkflowDefinition } from './WorkflowBuilder';

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
  context: Record<string, any>;
  currentStep?: number;
  totalSteps: number;
  executionLog: ExecutionLogEntry[];
  error?: string;
}

export interface ExecutionLogEntry {
  id: string;
  timestamp: string;
  step: number;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  message: string;
  details?: Record<string, any>;
  duration?: number;
}

interface WorkflowManagerProps {
  workflows: WorkflowDefinition[];
  executions: WorkflowExecution[];
  onCreateWorkflow: () => void;
  onEditWorkflow: (workflow: WorkflowDefinition) => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onDuplicateWorkflow: (workflow: WorkflowDefinition) => void;
  onToggleWorkflow: (workflowId: string, isActive: boolean) => void;
  onRunWorkflow: (workflowId: string) => void;
  onStopExecution: (executionId: string) => void;
  onViewExecution: (execution: WorkflowExecution) => void;
  className?: string;
}

export default function WorkflowManager({
  workflows,
  executions,
  onCreateWorkflow,
  onEditWorkflow,
  onDeleteWorkflow,
  onDuplicateWorkflow,
  onToggleWorkflow,
  onRunWorkflow,
  onStopExecution,
  onViewExecution,
  className = '',
}: WorkflowManagerProps) {
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions'>('workflows');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter workflows
  const filteredWorkflows = workflows.filter(workflow => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!workflow.name.toLowerCase().includes(query) &&
          !workflow.description.toLowerCase().includes(query) &&
          !workflow.tags.some(tag => tag.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    if (statusFilter === 'active' && !workflow.isActive) return false;
    if (statusFilter === 'inactive' && workflow.isActive) return false;
    
    return true;
  });

  // Filter executions
  const filteredExecutions = executions.filter(execution => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!execution.workflowName.toLowerCase().includes(query) &&
          !execution.triggeredBy.toLowerCase().includes(query)) {
        return false;
      }
    }
    
    if (statusFilter !== 'all' && execution.status !== statusFilter) return false;
    
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <ClockIcon className="h-4 w-4 text-violet-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case 'paused':
        return <PauseIcon className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <StopIcon className="h-4 w-4 text-gray-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-violet-100 text-violet-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getRunningExecutions = () => {
    return executions.filter(e => e.status === 'running').length;
  };

  const getSuccessRate = () => {
    const completed = executions.filter(e => e.status === 'completed').length;
    const total = executions.filter(e => e.status !== 'running').length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflow Manager</h2>
            <p className="text-sm text-gray-500 mt-1">
              Manage automation workflows and monitor executions
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">{workflows.filter(w => w.isActive).length}</div>
                <div className="text-gray-500">Active</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{getRunningExecutions()}</div>
                <div className="text-gray-500">Running</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-900">{getSuccessRate()}%</div>
                <div className="text-gray-500">Success</div>
              </div>
            </div>
            
            <button
              onClick={onCreateWorkflow}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
            >
              Create Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="px-6 -mb-px flex space-x-8">
          {[
            { id: 'workflows' as const, name: 'Workflows', count: workflows.length },
            { id: 'executions' as const, name: 'Executions', count: executions.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-violet-500 text-violet-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
              <span className="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            >
              <option value="all">All Status</option>
              {activeTab === 'workflows' ? (
                <>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </>
              ) : (
                <>
                  <option value="running">Running</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="paused">Paused</option>
                  <option value="cancelled">Cancelled</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'workflows' ? (
          <div>
            {filteredWorkflows.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Create your first workflow to get started'}
                </p>
                <button
                  onClick={onCreateWorkflow}
                  className="px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
                >
                  Create Workflow
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredWorkflows.map((workflow) => (
                  <div key={workflow.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    {/* Workflow Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {workflow.name}
                        </h4>
                        {workflow.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-3">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 ml-2">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            workflow.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {workflow.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Workflow Details */}
                    <div className="space-y-2 mb-4 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>Trigger:</span>
                        <span className="font-medium">{workflow.trigger.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Steps:</span>
                        <span className="font-medium">{workflow.steps.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Version:</span>
                        <span className="font-medium">v{workflow.version}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {workflow.tags.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1">
                          {workflow.tags.slice(0, 3).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-violet-100 text-violet-700"
                            >
                              {tag}
                            </span>
                          ))}
                          {workflow.tags.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{workflow.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditWorkflow(workflow)}
                          className="p-1.5 text-gray-400 hover:text-violet-600 rounded"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateWorkflow(workflow)}
                          className="p-1.5 text-gray-400 hover:text-green-600 rounded"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDeleteWorkflow(workflow.id!)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleWorkflow(workflow.id!, !workflow.isActive)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg ${
                            workflow.isActive
                              ? 'text-yellow-700 bg-yellow-100 hover:bg-yellow-200'
                              : 'text-green-700 bg-green-100 hover:bg-green-200'
                          }`}
                        >
                          {workflow.isActive ? 'Pause' : 'Activate'}
                        </button>
                        
                        <button
                          onClick={() => onRunWorkflow(workflow.id!)}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
                        >
                          <PlayIcon className="h-3 w-3 inline mr-1" />
                          Run
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {filteredExecutions.length === 0 ? (
              <div className="text-center py-12">
                <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No executions found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Run a workflow to see execution history'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredExecutions.map((execution) => (
                  <div key={execution.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(execution.status)}
                          <h4 className="font-medium text-gray-900">{execution.workflowName}</h4>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                            {execution.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div>
                            <div className="font-medium">Started</div>
                            <div>{new Date(execution.startedAt).toLocaleString()}</div>
                          </div>
                          
                          <div>
                            <div className="font-medium">Duration</div>
                            <div>{formatDuration(execution.startedAt, execution.completedAt)}</div>
                          </div>
                          
                          <div>
                            <div className="font-medium">Progress</div>
                            <div>{execution.currentStep || 0}/{execution.totalSteps} steps</div>
                          </div>
                          
                          <div>
                            <div className="font-medium">Triggered By</div>
                            <div>{execution.triggeredBy}</div>
                          </div>
                        </div>
                        
                        {execution.error && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                            <div className="font-medium">Error:</div>
                            <div>{execution.error}</div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => onViewExecution(execution)}
                          className="p-2 text-gray-400 hover:text-violet-600 rounded"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {execution.status === 'running' && (
                          <button
                            onClick={() => onStopExecution(execution.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded"
                            title="Stop Execution"
                          >
                            <StopIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
