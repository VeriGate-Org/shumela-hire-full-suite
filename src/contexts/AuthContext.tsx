'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { signIn, signOut, signInWithRedirect, fetchAuthSession, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { rolePermissions } from '@/config/permissions';
import { isCognitoConfigured, isOAuthConfigured, configureAmplify } from '@/lib/amplify-config';

export type UserRole =
  | 'ADMIN'
  | 'EXECUTIVE'
  | 'HR_MANAGER'
  | 'HIRING_MANAGER'
  | 'RECRUITER'
  | 'INTERVIEWER'
  | 'EMPLOYEE'
  | 'APPLICANT';

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
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
  'ADMIN', 'EXECUTIVE', 'HR_MANAGER', 'HIRING_MANAGER',
  'RECRUITER', 'INTERVIEWER', 'EMPLOYEE', 'APPLICANT',
];

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
  tenantId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginWithLinkedIn: () => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
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

  // Check for existing Cognito session on mount
  useEffect(() => {
    if (isCognitoConfigured) {
      checkCognitoSession();
    } else {
      checkMockSession();
    }
  }, []);

  // Listen for OAuth redirect completion (LinkedIn sign-in)
  useEffect(() => {
    if (!isCognitoConfigured) return;

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        checkCognitoSession();
      }
      if (payload.event === 'signInWithRedirect_failure') {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  async function checkCognitoSession() {
    try {
      const authUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;

      if (idToken) {
        const groups = (idToken.payload['cognito:groups'] as string[] | undefined) || [];
        const role = extractRoleFromGroups(groups);
        const attrs = await fetchUserAttributes();

        const tenantId = (idToken.payload['custom:tenant_id'] as string) || undefined;
        setUser({
          id: authUser.userId,
          name: attrs.name || attrs.email || authUser.username,
          email: attrs.email || '',
          role,
          permissions: rolePermissions[role],
          tenantId,
        });
        setToken(idToken.toString());
      }
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
    if (result.isSignedIn) {
      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken;
      const authUser = await getCurrentUser();

      if (idToken) {
        const groups = (idToken.payload['cognito:groups'] as string[] | undefined) || [];
        const role = extractRoleFromGroups(groups);
        const attrs = await fetchUserAttributes();

        const tenantId = (idToken.payload['custom:tenant_id'] as string) || undefined;
        const userData: User = {
          id: authUser.userId,
          name: attrs.name || attrs.email || authUser.username,
          email: attrs.email || '',
          role,
          permissions: rolePermissions[role],
          tenantId,
        };
        setUser(userData);
        setToken(idToken.toString());
      }
    }
  }, []);

  const loginWithLinkedIn = useCallback(async () => {
    if (!isOAuthConfigured) {
      throw new Error('OAuth is not configured. Ensure NEXT_PUBLIC_COGNITO_DOMAIN is set.');
    }
    await signInWithRedirect({ provider: { custom: 'LinkedIn' } });
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
    }
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const updated = { ...user, role, permissions: rolePermissions[role] };
      setUser(updated);
      if (!isCognitoConfigured && typeof window !== 'undefined') {
        sessionStorage.setItem('mock_user', JSON.stringify(updated));
      }
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
      logout,
      switchRole,
      hasPermission,
      isAuthenticated,
      isLoading,
      token,
      getAccessToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
