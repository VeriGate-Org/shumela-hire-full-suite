'use client';

import React, { useState, useEffect } from 'react';
import { JobAdTemplate, JobAdDraft, TemplateStats } from '../../types/jobTemplate';
import { jobTemplateService } from '../../services/jobTemplateService';
import TemplateList from '../../components/templates/TemplateList';
import TemplateEditor from '../../components/templates/TemplateEditor';
import GenerateFromTemplate from '../../components/templates/GenerateFromTemplate';
import { 
  DocumentTextIcon,
  PlusIcon,
  SparklesIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

const JobTemplatesPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'list' | 'editor' | 'generate'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<JobAdTemplate | null>(null);
  const [stats, setStats] = useState<TemplateStats | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load stats
        const templateStats = await jobTemplateService.getTemplateStats();
        setStats(templateStats);
      } catch (error) {
        console.error('Error initializing template data:', error);
      }
    };

    initializeData();
  }, []);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setActiveView('editor');
  };

  const handleEdit = (template: JobAdTemplate) => {
    setSelectedTemplate(template);
    setActiveView('editor');
  };

  const handleGenerate = (template: JobAdTemplate) => {
    setSelectedTemplate(template);
    setActiveView('generate');
  };

  const handleSave = async (template: JobAdTemplate) => {
    console.log('Template saved:', template);
    setActiveView('list');
    setSelectedTemplate(null);
    
    // Refresh stats
    const templateStats = await jobTemplateService.getTemplateStats();
    setStats(templateStats);
  };

  const handleGenerated = (draft: JobAdDraft) => {
    console.log('Job ad generated:', draft);
    alert('Job ad draft created successfully! In a real app, this would redirect to the draft editor.');
    setActiveView('list');
    setSelectedTemplate(null);
  };

  const handleCancel = () => {
    setActiveView('list');
    setSelectedTemplate(null);
  };

  const renderHeader = () => (
    <div className="bg-white shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <DocumentTextIcon className="w-8 h-8 mr-3" />
              Job Ad Template Manager
            </h1>
            <p className="text-gray-600 mt-1">
              Create, manage, and generate job advertisements from reusable templates
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Stats Overview */}
            {stats && (
              <div className="hidden md:flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gold-600">{stats.activeTemplates}</div>
                  <div className="text-gray-500">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.totalTemplates}</div>
                  <div className="text-gray-500">Total</div>
                </div>
                {stats.mostUsedTemplate && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.mostUsedTemplate.usageCount}</div>
                    <div className="text-gray-500">Most Used</div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveView('list')}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === 'list'
                    ? 'bg-gold-500 text-violet-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <DocumentTextIcon className="w-4 h-4 inline mr-2" />
                Templates
              </button>
              
              <button
                onClick={handleCreateNew}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === 'editor'
                    ? 'bg-gold-500 text-violet-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <PlusIcon className="w-4 h-4 inline mr-2" />
                Create
              </button>
              
              <button
                onClick={() => setActiveView('generate')}
                className={`px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === 'generate'
                    ? 'bg-gold-500 text-violet-950'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SparklesIcon className="w-4 h-4 inline mr-2" />
                Generate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Features Banner */}
        <div className="mb-8 bg-violet-600 rounded-sm p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Job Ad Template Manager Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-1">📝 Rich Template Editor</h3>
              <p className="opacity-90">Create templates with placeholders, rich text formatting, and live preview</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">🔄 Smart Generation</h3>
              <p className="opacity-90">Generate job ads from templates + requisition data with automatic placeholder replacement</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">📊 Template Management</h3>
              <p className="opacity-90">Full CRUD operations, archiving, duplication, search, and usage analytics</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-sm shadow-lg min-h-[600px]">
          {activeView === 'list' && (
            <TemplateList
              onEdit={handleEdit}
              onGenerate={handleGenerate}
              onCreateNew={handleCreateNew}
              className="p-6"
            />
          )}

          {activeView === 'editor' && (
            <TemplateEditor
              template={selectedTemplate || undefined}
              onSave={handleSave}
              onCancel={handleCancel}
              className="h-full"
            />
          )}

          {activeView === 'generate' && (
            <GenerateFromTemplate
              template={selectedTemplate || undefined}
              onGenerated={handleGenerated}
              onCancel={handleCancel}
              className="p-6"
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-sm shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Available Placeholders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              '{{jobTitle}}', '{{department}}', '{{location}}', '{{employmentType}}',
              '{{salaryRange}}', '{{companyName}}', '{{contactEmail}}', '{{applicationDeadline}}'
            ].map((placeholder) => (
              <div key={placeholder} className="flex items-center">
                <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                  {placeholder}
                </code>
              </div>
            ))}
          </div>
          <p className="text-gray-600 mt-4 text-sm">
            Use these placeholders in your templates to automatically populate job-specific information when generating ads.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JobTemplatesPage;