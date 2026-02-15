'use client';

import React from 'react';
import Link from 'next/link';
import { ComponentType, SVGProps } from 'react';

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface EmptyStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  icon: HeroIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center py-12 px-4">
      <Icon className="w-12 h-12 text-gray-300 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-4">{description}</p>
      {action && (
        action.href ? (
          <Link
            href={action.href}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
          >
            {action.label}
          </Link>
        ) : action.onClick ? (
          <button
            onClick={action.onClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-md hover:bg-violet-700"
          >
            {action.label}
          </button>
        ) : null
      )}
    </div>
  );
}
