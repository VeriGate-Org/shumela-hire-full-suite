'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import PageWrapper from '@/components/PageWrapper';
import StatusPill from '@/components/StatusPill';
import { getEnumLabel } from '@/utils/enumLabels';
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ChartBarIcon,
  TrophyIcon,
  LinkIcon,
  StarIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ShieldCheckIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import {
  TrophyIcon as TrophyIconSolid,
  StarIcon as StarIconSolid
} from '@heroicons/react/24/solid';

interface LeadershipMember {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string;
  location: string;
  avatar: string;
  joinDate: string;
  reportingTo?: string;
  directReports: number;
  totalReports: number;
  experience: {
    yearsTotal: number;
    yearsAtCompany: number;
    previousRoles: Array<{
      title: string;
      company: string;
      duration: string;
    }>;
  };
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
  achievements: Array<{
    title: string;
    description: string;
    date: string;
    impact: string;
  }>;
  metrics: {
    teamPerformance: number;
    employeeSatisfaction: number;
    retentionRate: number;
    budgetManagement: number;
    goalAchievement: number;
  };
  currentFocus: Array<{
    initiative: string;
    priority: 'high' | 'medium' | 'low';
    timeline: string;
    status: 'on_track' | 'at_risk' | 'completed' | 'delayed';
  }>;
  socialLinks: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  bio: string;
  strengths: string[];
  developmentAreas: string[];
  successionPlan: {
    readiness: 'ready' | 'developing' | 'not_ready';
    potentialSuccessors: string[];
    timeToReplace: number; // in months
  };
}

interface TeamMetrics {
  totalLeaders: number;
  avgExperience: number;
  avgTenure: number;
  diversityScore: number;
  leadershipPipeline: number;
  successionReadiness: number;
  performanceScore: number;
  retentionRate: number;
}

interface LeadershipAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'opportunity';
  leaderId: string;
  title: string;
  description: string;
  impact: string;
  recommendedAction: string;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: string;
}

