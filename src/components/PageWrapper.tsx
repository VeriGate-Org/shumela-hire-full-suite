'use client';

import React, { ReactNode } from 'react';
import ModernLayout from '@/components/ModernLayout';
import { useAuth } from '@/contexts/AuthContext';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageWrapper({
  children,
  title,
  subtitle,
  actions,
}: PageWrapperProps) {
  const { user } = useAuth();

  // Generate dynamic title and subtitle if not provided
  const defaultTitle = title || 'Dashboard';
  const defaultSubtitle = subtitle || `Welcome back${user?.name ? `, ${user.name}` : ''}! Here's your overview.`;

  return (
    <ModernLayout
      title={defaultTitle}
      subtitle={defaultSubtitle}
      actions={actions}
    >
      {children}
    </ModernLayout>
  );
}
