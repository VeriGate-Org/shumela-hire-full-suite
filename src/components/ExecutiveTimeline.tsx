'use client';

import React, { useState } from 'react';
import StatusPill from '@/components/StatusPill';
import { PILL_VARIANTS } from '@/utils/enumColors';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  FlagIcon,
  StarIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  timestamp?: string;
  status?: string;
  statusDomain?: string;
  severity?: 'critical' | 'warning' | 'info' | 'opportunity';
  icon?: HeroIcon;
  meta?: Record<string, string | number>;
  progress?: number;
  expandedContent?: React.ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'danger' | 'secondary';
  }>;
}

export type TimelineVariant = 'alert' | 'milestone' | 'goal' | 'approval' | 'insight' | 'workflow';

interface ExecutiveTimelineProps {
  items: TimelineItem[];
  variant?: TimelineVariant;
  title?: string;
  emptyMessage?: string;
  maxItems?: number;
  expandable?: boolean;
  showRail?: boolean;
  showTimestamps?: boolean;
  className?: string;
}

interface VariantConfig {
  dotClass: string;
  cardBorder: string;
  cardBg: string;
  defaultIcon: HeroIcon;
}

const VARIANT_CONFIG: Record<TimelineVariant, VariantConfig> = {
  alert: {
    dotClass: 'bg-orange-200 dark:bg-orange-800',
    cardBorder: 'border-orange-200 dark:border-orange-800',
    cardBg: 'bg-card',
    defaultIcon: ExclamationCircleIcon,
  },
  milestone: {
    dotClass: 'bg-primary/30',
    cardBorder: 'border-primary/20',
    cardBg: 'bg-card',
    defaultIcon: FlagIcon,
  },
  goal: {
    dotClass: 'bg-gold-200 dark:bg-gold-800',
    cardBorder: 'border-gold-200 dark:border-gold-800',
    cardBg: 'bg-card',
    defaultIcon: StarIcon,
  },
  approval: {
    dotClass: 'bg-amber-200 dark:bg-amber-800',
    cardBorder: 'border-amber-200 dark:border-amber-800',
    cardBg: 'bg-card',
    defaultIcon: ShieldCheckIcon,
  },
  insight: {
    dotClass: 'bg-indigo-200 dark:bg-indigo-800',
    cardBorder: 'border-indigo-200 dark:border-indigo-800',
    cardBg: 'bg-card',
    defaultIcon: LightBulbIcon,
  },
  workflow: {
    dotClass: 'bg-green-200 dark:bg-green-800',
    cardBorder: 'border-border',
    cardBg: 'bg-card',
    defaultIcon: CheckCircleIcon,
  },
};

const SEVERITY_CONFIG: Record<string, { dotClass: string; cardBorder: string; icon: HeroIcon }> = {
  critical: {
    dotClass: 'bg-red-400 dark:bg-red-600',
    cardBorder: 'border-red-200 dark:border-red-800',
    icon: ExclamationTriangleIcon,
  },
  warning: {
    dotClass: 'bg-yellow-400 dark:bg-yellow-600',
    cardBorder: 'border-yellow-200 dark:border-yellow-800',
    icon: ExclamationCircleIcon,
  },
  info: {
    dotClass: 'bg-primary/40',
    cardBorder: 'border-primary/20',
    icon: InformationCircleIcon,
  },
  opportunity: {
    dotClass: 'bg-green-400 dark:bg-green-600',
    cardBorder: 'border-green-200 dark:border-green-800',
    icon: LightBulbIcon,
  },
};

const ACTION_STYLES: Record<string, string> = {
  primary: 'border-gold-500 text-primary bg-gold-50 hover:bg-gold-100 dark:bg-gold-900/30 dark:text-gold-300 dark:hover:bg-gold-900/50',
  danger: 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50',
  secondary: 'border-border text-foreground bg-card hover:bg-muted',
};

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  return {
    date: d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
  };
}

