'use client';

import React, { useState } from 'react';
import { useAuth, ROLE_DISPLAY_NAMES } from '@/contexts/AuthContext';
import { rolePermissions } from '@/config/permissions';
import { useRouter } from 'next/navigation';

interface OnboardingWizardProps {
  companyName?: string;
  onComplete?: () => void;
}

const STEPS = [
  { label: 'Welcome', skippable: false },
  { label: 'Profile', skippable: true },
  { label: 'Role', skippable: false },
  { label: 'Orientation', skippable: true },
  { label: 'Complete', skippable: false },
];

const FEATURE_CATALOG: Record<string, { title: string; description: string; href: string }> = {
  view_dashboard: {
    title: 'Dashboard',
    description: 'Your personalized overview with key metrics, tasks, and activity at a glance.',
    href: '/dashboard',
  },
  manage_jobs: {
    title: 'Job Management',
    description: 'Create, edit, and publish job postings across internal and external boards.',
    href: '/job-postings',
  },
  view_applications: {
    title: 'Applications',
    description: 'Review and manage incoming candidate applications with filtering and sorting.',
    href: '/applications',
  },
  view_applicants: {
    title: 'Applicant Profiles',
    description: 'Access detailed candidate profiles, resumes, and communication history.',
    href: '/applicants',
  },
  manage_pipeline: {
    title: 'Hiring Pipeline',
    description: 'Visualize and manage candidates through each stage of the recruitment funnel.',
    href: '/pipeline',
  },
  view_interviews: {
    title: 'Interviews',
    description: 'Schedule, track, and manage interviews with integrated calendar support.',
    href: '/interviews',
  },
  manage_offers: {
    title: 'Offer Management',
    description: 'Draft, review, and send employment offers with approval workflows.',
    href: '/offers',
  },
  view_analytics: {
    title: 'Analytics',
    description: 'Gain insights into recruitment performance with charts, trends, and reports.',
    href: '/analytics',
  },
  view_reports: {
    title: 'Reports',
    description: 'Generate and export detailed recruitment and compliance reports.',
    href: '/reports',
  },
  view_training: {
    title: 'Training',
    description: 'Access training materials and development resources for your role.',
    href: '/training',
  },
  manage_integrations: {
    title: 'Integrations',
    description: 'Connect ShumelaHire with external tools, job boards, and HR systems.',
    href: '/integrations',
  },
  view_internal_jobs: {
    title: 'Internal Opportunities',
    description: 'Browse and apply for open positions within the organization.',
    href: '/jobs',
  },
  browse_jobs: {
    title: 'Browse Jobs',
    description: 'Search and filter available positions that match your skills and interests.',
    href: '/jobs',
  },
  manage_own_applications: {
    title: 'My Applications',
    description: 'Track the status and progress of your submitted applications.',
    href: '/applications',
  },
  view_own_profile: {
    title: 'My Profile',
    description: 'Manage your personal information, resume, and account settings.',
    href: '/dashboard',
  },
  view_own_interviews: {
    title: 'My Interviews',
    description: 'View upcoming interview schedules and preparation materials.',
    href: '/interviews',
  },
  view_own_offers: {
    title: 'My Offers',
    description: 'Review and respond to employment offers you have received.',
    href: '/offers',
  },
  view_salary_data: {
    title: 'Salary Insights',
    description: 'Access salary benchmarking data and compensation recommendations.',
    href: '/salary-recommendations',
  },
  manage_workflow: {
    title: 'Workflows',
    description: 'Configure and manage approval workflows for recruitment processes.',
    href: '/workflow',
  },
  manage_applications: {
    title: 'Application Management',
    description: 'Bulk actions, status updates, and advanced management for all applications.',
    href: '/applications',
  },
  view_recruiter_analytics: {
    title: 'Recruiter Analytics',
    description: 'Track recruiter productivity, pipeline velocity, and sourcing effectiveness.',
    href: '/analytics',
  },
  manage_permissions: {
    title: 'Permissions',
    description: 'Manage user roles, access levels, and system-wide security settings.',
    href: '/security',
  },
  view_audit_logs: {
    title: 'Audit Logs',
    description: 'Review a complete history of system actions for compliance and security.',
    href: '/security',
  },
  send_messages: {
    title: 'Messaging',
    description: 'Communicate directly with recruiters and hiring managers.',
    href: '/dashboard',
  },
};

