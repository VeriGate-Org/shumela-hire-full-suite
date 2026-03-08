'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { apiFetch } from '@/lib/api-fetch';
import { useRouter } from 'next/navigation';
import {
  UserCircleIcon,
  PhoneIcon,
  HomeIcon,
  BanknotesIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'personal' | 'banking' | 'emergency'>('personal');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [personalForm, setPersonalForm] = useState({
    preferredName: '',
    personalEmail: '',
    phone: '',
    mobilePhone: '',
    maritalStatus: '',
    physicalAddress: '',
    postalAddress: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
  });

  const [bankingForm, setBankingForm] = useState({
    bankName: '',
    bankBranchCode: '',
    bankAccountNumber: '',
  });

  const [emergencyForm, setEmergencyForm] = useState({
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
  });

  // TODO: Get from auth context
  const employeeId = 1;

  useEffect(() => {
    Promise.all([
      apiFetch(`/api/employee/profile?employeeId=${employeeId}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/employee/banking?employeeId=${employeeId}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/employee/emergency-contact?employeeId=${employeeId}`).then(r => r.ok ? r.json() : null),
    ]).then(([profile, banking, emergency]) => {
      if (profile) {
        setPersonalForm({
          preferredName: profile.preferredName || '',
          personalEmail: profile.personalEmail || '',
          phone: profile.phone || '',
          mobilePhone: profile.mobilePhone || '',
          maritalStatus: profile.maritalStatus || '',
          physicalAddress: profile.physicalAddress || '',
          postalAddress: profile.postalAddress || '',
          city: profile.city || '',
          province: profile.province || '',
          postalCode: profile.postalCode || '',
          country: profile.country || '',
        });
      }
      if (banking) {
        setBankingForm({
          bankName: banking.bankName || '',
          bankBranchCode: banking.bankBranchCode || '',
          bankAccountNumber: '',
        });
      }
      if (emergency) {
        setEmergencyForm({
          emergencyContactName: emergency.emergencyContactName || '',
          emergencyContactPhone: emergency.emergencyContactPhone || '',
          emergencyContactRelationship: emergency.emergencyContactRelationship || '',
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`/api/employee/profile?employeeId=${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(personalForm),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      setMessage({ type: 'success', text: 'Personal details updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update.' });
    }
    setSaving(false);
  };

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`/api/employee/banking?employeeId=${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(bankingForm),
      });
      if (!response.ok) throw new Error('Failed to update banking details');
      setMessage({ type: 'success', text: 'Banking details updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update.' });
    }
    setSaving(false);
  };

  const handleSaveEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await apiFetch(`/api/employee/emergency-contact?employeeId=${employeeId}`, {
        method: 'PUT',
        body: JSON.stringify(emergencyForm),
      });
      if (!response.ok) throw new Error('Failed to update emergency contact');
      setMessage({ type: 'success', text: 'Emergency contact updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update.' });
    }
    setSaving(false);
  };

  const sections = [
    { key: 'personal' as const, label: 'Personal Details', icon: UserCircleIcon },
    { key: 'banking' as const, label: 'Banking Details', icon: BanknotesIcon },
    { key: 'emergency' as const, label: 'Emergency Contact', icon: PhoneIcon },
  ];

  if (loading) {
    return (
      <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
        <PageWrapper title="Edit Profile" subtitle="Loading...">
          <div className="text-center py-12 text-gray-500">Loading profile...</div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="Edit Profile"
        subtitle="Update your personal information"
      >
        <div className="space-y-6">
          {/* Message */}
          {message && (
            <div className={`px-4 py-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          {/* Section Tabs */}
          <div className="flex gap-2 border-b pb-2">
            {sections.map(s => (
              <button key={s.key} onClick={() => { setActiveSection(s.key); setMessage(null); }}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-t-lg font-medium ${
                  activeSection === s.key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <s.icon className="w-4 h-4" /> {s.label}
              </button>
            ))}
          </div>

          {/* Personal Details */}
          {activeSection === 'personal' && (
            <form onSubmit={handleSavePersonal} className="bg-white rounded-lg shadow border p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Name</label>
                  <input type="text" value={personalForm.preferredName}
                    onChange={e => setPersonalForm({ ...personalForm, preferredName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Personal Email</label>
                  <input type="email" value={personalForm.personalEmail}
                    onChange={e => setPersonalForm({ ...personalForm, personalEmail: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={personalForm.phone}
                    onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Mobile Phone</label>
                  <input type="tel" value={personalForm.mobilePhone}
                    onChange={e => setPersonalForm({ ...personalForm, mobilePhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Marital Status</label>
                  <select value={personalForm.maritalStatus}
                    onChange={e => setPersonalForm({ ...personalForm, maritalStatus: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Civil Union">Civil Union</option>
                  </select>
                </div>
              </div>
              <h4 className="text-xs font-semibold text-gray-700 pt-2">Address</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Physical Address</label>
                  <textarea rows={2} value={personalForm.physicalAddress}
                    onChange={e => setPersonalForm({ ...personalForm, physicalAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Postal Address</label>
                  <textarea rows={2} value={personalForm.postalAddress}
                    onChange={e => setPersonalForm({ ...personalForm, postalAddress: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={personalForm.city}
                    onChange={e => setPersonalForm({ ...personalForm, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Province</label>
                  <input type="text" value={personalForm.province}
                    onChange={e => setPersonalForm({ ...personalForm, province: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Postal Code</label>
                  <input type="text" value={personalForm.postalCode}
                    onChange={e => setPersonalForm({ ...personalForm, postalCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <input type="text" value={personalForm.country}
                    onChange={e => setPersonalForm({ ...personalForm, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => router.push('/employee/portal')}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Banking Details */}
          {activeSection === 'banking' && (
            <form onSubmit={handleSaveBanking} className="bg-white rounded-lg shadow border p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Banking Details</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Bank Name</label>
                  <input type="text" value={bankingForm.bankName}
                    onChange={e => setBankingForm({ ...bankingForm, bankName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Branch Code</label>
                  <input type="text" value={bankingForm.bankBranchCode}
                    onChange={e => setBankingForm({ ...bankingForm, bankBranchCode: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Account Number</label>
                  <input type="text" value={bankingForm.bankAccountNumber}
                    onChange={e => setBankingForm({ ...bankingForm, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Enter new account number" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => router.push('/employee/portal')}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Update Banking Details'}
                </button>
              </div>
            </form>
          )}

          {/* Emergency Contact */}
          {activeSection === 'emergency' && (
            <form onSubmit={handleSaveEmergency} className="bg-white rounded-lg shadow border p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Name</label>
                  <input type="text" value={emergencyForm.emergencyContactName}
                    onChange={e => setEmergencyForm({ ...emergencyForm, emergencyContactName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contact Phone</label>
                  <input type="tel" value={emergencyForm.emergencyContactPhone}
                    onChange={e => setEmergencyForm({ ...emergencyForm, emergencyContactPhone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Relationship</label>
                  <select value={emergencyForm.emergencyContactRelationship}
                    onChange={e => setEmergencyForm({ ...emergencyForm, emergencyContactRelationship: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm">
                    <option value="">Select</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Parent">Parent</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => router.push('/employee/portal')}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Update Emergency Contact'}
                </button>
              </div>
            </form>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
