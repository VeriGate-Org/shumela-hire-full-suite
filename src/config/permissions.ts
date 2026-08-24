import { UserRole } from '@/contexts/AuthContext';

export const rolePermissions: Record<UserRole, string[]> = {
  PLATFORM_OWNER: [
    'view_dashboard',
    'platform_admin', 'manage_features', 'manage_tenants',
  ],
  ADMIN: [
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics', 'view_reports',
    'manage_permissions', 'view_audit_logs', 'manage_departments',
    'view_training', 'manage_training', 'manage_integrations', 'manage_requisitions',
    // HR module permissions
    'manage_leave', 'view_attendance', 'manage_attendance', 'manage_documents',
    'view_performance', 'manage_performance', 'manage_engagement',
    'manage_compliance', 'view_own_profile',
    // Company documents
    'view_company_documents', 'manage_company_documents',
    // New permissions
    'custom_fields:manage', 'manage_onboarding',
    'feed:view', 'feed:post', 'feed:moderate',
  ],
  EXECUTIVE: [
    'view_dashboard', 'view_internal_jobs',
    'view_analytics', 'view_reports', 'manage_requisitions',
    // Read-only HR analytics access
    'view_performance', 'view_training',
  ],
  HR_MANAGER: [
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics', 'view_reports',
    'view_training', 'manage_training', 'manage_departments', 'manage_integrations', 'manage_requisitions',
    // HR module permissions
    'manage_leave', 'view_attendance', 'manage_attendance', 'manage_documents',
    'view_performance', 'manage_performance', 'manage_engagement',
    'manage_compliance', 'view_own_profile',
    // Company documents
    'view_company_documents', 'manage_company_documents',
    // New permissions
    'custom_fields:manage', 'manage_onboarding',
    'feed:view', 'feed:post', 'feed:moderate',
  ],
  LINE_MANAGER: [
    'view_dashboard', 'view_internal_jobs', 'view_own_profile',
    'view_training', 'view_performance',
    // Manager-specific
    'manage_leave', 'view_attendance', 'manage_attendance',
    // Self-service
    'manage_documents', 'view_company_documents',
    'manage_onboarding', 'feed:view', 'feed:post',
  ],
  HIRING_MANAGER: [
    'view_dashboard', 'manage_jobs', 'view_applications',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'view_analytics', 'manage_requisitions',
    // Reports: a hiring manager runs and reads recruitment reports on their own
    // vacancies. Granted alongside ReportingController, which class-level
    // restricted /api/reports to ADMIN/HR_MANAGER/EXECUTIVE — without that
    // change this permission would only have produced a nav entry that 403s.
    // Report EXPORT is deliberately not granted: ReportExportController remains
    // ADMIN/HR_MANAGER, and the 'report-export' nav entry is pinned to match.
    'view_reports',
    // Applicants and Application Management were ADMIN/HR_MANAGER/RECRUITER
    // only — Hiring Managers could already reach every backend endpoint
    // these pages need to view the pipeline (search/statistics/attention/
    // filter-options on ApplicationManagementController, and /api/applicants
    // itself, all already allow HIRING_MANAGER) but had no nav entry or
    // page-level permission to get there.
    'view_applicants', 'manage_applications',
  ],
  RECRUITER: [
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'view_internal_jobs',
    'manage_applications', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics',
  ],
  INTERVIEWER: [
    'view_dashboard', 'view_interviews', 'view_internal_jobs',
  ],
  EMPLOYEE: [
    'view_dashboard', 'view_internal_jobs', 'view_own_profile',
    // Self-service access (employees use /employee/* pages, not admin pages)
    'manage_leave', 'view_attendance', 'manage_documents', 'view_company_documents',
    'feed:view', 'feed:post',
    // Same job-search self-service Applicants get — Browse Jobs, My
    // Applications, Interview Schedule, My Offers — since an Employee can
    // apply for internal or external roles just like an Applicant can.
    'browse_jobs', 'manage_own_applications', 'view_own_interviews', 'view_own_offers',
  ],
  APPLICANT: [
    'browse_jobs', 'manage_own_applications', 'view_own_profile',
    'view_own_interviews', 'view_own_offers', 'view_internal_jobs',
  ],
};
