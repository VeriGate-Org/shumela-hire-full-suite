'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  payrollService,
  StatutoryDeduction,
  PayrollSummary,
  IRP5Certificate,
  SARSSubmission,
} from '@/services/payrollService';
import {
  BanknotesIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

type TabId = 'overview' | 'monthly' | 'irp5' | 'sars';

const tabs: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Deductions Overview' },
  { id: 'monthly', label: 'Monthly Payroll' },
  { id: 'irp5', label: 'IRP5 Certificates' },
  { id: 'sars', label: 'SARS Submissions' },
];

function formatCurrency(cents: number) {
  return 'R ' + (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 });
}

function formatCurrencyWhole(cents: number) {
  return 'R ' + (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function StatutoryCompliancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [deductions, setDeductions] = useState<StatutoryDeduction[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<PayrollSummary[]>([]);
  const [irp5Certificates, setIrp5Certificates] = useState<IRP5Certificate[]>([]);
  const [sarsSubmissions, setSarsSubmissions] = useState<SARSSubmission[]>([]);
  const [taxYear, setTaxYear] = useState('');
  const [registrationNumbers, setRegistrationNumbers] = useState({
    companyTaxNumber: '',
    sdlNumber: '',
    uifReferenceNumber: '',
    payeNumber: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await payrollService.getStatutoryOverview();
      setDeductions(data.deductions);
      setMonthlySummary(data.monthlySummary);
      setIrp5Certificates(data.irp5Certificates);
      setSarsSubmissions(data.sarsSubmissions);
      setTaxYear(data.taxYear);
      setRegistrationNumbers({
        companyTaxNumber: data.companyTaxNumber,
        sdlNumber: data.sdlNumber,
        uifReferenceNumber: data.uifReferenceNumber,
        payeNumber: data.payeNumber,
      });
    } catch (error) {
      console.error('Failed to load statutory data:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalEmployeeDeductions = deductions.reduce((s, d) => s + d.employeeContribution, 0);
  const totalEmployerDeductions = deductions.reduce((s, d) => s + d.employerContribution, 0);
  const ytdGrossPay = monthlySummary.reduce((s, m) => s + m.grossPay, 0);
  const ytdPAYE = monthlySummary.reduce((s, m) => s + m.paye, 0);
  const ytdUIF = monthlySummary.reduce((s, m) => s + m.uif, 0);
  const ytdSDL = monthlySummary.reduce((s, m) => s + m.sdl, 0);

  const submissionStatusConfig: Record<string, { icon: typeof CheckCircleIcon; color: string; bg: string }> = {
    PENDING: { icon: ClockIcon, color: 'text-yellow-700', bg: 'bg-yellow-100' },
    SUBMITTED: { icon: ExclamationTriangleIcon, color: 'text-blue-700', bg: 'bg-blue-100' },
    ACCEPTED: { icon: CheckCircleIcon, color: 'text-green-700', bg: 'bg-green-100' },
    REJECTED: { icon: ExclamationTriangleIcon, color: 'text-red-700', bg: 'bg-red-100' },
  };

  const irp5StatusConfig: Record<string, { color: string; bg: string }> = {
    GENERATED: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    SUBMITTED: { color: 'text-blue-700', bg: 'bg-blue-100' },
    ACCEPTED: { color: 'text-green-700', bg: 'bg-green-100' },
  };

  if (loading) {
    return (
      <PageWrapper title="Tax & Statutory Compliance" subtitle="Loading...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <FeatureGate feature="SAGE_EVOLUTION">
      <PageWrapper
        title="Tax & Statutory Compliance"
        subtitle={`South African statutory deductions and SARS reporting \u2014 Tax Year ${taxYear}`}
      >
        <div className="space-y-6">
          {/* Registration Numbers */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">PAYE Reference</p>
              <p className="text-sm font-semibold text-gray-900">{registrationNumbers.payeNumber}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">UIF Reference</p>
              <p className="text-sm font-semibold text-gray-900">{registrationNumbers.uifReferenceNumber}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">SDL Number</p>
              <p className="text-sm font-semibold text-gray-900">{registrationNumbers.sdlNumber}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-xs text-gray-500 mb-1">Company Tax No.</p>
              <p className="text-sm font-semibold text-gray-900">{registrationNumbers.companyTaxNumber}</p>
            </div>
          </div>

          {/* YTD KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <BanknotesIcon className="w-5 h-5 text-green-600" />
                <span className="text-xs text-gray-500">YTD Gross Pay</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrencyWhole(ytdGrossPay)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <BuildingLibraryIcon className="w-5 h-5 text-red-600" />
                <span className="text-xs text-gray-500">YTD PAYE</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrencyWhole(ytdPAYE)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
                <span className="text-xs text-gray-500">YTD UIF</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrencyWhole(ytdUIF)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                <span className="text-xs text-gray-500">YTD SDL</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{formatCurrencyWhole(ytdSDL)}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b">
            <div className="flex gap-0 -mb-px">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">Monthly Statutory Deductions Breakdown</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current month contribution summary per category</p>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employer</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {deductions.map(d => (
                    <tr key={d.category} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded ${
                          d.category === 'PAYE' ? 'bg-red-100 text-red-800' :
                          d.category === 'UIF' ? 'bg-blue-100 text-blue-800' :
                          d.category === 'SDL' ? 'bg-purple-100 text-purple-800' :
                          d.category === 'Pension' ? 'bg-green-100 text-green-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {d.category}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">{d.description}</td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                        {d.employeeContribution > 0 ? formatCurrency(d.employeeContribution) : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-medium text-gray-900">
                        {d.employerContribution > 0 ? formatCurrency(d.employerContribution) : '-'}
                      </td>
                      <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                        {formatCurrency(d.total)}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500">{d.rate}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr className="font-semibold">
                    <td className="px-6 py-3 text-sm text-gray-900" colSpan={2}>Total Monthly Contributions</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900">{formatCurrency(totalEmployeeDeductions)}</td>
                    <td className="px-6 py-3 text-sm text-right text-gray-900">{formatCurrency(totalEmployerDeductions)}</td>
                    <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                      {formatCurrency(totalEmployeeDeductions + totalEmployerDeductions)}
                    </td>
                    <td className="px-6 py-3"></td>
                  </tr>
                </tfoot>
              </table>

              {/* Compliance Notes */}
              <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                <h4 className="text-xs font-semibold text-blue-800 mb-2">Compliance Notes</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>PAYE calculated per SARS tax tables (2025/2026 tax year). Includes tax rebates and thresholds.</li>
                  <li>UIF capped at maximum monthly earnings ceiling of R17,712 per the Unemployment Insurance Act.</li>
                  <li>SDL payable by employers with annual payroll exceeding R500,000 (Skills Development Levies Act).</li>
                  <li>All contributions are POPIA-compliant. PII fields encrypted with AES-256-GCM at rest.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'monthly' && (
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Monthly Payroll Summary</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tax year {taxYear} monthly breakdown</p>
                </div>
                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                  <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Export to Excel
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Headcount</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYE</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">UIF</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">SDL</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pension</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Medical</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthlySummary.map(m => (
                      <tr key={m.month} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{m.month}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{m.headcount}</td>
                        <td className="px-4 py-2.5 text-right text-gray-900">{formatCurrencyWhole(m.grossPay)}</td>
                        <td className="px-4 py-2.5 text-right text-red-700">{formatCurrencyWhole(m.paye)}</td>
                        <td className="px-4 py-2.5 text-right text-blue-700">{formatCurrencyWhole(m.uif)}</td>
                        <td className="px-4 py-2.5 text-right text-purple-700">{formatCurrencyWhole(m.sdl)}</td>
                        <td className="px-4 py-2.5 text-right text-green-700">{formatCurrencyWhole(m.pension)}</td>
                        <td className="px-4 py-2.5 text-right text-amber-700">{formatCurrencyWhole(m.medical)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatCurrencyWhole(m.netPay)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td className="px-4 py-3 text-gray-900">YTD Total</td>
                      <td className="px-4 py-3 text-right text-gray-600">-</td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatCurrencyWhole(ytdGrossPay)}</td>
                      <td className="px-4 py-3 text-right text-red-700">{formatCurrencyWhole(ytdPAYE)}</td>
                      <td className="px-4 py-3 text-right text-blue-700">{formatCurrencyWhole(ytdUIF)}</td>
                      <td className="px-4 py-3 text-right text-purple-700">{formatCurrencyWhole(ytdSDL)}</td>
                      <td className="px-4 py-3 text-right text-green-700">{formatCurrencyWhole(monthlySummary.reduce((s, m) => s + m.pension, 0))}</td>
                      <td className="px-4 py-3 text-right text-amber-700">{formatCurrencyWhole(monthlySummary.reduce((s, m) => s + m.medical, 0))}</td>
                      <td className="px-4 py-3 text-right text-gray-900">{formatCurrencyWhole(monthlySummary.reduce((s, m) => s + m.netPay, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'irp5' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">IRP5 Tax Certificates</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Employee Income Tax Certificates for tax year {taxYear}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                      Generate All IRP5s
                    </button>
                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                      <ArrowDownTrayIcon className="w-3.5 h-3.5" /> Bulk Download
                    </button>
                  </div>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Number</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross Income</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">PAYE Deducted</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">UIF</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {irp5Certificates.map(cert => {
                      const status = irp5StatusConfig[cert.status];
                      return (
                        <tr key={cert.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cert.id}</td>
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-gray-900">{cert.employeeName}</p>
                            <p className="text-xs text-gray-500">{cert.employeeId}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{cert.taxNumber}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(cert.grossIncome)}</td>
                          <td className="px-4 py-3 text-sm text-right text-red-700">{formatCurrency(cert.totalPAYE)}</td>
                          <td className="px-4 py-3 text-sm text-right text-blue-700">{formatCurrency(cert.totalUIF)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                              {cert.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              Download PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* IRP5 Info Panel */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="text-xs font-semibold text-amber-800 mb-1">IRP5 / IT3(a) Information</h4>
                <p className="text-xs text-amber-700">
                  IRP5 certificates are generated per the Income Tax Act, 1962. Certificates reflect total remuneration,
                  PAYE deducted, and other statutory deductions for the tax year. Employers must submit IRP5 data to SARS
                  via EMP501 reconciliation. All tax numbers are encrypted at rest using AES-256-GCM.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sars' && (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">SARS Submissions</h3>
                    <p className="text-xs text-gray-500 mt-0.5">EMP201, EMP501, UIF and SDL submissions to SARS</p>
                  </div>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                    New Submission
                  </button>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submission Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Employees</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sarsSubmissions.map(sub => {
                      const status = submissionStatusConfig[sub.status];
                      const StatusIcon = status.icon;
                      return (
                        <tr key={sub.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{sub.submissionType}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{sub.period}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-600">{sub.employeeCount}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(sub.totalAmount)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${status.bg} ${status.color}`}>
                              <StatusIcon className="w-3 h-3" />
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {sub.submittedDate ? new Date(sub.submittedDate).toLocaleDateString('en-ZA') : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500 font-mono text-xs">
                            {sub.referenceNumber || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Submission Schedule */}
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Submission Calendar</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 bg-red-50 border-red-200">
                    <p className="text-xs font-semibold text-red-800 mb-1">EMP201 (Monthly)</p>
                    <p className="text-xs text-red-700">Due by 7th of following month</p>
                    <p className="text-xs text-red-600 mt-2 font-medium">Next: 7 May 2026</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-1">EMP501 (Bi-Annual)</p>
                    <p className="text-xs text-blue-700">Interim: October | Final: May</p>
                    <p className="text-xs text-blue-600 mt-2 font-medium">Next: 31 May 2026</p>
                  </div>
                  <div className="border rounded-lg p-4 bg-purple-50 border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-1">UIF / SDL (Quarterly)</p>
                    <p className="text-xs text-purple-700">Due 15 days after quarter end</p>
                    <p className="text-xs text-purple-600 mt-2 font-medium">Next: 15 Jul 2026</p>
                  </div>
                </div>
              </div>

              {/* Compliance info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-green-800 mb-1">SARS e@syFile Integration</h4>
                    <p className="text-xs text-green-700">
                      ShumelaHire generates EMP201 and EMP501 files in SARS-compliant CSV format for upload via
                      SARS e@syFile Employer. All submissions are tracked with reference numbers and audit trails.
                      Tax numbers are masked in the UI and encrypted in storage per POPIA requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
