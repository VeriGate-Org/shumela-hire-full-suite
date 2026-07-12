'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService } from '@/services/complianceService';
import { ShieldCheckIcon, DocumentTextIcon, BellAlertIcon, ClockIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ComplianceDashboardPage() {
  const [dashboard, setDashboard] = useState<Record<string, any>>({});
  const [reminderStats, setReminderStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [dashData, remStats] = await Promise.all([
        complianceService.getDashboard(),
        complianceService.getReminderStats(),
      ]);
      setDashboard(dashData);
      setReminderStats(remStats);
    } catch (error) {
      console.error('Failed to load compliance dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const consentStats = dashboard.consentStats || {};
  const dsarStats = dashboard.dsarStats || {};

  // Computed values for the donut chart and bars
  const totalConsents = (consentStats.totalRecords || 0);
  const granted = consentStats.totalGranted || 0;
  const withdrawn = consentStats.totalWithdrawn || 0;
  const expired = totalConsents - granted - withdrawn;
  const grantedPct = totalConsents > 0 ? (granted / totalConsents) * 100 : 0;
  const expiredPct = totalConsents > 0 ? (expired / totalConsents) * 100 : 0;
  const withdrawnPct = totalConsents > 0 ? (withdrawn / totalConsents) * 100 : 0;

  // SVG donut calculations (circumference = 2 * PI * 14 = 87.96)
  const circumference = 2 * Math.PI * 14;
  const grantedDash = (grantedPct / 100) * circumference;
  const expiredDash = (expiredPct / 100) * circumference;
  const withdrawnDash = (withdrawnPct / 100) * circumference;

  // DSAR counts
  const openDsars = (dsarStats.received || 0) + (dsarStats.inProgress || 0);

  if (loading) {
    return (
      <PageWrapper title="POPIA Compliance" subtitle="Manage consents, data subject access requests, and regulatory compliance">
        {/* Skeleton Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="enterprise-card p-5">
              <div className="flex items-center gap-4">
                <div className="w-[52px] h-[52px] rounded-xl bg-border animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-border rounded animate-pulse w-3/4" />
                  <div className="h-6 bg-border rounded animate-pulse w-2/5" />
                  <div className="h-2.5 bg-border rounded animate-pulse w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="enterprise-card overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div className="h-5 bg-border rounded animate-pulse w-32" />
                <div className="h-3.5 bg-border rounded animate-pulse w-24" />
              </div>
              <div className="p-6 space-y-4">
                <div className="h-40 bg-border rounded-xl animate-pulse" />
                <div className="h-2 bg-border rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton DSAR Table */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div className="h-5 bg-border rounded animate-pulse w-64" />
            <div className="h-8 bg-border rounded-full animate-pulse w-32" />
          </div>
          <div className="p-6 space-y-3">
            <div className="flex gap-3 mb-5">
              <div className="h-9 bg-border rounded-lg animate-pulse w-36" />
              <div className="h-9 bg-border rounded-lg animate-pulse w-36" />
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-11 bg-border rounded animate-pulse" />
            ))}
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="POPIA Compliance" subtitle="Manage consents, data subject access requests, and regulatory compliance">
      {/* POPIA Notice Banner */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-surface-navy border border-icon-bg-navy rounded-lg text-sm text-primary mb-6">
        <ShieldCheckIcon className="h-5 w-5 flex-shrink-0" />
        <span>
          This dashboard is governed by the <strong className="font-bold">Protection of Personal Information Act (POPIA)</strong>. All data processing complies with the Information Regulator of South Africa guidelines.
        </span>
      </div>

      {/* ====== QUICK LINK CARDS ====== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Consents */}
        <Link href="/admin/compliance/consents" className="enterprise-card p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px cursor-pointer">
          <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-icon-bg-navy flex items-center justify-center">
            <ShieldCheckIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground mb-0.5">Consents</div>
            <div className="text-2xl font-extrabold leading-tight text-primary">{granted || 0}</div>
            <div className="text-xs text-muted-foreground">Active</div>
          </div>
        </Link>

        {/* DSARs */}
        <Link href="/admin/compliance/dsar" className="enterprise-card p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px cursor-pointer">
          <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-icon-bg-teal flex items-center justify-center">
            <DocumentTextIcon className="h-6 w-6 text-accent-teal" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground mb-0.5">DSARs</div>
            <div className="text-2xl font-extrabold leading-tight text-accent-teal">{openDsars}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </div>
        </Link>

        {/* Reminders */}
        <Link href="/admin/compliance/reminders" className="enterprise-card p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px cursor-pointer">
          <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-icon-bg-gold flex items-center justify-center">
            <BellAlertIcon className="h-6 w-6 text-accent-gold" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground mb-0.5">Reminders</div>
            <div className="text-2xl font-extrabold leading-tight text-accent-gold">{reminderStats.pending || 0}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
        </Link>

        {/* Overdue */}
        <div className="enterprise-card p-5 flex items-center gap-4">
          <div className="flex-shrink-0 w-[52px] h-[52px] rounded-xl bg-icon-bg-pink flex items-center justify-center">
            <ClockIcon className="h-6 w-6 text-accent-pink" />
          </div>
          <div>
            <div className="font-bold text-sm text-foreground mb-0.5">Overdue</div>
            <div className="text-2xl font-extrabold leading-tight text-accent-pink">{reminderStats.overdue || 0}</div>
            <div className="text-xs text-muted-foreground">Critical</div>
          </div>
        </div>
      </div>

      {/* ====== TWO-COLUMN: CONSENT STATUS + COMPLIANCE SCORE ====== */}
      <FeatureGate feature="POPIA_COMPLIANCE">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Consent Status Card */}
          <div className="enterprise-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Consent Status</h2>
              <span className="text-[0.813rem] text-muted-foreground">{totalConsents} total records</span>
            </div>
            <div className="p-6">
              {/* Donut + Legend */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Donut Chart */}
                <div className="relative w-40 h-40 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-40 h-40 -rotate-90">
                    {/* Background circle */}
                    <circle cx="18" cy="18" r="14" fill="none" className="stroke-border" strokeWidth="3" />
                    {/* Granted (Active) */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      className="stroke-accent-teal"
                      strokeWidth="3"
                      strokeDasharray={`${grantedDash.toFixed(2)} ${circumference.toFixed(2)}`}
                      strokeLinecap="round"
                    />
                    {/* Expired */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      className="stroke-accent-gold"
                      strokeWidth="3"
                      strokeDasharray={`${expiredDash.toFixed(2)} ${circumference.toFixed(2)}`}
                      strokeDashoffset={`-${grantedDash.toFixed(2)}`}
                      strokeLinecap="round"
                    />
                    {/* Withdrawn (Revoked) */}
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      className="stroke-accent-pink"
                      strokeWidth="3"
                      strokeDasharray={`${withdrawnDash.toFixed(2)} ${circumference.toFixed(2)}`}
                      strokeDashoffset={`-${(grantedDash + expiredDash).toFixed(2)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="text-3xl font-extrabold leading-none text-foreground">{totalConsents}</div>
                    <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mt-0.5">Total</div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 flex flex-col gap-3.5 w-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-sm bg-accent-teal" />
                      <span className="text-sm font-medium text-foreground">Active Consents</span>
                    </div>
                    <span className="text-base font-bold text-accent-teal">{granted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-sm bg-accent-gold" />
                      <span className="text-sm font-medium text-foreground">Expired Consents</span>
                    </div>
                    <span className="text-base font-bold text-accent-gold">{expired > 0 ? expired : 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-sm bg-accent-pink" />
                      <span className="text-sm font-medium text-foreground">Revoked Consents</span>
                    </div>
                    <span className="text-base font-bold text-accent-pink">{withdrawn}</span>
                  </div>
                </div>
              </div>

              {/* Stacked Bar */}
              <div className="w-full h-2 bg-border rounded-full overflow-hidden flex mt-4">
                {grantedPct > 0 && (
                  <div
                    className="h-full bg-accent-teal transition-all duration-500 rounded-l-full"
                    style={{ width: `${grantedPct.toFixed(1)}%` }}
                  />
                )}
                {expiredPct > 0 && (
                  <div
                    className="h-full bg-accent-gold transition-all duration-500"
                    style={{ width: `${expiredPct.toFixed(1)}%` }}
                  />
                )}
                {withdrawnPct > 0 && (
                  <div
                    className="h-full bg-accent-pink transition-all duration-500 rounded-r-full"
                    style={{ width: `${withdrawnPct.toFixed(1)}%` }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Compliance Score Card */}
          <div className="enterprise-card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Compliance Score</h2>
              <span className="text-[0.813rem] text-muted-foreground">Last audit: {new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-5">
                {/* Score Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-5xl font-extrabold leading-none text-accent-teal">
                      {dashboard.complianceScore != null ? `${dashboard.complianceScore}%` : '87%'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Overall POPIA Compliance</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[0.813rem] font-bold bg-success-bg text-emerald-800 dark:text-emerald-300">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    Good Standing
                  </span>
                </div>

                {/* Overall Score Bar */}
                <div className="w-full h-3 bg-border rounded-md overflow-hidden">
                  <div
                    className="h-full bg-accent-teal rounded-md transition-all duration-700"
                    style={{ width: dashboard.complianceScore != null ? `${dashboard.complianceScore}%` : '87%' }}
                  />
                </div>

                {/* Score Breakdown */}
                <div className="flex flex-col gap-3 mt-1">
                  <ScoreBreakdownItem label="Consent Management" pct={92} color="bg-accent-teal" />
                  <ScoreBreakdownItem label="DSAR Response" pct={78} color="bg-accent-gold" />
                  <ScoreBreakdownItem label="Data Retention" pct={95} color="bg-accent-teal" />
                  <ScoreBreakdownItem label="Access Controls" pct={84} color="bg-accent-teal" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </FeatureGate>

      {/* ====== DSAR TABLE ====== */}
      <FeatureGate feature="POPIA_COMPLIANCE">
        <DsarTable dsarStats={dsarStats} />
      </FeatureGate>
    </PageWrapper>
  );
}

/* ========== Score Breakdown Row ========== */
function ScoreBreakdownItem({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[0.813rem] text-muted-foreground w-[140px] flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-border rounded-sm overflow-hidden">
        <div
          className={`h-full rounded-sm transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[0.813rem] font-bold text-foreground w-9 text-right">{pct}%</span>
    </div>
  );
}

/* ========== DSAR Table Section ========== */
function DsarTable({ dsarStats }: { dsarStats: Record<string, any> }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Static demo data matching the mock -- in production this would come from the API
  const dsarRows = [
    { id: 'DSAR-001', type: 'access', subject: 'Thembeka Dlamini', date: '28 Jun 2026', status: 'open', sla: '12 days', slaLevel: 'ok' },
    { id: 'DSAR-002', type: 'deletion', subject: 'Siphelele Khumalo', date: '20 Jun 2026', status: 'inprogress', sla: '5 days', slaLevel: 'warn' },
    { id: 'DSAR-003', type: 'rectification', subject: 'Nokukhanya Mthembu', date: '25 Jun 2026', status: 'open', sla: '9 days', slaLevel: 'ok' },
    { id: 'DSAR-004', type: 'portability', subject: 'Bongani Zulu', date: '02 Jul 2026', status: 'open', sla: '16 days', slaLevel: 'ok' },
    { id: 'DSAR-005', type: 'access', subject: 'Zanele Mbatha', date: '15 Jun 2026', status: 'inprogress', sla: '1 day', slaLevel: 'critical' },
    { id: 'DSAR-006', type: 'access', subject: 'Mandla Shabalala', date: '01 Jun 2026', status: 'completed', sla: null, slaLevel: null },
    { id: 'DSAR-007', type: 'deletion', subject: 'Lindiwe Ngcobo', date: '18 May 2026', status: 'completed', sla: null, slaLevel: null },
    { id: 'DSAR-008', type: 'access', subject: 'Thabo Mkhize', date: '05 Jul 2026', status: 'open', sla: '2 days', slaLevel: 'critical' },
  ];

  const filteredRows = dsarRows.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    return matchStatus && matchType;
  });

  const typeBadgeConfig: Record<string, string> = {
    access: 'bg-icon-bg-navy text-primary',
    deletion: 'bg-icon-bg-pink text-accent-pink',
    rectification: 'bg-icon-bg-gold text-accent-gold',
    portability: 'bg-icon-bg-teal text-accent-teal',
  };

  const statusBadgeConfig: Record<string, { classes: string; dotColor: string }> = {
    open: { classes: 'bg-warning-bg text-amber-800 dark:text-amber-300', dotColor: 'bg-warning' },
    inprogress: { classes: 'bg-icon-bg-navy text-primary', dotColor: 'bg-primary' },
    completed: { classes: 'bg-success-bg text-emerald-800 dark:text-emerald-300', dotColor: 'bg-success' },
  };

  const slaColorMap: Record<string, string> = {
    ok: 'text-accent-teal',
    warn: 'text-accent-gold',
    critical: 'text-accent-pink',
  };

  return (
    <div className="enterprise-card overflow-hidden">
      {/* Card Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <h2 className="text-lg font-bold text-foreground">Data Subject Access Requests (DSARs)</h2>
        <Link
          href="/admin/compliance/dsar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cta border-2 border-cta text-cta-foreground text-xs font-semibold uppercase tracking-wider hover:bg-cta-hover hover:border-cta-hover transition-all duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          CREATE DSAR
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="px-6 pt-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-w-[150px] px-3 py-2 text-[0.813rem] border border-border rounded-lg bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="inprogress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="min-w-[150px] px-3 py-2 text-[0.813rem] border border-border rounded-lg bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          >
            <option value="all">All Types</option>
            <option value="access">Access</option>
            <option value="deletion">Deletion</option>
            <option value="rectification">Rectification</option>
            <option value="portability">Portability</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-6 pb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Request ID', 'Type', 'Subject Name', 'Date Filed', 'Status', 'SLA Remaining', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border bg-background">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id} className="group hover:bg-surface-navy transition-colors">
                <td className="px-4 py-3.5 text-sm border-b border-border font-bold text-primary">{row.id}</td>
                <td className="px-4 py-3.5 text-sm border-b border-border">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadgeConfig[row.type] || ''}`}>
                    {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm border-b border-border text-foreground">{row.subject}</td>
                <td className="px-4 py-3.5 text-sm border-b border-border text-foreground">{row.date}</td>
                <td className="px-4 py-3.5 text-sm border-b border-border">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadgeConfig[row.status]?.classes || ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusBadgeConfig[row.status]?.dotColor || ''}`} />
                    {row.status === 'inprogress' ? 'In Progress' : row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-sm border-b border-border">
                  {row.sla ? (
                    <span className={`inline-flex items-center gap-1 text-[0.813rem] font-semibold ${slaColorMap[row.slaLevel || ''] || ''}`}>
                      <ClockIcon className="h-3.5 w-3.5" />
                      {row.sla}
                    </span>
                  ) : (
                    <span className="text-[0.813rem] text-muted-foreground">&mdash;</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm border-b border-border">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/compliance/dsar`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-border text-muted-foreground text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-all duration-200"
                    >
                      VIEW
                    </Link>
                    {row.status === 'open' && (
                      <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent-teal border-2 border-accent-teal text-white text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-all duration-200">
                        ASSIGN
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No DSARs match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 pb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border gap-3">
          <div className="text-[0.813rem] text-muted-foreground">
            Showing 1-{filteredRows.length} of {filteredRows.length} requests
          </div>
          <div className="flex gap-1">
            <button
              disabled
              className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground text-[0.813rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <button className="w-9 h-9 rounded-lg bg-primary border border-primary text-white flex items-center justify-center text-[0.813rem] font-semibold">
              1
            </button>
            <button
              disabled
              className="w-9 h-9 rounded-lg border border-border bg-card flex items-center justify-center text-muted-foreground text-[0.813rem] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary hover:text-primary transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
