'use client';

import React from 'react';
import ModernLayout from '../../components/ModernLayout';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  BriefcaseIcon,
  DocumentTextIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ModernDashboardDemo() {
  const stats = [
    {
      name: 'Total Applications',
      value: '2,847',
      change: '+12%',
      changeType: 'positive' as const,
      icon: DocumentTextIcon
    },
    {
      name: 'Active Positions',
      value: '18',
      change: '+3',
      changeType: 'positive' as const,
      icon: BriefcaseIcon
    },
    {
      name: 'Scheduled Interviews',
      value: '34',
      change: '-2%',
      changeType: 'negative' as const,
      icon: CalendarIcon
    },
    {
      name: 'Hired This Month',
      value: '12',
      change: '+25%',
      changeType: 'positive' as const,
      icon: CheckCircleIcon
    }
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'application',
      title: 'New application received',
      description: 'Sarah Johnson applied for Senior Developer',
      time: '2 minutes ago',
      avatar: 'SJ'
    },
    {
      id: 2,
      type: 'interview',
      title: 'Interview scheduled',
      description: 'Technical interview with Michael Chen',
      time: '1 hour ago',
      avatar: 'MC'
    },
    {
      id: 3,
      type: 'offer',
      title: 'Offer accepted',
      description: 'Alice Wang accepted Product Manager position',
      time: '3 hours ago',
      avatar: 'AW'
    }
  ];

  const upcomingInterviews = [
    {
      id: 1,
      candidate: 'Robert Smith',
      position: 'Frontend Developer',
      time: '10:00 AM',
      interviewer: 'Tech Team',
      avatar: 'RS'
    },
    {
      id: 2,
      candidate: 'Emily Davis',
      position: 'UX Designer',
      time: '2:30 PM',
      interviewer: 'Design Team',
      avatar: 'ED'
    },
    {
      id: 3,
      candidate: 'James Wilson',
      position: 'DevOps Engineer',
      time: '4:00 PM',
      interviewer: 'Infrastructure Team',
      avatar: 'JW'
    }
  ];

  const actions = (
    <div className="flex space-x-3">
      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500/60">
        Export Data
      </button>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-violet-900 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500/60">
        Create Position
      </button>
    </div>
  );

  return (
    <ModernLayout 
      title="Talent Management Dashboard"
      subtitle="Welcome back, John! Here's what's happening with your recruitment pipeline."
      actions={actions}
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-sm shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gold-100 rounded-sm flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gold-600" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow-sm rounded-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivity.length - 1 ? (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">{activity.avatar}</span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900 font-medium">{activity.title}</p>
                              <p className="text-sm text-gray-500">{activity.description}</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Interviews */}
        <div>
          <div className="bg-white shadow-sm rounded-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Today's Interviews</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {upcomingInterviews.map((interview) => (
                  <div key={interview.id} className="flex items-center space-x-3 p-3 rounded-sm hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gold-600">{interview.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{interview.candidate}</p>
                      <p className="text-sm text-gray-500 truncate">{interview.position}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{interview.time}</p>
                      <p className="text-xs text-gray-500">{interview.interviewer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 bg-white shadow-sm rounded-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                  <BriefcaseIcon className="w-5 h-5 mr-3 text-gray-400" />
                  Post New Position
                </button>
                <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                  <UserGroupIcon className="w-5 h-5 mr-3 text-gray-400" />
                  Review Applications
                </button>
                <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                  <CalendarIcon className="w-5 h-5 mr-3 text-gray-400" />
                  Schedule Interview
                </button>
                <button className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                  <ChartBarIcon className="w-5 h-5 mr-3 text-gray-400" />
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModernLayout>
  );
}
