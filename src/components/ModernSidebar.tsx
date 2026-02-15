import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { navigationRegistry, sectionLabels, NavSection, NavigationEntry } from '@/config/navigationRegistry';
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ModernSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse
}) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter navigation entries by user permissions
  const navigationItems = useMemo(() => {
    if (!user) return [];
    const userPermissions = user.permissions || [];
    return navigationRegistry.filter(entry =>
      entry.requiredPermissions.every(p => userPermissions.includes(p))
    );
  }, [user?.permissions]);

  // Apply search filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery) return navigationItems;
    return navigationItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, navigationItems]);

  // Group items by section
  const groupedNavItems = useMemo(() => {
    const groups: Partial<Record<NavSection, NavigationEntry[]>> = {};
    for (const item of filteredItems) {
      const section = item.section || 'recruitment';
      if (!groups[section]) groups[section] = [];
      groups[section]!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const keyShortcutMap: Record<string, string> = {
    '/dashboard': 'g d',
    '/pipeline': 'g p',
    '/applications': 'g a',
    '/job-postings': 'g j',
    '/interviews': 'g i',
    '/reports': 'g r',
  };

  const isActiveRoute = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== '/';
  };

  const renderNavigationItem = (item: NavigationEntry) => {
    const isActive = isActiveRoute(item.href);
    const IconComponent = isActive && item.iconSolid ? item.iconSolid : item.icon;

    return (
      <div key={item.id}>
        <Link
          href={item.href}
          aria-keyshortcuts={keyShortcutMap[item.href]}
          className={`
            group flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium rounded transition-colors border border-transparent
            ${isActive
              ? 'bg-violet-500/[0.06] text-violet-800 border-l-[3px] border-l-violet-600 border-y-transparent border-r-transparent pl-[7px]'
              : 'text-gray-600 hover:bg-gray-100 hover:text-violet-700'
            }
            ${isCollapsed ? 'justify-center px-2' : ''}
          `}
        >
          <IconComponent className={`
            h-4 w-4 flex-shrink-0
            ${isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-gray-500'}
            transition-colors
          `} />

          {!isCollapsed && (
            <>
              <span className="flex-1 text-left truncate">{item.label}</span>

              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] rounded bg-violet-600 text-white">
                  {item.badge}
                </span>
              )}

              {keyShortcutMap[item.href] && (
                <span className="hidden group-hover:inline text-[10px] text-gray-400 ml-auto">
                  {keyShortcutMap[item.href]}
                </span>
              )}
            </>
          )}
        </Link>
      </div>
    );
  };

  return (
    <aside className={`
      fixed left-0 top-14 bottom-0 bg-white border-r border-gray-200 overflow-y-auto transition-all duration-200 ease-in-out z-40
      ${isCollapsed ? 'w-16' : 'w-60'}
    `}>
      {/* Search */}
      {!isCollapsed && (
        <div className="px-3 py-3">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded bg-gray-50 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-transparent"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <XMarkIcon className="h-3 w-3 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section-grouped Navigation */}
      <div className="px-3 py-1">
        {Object.entries(groupedNavItems).map(([section, items]) => (
          <div key={section} className="mb-4">
            {!isCollapsed && (
              <p className="text-[11px] text-gray-400 uppercase tracking-[0.12em] mb-2 font-semibold px-2.5">
                {sectionLabels[section as NavSection] || section}
              </p>
            )}
            <nav className="space-y-0.5">
              {items?.map(item => renderNavigationItem(item))}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default ModernSidebar;