// Permissions to highlight as "key features" per role (first 3-4 shown as highlighted)
const ROLE_HIGHLIGHTS: Record<string, string[]> = {
  ADMIN: ['view_dashboard', 'manage_jobs', 'view_analytics', 'manage_permissions'],
  EXECUTIVE: ['view_dashboard', 'view_analytics', 'view_reports', 'manage_offers'],
  HR_MANAGER: ['view_dashboard', 'manage_jobs', 'view_analytics', 'view_reports'],
  HIRING_MANAGER: ['view_dashboard', 'manage_jobs', 'manage_pipeline', 'view_interviews'],
  RECRUITER: ['view_dashboard', 'manage_jobs', 'manage_pipeline', 'view_applicants'],
  INTERVIEWER: ['view_dashboard', 'view_interviews', 'view_internal_jobs'],
  EMPLOYEE: ['view_dashboard', 'view_internal_jobs', 'view_own_profile', 'view_training'],
  APPLICANT: ['browse_jobs', 'manage_own_applications', 'view_own_interviews', 'view_own_offers'],
};

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'View Dashboard',
  manage_jobs: 'Manage Job Postings',
  view_applications: 'View Applications',
  view_applicants: 'View Applicant Profiles',
  manage_pipeline: 'Manage Hiring Pipeline',
  view_interviews: 'View Interviews',
  manage_offers: 'Manage Offers',
  view_internal_jobs: 'View Internal Opportunities',
  manage_applications: 'Manage Applications',
  manage_workflow: 'Manage Workflows',
  view_salary_data: 'View Salary Data',
  view_analytics: 'View Analytics',
  view_recruiter_analytics: 'View Recruiter Analytics',
  view_reports: 'View Reports',
  manage_permissions: 'Manage Permissions',
  view_audit_logs: 'View Audit Logs',
  view_training: 'Access Training',
  manage_integrations: 'Manage Integrations',
  browse_jobs: 'Browse Jobs',
  manage_own_applications: 'Manage Own Applications',
  view_own_profile: 'View Own Profile',
  view_own_interviews: 'View Own Interviews',
  view_own_offers: 'View Own Offers',
  send_messages: 'Send Messages',
};

