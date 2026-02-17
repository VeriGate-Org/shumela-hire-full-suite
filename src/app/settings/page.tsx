'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import {
  BellIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';

type SettingsTab = 'notifications' | 'privacy' | 'security' | 'data';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'notifications', label: 'Notifications', icon: <BellIcon className="h-4 w-4" /> },
  { id: 'privacy', label: 'Privacy', icon: <EyeSlashIcon className="h-4 w-4" /> },
  { id: 'security', label: 'Security', icon: <ShieldCheckIcon className="h-4 w-4" /> },
  { id: 'data', label: 'Data Management', icon: <DocumentArrowDownIcon className="h-4 w-4" /> },
];

/* Toggle switch */
function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-cta' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

/* Notification row */
function NotificationRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="min-w-0 pr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');

  /* Notification state */
  const [emailNotifs, setEmailNotifs] = useState({
    newApplications: true,
    interviewScheduled: true,
    offerUpdates: false,
    systemAlerts: true,
  });
  const [pushNotifs, setPushNotifs] = useState({
    newApplications: false,
    interviewScheduled: true,
    offerUpdates: false,
    systemAlerts: false,
  });

  /* Privacy state */
  const [profileVisibility, setProfileVisibility] = useState('team');
  const [showEmailToTeam, setShowEmailToTeam] = useState(true);
  const [showActivityStatus, setShowActivityStatus] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);

  /* Security state */
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sessions = [
    {
      id: '1',
      device: 'Chrome on macOS',
      icon: <ComputerDesktopIcon className="h-5 w-5 text-muted-foreground" />,
      location: 'Cape Town, ZA',
      lastActive: 'Now',
      current: true,
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      icon: <DevicePhoneMobileIcon className="h-5 w-5 text-muted-foreground" />,
      location: 'Cape Town, ZA',
      lastActive: '2 hours ago',
      current: false,
    },
    {
      id: '3',
      device: 'Firefox on Windows',
      icon: <GlobeAltIcon className="h-5 w-5 text-muted-foreground" />,
      location: 'Johannesburg, ZA',
      lastActive: '3 days ago',
      current: false,
    },
  ];

  const [activeSessions, setActiveSessions] = useState(sessions);

  const revokeSession = (id: string) => {
    setActiveSessions((prev) => prev.filter((s) => s.id !== id));
  };

  /* Render tab content */
  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Email notifications */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-4">
                Email Notifications
              </h3>
              <NotificationRow
                label="New Applications"
                description="Receive an email when a new candidate applies to your job postings"
                checked={emailNotifs.newApplications}
                onChange={(v) => setEmailNotifs((p) => ({ ...p, newApplications: v }))}
              />
              <NotificationRow
                label="Interview Scheduled"
                description="Get notified when interviews are scheduled or rescheduled"
                checked={emailNotifs.interviewScheduled}
                onChange={(v) => setEmailNotifs((p) => ({ ...p, interviewScheduled: v }))}
              />
              <NotificationRow
                label="Offer Updates"
                description="Receive updates when offer statuses change"
                checked={emailNotifs.offerUpdates}
                onChange={(v) => setEmailNotifs((p) => ({ ...p, offerUpdates: v }))}
              />
              <NotificationRow
                label="System Alerts"
                description="Important system updates and maintenance notifications"
                checked={emailNotifs.systemAlerts}
                onChange={(v) => setEmailNotifs((p) => ({ ...p, systemAlerts: v }))}
              />
            </div>

            {/* Push notifications */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-4">
                Push Notifications
              </h3>
              <NotificationRow
                label="New Applications"
                description="Browser push notification for new candidate applications"
                checked={pushNotifs.newApplications}
                onChange={(v) => setPushNotifs((p) => ({ ...p, newApplications: v }))}
              />
              <NotificationRow
                label="Interview Scheduled"
                description="Push notification when interviews are scheduled"
                checked={pushNotifs.interviewScheduled}
                onChange={(v) => setPushNotifs((p) => ({ ...p, interviewScheduled: v }))}
              />
              <NotificationRow
                label="Offer Updates"
                description="Push notification for offer status changes"
                checked={pushNotifs.offerUpdates}
                onChange={(v) => setPushNotifs((p) => ({ ...p, offerUpdates: v }))}
              />
              <NotificationRow
                label="System Alerts"
                description="Critical system alerts via push notification"
                checked={pushNotifs.systemAlerts}
                onChange={(v) => setPushNotifs((p) => ({ ...p, systemAlerts: v }))}
              />
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-5">
                Privacy Preferences
              </h3>

              {/* Profile visibility */}
              <div className="mb-5">
                <label className="form-label">Profile Visibility</label>
                <select
                  className="form-input w-full max-w-xs outline-none"
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="team">Team Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Toggle options */}
              <div className="space-y-0">
                <NotificationRow
                  label="Show email to team members"
                  description="Allow other team members to see your email address"
                  checked={showEmailToTeam}
                  onChange={setShowEmailToTeam}
                />
                <NotificationRow
                  label="Show activity status"
                  description="Let others see when you are online or recently active"
                  checked={showActivityStatus}
                  onChange={setShowActivityStatus}
                />
                <NotificationRow
                  label="Data sharing with integrations"
                  description="Allow connected third-party integrations to access your profile data"
                  checked={dataSharing}
                  onChange={setDataSharing}
                />
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            {/* Two-factor authentication */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-5">
                Two-Factor Authentication
              </h3>
              <div className="flex items-center justify-between">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-medium text-foreground">
                    {twoFactorEnabled ? '2FA is enabled' : 'Enable two-factor authentication'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Add an extra layer of security to your account using an authenticator app
                  </p>
                </div>
                <ToggleSwitch
                  checked={twoFactorEnabled}
                  onChange={setTwoFactorEnabled}
                  label="Two-factor authentication"
                />
              </div>
              {twoFactorEnabled && (
                <div className="mt-4 p-3 rounded-control bg-green-50 border border-green-200 text-green-700 text-sm">
                  Two-factor authentication is active. Use your authenticator app to generate codes at login.
                </div>
              )}
            </div>

            {/* Active Sessions */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-5">
                Active Sessions
              </h3>
              <div className="space-y-0">
                {activeSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between py-3 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {session.icon}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground flex items-center gap-2">
                          {session.device}
                          {session.current && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.05em] rounded-full bg-green-50 text-green-700 border border-green-200">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.location} &middot; {session.lastActive}
                        </p>
                      </div>
                    </div>
                    {!session.current && (
                      <button
                        onClick={() => revokeSession(session.id)}
                        className="text-xs font-semibold uppercase tracking-[0.05em] text-red-600 hover:text-red-700 transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                ))}
                {activeSessions.length === 0 && (
                  <p className="text-sm text-muted-foreground py-3">No active sessions.</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            {/* Export */}
            <div className="enterprise-card p-6">
              <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-foreground mb-5">
                Export Your Data
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download a copy of your personal data in compliance with data protection regulations.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary">
                  <ArrowDownTrayIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                  Export Personal Data
                </button>
                <button className="btn-secondary">
                  <ArrowDownTrayIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                  Download Activity Log
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="enterprise-card p-6 border-red-200">
              <div className="flex items-center gap-2 mb-4">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-red-600">
                  Danger Zone
                </h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 text-sm font-semibold uppercase tracking-[0.05em] rounded-full bg-red-50 text-red-600 border-2 border-red-300 hover:bg-red-100 transition-colors"
                >
                  <TrashIcon className="h-4 w-4 inline-block mr-1.5 -mt-0.5" />
                  Delete Account
                </button>
              ) : (
                <div className="p-4 rounded-control bg-red-50 border border-red-200">
                  <p className="text-sm font-medium text-red-700 mb-3">
                    Are you sure? This will permanently delete your account and all data.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold uppercase tracking-[0.05em] rounded-full bg-red-600 text-white border-2 border-red-600 hover:bg-red-700 transition-colors">
                      Confirm Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <PageWrapper title="Settings" subtitle="Manage your preferences and account settings">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="lg:w-56 shrink-0">
          <div className="enterprise-card p-2 flex lg:flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium rounded-control text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab content */}
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </PageWrapper>
  );
}
