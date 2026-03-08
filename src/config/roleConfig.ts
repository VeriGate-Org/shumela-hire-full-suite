import { UserRole } from '../contexts/AuthContext';

export interface RoleConfig {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  welcomeMessage: string;
  description: string;
}

export const roleConfigurations: Record<UserRole, RoleConfig> = {
  PLATFORM_OWNER: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '🔧',
    welcomeMessage: 'Platform Administration',
    description: 'Manage tenants, feature entitlements, and platform-wide configuration.',
  },
  ADMIN: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '👑',
    welcomeMessage: 'System Administration Dashboard',
    description: 'Manage users, system settings, and oversee all recruitment activities.',
  },
  EXECUTIVE: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '🏛️',
    welcomeMessage: 'Executive Dashboard',
    description: 'Strategic oversight of organizational hiring and high-level approvals.',
  },
  HR_MANAGER: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '👔',
    welcomeMessage: 'Human Resources Dashboard',
    description: 'Manage employee lifecycle, policies, and recruitment coordination.',
  },
  LINE_MANAGER: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '👥',
    welcomeMessage: 'Line Manager Dashboard',
    description: 'Manage your team, approve leave, and oversee performance reviews.',
  },
  HIRING_MANAGER: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '🎯',
    welcomeMessage: 'Hiring Manager Dashboard',
    description: 'Oversee hiring for your team and manage interview processes.',
  },
  RECRUITER: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '🔍',
    welcomeMessage: 'Recruiter Dashboard',
    description: 'Source, screen, and manage candidates throughout the hiring process.',
  },
  INTERVIEWER: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '🎤',
    welcomeMessage: 'Interviewer Dashboard',
    description: 'Conduct interviews, provide feedback, and evaluate candidates.',
  },
  EMPLOYEE: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '👤',
    welcomeMessage: 'Employee Dashboard',
    description: 'Access internal opportunities, training, and profile management.',
  },
  APPLICANT: {
    primaryColor: 'bg-violet-600',
    secondaryColor: 'bg-gold-50',
    logo: '👤',
    welcomeMessage: 'Applicant Portal',
    description: 'Track your applications and manage your job search journey.',
  },
};
