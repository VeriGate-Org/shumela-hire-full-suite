'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import StatusPill from '@/components/StatusPill';
import { apiFetch } from '@/lib/api-fetch';
import ExecutiveTimeline, { TimelineItem } from '@/components/ExecutiveTimeline';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  GlobeAltIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  XMarkIcon,
  BuildingOffice2Icon,
  HomeIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import {
  BuildingOfficeIcon as BuildingOfficeIconSolid,
  UserGroupIcon as UserGroupIconSolid,
  TrophyIcon as TrophyIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';

interface OrganizationMetrics {
  totalEmployees: number;
  totalContractors: number;
  totalOpenPositions: number;
  monthlyGrowthRate: number;
  quarterlyGrowthRate: number;
  yearlyGrowthRate: number;
  averageTenure: number;
  turnoverRate: number;
  engagementScore: number;
  diversityScore: number;
  remoteWorkPercentage: number;
  averageSalary: number;
}

interface Department {
  id: string;
  name: string;
  headcount: number;
  openPositions: number;
  budget: number;
  utilizationRate: number;
  averageSalary: number;
  growthTarget: number;
  currentGrowth: number;
  keyMetrics: {
    productivity: number;
    satisfaction: number;
    retention: number;
    diversity: number;
  };
  recentChanges: {
    newHires: number;
    departures: number;
    promotions: number;
  };
  locations: Array<{
    city: string;
    employees: number;
    type: 'office' | 'remote' | 'hybrid';
  }>;
  criticalRoles: string[];
  upcomingMilestones: Array<{
    title: string;
    date: string;
    type: 'hiring' | 'project' | 'budget' | 'restructure';
  }>;
}

interface Location {
  id: string;
  name: string;
  type: 'headquarters' | 'office' | 'coworking' | 'remote_hub';
  address: string;
  employees: number;
  capacity: number;
  operationalCost: number;
  departments: string[];
  amenities: string[];
  utilization: number;
  expansion: boolean;
  leaseExpiry?: string;
}

interface OrganizationalAlert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'opportunity';
  category: 'headcount' | 'budget' | 'compliance' | 'performance' | 'culture';
  title: string;
  description: string;
  impact: string;
  department?: string;
  location?: string;
  recommendedAction: string;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  timestamp: string;
  dueDate?: string;
}

interface CompanyMilestone {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'achievement' | 'launch' | 'expansion' | 'funding' | 'partnership';
  status: 'completed' | 'in_progress' | 'planned';
  impact: 'high' | 'medium' | 'low';
  departments: string[];
  metrics?: {
    employeesImpacted: number;
    budgetImpact: number;
    timelineWeeks: number;
  };
}

