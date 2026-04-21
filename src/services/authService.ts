import { isCognitoConfigured } from '@/lib/amplify-config';

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'EXECUTIVE' | 'HR_MANAGER' | 'HIRING_MANAGER' | 'RECRUITER' | 'INTERVIEWER' | 'EMPLOYEE' | 'APPLICANT';
  department: string;
  permissions: string[];
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenResponse {
  token: string;
  expiresIn: number;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  avatar?: File;
}

// Authentication Events
export type AuthEvent =
  | { type: 'LOGIN_SUCCESS'; user: AuthUser }
  | { type: 'LOGIN_FAILURE'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'TOKEN_REFRESH_SUCCESS'; token: string }
  | { type: 'TOKEN_REFRESH_FAILURE'; error: string }
  | { type: 'SESSION_EXPIRED' }
  | { type: 'PROFILE_UPDATED'; user: AuthUser };

class AuthService {
  private static instance: AuthService;
  private eventListeners: ((event: AuthEvent) => void)[] = [];

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  addEventListener(callback: (event: AuthEvent) => void): () => void {
    this.eventListeners.push(callback);
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: AuthEvent): void {
    this.eventListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in auth event listener:', error);
      }
    });
  }

  async getToken(): Promise<string | null> {
    if (isCognitoConfigured) {
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession({ forceRefresh: false });
        return session.tokens?.accessToken?.toString() || null;
      } catch {
        return null;
      }
    }
    // Dev fallback
    return typeof window !== 'undefined' ? sessionStorage.getItem('jwt_token') : null;
  }

  isAuthenticated(): boolean {
    // In Cognito mode, rely on AuthContext. This is a best-effort sync check.
    if (typeof window !== 'undefined') {
      return !!(sessionStorage.getItem('jwt_token') || sessionStorage.getItem('mock_user'));
    }
    return false;
  }

  isTokenExpired(): boolean {
    return !this.isAuthenticated();
  }

  getCurrentUser(): AuthUser | null {
    return null; // Use AuthContext instead
  }

  async logout(): Promise<void> {
    if (isCognitoConfigured) {
      try {
        const { signOut } = await import('aws-amplify/auth');
        await signOut();
      } catch {
        // Ignore
      }
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('jwt_token');
      sessionStorage.removeItem('mock_user');
      sessionStorage.removeItem('dev_user');
      localStorage.removeItem('auth_token');
      try {
        const { webSocketService } = await import('@/services/webSocketService');
        webSocketService.disconnect();
      } catch {
        // Ignore if WebSocket service is unavailable
      }
    }
    this.emitEvent({ type: 'LOGOUT' });
  }

  hasPermission(_permission: string): boolean {
    return false; // Use AuthContext.hasPermission instead
  }

  hasAnyPermission(_permissions: string[]): boolean {
    return false;
  }

  hasAllPermissions(_permissions: string[]): boolean {
    return false;
  }

  isAdmin(): boolean {
    return false;
  }

  isRecruiter(): boolean {
    return false;
  }

  isHiringManager(): boolean {
    return false;
  }

  isInterviewer(): boolean {
    return false;
  }

  getUserDepartment(): string | undefined {
    return undefined;
  }

  async refreshTokens(): Promise<string> {
    if (isCognitoConfigured) {
      try {
        const { fetchAuthSession } = await import('aws-amplify/auth');
        const session = await fetchAuthSession({ forceRefresh: true });
        const token = session.tokens?.accessToken?.toString();
        if (token) {
          this.emitEvent({ type: 'TOKEN_REFRESH_SUCCESS', token });
          return token;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Token refresh failed';
        this.emitEvent({ type: 'TOKEN_REFRESH_FAILURE', error: message });
      }
    }
    throw new Error('Token refresh not available');
  }

  getReconnectAttempts(): number {
    return 0;
  }

  getConnectionStatus(): string {
    return 'disconnected';
  }
}

// Permission constants
export const PERMISSIONS = {
  CREATE_JOBS: 'jobs.create',
  EDIT_JOBS: 'jobs.edit',
  DELETE_JOBS: 'jobs.delete',
  PUBLISH_JOBS: 'jobs.publish',
  VIEW_APPLICATIONS: 'applications.view',
  EDIT_APPLICATIONS: 'applications.edit',
  DELETE_APPLICATIONS: 'applications.delete',
  EXPORT_APPLICATIONS: 'applications.export',
  SCHEDULE_INTERVIEWS: 'interviews.schedule',
  CONDUCT_INTERVIEWS: 'interviews.conduct',
  VIEW_ALL_INTERVIEWS: 'interviews.view_all',
  CREATE_OFFERS: 'offers.create',
  APPROVE_OFFERS: 'offers.approve',
  VIEW_OFFER_DETAILS: 'offers.view_details',
  VIEW_ANALYTICS: 'analytics.view',
  EXPORT_ANALYTICS: 'analytics.export',
  VIEW_ADVANCED_ANALYTICS: 'analytics.advanced',
  CREATE_WORKFLOWS: 'workflows.create',
  EDIT_WORKFLOWS: 'workflows.edit',
  EXECUTE_WORKFLOWS: 'workflows.execute',
  VIEW_WORKFLOW_LOGS: 'workflows.view_logs',
  MANAGE_USERS: 'users.manage',
  VIEW_USER_ACTIVITY: 'users.view_activity',
  ADMIN_ACCESS: 'system.admin',
  VIEW_AUDIT_LOGS: 'system.audit_logs',
  MANAGE_SETTINGS: 'system.settings',
} as const;

export const authService = AuthService.getInstance();

export const initializeAuth = () => {
  // Cognito handles token refresh automatically via Amplify.
  // This function exists for backwards compatibility with the services index.
};

export default authService;
