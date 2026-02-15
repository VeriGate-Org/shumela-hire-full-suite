import { UserRole } from '@/contexts/AuthContext';

export const rolePermissions: Record<UserRole, string[]> = {
  ADMIN: [
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics', 'view_reports',
    'manage_permissions', 'view_audit_logs',
    'view_training', 'manage_integrations',
  ],
  EXECUTIVE: [
    'view_dashboard', 'view_applications', 'view_internal_jobs',
    'manage_workflow', 'manage_offers',
    'view_analytics', 'view_reports',
  ],
  HR_MANAGER: [
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics', 'view_reports',
    'view_training',
  ],
  HIRING_MANAGER: [
    'view_dashboard', 'manage_jobs', 'view_applications',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow',
    'view_analytics', 'view_recruiter_analytics',
  ],
  RECRUITER: [
    'view_dashboard', 'manage_jobs', 'view_applications', 'view_applicants',
    'manage_pipeline', 'view_interviews', 'manage_offers', 'view_internal_jobs',
    'manage_applications', 'manage_workflow', 'view_salary_data',
    'view_analytics', 'view_recruiter_analytics',
  ],
  INTERVIEWER: [
    'view_dashboard', 'view_interviews', 'view_internal_jobs',
  ],
  EMPLOYEE: [
    'view_dashboard', 'view_internal_jobs', 'view_own_profile', 'view_training',
  ],
  APPLICANT: [
    'browse_jobs', 'manage_own_applications', 'view_own_profile',
    'view_own_interviews', 'view_own_offers', 'view_internal_jobs', 'send_messages',
  ],
};
