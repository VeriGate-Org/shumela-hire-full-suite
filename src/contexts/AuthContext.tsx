'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { signIn, signOut, signInWithRedirect, confirmSignIn, fetchAuthSession, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { apiFetch } from '@/lib/api-fetch';
import { Hub } from 'aws-amplify/utils';
import { rolePermissions } from '@/config/permissions';
import { isCognitoConfigured, isOAuthConfigured, configureAmplify } from '@/lib/amplify-config';

export type UserRole =
  | 'PLATFORM_OWNER'
  | 'ADMIN'
  | 'EXECUTIVE'
  | 'HR_MANAGER'
  | 'HIRING_MANAGER'
  | 'RECRUITER'
  | 'INTERVIEWER'
  | 'EMPLOYEE'
  | 'APPLICANT';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  PLATFORM_OWNER: 'Platform Owner',
  ADMIN: 'Administrator',
  EXECUTIVE: 'Executive',
  HR_MANAGER: 'HR Manager',
  HIRING_MANAGER: 'Hiring Manager',
  RECRUITER: 'Recruiter',
  INTERVIEWER: 'Interviewer',
  EMPLOYEE: 'Employee',
  APPLICANT: 'Applicant',
};

export const ALL_ROLES: UserRole[] = [
  'PLATFORM_OWNER', 'ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'HIRING_MANAGER',
  'RECRUITER', 'INTERVIEWER', 'EMPLOYEE', 'APPLICANT',
];

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  originalRole?: UserRole;
  permissions: string[];
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  confirmNewPassword: (newPassword: string) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  pendingNewPasswordChallenge: boolean;
  token: string | null;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Initialize Amplify once
if (isCognitoConfigured) {
  configureAmplify();
}

