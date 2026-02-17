'use client';

import React from 'react';
import Link from 'next/link';
import { ComponentType, SVGProps } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

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
  const buttonClasses =
    'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-[#05527E] text-white hover:bg-[#044668]';

  return (
    <div role="status" aria-live="polite" className="bg-white rounded-sm shadow border border-gray-200 flex flex-col items-center justify-center py-16 px-4">
      <Icon className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
      {action && (
        action.href ? (
          <Link href={action.href} className={buttonClasses}>
            <PlusIcon className="w-4 h-4" />
            {action.label}
          </Link>
        ) : action.onClick ? (
          <button onClick={action.onClick} className={buttonClasses}>
            <PlusIcon className="w-4 h-4" />
            {action.label}
          </button>
        ) : null
      )}
    </div>
  );
}
