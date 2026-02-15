'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { rolePermissions } from '@/config/permissions';

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
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (permission: string) => boolean;
  isAuthenticated: boolean;
  token: string | null;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedToken = sessionStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
      // In a real implementation, you would decode the JWT to get user info
      // For now, we'll use mock data if a token exists
      setUser({
        id: '1',
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'ADMIN',
        permissions: rolePermissions['ADMIN'],
      });
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    const storedToken = sessionStorage.getItem('jwt_token');
    if (storedToken) {
      setToken(storedToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('jwt_token');
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      setUser({ ...user, role, permissions: rolePermissions[role] });
    }
  };

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, hasPermission, isAuthenticated, token }}>
      {children}
    </AuthContext.Provider>
  );
};