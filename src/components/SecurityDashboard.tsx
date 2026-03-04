'use client';

import React, { useState } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { apiFetch } from '@/lib/api-fetch';

/**
 * Security Dashboard Component
 * Displays security status, alerts, and management tools
 */
const SecurityDashboard: React.FC = () => {
  const { user: _user, hasPermission } = useSecurity();
  const [securityReport, setSecurityReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadSecurityReport = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/security/report', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSecurityReport(data);
      }
    } catch (error) {
      console.error('Failed to load security report:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (hasPermission('SECURITY_VIEW')) {
      loadSecurityReport();
    }
  }, [hasPermission]);

  if (!hasPermission('SECURITY_VIEW')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Access Denied
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>You don&apos;t have permission to view the security dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Status Overview */}
      <div className="bg-white shadow rounded-sm">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Security Status Overview
          </h3>
          
          {loading ? (
            <div className="mt-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : securityReport ? (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <SecurityMetric
                title="Overall Risk Level"
                value={securityReport.securityMetrics?.riskLevel || 'Unknown'}
                color={getRiskColor(securityReport.securityMetrics?.riskLevel)}
              />
              <SecurityMetric
                title="Compliance Score"
                value={`${Math.round(securityReport.securityMetrics?.complianceScore || 0)}%`}
                color={getComplianceColor(securityReport.securityMetrics?.complianceScore)}
              />
              <SecurityMetric
                title="Blocked IPs"
                value={securityReport.blockedIPs?.count || 0}
                color="text-yellow-600"
              />
            </div>
          ) : null}
        </div>
      </div>

      {/* Failed Login Attempts */}
      {securityReport?.failedLogins && (
        <div className="bg-white shadow rounded-sm">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Failed Login Attempts
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-sm">
                <dt className="text-sm font-medium text-red-800">Total Attempts</dt>
                <dd className="mt-1 text-2xl font-semibold text-red-900">
                  {securityReport.failedLogins.totalAttempts}
                </dd>
              </div>
              <div className="bg-orange-50 p-4 rounded-sm">
                <dt className="text-sm font-medium text-orange-800">Unique IPs</dt>
                <dd className="mt-1 text-2xl font-semibold text-orange-900">
                  {securityReport.failedLogins.uniqueIPs}
                </dd>
              </div>
              <div className="bg-yellow-50 p-4 rounded-sm">
                <dt className="text-sm font-medium text-yellow-800">Recent (24h)</dt>
                <dd className="mt-1 text-2xl font-semibold text-yellow-900">
                  {securityReport.failedLogins.recentAttempts}
                </dd>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Security Status */}
      {securityReport?.accountSecurity && (
        <div className="bg-white shadow rounded-sm">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Account Security Status
            </h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <SecurityStat
                title="Total Users"
                value={securityReport.accountSecurity.totalUsers}
                color="text-gold-600"
              />
              <SecurityStat
                title="Enabled Users"
                value={securityReport.accountSecurity.enabledUsers}
                color="text-green-600"
              />
              <SecurityStat
                title="Locked Accounts"
                value={securityReport.accountSecurity.lockedAccounts}
                color="text-red-600"
              />
              <SecurityStat
                title="2FA Enabled"
                value={securityReport.accountSecurity.twoFactorEnabled}
                color="text-purple-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Security Recommendations */}
      {securityReport?.recommendations && securityReport.recommendations.length > 0 && (
        <div className="bg-white shadow rounded-sm">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Security Recommendations
            </h3>
            <ul className="mt-4 space-y-2">
              {securityReport.recommendations.map((rec: string, index: number) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">{rec}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-sm">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Security Actions
          </h3>
          <div className="mt-4 flex flex-wrap gap-4">
            <button
              onClick={loadSecurityReport}
              className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full text-gold-500 bg-transparent hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
            >
              Refresh Report
            </button>
            {hasPermission('SECURITY_MANAGE') && (
              <>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                  Manage IP Blocks
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
                  Export Audit Logs
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const SecurityMetric: React.FC<{ title: string; value: string | number; color: string }> = ({
  title,
  value,
  color,
}) => (
  <div className="text-center">
    <dt className="text-sm font-medium text-gray-500">{title}</dt>
    <dd className={`mt-1 text-2xl font-semibold ${color}`}>{value}</dd>
  </div>
);

const SecurityStat: React.FC<{ title: string; value: number; color: string }> = ({
  title,
  value,
  color,
}) => (
  <div>
    <dt className="text-sm font-medium text-gray-500">{title}</dt>
    <dd className={`mt-1 text-xl font-semibold ${color}`}>{value}</dd>
  </div>
);

// Helper functions
const getRiskColor = (riskLevel: string): string => {
  switch (riskLevel?.toLowerCase()) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-green-600';
    default: return 'text-gray-600';
  }
};

const getComplianceColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-yellow-600';
  return 'text-red-600';
};

export default SecurityDashboard;
