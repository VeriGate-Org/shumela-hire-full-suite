'use client';

import React, { useState } from 'react';
import {
  FolderOpenIcon,
  DocumentTextIcon,
  ShareIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  TagIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { WorkflowDefinition } from './WorkflowBuilder';

interface WorkflowLibraryProps {
  workflows: WorkflowDefinition[];
  onSelectWorkflow: (workflow: WorkflowDefinition) => void;
  onCreateWorkflow: () => void;
  onDeleteWorkflow: (workflowId: string) => void;
  onDuplicateWorkflow: (workflow: WorkflowDefinition) => void;
  onImportWorkflow: () => void;
  onExportWorkflow: (workflow: WorkflowDefinition) => void;
  className?: string;
}

interface WorkflowCategory {
  id: string;
  name: string;
  description: string;
  workflows: WorkflowDefinition[];
  color: string;
}

export default function WorkflowLibrary({
  workflows,
  onSelectWorkflow,
  onCreateWorkflow,
  onDeleteWorkflow,
  onDuplicateWorkflow,
  onImportWorkflow,
  onExportWorkflow,
  className = '',
}: WorkflowLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'modified' | 'usage'>('name');

  // Categorize workflows
  const categories: WorkflowCategory[] = [
    {
      id: 'all',
      name: 'All Workflows',
      description: 'All available workflows',
      workflows: workflows,
      color: 'blue',
    },
    {
      id: 'application',
      name: 'Application Processing',
      description: 'Workflows for handling job applications',
      workflows: workflows.filter(w => 
        w.tags.some(tag => ['application', 'screening', 'review'].includes(tag.toLowerCase()))
      ),
      color: 'green',
    },
    {
      id: 'interview',
      name: 'Interview Management',
      description: 'Workflows for scheduling and managing interviews',
      workflows: workflows.filter(w => 
        w.tags.some(tag => ['interview', 'scheduling', 'feedback'].includes(tag.toLowerCase()))
      ),
      color: 'purple',
    },
    {
      id: 'onboarding',
      name: 'Onboarding',
      description: 'Workflows for new hire onboarding',
      workflows: workflows.filter(w => 
        w.tags.some(tag => ['onboarding', 'hiring', 'welcome'].includes(tag.toLowerCase()))
      ),
      color: 'orange',
    },
    {
      id: 'notifications',
      name: 'Notifications',
      description: 'Automated notification workflows',
      workflows: workflows.filter(w => 
        w.tags.some(tag => ['notification', 'alert', 'reminder'].includes(tag.toLowerCase()))
      ),
      color: 'yellow',
    },
    {
      id: 'reporting',
      name: 'Reporting',
      description: 'Automated reporting workflows',
      workflows: workflows.filter(w => 
        w.tags.some(tag => ['report', 'analytics', 'metrics'].includes(tag.toLowerCase()))
      ),
      color: 'indigo',
    },
    {
      id: 'custom',
      name: 'Custom',
      description: 'Custom workflows',
      workflows: workflows.filter(w => 
        !w.tags.some(tag => [
          'application', 'screening', 'review', 'interview', 'scheduling', 'feedback',
          'onboarding', 'hiring', 'welcome', 'notification', 'alert', 'reminder',
          'report', 'analytics', 'metrics'
        ].includes(tag.toLowerCase()))
      ),
      color: 'gray',
    },
  ];

  // Filter and sort workflows
  const getCurrentWorkflows = () => {
    const categoryWorkflows = categories.find(c => c.id === selectedCategory)?.workflows || workflows;
    
    let filtered = categoryWorkflows.filter(workflow => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          workflow.name.toLowerCase().includes(query) ||
          workflow.description.toLowerCase().includes(query) ||
          workflow.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      return true;
    });

    // Sort workflows
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        case 'modified':
          return new Date(b.updatedAt || '').getTime() - new Date(a.updatedAt || '').getTime();
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  };

  const getCategoryColor = (color: string) => {
    const colors = {
      blue: 'bg-violet-100 text-violet-700 border-violet-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const currentWorkflows = getCurrentWorkflows();
  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Workflow Library</h2>
            <p className="text-sm text-gray-500 mt-1">
              Browse, search, and manage your automation workflows
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onImportWorkflow}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Import
            </button>
            <button
              onClick={onCreateWorkflow}
              className="px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700"
            >
              <PlusIcon className="h-4 w-4 inline mr-1" />
              New Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                selectedCategory === category.id
                  ? getCategoryColor(category.color)
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.name}
              <span className="ml-1 text-xs">
                ({category.workflows.length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            >
              <option value="name">Sort by Name</option>
              <option value="created">Sort by Created</option>
              <option value="modified">Sort by Modified</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === 'grid'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium ${
                viewMode === 'list'
                  ? 'bg-violet-100 text-violet-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {/* Category Info */}
        {currentCategory && (
          <div className="mt-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <h3 className="font-medium text-violet-900">{currentCategory.name}</h3>
            <p className="text-sm text-violet-700 mt-1">{currentCategory.description}</p>
            <p className="text-xs text-violet-600 mt-1">
              {currentWorkflows.length} workflow{currentWorkflows.length !== 1 ? 's' : ''} found
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {currentWorkflows.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpenIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery 
                ? 'Try adjusting your search terms or browse different categories'
                : 'Create your first workflow to get started'
              }
            </p>
            <button
              onClick={onCreateWorkflow}
              className="px-4 py-2 text-sm font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
            >
              Create Workflow
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectWorkflow(workflow)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">
                      {workflow.name}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-3">
                      {workflow.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportWorkflow(workflow);
                      }}
                      className="p-1 text-gray-400 hover:text-violet-600 rounded"
                      title="Export"
                    >
                      <ShareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWorkflow(workflow.id!);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                  <div>
                    <div className="font-medium">Steps</div>
                    <div>{workflow.steps.length}</div>
                  </div>
                  <div>
                    <div className="font-medium">Version</div>
                    <div>v{workflow.version}</div>
                  </div>
                </div>

                {/* Tags */}
                {workflow.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {workflow.tags.slice(0, 2).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {workflow.tags.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{workflow.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>{formatDate(workflow.updatedAt || '')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserIcon className="h-3 w-3" />
                      <span>{workflow.createdBy}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {currentWorkflows.map((workflow) => (
              <div
                key={workflow.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectWorkflow(workflow)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        workflow.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <span>Steps:</span>
                        <span className="font-medium">{workflow.steps.length}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>Version:</span>
                        <span className="font-medium">v{workflow.version}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Updated {formatDate(workflow.updatedAt || '')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        <span>{workflow.createdBy}</span>
                      </div>
                    </div>

                    {workflow.tags.length > 0 && (
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {workflow.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              <TagIcon className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateWorkflow(workflow);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Duplicate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportWorkflow(workflow);
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded hover:bg-violet-100"
                    >
                      Export
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
