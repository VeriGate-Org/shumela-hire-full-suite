'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import {
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  BoltIcon,
  CogIcon,
  KeyIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { AuditLogEntry } from '@/types/workflow';
import { auditLogService } from '@/services/auditLogService';
import { auditSeverityConfig, getStatusConfig } from '@/utils/statusIcons';
import { useToast } from '@/components/Toast';
import { getEnumLabel } from '@/utils/enumLabels';

interface AuditLogFilter {
  dateRange: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  entityType: string;
  action: string;
  userId: string;
  userRole: string;
  severity: 'all' | 'info' | 'warning' | 'error' | 'critical';
  customStartDate?: string;
  customEndDate?: string;
}

interface AuditStats {
  totalLogs: number;
  todayLogs: number;
  uniqueUsers: number;
  criticalEvents: number;
  mostActiveUser: string;
  mostCommonAction: string;
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilter>({
    dateRange: 'week',
    entityType: 'all',
    action: 'all',
    userId: 'all',
    userRole: 'all',
    severity: 'all'
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [realTimeMode, setRealTimeMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadAuditLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...auditLogs];

    // Date range filter
    if (filters.dateRange !== 'custom') {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(log => log.timestamp >= startDate);
    } else if (filters.customStartDate || filters.customEndDate) {
      if (filters.customStartDate) {
        const startDate = new Date(filters.customStartDate);
        filtered = filtered.filter(log => log.timestamp >= startDate);
      }
      if (filters.customEndDate) {
        const endDate = new Date(filters.customEndDate);
        endDate.setHours(23, 59, 59, 999);
        filtered = filtered.filter(log => log.timestamp <= endDate);
      }
    }

    // Entity type filter
    if (filters.entityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === filters.entityType);
    }

    // Action filter
    if (filters.action !== 'all') {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    // User filter
    if (filters.userId !== 'all') {
      filtered = filtered.filter(log => log.userId === filters.userId);
    }

    // Role filter
    if (filters.userRole !== 'all') {
      filtered = filtered.filter(log => log.userRole === filters.userRole);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.action.toLowerCase().includes(search) ||
        log.entityType.toLowerCase().includes(search) ||
        log.userRole.toLowerCase().includes(search) ||
        JSON.stringify(log.details).toLowerCase().includes(search)
      );
    }

    setFilteredLogs(filtered);
  }, [auditLogs, filters, searchTerm]);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters, searchTerm, applyFilters]);

  const loadAuditLogs = async (page: number = 0) => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await auditLogService.getAllAuditLogs(page, pageSize);
      setAuditLogs(result.logs);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch {
      setLoadError('Failed to load audit logs. Please check your connection and try again.');
      toast('Failed to load audit logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Real-time mode polling
  useEffect(() => {
    if (!realTimeMode) return;
    const interval = setInterval(async () => {
      try {
        const result = await auditLogService.getAllAuditLogs(0, pageSize);
        setAuditLogs(result.logs);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
      } catch {
        // Silently continue with stale data in real-time mode
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [realTimeMode, pageSize]);

  const auditStats = useMemo((): AuditStats => {
    if (auditLogs.length === 0) {
      return {
        totalLogs: 0,
        todayLogs: 0,
        uniqueUsers: 0,
        criticalEvents: 0,
        mostActiveUser: 'N/A',
        mostCommonAction: 'N/A'
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = auditLogs.filter(log => log.timestamp >= today).length;
    const uniqueUsers = new Set(auditLogs.map(log => log.userId)).size;
    const criticalEvents = auditLogs.filter(log =>
      log.action.includes('delete') ||
      log.action.includes('rejected') ||
      log.action === 'permission_revoked'
    ).length;

    // Most active user — display userName if available, otherwise userId
    const userCounts: Record<string, number> = {};
    const userNameMap: Record<string, string> = {};
    auditLogs.forEach(log => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      if (log.userName) userNameMap[log.userId] = log.userName;
    });
    const mostActiveUserId = Object.keys(userCounts).reduce((a, b) =>
      userCounts[a] > userCounts[b] ? a : b, 'N/A'
    );
    const mostActiveUser = userNameMap[mostActiveUserId] || mostActiveUserId;

    // Most common action
    const actionCounts: Record<string, number> = {};
    auditLogs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    const mostCommonAction = Object.keys(actionCounts).reduce((a, b) =>
      actionCounts[a] > actionCounts[b] ? a : b, 'N/A'
    );

    return {
      totalLogs: auditLogs.length,
      todayLogs,
      uniqueUsers,
      criticalEvents,
      mostActiveUser,
      mostCommonAction
    };
  }, [auditLogs]);

  const getActionIcon = (action: string) => {
    if (action.includes('login') || action.includes('auth')) return UserIcon;
    if (action.includes('created')) return DocumentTextIcon;
    if (action.includes('updated') || action.includes('edited')) return CogIcon;
    if (action.includes('deleted')) return XCircleIcon;
    if (action.includes('approved')) return CheckCircleIcon;
    if (action.includes('rejected')) return ExclamationTriangleIcon;
    if (action.includes('role') || action.includes('permission')) return KeyIcon;
    if (action.includes('integration')) return BoltIcon;
    if (action.includes('training')) return DocumentTextIcon;
    return InformationCircleIcon;
  };

  const getActionColor = (action: string) => {
    if (action.includes('deleted') || action.includes('rejected')) return 'text-red-600 bg-red-100';
    if (action.includes('created') || action.includes('approved')) return 'text-green-600 bg-green-100';
    if (action.includes('updated') || action.includes('edited')) return 'text-gold-600 bg-gold-100';
    if (action.includes('login')) return 'text-purple-600 bg-purple-100';
    if (action.includes('role') || action.includes('permission')) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getSeverityLevel = (log: AuditLogEntry): 'info' | 'warning' | 'error' | 'critical' => {
    if (log.action.includes('deleted') || log.action === 'permission_revoked') return 'critical';
    if (log.action.includes('rejected') || log.action.includes('failed')) return 'error';
    if (log.action.includes('role_switch') || log.action.includes('permission_granted')) return 'warning';
    return 'info';
  };

  const csvEscapeField = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
  };

  const handleExportLogs = () => {
    const header = ['Timestamp', 'Entity Type', 'Entity ID', 'Action', 'User ID', 'User Name', 'User Role', 'Details'].map(csvEscapeField).join(',');
    const rows = filteredLogs.map(log => [
      log.timestamp.toISOString(),
      log.entityType,
      log.entityId,
      log.action,
      log.userId,
      log.userName || '',
      log.userRole,
      JSON.stringify(log.details),
    ].map(csvEscapeField).join(','));

    const csvContent = '\ufeff' + [header, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${filteredLogs.length} audit log entries`, 'success');
  };

  const uniqueEntityTypes = [...new Set(auditLogs.map(log => log.entityType))];
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const _uniqueUsers = [...new Set(auditLogs.map(log => log.userId))];
  const uniqueRoles = [...new Set(auditLogs.map(log => log.userRole))];

  const actions = (
    <div className="flex items-center gap-3">
      {/* Live toggle switch */}
      <div className={`flex items-center gap-2.5 text-[0.8125rem] font-semibold ${realTimeMode ? 'text-accent-teal' : 'text-muted-foreground'}`}>
        <span className={`w-2 h-2 rounded-full ${realTimeMode ? 'bg-accent-teal animate-pulse' : 'bg-border'}`} />
        <span>Live Updates</span>
        <label className="relative w-11 h-6 cursor-pointer">
          <input
            type="checkbox"
            checked={realTimeMode}
            onChange={() => setRealTimeMode(!realTimeMode)}
            className="sr-only peer"
          />
          <span className="absolute inset-0 bg-border rounded-xl transition-colors peer-checked:bg-accent-teal" />
          <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
        </label>
      </div>
      <button
        onClick={handleExportLogs}
        className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-[0.8125rem] font-semibold uppercase tracking-wider border border-border bg-card text-foreground rounded-button hover:bg-surface-navy hover:border-primary hover:text-primary transition-all"
      >
        <ArrowDownTrayIcon className="w-4 h-4" />
        Export CSV
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Audit Logs" subtitle="Loading audit trail..." actions={actions}>
        {/* Skeleton: Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-border animate-pulse" />
              <div>
                <div className="w-16 h-6 bg-border rounded animate-pulse mb-2" />
                <div className="w-24 h-3 bg-border rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton: Filter bar */}
        <div className="enterprise-card p-4 mb-6 flex gap-3">
          <div className="flex-1 max-w-[400px] h-9 bg-border rounded-control animate-pulse" />
          <div className="w-40 h-9 bg-border rounded-control animate-pulse" />
        </div>
        {/* Skeleton: Table */}
        <div className="enterprise-card overflow-hidden">
          <div className="flex gap-4 px-4 py-3.5 bg-surface-navy border-b-2 border-border">
            {[120, 100, 180, 120, 70, 100].map((w, i) => (
              <div key={i} className="bg-border rounded animate-pulse h-3" style={{ width: w }} />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex items-center gap-4 px-4 py-3.5 border-b border-border ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
              <div className="w-[130px] h-3.5 bg-border rounded animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-border animate-pulse" />
                <div className="w-24 h-3.5 bg-border rounded animate-pulse" />
              </div>
              <div className="w-[180px] h-3.5 bg-border rounded animate-pulse" />
              <div className="w-[110px] h-3.5 bg-border rounded animate-pulse" />
              <div className="w-[60px] h-[22px] bg-border rounded-button animate-pulse" />
              <div className="w-[100px] h-3.5 bg-border rounded animate-pulse" />
            </div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Audit Logs"
      subtitle="Monitor and review all system activity"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Bar — 3-column grid matching mock */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Events */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold leading-none text-foreground">{auditStats.totalLogs.toLocaleString()}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Events</p>
            </div>
          </div>

          {/* Today */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold leading-none text-foreground">{auditStats.todayLogs}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Today</p>
            </div>
          </div>

          {/* Warnings (Critical Events) */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold leading-none text-foreground">{auditStats.criticalEvents}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Warnings</p>
            </div>
          </div>

          {/* Critical */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold leading-none text-foreground">{auditStats.criticalEvents}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">Critical</p>
            </div>
          </div>

          {/* Active Users */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold leading-none text-foreground">{auditStats.uniqueUsers}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">User Actions</p>
            </div>
          </div>

          {/* Top Action */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-0.5">
            <div className="w-12 h-12 rounded-xl bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
              <BoltIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold leading-none text-foreground truncate max-w-[160px]">{auditStats.mostCommonAction}</h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1">System Events</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="enterprise-card px-5 py-4">
          <div className="flex items-center gap-3">
            {/* Search input */}
            <div className="relative flex-1 max-w-[400px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full py-2 pl-9 pr-3 rounded-control border border-border bg-card text-foreground text-[0.8125rem] placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-colors"
              />
            </div>
            {/* Advanced Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-control border text-[0.8125rem] font-semibold transition-all ${
                showFilters
                  ? 'border-primary text-primary bg-surface-navy'
                  : 'border-border text-muted-foreground bg-transparent hover:border-primary hover:text-primary hover:bg-surface-navy'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              Advanced Filters
              <svg
                className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Results count */}
            <span className="ml-auto text-[0.8125rem] text-muted-foreground whitespace-nowrap">
              Showing {filteredLogs.length.toLocaleString()} of {totalElements.toLocaleString()} events
            </span>
          </div>

          {/* Advanced Filters panel */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as AuditLogFilter['dateRange'] }))}
                  className="w-full px-3 py-2 pr-8 rounded-control border border-border bg-card text-foreground text-[0.8125rem] appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27%2364748B%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-pointer transition-colors"
                >
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Entity Type
                </label>
                <select
                  value={filters.entityType}
                  onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                  className="w-full px-3 py-2 pr-8 rounded-control border border-border bg-card text-foreground text-[0.8125rem] appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27%2364748B%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-pointer transition-colors"
                >
                  <option value="all">All Types</option>
                  {uniqueEntityTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Action Type
                </label>
                <select
                  value={filters.action}
                  onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 pr-8 rounded-control border border-border bg-card text-foreground text-[0.8125rem] appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27%2364748B%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-pointer transition-colors"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  Severity
                </label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as AuditLogFilter['severity'] }))}
                  className="w-full px-3 py-2 pr-8 rounded-control border border-border bg-card text-foreground text-[0.8125rem] appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27%2364748B%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-pointer transition-colors"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* User Role filter - fifth column wraps on next row */}
              <div>
                <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                  User Role
                </label>
                <select
                  value={filters.userRole}
                  onChange={(e) => setFilters(prev => ({ ...prev, userRole: e.target.value }))}
                  className="w-full px-3 py-2 pr-8 rounded-control border border-border bg-card text-foreground text-[0.8125rem] appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%2712%27%20height%3D%2712%27%20fill%3D%27%2364748B%27%20viewBox%3D%270%200%2016%2016%27%3E%3Cpath%20d%3D%27M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%27/%3E%3C/svg%3E')] bg-no-repeat bg-[position:right_10px_center] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-pointer transition-colors"
                >
                  <option value="all">All Roles</option>
                  {uniqueRoles.map(role => (
                    <option key={role} value={role}>{getEnumLabel('userRole', role)}</option>
                  ))}
                </select>
              </div>

              {filters.dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Date From
                    </label>
                    <input
                      type="date"
                      value={filters.customStartDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-control border border-border bg-card text-foreground text-[0.8125rem] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-text transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                      Date To
                    </label>
                    <input
                      type="date"
                      value={filters.customEndDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="w-full px-3 py-2 rounded-control border border-border bg-card text-foreground text-[0.8125rem] focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 cursor-text transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {loadError && (
          <div className="enterprise-card p-8 text-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-accent-pink mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Failed to load audit logs</h3>
            <p className="text-muted-foreground mb-4">{loadError}</p>
            <button
              onClick={() => loadAuditLogs()}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-cta text-cta-foreground rounded-button text-sm font-semibold uppercase tracking-wider hover:bg-cta-hover transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
            >
              Retry
            </button>
          </div>
        )}

        {/* Audit Logs Table */}
        {!loadError && filteredLogs.length === 0 ? (
          <EmptyState
            icon={ShieldCheckIcon}
            title="No audit logs recorded yet"
            description={auditLogs.length === 0
              ? "Audit logging is active. Events will appear here as users interact with the system."
              : "No audit logs match your current filters. Try adjusting your search or filter criteria."}
          />
        ) : !loadError && (
          <>
            <div className="enterprise-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        Timestamp
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        User
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        Action
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        Resource
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        Severity
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        Role
                      </th>
                      <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground bg-surface-navy border-b-2 border-border whitespace-nowrap select-none">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log, idx) => {
                      const ActionIcon = getActionIcon(log.action);
                      const severity = getSeverityLevel(log);

                      // Severity badge colors matching mock (pill with dot)
                      const severityStyles: Record<string, string> = {
                        info: 'bg-icon-bg-navy text-accent-navy',
                        warning: 'bg-icon-bg-gold text-accent-gold',
                        error: 'bg-icon-bg-pink text-accent-pink',
                        critical: 'bg-icon-bg-pink text-accent-pink',
                      };
                      const severityDotStyles: Record<string, string> = {
                        info: 'bg-accent-navy',
                        warning: 'bg-accent-gold',
                        error: 'bg-accent-pink',
                        critical: 'bg-accent-pink',
                      };

                      // User avatar color rotation
                      const avatarColors = [
                        { bg: 'bg-icon-bg-navy', text: 'text-accent-navy' },
                        { bg: 'bg-icon-bg-teal', text: 'text-accent-teal' },
                        { bg: 'bg-icon-bg-gold', text: 'text-accent-gold' },
                        { bg: 'bg-icon-bg-pink', text: 'text-accent-pink' },
                      ];
                      const avatarColor = avatarColors[idx % avatarColors.length];
                      const initials = (log.userName || log.userId)
                        .split(' ')
                        .map(w => w[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr
                          key={log.id}
                          className={`border-b border-border cursor-pointer transition-colors hover:bg-surface-navy ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}
                          onClick={() => setSelectedLog(log)}
                        >
                          {/* Timestamp */}
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {log.timestamp.toLocaleDateString()}{' '}
                            {log.timestamp.toLocaleTimeString()}
                          </td>
                          {/* User with avatar */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.625rem] font-bold tracking-wide flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}>
                                {initials}
                              </div>
                              <span className="text-[0.8125rem] font-semibold text-foreground whitespace-nowrap">
                                {log.userName || log.userId}
                              </span>
                            </div>
                          </td>
                          {/* Action */}
                          <td className="px-4 py-3 whitespace-nowrap text-[0.8125rem] text-foreground">
                            {getEnumLabel('auditAction', log.action)}
                          </td>
                          {/* Resource / Entity */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {log.entityType}
                          </td>
                          {/* Severity badge with dot */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              const severityConfig = getStatusConfig(auditSeverityConfig, severity);
                              const SeverityIcon = severityConfig.icon;
                              return (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wide ${severityStyles[severity]}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${severityDotStyles[severity]}`} />
                                  {severity}
                                </span>
                              );
                            })()}
                          </td>
                          {/* Role */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                            {getEnumLabel('userRole', log.userRole)}
                          </td>
                          {/* Details (eye icon) */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }}
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination — outside the table card per mock */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-[0.8125rem] text-muted-foreground">
                  Showing page {currentPage + 1} of {totalPages} ({totalElements.toLocaleString()} total events)
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => loadAuditLogs(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="h-9 px-3 rounded-control border border-border bg-card text-muted-foreground text-[0.8125rem] font-semibold flex items-center gap-1 transition-all hover:border-primary hover:text-primary hover:bg-surface-navy disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground disabled:hover:bg-card"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M15 19l-7-7 7-7" /></svg>
                    Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage < 3) {
                      pageNum = i;
                    } else if (currentPage > totalPages - 4) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => loadAuditLogs(pageNum)}
                        className={`w-9 h-9 rounded-control border text-[0.8125rem] font-semibold flex items-center justify-center transition-all ${
                          pageNum === currentPage
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-surface-navy'
                        }`}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => loadAuditLogs(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="h-9 px-3 rounded-control border border-border bg-card text-muted-foreground text-[0.8125rem] font-semibold flex items-center gap-1 transition-all hover:border-primary hover:text-primary hover:bg-surface-navy disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-border disabled:hover:text-muted-foreground disabled:hover:bg-card"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Log Detail Modal */}
        {selectedLog && (
          <div
            className="fixed inset-0 bg-foreground/50 backdrop-blur-sm flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedLog(null)}
          >
            <div
              className="bg-card rounded-2xl shadow-xl w-full max-w-[720px] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="text-xl font-bold text-foreground">Event Details</h2>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 space-y-0">
                {/* Detail rows */}
                {[
                  { label: 'Timestamp', value: selectedLog.timestamp.toLocaleString() },
                  { label: 'Action', value: getEnumLabel('auditAction', selectedLog.action) },
                  { label: 'Entity Type', value: selectedLog.entityType },
                  { label: 'Entity ID', value: selectedLog.entityId },
                  { label: 'User', value: selectedLog.userName || selectedLog.userId },
                  { label: 'User Role', value: getEnumLabel('userRole', selectedLog.userRole) },
                  { label: 'Severity', value: getSeverityLevel(selectedLog) },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex py-2.5 ${i < arr.length - 1 ? 'border-b border-border' : ''}`}>
                    <span className="w-[140px] flex-shrink-0 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-0.5">
                      {row.label}
                    </span>
                    <span className="text-sm text-foreground flex-1">
                      {row.label === 'Severity' ? (
                        (() => {
                          const sev = row.value as 'info' | 'warning' | 'error' | 'critical';
                          const styles: Record<string, string> = {
                            info: 'bg-icon-bg-navy text-accent-navy',
                            warning: 'bg-icon-bg-gold text-accent-gold',
                            error: 'bg-icon-bg-pink text-accent-pink',
                            critical: 'bg-icon-bg-pink text-accent-pink',
                          };
                          const dotStyles: Record<string, string> = {
                            info: 'bg-accent-navy',
                            warning: 'bg-accent-gold',
                            error: 'bg-accent-pink',
                            critical: 'bg-accent-pink',
                          };
                          return (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-button text-[0.6875rem] font-semibold uppercase tracking-wide ${styles[sev]}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[sev]}`} />
                              {sev}
                            </span>
                          );
                        })()
                      ) : (
                        row.value
                      )}
                    </span>
                  </div>
                ))}

                {selectedLog.userName && (
                  <div className="flex py-2.5 border-b border-border">
                    <span className="w-[140px] flex-shrink-0 text-xs font-bold uppercase tracking-widest text-muted-foreground pt-0.5">
                      User ID
                    </span>
                    <span className="text-sm text-foreground flex-1 font-mono">
                      {selectedLog.userId}
                    </span>
                  </div>
                )}

                {/* JSON details block */}
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-5 mb-2">
                  Details Payload
                </p>
                <div className="bg-slate-900 text-slate-200 rounded-control p-4 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
