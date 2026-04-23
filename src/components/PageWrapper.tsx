'use client';

import React, { ReactNode } from 'react';
import ModernLayout from '@/components/ModernLayout';

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
  return (
    <ModernLayout
      title={title}
      subtitle={subtitle}
      actions={actions}
    >
      {children}
    </ModernLayout>
  );
}
