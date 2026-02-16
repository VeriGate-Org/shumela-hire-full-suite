'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  badge?: string;
  children?: NavItem[];
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: '📊'
    },
    {
      id: 'applications',
      label: 'Applications',
      href: '/applications',
      icon: '📝',
      children: [
        { id: 'all-applications', label: 'All Applications', href: '/applications', icon: '📋' },
        { id: 'pending-review', label: 'Pending Review', href: '/applications?status=pending', icon: '🔍', badge: '12' },
        { id: 'shortlisted', label: 'Shortlisted', href: '/applications?status=shortlisted', icon: '⭐' },
        { id: 'rejected', label: 'Rejected', href: '/applications?status=rejected', icon: '❌' }
      ]
    },
    {
      id: 'interviews',
      label: 'Interviews',
      href: '/interviews',
      icon: '🎤',
      children: [
        { id: 'calendar', label: 'Calendar', href: '/interviews', icon: '📅' },
        { id: 'scheduled', label: 'Scheduled', href: '/interviews?status=scheduled', icon: '⏰', badge: '5' },
        { id: 'completed', label: 'Completed', href: '/interviews?status=completed', icon: '✅' },
        { id: 'feedback-pending', label: 'Feedback Pending', href: '/interviews?feedback=pending', icon: '📝', badge: '3' }
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      href: '/analytics',
      icon: '📈',
      badge: 'New',
      children: [
        { id: 'overview', label: 'Overview', href: '/analytics', icon: '📊' },
        { id: 'pipeline', label: 'Pipeline Analytics', href: '/pipeline', icon: '🔄' },
        { id: 'reports', label: 'Reports', href: '/reports', icon: '📄' },
        { id: 'visualization', label: 'Data Visualization', href: '/visualization', icon: '📈', badge: 'New' }
      ]
    },
    {
      id: 'jobs',
      label: 'Job Postings',
      href: '/job-postings',
      icon: '💼'
    },
    {
      id: 'templates',
      label: 'Templates',
      href: '/job-templates',
      icon: '📄'
    },
    {
      id: 'workflow',
      label: 'Workflow',
      href: '/workflow',
      icon: '⚙️'
    },
    {
      id: 'offers',
      label: 'Offers',
      href: '/offers',
      icon: '💰'
    }
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isParentActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(child => isActive(child.href)) || false;
  };

  // Close menu on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Slide-out menu */}
      <div className={`fixed top-0 left-0 h-full w-72 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 bg-violet-600 rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">TG</span>
            </div>
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">TalentGate</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {navigationItems.map((item) => (
              <div key={item.id}>
                {/* Main item */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={`flex-1 flex items-center space-x-3 px-3 py-2 rounded-sm transition-colors ${
                      isParentActive(item)
                        ? 'bg-gold-50/80 text-violet-700 border-l-[3px] border-l-violet-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-auto">
                        {item.badge}
                      </span>
                    )}
                  </Link>

                  {/* Expand button for items with children */}
                  {item.children && (
                    <button
                      onClick={() => toggleExpanded(item.id)}
                      className={`p-2 text-gray-400 hover:text-gray-600 transition-transform ${
                        expandedItems.has(item.id) ? 'rotate-90' : ''
                      }`}
                    >
                      ▶
                    </button>
                  )}
                </div>

                {/* Children */}
                {item.children && expandedItems.has(item.id) && (
                  <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.id}
                        href={child.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                          isActive(child.href)
                            ? 'bg-gold-50/60 text-violet-700'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{child.icon}</span>
                        <span>{child.label}</span>
                        {child.badge && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-auto">
                            {child.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium">JD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">HR Manager</p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/profile"
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-sm hover:bg-gray-200 transition-colors"
            >
              <span>👤</span>
              <span>Profile</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-sm hover:bg-gray-200 transition-colors"
            >
              <span>⚙️</span>
              <span>Settings</span>
            </Link>
          </div>

          {/* Sign Out */}
          <button
            onClick={() => {
              onClose();
              logout();
              router.push('/login');
            }}
            className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-sm hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

// Mobile header component
export const MobileHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length === 0 || pathSegments[0] === 'dashboard') return 'Dashboard';
    
    const pageTitles: Record<string, string> = {
      'applications': 'Applications',
      'interviews': 'Interviews',
      'analytics': 'Analytics',
      'reports': 'Reports',
      'visualization': 'Visualization',
      'pipeline': 'Pipeline',
      'job-postings': 'Job Postings',
      'job-templates': 'Templates',
      'workflow': 'Workflow',
      'offers': 'Offers'
    };

    return pageTitles[pathSegments[0]] || 'TalentGate';
  };

  return (
    <>
      {/* Mobile header - only shown on mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm transition-colors"
            >
              <span className="text-lg">☰</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>

          <div className="flex items-center space-x-2">
            {/* Search button */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm transition-colors">
              <span className="text-lg">🔍</span>
            </button>
            
            {/* Notifications button */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-sm transition-colors relative">
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                3
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation menu */}
      <MobileNavigation 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />

      {/* Spacer for fixed header */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default MobileNavigation;
