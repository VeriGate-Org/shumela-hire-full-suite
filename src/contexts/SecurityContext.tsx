'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from './AuthContext';

/**
 * Security Context for authentication and authorization
 */

interface User {
  id: number;
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
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  refreshToken: () => Promise<boolean>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  enableTwoFactor: () => Promise<string>;
  verifyTwoFactor: (code: string) => Promise<boolean>;
}

interface LoginCredentials {
  usernameOrEmail: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

/**
 * Security Provider Component
 */
export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Validate token with backend
          const isValid = await validateToken(storedToken);
          if (!isValid) {
            clearAuth();
          }
        }
      } catch (error) {
        console.error('Authentication initialization error:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Validate token with backend
   */
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  };

  /**
   * Clear authentication data
   */
  const clearAuth = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('refresh_token');
  };

  /**
   * Login user
   */
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const data = await response.json();
        
        const userData: User = {
          id: data.id,
          username: data.username,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          authorities: data.authorities,
          twoFactorEnabled: data.twoFactorEnabled,
          emailVerified: data.emailVerified,
        };

        setToken(data.token);
        setUser(userData);

        // Store in localStorage
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('refresh_token', data.refreshToken);

        return true;
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  /**
   * Check if user has specific permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!user || !user.authorities) return false;
    return user.authorities.includes(permission);
  };

  /**
   * Check if user has specific role
   */
  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role || hasPermission(`ROLE_${role}`);
  };

  /**
   * Refresh authentication token
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token');
      if (!refreshTokenValue) {
        clearAuth();
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.accessToken);
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);
        return true;
      } else {
        clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuth();
      return false;
    }
  };

  /**
   * Update user password
   */
  const updatePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      return response.ok;
    } catch (error) {
      console.error('Password update error:', error);
      return false;
    }
  };

  /**
   * Enable two-factor authentication
   */
  const enableTwoFactor = async (): Promise<string> => {
    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.qrCode;
      }
      return '';
    } catch (error) {
      console.error('2FA enable error:', error);
      return '';
    }
  };

  /**
   * Verify two-factor authentication code
   */
  const verifyTwoFactor = async (code: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok && user) {
        setUser({ ...user, twoFactorEnabled: true });
        localStorage.setItem('auth_user', JSON.stringify({ ...user, twoFactorEnabled: true }));
      }

      return response.ok;
    } catch (error) {
      console.error('2FA verify error:', error);
      return false;
    }
  };

  const contextValue: SecurityContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    hasPermission,
    hasRole,
    refreshToken,
    updatePassword,
    enableTwoFactor,
    verifyTwoFactor,
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Hook to use security context
 */
export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};

/**
 * Higher-order component for route protection
 */
export const withAuth = (WrappedComponent: React.ComponentType, requiredRole?: string) => {
  return function AuthComponent(props: any) {
    const { isAuthenticated, hasRole, isLoading } = useSecurity();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push('/login');
        } else if (requiredRole && !hasRole(requiredRole)) {
          router.push('/unauthorized');
        }
      }
    }, [isAuthenticated, hasRole, requiredRole, isLoading, router]);

    if (isLoading) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated || (requiredRole && !hasRole(requiredRole))) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};
