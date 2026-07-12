'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import {
  BellIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XMarkIcon,
  CheckCircleIcon,
  CalendarIcon,
  StarIcon,
  DocumentTextIcon,
  CogIcon,
  ChatBubbleLeftIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  MegaphoneIcon,
  ClockIcon,
  ChevronRightIcon,
  CursorArrowRaysIcon,
  FunnelIcon,
  CheckIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DemoState = 'normal' | 'skeleton' | 'error';
type NotificationFilter = 'all' | 'unread' | 'read';

type NotificationType =
  | 'leave'
  | 'performance'
  | 'document'
  | 'system'
  | 'message'
  | 'training'
  | 'payslip'
  | 'announcement';

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

interface SearchResult {
  title: string;
  sub: string;
  badge?: string;
}

interface SearchCategory {
  key: string;
  label: string;
  results: SearchResult[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, type: 'leave', title: 'Leave request approved', desc: 'Your annual leave from 15-17 Jul has been approved by Dr. Nkosi', time: '30 min ago', unread: true },
  { id: 2, type: 'performance', title: 'Performance review reminder', desc: 'Your Q2 self-assessment is due on 15 July', time: '1h ago', unread: true },
  { id: 3, type: 'document', title: 'Document expiring', desc: 'Your Safety Compliance certificate expires on 31 Jul', time: '2h ago', unread: true },
  { id: 4, type: 'system', title: 'System maintenance', desc: 'Scheduled maintenance on 15 Jul from 22:00-02:00', time: '3h ago', unread: true },
  { id: 5, type: 'message', title: 'New message from Nomvula Dlamini', desc: 'Hi Sipho, your performance review feedback has been submitted. Please review the comments when you have a moment.', time: '5h ago', unread: true },
  { id: 6, type: 'leave', title: 'Team leave request', desc: 'Lindiwe Ngcobo has requested annual leave 14-16 Jul', time: '6h ago', unread: true },
  { id: 7, type: 'training', title: 'Course enrollment confirmed', desc: 'You are enrolled in Leadership Excellence Program', time: 'Yesterday', unread: true },
  { id: 8, type: 'payslip', title: 'Payslip available', desc: 'Your June 2026 payslip is ready to view', time: '2 days ago', unread: false },
  { id: 9, type: 'announcement', title: 'New announcement', desc: '2026/2027 Budget Approval', time: '4 days ago', unread: false },
  { id: 10, type: 'leave', title: 'Leave balance updated', desc: 'Your annual leave balance has been recalculated', time: '5 days ago', unread: false },
  { id: 11, type: 'performance', title: 'Goal updated', desc: "Your Q2 goal 'Reduce water loss' progress updated", time: '1 week ago', unread: false },
  { id: 12, type: 'system', title: 'Password change reminder', desc: 'Please update your password within 14 days', time: '1 week ago', unread: false },
];

const INITIAL_RECENT_SEARCHES = ['performance review', 'leave balance', 'Nomvula Dlamini'];

