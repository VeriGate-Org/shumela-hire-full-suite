'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';
import { linkedInSocialService, LinkedInConnectionStatus } from '@/services/linkedInSocialService';

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
    features: ['Job posting', 'Candidate sourcing', 'Analytics', 'Social posting'],
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
  'sage': {
    description: 'Sage 300 People payroll integration for new employee registration.',
    icon: CogIcon,
    features: ['Employee registration', 'Salary setup', 'Tax configuration', 'Auto-sync on offer acceptance'],
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  'all': 'All Integrations',
  'Job Boards': 'Job Boards',
  'Communication': 'Communication',
  'E-Signature': 'E-Signature',
  'Email': 'Email',
  'Payroll': 'Payroll',
};

/* Rotating icon-background colours to match the mock's 4-colour scheme */
const ICON_COLOR_CYCLE = [
  { bg: 'bg-icon-bg-navy', text: 'text-accent-navy' },
  { bg: 'bg-icon-bg-teal', text: 'text-accent-teal' },
  { bg: 'bg-icon-bg-gold', text: 'text-accent-gold' },
  { bg: 'bg-icon-bg-pink', text: 'text-accent-pink' },
] as const;

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInConnectionStatus | null>(null);
  const [linkedInActionLoading, setLinkedInActionLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const hasAccess = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  const loadLinkedInStatus = useCallback(async () => {
    try {
      const status = await linkedInSocialService.getStatus();
      setLinkedInStatus(status);
    } catch {
      // LinkedIn social not enabled — ignore
    }
  }, []);

  useEffect(() => {
    loadIntegrations();
    loadLinkedInStatus();
  }, [loadLinkedInStatus]);

  useEffect(() => {
    const linkedInParam = searchParams.get('linkedin');
    if (linkedInParam === 'success') {
      toast('LinkedIn company page connected successfully', 'success');
      loadLinkedInStatus();
    } else if (linkedInParam === 'error') {
      toast('Failed to connect LinkedIn company page', 'error');
    }
  }, [searchParams, toast, loadLinkedInStatus]);

  const loadIntegrations = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/integrations/status');
      const data = await response.json();
      setIntegrations(data);
    } catch {
      // Fallback to static data if API unavailable
      setIntegrations([
        { id: 'docusign', name: 'DocuSign', category: 'E-Signature', configured: true, status: 'connected' },
        { id: 'linkedin', name: 'LinkedIn Jobs', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'indeed', name: 'Indeed', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'pnet', name: 'PNet', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'career-junction', name: 'CareerJunction', category: 'Job Boards', configured: false, status: 'disconnected' },
        { id: 'ms-teams', name: 'Microsoft Teams', category: 'Communication', configured: false, status: 'disconnected' },
        { id: 'outlook', name: 'Outlook Calendar', category: 'Communication', configured: false, status: 'disconnected' },
        { id: 'aws-ses', name: 'AWS SES', category: 'Email', configured: false, status: 'disconnected' },
        { id: 'sage', name: 'Sage 300 People', category: 'Payroll', configured: true, status: 'connected' },
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

  /* ---- Status pill with coloured dot (matches mock) ---- */
  const getConnectionPill = (status: string) => {
    if (status === 'connected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-teal-50 text-accent-teal">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-teal" />
          Connected
        </span>
      );
    }
    if (status === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-idc-pink-50 text-accent-pink">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-pink" />
          Error
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-gray-100 text-muted-foreground">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
        Disconnected
      </span>
    );
  };

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={loadIntegrations}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold uppercase tracking-wider border-2 border-cta text-primary bg-transparent hover:bg-cta hover:text-foreground transition-all"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Refresh Status
      </button>
    </div>
  );

  if (!hasAccess) {
    return (
      <PageWrapper
        title="Access Denied"
        subtitle="You do not have permission to manage integrations"
      >
        <div className="bg-card rounded-card shadow-sm p-8 text-center border border-border">
          <p className="text-sm text-muted-foreground">
            Integrations can be managed by administrators and HR managers.
          </p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Integrations Hub"
      subtitle="Manage external system connections"
      actions={actions}
    >
      <div className="space-y-6">

        {/* ===== Stats Bar (4-column) ===== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Total Integrations */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-navy">
              <LinkIcon className="w-6 h-6 text-accent-navy" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-tight text-foreground">{integrations.length}</p>
              <p className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Total Integrations</p>
            </div>
          </div>

          {/* Connected */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-teal">
              <CheckCircleIcon className="w-6 h-6 text-accent-teal" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-tight text-foreground">{connectedCount}</p>
              <p className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Connected</p>
            </div>
          </div>

          {/* Last Sync */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-gold">
              <ArrowPathIcon className="w-6 h-6 text-accent-gold" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-tight text-foreground">--</p>
              <p className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Last Sync</p>
            </div>
          </div>

          {/* Errors */}
          <div className="bg-card border border-border rounded-card shadow-sm p-5 flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 bg-icon-bg-pink">
              <ExclamationTriangleIcon className="w-6 h-6 text-accent-pink" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold leading-tight text-foreground">{errorCount}</p>
              <p className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Sync Errors</p>
            </div>
          </div>
        </div>

        {/* ===== Search & Filter Bar ===== */}
        <div className="bg-card border border-border rounded-card shadow-sm p-5">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-control bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-cta/60 focus:border-primary transition"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-xs font-semibold tracking-wide transition-all ${
                    selectedCategory === cat
                      ? 'bg-primary text-primary-foreground border border-primary'
                      : 'bg-transparent text-muted-foreground border border-border hover:border-primary hover:text-primary'
                  }`}
                >
                  {CATEGORY_LABELS[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Integration Cards Grid (2-column) ===== */}
        {loading ? (
          /* Skeleton loader matching mock layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="bg-card border border-border rounded-card shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-card bg-gray-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/5" />
                    <div className="h-3 bg-gray-200 rounded w-4/5" />
                  </div>
                  <div className="h-5 w-20 bg-gray-200 rounded-full" />
                </div>
                <div className="h-px bg-border my-4" />
                <div className="space-y-3 mb-4">
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/5" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3.5 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded-full w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredIntegrations.map((integration, idx) => {
              const meta = INTEGRATION_META[integration.id] || { description: '', icon: LinkIcon, features: [] };
              const IconComponent = meta.icon;
              const colorSet = ICON_COLOR_CYCLE[idx % ICON_COLOR_CYCLE.length];

              return (
                <div
                  key={integration.id}
                  className="bg-card border border-border rounded-card shadow-sm p-6 transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
                >
                  {/* Card Header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-card flex items-center justify-center flex-shrink-0 ${colorSet.bg}`}>
                      <IconComponent className={`w-6 h-6 ${colorSet.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground leading-snug">{integration.name}</h3>
                      <p className="text-[0.8125rem] text-muted-foreground font-medium leading-snug">{meta.description.split('.')[0]}</p>
                    </div>
                    {getConnectionPill(integration.status)}
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border my-4" />

                  {/* Meta Rows */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                      <ArrowPathIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Last sync: {integration.status === 'connected' ? 'Recently' : 'Never'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[0.8125rem] text-muted-foreground">
                      {getStatusIcon(integration.status)}
                      <span>
                        {integration.status === 'connected' ? 'Active' : integration.status === 'error' ? 'Requires attention' : 'Not configured'}
                      </span>
                    </div>
                  </div>

                  {/* Features (compact tags) */}
                  {meta.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {meta.features.map(feature => (
                        <span key={feature} className="px-2 py-0.5 bg-gray-100 text-muted-foreground rounded text-[0.6875rem] font-medium">
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center gap-3">
                    {/* LinkedIn special handling */}
                    {integration.id === 'linkedin' && linkedInStatus ? (
                      <>
                        <button className="text-[0.8125rem] font-semibold text-primary uppercase tracking-wider hover:text-cta-hover transition-colors">
                          Configure
                        </button>
                        {user?.role === 'ADMIN' ? (
                          <button
                            disabled={linkedInActionLoading}
                            onClick={async () => {
                              setLinkedInActionLoading(true);
                              try {
                                if (linkedInStatus.connected) {
                                  await linkedInSocialService.disconnect();
                                  toast('LinkedIn disconnected', 'success');
                                  await loadLinkedInStatus();
                                } else {
                                  const authUrl = await linkedInSocialService.getAuthUrl();
                                  window.location.href = authUrl;
                                }
                              } catch {
                                toast('Failed to update LinkedIn connection', 'error');
                              } finally {
                                setLinkedInActionLoading(false);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 text-xs font-semibold uppercase tracking-wider leading-none transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                              linkedInStatus.connected
                                ? 'border-accent-pink text-accent-pink hover:bg-idc-pink-50'
                                : 'border-cta text-primary hover:bg-cta hover:text-foreground'
                            }`}
                          >
                            <ArrowPathIcon className={`w-3.5 h-3.5 ${linkedInActionLoading ? 'animate-spin' : ''}`} />
                            {linkedInActionLoading ? 'Loading...' : linkedInStatus.connected ? 'Disconnect' : 'Connect'}
                          </button>
                        ) : (
                          <span className={`text-xs font-medium ${
                            linkedInStatus.connected ? 'text-accent-teal' : 'text-muted-foreground'
                          }`}>
                            {linkedInStatus.connected ? `Connected: ${linkedInStatus.organizationName}` : 'Not connected'}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <button className="text-[0.8125rem] font-semibold text-primary uppercase tracking-wider hover:text-cta-hover transition-colors">
                          Configure
                        </button>
                        <button
                          disabled={!integration.configured && integration.status !== 'connected'}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-cta text-xs font-semibold uppercase tracking-wider leading-none text-primary bg-transparent hover:bg-cta hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <ArrowPathIcon className="w-3.5 h-3.5" />
                          Sync Now
                        </button>
                      </>
                    )}
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

        {/* ===== Sync Health Timeline ===== */}
        {!loading && connectedCount > 0 && (
          <div className="bg-card border border-border rounded-card shadow-sm p-6">
            {/* Timeline Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Sync Health Timeline
              </h2>
              <div className="flex items-center gap-4 text-[0.8125rem] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-teal" />
                  Success
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent-pink" />
                  Error
                </span>
              </div>
            </div>

            {/* Timeline Track */}
            <div className="relative py-2">
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 z-0" />

              {/* Timeline Events */}
              <div className="relative z-[1] flex justify-between">
                {integrations
                  .filter(i => i.status === 'connected' || i.status === 'error')
                  .slice(0, 7)
                  .map((integration, eIdx) => {
                    const isError = integration.status === 'error';
                    return (
                      <div key={`tl-${integration.id}-${eIdx}`} className="group flex flex-col items-center gap-2 flex-1 cursor-default relative">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-foreground text-card px-3 py-2 rounded-control text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {integration.name} - {isError ? 'Sync error' : 'Sync completed'}
                          <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-foreground" />
                        </div>
                        {/* Dot */}
                        <div
                          className={`w-4 h-4 rounded-full border-[3px] border-card transition-transform hover:scale-[1.3] ${
                            isError
                              ? 'bg-accent-pink shadow-[0_0_0_2px_var(--accent-pink)]'
                              : 'bg-accent-teal shadow-[0_0_0_2px_var(--accent-teal)]'
                          }`}
                        />
                        {/* Label */}
                        <span className="text-[0.6875rem] font-semibold text-muted-foreground text-center leading-tight max-w-[80px]">
                          {integration.name.length > 12 ? integration.name.slice(0, 12) + '...' : integration.name}
                        </span>
                        {/* Time */}
                        <span className="text-[0.625rem] text-muted-foreground font-medium text-center">
                          Recently
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
