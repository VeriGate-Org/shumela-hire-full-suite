import React from 'react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  badge?: string;
  disabled?: boolean;
}

const QuickActions: React.FC = () => {
  const actions: QuickAction[] = [
    {
      id: 'post-job',
      label: 'Post New Job',
      description: 'Create and publish a job posting',
      href: '/jobs/new',
      icon: '📝',
      color: 'bg-gold-50 hover:bg-gold-100 border-violet-200'
    },
    {
      id: 'schedule-interview',
      label: 'Schedule Interview',
      description: 'Set up interviews with candidates',
      href: '/interviews/schedule',
      icon: '📅',
      color: 'bg-green-50 hover:bg-green-100 border-green-200'
    },
    {
      id: 'review-applications',
      label: 'Review Applications',
      description: 'Process pending applications',
      href: '/applications?status=pending',
      icon: '📋',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      badge: '12'
    },
    {
      id: 'generate-report',
      label: 'Generate Report',
      description: 'Create analytics and insights',
      href: '/reports/generate',
      icon: '📊',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200'
    },
    {
      id: 'bulk-actions',
      label: 'Bulk Actions',
      description: 'Process multiple items at once',
      href: '/bulk-actions',
      icon: '⚡',
      color: 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200'
    },
    {
      id: 'templates',
      label: 'Job Templates',
      description: 'Manage job posting templates',
      href: '/job-templates',
      icon: '🗂️',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
    },
    {
      id: 'analytics',
      label: 'View Analytics',
      description: 'Explore hiring metrics and trends',
      href: '/analytics',
      icon: '📈',
      color: 'bg-pink-50 hover:bg-pink-100 border-pink-200',
      badge: 'New'
    },
    {
      id: 'workflow',
      label: 'Workflow Builder',
      description: 'Create custom hiring workflows',
      href: '/workflow',
      icon: '🔄',
      color: 'bg-teal-50 hover:bg-teal-100 border-teal-200',
      badge: 'Beta'
    }
  ];

  const recentActions = [
    {
      id: 'recent-1',
      label: 'Senior Developer Position',
      description: 'Last edited 2 hours ago',
      href: '/jobs/senior-developer',
      icon: '📝',
      type: 'Job Posting'
    },
    {
      id: 'recent-2',
      label: 'Technical Interview Template',
      description: 'Updated yesterday',
      href: '/templates/technical-interview',
      icon: '📋',
      type: 'Template'
    },
    {
      id: 'recent-3',
      label: 'Q1 Hiring Report',
      description: 'Generated last week',
      href: '/reports/q1-hiring',
      icon: '📊',
      type: 'Report'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <Link
            href="/actions"
            className="text-sm text-gold-600 hover:text-gold-800 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className={`relative p-4 rounded-control border-2 transition-all duration-200 transform hover:scale-105 ${
                action.disabled 
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200' 
                  : `${action.color} cursor-pointer`
              }`}
              onClick={action.disabled ? (e) => e.preventDefault() : undefined}
            >
              {/* Badge */}
              {action.badge && (
                <span className="absolute -top-2 -right-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {action.badge}
                </span>
              )}

              {/* Content */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{action.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    {action.label}
                  </h3>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Hover indicator */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-gray-400">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Actions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recently Accessed</h2>
          <Link
            href="/recent"
            className="text-sm text-gold-600 hover:text-gold-800 font-medium"
          >
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-control border border-gray-200 divide-y divide-gray-200">
          {recentActions.map((action) => (
            <Link
              key={action.id}
              href={action.href}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <span className="text-xl">{action.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {action.label}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {action.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-gray-400">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-gray-50 rounded-control p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Search</span>
            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">New Job</span>
            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded">
              ⌘N
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Go to Applications</span>
            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded">
              GA
            </kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Go to Dashboard</span>
            <kbd className="inline-flex items-center px-2 py-1 text-xs font-mono bg-white border border-gray-200 rounded">
              GD
            </kbd>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