const SEARCH_DATA: SearchCategory[] = [
  {
    key: 'employees',
    label: 'Employees',
    results: [
      { title: 'Mandla Shabalala', sub: 'Water Quality Technician', badge: 'Active' },
      { title: 'Lindiwe Ngcobo', sub: 'Water Process Controller', badge: 'Active' },
    ],
  },
  {
    key: 'pages',
    label: 'Pages',
    results: [
      { title: 'Water Quality Reports', sub: 'Reports > Water Quality' },
      { title: 'Water Treatment Training', sub: 'Training > Courses' },
    ],
  },
  {
    key: 'documents',
    label: 'Documents',
    results: [
      { title: 'Water_Safety_Plan_2026.pdf', sub: 'Documents > Safety' },
      { title: 'Water_Quality_Results_Jun2026.xlsx', sub: 'Documents > Reports' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Notification icon/color mapping
// ---------------------------------------------------------------------------

const NOTIF_TYPE_CONFIG: Record<NotificationType, { bgClass: string; textClass: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  leave:        { bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', textClass: 'text-emerald-600 dark:text-emerald-400', Icon: CalendarIcon },
  performance:  { bgClass: 'bg-amber-100 dark:bg-amber-900/30', textClass: 'text-amber-600 dark:text-amber-400', Icon: StarIcon },
  document:     { bgClass: 'bg-rose-100 dark:bg-rose-900/30', textClass: 'text-rose-600 dark:text-rose-400', Icon: DocumentTextIcon },
  system:       { bgClass: 'bg-sky-100 dark:bg-sky-900/30', textClass: 'text-sky-700 dark:text-sky-400', Icon: CogIcon },
  message:      { bgClass: 'bg-sky-100 dark:bg-sky-900/30', textClass: 'text-sky-700 dark:text-sky-400', Icon: ChatBubbleLeftIcon },
  training:     { bgClass: 'bg-amber-100 dark:bg-amber-900/30', textClass: 'text-amber-600 dark:text-amber-400', Icon: AcademicCapIcon },
  payslip:      { bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', textClass: 'text-emerald-600 dark:text-emerald-400', Icon: CurrencyDollarIcon },
  announcement: { bgClass: 'bg-rose-100 dark:bg-rose-900/30', textClass: 'text-rose-600 dark:text-rose-400', Icon: MegaphoneIcon },
};

const SEARCH_CATEGORY_CONFIG: Record<string, { bgClass: string; textClass: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }> = {
  employees: { bgClass: 'bg-sky-100 dark:bg-sky-900/30', textClass: 'text-sky-700 dark:text-sky-400', Icon: UserIcon },
  pages:     { bgClass: 'bg-amber-100 dark:bg-amber-900/30', textClass: 'text-amber-600 dark:text-amber-400', Icon: DocumentTextIcon },
  documents: { bgClass: 'bg-emerald-100 dark:bg-emerald-900/30', textClass: 'text-emerald-600 dark:text-emerald-400', Icon: DocumentTextIcon },
};

// ---------------------------------------------------------------------------
// Shimmer skeleton component
// ---------------------------------------------------------------------------

function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded bg-muted animate-pulse ${className}`}
    />
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex gap-3 p-4 border-b border-border">
      <SkeletonBar className="w-10 h-10 rounded-[10px] shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBar className="h-3 w-3/4" />
        <SkeletonBar className="h-2.5 w-full" />
        <SkeletonBar className="h-2 w-1/4" />
      </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="flex items-center gap-3 px-5 py-2.5">
      <SkeletonBar className="w-9 h-9 rounded-lg shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBar className="h-2.5 w-3/5" />
        <SkeletonBar className="h-2 w-2/5" />
      </div>
    </div>
  );
}

// ===========================================================================
// Main Page Component
// ===========================================================================

export default function NotificationsPage() {
  // ---- State ----
  const [demoState, setDemoState] = useState<DemoState>('normal');
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [notifFilter, setNotifFilter] = useState<NotificationFilter>('all');
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT_SEARCHES);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ---- Derived ----
  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (notifFilter === 'unread') return notifications.filter((n) => n.unread);
    if (notifFilter === 'read') return notifications.filter((n) => !n.unread);
    return notifications;
  }, [notifications, notifFilter]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_DATA.map((cat) => ({
      ...cat,
      results: cat.results.filter(
        (r) => r.title.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.results.length > 0);
  }, [searchQuery]);

  const hasSearchResults = searchResults.length > 0;

  // ---- Handlers ----
  const openSearch = useCallback(() => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  const openNotifications = useCallback(() => {
    setNotifPanelOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setNotifPanelOpen(false);
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }, []);

  const markRead = useCallback((id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const applyRecentSearch = useCallback((term: string) => {
    setSearchQuery(term);
    searchInputRef.current?.focus();
  }, []);

  // ---- Keyboard shortcut: Cmd+K ----
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (searchOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
      if (e.key === 'Escape') {
        if (searchOpen) closeSearch();
        if (notifPanelOpen) closeNotifications();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, notifPanelOpen, openSearch, closeSearch, closeNotifications]);

  // ---- State toggle buttons ----
  const stateToggle = (
    <div className="flex items-center gap-0.5 bg-card border border-border rounded-full p-1 shadow-sm">
      {(['normal', 'skeleton', 'error'] as DemoState[]).map((s) => (
        <button
          key={s}
          onClick={() => setDemoState(s)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
            demoState === s
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          {s === 'error' ? 'Error State' : s.charAt(0).toUpperCase() + s.slice(1)}
        </button>
      ))}
    </div>
  );

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <PageWrapper
      title="Notifications & Search"
      subtitle="Notifications panel, global search, and user menu patterns used across ShumelaHire"
      actions={stateToggle}
    >
      <div className="space-y-6">
        {/* ── Instructions Card ── */}
        <div className="enterprise-card p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
            <CursorArrowRaysIcon className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Interactive Overlay Demos</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-3">
            Click the icons in the navigation bar above, or use the buttons below to see the overlay patterns. Try the keyboard shortcut{' '}
            <kbd className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted border border-border rounded-md text-xs font-semibold text-muted-foreground">
              Cmd+K
            </kbd>{' '}
            to open search.
          </p>
        </div>

        {/* ── Demo Button Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search Card */}
          <button
            type="button"
            onClick={openSearch}
            className="enterprise-card p-6 text-center cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <div className="w-16 h-16 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Global Search</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Search employees, documents, pages, and more with real-time results
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-cta text-primary text-xs font-semibold uppercase tracking-wider pointer-events-none">
              Open Search
            </span>
          </button>

          {/* Notifications Card */}
          <button
            type="button"
            onClick={openNotifications}
            className="enterprise-card p-6 text-center cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <BellIcon className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">Notifications Panel</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Slide-in panel with unread count, filters, and mark-as-read actions
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-cta text-primary text-xs font-semibold uppercase tracking-wider pointer-events-none">
              Open Notifications
            </span>
          </button>

          {/* User Profile Card */}
          <div className="enterprise-card p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
              <UserIcon className="h-7 w-7 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">User Profile Menu</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Dropdown with profile info, navigation links, and sign-out option
            </p>
            <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full border-2 border-cta text-primary text-xs font-semibold uppercase tracking-wider opacity-60 pointer-events-none">
              Open User Menu
            </span>
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SEARCH OVERLAY                                                     */}
      {/* ================================================================= */}
      {searchOpen && (
        <div className="fixed inset-0 z-[600] flex justify-center items-start pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-foreground/50 dark:bg-black/60"
            onClick={closeSearch}
          />

          {/* Search Card */}
          <div className="relative w-full max-w-[640px] mx-4 bg-card rounded-xl shadow-xl z-10 flex flex-col max-h-[70vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Input Row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
              <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employees, documents, pages..."
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm"
                autoComplete="off"
              />
              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <kbd className="px-1.5 py-0.5 bg-muted border border-border rounded text-[11px] font-semibold">
                  Esc
                </kbd>{' '}
                to close
              </span>
            </div>

            {/* Search Body */}
            <div className="flex-1 overflow-y-auto">
              {/* Skeleton State */}
              {demoState === 'skeleton' && (
                <div className="py-3">
                  <div className="px-5 mb-1.5">
                    <SkeletonBar className="h-2 w-16" />
                  </div>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <SearchSkeleton key={i} />
                  ))}
                </div>
              )}

              {/* Error State */}
              {demoState === 'error' && (
                <div className="py-8 px-5 text-center">
                  <ExclamationCircleIcon className="h-10 w-10 text-destructive mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-semibold text-destructive mb-1">Unable to load search results</p>
                  <p className="text-xs text-muted-foreground mb-3">Please try again later</p>
                  <button
                    onClick={() => setDemoState('normal')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <ArrowPathIcon className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              )}

              {/* Normal State */}
              {demoState === 'normal' && (
                <>
                  {/* No query -- show recent searches */}
                  {!searchQuery.trim() && recentSearches.length > 0 && (
                    <div className="py-3">
                      <div className="flex items-center justify-between px-5 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Recent Searches
                        </span>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs font-semibold text-primary hover:text-cta transition-colors"
                        >
                          Clear recent
                        </button>
                      </div>
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => applyRecentSearch(term)}
                          className="flex items-center gap-3 w-full px-5 py-2 text-left hover:bg-muted transition-colors"
                        >
                          <ClockIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm text-muted-foreground">{term}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No query, no recents */}
                  {!searchQuery.trim() && recentSearches.length === 0 && (
                    <div className="py-8 px-5 text-center">
                      <MagnifyingGlassIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-sm text-muted-foreground">Start typing to search...</p>
                    </div>
                  )}

                  {/* Query with results */}
                  {searchQuery.trim() && hasSearchResults && (
                    <>
                      {searchResults.map((cat) => {
                        const config = SEARCH_CATEGORY_CONFIG[cat.key];
                        const CategoryIcon = config?.Icon ?? DocumentTextIcon;
                        return (
                          <div key={cat.key} className="py-3">
                            <div className="px-5 mb-1">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                {cat.label}
                              </span>
                            </div>
                            {cat.results.map((result) => (
                              <div
                                key={result.title}
                                className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-muted transition-colors"
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${config?.bgClass ?? 'bg-muted'}`}>
                                  <CategoryIcon className={`h-[18px] w-[18px] ${config?.textClass ?? 'text-muted-foreground'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-foreground truncate">{result.title}</p>
                                  <p className="text-xs text-muted-foreground truncate">{result.sub}</p>
                                </div>
                                {result.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 shrink-0">
                                    {result.badge}
                                  </span>
                                )}
                                <ChevronRightIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Query with no results */}
                  {searchQuery.trim() && !hasSearchResults && (
                    <div className="py-8 px-5 text-center">
                      <MagnifyingGlassIcon className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-semibold text-foreground mb-1">No results found</p>
                      <p className="text-xs text-muted-foreground">
                        Try a different search term or check your spelling
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* NOTIFICATION PANEL (slide-in from right)                           */}
      {/* ================================================================= */}

      {/* Backdrop */}
      {notifPanelOpen && (
        <div
          className="fixed inset-0 z-[500] bg-foreground/40 dark:bg-black/50 transition-opacity"
          onClick={closeNotifications}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 w-full max-w-[400px] h-screen bg-card shadow-xl z-[600] flex flex-col transition-transform duration-300 ease-in-out ${
          notifPanelOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="px-5 pt-5 shrink-0">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Notifications
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            </h2>
            <button
              onClick={closeNotifications}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close notifications"
            >
              <XMarkIcon className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* Filter pills & mark all */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-0.5 bg-muted rounded-full p-[3px]">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: `Unread (${unreadCount})` },
                  { key: 'read', label: 'Read' },
                ] as { key: NotificationFilter; label: string }[]
              ).map((f) => (
                <button
                  key={f.key}
                  onClick={() => setNotifFilter(f.key)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    notifFilter === f.key
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button
              onClick={markAllRead}
              className="text-xs font-semibold text-primary hover:text-cta transition-colors"
            >
              Mark All Read
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Skeleton State */}
          {demoState === 'skeleton' && (
            <>
              {Array.from({ length: 6 }).map((_, i) => (
                <NotificationSkeleton key={i} />
              ))}
            </>
          )}

          {/* Error State */}
          {demoState === 'error' && (
            <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <ExclamationCircleIcon className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="text-base font-semibold text-destructive mb-1">Failed to load</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Could not load notifications. Please try again.
              </p>
              <button
                onClick={() => setDemoState('normal')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-border text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ArrowPathIcon className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {/* Normal State */}
          {demoState === 'normal' && (
            <>
              {filteredNotifications.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-4">
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">All caught up!</h3>
                  <p className="text-xs text-muted-foreground">
                    No {notifFilter === 'unread' ? 'unread' : notifFilter === 'read' ? 'read' : ''} notifications to show.
                  </p>
                </div>
              )}

              {filteredNotifications.map((notif) => {
                const config = NOTIF_TYPE_CONFIG[notif.type];
                const NotifIcon = config.Icon;
                return (
                  <div
                    key={notif.id}
                    onClick={() => markRead(notif.id)}
                    className={`flex gap-3 px-5 py-4 cursor-pointer border-b border-border transition-colors ${
                      notif.unread
                        ? 'bg-primary/[0.04] hover:bg-primary/[0.08]'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${config.bgClass}`}>
                      <NotifIcon className={`h-5 w-5 ${config.textClass}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] text-foreground mb-0.5 ${notif.unread ? 'font-bold' : 'font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1 leading-relaxed">
                        {notif.desc}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium">{notif.time}</p>
                    </div>

                    {/* Unread dot */}
                    {notif.unread && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
