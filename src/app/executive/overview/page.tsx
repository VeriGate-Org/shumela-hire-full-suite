'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  ChartBarIcon,
  GlobeAltIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  DocumentTextIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  BanknotesIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  Cog6ToothIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  XMarkIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
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
  const [locations, setLocations] = useState<Location[]>([]);
  const [alerts, setAlerts] = useState<OrganizationalAlert[]>([]);
  const [milestones, setMilestones] = useState<CompanyMilestone[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'departments' | 'locations' | 'insights'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationalData();
  }, [selectedPeriod]);

  const loadOrganizationalData = async () => {
    setLoading(true);

    // Mock organization metrics
    const mockOrgMetrics: OrganizationMetrics = {
      totalEmployees: 1247,
      totalContractors: 189,
      totalOpenPositions: 87,
      monthlyGrowthRate: 3.2,
      quarterlyGrowthRate: 12.8,
      yearlyGrowthRate: 47.3,
      averageTenure: 2.8,
      turnoverRate: 8.5,
      engagementScore: 4.3,
      diversityScore: 68.5,
      remoteWorkPercentage: 73.2,
      averageSalary: 95000
    };

    // Mock departments
    const mockDepartments: Department[] = [
      {
        id: 'engineering',
        name: 'Engineering',
        headcount: 387,
        openPositions: 23,
        budget: 58500000,
        utilizationRate: 94.2,
        averageSalary: 125000,
        growthTarget: 15,
        currentGrowth: 12.8,
        keyMetrics: {
          productivity: 4.4,
          satisfaction: 4.2,
          retention: 91.5,
          diversity: 32.1
        },
        recentChanges: {
          newHires: 18,
          departures: 5,
          promotions: 12
        },
        locations: [
          { city: 'San Francisco', employees: 195, type: 'office' },
          { city: 'Austin', employees: 89, type: 'hybrid' },
          { city: 'Remote', employees: 103, type: 'remote' }
        ],
        criticalRoles: ['Staff Engineer', 'Principal Architect', 'Engineering Manager'],
        upcomingMilestones: [
          { title: 'Q2 Hiring Sprint', date: '2025-02-15', type: 'hiring' },
          { title: 'Architecture Review', date: '2025-03-01', type: 'project' }
        ]
      },
      {
        id: 'product',
        name: 'Product',
        headcount: 124,
        openPositions: 12,
        budget: 18700000,
        utilizationRate: 89.7,
        averageSalary: 135000,
        growthTarget: 20,
        currentGrowth: 18.5,
        keyMetrics: {
          productivity: 4.5,
          satisfaction: 4.4,
          retention: 93.2,
          diversity: 45.8
        },
        recentChanges: {
          newHires: 8,
          departures: 2,
          promotions: 6
        },
        locations: [
          { city: 'San Francisco', employees: 67, type: 'office' },
          { city: 'New York', employees: 31, type: 'hybrid' },
          { city: 'Remote', employees: 26, type: 'remote' }
        ],
        criticalRoles: ['Senior Product Manager', 'Product Designer', 'Data Analyst'],
        upcomingMilestones: [
          { title: 'Product Strategy Review', date: '2025-02-28', type: 'project' },
          { title: 'Design System Launch', date: '2025-03-15', type: 'project' }
        ]
      },
      {
        id: 'sales',
        name: 'Sales',
        headcount: 198,
        openPositions: 18,
        budget: 29800000,
        utilizationRate: 96.8,
        averageSalary: 98000,
        growthTarget: 25,
        currentGrowth: 22.7,
        keyMetrics: {
          productivity: 4.1,
          satisfaction: 4.0,
          retention: 87.3,
          diversity: 41.2
        },
        recentChanges: {
          newHires: 15,
          departures: 8,
          promotions: 9
        },
        locations: [
          { city: 'New York', employees: 89, type: 'office' },
          { city: 'Chicago', employees: 54, type: 'hybrid' },
          { city: 'Remote', employees: 55, type: 'remote' }
        ],
        criticalRoles: ['Enterprise AE', 'Sales Development Rep', 'Sales Engineer'],
        upcomingMilestones: [
          { title: 'Q1 Sales Kickoff', date: '2025-02-01', type: 'project' },
          { title: 'Territory Expansion', date: '2025-03-30', type: 'hiring' }
        ]
      },
      {
        id: 'marketing',
        name: 'Marketing',
        headcount: 87,
        openPositions: 8,
        budget: 13200000,
        utilizationRate: 91.3,
        averageSalary: 89000,
        growthTarget: 18,
        currentGrowth: 15.2,
        keyMetrics: {
          productivity: 4.3,
          satisfaction: 4.2,
          retention: 89.7,
          diversity: 52.3
        },
        recentChanges: {
          newHires: 6,
          departures: 3,
          promotions: 4
        },
        locations: [
          { city: 'San Francisco', employees: 43, type: 'office' },
          { city: 'Austin', employees: 28, type: 'hybrid' },
          { city: 'Remote', employees: 16, type: 'remote' }
        ],
        criticalRoles: ['Growth Marketing Manager', 'Content Strategist', 'Brand Designer'],
        upcomingMilestones: [
          { title: 'Brand Refresh Launch', date: '2025-02-20', type: 'project' },
          { title: 'Marketing Tech Stack', date: '2025-04-01', type: 'project' }
        ]
      },
      {
        id: 'operations',
        name: 'Operations',
        headcount: 156,
        openPositions: 15,
        budget: 23400000,
        utilizationRate: 88.9,
        averageSalary: 78000,
        growthTarget: 12,
        currentGrowth: 10.8,
        keyMetrics: {
          productivity: 4.2,
          satisfaction: 4.1,
          retention: 85.4,
          diversity: 47.9
        },
        recentChanges: {
          newHires: 9,
          departures: 6,
          promotions: 7
        },
        locations: [
          { city: 'Austin', employees: 78, type: 'office' },
          { city: 'Denver', employees: 41, type: 'hybrid' },
          { city: 'Remote', employees: 37, type: 'remote' }
        ],
        criticalRoles: ['Operations Manager', 'Business Analyst', 'Process Engineer'],
        upcomingMilestones: [
          { title: 'ERP System Upgrade', date: '2025-03-10', type: 'project' },
          { title: 'Ops Center Expansion', date: '2025-05-15', type: 'project' }
        ]
      },
      {
        id: 'customer_success',
        name: 'Customer Success',
        headcount: 112,
        openPositions: 11,
        budget: 16800000,
        utilizationRate: 93.5,
        averageSalary: 85000,
        growthTarget: 22,
        currentGrowth: 24.1,
        keyMetrics: {
          productivity: 4.4,
          satisfaction: 4.3,
          retention: 92.8,
          diversity: 49.1
        },
        recentChanges: {
          newHires: 12,
          departures: 3,
          promotions: 8
        },
        locations: [
          { city: 'San Francisco', employees: 45, type: 'office' },
          { city: 'Chicago', employees: 34, type: 'hybrid' },
          { city: 'Remote', employees: 33, type: 'remote' }
        ],
        criticalRoles: ['Customer Success Manager', 'Technical Account Manager', 'Support Engineer'],
        upcomingMilestones: [
          { title: 'Customer Health Platform', date: '2025-02-28', type: 'project' },
          { title: 'Enterprise Team Build', date: '2025-04-15', type: 'hiring' }
        ]
      }
    ];

    // Mock locations
    const mockLocations: Location[] = [
      {
        id: 'sf_hq',
        name: 'San Francisco HQ',
        type: 'headquarters',
        address: '123 Market Street, San Francisco, CA 94105',
        employees: 450,
        capacity: 600,
        operationalCost: 2100000,
        departments: ['Engineering', 'Product', 'Marketing', 'Customer Success'],
        amenities: ['Gym', 'Cafeteria', 'Game Room', 'Parking', 'Rooftop', 'Meditation Room'],
        utilization: 75.0,
        expansion: true,
        leaseExpiry: '2027-12-31'
      },
      {
        id: 'austin_office',
        name: 'Austin Office',
        type: 'office',
        address: '456 Congress Avenue, Austin, TX 78701',
        employees: 195,
        capacity: 250,
        operationalCost: 890000,
        departments: ['Engineering', 'Marketing', 'Operations'],
        amenities: ['Kitchen', 'Meeting Rooms', 'Parking', 'Bike Storage'],
        utilization: 78.0,
        expansion: false,
        leaseExpiry: '2026-06-30'
      },
      {
        id: 'ny_office',
        name: 'New York Office',
        type: 'office',
        address: '789 Broadway, New York, NY 10003',
        employees: 120,
        capacity: 150,
        operationalCost: 1350000,
        departments: ['Product', 'Sales'],
        amenities: ['Reception', 'Conference Rooms', 'Kitchen', 'Lounge'],
        utilization: 80.0,
        expansion: false,
        leaseExpiry: '2025-09-30'
      },
      {
        id: 'chicago_office',
        name: 'Chicago Office',
        type: 'office',
        address: '321 West Loop, Chicago, IL 60606',
        employees: 88,
        capacity: 120,
        operationalCost: 720000,
        departments: ['Sales', 'Customer Success'],
        amenities: ['Meeting Rooms', 'Kitchen', 'City Views'],
        utilization: 73.3,
        expansion: true,
        leaseExpiry: '2026-12-31'
      },
      {
        id: 'denver_coworking',
        name: 'Denver Co-working Hub',
        type: 'coworking',
        address: '555 17th Street, Denver, CO 80202',
        employees: 41,
        capacity: 60,
        operationalCost: 180000,
        departments: ['Operations'],
        amenities: ['Hot Desks', 'Meeting Rooms', 'Coffee Bar'],
        utilization: 68.3,
        expansion: false
      },
      {
        id: 'remote_workforce',
        name: 'Remote Workforce',
        type: 'remote_hub',
        address: 'Global Remote Employees',
        employees: 353,
        capacity: 1000,
        operationalCost: 850000,
        departments: ['Engineering', 'Product', 'Sales', 'Marketing', 'Operations', 'Customer Success'],
        amenities: ['Home Office Stipend', 'Co-working Credits', 'Quarterly Meetups'],
        utilization: 35.3,
        expansion: true
      }
    ];

    // Mock alerts
    const mockAlerts: OrganizationalAlert[] = [
      {
        id: 'alert_001',
        type: 'critical',
        category: 'compliance',
        title: 'New York Office Lease Expiring Soon',
        description: 'NYC office lease expires in 7 months with 120 employees currently based there',
        impact: 'High disruption risk for Product and Sales teams, potential relocation costs R2.5M+',
        location: 'New York Office',
        recommendedAction: 'Initiate lease renewal negotiations or identify alternative office space by March 2025',
        urgency: 'high',
        timestamp: '2025-01-22T09:00:00Z',
        dueDate: '2025-03-01T00:00:00Z'
      },
      {
        id: 'alert_002',
        type: 'opportunity',
        category: 'performance',
        title: 'Customer Success Exceeding Growth Targets',
        description: 'Customer Success team at 124% of growth target with strong retention metrics',
        impact: 'Opportunity to accelerate expansion and capture market share in customer success',
        department: 'Customer Success',
        recommendedAction: 'Consider additional headcount allocation and expansion budget for Q2',
        urgency: 'medium',
        timestamp: '2025-01-21T14:30:00Z'
      },
      {
        id: 'alert_003',
        type: 'warning',
        category: 'headcount',
        title: 'Engineering Critical Role Vacancies',
        description: '3 critical Staff Engineer positions vacant for 60+ days, impacting delivery timelines',
        impact: 'Delayed product roadmap delivery, potential customer impact, team burnout risk',
        department: 'Engineering',
        recommendedAction: 'Escalate recruitment efforts, consider contractor bridge resources, review compensation packages',
        urgency: 'high',
        timestamp: '2025-01-20T11:15:00Z'
      },
      {
        id: 'alert_004',
        type: 'info',
        category: 'culture',
        title: 'Remote Work Percentage Above Industry Average',
        description: '73.2% of workforce working remotely, significantly above 58% industry average',
        impact: 'Strong competitive advantage for talent acquisition, reduced office costs',
        recommendedAction: 'Leverage remote-first positioning in employer branding and recruitment marketing',
        urgency: 'low',
        timestamp: '2025-01-19T16:45:00Z'
      },
      {
        id: 'alert_005',
        type: 'warning',
        category: 'budget',
        title: 'San Francisco Office Utilization Below Optimal',
        description: 'SF HQ at 75% utilization despite R2.1M annual operational cost',
        impact: 'Potential cost optimization opportunity of R500K+ annually',
        location: 'San Francisco HQ',
        recommendedAction: 'Review space efficiency, consider downsizing or subleasing unused space',
        urgency: 'medium',
        timestamp: '2025-01-18T13:20:00Z'
      }
    ];

    // Mock milestones
    const mockMilestones: CompanyMilestone[] = [
      {
        id: 'milestone_001',
        title: 'Series C Funding Completion',
        description: 'Successfully closed R150M Series C round led by top-tier VCs',
        date: '2025-01-15',
        type: 'funding',
        status: 'completed',
        impact: 'high',
        departments: ['All'],
        metrics: {
          employeesImpacted: 1247,
          budgetImpact: 150000000,
          timelineWeeks: 24
        }
      },
      {
        id: 'milestone_002',
        title: 'European Market Expansion',
        description: 'Launch operations in London and Amsterdam with local teams',
        date: '2025-03-15',
        type: 'expansion',
        status: 'in_progress',
        impact: 'high',
        departments: ['Sales', 'Customer Success', 'Engineering'],
        metrics: {
          employeesImpacted: 450,
          budgetImpact: 25000000,
          timelineWeeks: 32
        }
      },
      {
        id: 'milestone_003',
        title: 'AI Platform Launch',
        description: 'Release of next-generation AI-powered product suite',
        date: '2025-04-30',
        type: 'launch',
        status: 'in_progress',
        impact: 'high',
        departments: ['Engineering', 'Product', 'Marketing'],
        metrics: {
          employeesImpacted: 615,
          budgetImpact: 45000000,
          timelineWeeks: 48
        }
      },
      {
        id: 'milestone_004',
        title: 'Diversity & Inclusion Initiative',
        description: 'Company-wide D&I program targeting 40% underrepresented groups by 2026',
        date: '2025-02-01',
        type: 'achievement',
        status: 'in_progress',
        impact: 'medium',
        departments: ['All'],
        metrics: {
          employeesImpacted: 1247,
          budgetImpact: 5000000,
          timelineWeeks: 52
        }
      },
      {
        id: 'milestone_005',
        title: 'Strategic Partnership with Enterprise',
        description: 'Multi-year partnership agreement with Fortune 100 company',
        date: '2025-05-15',
        type: 'partnership',
        status: 'planned',
        impact: 'high',
        departments: ['Sales', 'Engineering', 'Customer Success'],
        metrics: {
          employeesImpacted: 780,
          budgetImpact: 75000000,
          timelineWeeks: 20
        }
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setOrgMetrics(mockOrgMetrics);
      setDepartments(mockDepartments);
      setLocations(mockLocations);
      setAlerts(mockAlerts);
      setMilestones(mockMilestones);
      setLoading(false);
    }, 1200);
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-violet-50 border-violet-200 text-violet-800';
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

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress': return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          />
        </div>
      )}
      
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value as any)}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
      >
        <option value="month">This Month</option>
        <option value="quarter">This Quarter</option>
        <option value="year">This Year</option>
      </select>
      
      <button className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        Export Report
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Organizational Overview" subtitle="Loading organizational data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
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
        <div className="bg-white rounded-lg shadow p-4">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-violet-100 text-violet-700'
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
              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Critical Organizational Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                {alerts.filter(alert => alert.urgency === 'high' || alert.type === 'critical').slice(0, 3).map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.description}</p>
                        <p className="text-sm mt-2 text-gray-600">Impact: {alert.impact}</p>
                        <p className="text-xs mt-2 font-medium">Action Required: {alert.recommendedAction}</p>
                        {alert.dueDate && (
                          <p className="text-xs mt-1 text-red-600">
                            Due: {new Date(alert.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Company Milestones */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Strategic Milestones</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {milestones.slice(0, 4).map((milestone) => (
                    <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMilestoneStatusColor(milestone.status)}`}>
                              {milestone.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                          <div className="flex items-center space-x-6 text-sm text-gray-500">
                            <span>Target Date: {new Date(milestone.date).toLocaleDateString()}</span>
                            {milestone.metrics && (
                              <>
                                <span>Employees Impacted: {milestone.metrics.employeesImpacted.toLocaleString()}</span>
                                <span>Budget: R{(milestone.metrics.budgetImpact / 1000000).toFixed(0)}M</span>
                              </>
                            )}
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

        {/* Department Analysis */}
        {activeView === 'departments' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredDepartments.map((dept) => (
                <div key={dept.id} className="bg-white rounded-lg shadow border-l-4 border-l-violet-500">
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
                        className="flex items-center px-3 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100"
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
                        <span className="flex items-center text-violet-600">
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
                <div key={location.id} className="bg-white rounded-lg shadow">
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
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
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
                      <div className={`p-2 rounded-lg text-sm ${
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
              <div className="bg-white rounded-lg shadow p-6">
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
                    <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${orgMetrics?.diversityScore}%` }}></div>
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

              <div className="bg-white rounded-lg shadow p-6">
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
                      <span className="text-lg font-semibold text-violet-600">
                        {Math.round((orgMetrics?.totalEmployees || 0) * (1 + (orgMetrics?.yearlyGrowthRate || 0) / 100)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">All Organizational Alerts</h3>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium">{alert.title}</h4>
                          <span className="text-xs px-2 py-1 rounded-full bg-white bg-opacity-50">
                            {alert.category.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm">{alert.description}</p>
                        <p className="text-sm mt-1 text-gray-600">Impact: {alert.impact}</p>
                        {(alert.department || alert.location) && (
                          <p className="text-xs mt-1">
                            {alert.department && `Department: ${alert.department}`}
                            {alert.location && `Location: ${alert.location}`}
                          </p>
                        )}
                        <p className="text-xs mt-2 font-medium">Recommended Action: {alert.recommendedAction}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {new Date(alert.timestamp).toLocaleDateString()}
                          </span>
                          {alert.dueDate && (
                            <span className="text-xs text-red-600 font-medium">
                              Due: {new Date(alert.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Department Details Modal */}
        {selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Productivity Score</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.productivity}/5.0</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Satisfaction</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.satisfaction}/5.0</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Retention Rate</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.retention}%</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-500">Diversity Score</p>
                          <p className="text-xl font-semibold text-gray-900">{selectedDepartment.keyMetrics.diversity}%</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Geographic Distribution</h3>
                      <div className="space-y-3">
                        {selectedDepartment.locations.map((loc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">{loc.city}</span>
                              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                loc.type === 'office' ? 'bg-violet-100 text-violet-800' :
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
                          <div key={index} className="flex items-center p-2 bg-red-50 border border-red-200 rounded-lg">
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
                          <div key={index} className="p-3 border border-gray-200 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900">{milestone.title}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                              <span>Date: {new Date(milestone.date).toLocaleDateString()}</span>
                              <span className={`px-2 py-1 rounded-full ${
                                milestone.type === 'hiring' ? 'bg-violet-100 text-violet-800' :
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
                      <div className="bg-gray-50 rounded-lg p-4">
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
                    className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
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
