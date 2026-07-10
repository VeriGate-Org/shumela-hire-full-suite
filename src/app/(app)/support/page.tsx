'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import ErrorState from '@/components/ErrorState';
import { useToast } from '@/components/Toast';
import {
  PlusIcon,
  DocumentTextIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  UserIcon,
  ArrowUpTrayIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

/* ========================================================================== */
/* Types                                                                      */
/* ========================================================================== */

interface TimelineEntry {
  type: 'created' | 'assigned' | 'comment';
  text: string;
  time: string;
  comment?: string;
}

interface Ticket {
  id: string;
  date: string;
  subject: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  priorityLabel: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  statusLabel: string;
  assignee: string;
  contact: string;
  description: string;
  timeline: TimelineEntry[];
}

interface KBCategory {
  key: string;
  title: string;
  articles: number;
  colorClass: string;
  icon: React.ReactNode;
}

type SupportTab = 'myTickets' | 'submitTicket' | 'knowledgeBase';

/* ========================================================================== */
/* Sample data (matches mock)                                                 */
/* ========================================================================== */

const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'ICT-2026-089',
    date: '8 Jul 2026',
    subject: 'VPN connection dropping frequently',
    category: 'Network',
    priority: 'high',
    priorityLabel: 'High',
    status: 'open',
    statusLabel: 'Open',
    assignee: 'Bongani Zulu',
    contact: 'Email',
    description:
      "The VPN connection has been dropping frequently over the past two days, particularly during peak hours (09:00-11:00 and 14:00-16:00). This affects my ability to access shared drives and internal applications. I've tried reconnecting multiple times but the connection only lasts 10-15 minutes before dropping again.",
    timeline: [
      { type: 'created', text: 'Ticket created by Sipho Ndlovu', time: '8 Jul 2026, 09:15' },
      { type: 'assigned', text: 'Assigned to Bongani Zulu', time: '8 Jul 2026, 09:30' },
      {
        type: 'comment',
        text: 'Comment by Bongani Zulu',
        time: '8 Jul 2026, 10:00',
        comment:
          "I'll investigate the VPN issue. It may be related to the recent network maintenance. I'll check the logs and update you shortly.",
      },
    ],
  },
  {
    id: 'ICT-2026-085',
    date: '5 Jul 2026',
    subject: 'ShumelaHire loading slowly',
    category: 'Application',
    priority: 'medium',
    priorityLabel: 'Medium',
    status: 'in-progress',
    statusLabel: 'In Progress',
    assignee: 'Bongani Zulu',
    contact: 'Teams',
    description:
      'The ShumelaHire platform has been experiencing slow load times since last week. Pages take 8-12 seconds to load, and sometimes the dashboard times out completely. Other web applications seem to work fine.',
    timeline: [
      { type: 'created', text: 'Ticket created by Sipho Ndlovu', time: '5 Jul 2026, 14:22' },
      { type: 'assigned', text: 'Assigned to Bongani Zulu', time: '5 Jul 2026, 14:45' },
      {
        type: 'comment',
        text: 'Comment by Bongani Zulu',
        time: '6 Jul 2026, 08:30',
        comment:
          "I've identified a potential issue with the application server. Running diagnostics now.",
      },
    ],
  },
  {
    id: 'ICT-2026-078',
    date: '28 Jun 2026',
    subject: 'Request for additional monitor',
    category: 'Hardware',
    priority: 'low',
    priorityLabel: 'Low',
    status: 'resolved',
    statusLabel: 'Resolved',
    assignee: 'Bongani Zulu',
    contact: 'Email',
    description:
      'I would like to request an additional monitor for my workstation to improve productivity. My current setup only has one 24-inch monitor.',
    timeline: [
      { type: 'created', text: 'Ticket created by Sipho Ndlovu', time: '28 Jun 2026, 11:00' },
      { type: 'assigned', text: 'Assigned to Bongani Zulu', time: '28 Jun 2026, 11:30' },
      {
        type: 'comment',
        text: 'Comment by Bongani Zulu',
        time: '1 Jul 2026, 09:00',
        comment: 'Monitor has been ordered. Expected delivery by 4 July.',
      },
      {
        type: 'comment',
        text: 'Comment by Bongani Zulu',
        time: '4 Jul 2026, 14:00',
        comment:
          'Monitor installed and configured. Please confirm everything is working.',
      },
    ],
  },
  {
    id: 'ICT-2026-072',
    date: '20 Jun 2026',
    subject: 'Email not syncing on mobile',
    category: 'Email',
    priority: 'medium',
    priorityLabel: 'Medium',
    status: 'closed',
    statusLabel: 'Closed',
    assignee: '\u2014',
    contact: 'Phone',
    description:
      "My work email stopped syncing on my mobile device (iPhone 14). I've tried removing and re-adding the account but the issue persists.",
    timeline: [
      { type: 'created', text: 'Ticket created by Sipho Ndlovu', time: '20 Jun 2026, 08:45' },
      { type: 'assigned', text: 'Assigned to Bongani Zulu', time: '20 Jun 2026, 09:00' },
      {
        type: 'comment',
        text: 'Comment by Bongani Zulu',
        time: '20 Jun 2026, 10:30',
        comment:
          'Please try updating the Mail app and restarting your device. If the issue persists, we may need to re-provision the email profile.',
      },
    ],
  },
  {
    id: 'ICT-2026-065',
    date: '12 Jun 2026',
    subject: 'Printer driver installation',
    category: 'Hardware',
    priority: 'low',
    priorityLabel: 'Low',
    status: 'closed',
    statusLabel: 'Closed',
    assignee: '\u2014',
    contact: 'Email',
    description:
      'Need printer driver installed for the new HP LaserJet on the 3rd floor. Cannot print to this device from my workstation.',
    timeline: [
      { type: 'created', text: 'Ticket created by Sipho Ndlovu', time: '12 Jun 2026, 13:20' },
      { type: 'assigned', text: 'Assigned to Bongani Zulu', time: '12 Jun 2026, 13:45' },
      {
        type: 'comment',
        text: 'Comment by Bongani Zulu',
        time: '12 Jun 2026, 15:00',
        comment: 'Printer driver installed and tested. You should now be able to print.',
      },
    ],
  },
];