export default function OrganizationalOverviewPage() {
  const [orgMetrics, setOrgMetrics] = useState<OrganizationMetrics | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, _setLocations] = useState<Location[]>([]);
  const [alerts, setAlerts] = useState<OrganizationalAlert[]>([]);
  const [milestones, _setMilestones] = useState<CompanyMilestone[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'departments' | 'locations' | 'insights'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [_filterDepartment, _setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationalData();
  }, [selectedPeriod]);

  const loadOrganizationalData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, kpisRes, deptRes, alertsRes] = await Promise.allSettled([
        apiFetch('/api/analytics/dashboard'),
        apiFetch('/api/analytics/kpis'),
        apiFetch('/api/pipeline/analytics/departments'),
        apiFetch('/api/analytics/alerts'),
      ]);

      // Map dashboard + KPIs to OrganizationMetrics
      let dashData: any = {};
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        dashData = await dashboardRes.value.json();
      }
      let kpiData: any = {};
      if (kpisRes.status === 'fulfilled' && kpisRes.value.ok) {
        kpiData = await kpisRes.value.json();
      }

      setOrgMetrics({
        totalEmployees: dashData.totalEmployees || kpiData.totalEmployees || 0,
        totalContractors: dashData.totalContractors || 0,
        totalOpenPositions: dashData.openPositions || dashData.totalOpenPositions || 0,
        monthlyGrowthRate: dashData.monthlyGrowthRate || kpiData.monthlyGrowthRate || 0,
        quarterlyGrowthRate: dashData.quarterlyGrowthRate || kpiData.quarterlyGrowthRate || 0,
        yearlyGrowthRate: dashData.yearlyGrowthRate || kpiData.yearlyGrowthRate || 0,
        averageTenure: dashData.averageTenure || 0,
        turnoverRate: dashData.turnoverRate || kpiData.turnoverRate || 0,
        engagementScore: dashData.engagementScore || kpiData.engagementScore || 0,
        diversityScore: dashData.diversityScore || kpiData.diversityScore || 0,
        remoteWorkPercentage: dashData.remoteWorkPercentage || 0,
        averageSalary: dashData.averageSalary || 0,
      });

      // Map department pipeline stats
      if (deptRes.status === 'fulfilled' && deptRes.value.ok) {
        const deptData = await deptRes.value.json();
        const depts = deptData.departments || deptData || {};
        const mappedDepts: Department[] = Object.entries(depts).map(([name, stats]: [string, any]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          headcount: stats.totalApplications || stats.headcount || 0,
          openPositions: stats.openPositions || 0,
          budget: stats.budget || 0,
          utilizationRate: stats.utilizationRate || 0,
          averageSalary: stats.averageSalary || stats.averageTimeToFill || 0,
          growthTarget: stats.growthTarget || 0,
          currentGrowth: stats.currentGrowth || 0,
          keyMetrics: {
            productivity: stats.productivity || 0,
            satisfaction: stats.satisfaction || 0,
            retention: stats.retention || 0,
            diversity: stats.diversity || 0,
          },
          recentChanges: {
            newHires: stats.hired || stats.newHires || 0,
            departures: stats.departures || 0,
            promotions: stats.promotions || 0,
          },
          locations: [],
          criticalRoles: stats.criticalRoles || [],
          upcomingMilestones: [],
        }));
        setDepartments(mappedDepts);
      }

      // Map alerts
      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const alertData = await alertsRes.value.json();
        const alertItems = alertData.content || alertData.data || alertData || [];
        setAlerts(Array.isArray(alertItems) ? alertItems.map((a: any) => ({
          id: a.id || `alert-${Math.random()}`,
          type: (a.type || a.severity || 'info').toLowerCase() as OrganizationalAlert['type'],
          category: (a.category || 'performance') as OrganizationalAlert['category'],
          title: a.title || a.message || '',
          description: a.description || '',
          impact: a.impact || '',
          department: a.department,
          location: a.location,
          recommendedAction: a.recommendedAction || a.recommendation || '',
          urgency: (a.urgency || 'medium') as OrganizationalAlert['urgency'],
          timestamp: a.timestamp || a.createdAt || new Date().toISOString(),
          dueDate: a.dueDate,
        })) : []);
      }
    } catch (error) {
      console.error('Failed to load organizational data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      case 'critical': return <ExclamationTriangleIconSolid className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5 text-violet-500" />;
      case 'opportunity': return <LightBulbIcon className="w-5 h-5 text-green-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };


  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'headquarters': return <BuildingOfficeIconSolid className="w-6 h-6 text-violet-500" />;
      case 'office': return <BuildingOffice2Icon className="w-6 h-6 text-green-500" />;
      case 'coworking': return <ComputerDesktopIcon className="w-6 h-6 text-purple-500" />;
      case 'remote_hub': return <HomeIcon className="w-6 h-6 text-orange-500" />;
      default: return <BuildingOfficeIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = searchTerm === '' || 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const actions = (
    <div className="flex items-center gap-3">
      {activeView === 'departments' && (
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
          />
        </div>
      )}
      
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
      >
        <option value="month">This Month</option>
        <option value="quarter">This Quarter</option>
        <option value="year">This Year</option>
      </select>
      
      <button className="flex items-center px-4 py-2 bg-transparent border-2 border-gold-500 text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider rounded-full text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        Export Report
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Organizational Overview" subtitle="Loading organizational data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Organizational Overview"
      subtitle="Comprehensive view of organizational structure, metrics, and strategic insights"
      actions={actions}
    >
      <div className="space-y-6">
        {/* View Navigation */}
        <div className="bg-white rounded-sm shadow p-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Executive Summary', icon: ChartBarIcon },
              { id: 'departments', name: 'Department Analysis', icon: UserGroupIcon },
              { id: 'locations', name: 'Location Portfolio', icon: MapPinIcon },
              { id: 'insights', name: 'Strategic Insights', icon: LightBulbIcon }
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

        {/* Executive Summary */}
        {activeView === 'overview' && orgMetrics && (
          <div className="space-y-6">
            {/* Key Organizational Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <UserGroupIconSolid className="w-8 h-8 text-violet-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Workforce</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {(orgMetrics.totalEmployees + orgMetrics.totalContractors).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      {orgMetrics.totalEmployees.toLocaleString()} employees, {orgMetrics.totalContractors} contractors
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ArrowTrendingUpIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Growth Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">+{orgMetrics.quarterlyGrowthRate}%</p>
                    <p className="text-xs text-green-600">
                      {orgMetrics.totalOpenPositions} open positions
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <TrophyIconSolid className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Engagement Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{orgMetrics.engagementScore}/5.0</p>
                    <p className="text-xs text-purple-600">
                      {orgMetrics.turnoverRate}% turnover rate
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <div className="flex items-center">
                  <GlobeAltIcon className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Remote Work</p>
                    <p className="text-2xl font-semibold text-gray-900">{orgMetrics.remoteWorkPercentage}%</p>
                    <p className="text-xs text-orange-600">Above industry average</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Critical Alerts */}
            <div className="bg-card rounded-sm shadow p-6">
              <ExecutiveTimeline
                title="Critical Organizational Alerts"
                variant="alert"
                maxItems={3}
                items={alerts
                  .filter(alert => alert.urgency === 'high' || alert.type === 'critical')
                  .map((alert): TimelineItem => ({
                    id: alert.id,
                    title: alert.title,
                    description: alert.description,
                    timestamp: alert.timestamp,
                    severity: alert.type as TimelineItem['severity'],
                    status: alert.urgency,
                    statusDomain: 'urgency',
                    meta: {
                      ...(alert.impact ? { impact: alert.impact } : {}),
                      ...(alert.department ? { department: alert.department } : {}),
                      ...(alert.recommendedAction ? { recommendation: alert.recommendedAction } : {}),
                      ...(alert.dueDate ? { due: new Date(alert.dueDate).toLocaleDateString() } : {}),
                    },
                  }))}
                emptyMessage="No critical alerts at this time."
              />
            </div>

            {/* Company Milestones */}
            <div className="bg-card rounded-sm shadow p-6">
              <ExecutiveTimeline
                title="Strategic Milestones"
                variant="milestone"
                maxItems={4}
                items={milestones.map((milestone): TimelineItem => ({
                  id: milestone.id,
                  title: milestone.title,
                  description: milestone.description,
                  timestamp: milestone.date,
                  status: milestone.status,
                  statusDomain: 'goalStatus',
                  meta: {
                    ...(milestone.metrics ? {
                      'employees impacted': milestone.metrics.employeesImpacted.toLocaleString(),
                      budget: `R${(milestone.metrics.budgetImpact / 1000000).toFixed(0)}M`,
                      timeline: `${milestone.metrics.timelineWeeks} weeks`,
                    } : {}),
                  },
                  expandedContent: milestone.departments.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {milestone.departments.map((dept, i) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                          {dept}
                        </span>
                      ))}
                    </div>
                  ) : undefined,
                }))}
                emptyMessage="No milestones recorded yet."
              />
            </div>
          </div>
        )}

        {/* Department Analysis */}
        {activeView === 'departments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className="bg-white rounded-sm shadow border-l-4 border-l-violet-500">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{dept.name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{dept.headcount} employees</span>
                          <span>{dept.openPositions} open positions</span>
                          <span>R{(dept.budget / 1000000).toFixed(1)}M budget</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedDepartment(dept)}
                        className="flex items-center px-3 py-1 text-xs font-medium text-gold-600 bg-gold-50 rounded-full hover:bg-gold-100"
                      >
                        <EyeIcon className="w-3 h-3 mr-1" />
                        Details
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Growth Target</p>
                        <div className="flex items-center">
                          <p className="text-lg font-semibold text-gray-900">{dept.growthTarget}%</p>
                          <span className={`ml-2 text-sm ${dept.currentGrowth >= dept.growthTarget ? 'text-green-600' : 'text-yellow-600'}`}>
                            (Current: {dept.currentGrowth}%)
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Utilization</p>
                        <p className="text-lg font-semibold text-gray-900">{dept.utilizationRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Salary</p>
                        <p className="text-lg font-semibold text-gray-900">R{dept.averageSalary.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Retention</p>
                        <p className="text-lg font-semibold text-gray-900">{dept.keyMetrics.retention}%</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Recent Activity (30 days)</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center text-green-600">
                          <ArrowUpIcon className="w-4 h-4 mr-1" />
                          {dept.recentChanges.newHires} hires
                        </span>
                        <span className="flex items-center text-red-600">
                          <ArrowDownIcon className="w-4 h-4 mr-1" />
                          {dept.recentChanges.departures} departures
                        </span>
                        <span className="flex items-center text-gold-600">
                          <ArrowUpIcon className="w-4 h-4 mr-1" />
                          {dept.recentChanges.promotions} promotions
                        </span>
                      </div>
                    </div>

                    {dept.criticalRoles.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Critical Open Roles</p>
                        <div className="flex flex-wrap gap-1">
                          {dept.criticalRoles.slice(0, 3).map((role, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {role}
                            </span>
                          ))}
                          {dept.criticalRoles.length > 3 && (
                            <span className="text-xs text-gray-500">+{dept.criticalRoles.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Portfolio */}
        {activeView === 'locations' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {locations.map((location) => (
                <div key={location.id} className="bg-white rounded-sm shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getLocationIcon(location.type)}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{location.name}</h3>
                          <p className="text-sm text-gray-600">{location.address}</p>
                        </div>
                      </div>
                      {location.expansion && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          EXPANDING
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Employees</p>
                        <p className="text-lg font-semibold text-gray-900">{location.employees}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Capacity</p>
                        <p className="text-lg font-semibold text-gray-900">{location.capacity}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Utilization</p>
                        <p className="text-lg font-semibold text-gray-900">{location.utilization}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Annual Cost</p>
                        <p className="text-lg font-semibold text-gray-900">R{(location.operationalCost / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Departments</p>
                      <div className="flex flex-wrap gap-1">
                        {location.departments.map((dept, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {location.amenities.slice(0, 4).map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {amenity}
                          </span>
                        ))}
                        {location.amenities.length > 4 && (
                          <span className="text-xs text-gray-500">+{location.amenities.length - 4} more</span>
                        )}
                      </div>
                    </div>

                    {location.leaseExpiry && (
                      <div className={`p-2 rounded-sm text-sm ${
                        new Date(location.leaseExpiry) < new Date('2026-01-01') ? 'bg-yellow-50 text-yellow-800' : 'bg-gray-50 text-gray-800'
                      }`}>
                        Lease expires: {new Date(location.leaseExpiry).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Insights */}
        {activeView === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-sm shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organizational Health Score</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Employee Engagement</span>
                    <span className="text-sm font-medium">{orgMetrics?.engagementScore}/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(orgMetrics?.engagementScore || 0) * 20}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Diversity Score</span>
                    <span className="text-sm font-medium">{orgMetrics?.diversityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gold-500 h-2 rounded-full" style={{ width: `${orgMetrics?.diversityScore}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Retention Rate</span>
                    <span className="text-sm font-medium">{100 - (orgMetrics?.turnoverRate || 0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${100 - (orgMetrics?.turnoverRate || 0)}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-sm shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Trajectory</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Growth</span>
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">+{orgMetrics?.monthlyGrowthRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Quarterly Growth</span>
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">+{orgMetrics?.quarterlyGrowthRate}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Annual Growth</span>
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm font-medium text-green-600">+{orgMetrics?.yearlyGrowthRate}%</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Projected 2025 Headcount</span>
                      <span className="text-lg font-semibold text-gold-600">
                        {Math.round((orgMetrics?.totalEmployees || 0) * (1 + (orgMetrics?.yearlyGrowthRate || 0) / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-sm shadow p-6">
              <ExecutiveTimeline
                title="All Organizational Alerts"
                variant="alert"
                items={alerts.map((alert): TimelineItem => ({
                  id: alert.id,
                  title: alert.title,
                  description: alert.description,
                  timestamp: alert.timestamp,
                  severity: alert.type as TimelineItem['severity'],
                  status: alert.category,
                  statusDomain: 'category',
                  meta: {
                    ...(alert.impact ? { impact: alert.impact } : {}),
                    ...(alert.department ? { department: alert.department } : {}),
                    ...(alert.location ? { location: alert.location } : {}),
                    ...(alert.recommendedAction ? { recommendation: alert.recommendedAction } : {}),
                    ...(alert.dueDate ? { due: new Date(alert.dueDate).toLocaleDateString() } : {}),
                  },
                }))}
                emptyMessage="No organizational alerts."
              />
            </div>
          </div>
        )}

        {/* Department Details Modal */}
        {selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDepartment.name} Department</h2>
                    <p className="text-gray-600 mt-1">{selectedDepartment.headcount} employees • {selectedDepartment.openPositions} open positions</p>
                  </div>
                  <button
                    onClick={() => setSelectedDepartment(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Metrics</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-sm p-4">
                          <p className="text-sm text-gray-500">Productivity Score</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.productivity}/5.0</p>
                        </div>
                        <div className="bg-gray-50 rounded-sm p-4">
                          <p className="text-sm text-gray-500">Satisfaction</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.satisfaction}/5.0</p>
                        </div>
                        <div className="bg-gray-50 rounded-sm p-4">
                          <p className="text-sm text-gray-500">Retention Rate</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.retention}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-sm p-4">
                          <p className="text-sm text-gray-500">Diversity Score</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.diversity}%</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Geographic Distribution</h3>
                      <div className="space-y-3">
                        {selectedDepartment.locations.map((loc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm">
                            <div className="flex items-center">
                              <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{loc.city}</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                loc.type === 'office' ? 'bg-gold-100 text-gold-800' :
                                loc.type === 'hybrid' ? 'bg-purple-100 text-purple-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {loc.type}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{loc.employees} employees</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Critical Open Roles</h3>
                      <div className="space-y-2">
                        {selectedDepartment.criticalRoles.map((role, index) => (
                          <div key={index} className="flex items-center p-2 bg-red-50 border border-red-200 rounded-sm">
                            <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-sm font-medium text-red-800">{role}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Milestones</h3>
                      <div className="space-y-3">
                        {selectedDepartment.upcomingMilestones.map((milestone, index) => (
                          <div key={index} className="p-3 border border-gray-200 rounded-sm">
                            <h4 className="text-sm font-medium text-gray-900">{milestone.title}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Date: {new Date(milestone.date).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full ${
                                milestone.type === 'hiring' ? 'bg-gold-100 text-gold-800' :
                                milestone.type === 'project' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {milestone.type}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Budget Overview</h3>
                      <div className="bg-gray-50 rounded-sm p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Annual Budget</span>
                          <span className="text-lg font-semibold text-gray-900">
                            R{(selectedDepartment.budget / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Average Salary</span>
                          <span className="text-sm font-medium text-gray-900">
                            R{selectedDepartment.averageSalary.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Utilization Rate</span>
                          <span className="text-sm font-medium text-gray-900">
                            {selectedDepartment.utilizationRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedDepartment(null)}
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
