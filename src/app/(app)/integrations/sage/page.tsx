'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import SageSyncStatus from '@/components/integrations/SageSyncStatus';
import {
  sageIntegrationService,
  SageConnectorConfig,
  SageSyncLog,
} from '@/services/sageIntegrationService';
import {
  Cog6ToothIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  SignalIcon,
  LinkIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { useToast } from '@/components/Toast';

export default function SageDashboardPage() {
  const [connectors, setConnectors] = useState<SageConnectorConfig[]>([]);
  const [recentLogs, setRecentLogs] = useState<SageSyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [connectorsData, logsData] = await Promise.all([
        sageIntegrationService.getConnectors(),
        sageIntegrationService.getLogs(0, 5),
      ]);
      setConnectors(connectorsData);
      setRecentLogs(logsData.content);
    } catch {
      toast('Failed to load Sage integration dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  const activeConnectors = connectors.filter((c) => c.isActive);
  const lastTestedConnectors = connectors.filter((c) => c.lastTestedAt);
  const successfulTests = lastTestedConnectors.filter((c) => c.lastTestSuccess);

  const actions = (
    <button
      onClick={loadDashboard}
      className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider transition-colors"
    >
      <ArrowPathIcon className="w-4 h-4 mr-2" />
      Refresh
    </button>
  );

  return (
    <FeatureGate feature="SAGE_300_PEOPLE">
      <PageWrapper
        title="Sage 300 People Integration"
        subtitle="Configure and monitor the bi-directional sync between ShumelaHire and Sage 300 People"
        actions={actions}
      >
        {loading ? (
          /* ========== SKELETON STATE ========== */
          <div className="space-y-6">
            {/* Skeleton Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="enterprise-card p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-card bg-muted animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-muted animate-pulse rounded w-3/5" />
                    <div className="h-5 bg-muted animate-pulse rounded w-2/5" />
                    <div className="h-2.5 bg-muted animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Skeleton Configuration Card */}
            <div className="enterprise-card p-6">
              <div className="mb-5">
                <div className="h-5 bg-muted animate-pulse rounded w-48 mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-72" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="h-3.5 bg-muted animate-pulse rounded w-28" />
                  <div className="h-10 bg-muted animate-pulse rounded-control" />
                  <div className="h-10 bg-muted animate-pulse rounded-control" />
                  <div className="h-10 bg-muted animate-pulse rounded-control" />
                  <div className="h-9 bg-muted animate-pulse rounded-full w-40" />
                </div>
                <div className="space-y-4">
                  <div className="h-3.5 bg-muted animate-pulse rounded w-24" />
                  <div className="h-10 bg-muted animate-pulse rounded-control" />
                  <div className="h-10 bg-muted animate-pulse rounded-control" />
                  <div className="h-11 bg-muted animate-pulse rounded-control" />
                  <div className="h-12 bg-muted animate-pulse rounded-control" />
                </div>
              </div>
            </div>

            {/* Skeleton Sync Logs Table */}
            <div className="enterprise-card p-6">
              <div className="mb-5">
                <div className="h-5 bg-muted animate-pulse rounded w-24 mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-64" />
              </div>
              <div className="space-y-0">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 py-3.5 px-4">
                    <div className="h-3.5 bg-muted animate-pulse rounded w-[18%]" />
                    <div className="h-5 bg-muted animate-pulse rounded-full w-16" />
                    <div className="h-3.5 bg-muted animate-pulse rounded w-[8%]" />
                    <div className="h-5 bg-muted animate-pulse rounded-full w-16" />
                    <div className="h-3.5 bg-muted animate-pulse rounded w-[6%]" />
                    <div className="h-3.5 bg-muted animate-pulse rounded w-[5%]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ========== NORMAL STATE ========== */
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              {/* Records Synced / Total Connectors */}
              <div className="enterprise-card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                  <LinkIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Connectors
                  </div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {connectors.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Configured integrations
                  </div>
                </div>
              </div>

              {/* Active Connectors */}
              <div className="enterprise-card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                  <CheckCircleIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Active
                  </div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {activeConnectors.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Currently enabled
                  </div>
                </div>
              </div>

              {/* Test Success Rate */}
              <div className="enterprise-card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                  <SignalIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tested
                  </div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {successfulTests.length}/{lastTestedConnectors.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Passing connection tests
                  </div>
                </div>
              </div>

              {/* Recent Syncs */}
              <div className="enterprise-card p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-[22px] h-[22px]" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Recent Syncs
                  </div>
                  <div className="text-2xl font-extrabold text-foreground leading-tight">
                    {recentLogs.length}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Awaiting review
                  </div>
                </div>
              </div>
            </div>

            {/* Connector Status Card */}
            <div className="enterprise-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-[1.0625rem] font-bold text-foreground">Connector Status</h2>
                  <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                    Overview of configured integration connectors
                  </p>
                </div>
                <Link
                  href="/integrations/sage/config"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-border text-muted-foreground text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
                >
                  <Cog6ToothIcon className="w-3 h-3" />
                  Manage
                </Link>
              </div>

              {connectors.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-surface-navy flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-7 h-7 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">
                    No connectors configured.{' '}
                    <Link href="/integrations/sage/config" className="text-primary font-semibold hover:underline">
                      Create one now
                    </Link>.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Connector List */}
                  <div>
                    <div className="flex items-center gap-2 text-[0.8125rem] font-bold text-foreground mb-3.5">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                        <line x1="6" y1="6" x2="6.01" y2="6" />
                        <line x1="6" y1="18" x2="6.01" y2="18" />
                      </svg>
                      Connectors
                    </div>
                    <div className="space-y-3">
                      {connectors.map((connector) => (
                        <div
                          key={connector.id}
                          className="rounded-control border border-border p-4 hover:bg-surface-navy transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                {connector.name}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {connector.connectorType.replace(/_/g, ' ')}
                              </p>
                            </div>
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                connector.isActive
                                  ? 'bg-success-bg text-success'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              <span
                                className={`w-2 h-2 rounded-full inline-block ${
                                  connector.isActive ? 'bg-success' : 'bg-muted-foreground'
                                }`}
                              />
                              {connector.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>Auth: {connector.authMethod.replace(/_/g, ' ')}</p>
                            <p className="truncate">URL: {connector.baseUrl}</p>
                            {connector.lastTestedAt && (
                              <div className="flex items-center gap-1.5 pt-1">
                                {connector.lastTestSuccess ? (
                                  <CheckCircleIcon className="w-3.5 h-3.5 text-success" />
                                ) : (
                                  <XCircleIcon className="w-3.5 h-3.5 text-error" />
                                )}
                                <span>
                                  Last tested:{' '}
                                  {new Date(connector.lastTestedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Navigation */}
                  <div>
                    <div className="flex items-center gap-2 text-[0.8125rem] font-bold text-foreground mb-3.5">
                      <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      Quick Actions
                    </div>
                    <div className="space-y-3">
                      <Link
                        href="/integrations/sage/config"
                        className="flex items-center gap-3 rounded-control border border-border p-4 hover:bg-surface-navy transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                          <Cog6ToothIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Connector Configuration
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Manage API settings and credentials
                          </div>
                        </div>
                      </Link>
                      <Link
                        href="/integrations/sage/schedules"
                        className="flex items-center gap-3 rounded-control border border-border p-4 hover:bg-surface-navy transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                          <CalendarDaysIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Sync Schedules
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Configure sync frequency and timing
                          </div>
                        </div>
                      </Link>
                      <Link
                        href="/integrations/sage/logs"
                        className="flex items-center gap-3 rounded-control border border-border p-4 hover:bg-surface-navy transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                          <ClipboardDocumentListIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            Sync Logs
                          </div>
                          <div className="text-xs text-muted-foreground">
                            View synchronisation history and details
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Schedule info box */}
                    <div className="flex items-center gap-3 mt-4 p-3.5 rounded-control bg-surface-navy text-[0.8125rem] text-muted-foreground">
                      <svg className="w-4 h-4 text-primary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>
                        <strong className="text-foreground">{activeConnectors.length}</strong> active connector{activeConnectors.length !== 1 ? 's' : ''} &mdash;{' '}
                        <strong className="text-foreground">{successfulTests.length}</strong> passing tests
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sync Logs Card */}
            <div className="enterprise-card overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-0 mb-5">
                <div>
                  <h2 className="text-[1.0625rem] font-bold text-foreground">Sync Logs</h2>
                  <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
                    Recent synchronisation activity between systems
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href="/integrations/sage/logs"
                    className="text-[0.8125rem] font-semibold text-primary hover:text-link-hover hover:underline transition-colors"
                  >
                    View all logs
                  </Link>
                  <button
                    onClick={loadDashboard}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-border text-muted-foreground text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
                  >
                    <ArrowPathIcon className="w-3 h-3" />
                    Refresh
                  </button>
                </div>
              </div>

              {recentLogs.length === 0 ? (
                <div className="px-6 pb-6">
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-surface-navy flex items-center justify-center mx-auto mb-4">
                      <ClipboardDocumentListIcon className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      No sync activity recorded yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                          Connector
                        </th>
                        <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                          Entity
                        </th>
                        <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                          Direction
                        </th>
                        <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                          Records
                        </th>
                        <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-wider border-b border-border bg-background">
                          Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentLogs.map((log) => (
                        <tr key={log.id} className="group hover:bg-surface-navy transition-colors">
                          <td className="px-4 py-3.5 text-sm font-semibold text-foreground border-b border-border group-last:border-b-0">
                            {log.connectorName}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground border-b border-border group-last:border-b-0">
                            {log.entityType}
                          </td>
                          <td className="px-4 py-3.5 border-b border-border group-last:border-b-0">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${
                                log.direction === 'OUTBOUND' || log.direction === 'PUSH'
                                  ? 'bg-surface-teal text-accent-teal'
                                  : log.direction === 'INBOUND' || log.direction === 'PULL'
                                    ? 'bg-surface-navy text-accent-navy'
                                    : 'bg-surface-gold text-accent-gold'
                              }`}
                            >
                              {log.direction === 'OUTBOUND' || log.direction === 'PUSH' ? (
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                  <polyline points="12 5 19 12 12 19" />
                                </svg>
                              ) : log.direction === 'INBOUND' || log.direction === 'PULL' ? (
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="19" y1="12" x2="5" y2="12" />
                                  <polyline points="12 19 5 12 12 5" />
                                </svg>
                              ) : (
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="23 4 23 10 17 10" />
                                  <polyline points="1 20 1 14 7 14" />
                                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                </svg>
                              )}
                              {log.direction === 'OUTBOUND'
                                ? 'Outbound'
                                : log.direction === 'INBOUND'
                                  ? 'Inbound'
                                  : log.direction === 'PUSH'
                                    ? 'Push'
                                    : log.direction === 'PULL'
                                      ? 'Pull'
                                      : 'Sync'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 border-b border-border group-last:border-b-0">
                            <SageSyncStatus status={log.status} size="sm" />
                          </td>
                          <td className="px-4 py-3.5 text-sm text-foreground border-b border-border group-last:border-b-0">
                            {log.recordsSucceeded}/{log.recordsProcessed}
                          </td>
                          <td className="px-4 py-3.5 text-sm text-muted-foreground border-b border-border group-last:border-b-0">
                            {new Date(log.startedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
              <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-[0.8125rem] text-muted-foreground">
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>
                    <strong className="text-primary">{activeConnectors.length}</strong> active connector{activeConnectors.length !== 1 ? 's' : ''} &mdash;{' '}
                    <strong className="text-primary">{connectors.length}</strong> total configured
                  </span>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/integrations/sage/config"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-border text-muted-foreground text-[0.8125rem] font-bold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-colors"
                  >
                    Configure
                  </Link>
                  <Link
                    href="/integrations/sage/schedules"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-cta text-cta-foreground border-2 border-cta text-[0.8125rem] font-extrabold uppercase tracking-wider hover:bg-cta-hover hover:border-cta-hover transition-colors"
                  >
                    <CalendarDaysIcon className="w-3.5 h-3.5" />
                    Manage Schedules
                  </Link>
                </div>
              </div>
            </div>

            {/* Bottom spacer for action bar */}
            <div className="h-20" />
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
