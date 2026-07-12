'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  BriefcaseIcon,
  CalendarIcon,
  CalendarDaysIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  HandThumbUpIcon,
  PencilSquareIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  UserIcon,
  ChartBarIcon,
  StarIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import PageWrapper from '@/components/PageWrapper';
import { InlineLoading } from '@/components/LoadingComponents';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-fetch';

interface EmployeeDetail {
  id: string;
  employeeNumber?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  jobTitle?: string;
  department?: string;
  division?: string;
  jobGrade?: string;
  employmentType?: string;
  hireDate?: string;
  location?: string;
  status?: string;
  profilePhotoUrl?: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
}

function fullName(emp: EmployeeDetail | null): string {
  if (!emp) return '';
  return (
    emp.fullName ||
    [emp.firstName, emp.lastName].filter(Boolean).join(' ').trim() ||
    'Employee'
  );
}

function initials(emp: EmployeeDetail | null): string {
  if (!emp) return '?';
  return (
    ((emp.firstName?.[0] || '') + (emp.lastName?.[0] || '')).toUpperCase() || '?'
  );
}

function formatDate(value?: string): string {
  if (!value) return '\u2014';
  try {
    return new Date(value).toLocaleDateString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
}

function computeTenure(hireDate?: string): string {
  if (!hireDate) return '\u2014';
  try {
    const start = new Date(hireDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    const parts: string[] = [];
    if (years > 0) parts.push(`${years}y`);
    if (months > 0) parts.push(`${months}m`);
    return parts.join(' ') || '< 1m';
  } catch {
    return '\u2014';
  }
}

type TabKey = 'overview' | 'documents' | 'leave' | 'performance' | 'training';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const employeeId = (params?.id as string) || '';

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  useEffect(() => {
    let cancelled = false;
    if (!employeeId || employeeId === '_') {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      setForbidden(false);
      try {
        const res = await apiFetch(`/api/employees/${employeeId}`);
        if (res.status === 403) {
          if (!cancelled) {
            setForbidden(true);
            setEmployee(null);
          }
          return;
        }
        if (res.status === 404) {
          if (!cancelled) {
            setError('Employee not found');
            setEmployee(null);
          }
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setEmployee(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load employee');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const isOwnReport =
    !!employee && !!user?.employeeId && employee.reportingManagerId === user.employeeId;

  const quickLinks = [
    {
      label: 'Leave Approvals',
      href: '/leave/approvals',
      icon: CalendarDaysIcon,
      tone: 'text-gold-700 bg-gold-50',
    },
    {
      label: 'Overtime',
      href: '/time-attendance/overtime',
      icon: ClockIcon,
      tone: 'text-orange-700 bg-orange-50',
    },
    {
      label: 'Performance',
      href: '/performance',
      icon: ClipboardDocumentCheckIcon,
      tone: 'text-green-700 bg-green-50',
    },
    {
      label: 'Training',
      href: '/training',
      icon: AcademicCapIcon,
      tone: 'text-violet-700 bg-violet-50',
    },
    {
      label: 'Send Recognition',
      href: '/engagement/recognition',
      icon: HandThumbUpIcon,
      tone: 'text-blue-700 bg-blue-50',
    },
  ];

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'documents', label: 'Documents' },
    { key: 'leave', label: 'Leave' },
    { key: 'performance', label: 'Performance' },
    { key: 'training', label: 'Training' },
  ];

  return (
    <PageWrapper
      title={employee ? fullName(employee) : 'Employee'}
      subtitle={employee ? employee.jobTitle || '' : ''}
      actions={
        <button
          type="button"
          onClick={() => router.push('/employee?managerId=me')}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to team
        </button>
      }
    >
      {loading ? (
        <div className="enterprise-card p-6">
          <InlineLoading message="Loading employee..." />
        </div>
      ) : forbidden ? (
        <div className="enterprise-card border-t-2 border-t-orange-500 p-6">
          <p className="font-semibold text-foreground">Access denied</p>
          <p className="text-sm text-muted-foreground mt-1">
            You don&apos;t have permission to view this employee record.
          </p>
        </div>
      ) : error ? (
        <div className="enterprise-card border-t-2 border-t-red-500 p-6">
          <p className="font-semibold text-red-700">Failed to load</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      ) : !employee ? (
        <div className="enterprise-card p-6">
          <p className="text-sm text-muted-foreground">No employee data.</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* ===== PROFILE BANNER ===== */}
          <section className="relative overflow-hidden rounded-t-card bg-gradient-to-br from-shumelahire-500 to-teal-600 px-6 py-10 md:py-12">
            {/* Decorative circles */}
            <div className="absolute -top-1/2 -right-[10%] w-[500px] h-[500px] rounded-full bg-white/[0.04] pointer-events-none" />
            <div className="absolute -bottom-[30%] left-[10%] w-[300px] h-[300px] rounded-full bg-white/[0.03] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              {/* Banner Left: Avatar + Info */}
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-card text-primary text-[2rem] font-extrabold flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                  {employee.profilePhotoUrl ? (
                    <img
                      src={employee.profilePhotoUrl}
                      alt=""
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    initials(employee)
                  )}
                </div>
                <div>
                  <h1 className="text-2xl md:text-[1.75rem] font-extrabold text-white leading-tight mb-1">
                    {fullName(employee)}
                  </h1>
                  <p className="text-white/80 text-base font-medium mb-2.5">
                    {employee.jobTitle || '\u2014'}
                  </p>
                  {employee.department && (
                    <span className="inline-flex items-center gap-1.5 bg-white text-primary px-3.5 py-1 rounded-button text-xs font-bold uppercase tracking-wider">
                      <BriefcaseIcon className="h-3 w-3" />
                      {employee.department}
                    </span>
                  )}
                  {!isOwnReport && user?.role === 'LINE_MANAGER' && (
                    <p className="mt-2 text-xs text-orange-200">
                      Note: this employee does not report to you directly.
                    </p>
                  )}
                </div>
              </div>

              {/* Banner Right: ID + Status + Tenure */}
              <div className="flex flex-col items-start md:items-end gap-2.5">
                {employee.employeeNumber && (
                  <span className="text-white/70 text-sm font-semibold tracking-wide">
                    ID: {employee.employeeNumber}
                  </span>
                )}
                {employee.status && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-button text-xs font-bold uppercase tracking-wider ${
                      employee.status === 'ACTIVE'
                        ? 'bg-surface-teal text-teal-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {employee.status === 'ACTIVE' && (
                      <span className="w-2 h-2 rounded-full bg-teal-600" />
                    )}
                    {employee.status}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-surface-gold text-gold-600 px-3.5 py-1 rounded-button text-xs font-bold">
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {computeTenure(employee.hireDate)}
                </span>
              </div>
            </div>
          </section>

          {/* ===== ACTION BAR ===== */}
          <div className="relative z-10 -mt-7 px-4 md:px-6 mb-6">
            <div className="enterprise-card p-4 flex items-center justify-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={() => router.push(`/employee/${employeeId}/edit`)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-primary text-primary text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit Profile
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-primary text-primary text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                Send Message
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button border-2 border-primary text-primary text-sm font-semibold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <DocumentTextIcon className="h-4 w-4" />
                View Documents
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta border-2 border-cta text-foreground text-sm font-semibold uppercase tracking-wider hover:bg-cta-hover hover:border-cta-hover hover:shadow-md transition-all"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                Generate Report
              </button>
            </div>
          </div>

          {/* ===== TAB BAR ===== */}
          <div className="enterprise-card rounded-b-none overflow-x-auto flex" role="tablist">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[120px] px-6 py-4 text-center text-sm font-semibold whitespace-nowrap border-b-[3px] transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary border-b-cta'
                    : 'text-muted-foreground border-b-transparent hover:text-primary hover:bg-surface-navy'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ===== TAB PANELS ===== */}
          <div className="pt-6 space-y-6">
            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Two-column grid: 3fr / 2fr */}
                <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
                  {/* LEFT COLUMN */}
                  <div className="flex flex-col gap-6">
                    {/* Personal Information Card */}
                    <div className="enterprise-card p-6">
                      <CardHeader
                        icon={UserIcon}
                        iconTone="bg-icon-bg-navy text-primary"
                        title="Personal Information"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InfoItem label="Email" value={employee.email} />
                        <InfoItem
                          label="Phone"
                          value={employee.mobilePhone || employee.phone}
                        />
                        <InfoItem label="Location" value={employee.location} />
                        <InfoItem label="Department" value={employee.department} />
                        <InfoItem label="Division" value={employee.division} />
                        <InfoItem label="Job Grade" value={employee.jobGrade} />
                      </div>
                    </div>

                    {/* Employment Details Card */}
                    <div className="enterprise-card p-6">
                      <CardHeader
                        icon={BriefcaseIcon}
                        iconTone="bg-icon-bg-teal text-teal-600"
                        title="Employment Details"
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <InfoItem
                          label="Hire Date"
                          value={formatDate(employee.hireDate)}
                        />
                        <InfoItem
                          label="Employment Type"
                          value={employee.employmentType}
                        />
                        <InfoItem label="Job Grade" value={employee.jobGrade} />
                        <InfoItem
                          label="Reporting To"
                          value={employee.reportingManagerName}
                          isLink
                        />
                        <InfoItem
                          label="Work Location"
                          value={employee.location}
                        />
                        <InfoItem label="Status" value={employee.status} />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="flex flex-col gap-6">
                    {/* Quick Stats 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard
                        icon={CalendarIcon}
                        iconTone="bg-icon-bg-navy text-primary"
                        value={computeTenure(employee.hireDate)}
                        label="Tenure"
                      />
                      <StatCard
                        icon={CalendarDaysIcon}
                        iconTone="bg-icon-bg-teal text-teal-600"
                        value="\u2014"
                        label="Leave Balance"
                      />
                      <StatCard
                        icon={ChartBarIcon}
                        iconTone="bg-icon-bg-gold text-gold-600"
                        value="\u2014"
                        label="Attendance Rate"
                      />
                      <StatCard
                        icon={StarIcon}
                        iconTone="bg-icon-bg-pink text-idc-pink-600"
                        value="\u2014"
                        label="Performance Score"
                      />
                    </div>

                    {/* Quick Actions Card */}
                    <div className="enterprise-card p-6">
                      <CardHeader
                        icon={HandThumbUpIcon}
                        iconTone="bg-icon-bg-gold text-gold-600"
                        title="Quick Actions"
                      />
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {quickLinks.map((link) => (
                          <button
                            key={link.label}
                            type="button"
                            onClick={() => router.push(link.href)}
                            className="enterprise-card p-4 text-left hover:shadow-md transition-shadow"
                          >
                            <div
                              className={`inline-flex p-2 rounded-full ${link.tone}`}
                            >
                              <link.icon className="h-5 w-5" />
                            </div>
                            <p className="mt-2 text-sm font-medium text-foreground">
                              {link.label}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Education & Qualifications (timeline) */}
                    <div className="enterprise-card p-6">
                      <CardHeader
                        icon={AcademicCapIcon}
                        iconTone="bg-icon-bg-navy text-primary"
                        title="Education & Qualifications"
                      />
                      <p className="text-sm text-muted-foreground italic">
                        Education data will appear here once integrated.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ===== ORG POSITION WIDGET (full width) ===== */}
                <div className="enterprise-card p-6">
                  <CardHeader
                    icon={BuildingOffice2Icon}
                    iconTone="bg-icon-bg-navy text-primary"
                    title="Organisational Position"
                  />
                  <div className="flex flex-col xl:flex-row items-center justify-center gap-0 py-6">
                    {/* Reports To */}
                    {employee.reportingManagerName && (
                      <>
                        <div className="enterprise-card p-5 text-center min-w-[200px]">
                          <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                            Reports To
                          </p>
                          <div className="w-12 h-12 rounded-full bg-icon-bg-navy text-primary text-sm font-bold mx-auto mb-2 flex items-center justify-center">
                            {employee.reportingManagerName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <p className="text-[0.9375rem] font-bold text-foreground">
                            {employee.reportingManagerName}
                          </p>
                          <p className="text-sm text-muted-foreground font-medium">
                            Manager
                          </p>
                        </div>
                        {/* Connector Arrow */}
                        <div className="flex items-center px-1 xl:rotate-0 rotate-90">
                          <svg
                            viewBox="0 0 48 24"
                            className="w-12 h-6 text-border"
                            fill="none"
                          >
                            <line
                              x1="0"
                              y1="12"
                              x2="38"
                              y2="12"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <polygon
                              points="38,6 48,12 38,18"
                              fill="currentColor"
                            />
                          </svg>
                        </div>
                      </>
                    )}

                    {/* Current Employee */}
                    <div className="enterprise-card border-2 border-cta shadow-lg p-5 text-center min-w-[200px]">
                      <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        Current
                      </p>
                      <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground text-sm font-bold mx-auto mb-2 flex items-center justify-center">
                        {initials(employee)}
                      </div>
                      <p className="text-[0.9375rem] font-bold text-foreground">
                        {fullName(employee)}
                      </p>
                      <p className="text-sm text-muted-foreground font-medium">
                        {employee.jobTitle || '\u2014'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ===== RECENT ACTIVITY TIMELINE (full width) ===== */}
                <div className="enterprise-card p-6">
                  <CardHeader
                    icon={ClockIcon}
                    iconTone="bg-icon-bg-teal text-teal-600"
                    title="Recent Activity"
                  />
                  <p className="text-sm text-muted-foreground italic">
                    Activity timeline will appear here once events are
                    available.
                  </p>
                </div>
              </div>
            )}

            {/* ===== DOCUMENTS TAB ===== */}
            {activeTab === 'documents' && (
              <PlaceholderTab
                icon={DocumentTextIcon}
                title="Documents Management"
                description="Documents management coming soon. This section will allow you to view, upload, and manage employee documents."
              />
            )}

            {/* ===== LEAVE TAB ===== */}
            {activeTab === 'leave' && (
              <PlaceholderTab
                icon={CalendarIcon}
                title="Leave Management"
                description="Leave management coming soon. This section will display leave balances, history, and allow leave requests."
              />
            )}

            {/* ===== PERFORMANCE TAB ===== */}
            {activeTab === 'performance' && (
              <PlaceholderTab
                icon={ChartBarIcon}
                title="Performance Reviews"
                description="Performance reviews coming soon. This section will display performance evaluations, goals, and development plans."
              />
            )}

            {/* ===== TRAINING TAB ===== */}
            {activeTab === 'training' && (
              <PlaceholderTab
                icon={AcademicCapIcon}
                title="Training Records"
                description="Training records coming soon. This section will display completed and upcoming training, certifications, and development programmes."
              />
            )}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

/* ===== SUB-COMPONENTS ===== */

function CardHeader({
  icon: Icon,
  iconTone,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  title: string;
}) {
  return (
    <>
      <div className="flex items-center gap-3 mb-1.5">
        <div
          className={`w-9 h-9 rounded-control flex items-center justify-center flex-shrink-0 ${iconTone}`}
        >
          <Icon className="h-[18px] w-[18px]" />
        </div>
        <h2 className="text-[1.0625rem] font-bold text-foreground">{title}</h2>
      </div>
      <div className="h-[3px] w-12 bg-cta rounded-sm mb-5" />
    </>
  );
}

function InfoItem({
  label,
  value,
  isLink,
}: {
  label: string;
  value?: string | null;
  isLink?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      {isLink && value ? (
        <span className="text-[0.9375rem] font-medium text-primary underline decoration-icon-bg-navy underline-offset-2 cursor-pointer hover:decoration-primary">
          {value}
        </span>
      ) : (
        <span className="text-[0.9375rem] font-medium text-foreground">
          {value || '\u2014'}
        </span>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconTone,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  value: string;
  label: string;
}) {
  return (
    <div className="enterprise-card p-4 flex items-center gap-3 hover:-translate-y-0.5 transition-transform">
      <div
        className={`w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0 ${iconTone}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-lg font-extrabold text-foreground leading-tight">
          {value}
        </span>
        <span className="text-[0.6875rem] font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

function PlaceholderTab({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="enterprise-card">
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-[72px] h-[72px] rounded-full bg-surface-navy flex items-center justify-center mb-5">
          <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-[0.9375rem] text-muted-foreground max-w-[400px]">
          {description}
        </p>
      </div>
    </div>
  );
}
