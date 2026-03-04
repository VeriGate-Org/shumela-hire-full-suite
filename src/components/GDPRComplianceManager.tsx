'use client';

import React, { useState, useEffect } from 'react';
import { useSecurity } from '@/contexts/SecurityContext';
import { useToast } from '@/components/Toast';
import { apiFetch } from '@/lib/api-fetch';

/**
 * GDPR Compliance Manager Component
 * Handles data privacy requests, consent management, and compliance reporting
 */
const GDPRComplianceManager: React.FC = () => {
  const { user, hasPermission } = useSecurity();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'exports' | 'retention'>('overview');
  const [complianceData, setComplianceData] = useState<any>(null);
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (hasPermission('GDPR_VIEW')) {
      loadComplianceData();
    }
  }, [hasPermission]);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      const [complianceResponse, requestsResponse] = await Promise.all([
        apiFetch('/api/gdpr/compliance-status', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        }),
        apiFetch('/api/gdpr/requests', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        }),
      ]);

      if (complianceResponse.ok) {
        setComplianceData(await complianceResponse.json());
      }
      
      if (requestsResponse.ok) {
        setDataRequests(await requestsResponse.json());
      }
    } catch (error) {
      console.error('Failed to load GDPR data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDataRequest = async (requestType: string, details: string) => {
    try {
      const response = await apiFetch('/api/gdpr/data-request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType,
          details,
          userId: user?.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast(`Request submitted successfully. Request ID: ${result.requestId}`, 'success');
        loadComplianceData();
      }
    } catch (error) {
      console.error('Failed to submit data request:', error);
      toast('Failed to submit request. Please try again.', 'error');
    }
  };

  const exportUserData = async () => {
    try {
      const response = await apiFetch(`/api/gdpr/export-data/${user?.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `user-data-export-${user?.id}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (!hasPermission('GDPR_VIEW')) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-sm p-4">
        <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
        <p className="mt-2 text-sm text-red-700">
          You don&apos;t have permission to view GDPR compliance information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'requests', label: 'Data Requests' },
            { key: 'exports', label: 'Data Exports' },
            { key: 'retention', label: 'Data Retention' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              GDPR Compliance Overview
            </h3>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gold-50 p-4 rounded-sm">
                  <h4 className="text-sm font-medium text-violet-900">Compliance Score</h4>
                  <p className="text-2xl font-bold text-gold-600">
                    {complianceData?.complianceScore || 0}%
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-sm">
                  <h4 className="text-sm font-medium text-green-900">Active Consents</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {complianceData?.activeConsents || 0}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-sm">
                  <h4 className="text-sm font-medium text-yellow-900">Pending Requests</h4>
                  <p className="text-2xl font-bold text-yellow-600">
                    {complianceData?.pendingRequests || 0}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Data Categories */}
          <div className="bg-white shadow rounded-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Data Categories We Process
            </h3>
            <div className="space-y-4">
              {[
                {
                  category: 'Personal Information',
                  data: 'Name, email, username',
                  purpose: 'Account creation and identification',
                  legalBasis: 'Contract performance',
                },
                {
                  category: 'Authentication Data',
                  data: 'Password hash, login history',
                  purpose: 'Security and account protection',
                  legalBasis: 'Legitimate interest',
                },
                {
                  category: 'Usage Data',
                  data: 'Login times, feature usage',
                  purpose: 'Service improvement',
                  legalBasis: 'Legitimate interest',
                },
                {
                  category: 'Audit Logs',
                  data: 'System interactions, changes',
                  purpose: 'Compliance monitoring',
                  legalBasis: 'Legal obligation',
                },
              ].map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-sm p-4">
                  <h4 className="font-medium text-gray-900">{item.category}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Data:</strong> {item.data}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Purpose:</strong> {item.purpose}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Legal Basis:</strong> {item.legalBasis}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your Data Rights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  right: 'Right to Access',
                  description: 'Request a copy of your personal data',
                  action: () => handleDataRequest('ACCESS', 'Request for data access'),
                },
                {
                  right: 'Right to Rectification',
                  description: 'Correct inaccurate personal data',
                  action: () => handleDataRequest('RECTIFICATION', 'Request for data correction'),
                },
                {
                  right: 'Right to Erasure',
                  description: 'Request deletion of your data',
                  action: () => handleDataRequest('ERASURE', 'Request for data deletion'),
                },
                {
                  right: 'Right to Portability',
                  description: 'Export your data in a machine-readable format',
                  action: exportUserData,
                },
              ].map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-sm p-4">
                  <h4 className="font-medium text-gray-900">{item.right}</h4>
                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                  <button
                    onClick={item.action}
                    className="mt-3 inline-flex items-center px-3 py-2 border-2 border-gold-500 text-sm leading-4 font-medium rounded-full text-gold-500 bg-transparent hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
                  >
                    Submit Request
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white shadow rounded-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Requests
            </h3>
            {dataRequests.length > 0 ? (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-sm">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dataRequests.map((request, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            request.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(request.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-gold-600 hover:text-violet-900 rounded-full">
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No recent requests found.</p>
            )}
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {activeTab === 'exports' && (
        <div className="bg-white shadow rounded-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Data Export
          </h3>
          <p className="text-gray-600 mb-4">
            Export all your personal data in a machine-readable format (JSON).
          </p>
          <button
            onClick={exportUserData}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-sm text-white bg-green-600 hover:bg-green-700"
          >
            Download My Data
          </button>
        </div>
      )}

      {activeTab === 'retention' && (
        <div className="bg-white shadow rounded-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Data Retention Policy
          </h3>
          <div className="space-y-4">
            <div className="border-l-4 border-gold-500 pl-4">
              <h4 className="font-medium text-gray-900">Account Data</h4>
              <p className="text-sm text-gray-600">
                Retained as long as your account is active, plus 2 years after account closure.
              </p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-medium text-gray-900">Audit Logs</h4>
              <p className="text-sm text-gray-600">
                Retained for 7 years for compliance and security purposes.
              </p>
            </div>
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-medium text-gray-900">Backup Data</h4>
              <p className="text-sm text-gray-600">
                Retained for 30 days in encrypted backups for disaster recovery.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GDPRComplianceManager;
