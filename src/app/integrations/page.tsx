'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  CogIcon, 
  LinkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  logo: string;
  features: string[];
  lastSync?: string;
  dataFlow: 'bidirectional' | 'inbound' | 'outbound';
  isPopular: boolean;
  setupComplexity: 'easy' | 'medium' | 'complex';
}

interface IntegrationCategory {
  name: string;
  description: string;
  count: number;
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const categories: IntegrationCategory[] = [
    { name: 'all', description: 'All Integrations', count: 0 },
    { name: 'hrms', description: 'HR Management Systems', count: 0 },
    { name: 'accounting', description: 'Accounting & Payroll', count: 0 },
    { name: 'job-boards', description: 'Job Boards', count: 0 },
    { name: 'assessment', description: 'Assessment Tools', count: 0 },
    { name: 'communication', description: 'Communication', count: 0 },
    { name: 'background-check', description: 'Background Verification', count: 0 }
  ];

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    
    // Mock integration data
    const mockIntegrations: Integration[] = [
      // Accounting & Payroll Systems
      {
        id: 'sage',
        name: 'Sage',
        description: 'Enterprise accounting and payroll management system with comprehensive HR integration capabilities.',
        category: 'accounting',
        status: 'connected',
        logo: '🟢',
        features: ['Employee data sync', 'Payroll integration', 'Cost center mapping', 'Financial reporting', 'Tax compliance'],
        lastSync: '2024-01-21T10:30:00Z',
        dataFlow: 'bidirectional',
        isPopular: true,
        setupComplexity: 'medium'
      },
      {
        id: 'quickbooks',
        name: 'QuickBooks',
        description: 'Popular accounting software for small to medium businesses with payroll capabilities.',
        category: 'accounting',
        status: 'disconnected',
        logo: '🔵',
        features: ['Employee records', 'Payroll processing', 'Expense tracking', 'Financial reporting'],
        dataFlow: 'bidirectional',
        isPopular: true,
        setupComplexity: 'easy'
      },
      
      // HR Management Systems
      {
        id: 'workday',
        name: 'Workday',
        description: 'Enterprise cloud-based HR and financial management system.',
        category: 'hrms',
        status: 'connected',
        logo: '🟡',
        features: ['Employee lifecycle', 'Performance management', 'Learning & development', 'Analytics'],
        lastSync: '2024-01-21T09:15:00Z',
        dataFlow: 'bidirectional',
        isPopular: true,
        setupComplexity: 'complex'
      },
      {
        id: 'bamboohr',
        name: 'BambooHR',
        description: 'All-in-one HR software for small and medium-sized businesses.',
        category: 'hrms',
        status: 'connected',
        logo: '🟢',
        features: ['Employee database', 'Time tracking', 'Performance reviews', 'Reporting'],
        lastSync: '2024-01-21T08:45:00Z',
        dataFlow: 'bidirectional',
        isPopular: true,
        setupComplexity: 'medium'
      },
      
      // Job Boards
      {
        id: 'linkedin',
        name: 'LinkedIn Jobs',
        description: 'Professional networking platform with job posting and candidate sourcing.',
        category: 'job-boards',
        status: 'connected',
        logo: '🔗',
        features: ['Job posting', 'Candidate sourcing', 'InMail integration', 'Analytics'],
        lastSync: '2024-01-21T11:00:00Z',
        dataFlow: 'bidirectional',
        isPopular: true,
        setupComplexity: 'easy'
      },
      {
        id: 'indeed',
        name: 'Indeed',
        description: 'Global job search engine and recruitment platform.',
        category: 'job-boards',
        status: 'error',
        logo: '🔵',
        features: ['Job posting', 'Resume search', 'Candidate tracking', 'Sponsored jobs'],
        lastSync: '2024-01-20T15:30:00Z',
        dataFlow: 'outbound',
        isPopular: true,
        setupComplexity: 'easy'
      },
      
      // Assessment Tools
      {
        id: 'codility',
        name: 'Codility',
        description: 'Technical assessment platform for evaluating programming skills.',
        category: 'assessment',
        status: 'connected',
        logo: '⚡',
        features: ['Coding tests', 'Technical interviews', 'Skills assessment', 'Anti-cheat technology'],
        lastSync: '2024-01-21T07:20:00Z',
        dataFlow: 'bidirectional',
        isPopular: false,
        setupComplexity: 'medium'
      },
      
      // Communication
      {
        id: 'slack',
        name: 'Slack',
        description: 'Team communication and collaboration platform.',
        category: 'communication',
        status: 'connected',
        logo: '💬',
        features: ['Notifications', 'Team updates', 'Candidate alerts', 'Interview scheduling'],
        lastSync: '2024-01-21T11:45:00Z',
        dataFlow: 'outbound',
        isPopular: true,
        setupComplexity: 'easy'
      },
      
      // Background Check
      {
        id: 'checkr',
        name: 'Checkr',
        description: 'Modern background check and drug screening platform.',
        category: 'background-check',
        status: 'configuring',
        logo: '🛡️',
        features: ['Background checks', 'Drug screening', 'Identity verification', 'Compliance reporting'],
        dataFlow: 'bidirectional',
        isPopular: false,
        setupComplexity: 'medium'
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setIntegrations(mockIntegrations);
      setLoading(false);
    }, 800);
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'configuring':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'connected':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'configuring':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const handleToggleIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { 
            ...integration, 
            status: integration.status === 'connected' ? 'disconnected' : 'connected',
            lastSync: integration.status === 'disconnected' ? new Date().toISOString() : integration.lastSync
          }
        : integration
    ));
  };

  const handleRefreshIntegration = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, lastSync: new Date().toISOString() }
        : integration
    ));
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  const actions = (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Integration
      </button>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider">
        <ArrowPathIcon className="w-4 h-4 mr-2" />
        Sync All
      </button>
    </div>
  );

  return (
    <PageWrapper
      title="Integrations"
      subtitle="Connect your recruitment platform with external systems and tools"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <LinkIcon className="w-8 h-8 text-violet-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Integrations</p>
                <p className="text-2xl font-semibold text-gray-900">{integrations.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Connected</p>
                <p className="text-2xl font-semibold text-gray-900">{connectedCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Errors</p>
                <p className="text-2xl font-semibold text-gray-900">{errorCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowPathIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Last Sync</p>
                <p className="text-sm font-semibold text-gray-900">2 mins ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-sm shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-gold-100 text-gold-800 border border-violet-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.description}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Integrations Grid */}
        {loading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading integrations...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => (
              <div key={integration.id} className="bg-white rounded-sm shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{integration.logo}</div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={getStatusBadge(integration.status)}>
                            {integration.status.replace('-', ' ')}
                          </span>
                          {integration.isPopular && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                              Popular
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {getStatusIcon(integration.status)}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4">{integration.description}</p>

                  {/* Features */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.slice(0, 3).map(feature => (
                        <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {feature}
                        </span>
                      ))}
                      {integration.features.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          +{integration.features.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Setup: {integration.setupComplexity}</span>
                    <span>{integration.dataFlow}</span>
                  </div>

                  {/* Last Sync */}
                  {integration.lastSync && (
                    <div className="text-xs text-gray-500 mb-4">
                      Last synced: {new Date(integration.lastSync).toLocaleString()}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleIntegration(integration.id)}
                      className={`flex-1 px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                        integration.status === 'connected'
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200">
                      <CogIcon className="w-4 h-4" />
                    </button>
                    {integration.status === 'connected' && (
                      <button
                        onClick={() => handleRefreshIntegration(integration.id)}
                        className="px-3 py-2 bg-gold-100 text-violet-700 rounded-full text-sm hover:bg-gold-200"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredIntegrations.length === 0 && !loading && (
          <EmptyState
            icon={LinkIcon}
            title="No integrations found"
            description="Try adjusting your search or filter criteria."
          />
        )}
      </div>
    </PageWrapper>
  );
}
