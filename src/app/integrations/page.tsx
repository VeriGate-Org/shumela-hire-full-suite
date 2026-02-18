'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { apiFetch } from '@/lib/api-fetch';
import {
  CheckCircleIcon,
  XCircleIcon,
  CogIcon,
  LinkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentCheckIcon,
  BriefcaseIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  MegaphoneIcon,
  GlobeAltIcon,
  BuildingOfficeIcon,
} from '@heroicons/react/24/outline';

interface Integration {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  status: 'connected' | 'disconnected' | 'error';
}

const INTEGRATION_META: Record<string, { description: string; icon: React.ElementType; features: string[] }> = {
  'docusign': {
    description: 'E-signature solution for offer letters and employment contracts.',
    icon: DocumentCheckIcon,
    features: ['Offer signing', 'Envelope tracking', 'Webhook events'],
  },
  'linkedin': {
    description: 'Professional networking platform for job posting and candidate sourcing.',
    icon: BriefcaseIcon,
    features: ['Job posting', 'Candidate sourcing', 'Analytics'],
  },
  'indeed': {
    description: 'Global job search engine and recruitment platform.',
    icon: GlobeAltIcon,
    features: ['Job posting', 'Resume search', 'Sponsored jobs'],
  },
  'pnet': {
    description: 'South African job board for local recruitment.',
    icon: BuildingOfficeIcon,
    features: ['Job posting', 'XML feed', 'Local reach'],
  },
  'career-junction': {
    description: 'South African career and recruitment platform.',
    icon: MegaphoneIcon,
    features: ['Job posting', 'Candidate matching', 'Local reach'],
  },
  'ms-teams': {
    description: 'Microsoft Teams notifications for hiring events and interview updates.',
    icon: ChatBubbleLeftRightIcon,
    features: ['Notifications', 'Adaptive cards', 'Team updates'],
  },
  'outlook': {
    description: 'Outlook Calendar integration for interview scheduling.',
    icon: CalendarDaysIcon,
    features: ['Calendar events', 'Interview invites', 'Rescheduling'],
  },
  'aws-ses': {
    description: 'AWS Simple Email Service for transactional email delivery.',
    icon: EnvelopeIcon,
    features: ['Email delivery', 'Templates', 'Delivery tracking'],
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  'all': 'All Integrations',
  'Job Boards': 'Job Boards',
  'Communication': 'Communication',
  'E-Signature': 'E-Signature',
  'Email': 'Email',
};

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/integrations/status');
      const data = await response.json();
      setIntegrations(data);
    } catch {
      // Fallback to static data if API unavailable
      setIntegrations([
        { id: 'docusign', name: 'DocuSign', category: 'E-Signature', configured: false, status: 'disconnected' },
        { id: 'linkedin', name: 'LinkedIn Jobs', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'indeed', name: 'Indeed', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'pnet', name: 'PNet', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'career-junction', name: 'CareerJunction', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'ms-teams', name: 'Microsoft Teams', category: 'Communication', configured: false, status: 'disconnected' },
        { id: 'outlook', name: 'Outlook Calendar', category: 'Communication', configured: false, status: 'disconnected' },
        { id: 'aws-ses', name: 'AWS SES', category: 'Email', configured: false, status: 'disconnected' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(integrations.map(i => i.category))];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (INTEGRATION_META[integration.id]?.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
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
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={loadIntegrations}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
      >
        <ArrowPathIcon className="w-4 h-4 mr-2" />
        Refresh Status
      </button>
    </div>
  );

  return (
    <PageWrapper
      title="Integrations"
      subtitle="Manage connections to external platforms and services"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Errors</p>
                <p className="text-2xl font-semibold text-gray-900">{errorCount}</p>
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
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-gold-100 text-gold-800 border border-violet-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
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
            {filteredIntegrations.map(integration => {
              const meta = INTEGRATION_META[integration.id] || { description: '', icon: LinkIcon, features: [] };
              const IconComponent = meta.icon;

              return (
                <div key={integration.id} className="bg-white rounded-sm shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gray-100 rounded-sm mr-3">
                          <IconComponent className="w-6 h-6 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={getStatusBadge(integration.status)}>
                              {integration.status}
                            </span>
                            <span className="px-2 py-1 bg-gray-50 text-gray-600 rounded-full text-xs">
                              {integration.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      {getStatusIcon(integration.status)}
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4">{meta.description}</p>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {meta.features.map(feature => (
                          <span key={feature} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
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
                    </div>
                  </div>
                </div>
              );
            })}
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