export default function LeadershipTeamPage() {
  const [leaders, setLeaders] = useState<LeadershipMember[]>([]);
  const [teamMetrics, _setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [alerts, _setAlerts] = useState<LeadershipAlert[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<LeadershipMember | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'directory' | 'performance' | 'succession'>('overview');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLeadershipData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, _metricsRes] = await Promise.allSettled([
        apiFetch('/api/executive/leadership/team'),
        apiFetch('/api/executive/leadership/metrics'),
      ]);

      if (teamRes.status === 'fulfilled' && teamRes.value.ok) {
        const data = await teamRes.value.json();
        if (Array.isArray(data) && data.length > 0) {
          setLeaders(data);
        }
      }
    } catch (error) {
      console.error('Failed to load leadership data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeadershipData();
  }, [loadLeadershipData]);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-gold-50 border-violet-200 text-violet-800';
      case 'opportunity': return 'bg-green-50 border-green-200 text-green-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5 text-violet-500" />;
      case 'opportunity': return <LightBulbIcon className="w-5 h-5 text-green-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };


  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = searchTerm === '' || 
      leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leader.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leader.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || leader.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const departments = [...new Set(leaders.map(leader => leader.department))];

  const actions = (
    <div className="flex items-center gap-3">
      {activeView === 'directory' && (
        <>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search leaders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
            />
          </div>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </>
      )}
      
      <button className="flex items-center px-4 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        Export Directory
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Leadership Team" subtitle="Loading leadership data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Leadership Team"
      subtitle="Executive team overview, performance metrics, and succession planning"
      actions={actions}
    >
      <div className="space-y-6">
        {/* View Navigation */}
        <div className="bg-white rounded-sm shadow p-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Team Overview', icon: ChartBarIcon },
              { id: 'directory', name: 'Leadership Directory', icon: UserGroupIcon },
              { id: 'performance', name: 'Performance Metrics', icon: TrophyIcon },
              { id: 'succession', name: 'Succession Planning', icon: ShieldCheckIcon }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-gold-100 text-violet-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Team Overview */}
        {activeView === 'overview' && teamMetrics && (
          <div className="space-y-6">
            {/* Key Leadership Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <UsersIcon className="w-8 h-8 text-violet-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Leadership Team</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMetrics.totalLeaders}</p>
                    <p className="text-xs text-gray-600">
                      {teamMetrics.avgTenure} years avg tenure
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <TrophyIconSolid className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Performance Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMetrics.performanceScore}/5.0</p>
                    <p className="text-xs text-purple-600">Above expectations</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Succession Readiness</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMetrics.successionReadiness}%</p>
                    <p className="text-xs text-green-600">{teamMetrics.leadershipPipeline} in pipeline</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <StarIconSolid className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Retention Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMetrics.retentionRate}%</p>
                    <p className="text-xs text-orange-600">Industry leading</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Leadership Alerts */}
            <div className="bg-white rounded-sm shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leadership Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-sm border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.description}</p>
                        <p className="text-sm mt-2 text-gray-600">Impact: {alert.impact}</p>
                        <p className="text-xs mt-2 font-medium">Recommended Action: {alert.recommendedAction}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            Leader: {leaders.find(l => l.id === alert.leaderId)?.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Executive Team Summary */}
            <div className="bg-white rounded-sm shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Executive Team at a Glance</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {leaders.slice(0, 4).map((leader) => (
                    <div key={leader.id} className="text-center">
                      <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                        {leader.avatar}
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">{leader.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{leader.title}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        <p>{leader.directReports} direct reports</p>
                        <p>{leader.experience.yearsAtCompany} years tenure</p>
                        <p className="flex items-center justify-center">
                          <StarIcon className="w-3 h-3 text-yellow-500 mr-1" />
                          {leader.metrics.teamPerformance}/5.0
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leadership Directory */}
        {activeView === 'directory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredLeaders.map((leader) => (
                <div key={leader.id} className="bg-white rounded-sm shadow border-l-4 border-l-violet-500">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gold-100 rounded-full flex items-center justify-center text-xl">
                          {leader.avatar}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{leader.name}</h3>
                          <p className="text-sm text-gray-600">{leader.title}</p>
                          <p className="text-sm text-gray-500">{leader.department}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedLeader(leader)}
                        className="flex items-center px-3 py-1 text-xs font-medium text-gold-600 bg-gold-50 rounded-full hover:bg-gold-100"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        View Profile
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Experience</p>
                        <p className="text-lg font-semibold text-gray-900">{leader.experience.yearsTotal} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Team Size</p>
                        <p className="text-lg font-semibold text-gray-900">{leader.totalReports}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Performance</p>
                        <div className="flex items-center">
                          <StarIconSolid className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-lg font-semibold text-gray-900">{leader.metrics.teamPerformance}/5.0</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-sm text-gray-900">{leader.location}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Current Focus Areas</p>
                      <div className="space-y-1">
                        {leader.currentFocus.slice(0, 2).map((focus, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-gray-700">{focus.initiative}</span>
                            <StatusPill value={focus.status} domain="goalStatus" />
                          </div>
                        ))}
                        {leader.currentFocus.length > 2 && (
                          <p className="text-xs text-gray-500">+{leader.currentFocus.length - 2} more initiatives</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <a href={`mailto:${leader.email}`} className="flex items-center text-gold-600 hover:text-gold-800">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        Email
                      </a>
                      {leader.socialLinks.linkedin && (
                        <a href={leader.socialLinks.linkedin} className="flex items-center text-gold-600 hover:text-gold-800">
                          <LinkIcon className="w-4 h-4 mr-1" />
                          LinkedIn
                        </a>
                      )}
                      <span className="text-gray-500">
                        Joined {new Date(leader.joinDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        {activeView === 'performance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-sm shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leadership Performance Dashboard</h3>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border border-gray-200 rounded-sm p-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center text-lg">
                          {leader.avatar}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{leader.name}</h4>
                          <p className="text-sm text-gray-600">{leader.title}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Team Performance</p>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-gold-500 h-2 rounded-full" style={{ width: `${leader.metrics.teamPerformance * 20}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{leader.metrics.teamPerformance}/5.0</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Employee Satisfaction</p>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${leader.metrics.employeeSatisfaction * 20}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{leader.metrics.employeeSatisfaction}/5.0</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Retention Rate</p>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${leader.metrics.retentionRate}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{leader.metrics.retentionRate}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Budget Management</p>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${leader.metrics.budgetManagement * 20}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{leader.metrics.budgetManagement}/5.0</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Goal Achievement</p>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div className="bg-red-500 h-2 rounded-full" style={{ width: `${leader.metrics.goalAchievement * 20}%` }}></div>
                            </div>
                            <span className="text-sm font-medium">{leader.metrics.goalAchievement}/5.0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Succession Planning */}
        {activeView === 'succession' && (
          <div className="space-y-6">
            <div className="bg-white rounded-sm shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leadership Succession Planning</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border border-gray-200 rounded-sm p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-gold-100 rounded-full flex items-center justify-center text-lg">
                            {leader.avatar}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{leader.name}</h4>
                            <p className="text-sm text-gray-600">{leader.title}</p>
                          </div>
                        </div>
                        <StatusPill value={leader.successionPlan.readiness} domain="readiness" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Succession Readiness</p>
                          <p className="text-sm text-gray-900">{getEnumLabel('readiness', leader.successionPlan.readiness)}</p>
                          <p className="text-xs text-gray-500">Time to replace: {leader.successionPlan.timeToReplace} months</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Potential Successors</p>
                          <div className="space-y-1">
                            {leader.successionPlan.potentialSuccessors.map((successor, index) => (
                              <span key={index} className="inline-block text-xs px-2 py-1 bg-gold-100 text-gold-800 rounded-full mr-1">
                                {successor}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Development Areas</p>
                          <div className="space-y-1">
                            {leader.developmentAreas.slice(0, 2).map((area, index) => (
                              <span key={index} className="inline-block text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full mr-1">
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leader Profile Modal */}
        {selectedLeader && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gold-100 rounded-full flex items-center justify-center text-2xl">
                      {selectedLeader.avatar}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedLeader.name}</h2>
                      <p className="text-lg text-gray-600">{selectedLeader.title}</p>
                      <p className="text-sm text-gray-500">{selectedLeader.department} • {selectedLeader.location}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLeader(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Professional Summary</h3>
                      <p className="text-sm text-gray-700">{selectedLeader.bio}</p>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience</h3>
                      <div className="space-y-3">
                        <div className="bg-gold-50 border border-violet-200 rounded-sm p-3">
                          <h4 className="font-medium text-violet-900">{selectedLeader.title}</h4>
                          <p className="text-sm text-violet-700">Current Company • {selectedLeader.experience.yearsAtCompany} years</p>
                        </div>
                        {selectedLeader.experience.previousRoles.map((role, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-sm p-3">
                            <h4 className="font-medium text-gray-900">{role.title}</h4>
                            <p className="text-sm text-gray-600">{role.company} • {role.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Focus Areas</h3>
                      <div className="space-y-3">
                        {selectedLeader.currentFocus.map((focus, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-sm">
                            <div>
                              <h4 className="font-medium text-gray-900">{focus.initiative}</h4>
                              <p className="text-sm text-gray-600">Timeline: {focus.timeline}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <StatusPill value={focus.priority} domain="priority" />
                              <StatusPill value={focus.status} domain="goalStatus" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Achievements</h3>
                      <div className="space-y-3">
                        {selectedLeader.achievements.map((achievement, index) => (
                          <div key={index} className="border-l-4 border-green-500 pl-4">
                            <h4 className="font-medium text-gray-900">{achievement.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                            <p className="text-sm text-green-600 mt-1">Impact: {achievement.impact}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(achievement.date).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <EnvelopeIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <a href={`mailto:${selectedLeader.email}`} className="text-gold-600 hover:text-gold-800">
                            {selectedLeader.email}
                          </a>
                        </div>
                        {selectedLeader.phone && (
                          <div className="flex items-center">
                            <PhoneIcon className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-gray-600">{selectedLeader.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">{selectedLeader.location}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Metrics</h3>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Team Performance</span>
                            <span className="font-medium">{selectedLeader.metrics.teamPerformance}/5.0</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-gold-500 h-2 rounded-full" style={{ width: `${selectedLeader.metrics.teamPerformance * 20}%` }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Employee Satisfaction</span>
                            <span className="font-medium">{selectedLeader.metrics.employeeSatisfaction}/5.0</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${selectedLeader.metrics.employeeSatisfaction * 20}%` }}></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Retention Rate</span>
                            <span className="font-medium">{selectedLeader.metrics.retentionRate}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${selectedLeader.metrics.retentionRate}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Core Strengths</h3>
                      <div className="flex flex-wrap gap-1">
                        {selectedLeader.strengths.map((strength, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Education</h3>
                      <div className="space-y-2">
                        {selectedLeader.education.map((edu, index) => (
                          <div key={index} className="text-sm">
                            <p className="font-medium text-gray-900">{edu.degree}</p>
                            <p className="text-gray-600">{edu.institution} • {edu.year}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Overview</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Direct Reports</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedLeader.directReports}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total Reports</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedLeader.totalReports}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedLeader(null)}
                    className="px-6 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
