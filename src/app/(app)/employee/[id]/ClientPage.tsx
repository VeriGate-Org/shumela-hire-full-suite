'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  HandThumbUpIcon,
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
  if (!value) return '—';
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

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const employeeId = (params?.id as string) || '';

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState(false);

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

  return (
    <PageWrapper
      title={employee ? fullName(employee) : 'Employee'}
      subtitle={employee ? employee.jobTitle || '' : ''}
      actions={
        <button
          type="button"
          onClick={() => router.push('/employee?managerId=me')}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
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
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-orange-500 p-6">
          <p className="font-semibold text-gray-900">Access denied</p>
          <p className="text-sm text-gray-600 mt-1">
            You don&apos;t have permission to view this employee record.
          </p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-red-500 p-6">
          <p className="font-semibold text-red-700">Failed to load</p>
          <p className="text-sm text-gray-600 mt-1">{error}</p>
        </div>
      ) : !employee ? (
        <div className="bg-white rounded-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">No employee data.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-sm border border-gray-200 border-t-2 border-t-gold-500 p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-lg font-semibold flex-shrink-0 overflow-hidden">
                {employee.profilePhotoUrl ? (
                  <img
                    src={employee.profilePhotoUrl}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  initials(employee)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {fullName(employee)}
                  </h2>
                  {employee.status && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        employee.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {employee.status}
                    </span>
                  )}
                  {employee.employeeNumber && (
                    <span className="text-xs text-gray-500">
                      {employee.employeeNumber}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  {[employee.jobTitle, employee.department].filter(Boolean).join(' · ') || '—'}
                </p>
                {!isOwnReport && user?.role === 'LINE_MANAGER' && (
                  <p className="mt-2 text-xs text-orange-700">
                    Note: this employee does not report to you directly.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <DetailRow icon={EnvelopeIcon} label="Email" value={employee.email} />
              <DetailRow
                icon={PhoneIcon}
                label="Phone"
                value={employee.mobilePhone || employee.phone}
              />
              <DetailRow icon={MapPinIcon} label="Location" value={employee.location} />
              <DetailRow
                icon={BriefcaseIcon}
                label="Employment Type"
                value={employee.employmentType}
              />
              <DetailRow
                icon={UserCircleIcon}
                label="Reports to"
                value={employee.reportingManagerName}
              />
              <DetailRow
                icon={CalendarIcon}
                label="Hire Date"
                value={formatDate(employee.hireDate)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => router.push(link.href)}
                  className="bg-white rounded-sm border border-gray-200 p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className={`inline-flex p-2 rounded-full ${link.tone}`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">{link.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-1.5 rounded-full bg-gray-50 text-gray-500">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}