export default function OnboardingWizard({ companyName = 'ShumelaHire', onComplete }: OnboardingWizardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Profile form state, pre-populated from user context
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
  });

  const role = user?.role || 'EMPLOYEE';
  const roleName = ROLE_DISPLAY_NAMES[role];
  const permissions = rolePermissions[role] || [];
  const highlights = ROLE_HIGHLIGHTS[role] || permissions.slice(0, 4);

  // Compute profile completion percentage
  const computeCompletion = (): number => {
    let filled = 0;
    let total = 3;
    if (profileData.name.trim()) filled++;
    if (profileData.email.trim()) filled++;
    if (profileData.phone.trim()) filled++;
    return Math.round((filled / total) * 100);
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      router.push('/dashboard');
    }
  };

  // Features available for the user's role
  const availableFeatures = permissions
    .filter((p) => FEATURE_CATALOG[p])
    .map((p) => ({ key: p, ...FEATURE_CATALOG[p] }));

  const highlightedFeatures = availableFeatures.filter((f) => highlights.includes(f.key));
  const otherFeatures = availableFeatures.filter((f) => !highlights.includes(f.key));

  // --- Step renderers ---

  const renderWelcome = () => (
    <div className="text-center py-8">
      <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-gold-100 grid place-items-center">
        <svg className="h-10 w-10 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
        Congratulations on joining {companyName}
      </h2>
      <p className="mt-3 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
        We are excited to have you on board. This quick setup will walk you through
        your profile, role, and the tools available to help you get started.
      </p>
      <p className="mt-6 text-xs text-gray-400 uppercase tracking-widest font-medium">
        {roleName}
      </p>
    </div>
  );

  const renderProfileCompletion = () => {
    const completion = computeCompletion();
    return (
      <div className="py-4">
        <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Complete Your Profile</h2>
        <p className="text-sm text-gray-500 mb-6">
          Verify and update the information carried over from your application.
        </p>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Profile Completion</span>
            <span className="text-xs font-bold text-gold-600">{completion}%</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-colors"
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-colors"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500 transition-colors"
              placeholder="Enter your phone number"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderRoleAssignment = () => (
    <div className="py-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">Your Role</h2>
      <p className="text-sm text-gray-500 mb-6">
        You have been assigned the following role. Here is what you can do.
      </p>

      {/* Role badge */}
      <div className="flex items-center gap-3 p-4 bg-gold-50 border border-violet-100 rounded-sm mb-6">
        <div className="h-10 w-10 rounded-sm bg-gold-500 grid place-items-center">
          <span className="text-violet-950 font-bold text-sm">{roleName.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{roleName}</p>
          <p className="text-xs text-gray-500">{permissions.length} permissions granted</p>
        </div>
      </div>

      {/* Permissions list */}
      <div className="mb-6">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {permissions.map((perm) => (
            <div key={perm} className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              <span>{PERMISSION_LABELS[perm] || perm}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard preview */}
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Dashboard Preview</h3>
        <div className="border border-gray-200 rounded-sm overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-2 text-[10px] text-gray-400 font-medium">ShumelaHire - {roleName} Dashboard</span>
            </div>
          </div>
          <div className="p-4 bg-white">
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-sm bg-gray-100 animate-pulse" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-24 rounded-sm bg-gray-100 animate-pulse" />
              <div className="h-24 rounded-sm bg-gray-100 animate-pulse" />
            </div>
            <p className="text-center text-[10px] text-gray-400 mt-3">
              Your personalized dashboard will display widgets relevant to the {roleName} role.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemOrientation = () => (
    <div className="py-4">
      <h2 className="text-lg font-bold text-gray-900 tracking-tight mb-1">System Orientation</h2>
      <p className="text-sm text-gray-500 mb-6">
        Here are the key features available to you. Highlighted items are the most relevant for your role.
      </p>

      {/* Highlighted features */}
      {highlightedFeatures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs font-medium text-gold-600 uppercase tracking-wider mb-3">Key Features</h3>
          <div className="space-y-3">
            {highlightedFeatures.map((feature) => (
              <div
                key={feature.key}
                className="flex items-start gap-3 p-3 bg-gold-50 border border-violet-100 rounded-sm"
              >
                <div className="mt-0.5 h-8 w-8 rounded-sm bg-gold-500 grid place-items-center flex-shrink-0">
                  <svg className="h-4 w-4 text-violet-950" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{feature.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{feature.description}</p>
                  <a
                    href={feature.href}
                    className="inline-block mt-1.5 text-xs font-medium text-gold-600 hover:text-gold-700 transition-colors"
                  >
                    Go to {feature.title} &rarr;
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other features */}
      {otherFeatures.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Also Available</h3>
          <div className="space-y-2">
            {otherFeatures.map((feature) => (
              <div
                key={feature.key}
                className="flex items-center justify-between gap-3 px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-sm"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">{feature.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{feature.description}</p>
                </div>
                <a
                  href={feature.href}
                  className="text-xs font-medium text-gray-400 hover:text-gold-600 transition-colors flex-shrink-0"
                >
                  Open &rarr;
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCompletion = () => (
    <div className="text-center py-8">
      <div className="mx-auto mb-6 h-20 w-20 rounded-2xl bg-green-100 grid place-items-center">
        <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
        You are all set
      </h2>
      <p className="mt-3 text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
        Your onboarding is complete. You can now access your {roleName} dashboard
        and start using all the tools available to you.
      </p>
      <button
        onClick={handleComplete}
        className="mt-8 inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-colors"
      >
        Go to Dashboard
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>
    </div>
  );

  const stepRenderers = [
    renderWelcome,
    renderProfileCompletion,
    renderRoleAssignment,
    renderSystemOrientation,
    renderCompletion,
  ];

  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;
  const currentStepConfig = STEPS[currentStep];

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            return (
              <React.Fragment key={step.label}>
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={`
                      h-9 w-9 rounded-full grid place-items-center text-sm font-semibold transition-all duration-300
                      ${isActive
                        ? 'bg-gold-500 text-violet-950 ring-4 ring-violet-100'
                        : isCompleted
                          ? 'bg-gold-500 text-violet-950'
                          : 'bg-gray-100 text-gray-400'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={`
                      mt-1.5 text-[10px] font-medium uppercase tracking-wider
                      ${isActive ? 'text-gold-600' : isCompleted ? 'text-gray-500' : 'text-gray-300'}
                    `}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connecting line */}
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-2 mt-[-18px]">
                    <div className="h-0.5 w-full rounded-full overflow-hidden bg-gray-100">
                      <div
                        className={`h-full bg-gold-500 transition-all duration-500 ease-out ${
                          index < currentStep ? 'w-full' : 'w-0'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Step content card */}
      <div className="bg-white border border-gray-200 rounded-sm shadow-sm p-6 sm:p-8">
        {stepRenderers[currentStep]()}
      </div>

      {/* Navigation buttons */}
      {!isLastStep && (
        <div className="mt-6 flex items-center justify-between">
          <div>
            {!isFirstStep && (
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500/40 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStepConfig.skippable && (
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 transition-colors"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
