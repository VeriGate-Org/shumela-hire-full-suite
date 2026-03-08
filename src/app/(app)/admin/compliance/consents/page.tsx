'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { complianceService, ConsentRecord } from '@/services/complianceService';
import { ShieldCheckIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function ConsentsPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadConsents();
  }, [page]);

  async function loadConsents() {
    setLoading(true);
    try {
      const data = await complianceService.getAllConsents(page, 20);
      setConsents(data.content);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to load consents:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FeatureGate feature="POPIA_COMPLIANCE">
      <PageWrapper title="Consent Records" subtitle="Manage POPIA consent records for all employees">
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : consents.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ShieldCheckIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No consent records found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {consents.map((consent) => (
                    <tr key={consent.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{consent.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{consent.consentType}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{consent.purpose}</td>
                      <td className="px-6 py-4 text-sm">
                        {consent.isGranted ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <ShieldCheckIcon className="h-4 w-4" /> Granted
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-600">
                            <ShieldExclamationIcon className="h-4 w-4" /> Withdrawn
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {consent.isGranted && consent.grantedAt
                          ? new Date(consent.grantedAt).toLocaleDateString()
                          : consent.withdrawnAt ? new Date(consent.withdrawnAt).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 py-4 border-t border-gray-200 dark:border-gray-700">
                  <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Previous</button>
                  <span className="px-3 py-1 text-sm">Page {page + 1} of {totalPages}</span>
                  <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1 text-sm rounded border disabled:opacity-50">Next</button>
                </div>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
