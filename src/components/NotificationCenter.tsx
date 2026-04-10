import React, { useState, useEffect, useMemo } from 'react';
import { BellSlashIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

function mapNotificationType(type: string): 'success' | 'warning' | 'error' | 'info' {
  switch (type) {
    case 'APPLICATION_APPROVED':
    case 'OFFER_ACCEPTED':
    case 'APPLICATION_SUBMITTED':
      return 'success';
    case 'INTERVIEW_SCHEDULED':
    case 'INTERVIEW_REMINDER':
    case 'PIPELINE_STAGE_CHANGED':
      return 'warning';
    case 'APPLICATION_REJECTED':
    case 'INTERVIEW_CANCELLED':
    case 'SYSTEM_ALERT':
      return 'error';
    default:
      return 'info';
  }
}

function mapBackendNotification(n: any): Notification {
  return {
    id: String(n.id),
    type: mapNotificationType(n.type),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdAt),
    read: n.isRead ?? n.read ?? false,
    action: n.actionUrl ? { label: n.actionLabel || 'View', href: n.actionUrl } : undefined,
  };
}

const NotificationCenter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<Record<string, boolean>>({
    success: true,
    warning: true,
    error: true,
    info: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('shumelahire-notification-prefs');
      if (stored) setPreferences(JSON.parse(stored));
    } catch {}
  }, []);

  const updatePreference = (type: string, enabled: boolean) => {
    const updated = { ...preferences, [type]: enabled };
    setPreferences(updated);
    localStorage.setItem('shumelahire-notification-prefs', JSON.stringify(updated));
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function fetchNotifications() {
      try {
        const [notifRes, countRes] = await Promise.all([
          apiFetch('/api/notifications?size=20&sort=createdAt,desc'),
          apiFetch('/api/notifications/unread-count'),
        ]);
        if (cancelled) return;
        if (notifRes.ok) {
          const result = await notifRes.json();
          const content = result.content || [];
          setNotifications(content.map(mapBackendNotification));
        }
        if (countRes.ok) {
          const countData = await countRes.json();
          setUnreadCount(countData.count ?? 0);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [isAuthenticated]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiFetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      await apiFetch('/api/notifications/mark-all-read', { method: 'POST' });
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    const deletedNotification = notifications.find(n => n.id === notificationId);
    try {
      await apiFetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
    if (deletedNotification && !deletedNotification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = {};
    notifications
      .filter(n => preferences[n.type] !== false)
      .forEach(n => {
        if (!groups[n.type]) groups[n.type] = [];
        groups[n.type].push(n);
      });
    return groups;
  }, [notifications, preferences]);

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 focus-visible:outline-2 focus-visible:outline-violet-500 focus-visible:outline-offset-2 transition-colors"
      >
        <span className="sr-only">View notifications</span>
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div
            role="menu"
            aria-labelledby="notification-panel-title"
            className="absolute right-0 mt-2 w-96 bg-white rounded-sm shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 id="notification-panel-title" className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-gold-600 hover:text-gold-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Notification preferences"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preferences Panel */}
            {showPreferences && (
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Notification Preferences</h4>
                {Object.entries(preferences).map(([type, enabled]) => (
                  <label key={type} className="flex items-center justify-between py-1">
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => updatePreference(type, e.target.checked)}
                      className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                    />
                  </label>
                ))}
              </div>
            )}

            {/* Notifications List */}
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(groupedNotifications).length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={BellSlashIcon}
                    title="No notifications"
                    description="You're all caught up"
                  />
                </div>
              ) : (
                Object.entries(groupedNotifications).map(([type, groupNotifications]) => (
                  <div key={type}>
                    <button
                      onClick={() => {
                        const next = new Set(collapsedGroups);
                        if (next.has(type)) next.delete(type);
                        else next.add(type);
                        setCollapsedGroups(next);
                      }}
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100 hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                          {groupNotifications.length}
                        </span>
                      </div>
                      <span className={`text-xs text-gray-400 transition-transform ${collapsedGroups.has(type) ? '' : 'rotate-90'}`}>
                        ▶
                      </span>
                    </button>
                    {!collapsedGroups.has(type) && groupNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        role="menuitem"
                        className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 ${
                          !notification.read ? 'bg-gold-50 border-l-4 border-l-violet-500' : ''
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mr-3">
                            <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="text-gray-400 hover:text-gray-600 p-1"
                              >
                                ✕
                              </button>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatTimestamp(notification.timestamp)}
                              </span>
                              {notification.action && (
                                <a
                                  href={notification.action.href}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-gold-600 hover:text-gold-800 font-medium"
                                >
                                  {notification.action.label}
                                </a>
                              )}
                            </div>
                          </div>
                          {!notification.read && (
                            <div className="absolute top-4 right-4 w-2 h-2 bg-gold-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <a
                href="/notifications"
                role="menuitem"
                className="text-sm text-gold-600 hover:text-gold-800 font-medium"
              >
                View all notifications →
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
