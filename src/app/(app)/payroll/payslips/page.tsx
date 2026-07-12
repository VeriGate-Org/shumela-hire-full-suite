'use client';

import { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { useToast } from '@/components/Toast';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  XMarkIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface PayslipItem {
  month: string;
  period: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'processed' | 'pending';
}

interface PayslipDetail {
  earnings: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
}

/* ------------------------------------------------------------------ */
/* Demo data                                                           */
/* ------------------------------------------------------------------ */

const PAYSLIPS_BY_YEAR: Record<number, PayslipItem[]> = {
  2026: [
    { month: 'June 2026', period: '1 Jun – 30 Jun 2026', grossPay: 4583333, deductions: 1245000, netPay: 3338333, status: 'processed' },
    { month: 'May 2026', period: '1 May – 31 May 2026', grossPay: 4583333, deductions: 1245000, netPay: 3338333, status: 'processed' },
    { month: 'April 2026', period: '1 Apr – 30 Apr 2026', grossPay: 4583333, deductions: 1230000, netPay: 3353333, status: 'processed' },
    { month: 'March 2026', period: '1 Mar – 31 Mar 2026', grossPay: 4583333, deductions: 1230000, netPay: 3353333, status: 'processed' },
    { month: 'February 2026', period: '1 Feb – 28 Feb 2026', grossPay: 4583333, deductions: 1215000, netPay: 3368333, status: 'processed' },
    { month: 'January 2026', period: '1 Jan – 31 Jan 2026', grossPay: 4583333, deductions: 1215000, netPay: 3368333, status: 'processed' },
  ],
  2025: [
    { month: 'December 2025', period: '1 Dec – 31 Dec 2025', grossPay: 4333333, deductions: 1175000, netPay: 3158333, status: 'processed' },
    { month: 'November 2025', period: '1 Nov – 30 Nov 2025', grossPay: 4333333, deductions: 1175000, netPay: 3158333, status: 'processed' },
    { month: 'October 2025', period: '1 Oct – 31 Oct 2025', grossPay: 4333333, deductions: 1160000, netPay: 3173333, status: 'processed' },
    { month: 'September 2025', period: '1 Sep – 30 Sep 2025', grossPay: 4333333, deductions: 1160000, netPay: 3173333, status: 'processed' },
    { month: 'August 2025', period: '1 Aug – 31 Aug 2025', grossPay: 4333333, deductions: 1145000, netPay: 3188333, status: 'processed' },
    { month: 'July 2025', period: '1 Jul – 31 Jul 2025', grossPay: 4333333, deductions: 1145000, netPay: 3188333, status: 'processed' },
    { month: 'June 2025', period: '1 Jun – 30 Jun 2025', grossPay: 4333333, deductions: 1130000, netPay: 3203333, status: 'processed' },
    { month: 'May 2025', period: '1 May – 31 May 2025', grossPay: 4333333, deductions: 1130000, netPay: 3203333, status: 'processed' },
    { month: 'April 2025', period: '1 Apr – 30 Apr 2025', grossPay: 4333333, deductions: 1115000, netPay: 3218333, status: 'processed' },
    { month: 'March 2025', period: '1 Mar – 31 Mar 2025', grossPay: 4333333, deductions: 1115000, netPay: 3218333, status: 'processed' },
    { month: 'February 2025', period: '1 Feb – 28 Feb 2025', grossPay: 4333333, deductions: 1100000, netPay: 3233333, status: 'processed' },
    { month: 'January 2025', period: '1 Jan – 31 Jan 2025', grossPay: 4333333, deductions: 1100000, netPay: 3233333, status: 'processed' },
  ],
  2024: [],
};

const DETAIL: PayslipDetail = {
  earnings: [
    { label: 'Basic Salary', amount: 3500000 },
    { label: 'Housing Allowance', amount: 500000 },
    { label: 'Transport Allowance', amount: 333333 },
    { label: 'Medical Aid Allowance', amount: 250000 },
  ],
  deductions: [
    { label: 'PAYE (Income Tax)', amount: 690000 },
    { label: 'UIF', amount: 45833 },
    { label: 'Pension Fund (7.5%)', amount: 343750 },
    { label: 'Medical Aid', amount: 165417 },
  ],
  totalEarnings: 4583333,
  totalDeductions: 1245000,
  netPay: 3338333,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function formatCurrency(cents: number): string {
  return 'R ' + (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function PayslipsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [payslips, setPayslips] = useState<PayslipItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipItem | null>(null);

  const loadPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate API call — replace with real service when available
      await new Promise((r) => setTimeout(r, 600));
      setPayslips(PAYSLIPS_BY_YEAR[selectedYear] ?? []);
    } catch {
      setError('Something went wrong while loading your payslip data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadPayslips();
  }, [loadPayslips]);

  const heroPayslip = payslips[0] ?? null;

  const handleDownload = (month: string) => {
    toast(`Downloading payslip for ${month}...`, 'info');
    setTimeout(() => toast(`Payslip for ${month} downloaded`, 'success'), 1200);
  };

  const handleDownloadAll = () => {
    toast(`Downloading all payslips for ${selectedYear}...`, 'info');
    setTimeout(() => toast(`All ${selectedYear} payslips downloaded`, 'success'), 1500);
  };

  const openModal = (payslip: PayslipItem) => {
    setSelectedPayslip(payslip);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPayslip(null);
  };

  /* Chart data */
  const chartPayslips = payslips.filter((p) => p.status === 'processed');
  const maxNet = Math.max(...chartPayslips.map((p) => p.netPay), 1);

  const years = [2026, 2025, 2024];

  /* Actions slot for page header */
  const actions = (
    <button
      onClick={handleDownloadAll}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-border bg-card text-foreground text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
    >
      <ArrowDownTrayIcon className="w-4 h-4" />
      Download All ({selectedYear})
    </button>
  );

  return (
    <FeatureGate feature="payroll" fallback={null}>
      <PageWrapper
        title="My Payslips"
        subtitle="View and download your monthly payslips"
        actions={actions}
      >
        {/* ========== LOADING STATE ========== */}
        {loading && (
          <div className="space-y-6 max-w-[1100px] mx-auto">
            {/* Skeleton hero */}
            <div className="enterprise-card overflow-hidden">
              <div className="h-20 bg-muted animate-pulse" />
              <div className="p-7">
                <div className="grid grid-cols-3 gap-6 mb-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                      <div className="h-7 w-28 bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-center gap-3">
                  <div className="h-10 w-36 bg-muted animate-pulse rounded-button" />
                  <div className="h-10 w-36 bg-muted animate-pulse rounded-button" />
                </div>
              </div>
            </div>
            {/* Skeleton year pills */}
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-[72px] bg-muted animate-pulse rounded-button" />
              ))}
            </div>
            {/* Skeleton payslip rows */}
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="enterprise-card p-5 flex items-center gap-6">
                  <div className="min-w-[150px] space-y-2">
                    <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex-1 flex justify-around gap-4">
                    <div className="h-4 w-[90px] bg-muted animate-pulse rounded" />
                    <div className="h-4 w-[90px] bg-muted animate-pulse rounded" />
                    <div className="h-4 w-[90px] bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-16 bg-muted animate-pulse rounded-button" />
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            {/* Skeleton chart */}
            <div className="enterprise-card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 bg-muted animate-pulse rounded-[10px]" />
                <div className="h-5 w-48 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex items-end justify-between gap-4 h-[180px]">
                {[60, 75, 65, 80, 70, 85].map((h, i) => (
                  <div key={i} className="flex-1 bg-muted animate-pulse rounded-t-md" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== ERROR STATE ========== */}
        {!loading && error && (
          <div className="max-w-[1100px] mx-auto">
            <div className="bg-error-bg border border-idc-pink-200 rounded-card p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-idc-pink-100 flex items-center justify-center mx-auto mb-5">
                <ExclamationCircleIcon className="w-7 h-7 text-error" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Unable to Load Payslips</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">{error}</p>
              <button
                onClick={loadPayslips}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-button bg-primary text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ========== EMPTY STATE ========== */}
        {!loading && !error && payslips.length === 0 && (
          <div className="max-w-[1100px] mx-auto">
            {/* Year filter still shown so user can switch */}
            <div className="inline-flex items-center gap-1 p-1 bg-card border border-border rounded-button shadow-sm mb-6">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-5 py-2 rounded-button text-[13px] font-semibold transition-all ${
                    selectedYear === y
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-surface-navy flex items-center justify-center mb-5">
                <DocumentTextIcon className="w-9 h-9 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">No Payslips Available</h3>
              <p className="text-sm text-muted-foreground max-w-[340px] mb-5">
                There are no payslips for the selected year. Payslips will appear here once they have been processed.
              </p>
              <button
                onClick={() => setSelectedYear(2026)}
                className="text-[13px] font-bold text-primary hover:text-accent-teal transition-colors cursor-pointer"
              >
                Select Another Year
              </button>
            </div>
          </div>
        )}

        {/* ========== NORMAL STATE ========== */}
        {!loading && !error && payslips.length > 0 && (
          <div className="space-y-6 max-w-[1100px] mx-auto">
            {/* Hero Card: Current Month */}
            {heroPayslip && (
              <div className="enterprise-card overflow-hidden">
                <div className="bg-gradient-to-br from-shumelahire-500 via-shumelahire-400 to-teal-600 px-8 py-7 text-white relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.06]" />
                  <div className="absolute -bottom-[60px] left-[30%] w-[200px] h-[200px] rounded-full bg-white/[0.04]" />
                  <p className="text-xs font-semibold uppercase tracking-widest opacity-75 mb-1">Current Payslip</p>
                  <h2 className="text-[1.375rem] font-extrabold tracking-tight">{heroPayslip.month}</h2>
                </div>
                <div className="px-8 py-7">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Gross Pay</p>
                      <p className="text-2xl font-extrabold text-foreground tracking-tight">{formatCurrency(heroPayslip.grossPay)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Deductions</p>
                      <p className="text-2xl font-extrabold text-accent-pink tracking-tight">{formatCurrency(heroPayslip.deductions)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Net Pay</p>
                      <p className="text-[1.75rem] font-extrabold text-accent-gold tracking-tight">{formatCurrency(heroPayslip.netPay)}</p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => openModal(heroPayslip)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-button bg-primary text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleDownload(heroPayslip.month)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-button bg-cta text-foreground text-xs font-bold uppercase tracking-wider hover:bg-cta-hover transition-colors shadow-sm"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4" />
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Year Filter Pills */}
            <div className="inline-flex items-center gap-1 p-1 bg-card border border-border rounded-button shadow-sm">
              {years.map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-5 py-2 rounded-button text-[13px] font-semibold transition-all ${
                    selectedYear === y
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>

            {/* Payslip List */}
            <div className="space-y-3">
              {payslips.map((slip) => (
                <div
                  key={slip.month}
                  className="enterprise-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 hover:shadow-lg transition-all"
                >
                  {/* Left: Month + Status */}
                  <div className="min-w-[180px]">
                    <p className="text-base font-bold text-foreground">{slip.month}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{slip.period}</p>
                    <div className={`inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold uppercase tracking-wider ${
                      slip.status === 'processed' ? 'text-success' : 'text-warning'
                    }`}>
                      <span className={`w-[7px] h-[7px] rounded-full ${slip.status === 'processed' ? 'bg-success' : 'bg-warning'}`} />
                      {slip.status}
                    </div>
                  </div>

                  {/* Center: Figures */}
                  <div className="flex-1 grid grid-cols-3 gap-4 w-full sm:w-auto">
                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Gross</p>
                      <p className="text-[15px] font-bold text-foreground">{formatCurrency(slip.grossPay)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Deductions</p>
                      <p className="text-[15px] font-bold text-accent-pink">{formatCurrency(slip.deductions)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Net Pay</p>
                      <p className="text-[15px] font-bold text-accent-gold">{formatCurrency(slip.netPay)}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openModal(slip)}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-button text-xs font-bold text-muted-foreground border border-border hover:border-primary hover:text-primary hover:bg-surface-navy transition-all"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownload(slip.month)}
                      className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary hover:border-primary transition-all"
                      title="Download PDF"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Net Pay Trend Bar Chart */}
            {chartPayslips.length > 0 && (
              <div className="enterprise-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-[10px] bg-icon-bg-navy flex items-center justify-center">
                    <ChartBarIcon className="w-[18px] h-[18px] text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-foreground">Net Pay Trend &mdash; {selectedYear}</h3>
                </div>
                <div className="flex items-end justify-between gap-4 h-[220px] px-2">
                  {[...chartPayslips].reverse().map((slip) => {
                    const height = Math.max((slip.netPay / maxNet) * 100, 2);
                    const shortMonth = slip.month.split(' ')[0].slice(0, 3);
                    return (
                      <div key={slip.month} className="flex flex-col items-center flex-1 h-full justify-end group">
                        <span className="text-[11px] font-bold text-primary mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatCurrency(slip.netPay)}
                        </span>
                        <div
                          className="w-full max-w-[64px] rounded-t-md bg-gradient-to-b from-shumelahire-500 to-shumelahire-400 group-hover:from-teal-600 group-hover:to-shumelahire-500 transition-all min-h-[4px]"
                          style={{ height: `${height}%` }}
                        />
                        <span className="text-xs font-semibold text-muted-foreground mt-2.5">{shortMonth}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== PAYSLIP DETAIL MODAL ========== */}
        {modalOpen && selectedPayslip && (
          <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-foreground/55 backdrop-blur-sm p-6"
            onClick={closeModal}
          >
            <div
              className="bg-card rounded-2xl shadow-xl w-full max-w-[700px] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="bg-gradient-to-br from-shumelahire-500 via-shumelahire-400 to-teal-600 px-8 py-7 text-white rounded-t-2xl relative overflow-hidden">
                <div className="absolute -top-[30px] -right-5 w-[120px] h-[120px] rounded-full bg-white/[0.06]" />
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors z-10"
                  title="Close"
                >
                  <XMarkIcon className="w-4 h-4 text-white" />
                </button>
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] opacity-70 mb-1">uThukela Water</p>
                <h2 className="text-[1.375rem] font-extrabold tracking-tight">Payslip &mdash; {selectedPayslip.month}</h2>
                <p className="text-[13px] font-medium opacity-80 mt-1">Employee Payslip Document</p>
              </div>

              {/* Modal body */}
              <div className="px-8 py-7">
                {/* Employee info grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-5 bg-surface-navy rounded-control mb-6">
                  {[
                    { label: 'Employee Name', value: 'Sipho Ndlovu' },
                    { label: 'Employee ID', value: 'UTH-2020-001' },
                    { label: 'Position', value: 'Operations Manager' },
                    { label: 'Tax Number', value: '1234567890' },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Earnings section */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-icon-bg-teal flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-accent-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Earnings</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {DETAIL.earnings.map((e) => (
                        <tr key={e.label} className="border-b border-border last:border-0">
                          <td className="py-2.5 text-sm font-medium text-muted-foreground">{e.label}</td>
                          <td className="py-2.5 text-sm font-semibold text-foreground text-right tabular-nums">{formatCurrency(e.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border">
                        <td className="pt-3.5 text-[15px] font-extrabold text-foreground">Total Earnings</td>
                        <td className="pt-3.5 text-[15px] font-extrabold text-foreground text-right tabular-nums">{formatCurrency(DETAIL.totalEarnings)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Deductions section */}
                <div className="mb-5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-icon-bg-pink flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-accent-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Deductions</h3>
                  </div>
                  <table className="w-full">
                    <tbody>
                      {DETAIL.deductions.map((d) => (
                        <tr key={d.label} className="border-b border-border last:border-0">
                          <td className="py-2.5 text-sm font-medium text-muted-foreground">{d.label}</td>
                          <td className="py-2.5 text-sm font-semibold text-foreground text-right tabular-nums">{formatCurrency(d.amount)}</td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-border">
                        <td className="pt-3.5 text-[15px] font-extrabold text-foreground">Total Deductions</td>
                        <td className="pt-3.5 text-[15px] font-extrabold text-foreground text-right tabular-nums">{formatCurrency(DETAIL.totalDeductions)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Summary box */}
                <div className="bg-gradient-to-br from-surface-gold to-gold-50 border border-gold-500/25 rounded-control p-5 mb-5">
                  <div className="flex justify-between items-center pb-3 mb-2 border-b border-gold-500/40">
                    <span className="text-base font-extrabold text-foreground">Net Pay</span>
                    <span className="text-xl font-extrabold text-accent-gold">{formatCurrency(DETAIL.netPay)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[13px] font-semibold text-muted-foreground">Total Earnings</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(DETAIL.totalEarnings)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[13px] font-semibold text-muted-foreground">Total Deductions</span>
                    <span className="text-sm font-semibold text-foreground">{formatCurrency(DETAIL.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-8 py-5 border-t border-border flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="inline-flex items-center px-5 py-2.5 rounded-button border-2 border-border text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-primary hover:text-primary transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (selectedPayslip) handleDownload(selectedPayslip.month);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta text-foreground text-xs font-bold uppercase tracking-wider hover:bg-cta-hover transition-colors shadow-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
