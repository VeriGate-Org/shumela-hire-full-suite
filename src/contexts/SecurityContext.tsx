'use client';

import React, { createContext, useContext } from 'react';
import { useAuth, UserRole } from './AuthContext';

/**
 * Security Context — thin wrapper around AuthContext for backwards compatibility.
 */

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  authorities: string[];
  twoFactorEnabled: boolean;
  emailVerified: boolean;
}

interface SecurityContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { usernameOrEmail: string; password: string }) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshToken: () => Promise<boolean>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  enableTwoFactor: () => Promise<string>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  const user: User | null = auth.user ? {
    id: auth.user.id || '',
    username: auth.user.email,
    email: auth.user.email,
    firstName: auth.user.name.split(' ')[0] || '',
    lastName: auth.user.name.split(' ').slice(1).join(' ') || '',
    role: auth.user.role,
    authorities: auth.user.permissions,
    twoFactorEnabled: false,
    emailVerified: true,
  } : null;

  const login = async (credentials: { usernameOrEmail: string; password: string }): Promise<boolean> => {
    try {
      await auth.loginWithCredentials(credentials.usernameOrEmail, credentials.password);
      return true;
    } catch {
      return false;
    }
  };

  const hasRole = (role: string): boolean => {
    return auth.user?.role === role;
  };

  const contextValue: SecurityContextType = {
    user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    login,
    logout: auth.logout,
    hasPermission: auth.hasPermission,
    hasRole,
    refreshToken: async () => {
      const token = await auth.getAccessToken();
      return !!token;
    },
    updatePassword: async () => false,
    enableTwoFactor: async () => '',
    verifyTwoFactor: async () => false,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

export const withAuth = (WrappedComponent: React.ComponentType, _requiredRole?: string) => {
  return function AuthComponent(props: Record<string, unknown>) {
    return <WrappedComponent {...props} />;
  };
};
