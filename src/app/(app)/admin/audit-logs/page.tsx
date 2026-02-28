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
    try {
      const result = await auditLogService.getAllAuditLogs(page, pageSize);
      setAuditLogs(result.logs);
      setCurrentPage(result.currentPage);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

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

    // Most active user
    const userCounts: Record<string, number> = {};
    auditLogs.forEach(log => {
      userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
    });
    const mostActiveUser = Object.keys(userCounts).reduce((a, b) => 
      userCounts[a] > userCounts[b] ? a : b, 'N/A'
    );

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
    const header = ['Timestamp', 'Entity Type', 'Entity ID', 'Action', 'User ID', 'User Role', 'Details'].map(csvEscapeField).join(',');
    const rows = filteredLogs.map(log => [
      log.timestamp.toISOString(),
      log.entityType,
      log.entityId,
      log.action,
      log.userId,
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
  };

  const uniqueEntityTypes = [...new Set(auditLogs.map(log => log.entityType))];
  const uniqueActions = [...new Set(auditLogs.map(log => log.action))];
  const _uniqueUsers = [...new Set(auditLogs.map(log => log.userId))];
  const uniqueRoles = [...new Set(auditLogs.map(log => log.userRole))];

  const actions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
      >
        <FunnelIcon className="w-4 h-4 mr-2" />
        Filters
      </button>
      <button
        onClick={handleExportLogs}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Export
      </button>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider">
        <ClockIcon className="w-4 h-4 mr-2" />
        Real-time View
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Audit Logs" subtitle="Loading audit trail..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Audit Logs"
      subtitle="System activity monitoring and compliance tracking"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-8 h-8 text-violet-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Logs</p>
                <p className="text-2xl font-semibold text-gray-900">{auditStats.totalLogs.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Today</p>
                <p className="text-2xl font-semibold text-gray-900">{auditStats.todayLogs}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{auditStats.uniqueUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Critical Events</p>
                <p className="text-2xl font-semibold text-gray-900">{auditStats.criticalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Most Active</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{auditStats.mostActiveUser}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BoltIcon className="w-8 h-8 text-indigo-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Top Action</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{auditStats.mostCommonAction}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-sm shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                />
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length.toLocaleString()} of {totalElements.toLocaleString()} logs
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                  <select
                    value={filters.entityType}
                    onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                  >
                    <option value="all">All Types</option>
                    {uniqueEntityTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                  <select
                    value={filters.action}
                    onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                  >
                    <option value="all">All Actions</option>
                    {uniqueActions.map(action => (
                      <option key={action} value={action}>{action}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                  <select
                    value={filters.userRole}
                    onChange={(e) => setFilters(prev => ({ ...prev, userRole: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                  >
                    <option value="all">All Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>{role.replace('_', ' ').toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>

              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filters.customStartDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filters.customEndDate || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audit Logs Table */}
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={ShieldCheckIcon}
            title="No audit logs"
            description="No audit logs match your current filters. Try adjusting your search or filter criteria."
          />
        ) : (
        <div className="bg-white rounded-sm shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  const actionColor = getActionColor(log.action);
                  const severity = getSeverityLevel(log);
                  const severityColors = {
                    info: 'bg-gold-100 text-gold-800',
                    warning: 'bg-yellow-100 text-yellow-800',
                    error: 'bg-red-100 text-red-800',
                    critical: 'bg-red-600 text-white'
                  };

                  return (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span>{log.timestamp.toLocaleDateString()}</span>
                          <span className="text-xs text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-full ${actionColor} mr-3`}>
                            <ActionIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {log.action.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.entityType}</div>
                          <div className="text-sm text-gray-500 truncate max-w-32">{log.entityId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 truncate max-w-32">
                        {log.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                          {log.userRole.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const severityConfig = getStatusConfig(auditSeverityConfig, severity);
                          const SeverityIcon = severityConfig.icon;
                          return (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${severityColors[severity]}`}>
                              <SeverityIcon className="w-3.5 h-3.5" />
                              {severity}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-gold-600 hover:text-violet-900"
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

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages} ({totalElements.toLocaleString()} total logs)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadAuditLogs(currentPage - 1)}
                  disabled={currentPage === 0}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    currentPage === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
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
                      className={`w-10 h-10 text-sm font-medium rounded-full transition-colors ${
                        pageNum === currentPage
                          ? 'bg-gold-500 text-violet-950'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => loadAuditLogs(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    currentPage >= totalPages - 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* Log Detail Modal */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Audit Log Details</h2>
                    <p className="text-gray-600 mt-1">{selectedLog.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                      <p className="text-sm text-gray-900">{selectedLog.timestamp.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Action</label>
                      <p className="text-sm text-gray-900">{selectedLog.action}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                      <p className="text-sm text-gray-900">{selectedLog.entityType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Entity ID</label>
                      <p className="text-sm text-gray-900">{selectedLog.entityId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User ID</label>
                      <p className="text-sm text-gray-900">{selectedLog.userId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Role</label>
                      <p className="text-sm text-gray-900">{selectedLog.userRole}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Details</label>
                    <div className="bg-gray-50 rounded-sm p-4">
                      <pre className="text-sm text-gray-900 whitespace-pre-wrap overflow-auto">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-sm hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