const KB_CATEGORIES: KBCategory[] = [
  {
    key: 'getting-started',
    title: 'Getting Started',
    articles: 4,
    colorClass: 'bg-icon-bg-navy text-accent-navy',
    icon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  {
    key: 'network-vpn',
    title: 'Network & VPN',
    articles: 6,
    colorClass: 'bg-icon-bg-teal text-accent-teal',
    icon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
  },
  {
    key: 'email-calendar',
    title: 'Email & Calendar',
    articles: 5,
    colorClass: 'bg-icon-bg-gold text-accent-gold',
    icon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    key: 'software-apps',
    title: 'Software & Apps',
    articles: 8,
    colorClass: 'bg-icon-bg-pink text-accent-pink',
    icon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="9" y1="21" x2="9" y2="9" />
      </svg>
    ),
  },
  {
    key: 'hardware',
    title: 'Hardware',
    articles: 3,
    colorClass: 'bg-icon-bg-navy text-accent-navy',
    icon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    key: 'security',
    title: 'Security',
    articles: 4,
    colorClass: 'bg-icon-bg-teal text-accent-teal',
    icon: (
      <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const POPULAR_ARTICLES = [
  'How to connect to the VPN from home',
  'Reset your password',
  'Setting up email on mobile devices',
  'Request software installation',
  'Report a security incident',
];

/* ========================================================================== */
/* Helpers                                                                    */
/* ========================================================================== */

function getStatusBadge(status: string, label: string) {
  const map: Record<string, string> = {
    open: 'bg-surface-navy text-accent-navy',
    'in-progress': 'bg-icon-bg-teal text-accent-teal',
    resolved: 'bg-success-bg text-success',
    closed: 'bg-background text-muted-foreground',
  };
  const dotMap: Record<string, string> = {
    open: 'bg-accent-navy',
    'in-progress': 'bg-accent-teal',
    resolved: 'bg-success',
    closed: 'bg-muted-foreground',
  };
  const cls = map[status] || 'bg-background text-muted-foreground';
  const dotCls = dotMap[status] || 'bg-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {label}
    </span>
  );
}

function getPriorityBadge(priority: string, label: string) {
  const map: Record<string, string> = {
    low: 'bg-success-bg text-success',
    medium: 'bg-warning-bg text-warning',
    high: 'bg-error-bg text-error',
    critical: 'bg-error-bg text-error',
  };
  const dotMap: Record<string, string> = {
    low: 'bg-success',
    medium: 'bg-warning',
    high: 'bg-error',
    critical: 'bg-error',
  };
  const cls = map[priority] || 'bg-background text-muted-foreground';
  const dotCls = dotMap[priority] || 'bg-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
      {label}
    </span>
  );
}

function getTimelineDotClass(type: TimelineEntry['type']) {
  switch (type) {
    case 'created':
      return 'bg-icon-bg-navy text-accent-navy';
    case 'assigned':
      return 'bg-icon-bg-teal text-accent-teal';
    case 'comment':
      return 'bg-icon-bg-gold text-accent-gold';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getTimelineIcon(type: TimelineEntry['type']) {
  switch (type) {
    case 'created':
      return <PlusIcon className="w-3.5 h-3.5" />;
    case 'assigned':
      return <UserIcon className="w-3.5 h-3.5" />;
    case 'comment':
      return (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    default:
      return null;
  }
}

/* ========================================================================== */
/* Component                                                                  */
/* ========================================================================== */

export default function SupportPage() {
  const router = useRouter();
  const { toast } = useToast();

  /* ----- State ----- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SupportTab>('myTickets');

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Ticket detail modal
  const [detailTicket, setDetailTicket] = useState<Ticket | null>(null);
  const [commentText, setCommentText] = useState('');

  // Submit ticket form
  const [formSubject, setFormSubject] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formPriority, setFormPriority] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSteps, setFormSteps] = useState('');
  const [formContact, setFormContact] = useState('email');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Knowledge base
  const [kbSearch, setKbSearch] = useState('');

  /* ----- Simulate data load ----- */
  const loadData = useCallback(() => {
    setLoading(true);
    setError(null);
    // Simulate API delay
    const timer = setTimeout(() => {
      setTickets([...SAMPLE_TICKETS]);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  /* ----- Derived data ----- */
  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status === 'open').length;
    const inProgress = tickets.filter((t) => t.status === 'in-progress').length;
    const resolved = tickets.filter((t) => t.status === 'resolved').length;
    return { open, inProgress, resolved, avgResolution: '4.2h' };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
      return matchStatus && matchPriority;
    });
  }, [tickets, filterStatus, filterPriority]);

  const filteredKBCategories = useMemo(() => {
    if (!kbSearch.trim()) return KB_CATEGORIES;
    const q = kbSearch.toLowerCase();
    return KB_CATEGORIES.filter(
      (c) => c.title.toLowerCase().includes(q) || c.key.toLowerCase().includes(q),
    );
  }, [kbSearch]);

  const filteredArticles = useMemo(() => {
    if (!kbSearch.trim()) return POPULAR_ARTICLES;
    const q = kbSearch.toLowerCase();
    return POPULAR_ARTICLES.filter((a) => a.toLowerCase().includes(q));
  }, [kbSearch]);

  /* ----- Actions ----- */
  const handleRetry = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleOpenDetail = useCallback((ticket: Ticket) => {
    setDetailTicket(ticket);
    setCommentText('');
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailTicket(null);
    setCommentText('');
  }, []);

  const handleCloseTicket = useCallback(() => {
    if (!detailTicket) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === detailTicket.id ? { ...t, status: 'closed' as const, statusLabel: 'Closed' } : t,
      ),
    );
    toast(`Ticket ${detailTicket.id} has been closed.`, 'success');
    setDetailTicket(null);
  }, [detailTicket, toast]);

  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) {
      toast('Please enter a comment before submitting.', 'warning');
      return;
    }
    if (!detailTicket) return;

    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const timeStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newEntry: TimelineEntry = {
      type: 'comment',
      text: 'Comment by Sipho Ndlovu',
      time: timeStr,
      comment: commentText.trim(),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === detailTicket.id
          ? { ...t, timeline: [...t.timeline, newEntry] }
          : t,
      ),
    );
    setDetailTicket((prev) =>
      prev ? { ...prev, timeline: [...prev.timeline, newEntry] } : null,
    );
    setCommentText('');
    toast('Your comment has been added to the ticket.', 'info');
  }, [commentText, detailTicket, toast]);

  const handleSubmitTicket = useCallback(() => {
    const errors: Record<string, string> = {};
    if (!formSubject.trim()) errors.subject = 'Subject is required';
    if (!formCategory) errors.category = 'Category is required';
    if (!formPriority) errors.priority = 'Priority is required';
    if (!formDescription.trim() || formDescription.trim().length < 20)
      errors.description = 'Description must be at least 20 characters';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast('Please fill in all required fields.', 'error');
      return;
    }

    // Reset form
    setFormSubject('');
    setFormCategory('');
    setFormPriority('');
    setFormDescription('');
    setFormSteps('');
    setFormContact('email');
    setFormFile(null);
    setFormErrors({});
    setActiveTab('myTickets');
    toast('Your support ticket has been submitted successfully.', 'success');
  }, [formSubject, formCategory, formPriority, formDescription, toast]);

  const handleResetForm = useCallback(() => {
    setFormSubject('');
    setFormCategory('');
    setFormPriority('');
    setFormDescription('');
    setFormSteps('');
    setFormContact('email');
    setFormFile(null);
    setFormErrors({});
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormFile(file);
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFormFile(null);
  }, []);

  /* ----- Tab definitions ----- */
  const TABS: { id: SupportTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'myTickets',
      label: 'My Tickets',
      icon: <DocumentTextIcon className="w-4 h-4" />,
    },
    {
      id: 'submitTicket',
      label: 'Submit Ticket',
      icon: <PlusIcon className="w-4 h-4" />,
    },
    {
      id: 'knowledgeBase',
      label: 'Knowledge Base',
      icon: <BookOpenIcon className="w-4 h-4" />,
    },
  ];

  /* ----- CTA button ----- */
  const headerAction = (
    <button
      onClick={() => setActiveTab('submitTicket')}
      className="btn-cta inline-flex items-center gap-2"
    >
      <PlusIcon className="w-4 h-4" />
      New Support Ticket
    </button>
  );

  /* ======================================================================== */
  /* Skeleton                                                                 */
  /* ======================================================================== */

  if (loading) {
    return (
      <PageWrapper title="IT Support" subtitle="Submit tickets, track issues, and get help" actions={headerAction}>
        <div className="space-y-6">
          {/* Stats skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="enterprise-card p-5 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-card loading-shimmer" />
                  <div className="flex-1">
                    <div className="h-6 w-10 loading-shimmer rounded mb-1" />
                    <div className="h-3 w-24 loading-shimmer rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Tabs skeleton */}
          <div className="enterprise-card overflow-hidden">
            <div className="h-[52px] loading-shimmer" />
            <div className="p-6 space-y-3">
              <div className="h-10 loading-shimmer rounded-control" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 loading-shimmer rounded-control" />
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  /* ======================================================================== */
  /* Error state                                                              */
  /* ======================================================================== */

  if (error) {
    return (
      <PageWrapper title="IT Support" subtitle="Submit tickets, track issues, and get help">
        <ErrorState
          title="Unable to Load Support Data"
          message="Something went wrong while loading your support information. Please try again."
          onRetry={handleRetry}
          retryLabel="Retry"
        />
      </PageWrapper>
    );
  }

  /* ======================================================================== */
  /* Render                                                                   */
  /* ======================================================================== */

  return (
    <PageWrapper title="IT Support" subtitle="Submit tickets, track issues, and get help" actions={headerAction}>
      <div className="space-y-6">

        {/* ================================================================ */}
        {/* Stats Strip                                                      */}
        {/* ================================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Open Tickets */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
              <ExclamationCircleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold leading-none text-foreground">{stats.open}</div>
              <div className="text-[0.813rem] font-medium text-muted-foreground mt-1">Open Tickets</div>
            </div>
          </div>

          {/* In Progress */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
              <ArrowPathIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold leading-none text-foreground">{stats.inProgress}</div>
              <div className="text-[0.813rem] font-medium text-muted-foreground mt-1">In Progress</div>
            </div>
          </div>

          {/* Resolved This Month */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold leading-none text-foreground">{stats.resolved}</div>
              <div className="text-[0.813rem] font-medium text-muted-foreground mt-1">Resolved This Month</div>
            </div>
          </div>

          {/* Avg Resolution Time */}
          <div className="enterprise-card p-5 flex items-center gap-4 transition-transform hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-2xl font-extrabold leading-none text-foreground">{stats.avgResolution}</div>
              <div className="text-[0.813rem] font-medium text-muted-foreground mt-1">Avg Resolution Time</div>
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* Tabs Container                                                   */}
        {/* ================================================================ */}
        <div className="enterprise-card overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-border overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-primary hover:bg-surface-navy'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ============================================================== */}
          {/* Tab Panel: My Tickets                                          */}
          {/* ============================================================== */}
          {activeTab === 'myTickets' && (
            <div className="p-6">
              {/* Filter Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5 flex-wrap">
                <span className="text-[0.813rem] font-semibold text-muted-foreground">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 pr-8 rounded-control border border-border bg-card text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%2364748B%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 pr-8 rounded-control border border-border bg-card text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors appearance-none bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22%2364748B%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.646%205.646a.5.5%200%200%201%20.708%200L8%208.293l2.646-2.647a.5.5%200%200%201%20.708.708l-3%203a.5.5%200%200%201-.708%200l-3-3a.5.5%200%200%201%200-.708z%22/%3E%3C/svg%3E')] bg-no-repeat bg-[right_10px_center]"
                >
                  <option value="all">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Tickets Table */}
              {filteredTickets.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-semibold text-foreground mb-1">No tickets found</h3>
                  <p className="text-sm text-muted-foreground">
                    No tickets match your current filters. Try adjusting your filter criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Ticket #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Priority
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Assigned To
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground bg-background border-b-2 border-border">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTickets.map((ticket, idx) => {
                        const isLast = idx === filteredTickets.length - 1;
                        return (
                          <tr
                            key={ticket.id}
                            className="hover:bg-surface-navy transition-colors"
                          >
                            <td className={`px-4 py-3.5 text-sm align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              <span className="font-bold text-[0.813rem] text-primary font-mono">
                                {ticket.id}
                              </span>
                            </td>
                            <td className={`px-4 py-3.5 text-sm text-foreground align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              {ticket.date}
                            </td>
                            <td className={`px-4 py-3.5 text-sm align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              <span className="font-semibold text-foreground">{ticket.subject}</span>
                            </td>
                            <td className={`px-4 py-3.5 text-sm text-muted-foreground align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              {ticket.category}
                            </td>
                            <td className={`px-4 py-3.5 text-sm align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              {getPriorityBadge(ticket.priority, ticket.priorityLabel)}
                            </td>
                            <td className={`px-4 py-3.5 text-sm align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              {getStatusBadge(ticket.status, ticket.statusLabel)}
                            </td>
                            <td className={`px-4 py-3.5 text-sm align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              {ticket.assignee === '\u2014' ? (
                                <span className="text-muted-foreground">&mdash;</span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-accent-teal text-white flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0">
                                    {ticket.assignee
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </div>
                                  <span className="text-foreground">{ticket.assignee}</span>
                                </div>
                              )}
                            </td>
                            <td className={`px-4 py-3.5 text-sm align-middle ${isLast ? '' : 'border-b border-border'}`}>
                              <button
                                onClick={() => handleOpenDetail(ticket)}
                                className="px-3 py-1.5 rounded-full border border-border bg-card text-xs font-semibold text-primary hover:bg-primary hover:text-white hover:border-primary transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* Tab Panel: Submit Ticket                                       */}
          {/* ============================================================== */}
          {activeTab === 'submitTicket' && (
            <div className="p-6">
              <div className="max-w-[720px]">
                {/* Subject */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Subject <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => {
                      setFormSubject(e.target.value);
                      setFormErrors((prev) => ({ ...prev, subject: '' }));
                    }}
                    placeholder="Brief description of the issue"
                    className={`w-full px-3.5 py-2.5 rounded-control border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                      formErrors.subject ? 'border-error ring-2 ring-error/15' : 'border-border'
                    }`}
                  />
                  {formErrors.subject && (
                    <p className="text-error text-xs mt-1">{formErrors.subject}</p>
                  )}
                </div>

                {/* Category + Priority row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Category <span className="text-error">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        setFormErrors((prev) => ({ ...prev, category: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-control border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        formErrors.category ? 'border-error ring-2 ring-error/15' : 'border-border'
                      }`}
                    >
                      <option value="">Select category...</option>
                      <option value="application">Application</option>
                      <option value="network">Network</option>
                      <option value="hardware">Hardware</option>
                      <option value="email">Email</option>
                      <option value="access">Access / Permissions</option>
                      <option value="software">Software Installation</option>
                      <option value="other">Other</option>
                    </select>
                    {formErrors.category && (
                      <p className="text-error text-xs mt-1">{formErrors.category}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      Priority <span className="text-error">*</span>
                    </label>
                    <select
                      value={formPriority}
                      onChange={(e) => {
                        setFormPriority(e.target.value);
                        setFormErrors((prev) => ({ ...prev, priority: '' }));
                      }}
                      className={`w-full px-3.5 py-2.5 rounded-control border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 ${
                        formErrors.priority ? 'border-error ring-2 ring-error/15' : 'border-border'
                      }`}
                    >
                      <option value="">Select priority...</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    {formErrors.priority && (
                      <p className="text-error text-xs mt-1">{formErrors.priority}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Description <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => {
                      setFormDescription(e.target.value);
                      setFormErrors((prev) => ({ ...prev, description: '' }));
                    }}
                    rows={4}
                    placeholder="Describe the issue in detail (minimum 20 characters)"
                    className={`w-full px-3.5 py-2.5 rounded-control border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y ${
                      formErrors.description ? 'border-error ring-2 ring-error/15' : 'border-border'
                    }`}
                  />
                  {formErrors.description && (
                    <p className="text-error text-xs mt-1">{formErrors.description}</p>
                  )}
                  <p className={`text-xs mt-1 ${formDescription.trim().length >= 20 ? 'text-success' : 'text-muted-foreground'}`}>
                    {formDescription.trim().length} / 20 minimum characters
                  </p>
                </div>

                {/* Steps to Reproduce */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Steps to Reproduce{' '}
                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={formSteps}
                    onChange={(e) => setFormSteps(e.target.value)}
                    rows={3}
                    placeholder={'1. Go to...\n2. Click on...\n3. Observe...'}
                    className="w-full px-3.5 py-2.5 rounded-control border border-border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
                  />
                </div>

                {/* Attachment */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Attachment{' '}
                    <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <label className="block border-2 border-dashed border-border rounded-control p-8 text-center cursor-pointer bg-background hover:border-primary hover:bg-surface-navy transition-colors">
                    <ArrowUpTrayIcon className="w-7 h-7 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drag and drop or <span className="text-primary font-semibold">browse</span> to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF, DOCX up to 10MB</p>
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                  {formFile && (
                    <div className="flex items-center gap-2 mt-3 px-3 py-2 bg-surface-navy rounded-control text-sm text-primary font-semibold">
                      <DocumentTextIcon className="w-4 h-4 flex-shrink-0" />
                      <span>{formFile.name} ({(formFile.size / 1024).toFixed(1)} KB)</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="ml-auto text-error hover:text-error/80 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Preferred Contact Method */}
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-foreground mb-1.5">
                    Preferred Contact Method
                  </label>
                  <div className="flex flex-wrap gap-6">
                    {(['email', 'phone', 'teams'] as const).map((method) => (
                      <label key={method} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground">
                        <input
                          type="radio"
                          name="contactMethod"
                          value={method}
                          checked={formContact === method}
                          onChange={(e) => setFormContact(e.target.value)}
                          className="w-4 h-4 accent-primary"
                        />
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="btn-secondary inline-flex items-center gap-2 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitTicket}
                    className="btn-cta inline-flex items-center gap-2"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Submit Ticket
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* Tab Panel: Knowledge Base                                      */}
          {/* ============================================================== */}
          {activeTab === 'knowledgeBase' && (
            <div className="p-6">
              {/* Search */}
              <div className="relative mb-6">
                <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={kbSearch}
                  onChange={(e) => setKbSearch(e.target.value)}
                  placeholder="Search knowledge base..."
                  className="w-full pl-10 pr-4 py-3 rounded-control border border-border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* KB Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredKBCategories.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => toast('Knowledge base articles are being prepared.', 'info')}
                    className="enterprise-card p-5 text-left hover:border-primary hover:-translate-y-0.5 transition-all"
                  >
                    <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center mb-3 ${cat.colorClass}`}>
                      {cat.icon}
                    </div>
                    <h3 className="text-[0.938rem] font-semibold text-foreground mb-1">{cat.title}</h3>
                    <p className="text-[0.813rem] text-muted-foreground mb-3">
                      {cat.articles} articles
                    </p>
                    <span className="inline-flex items-center gap-1 text-[0.813rem] font-semibold text-primary">
                      Browse <ChevronRightIcon className="w-3.5 h-3.5" />
                    </span>
                  </button>
                ))}
              </div>

              {/* Popular Articles */}
              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Popular Articles</h2>
                <ul className="space-y-2">
                  {filteredArticles.map((article) => (
                    <li key={article}>
                      <button
                        onClick={() => toast('This article is being prepared.', 'info')}
                        className="flex items-center gap-3 w-full px-4 py-3.5 border border-border rounded-control bg-card text-left hover:border-primary hover:bg-surface-navy transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1">{article}</span>
                        <ChevronRightIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* Ticket Detail Modal                                                  */}
      {/* ==================================================================== */}
      {detailTicket && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseDetail();
          }}
        >
          <div className="bg-card rounded-card shadow-lg w-full max-w-[640px] max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Ticket Details</h2>
              <button
                onClick={handleCloseDetail}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-error transition-colors"
              >
                <XMarkIcon className="w-[18px] h-[18px]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Ticket Header */}
              <div className="mb-5">
                <p className="text-[0.813rem] text-muted-foreground font-semibold mb-1">
                  {detailTicket.id}
                </p>
                <h2 className="text-xl font-bold text-foreground mb-3">{detailTicket.subject}</h2>
                <div className="flex flex-wrap gap-2">
                  {getStatusBadge(detailTicket.status, detailTicket.statusLabel)}
                  {getPriorityBadge(detailTicket.priority, detailTicket.priorityLabel)}
                </div>
              </div>

              {/* Ticket Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 p-4 bg-background rounded-control">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Category
                  </label>
                  <span className="text-sm font-medium text-foreground">{detailTicket.category}</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Submitted
                  </label>
                  <span className="text-sm font-medium text-foreground">{detailTicket.date}</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Assigned To
                  </label>
                  <span className="text-sm font-medium text-foreground">{detailTicket.assignee}</span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
                    Contact Method
                  </label>
                  <span className="text-sm font-medium text-foreground">{detailTicket.contact}</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {detailTicket.description}
                </p>
              </div>

              {/* Activity Timeline */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-foreground mb-3">Activity</h3>
                <div className="space-y-0">
                  {detailTicket.timeline.map((entry, idx) => (
                    <div key={idx} className="flex gap-3 relative pb-4 last:pb-0">
                      {/* Timeline connector line */}
                      {idx < detailTicket.timeline.length - 1 && (
                        <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                      )}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getTimelineDotClass(entry.type)}`}>
                        {getTimelineIcon(entry.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{entry.text}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{entry.time}</p>
                        {entry.comment && (
                          <div className="mt-1.5 px-3 py-2.5 bg-background rounded-control text-[0.813rem] text-muted-foreground leading-relaxed">
                            {entry.comment}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Box (hide for closed/resolved) */}
              {detailTicket.status !== 'closed' && detailTicket.status !== 'resolved' && (
                <div className="flex gap-3 items-start">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={2}
                    placeholder="Add a comment..."
                    className="flex-1 px-3.5 py-2.5 rounded-control border border-border text-sm text-foreground bg-card outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y min-h-[70px]"
                  />
                  <button
                    onClick={handleAddComment}
                    className="self-end btn-primary inline-flex items-center gap-1.5 text-xs px-3.5 py-2"
                  >
                    <PaperAirplaneIcon className="w-3.5 h-3.5" />
                    Add Comment
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={handleCloseDetail}
                className="btn-secondary inline-flex items-center gap-2 text-xs"
              >
                Close
              </button>
              {detailTicket.status !== 'closed' && detailTicket.status !== 'resolved' && (
                <button
                  onClick={handleCloseTicket}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-error text-error text-xs font-semibold uppercase tracking-wider hover:bg-error hover:text-white transition-colors"
                >
                  <XCircleIcon className="w-3.5 h-3.5" />
                  Close Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
