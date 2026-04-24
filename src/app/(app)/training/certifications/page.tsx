'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, Certification } from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export default function CertificationsPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId || user?.id || '1';

  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'expiring' | 'expired'>('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    employeeId,
    name: '',
    issuingBody: '',
    certificationNumber: '',
    issueDate: '',
    expiryDate: '',
    documentUrl: '',
  });

  useEffect(() => {
    loadCertifications();
  }, [filter]);

  const loadCertifications = async () => {
    setLoading(true);
    const params: any = {};
    if (filter === 'expiring') params.expiring = true;
    else if (filter === 'expired') params.expired = true;
    else params.employeeId = employeeId;
    const data = await trainingService.getCertifications(params);
    setCertifications(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trainingService.createCertification(form);
      setShowForm(false);
      setForm({ employeeId: '1', name: '', issuingBody: '', certificationNumber: '', issueDate: '', expiryDate: '', documentUrl: '' });
      loadCertifications();
    } catch (err: any) {
      alert(err.message || 'Failed to create certification');
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    REVOKED: 'bg-gray-100 text-gray-500',
    PENDING_RENEWAL: 'bg-amber-100 text-amber-700',
  };

  const renewalStatusColors: Record<string, string> = {
    PENDING_RENEWAL: 'bg-amber-100 text-amber-700',
    RENEWAL_SUBMITTED: 'bg-blue-100 text-blue-700',
    RENEWED: 'bg-green-100 text-green-700',
  };

  const handleRenewal = async (certId: string) => {
    try {
      await trainingService.updateCertification(certId, { renewalStatus: 'RENEWAL_SUBMITTED' } as any);
      loadCertifications();
    } catch (err: any) {
      alert(err.message || 'Failed to initiate renewal');
    }
  };

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Certifications"
        subtitle="Manage your professional certifications"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Add Certification
          </button>
        }
      >
        <div className="space-y-6">
          {/* Filter */}
          <div className="flex gap-2">
            {(['all', 'expiring', 'expired'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 text-sm rounded-lg font-medium ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border hover:bg-gray-50'
                }`}
              >
                {f === 'all' ? 'My Certifications' : f === 'expiring' ? 'Expiring Soon' : 'Expired'}
              </button>
            ))}
          </div>

          {/* Add Form */}
          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow border p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Add New Certification</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Certification Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issuing Body</label>
                  <input type="text" value={form.issuingBody} onChange={e => setForm({ ...form, issuingBody: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Certification Number</label>
                  <input type="text" value={form.certificationNumber} onChange={e => setForm({ ...form, certificationNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date</label>
                  <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Document URL</label>
                  <input type="url" value={form.documentUrl} onChange={e => setForm({ ...form, documentUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Certification</button>
              </div>
            </form>
          )}

          {/* Certifications List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading certifications...</div>
          ) : certifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow border">
              No certifications found.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow border overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certification</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issuing Body</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Renewal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {certifications.map(cert => (
                    <tr key={cert.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{cert.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cert.issuingBody || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cert.certificationNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{cert.issueDate || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center gap-1">
                          {cert.expiringSoon && <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />}
                          {cert.expiryDate || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[cert.status] || ''}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(cert as any).renewalStatus ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${renewalStatusColors[(cert as any).renewalStatus] || 'bg-gray-100 text-gray-600'}`}>
                            {(cert as any).renewalStatus.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(cert.expiringSoon || cert.expired) && !(cert as any).renewalStatus && (
                          <button
                            onClick={() => handleRenewal(cert.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
                          >
                            Renew
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
