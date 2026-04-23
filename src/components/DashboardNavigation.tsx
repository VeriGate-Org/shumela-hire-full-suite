import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  description: string;
  badge?: string;
  children?: NavigationItem[];
}

const DashboardNavigation: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['applications', 'interviews', 'analytics']);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      href: '/dashboard',
      icon: '🏠',
      description: 'Main dashboard overview'
    },
    {
      id: 'applications',
      label: 'Applications',
      href: '/applications',
      icon: '📋',
      description: 'Application management',
      children: [
        {
          id: 'applications-list',
          label: 'View Applications',
          href: '/applications',
          icon: '📄',
          description: 'Browse all applications'
        },
        {
          id: 'applicants-list',
          label: 'Applicant Profiles',
          href: '/applicants',
          icon: '👤',
          description: 'Manage candidate profiles'
        },
        {
          id: 'pipeline',
          label: 'Pipeline Management',
          href: '/pipeline',
          icon: '🔄',
          description: 'Track application progress'
        }
      ]
    },
    {
      id: 'interviews',
      label: 'Interviews',
      href: '/interviews',
      icon: '🎤',
      description: 'Interview scheduling and management',
      children: [
        {
          id: 'interviews-list',
          label: 'Interview Schedule',
          href: '/interviews',
          icon: '📅',
          description: 'View and manage interviews'
        },
        {
          id: 'interview-feedback',
          label: 'Interview Feedback',
          href: '/interviews/feedback',
          icon: '📝',
          description: 'Review and manage feedback'
        }
      ]
    },
    {
      id: 'jobs',
      label: 'Job Management',
      href: '/jobs',
      icon: '💼',
      description: 'Job postings and templates',
      children: [
        {
          id: 'job-postings',
          label: 'Job Postings',
          href: '/job-postings',
          icon: '📢',
          description: 'Manage active job postings'
        },
        {
          id: 'job-templates',
          label: 'Job Templates',
          href: '/job-templates',
          icon: '📋',
          description: 'Template management'
        },
        {
          id: 'requisitions',
          label: 'Requisitions',
          href: '/requisitions',
          icon: '📋',
          description: 'Hiring requisitions'
        }
      ]
    },
    {
      id: 'workflow',
      label: 'Workflow',
      href: '/workflow',
      icon: '⚡',
      description: 'Process automation and workflows'
    },
    {
      id: 'offers',
      label: 'Offers',
      href: '/offers',
      icon: '💌',
      description: 'Offer management and tracking'
    },
    {
      id: 'salary-reviews',
      label: 'Salary Reviews',
      href: '/salary-reviews',
      icon: '💰',
      description: 'Review and approve salary recommendations'
    },
    {
      id: 'talent-pools',
      label: 'Talent Pools',
      href: '/talent-pools',
      icon: '🎯',
      description: 'Manage candidate talent pools'
    },
    {
      id: 'agencies',
      label: 'Agencies',
      href: '/agencies',
      icon: '🤝',
      description: 'Manage recruitment agency partners'
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      href: '/analytics',
      icon: '📊',
      description: 'Performance analytics and insights',
      badge: 'New',
      children: [
        {
          id: 'recruitment-analytics',
          label: 'Recruitment Dashboard',
          href: '/analytics',
          icon: '📈',
          description: 'KPIs and recruitment metrics'
        },
        {
          id: 'performance-analytics',
          label: 'Performance Analytics',
          href: '/performance/analytics',
          icon: '⭐',
          description: 'Rating distributions and reviews'
        },
        {
          id: 'reports',
          label: 'Reports & Export',
          href: '/reports',
          icon: '📑',
          description: 'Generate and export reports'
        },
        {
          id: 'visualization',
          label: 'Data Visualization',
          href: '/visualization',
          icon: '📊',
          description: 'Interactive charts and graphs',
          badge: 'New'
        }
      ]
    },
    {
      id: 'internal',
      label: 'Internal Jobs',
      href: '/internal/jobs',
      icon: '🏢',
      description: 'Internal job board and applications'
    },
    {
      id: 'departments',
      label: 'Departments',
      href: '/admin/departments',
      icon: '🏛️',
      description: 'Manage organisational departments'
    }
  ];

  const toggleExpanded = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/') return true;
    if (href === '/' && pathname === '/') return true;
    return pathname.startsWith(href) && href !== '/';
  };

  const hasActiveChild = (children: NavigationItem[] | undefined) => {
    if (!children) return false;
    return children.some(child => isActive(child.href));
  };

  const NavigationItemComponent: React.FC<{ 
    item: NavigationItem; 
    level: number;
    isExpanded?: boolean;
  }> = ({ item, level, isExpanded = false }) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.href);
    const childActive = hasActiveChild(item.children);
    const showExpanded = isExpanded && expandedMenus.includes(item.id);

    return (
      <div className="mb-1">
        <div className="flex items-center">
          <Link
            href={item.href}
            className={`flex-1 flex items-center px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
              active
                ? 'bg-gold-50/80 text-violet-700 border-l-[3px] border-l-violet-600'
                : childActive
                ? 'bg-gold-50/50 text-gold-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            } ${level > 0 ? 'ml-6 pl-6 border-l border-gray-200' : ''}`}
          >
            <span className="mr-3 text-lg">{item.icon}</span>
            <div className="flex-1">
              <div className="flex items-center">
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
              {level === 0 && (
                <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
              )}
            </div>
          </Link>
          
          {hasChildren && (
            <button
              onClick={() => toggleExpanded(item.id)}
              className={`p-1 rounded hover:bg-gray-200 transition-colors ${
                showExpanded ? 'text-violet-500' : 'text-gray-400'
              }`}
            >
              <span className={`transition-transform ${showExpanded ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
          )}
        </div>

        {hasChildren && showExpanded && (
          <div className="mt-1 ml-4 border-l border-gray-200">
            {item.children!.map((child) => (
              <NavigationItemComponent
                key={child.id}
                item={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-sm shadow-md border"
      >
        <span className="text-xl">{isMobileMenuOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation sidebar */}
      <nav className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-40 transition-transform
        md:translate-x-0 md:static md:z-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        w-60 overflow-y-auto
      `}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <img src="/icons/shumelahire-icon.svg" alt="ShumelaHire" className="w-7 h-7" />
            <h1 className="text-sm font-extrabold tracking-[-0.03em]">
              <span className="text-primary">Shumela</span><span className="text-cta">Hire</span>
            </h1>
          </div>
        </div>

        <div className="p-4">
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <NavigationItemComponent
                key={item.id}
                item={item}
                level={0}
                isExpanded={true}
              />
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-50 rounded-sm">
          <div className="flex items-center text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-gray-600">System Status: </span>
            <span className="text-green-600 font-medium">Online</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </nav>
    </>
  );
};

export default DashboardNavigation;
