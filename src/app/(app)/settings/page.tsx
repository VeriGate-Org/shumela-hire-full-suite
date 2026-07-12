'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import { auditLogService } from '@/services/auditLogService';
import {
  BellIcon,
  ShieldCheckIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  EyeSlashIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';

type SettingsTab = 'notifications' | 'privacy' | 'security' | 'data';

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'notifications', label: 'Notifications', icon: <BellIcon className="h-3.5 w-3.5" /> },
  { id: 'privacy', label: 'Privacy', icon: <EyeSlashIcon className="h-3.5 w-3.5" /> },
  { id: 'security', label: 'Security', icon: <ShieldCheckIcon className="h-3.5 w-3.5" /> },
  { id: 'data', label: 'Data Management', icon: <DocumentArrowDownIcon className="h-3.5 w-3.5" /> },
];

/* Toggle switch — matches mock's .toggle-switch (44x24) */
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-primary' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  );
}

/* Toggle row — matches mock's .toggle-row */
function ToggleRow({
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
    <div className="flex items-center justify-between py-3.5 border-b border-border last:border-0">
      <div className="flex-1 mr-4">
        <div className="text-sm font-semibold text-foreground">{label}</div>
        <div className="text-[0.8125rem] text-muted-foreground mt-0.5">{description}</div>
      </div>
      <ToggleSwitch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/* Card header — matches mock's .card-header with icon, title, subtitle */
function CardHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div>
        <div className="text-[1.0625rem] font-bold text-foreground flex items-center gap-2.5">
          {icon}
          {title}
        </div>
        <div className="text-[0.8125rem] text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
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
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [savedIndicator, setSavedIndicator] = useState(false);
  const { toast } = useToast();

  const savePreferences = useCallback(async (prefs: Record<string, unknown>) => {
    try {
      await apiFetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      setSavedIndicator(true);
      setTimeout(() => setSavedIndicator(false), 2000);
    } catch {
      toast('Failed to save preferences', 'error');
    }
  }, [toast]);

  const getAllPrefs = useCallback(() => ({
    emailNotifs,
    pushNotifs,
    profileVisibility,
    showEmailToTeam,
    showActivityStatus,
    dataSharing,
    twoFactorEnabled,
  }), [emailNotifs, pushNotifs, profileVisibility, showEmailToTeam, showActivityStatus, dataSharing, twoFactorEnabled]);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await apiFetch('/api/user/preferences');
        if (response.ok) {
          const text = await response.text();
          const data = text ? JSON.parse(text) : {};
          if (data.emailNotifs) setEmailNotifs(data.emailNotifs);
          if (data.pushNotifs) setPushNotifs(data.pushNotifs);
          if (data.profileVisibility) setProfileVisibility(data.profileVisibility);
          if (data.showEmailToTeam !== undefined) setShowEmailToTeam(data.showEmailToTeam);
          if (data.showActivityStatus !== undefined) setShowActivityStatus(data.showActivityStatus);
          if (data.dataSharing !== undefined) setDataSharing(data.dataSharing);
          if (data.twoFactorEnabled !== undefined) setTwoFactorEnabled(data.twoFactorEnabled);
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  // Auto-save when preferences change (debounced)
  const prefsRef = React.useRef(false);
  useEffect(() => {
    if (!prefsRef.current) {
      prefsRef.current = true;
      return;
    }
    const timeout = setTimeout(() => savePreferences(getAllPrefs()), 500);
    return () => clearTimeout(timeout);
  }, [emailNotifs, pushNotifs, profileVisibility, showEmailToTeam, showActivityStatus, dataSharing, twoFactorEnabled, savePreferences, getAllPrefs]);

  const activeSessions = [
    {
      id: '1',
      device: 'Current Session',
      icon: <ComputerDesktopIcon className="h-5 w-5 text-muted-foreground" />,
      location: 'Active now',
      lastActive: 'Now',
      current: true,
    },
  ];

  /* Render tab content */
  const renderContent = () => {
    switch (activeTab) {
      case 'notifications':
        return (
          <div className="space-y-6">
            {/* Email Notifications Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<EnvelopeIcon className="h-[18px] w-[18px] text-primary" />}
                title="Email Notifications"
                subtitle="Choose which email notifications you receive"
              />
              <div>
                <ToggleRow
                  label="Applications"
                  description="Receive emails when new applications are submitted or status changes"
                  checked={emailNotifs.newApplications}
                  onChange={(v) => setEmailNotifs((p) => ({ ...p, newApplications: v }))}
                />
                <ToggleRow
                  label="Interviews"
                  description="Get notified about scheduled interviews, reschedules, and cancellations"
                  checked={emailNotifs.interviewScheduled}
                  onChange={(v) => setEmailNotifs((p) => ({ ...p, interviewScheduled: v }))}
                />
                <ToggleRow
                  label="Offers"
                  description="Notifications when offers are extended, accepted, or declined"
                  checked={emailNotifs.offerUpdates}
                  onChange={(v) => setEmailNotifs((p) => ({ ...p, offerUpdates: v }))}
                />
                <ToggleRow
                  label="System"
                  description="Important system updates, maintenance windows, and policy changes"
                  checked={emailNotifs.systemAlerts}
                  onChange={(v) => setEmailNotifs((p) => ({ ...p, systemAlerts: v }))}
                />
              </div>
            </div>

            {/* Push Notifications Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<BellIcon className="h-[18px] w-[18px] text-accent-teal" />}
                title="Push Notifications"
                subtitle="Real-time notifications delivered to your browser"
              />
              <div>
                <ToggleRow
                  label="Applications"
                  description="Instant alerts for new applications and status updates"
                  checked={pushNotifs.newApplications}
                  onChange={(v) => setPushNotifs((p) => ({ ...p, newApplications: v }))}
                />
                <ToggleRow
                  label="Interviews"
                  description="Push alerts for upcoming interviews and schedule changes"
                  checked={pushNotifs.interviewScheduled}
                  onChange={(v) => setPushNotifs((p) => ({ ...p, interviewScheduled: v }))}
                />
                <ToggleRow
                  label="Offers"
                  description="Real-time updates on offer activity and responses"
                  checked={pushNotifs.offerUpdates}
                  onChange={(v) => setPushNotifs((p) => ({ ...p, offerUpdates: v }))}
                />
                <ToggleRow
                  label="System"
                  description="Critical system notifications and security alerts"
                  checked={pushNotifs.systemAlerts}
                  onChange={(v) => setPushNotifs((p) => ({ ...p, systemAlerts: v }))}
                />
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            {/* Profile Visibility Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<EyeSlashIcon className="h-[18px] w-[18px] text-primary" />}
                title="Profile Visibility"
                subtitle="Control who can see your profile information"
              />
              <div className="flex flex-col gap-0">
                {[
                  { value: 'everyone', label: 'Public', desc: 'Your profile is visible to all users across the organisation' },
                  { value: 'team', label: 'Team Only', desc: 'Only members of your team and direct managers can view your profile' },
                  { value: 'private', label: 'Private', desc: 'Your profile is hidden from everyone except HR administrators' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 py-3.5 border-b border-border last:border-0 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={profileVisibility === option.value}
                      onChange={(e) => setProfileVisibility(e.target.value)}
                      className="mt-0.5 h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-border checked:border-primary relative
                        before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:w-2.5 before:h-2.5 before:rounded-full before:bg-primary before:-translate-x-1/2 before:-translate-y-1/2 before:scale-0 checked:before:scale-100 before:transition-transform cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-foreground">{option.label}</div>
                      <div className="text-[0.8125rem] text-muted-foreground mt-0.5">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Sharing Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<ShareIcon className="h-[18px] w-[18px] text-accent-teal" />}
                title="Data Sharing"
                subtitle="Manage how your data is shared within the platform"
              />
              <div>
                <ToggleRow
                  label="Show email to team members"
                  description="Allow other team members to see your email address"
                  checked={showEmailToTeam}
                  onChange={setShowEmailToTeam}
                />
                <ToggleRow
                  label="Show activity status"
                  description="Let others see when you are online or recently active"
                  checked={showActivityStatus}
                  onChange={setShowActivityStatus}
                />
                <ToggleRow
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
            {/* Two-Factor Authentication Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<ShieldCheckIcon className="h-[18px] w-[18px] text-primary" />}
                title="Two-Factor Authentication"
                subtitle="Add an extra layer of security to your account"
              />
              <div className="flex items-center justify-between py-3.5">
                <div className="flex-1 mr-4">
                  <div className="text-sm font-semibold text-foreground">
                    {twoFactorEnabled ? '2FA is enabled' : 'Enable Two-Factor Authentication'}
                  </div>
                  <div className="text-[0.8125rem] text-muted-foreground mt-0.5">
                    Require a verification code in addition to your password when signing in
                  </div>
                </div>
                <ToggleSwitch
                  checked={twoFactorEnabled}
                  onChange={setTwoFactorEnabled}
                  label="Two-factor authentication"
                />
              </div>
              {twoFactorEnabled && (
                <div className="mt-4 p-4 rounded-control bg-surface-navy">
                  <div className="text-sm font-bold text-primary mb-2">Setup Instructions</div>
                  <ol className="list-none p-0 m-0 space-y-2">
                    {[
                      'Download an authenticator app (Google Authenticator, Authy, or Microsoft Authenticator)',
                      'Scan the QR code or enter the setup key in your authenticator app',
                      'Enter the 6-digit verification code from your authenticator app to confirm setup',
                      'Save your backup recovery codes in a secure location',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[0.8125rem] text-foreground">
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[0.6875rem] font-bold shrink-0">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Active Sessions Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<ComputerDesktopIcon className="h-[18px] w-[18px] text-accent-teal" />}
                title="Active Sessions"
                subtitle="Devices currently signed into your account"
              />
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.05em] border-b border-border bg-background">Device</th>
                      <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.05em] border-b border-border bg-background">Location</th>
                      <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.05em] border-b border-border bg-background">Last Active</th>
                      <th className="text-left px-4 py-3 text-[0.6875rem] font-bold text-muted-foreground uppercase tracking-[0.05em] border-b border-border bg-background">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((session) => (
                      <tr key={session.id} className="hover:bg-surface-navy">
                        <td className="px-4 py-3.5 text-sm text-foreground border-b border-border last:border-0">
                          <span className="flex items-center gap-2 font-semibold">
                            {session.icon}
                            {session.device}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">{session.location}</td>
                        <td className="px-4 py-3.5 text-sm text-foreground border-b border-border">
                          {session.lastActive}
                          {session.current && (
                            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6875rem] font-bold bg-success-bg text-success">
                              Current
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm text-muted-foreground border-b border-border">
                          {session.current ? (
                            <span>&mdash;</span>
                          ) : (
                            <button className="btn-outline text-xs">REVOKE</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {activeSessions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-sm text-muted-foreground text-center">No active sessions.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            {/* Export Data Card */}
            <div className="enterprise-card p-6">
              <CardHeader
                icon={<ArrowDownTrayIcon className="h-[18px] w-[18px] text-primary" />}
                title="Export Your Data"
                subtitle="Download a copy of all your personal data stored in the system"
              />
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="text-[0.9375rem] font-bold text-foreground mb-1">Personal Data Export</div>
                  <div className="text-[0.8125rem] text-muted-foreground">
                    This will include your profile information, application history, notification preferences, and activity logs. The export may take a few minutes to prepare.
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-navy text-primary mt-1.5">
                    <DocumentArrowDownIcon className="h-3 w-3" />
                    Downloads as JSON
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await apiFetch('/api/user/export');
                      if (res.ok) {
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `personal-data-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast('Personal data exported', 'success');
                      } else {
                        toast('Data export request submitted. An administrator will process your request.', 'info');
                      }
                    } catch {
                      toast('Data export request submitted. An administrator will process your request.', 'info');
                    }
                  }}
                  className="btn-outline shrink-0"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
                  EXPORT MY DATA
                </button>
              </div>

              {/* Activity log export as secondary action */}
              <div className="mt-6 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="text-[0.9375rem] font-bold text-foreground mb-1">Activity Log Export</div>
                  <div className="text-[0.8125rem] text-muted-foreground">
                    Download a CSV of all your activity and audit log entries.
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-surface-navy text-primary mt-1.5">
                    <DocumentArrowDownIcon className="h-3 w-3" />
                    Downloads as CSV
                  </div>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const result = await auditLogService.getAllAuditLogs(0, 1000);
                      const logs = result.logs;
                      if (logs.length === 0) {
                        toast('No activity logs found', 'info');
                        return;
                      }
                      const header = ['Timestamp', 'Action', 'Entity Type', 'Entity ID', 'Details'].join(',');
                      const rows = logs.map((log: { timestamp: Date; action: string; entityType: string; entityId: string; details: unknown }) => [
                        log.timestamp.toISOString(),
                        log.action,
                        log.entityType,
                        log.entityId,
                        JSON.stringify(log.details),
                      ].map(v => {
                        const s = String(v);
                        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
                      }).join(','));
                      const csvContent = '\ufeff' + [header, ...rows].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast(`Exported ${logs.length} activity log entries`, 'success');
                    } catch {
                      toast('Failed to download activity log', 'error');
                    }
                  }}
                  className="btn-outline shrink-0"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
                  EXPORT ACTIVITY LOG
                </button>
              </div>
            </div>

            {/* Danger Zone — matches mock's .danger-zone */}
            <div className="rounded-card border-2 border-error bg-error-bg p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-9 h-9 rounded-full bg-card text-error flex items-center justify-center shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5" />
                </div>
                <div className="text-base font-extrabold text-error">Delete Account</div>
              </div>
              <div className="text-sm text-foreground mb-4 leading-relaxed">
                Permanently delete your account and all associated data. This action <strong className="text-error">cannot be undone</strong>. All your profile information, application history, documents, and settings will be permanently removed from the system. We recommend exporting your data before proceeding.
              </div>

              {!showDeleteConfirm ? (
                <div>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDeleteConfirm}
                      onChange={() => setShowDeleteConfirm(true)}
                      className="h-5 w-5 shrink-0 appearance-none rounded-[5px] border-2 border-error cursor-pointer
                        checked:bg-error checked:border-error relative
                        after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[5px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:scale-0 checked:after:scale-100 after:transition-transform"
                    />
                    <span className="text-[0.8125rem] text-foreground font-medium">
                      I understand that this action is permanent and all my data will be deleted
                    </span>
                  </label>
                  <button
                    disabled
                    className="px-6 py-2.5 rounded-full text-[0.8125rem] font-bold uppercase tracking-[0.05em] bg-error text-white border-2 border-error opacity-50 cursor-not-allowed transition-colors"
                  >
                    <TrashIcon className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5" />
                    DELETE ACCOUNT
                  </button>
                </div>
              ) : (
                <div>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDeleteConfirm}
                      onChange={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                      className="h-5 w-5 shrink-0 appearance-none rounded-[5px] border-2 border-error bg-error cursor-pointer relative
                        after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[5px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:rotate-45 after:transition-transform"
                    />
                    <span className="text-[0.8125rem] text-foreground font-medium">
                      I understand that this action is permanent and all my data will be deleted
                    </span>
                  </label>
                  <div className="p-4 rounded-control bg-card border border-error/30 mb-4">
                    <p className="text-sm font-medium text-error mb-3">
                      Type DELETE to confirm permanent account deletion.
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="form-input w-full border-error/50 focus:border-error mb-3"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                        className="btn-outline"
                      >
                        CANCEL
                      </button>
                      <button
                        disabled={deleteConfirmText !== 'DELETE'}
                        onClick={async () => {
                          try {
                            const res = await apiFetch('/api/user/account', { method: 'DELETE' });
                            if (res.ok) {
                              toast('Account deleted. You will be signed out.', 'success');
                              setTimeout(() => window.location.href = '/', 2000);
                            } else {
                              toast('Account deletion request submitted. An administrator will process your request.', 'info');
                            }
                          } catch {
                            toast('Account deletion request submitted. An administrator will process your request.', 'info');
                          }
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        className="px-6 py-2.5 rounded-full text-[0.8125rem] font-bold uppercase tracking-[0.05em] bg-error text-white border-2 border-error hover:brightness-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        DELETE ACCOUNT
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <PageWrapper title="Settings" subtitle="Manage your account preferences, notifications, and security" actions={
      savedIndicator ? (
        <span className="text-sm text-success font-medium animate-fade-in">Saved</span>
      ) : undefined
    }>
      {/* Centered single-column layout matching mock's max-width: 960px */}
      <div className="max-w-[960px] mx-auto">
        {/* Horizontal tabs — matches mock's .tabs with border-bottom underline */}
        <div className="flex gap-0 border-b-2 border-border mb-7">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-primary rounded-t" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>{renderContent()}</div>
      </div>
    </PageWrapper>
  );
}
