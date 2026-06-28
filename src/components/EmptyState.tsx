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
  icon?: HeroIcon;
}

interface EmptyStateProps {
  icon: HeroIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

export default function EmptyState({ icon: Icon, title, description, action, secondaryAction }: EmptyStateProps) {
  const primaryClasses =
    'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity';
  const secondaryClasses =
    'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-full border border-border text-foreground hover:bg-accent transition-colors';

  const renderAction = (act: EmptyStateAction, classes: string) => {
    const ActionIcon = act.icon ?? PlusIcon;
    if (act.href) {
      return (
        <Link href={act.href} className={classes}>
          <ActionIcon className="w-4 h-4" />
          {act.label}
        </Link>
      );
    }
    if (act.onClick) {
      return (
        <button onClick={act.onClick} className={classes}>
          <ActionIcon className="w-4 h-4" />
          {act.label}
        </button>
      );
    }
    return null;
  };

  return (
    <div role="status" aria-live="polite" className="enterprise-card flex flex-col items-center justify-center py-16 px-4">
      <Icon className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center gap-3">
          {action && renderAction(action, primaryClasses)}
          {secondaryAction && renderAction(secondaryAction, secondaryClasses)}
        </div>
      )}
    </div>
  );
}
