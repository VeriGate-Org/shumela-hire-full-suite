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
  ],
  LINE_MANAGER: [
    'view_dashboard', 'view_internal_jobs', 'view_own_profile',
    'view_training', 'view_performance',
    // Manager-specific
    'manage_leave', 'view_attendance', 'manage_attendance',
    // Self-service
    'manage_documents',
  ],
  HIRING_MANAGER: [
    'view_dashboard', 'manage_jobs', 'view_applications',
    'manage_pipeline', 'view_interviews', 'view_internal_jobs',
    'view_analytics', 'manage_requisitions',
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
    'view_dashboard', 'view_internal_jobs', 'view_own_profile', 'view_training',
    // Self-service access
    'manage_leave', 'view_attendance', 'manage_documents',
    'view_performance',
  ],
  APPLICANT: [
    'browse_jobs', 'manage_own_applications', 'view_own_profile',
    'view_own_interviews', 'view_own_offers', 'view_internal_jobs',
  ],
};