function extractRoleFromGroups(groups: string[]): UserRole {
  const validRoles = new Set(ALL_ROLES);
  for (const group of groups) {
    const upper = group.toUpperCase() as UserRole;
    if (validRoles.has(upper)) {
      return upper;
    }
  }
  return 'APPLICANT';
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingNewPasswordChallenge, setPendingNewPasswordChallenge] = useState(false);

  // Listen for OAuth redirect completion AND check existing session on mount.
  // Hub listener must be registered BEFORE the initial session check to avoid
  // missing the signInWithRedirect event that fires when Amplify exchanges the
  // authorization code from the URL.
  useEffect(() => {
    if (!isCognitoConfigured) {
      checkMockSession();
      return;
    }

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        checkCognitoSession();
      }
      if (payload.event === 'signInWithRedirect_failure') {
        console.error('OAuth redirect failed:', payload.data);
        setIsLoading(false);
      }
    });

    // If the URL contains an OAuth authorization code, Amplify will exchange it
    // automatically. Wait briefly for the exchange to complete before checking
    // the session, so we don't prematurely conclude there's no session.
    const hasOAuthCode = typeof window !== 'undefined' &&
      (window.location.search.includes('code=') || window.location.hash.includes('access_token'));

    if (hasOAuthCode) {
      // Amplify processes the code asynchronously; the Hub event will trigger
      // checkCognitoSession. Set a fallback timeout in case the event doesn't fire.
      const fallbackTimer = setTimeout(() => {
        checkCognitoSession();
      }, 3000);
      return () => {
        unsubscribe();
        clearTimeout(fallbackTimer);
      };
    }

    checkCognitoSession();

    return unsubscribe;
  }, []);

  async function refreshSessionState() {
    const authUser = await getCurrentUser();
    const session = await fetchAuthSession();
    const idToken = session.tokens?.idToken;

    if (idToken) {
      const groups = (idToken.payload['cognito:groups'] as string[] | undefined) || [];
      const role = extractRoleFromGroups(groups);
      const attrs = await fetchUserAttributes();

      const tenantId = (idToken.payload['custom:tenant_id'] as string) || undefined;
      const tokenStr = idToken.toString();
      setToken(tokenStr);

      // Fetch the numeric DB user ID from the backend
      let dbUserId: string = authUser.userId;
      try {
        const meRes = await apiFetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.id != null) {
            dbUserId = String(meData.id);
          }
        }
      } catch {
        // Fall back to Cognito UUID if backend is unreachable
      }

      const userData: User = {
        id: dbUserId,
        name: attrs.name || attrs.email || authUser.username,
        email: attrs.email || '',
        role,
        permissions: rolePermissions[role],
        tenantId,
      };
      setUser(userData);
    }
  }

  async function checkCognitoSession() {
    try {
      await refreshSessionState();
    } catch {
      // No active session
    } finally {
      setIsLoading(false);
    }
  }

  function checkMockSession() {
    const storedToken = typeof window !== 'undefined' ? sessionStorage.getItem('jwt_token') : null;
    const storedUser = typeof window !== 'undefined' ? sessionStorage.getItem('mock_user') : null;
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsed);
      } catch {
        // Invalid stored data
      }
    }
    setIsLoading(false);
  }

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    if (!isCognitoConfigured) {
      throw new Error('Cognito is not configured. Use mock login in development.');
    }

    // Clear any stale auth state before attempting sign-in
    try { await signOut(); } catch { /* no previous session */ }

    const result = await signIn({
      username: email.trim().toLowerCase(),
      password,
      options: { authFlowType: 'USER_PASSWORD_AUTH' },
    });

    if (result.nextStep?.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      setPendingNewPasswordChallenge(true);
      return;
    }

    if (result.isSignedIn) {
      await refreshSessionState();
    }
  }, []);

  const loginWithLinkedIn = useCallback(async () => {
    if (!isOAuthConfigured) {
      throw new Error('OAuth is not configured. Ensure NEXT_PUBLIC_COGNITO_DOMAIN is set.');
    }
    await signInWithRedirect({ provider: { custom: 'LinkedIn' } });
  }, []);

  const confirmNewPassword = useCallback(async (newPassword: string) => {
    const result = await confirmSignIn({ challengeResponse: newPassword });
    if (result.isSignedIn) {
      setPendingNewPasswordChallenge(false);
      await refreshSessionState();
    }
  }, []);

  // Mock login for dev
  const login = useCallback((userData: User) => {
    setUser(userData);
    const mockToken = 'dev-token-' + Date.now();
    setToken(mockToken);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('jwt_token', mockToken);
      sessionStorage.setItem('dev_user', JSON.stringify(userData));
    }
  }, []);

  const logout = useCallback(async () => {
    if (isCognitoConfigured) {
      try {
        await signOut();
      } catch {
        // Ignore sign-out errors
      }
    }
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('jwt_token');
      sessionStorage.removeItem('mock_user');
      sessionStorage.removeItem('dev_user');
    }
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const effectiveOriginalRole = user.originalRole || user.role;
      if (effectiveOriginalRole !== 'ADMIN') return;

      const updated = {
        ...user,
        role,
        permissions: rolePermissions[role],
        originalRole: user.originalRole || user.role,
      };
      setUser(updated);
      if (!isCognitoConfigured && typeof window !== 'undefined') {
        sessionStorage.setItem('mock_user', JSON.stringify(updated));
      }

      // Log role switch (non-blocking)
      import('@/services/auditLogService').then(({ auditLogService }) => {
        auditLogService.logRoleSwitch(user.id, user.role, role).catch(() => {});
      });
    }
  }, [user]);

  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  }, [user]);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (isCognitoConfigured) {
      try {
        const session = await fetchAuthSession({ forceRefresh: false });
        const accessToken = session.tokens?.accessToken?.toString() || null;
        if (accessToken) {
          setToken(accessToken);
        }
        return accessToken;
      } catch {
        return null;
      }
    }
    return token;
  }, [token]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginWithCredentials,
      loginWithLinkedIn,
      confirmNewPassword,
      logout,
      switchRole,
      hasPermission,
      isAuthenticated,
      isLoading,
      pendingNewPasswordChallenge,
      token,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
