'use client';

import { useState, useRef, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import {
  PlusIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  EyeIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';

// ===== Types =====
interface ExpenseClaim {
  id: string;
  date: string;
  dateFormatted: string;
  category: string;
  description: string;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  managerComments: string;
  timeline: TimelineStep[];
}

interface TimelineStep {
  step: string;
  date: string;
  status: 'completed' | 'current' | 'pending';
}

type TabId = 'my-claims' | 'new-claim';

// ===== Placeholder Data =====
const INITIAL_CLAIMS: ExpenseClaim[] = [
  {
    id: 'EXP-2026-045',
    date: '2026-07-05',
    dateFormatted: '5 Jul 2026',
    category: 'Travel',
    description: 'Site visit to Bergville depot',
    amount: 1250.0,
    status: 'pending',
    managerComments: '',
    timeline: [
      { step: 'Submitted', date: '5 Jul 2026, 09:14', status: 'completed' },
      { step: 'Manager Review', date: 'Awaiting review', status: 'current' },
      { step: 'Finance Approval', date: '', status: 'pending' },
      { step: 'Payment', date: '', status: 'pending' },
    ],
  },
  {
    id: 'EXP-2026-038',
    date: '2026-06-18',
    dateFormatted: '18 Jun 2026',
    category: 'Accommodation',
    description: 'Overnight — Durban conference',
    amount: 1800.0,
    status: 'approved',
    managerComments: 'Approved. Conference attendance confirmed with HR.',
    timeline: [
      { step: 'Submitted', date: '18 Jun 2026, 14:32', status: 'completed' },
      { step: 'Manager Review', date: '20 Jun 2026, 10:05', status: 'completed' },
      { step: 'Finance Approval', date: 'In progress', status: 'current' },
      { step: 'Payment', date: '', status: 'pending' },
    ],
  },
  {
    id: 'EXP-2026-032',
    date: '2026-06-02',
    dateFormatted: '2 Jun 2026',
    category: 'Meals',
    description: 'Team lunch — quarterly meeting',
    amount: 650.0,
    status: 'paid',
    managerComments: 'Approved. Valid team expense.',
    timeline: [
      { step: 'Submitted', date: '2 Jun 2026, 11:45', status: 'completed' },
      { step: 'Manager Review', date: '3 Jun 2026, 08:30', status: 'completed' },
      { step: 'Finance Approval', date: '5 Jun 2026, 14:00', status: 'completed' },
      { step: 'Payment', date: '10 Jun 2026', status: 'completed' },
    ],
  },
  {
    id: 'EXP-2026-025',
    date: '2026-05-15',
    dateFormatted: '15 May 2026',
    category: 'Office Supplies',
    description: 'Stationery and printer cartridges',
    amount: 890.0,
    status: 'paid',
    managerComments: '',
    timeline: [
      { step: 'Submitted', date: '15 May 2026, 16:20', status: 'completed' },
      { step: 'Manager Review', date: '16 May 2026, 09:10', status: 'completed' },
      { step: 'Finance Approval', date: '18 May 2026, 11:30', status: 'completed' },
      { step: 'Payment', date: '22 May 2026', status: 'completed' },
    ],
  },
  {
    id: 'EXP-2026-018',
    date: '2026-05-01',
    dateFormatted: '1 May 2026',
    category: 'Travel',
    description: 'Site inspections — Estcourt',
    amount: 1100.0,
    status: 'paid',
    managerComments: 'Approved. Mileage log attached.',
    timeline: [
      { step: 'Submitted', date: '1 May 2026, 17:45', status: 'completed' },
      { step: 'Manager Review', date: '2 May 2026, 10:20', status: 'completed' },
      { step: 'Finance Approval', date: '5 May 2026, 13:15', status: 'completed' },
      { step: 'Payment', date: '8 May 2026', status: 'completed' },
    ],
  },
];

const EXPENSE_CATEGORIES = [
  'Travel',
  'Accommodation',
  'Meals',
  'Office Supplies',
  'Communication',
  'Training',
  'Other',
];

// ===== Helpers =====
function formatCurrency(amount: number): string {
  return (
    'R ' +
    amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  );
}

function getStatusConfig(status: string) {
  const configs: Record<string, { label: string; dotClass: string; bgClass: string; textClass: string }> = {
    pending: {
      label: 'Pending',
      dotClass: 'bg-warning',
      bgClass: 'bg-warning/10',
      textClass: 'text-amber-700 dark:text-amber-400',
    },
    approved: {
      label: 'Approved',
      dotClass: 'bg-emerald-500',
      bgClass: 'bg-emerald-500/10',
      textClass: 'text-emerald-700 dark:text-emerald-400',
    },
    paid: {
      label: 'Paid',
      dotClass: 'bg-accent-teal',
      bgClass: 'bg-accent-teal/10',
      textClass: 'text-teal-700 dark:text-teal-400',
    },
    rejected: {
      label: 'Rejected',
      dotClass: 'bg-destructive',
      bgClass: 'bg-destructive/10',
      textClass: 'text-red-600 dark:text-red-400',
    },
  };
  return configs[status] ?? configs.pending;
}

// ===== Component =====
export default function ExpenseClaimsPage() {
  // --- State ---
  const [claims, setClaims] = useState<ExpenseClaim[]>(INITIAL_CLAIMS);
  const [activeTab, setActiveTab] = useState<TabId>('my-claims');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCostCentre] = useState('CC-OPS-001');
  const [formNotes, setFormNotes] = useState('');
  const [formInvoice, setFormInvoice] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detail modal state
  const [detailClaim, setDetailClaim] = useState<ExpenseClaim | null>(null);

  // Cancel modal state
  const [cancelClaimId, setCancelClaimId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // --- Computed ---
  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      if (filterStatus !== 'all' && claim.status !== filterStatus) return false;
      if (filterDateFrom && claim.date < filterDateFrom) return false;
      if (filterDateTo && claim.date > filterDateTo) return false;
      return true;
    });
  }, [claims, filterStatus, filterDateFrom, filterDateTo]);

  const stats = useMemo(() => {
    const pending = claims.filter((c) => c.status === 'pending');
    const approvedThisMonth = claims.filter((c) => {
      const now = new Date();
      const claimDate = new Date(c.date);
      return (
        c.status === 'approved' &&
        claimDate.getMonth() === now.getMonth() &&
        claimDate.getFullYear() === now.getFullYear()
      );
    });
    const totalYTD = claims.reduce((sum, c) => sum + c.amount, 0);
    const rejected = claims.filter((c) => c.status === 'rejected');

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, c) => s + c.amount, 0),
      approvedCount: approvedThisMonth.length,
      approvedAmount: approvedThisMonth.reduce((s, c) => s + c.amount, 0),
      totalYTD,
      rejectedCount: rejected.length,
    };
  }, [claims]);

  // --- Handlers ---
  function showToast(type: 'success' | 'error' | 'info', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  function handleViewClaim(claim: ExpenseClaim) {
    setDetailClaim(claim);
  }

  function handleCancelClaim(claimId: string) {
    setCancelClaimId(claimId);
  }

  function confirmCancel() {
    if (!cancelClaimId) return;
    setClaims((prev) => prev.filter((c) => c.id !== cancelClaimId));
    setCancelClaimId(null);
    showToast('success', `Claim ${cancelClaimId} has been cancelled.`);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors((prev) => ({ ...prev, receipt: 'File size exceeds 5 MB' }));
        return;
      }
      setUploadedFile(file);
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.receipt;
        return next;
      });
    }
  }

  function removeUpload() {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formDate) errors.date = 'Please select the expense date';
    if (!formCategory) errors.category = 'Please select a category';
    if (!formDescription.trim()) errors.description = 'Please enter a description';
    const amt = parseFloat(formAmount);
    if (!formAmount || isNaN(amt) || amt <= 0) errors.amount = 'Please enter a valid amount greater than R 0';
    if (!uploadedFile && amt > 100) errors.receipt = 'Receipt is required for claims over R 100';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    const newClaim: ExpenseClaim = {
      id: `EXP-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
      date: formDate,
      dateFormatted: new Date(formDate).toLocaleDateString('en-ZA', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      category: formCategory,
      description: formDescription,
      amount: parseFloat(formAmount),
      status: 'pending',
      managerComments: '',
      timeline: [
        { step: 'Submitted', date: 'Just now', status: 'completed' },
        { step: 'Manager Review', date: 'Awaiting review', status: 'current' },
        { step: 'Finance Approval', date: '', status: 'pending' },
        { step: 'Payment', date: '', status: 'pending' },
      ],
    };

    setClaims((prev) => [newClaim, ...prev]);
    resetForm();
    setActiveTab('my-claims');
    showToast('success', `Claim ${newClaim.id} submitted successfully.`);
  }

  function saveDraft() {
    showToast('info', 'Draft saved. You can continue editing later.');
  }

  function resetForm() {
    setFormDate('');
    setFormCategory('');
    setFormDescription('');
    setFormAmount('');
    setFormNotes('');
    setFormInvoice('');
    setFormErrors({});
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleRetry() {
    setError(false);
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  }

  // --- Tab config ---
  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'my-claims',
      label: 'My Claims',
      icon: (
        <DocumentTextIcon className="w-[18px] h-[18px]" />
      ),
    },
    {
      id: 'new-claim',
      label: 'New Claim Form',
      icon: (
        <PencilSquareIcon className="w-[18px] h-[18px]" />
      ),
    },
  ];

  // --- Error State ---
  if (error) {
    return (
      <PageWrapper
        title="Expense Claims"
        subtitle="Submit and track expense reimbursements"
      >
        <div className="enterprise-card flex flex-col items-center justify-center text-center py-16 px-6">
          <div className="w-[72px] h-[72px] rounded-full bg-destructive/10 flex items-center justify-center mb-5">
            <InformationCircleIcon className="w-9 h-9 text-destructive" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            Unable to load expense data
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-[400px]">
            We encountered an error while fetching your expense claims. Please check your connection and try again.
          </p>
          <button
            onClick={handleRetry}
            className="btn-cta inline-flex items-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Retry
          </button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Expense Claims"
      subtitle="Submit and track expense reimbursements"
      actions={
        <button
          onClick={() => setActiveTab('new-claim')}
          className="btn-cta inline-flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New Expense Claim
        </button>
      }
    >
      <div className="space-y-6">
        {/* ====== STATS GRID ====== */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="enterprise-card p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-card bg-muted/50 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
                  <div className="h-7 w-16 bg-muted/50 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Pending Claims */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-medium text-muted-foreground mb-1">Pending Claims</div>
                <div className="text-[1.5rem] font-extrabold text-foreground leading-none tracking-tight">
                  {stats.pendingCount}
                </div>
                <div className="text-[0.8125rem] text-muted-foreground mt-0.5">
                  {formatCurrency(stats.pendingAmount)}
                </div>
              </div>
            </div>

            {/* Approved This Month */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-medium text-muted-foreground mb-1">Approved This Month</div>
                <div className="text-[1.5rem] font-extrabold text-foreground leading-none tracking-tight">
                  {stats.approvedCount}
                </div>
                <div className="text-[0.8125rem] text-muted-foreground mt-0.5">
                  {formatCurrency(stats.approvedAmount)}
                </div>
              </div>
            </div>

            {/* Total YTD */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-accent-navy flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-medium text-muted-foreground mb-1">Total YTD</div>
                <div className="text-[1.5rem] font-extrabold text-foreground leading-none tracking-tight">
                  {formatCurrency(stats.totalYTD)}
                </div>
              </div>
            </div>

            {/* Rejected */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-pink text-accent-pink flex items-center justify-center flex-shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[0.8125rem] font-medium text-muted-foreground mb-1">Rejected</div>
                <div className="text-[1.5rem] font-extrabold text-foreground leading-none tracking-tight">
                  {stats.rejectedCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====== TABBED CONTENT ====== */}
        <div className="enterprise-card overflow-hidden">
          {/* Tab Header */}
          <div className="flex border-b-2 border-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 text-sm font-semibold border-b-2 -mb-[2px] transition-colors duration-200 flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ====== TAB: MY CLAIMS ====== */}
          {activeTab === 'my-claims' && (
            <div className="animate-in fade-in duration-300">
              {/* Filter Bar */}
              <div className="flex items-center gap-3 flex-wrap p-6 pb-0">
                <span className="text-[0.8125rem] font-semibold text-muted-foreground">Filter:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="text-sm border border-border rounded-lg bg-card text-foreground px-3 py-2 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="paid">Paid</option>
                </select>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="text-sm border border-border rounded-lg bg-card text-foreground px-3 py-2 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="text-sm border border-border rounded-lg bg-card text-foreground px-3 py-2 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
              </div>

              {/* Claims Table */}
              {loading ? (
                <div className="p-6">
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : filteredClaims.length === 0 ? (
                <div className="py-16 text-center px-6">
                  <DocumentTextIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No claims found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {claims.length === 0
                      ? 'You haven\'t submitted any expense claims yet.'
                      : 'No claims match the selected filters.'}
                  </p>
                  {claims.length === 0 && (
                    <button
                      onClick={() => setActiveTab('new-claim')}
                      className="btn-cta inline-flex items-center gap-2 text-sm"
                    >
                      <PlusIcon className="w-4 h-4" />
                      New Expense Claim
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="overflow-x-auto hidden md:block">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          {['Claim #', 'Date', 'Category', 'Description', 'Amount', 'Status', 'Actions'].map(
                            (header) => (
                              <th
                                key={header}
                                className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground border-b border-border bg-muted/50 whitespace-nowrap first:rounded-tl-card last:rounded-tr-card"
                              >
                                {header}
                              </th>
                            )
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClaims.map((claim) => {
                          const statusCfg = getStatusConfig(claim.status);
                          return (
                            <tr
                              key={claim.id}
                              className="border-b border-border last:border-b-0 hover:bg-primary/[0.03] transition-colors"
                            >
                              <td className="px-4 py-3.5 text-[0.8125rem] font-bold text-primary">
                                {claim.id}
                              </td>
                              <td className="px-4 py-3.5 text-[0.8125rem] text-muted-foreground whitespace-nowrap">
                                {claim.dateFormatted}
                              </td>
                              <td className="px-4 py-3.5 text-[0.8125rem] font-semibold text-foreground">
                                {claim.category}
                              </td>
                              <td className="px-4 py-3.5 text-sm text-foreground">
                                {claim.description}
                              </td>
                              <td className="px-4 py-3.5 text-sm font-bold text-foreground whitespace-nowrap tabular-nums">
                                {formatCurrency(claim.amount)}
                              </td>
                              <td className="px-4 py-3.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusCfg.bgClass} ${statusCfg.textClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                                  {statusCfg.label}
                                </span>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewClaim(claim)}
                                    className="inline-flex items-center gap-1 text-xs font-semibold border border-border rounded-full px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                                  >
                                    <EyeIcon className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  {claim.status === 'pending' && (
                                    <button
                                      onClick={() => handleCancelClaim(claim.id)}
                                      className="inline-flex items-center gap-1 text-xs font-semibold border border-destructive rounded-full px-3 py-1.5 text-destructive hover:bg-destructive/5 transition-colors"
                                    >
                                      <XMarkIcon className="w-3.5 h-3.5" />
                                      Cancel
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden flex flex-col gap-3 p-4">
                    {filteredClaims.map((claim) => {
                      const statusCfg = getStatusConfig(claim.status);
                      return (
                        <div key={claim.id} className="enterprise-card p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[0.8125rem] font-bold text-primary">{claim.id}</span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${statusCfg.bgClass} ${statusCfg.textClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dotClass}`} />
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2.5 mb-3">
                            <div>
                              <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                Date
                              </div>
                              <div className="text-[0.8125rem] font-semibold text-foreground">
                                {claim.dateFormatted}
                              </div>
                            </div>
                            <div>
                              <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                Category
                              </div>
                              <div className="text-[0.8125rem] font-semibold text-foreground">
                                {claim.category}
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                Description
                              </div>
                              <div className="text-[0.8125rem] font-semibold text-foreground">
                                {claim.description}
                              </div>
                            </div>
                            <div>
                              <div className="text-[0.6875rem] font-semibold uppercase tracking-wide text-muted-foreground">
                                Amount
                              </div>
                              <div className="text-[0.8125rem] font-bold text-foreground tabular-nums">
                                {formatCurrency(claim.amount)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                            <button
                              onClick={() => handleViewClaim(claim)}
                              className="inline-flex items-center gap-1 text-xs font-semibold border border-border rounded-full px-3 py-1.5 text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                              View
                            </button>
                            {claim.status === 'pending' && (
                              <button
                                onClick={() => handleCancelClaim(claim.id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold border border-destructive rounded-full px-3 py-1.5 text-destructive hover:bg-destructive/5 transition-colors"
                              >
                                <XMarkIcon className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination Info */}
                  <div className="flex items-center justify-between px-6 py-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">
                      Showing 1-{filteredClaims.length} of {filteredClaims.length} claims
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ====== TAB: NEW CLAIM FORM ====== */}
          {activeTab === 'new-claim' && (
            <div className="p-6 md:p-8 animate-in fade-in duration-300">
              <h3 className="text-lg font-bold text-foreground mb-6 pb-4 border-b border-border">
                Submit New Expense Claim
              </h3>
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Expense Date */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Expense Date<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => {
                        setFormDate(e.target.value);
                        setFormErrors((prev) => { const n = { ...prev }; delete n.date; return n; });
                      }}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-lg bg-card text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        formErrors.date ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
                      }`}
                    />
                    {formErrors.date && (
                      <span className="text-xs text-destructive font-medium">{formErrors.date}</span>
                    )}
                  </div>

                  {/* Category */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Category<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        setFormErrors((prev) => { const n = { ...prev }; delete n.category; return n; });
                      }}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-lg bg-card text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer ${
                        formErrors.category ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
                      }`}
                    >
                      <option value="">Select a category...</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    {formErrors.category && (
                      <span className="text-xs text-destructive font-medium">{formErrors.category}</span>
                    )}
                  </div>

                  {/* Description (full width) */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Description<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => {
                        setFormDescription(e.target.value);
                        setFormErrors((prev) => { const n = { ...prev }; delete n.description; return n; });
                      }}
                      placeholder="Brief description of the expense"
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-lg bg-card text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                        formErrors.description ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
                      }`}
                    />
                    {formErrors.description && (
                      <span className="text-xs text-destructive font-medium">{formErrors.description}</span>
                    )}
                  </div>

                  {/* Amount */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Amount<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <div className="flex items-stretch">
                      <span className="flex items-center justify-center px-3 bg-muted/50 border border-border border-r-0 rounded-l-lg text-sm font-bold text-primary">
                        R
                      </span>
                      <input
                        type="number"
                        value={formAmount}
                        onChange={(e) => {
                          setFormAmount(e.target.value);
                          setFormErrors((prev) => { const n = { ...prev }; delete n.amount; return n; });
                        }}
                        placeholder="0.00"
                        step="0.01"
                        min="0.01"
                        className={`flex-1 px-3.5 py-2.5 text-sm border rounded-r-lg rounded-l-none bg-card text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
                          formErrors.amount ? 'border-destructive ring-2 ring-destructive/20' : 'border-border'
                        }`}
                      />
                    </div>
                    {formErrors.amount && (
                      <span className="text-xs text-destructive font-medium">{formErrors.amount}</span>
                    )}
                  </div>

                  {/* Cost Centre */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Cost Centre
                    </label>
                    <input
                      type="text"
                      value={formCostCentre}
                      readOnly
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-muted/50 text-muted-foreground cursor-default"
                    />
                  </div>

                  {/* Receipt Upload (full width) */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Receipt Upload<span className="text-destructive ml-0.5">*</span>
                    </label>
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-primary hover:bg-primary/5 ${
                        formErrors.receipt
                          ? 'border-destructive bg-destructive/5'
                          : 'border-border bg-background'
                      }`}
                    >
                      <ArrowUpTrayIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <div className="text-sm font-semibold text-foreground mb-1">
                        Drag and drop your receipt here, or click to browse
                      </div>
                      <div className="text-[0.8125rem] text-muted-foreground">
                        Upload a clear copy of your receipt or tax invoice
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Accepted: PDF, JPG, PNG (max 5 MB)
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {uploadedFile && (
                      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-accent-teal/10 border border-emerald-300 dark:border-emerald-800 rounded-lg mt-2">
                        <DocumentTextIcon className="w-5 h-5 text-accent-teal flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[0.8125rem] font-semibold text-foreground truncate">
                            {uploadedFile.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUpload();
                          }}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {formErrors.receipt && (
                      <span className="text-xs text-destructive font-medium">{formErrors.receipt}</span>
                    )}
                  </div>

                  {/* Additional Notes (full width) */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Additional Notes
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Any additional information or justification for this expense..."
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-h-[100px] resize-y"
                    />
                  </div>

                  {/* Tax Invoice Number */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8125rem] font-semibold text-foreground">
                      Tax Invoice Number{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formInvoice}
                      onChange={(e) => setFormInvoice(e.target.value)}
                      placeholder="e.g. INV-2026-00123"
                      className="w-full px-3.5 py-2.5 text-sm border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Policy Reminder */}
                <div className="flex items-start gap-3 px-4 py-3.5 bg-warning/10 border border-amber-300 dark:border-amber-800 rounded-lg mt-6">
                  <InformationCircleIcon className="w-5 h-5 text-accent-gold flex-shrink-0 mt-0.5" />
                  <p className="text-[0.8125rem] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Claims must be submitted within 30 days of the expense. Receipts are required for all claims
                    over R 100. Ensure all details are accurate before submitting, as amendments cannot be made
                    after approval.
                  </p>
                </div>

                {/* Form Footer */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 mt-7 pt-6 border-t border-border">
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-bold uppercase tracking-wide border-2 border-border rounded-full px-6 py-2.5 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <BookmarkIcon className="w-4 h-4" />
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto btn-cta inline-flex items-center justify-center gap-2"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                    Submit Claim
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* ====== DETAIL MODAL ====== */}
      {detailClaim && (
        <div
          className="fixed inset-0 bg-foreground/50 dark:bg-background/70 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setDetailClaim(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-[640px] max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Claim {detailClaim.id}</h2>
              <button
                onClick={() => setDetailClaim(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5">
              {/* Header row */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-[0.8125rem] text-muted-foreground">{detailClaim.dateFormatted}</span>
                {(() => {
                  const sc = getStatusConfig(detailClaim.status);
                  return (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${sc.bgClass} ${sc.textClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dotClass}`} />
                      {sc.label}
                    </span>
                  );
                })()}
              </div>

              {/* Detail Rows */}
              <div className="divide-y divide-border">
                {[
                  { label: 'Category', value: detailClaim.category },
                  { label: 'Description', value: detailClaim.description },
                  { label: 'Amount', value: formatCurrency(detailClaim.amount) },
                  { label: 'Cost Centre', value: 'CC-OPS-001' },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between py-2.5">
                    <span className="text-[0.8125rem] font-medium text-muted-foreground">{row.label}</span>
                    <span className="text-sm font-semibold text-foreground text-right">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Manager Comments */}
              {detailClaim.managerComments && (
                <>
                  <div className="text-[0.8125rem] font-bold uppercase tracking-wide text-muted-foreground mt-5 mb-3">
                    Manager Comments
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">{detailClaim.managerComments}</p>
                </>
              )}

              {/* Receipt Preview */}
              <div className="text-[0.8125rem] font-bold uppercase tracking-wide text-muted-foreground mt-5 mb-3">
                Receipt
              </div>
              <div className="bg-background border border-border rounded-lg p-8 text-center mb-4">
                <DocumentTextIcon className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-[0.8125rem] text-muted-foreground">receipt-bergville-visit.pdf</p>
              </div>

              {/* Approval Timeline */}
              <div className="text-[0.8125rem] font-bold uppercase tracking-wide text-muted-foreground mt-5 mb-3">
                Approval Timeline
              </div>
              <div className="relative pl-7">
                {/* Vertical line */}
                <div className="absolute left-[8px] top-1 bottom-1 w-0.5 bg-border" />
                {detailClaim.timeline.map((step, idx) => (
                  <div key={idx} className={`relative ${idx < detailClaim.timeline.length - 1 ? 'pb-5' : ''}`}>
                    {/* Dot */}
                    <div
                      className={`absolute -left-[24px] top-0.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center ${
                        step.status === 'completed'
                          ? 'bg-emerald-500 border-emerald-500'
                          : step.status === 'current'
                            ? 'bg-warning border-warning'
                            : 'bg-card border-border'
                      }`}
                    >
                      {step.status === 'completed' && (
                        <CheckCircleIcon className="w-2.5 h-2.5 text-white" />
                      )}
                      {step.status === 'current' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="text-[0.8125rem] font-semibold text-foreground">{step.step}</div>
                    {step.date && (
                      <div className="text-xs text-muted-foreground mt-0.5">{step.date}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <button className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide border-2 border-border rounded-full px-4 py-2 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors">
                <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                Download Receipt
              </button>
              <button
                onClick={() => setDetailClaim(null)}
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-4 py-2 hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== CANCEL CONFIRMATION MODAL ====== */}
      {cancelClaimId && (
        <div
          className="fixed inset-0 bg-foreground/50 dark:bg-background/70 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"
          onClick={() => setCancelClaimId(null)}
        >
          <div
            className="bg-card rounded-2xl shadow-xl w-full max-w-[460px] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Confirm Cancellation</h2>
              <button
                onClick={() => setCancelClaimId(null)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-8 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <InformationCircleIcon className="w-7 h-7 text-destructive" />
              </div>
              <div className="text-lg font-bold text-foreground mb-2">Cancel Expense Claim?</div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to cancel claim{' '}
                <strong className="text-foreground">{cancelClaimId}</strong>? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-border">
              <button
                onClick={() => setCancelClaimId(null)}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide border-2 border-border rounded-full px-5 py-2.5 text-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
              >
                Keep Claim
              </button>
              <button
                onClick={confirmCancel}
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide rounded-full px-5 py-2.5 bg-destructive text-white hover:bg-destructive/90 shadow-sm transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== TOAST ====== */}
      {toast && (
        <div className="fixed top-20 right-6 z-[2000] animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-card shadow-lg border border-border bg-card min-w-[320px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                toast.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : toast.type === 'error'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/10 text-primary'
              }`}
            >
              {toast.type === 'success' && <CheckCircleIcon className="w-4 h-4" />}
              {toast.type === 'error' && <XMarkIcon className="w-4 h-4" />}
              {toast.type === 'info' && <InformationCircleIcon className="w-4 h-4" />}
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex-shrink-0"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
