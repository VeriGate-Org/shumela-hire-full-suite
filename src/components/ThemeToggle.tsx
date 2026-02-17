'use client';

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  compact?: boolean;
  className?: string;
}

export default function ThemeToggle({
  compact = false,
  className = ''
}: ThemeToggleProps) {
  const { mode, toggleTheme, isDark } = useTheme();

  const getThemeIcon = () => {
    switch (mode) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (mode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'Light';
    }
  };

  if (compact) {
    return (
      <button
        onClick={toggleTheme}
        aria-label={`Switch theme mode. Current mode: ${getThemeLabel()}`}
        className={`p-2 rounded-control border border-border bg-card hover:bg-accent transition-colors ${className}`}
        title={`Current: ${getThemeLabel()} theme`}
      >
        {getThemeIcon()}
      </button>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleTheme}
        aria-label={`Switch theme mode. Current mode: ${getThemeLabel()}`}
        className="flex items-center gap-2 px-3 py-2 rounded-control border border-border bg-card hover:bg-accent transition-colors"
      >
        {getThemeIcon()}
        <span className="text-sm font-medium">{getThemeLabel()}</span>
      </button>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-primary' : 'bg-cta'}`} />
        {isDark ? 'Dark' : 'Light'}
      </span>
    </div>
  );
}
