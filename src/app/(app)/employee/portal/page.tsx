'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { TableSkeleton, InlineLoading } from '@/components/LoadingComponents';
import { apiFetch } from '@/lib/api-fetch';
import Link from 'next/link';
import {
  UserCircleIcon,
  DocumentTextIcon,
  BanknotesIcon,
  PhoneIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeProfile {
  id: number;
  employeeNumber: string;
  title: string | null;
  firstName: string;
  lastName: string;
  preferredName: string | null;
  email: string;
  personalEmail: string | null;
  phone: string | null;
  mobilePhone: string | null;
  department: string | null;
  division: string | null;
  jobTitle: string | null;
  jobGrade: string | null;
  employmentType: string | null;
  hireDate: string;
  location: string | null;
  status: string;
  profilePhotoUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
}

export default function EmployeePortalPage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();
  const employeeId = user?.id ? parseInt(user.id, 10) : 0;

  useEffect(() => {
    if (!employeeId) return;
    apiFetch(`/api/employee/profile?employeeId=${employeeId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, [employeeId]);

  const quickLinks = [
    { label: 'Edit Profile', href: '/employee/profile/edit', icon: PencilSquareIcon, color: 'text-blue-600 bg-blue-50' },
    { label: 'My Documents', href: '/employee/documents', icon: DocumentTextIcon, color: 'text-green-600 bg-green-50' },
    { label: 'Training', href: '/training/courses', icon: AcademicCapIcon, color: 'text-purple-600 bg-purple-50' },
    { label: 'Certifications', href: '/training/certifications', icon: ShieldCheckIcon, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <FeatureGate feature="EMPLOYEE_SELF_SERVICE">
      <PageWrapper
        title="Employee Self-Service Portal"
        subtitle="View and manage your employee information"
      >
        {loading ? (
          <InlineLoading message="Loading profile..." />
        ) : !profile ? (
          <div className="text-center py-12 text-muted-foreground enterprise-card">
            Unable to load profile. Please try again.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickLinks.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex items-center gap-3 enterprise-card p-4 hover:shadow-md transition-shadow">
                  <div className={`p-2 rounded-lg ${link.color}`}>
                    <link.icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Profile Card */}
            <div className="enterprise-card p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                  {profile.profilePhotoUrl ? (
                    <img src={profile.profilePhotoUrl} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <UserCircleIcon className="w-12 h-12" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {profile.title ? `${profile.title} ` : ''}{profile.firstName} {profile.lastName}
                  </h2>
                  {profile.preferredName && (
                    <p className="text-sm text-muted-foreground">Preferred: {profile.preferredName}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{profile.jobTitle || 'No job title'}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{profile.employeeNumber}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {profile.status}
                    </span>
                  </div>
                </div>
                <Link href="/employee/profile/edit"
                  className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50">
                  Edit
                </Link>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Employment Info */}
              <div className="enterprise-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Employment Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Department</dt>
                    <dd className="text-foreground font-medium">{profile.department || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Division</dt>
                    <dd className="text-foreground font-medium">{profile.division || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Job Grade</dt>
                    <dd className="text-foreground font-medium">{profile.jobGrade || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Employment Type</dt>
                    <dd className="text-foreground font-medium">{profile.employmentType || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Hire Date</dt>
                    <dd className="text-foreground font-medium">{profile.hireDate}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="text-foreground font-medium">{profile.location || '-'}</dd>
                  </div>
                </dl>
              </div>

              {/* Contact Info */}
              <div className="enterprise-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Contact Information</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Work Email</dt>
                    <dd className="text-foreground font-medium">{profile.email}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Personal Email</dt>
                    <dd className="text-foreground font-medium">{profile.personalEmail || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="text-foreground font-medium">{profile.phone || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Mobile</dt>
                    <dd className="text-foreground font-medium">{profile.mobilePhone || '-'}</dd>
                  </div>
                </dl>
              </div>

              {/* Emergency Contact */}
              <div className="enterprise-card p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Emergency Contact</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Name</dt>
                    <dd className="text-foreground font-medium">{profile.emergencyContactName || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="text-foreground font-medium">{profile.emergencyContactPhone || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Relationship</dt>
                    <dd className="text-foreground font-medium">{profile.emergencyContactRelationship || '-'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
