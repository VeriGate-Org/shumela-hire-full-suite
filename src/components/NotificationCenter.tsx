'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellIcon, BellSlashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import EmptyState from '@/components/EmptyState';
import HeaderPopover, { HEADER_TRIGGER } from '@/components/chrome/HeaderPopover';
import { Tone, formatRelativeTime, partition, toneFor } from '@/components/chrome/notifications';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';

interface Notification {
  id: string;
  tone: Tone;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface BackendNotification {
  id: string | number;
  type?: string;
  title: string;
  message: string;
  createdAt: string;
  isRead?: boolean;
  read?: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

function mapBackendNotification(n: BackendNotification): Notification {
  return {
    id: String(n.id),
    tone: toneFor(n.type),
    title: n.title,
    message: n.message,
    timestamp: new Date(n.createdAt),
    read: n.isRead ?? n.read ?? false,
    action: n.actionUrl ? { label: n.actionLabel || 'View', href: n.actionUrl } : undefined,
  };
}

/** A tone marker, not a severity icon. Neutral — most of them — carries no colour at all. */
const TONE_DOT: Record<Tone, string> = {
  attention: 'bg-accent-pink',
  positive: 'bg-accent-teal',
  neutral: 'bg-transparent',
};

const NotificationCenter: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  // Unread first, newest first within each part. Grouping by severity is gone: it sorted on a value
  // that was "info" for 28 of the backend's 37 types, so the groups carried no information.
  const { unread, earlier } = useMemo(() => partition(notifications), [notifications]);
  const close = useCallback(() => setIsOpen(false), []);

  const row = (notification: Notification, isUnread: boolean) => (
    <div
      key={notification.id}
      className={`grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-border px-4 py-3 last:border-b-0 ${
        isUnread ? 'bg-surface-gold shadow-[inset_2px_0_0_var(--cta)]' : ''
      }`}
    >
      {/* The unread marker lives on the left. It used to be absolutely positioned at top-4 right-4,
          directly underneath the dismiss button. */}
      <span
        aria-hidden="true"
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
          isUnread && notification.tone === 'neutral' ? 'bg-cta' : TONE_DOT[notification.tone]
        }`}
      />

      <button
        type="button"
        onClick={() => isUnread && markAsRead(notification.id)}
        className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-control"
      >
        <span className="block text-sm font-semibold leading-snug text-foreground">
          {notification.title}
        </span>
        <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-muted-foreground">
          {notification.message}
        </span>
        <span className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatRelativeTime(notification.timestamp)}</span>
          {notification.action && (
            <a
              href={notification.action.href}
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-link hover:text-link-hover"
            >
              {notification.action.label}
            </a>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => deleteNotification(notification.id)}
        aria-label={`Dismiss ${notification.title}`}
        className="rounded-control p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        className={HEADER_TRIGGER}
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          // The count is a count, not an alarm. It was bg-red-500 at any value, which reads as an
          // error for what is usually routine activity — and white on red-500 measures 3.76:1,
          // below the 4.5:1 needed. cta-foreground on cta is 8.60:1.
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-cta px-1 text-[11px] font-bold leading-none text-cta-foreground tabular-nums"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* The count changed silently for a screen reader before. */}
      <span aria-live="polite" className="sr-only">
        {unreadCount > 0 ? `${unreadCount} unread notifications` : 'No unread notifications'}
      </span>

      <HeaderPopover
        open={isOpen}
        onClose={close}
        label="Notifications"
        triggerRef={triggerRef}
        header={
          <div className="flex items-center justify-between gap-2 px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="rounded-control px-1 py-0.5 text-xs font-medium text-link hover:text-link-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Mark all read
              </button>
            )}
          </div>
        }
        footer={
          <a
            href="/notifications"
            className="block px-4 py-2.5 text-sm font-medium text-link hover:text-link-hover"
          >
            View all notifications →
          </a>
        }
      >
        {notifications.length === 0 ? (
          <div className="px-4 py-8">
            <EmptyState
              icon={BellSlashIcon}
              title="No notifications"
              description="You're all caught up"
            />
          </div>
        ) : (
          <>
            {unread.map((notification) => row(notification, true))}
            {earlier.length > 0 && (
              <div className="border-b border-border bg-muted px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Earlier
              </div>
            )}
            {earlier.map((notification) => row(notification, false))}
          </>
        )}
      </HeaderPopover>
    </div>
  );
};

export default NotificationCenter;
