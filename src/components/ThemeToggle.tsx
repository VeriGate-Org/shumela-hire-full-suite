'use client';

import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useTheme } from '@/contexts/ThemeContext';

type ColorMode = 'light' | 'dark' | 'system';

const modes: { value: ColorMode; icon: typeof SunIcon; label: string }[] = [
  { value: 'light', icon: SunIcon, label: 'Light' },
  { value: 'dark', icon: MoonIcon, label: 'Dark' },
  { value: 'system', icon: ComputerDesktopIcon, label: 'System' },
];

export default function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { colorMode, setColorMode } = useTheme();

  if (collapsed) {
    const currentIndex = modes.findIndex((m) => m.value === colorMode);
    const CurrentIcon = modes[currentIndex]?.icon ?? ComputerDesktopIcon;

    return (
      <button
        type="button"
        onClick={() => {
          const next = modes[(currentIndex + 1) % modes.length];
          setColorMode(next.value);
        }}
        aria-label={`Theme: ${colorMode}. Click to cycle.`}
        className="w-full flex items-center justify-center py-1.5 rounded-control text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <CurrentIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-0.5 bg-muted rounded-control p-0.5">
      {modes.map(({ value, icon: Icon, label }) => (
        <button
          type="button"
          key={value}
          onClick={() => setColorMode(value)}
          aria-label={`${label} theme`}
          aria-pressed={colorMode === value}
          className={`flex items-center justify-center gap-1.5 flex-1 py-1 px-1.5 rounded-control text-xs font-medium transition-colors ${
            colorMode === value
              ? 'bg-card text-foreground shadow-sm border border-border'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
