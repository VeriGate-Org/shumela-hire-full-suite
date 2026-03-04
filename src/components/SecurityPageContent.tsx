'use client';

import { useState } from 'react';
import { useToast } from '@/components/Toast';
import SecurityDashboard from '@/components/SecurityDashboard';
import GDPRComplianceManager from '@/components/GDPRComplianceManager';
import { useSecurity } from '@/contexts/SecurityContext';
import { apiFetch } from '@/lib/api-fetch';

export default function SecurityPageContent() {
  const { toast } = useToast();
  const { user, hasPermission } = useSecurity();
  const [activeTab, setActiveTab] = useState<'security' | 'gdpr' | 'settings'>('security');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast('Passwords do not match', 'error');
      return;
    }

    try {
      const response = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        toast('Password changed successfully', 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast('Failed to change password', 'error');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast('An error occurred while changing password', 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security & Compliance</h1>
          <p className="mt-2 text-gray-600">
            Manage your security settings and data privacy preferences
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Security Dashboard
            </button>
            <button
              onClick={() => setActiveTab('gdpr')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gdpr'
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Privacy & GDPR
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-gold-500 text-gold-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account Security
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {activeTab === 'security' && (
            <div>
              {hasPermission('SECURITY_VIEW') ? (
                <SecurityDashboard />
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-sm p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Limited Access
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>You have limited access to security features. Contact your administrator for full access.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'gdpr' && (
            <div>
              <GDPRComplianceManager />
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Account Information */}
              <div className="bg-white shadow rounded-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Account Information
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Username</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.username}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Role</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.role}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Password Change */}
              <div className="bg-white shadow rounded-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Change Password
                </h3>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-sm shadow-sm focus:ring-gold-500/60 focus:border-violet-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-sm shadow-sm focus:ring-gold-500/60 focus:border-violet-400"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-sm shadow-sm focus:ring-gold-500/60 focus:border-violet-400"
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-white shadow rounded-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Two-Factor Authentication
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security to your account
                    </p>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      Status: {user.twoFactorEnabled ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-red-600">Disabled</span>
                      )}
                    </p>
                  </div>
                  <button
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full ${
                      user.twoFactorEnabled
                        ? 'text-red-700 bg-red-100 hover:bg-red-200'
                        : 'text-white bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {user.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                  </button>
                </div>
              </div>

              {/* Session Management */}
              <div className="bg-white shadow rounded-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Active Sessions
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Current Session</p>
                      <p className="text-sm text-gray-500">Active now</p>
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="text-sm text-red-600 hover:text-red-500">
                    Sign out of all other sessions
                  </button>
                </div>
              </div>

              {/* Security Preferences */}
              <div className="bg-white shadow rounded-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Security Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email notifications for security events
                      </label>
                      <p className="text-sm text-gray-500">
                        Get notified about login attempts and security changes
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-gold-600 focus:ring-gold-500/60 border-gray-300 rounded"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Remember this device
                      </label>
                      <p className="text-sm text-gray-500">
                        Skip 2FA on this trusted device for 30 days
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-gold-600 focus:ring-gold-500/60 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