export default function ExecutiveTimeline({
  items,
  variant = 'alert',
  title,
  emptyMessage = 'No items to display.',
  maxItems,
  expandable = true,
  showRail = true,
  showTimestamps = true,
  className = '',
}: ExecutiveTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleExpand = (id: string) => {
    if (!expandable) return;
    setExpandedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const visibleItems = maxItems && !showAll ? items.slice(0, maxItems) : items;
  const hasMore = maxItems ? items.length > maxItems : false;
  const variantCfg = VARIANT_CONFIG[variant];

  if (items.length === 0) {
    return (
      <div className={className}>
        {title && (
          <h3 className="text-lg font-medium text-foreground mb-4">{title}</h3>
        )}
        <p className="text-sm text-muted-foreground py-8 text-center">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-4">{title}</h3>
      )}

      <div className="relative">
        {/* Vertical rail */}
        {showRail && (
          <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border" />
        )}

        <div className="space-y-3">
          {visibleItems.map((item) => {
            const isExpanded = expandedItems.has(item.id);
            const severityCfg = item.severity ? SEVERITY_CONFIG[item.severity] : null;
            const dotClass = severityCfg?.dotClass ?? variantCfg.dotClass;
            const cardBorder = severityCfg?.cardBorder ?? variantCfg.cardBorder;
            const ItemIcon = item.icon ?? severityCfg?.icon ?? variantCfg.defaultIcon;

            return (
              <div key={item.id} className="relative pl-8">
                {/* Timeline dot */}
                {showRail && (
                  <div className={`absolute left-0 top-3 w-[23px] h-[23px] rounded-full border-2 border-card flex items-center justify-center shadow-sm ${dotClass}`}>
                    <ItemIcon className="w-3 h-3 text-foreground/70" />
                  </div>
                )}

                {/* Event card */}
                <div
                  className={`border rounded-[2px] p-4 transition-shadow ${cardBorder} ${variantCfg.cardBg} ${
                    expandable ? 'cursor-pointer hover:shadow-sm' : ''
                  }`}
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
                        {item.status && item.statusDomain && (
                          <StatusPill value={item.status} domain={item.statusDomain} size="sm" />
                        )}
                      </div>

                      {/* Description */}
                      {item.description && (
                        <p className={`text-xs text-muted-foreground mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {item.description}
                        </p>
                      )}

                      {/* Progress bar */}
                      {item.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span className="font-medium text-foreground">{item.progress}%</span>
                          </div>
                          <div className="w-full bg-border rounded-full h-1.5">
                            <div
                              className="bg-gold-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(item.progress, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right side: timestamp + expand chevron */}
                    <div className="flex items-start gap-2 shrink-0">
                      {showTimestamps && item.timestamp && (
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {formatTimestamp(item.timestamp).date}
                          </div>
                          <div className="text-xs text-muted-foreground/60">
                            {formatTimestamp(item.timestamp).time}
                          </div>
                        </div>
                      )}
                      {expandable && (item.expandedContent || item.meta || item.actions) && (
                        <div className="mt-0.5">
                          {isExpanded ? (
                            <ChevronUpIcon className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      {/* Custom expanded content */}
                      {item.expandedContent}

                      {/* Meta key-value pairs */}
                      {item.meta && Object.keys(item.meta).length > 0 && (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                          {Object.entries(item.meta).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                              <span className="font-medium text-foreground">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action buttons */}
                      {item.actions && item.actions.length > 0 && (
                        <div className="flex items-center gap-2 mt-3">
                          {item.actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={(e) => {
                                e.stopPropagation();
                                action.onClick();
                              }}
                              className={`inline-flex items-center px-3 py-1.5 border text-xs font-medium rounded-full transition-colors ${
                                ACTION_STYLES[action.variant ?? 'secondary']
                              }`}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Show more */}
      {hasMore && !showAll && (
        <button
          onClick={() => setShowAll(true)}
          className="mt-3 w-full text-center text-xs font-medium text-primary hover:text-primary/80 py-2"
        >
          Show all {items.length} items
        </button>
      )}
      {hasMore && showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="mt-3 w-full text-center text-xs font-medium text-primary hover:text-primary/80 py-2"
        >
          Show less
        </button>
      )}
    </div>
  );
}
