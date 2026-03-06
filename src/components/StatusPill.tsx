'use client';

import { getEnumLabel, formatEnumValue } from '@/utils/enumLabels';
import { getEnumColor, PILL_VARIANTS } from '@/utils/enumColors';

type HeroIcon = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface StatusPillProps {
  value: string;
  domain?: string;
  label?: string;
  color?: string;
  icon?: HeroIcon;
  size?: 'sm' | 'md' | 'lg';
  bordered?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
} as const;

export default function StatusPill({
  value,
  domain,
  label,
  color,
  icon: Icon,
  size = 'md',
  bordered = true,
  className = '',
}: StatusPillProps) {
  const displayLabel = label ?? (domain ? getEnumLabel(domain, value) : formatEnumValue(value));

  let colorClasses: string;
  if (color) {
    colorClasses = PILL_VARIANTS[color] ?? color;
  } else if (domain) {
    colorClasses = getEnumColor(domain, value);
  } else {
    colorClasses = PILL_VARIANTS.gray;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium uppercase tracking-[0.05em] ${SIZE_CLASSES[size]} ${colorClasses} ${bordered ? 'border' : ''} ${className}`}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} />}
      {displayLabel}
    </span>
  );
}
