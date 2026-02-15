'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  UserGroupIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ChartBarIcon,
  TrophyIcon,
  AcademicCapIcon,
  LinkIcon,
  StarIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  BriefcaseIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  LightBulbIcon,
  FireIcon,
  HandRaisedIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { 
  UserIcon as UserIconSolid,
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
  const [teamMetrics, setTeamMetrics] = useState<TeamMetrics | null>(null);
  const [alerts, setAlerts] = useState<LeadershipAlert[]>([]);
  const [selectedLeader, setSelectedLeader] = useState<LeadershipMember | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'directory' | 'performance' | 'succession'>('overview');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeadershipData();
  }, []);

  const loadLeadershipData = async () => {
    setLoading(true);

    // Mock team metrics
    const mockTeamMetrics: TeamMetrics = {
      totalLeaders: 12,
      avgExperience: 8.5,
      avgTenure: 2.8,
      diversityScore: 58.3,
      leadershipPipeline: 24,
      successionReadiness: 75.0,
      performanceScore: 4.2,
      retentionRate: 95.8
    };

    // Mock leadership members
    const mockLeaders: LeadershipMember[] = [
      {
        id: 'leader_001',
        name: 'Michael Chen',
        title: 'Chief Executive Officer',
        department: 'Executive',
        email: 'michael.chen@company.com',
        phone: '+27 11 123-4567',
        location: 'Johannesburg, Gauteng',
        avatar: '👨‍💼',
        joinDate: '2022-03-15',
        directReports: 5,
        totalReports: 1247,
        experience: {
          yearsTotal: 15,
          yearsAtCompany: 3,
          previousRoles: [
            { title: 'VP of Product', company: 'TechCorp', duration: '2019-2022' },
            { title: 'Director of Engineering', company: 'StartupXYZ', duration: '2016-2019' },
            { title: 'Senior Product Manager', company: 'BigTech Inc', duration: '2013-2016' }
          ]
        },
        education: [
          { degree: 'MBA', institution: 'Stanford Graduate School of Business', year: '2013' },
          { degree: 'BS Computer Science', institution: 'MIT', year: '2009' }
        ],
        skills: ['Strategic Leadership', 'Product Strategy', 'Venture Capital', 'Team Building', 'Public Speaking'],
        achievements: [
          {
            title: 'Series C Funding Round',
            description: 'Led successful R2.5 billion Series C funding round',
            date: '2025-01-15',
            impact: 'Secured runway for 4+ years of growth'
          },
          {
            title: 'Product Market Fit Achievement',
            description: 'Achieved product-market fit with 40%+ monthly growth',
            date: '2024-08-20',
            impact: 'Positioned company for scale and market leadership'
          }
        ],
        metrics: {
          teamPerformance: 4.5,
          employeeSatisfaction: 4.3,
          retentionRate: 96.2,
          budgetManagement: 4.4,
          goalAchievement: 4.6
        },
        currentFocus: [
          { initiative: 'European Expansion', priority: 'high', timeline: 'Q2 2025', status: 'on_track' },
          { initiative: 'AI Platform Launch', priority: 'high', timeline: 'Q2 2025', status: 'on_track' },
          { initiative: 'Series D Preparation', priority: 'medium', timeline: 'Q4 2025', status: 'on_track' }
        ],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/michaelchen',
          twitter: 'https://twitter.com/mchen_ceo'
        },
        bio: 'Visionary CEO with 15+ years of experience scaling technology companies from startup to IPO. Former VP of Product at TechCorp, led 3 successful exits. Passionate about AI/ML and sustainable technology.',
        strengths: ['Strategic Vision', 'Team Inspiration', 'Investor Relations', 'Product Innovation'],
        developmentAreas: ['International Operations', 'Public Company Readiness'],
        successionPlan: {
          readiness: 'ready',
          potentialSuccessors: ['Sarah Martinez', 'David Rodriguez'],
          timeToReplace: 18
        }
      },
      {
        id: 'leader_002',
        name: 'Sarah Martinez',
        title: 'Chief Technology Officer',
        department: 'Engineering',
        email: 'sarah.martinez@company.com',
        phone: '+27 21 234-5678',
        location: 'Cape Town, Western Cape',
        avatar: '👩‍💻',
        joinDate: '2022-06-01',
        reportingTo: 'leader_001',
        directReports: 8,
        totalReports: 387,
        experience: {
          yearsTotal: 12,
          yearsAtCompany: 3,
          previousRoles: [
            { title: 'VP of Engineering', company: 'CloudTech', duration: '2020-2022' },
            { title: 'Principal Engineer', company: 'DataSystems', duration: '2018-2020' },
            { title: 'Senior Software Engineer', company: 'TechGiant', duration: '2015-2018' }
          ]
        },
        education: [
          { degree: 'MS Computer Science', institution: 'Carnegie Mellon University', year: '2015' },
          { degree: 'BS Software Engineering', institution: 'UC Berkeley', year: '2013' }
        ],
        skills: ['System Architecture', 'Team Leadership', 'Cloud Infrastructure', 'AI/ML', 'Agile Development'],
        achievements: [
          {
            title: 'AI Platform Architecture',
            description: 'Designed and implemented scalable AI platform serving 10M+ requests/day',
            date: '2024-11-30',
            impact: '300% performance improvement, 60% cost reduction'
          },
          {
            title: 'Engineering Excellence Program',
            description: 'Established engineering standards improving code quality by 85%',
            date: '2024-05-15',
            impact: '40% reduction in production incidents, 25% faster delivery'
          }
        ],
        metrics: {
          teamPerformance: 4.4,
          employeeSatisfaction: 4.2,
          retentionRate: 91.5,
          budgetManagement: 4.3,
          goalAchievement: 4.4
        },
        currentFocus: [
          { initiative: 'AI Platform Scale', priority: 'high', timeline: 'Q2 2025', status: 'on_track' },
          { initiative: 'Engineering Hiring', priority: 'high', timeline: 'Q2 2025', status: 'at_risk' },
          { initiative: 'Tech Debt Reduction', priority: 'medium', timeline: 'Q3 2025', status: 'on_track' }
        ],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/sarahmartinez-cto',
          twitter: 'https://twitter.com/sarah_codes'
        },
        bio: 'Engineering leader with expertise in distributed systems and AI/ML infrastructure. Led engineering teams at multiple high-growth startups. Advocate for engineering excellence and diversity in tech.',
        strengths: ['Technical Leadership', 'System Design', 'Talent Development', 'Innovation'],
        developmentAreas: ['Public Speaking', 'Business Strategy'],
        successionPlan: {
          readiness: 'developing',
          potentialSuccessors: ['Alex Thompson', 'Maria Rodriguez'],
          timeToReplace: 12
        }
      },
      {
        id: 'leader_003',
        name: 'Jennifer Liu',
        title: 'Chief Financial Officer',
        department: 'Finance',
        email: 'jennifer.liu@company.com',
        location: 'Sandton, Gauteng',
        avatar: '👩‍💼',
        joinDate: '2023-01-10',
        reportingTo: 'leader_001',
        directReports: 6,
        totalReports: 45,
        experience: {
          yearsTotal: 14,
          yearsAtCompany: 2,
          previousRoles: [
            { title: 'CFO', company: 'FinTech Startup', duration: '2021-2023' },
            { title: 'VP Finance', company: 'GrowthCorp', duration: '2018-2021' },
            { title: 'Finance Director', company: 'BigBank', duration: '2015-2018' }
          ]
        },
        education: [
          { degree: 'MBA Finance', institution: 'Wharton School', year: '2015' },
          { degree: 'CPA', institution: 'AICPA', year: '2012' },
          { degree: 'BS Accounting', institution: 'NYU Stern', year: '2011' }
        ],
        skills: ['Financial Strategy', 'Investor Relations', 'Risk Management', 'M&A', 'Public Company Preparation'],
        achievements: [
          {
            title: 'Series C Funding Leadership',
            description: 'Led financial strategy and investor relations for R2.5 billion Series C',
            date: '2025-01-15',
            impact: 'Achieved 2.5x valuation increase, secured strategic investors'
          },
          {
            title: 'Financial Controls Implementation',
            description: 'Established SOX-compliant financial controls and reporting',
            date: '2024-07-01',
            impact: 'Reduced audit time by 40%, improved investor confidence'
          }
        ],
        metrics: {
          teamPerformance: 4.3,
          employeeSatisfaction: 4.1,
          retentionRate: 93.3,
          budgetManagement: 4.6,
          goalAchievement: 4.5
        },
        currentFocus: [
          { initiative: 'IPO Preparation', priority: 'high', timeline: 'Q4 2025', status: 'on_track' },
          { initiative: 'Financial Systems Upgrade', priority: 'medium', timeline: 'Q3 2025', status: 'on_track' },
          { initiative: 'Cost Optimization', priority: 'medium', timeline: 'Q2 2025', status: 'completed' }
        ],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/jenniferliu-cfo'
        },
        bio: 'Experienced CFO with proven track record in high-growth technology companies. Expert in fundraising, financial planning, and public company preparation. Former investment banker with deep capital markets experience.',
        strengths: ['Financial Analysis', 'Strategic Planning', 'Investor Relations', 'Risk Management'],
        developmentAreas: ['Technology Understanding', 'International Finance'],
        successionPlan: {
          readiness: 'developing',
          potentialSuccessors: ['Robert Kim', 'Lisa Anderson'],
          timeToReplace: 15
        }
      },
      {
        id: 'leader_004',
        name: 'David Rodriguez',
        title: 'Chief Human Resources Officer',
        department: 'HR',
        email: 'david.rodriguez@company.com',
        location: 'Stellenbosch, Western Cape',
        avatar: '👨‍💼',
        joinDate: '2022-09-15',
        reportingTo: 'leader_001',
        directReports: 7,
        totalReports: 89,
        experience: {
          yearsTotal: 11,
          yearsAtCompany: 2.5,
          previousRoles: [
            { title: 'VP People Operations', company: 'ScaleTech', duration: '2020-2022' },
            { title: 'Director HR', company: 'StartupHub', duration: '2017-2020' },
            { title: 'HR Business Partner', company: 'Enterprise Corp', duration: '2014-2017' }
          ]
        },
        education: [
          { degree: 'MS Organizational Psychology', institution: 'Columbia University', year: '2014' },
          { degree: 'BA Psychology', institution: 'University of Texas', year: '2012' }
        ],
        skills: ['People Strategy', 'Organizational Development', 'Talent Acquisition', 'Culture Building', 'Change Management'],
        achievements: [
          {
            title: 'Culture Transformation Program',
            description: 'Led company-wide culture initiative improving engagement by 35%',
            date: '2024-09-30',
            impact: 'Employee satisfaction increased to 4.3/5.0, turnover reduced by 25%'
          },
          {
            title: 'D&I Excellence Recognition',
            description: 'Achieved top 10% diversity score in tech industry benchmark',
            date: '2024-12-15',
            impact: 'Enhanced employer brand, improved hiring pipeline diversity'
          }
        ],
        metrics: {
          teamPerformance: 4.2,
          employeeSatisfaction: 4.4,
          retentionRate: 89.7,
          budgetManagement: 4.1,
          goalAchievement: 4.3
        },
        currentFocus: [
          { initiative: 'Leadership Development', priority: 'high', timeline: 'Q3 2025', status: 'on_track' },
          { initiative: 'Global HR Expansion', priority: 'high', timeline: 'Q2 2025', status: 'on_track' },
          { initiative: 'Performance Management Redesign', priority: 'medium', timeline: 'Q4 2025', status: 'on_track' }
        ],
        socialLinks: {
          linkedin: 'https://linkedin.com/in/davidrodriguez-chro'
        },
        bio: 'People-focused HR leader with expertise in scaling organizations and building high-performance cultures. Champion of diversity, equity, and inclusion. Former organizational psychologist with deep understanding of human behavior.',
        strengths: ['Culture Building', 'Talent Strategy', 'Leadership Development', 'Change Management'],
        developmentAreas: ['International HR Law', 'Executive Compensation'],
        successionPlan: {
          readiness: 'ready',
          potentialSuccessors: ['Amanda Thompson', 'Carlos Martinez'],
          timeToReplace: 9
        }
      }
    ];

    // Mock leadership alerts
    const mockAlerts: LeadershipAlert[] = [
      {
        id: 'alert_001',
        type: 'warning',
        leaderId: 'leader_002',
        title: 'Engineering Hiring Behind Schedule',
        description: 'Sarah Martinez flagged difficulty meeting Q1 engineering hiring targets',
        impact: 'Potential 2-month delay in AI platform delivery, affecting revenue projections',
        recommendedAction: 'Consider increasing recruiting budget, adding external agencies, or adjusting project timeline',
        urgency: 'high',
        timestamp: '2025-01-22T10:30:00Z'
      },
      {
        id: 'alert_002',
        type: 'opportunity',
        leaderId: 'leader_004',
        title: 'Culture Program Success',
        description: 'David Rodriguez culture transformation showing exceptional results',
        impact: 'Employee engagement up 35%, opportunity to scale program globally',
        recommendedAction: 'Document best practices and prepare for international rollout',
        urgency: 'medium',
        timestamp: '2025-01-21T14:15:00Z'
      },
      {
        id: 'alert_003',
        type: 'info',
        leaderId: 'leader_003',
        title: 'IPO Preparation Milestone',
        description: 'Jennifer Liu completed SOX compliance framework ahead of schedule',
        impact: 'Accelerated IPO readiness timeline by 6 months, reduced compliance risk',
        recommendedAction: 'Begin investor education and roadshow preparation',
        urgency: 'low',
        timestamp: '2025-01-20T11:45:00Z'
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setLeaders(mockLeaders);
      setTeamMetrics(mockTeamMetrics);
      setAlerts(mockAlerts);
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
      case 'critical': return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5 text-violet-500" />;
      case 'opportunity': return <LightBulbIcon className="w-5 h-5 text-green-500" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getReadinessColor = (readiness: string) => {
    switch (readiness) {
      case 'ready': return 'bg-green-100 text-green-800 border-green-300';
      case 'developing': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'not_ready': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800 border-green-300';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-violet-100 text-violet-800 border-violet-300';
      case 'delayed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
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
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
            />
          </div>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </>
      )}
      
      <button className="flex items-center px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        Export Directory
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Leadership Team" subtitle="Loading leadership data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
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
        <div className="bg-white rounded-lg shadow p-4">
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

        {/* Team Overview */}
        {activeView === 'overview' && teamMetrics && (
          <div className="space-y-6">
            {/* Key Leadership Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
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

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <TrophyIconSolid className="w-8 h-8 text-purple-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Performance Score</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMetrics.performanceScore}/5.0</p>
                    <p className="text-xs text-purple-600">Above expectations</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Succession Readiness</p>
                    <p className="text-2xl font-semibold text-gray-900">{teamMetrics.successionReadiness}%</p>
                    <p className="text-xs text-green-600">{teamMetrics.leadershipPipeline} in pipeline</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leadership Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}>
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Executive Team at a Glance</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {leaders.slice(0, 4).map((leader) => (
                    <div key={leader.id} className="text-center">
                      <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
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
                <div key={leader.id} className="bg-white rounded-lg shadow border-l-4 border-l-violet-500">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center text-xl">
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
                        className="flex items-center px-3 py-1 text-xs font-medium text-violet-600 bg-violet-50 rounded-full hover:bg-violet-100"
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
                            <span className={`px-2 py-1 rounded-full border ${getStatusColor(focus.status)}`}>
                              {focus.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        ))}
                        {leader.currentFocus.length > 2 && (
                          <p className="text-xs text-gray-500">+{leader.currentFocus.length - 2} more initiatives</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <a href={`mailto:${leader.email}`} className="flex items-center text-violet-600 hover:text-violet-800">
                        <EnvelopeIcon className="w-4 h-4 mr-1" />
                        Email
                      </a>
                      {leader.socialLinks.linkedin && (
                        <a href={leader.socialLinks.linkedin} className="flex items-center text-violet-600 hover:text-violet-800">
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leadership Performance Dashboard</h3>
              </div>
              <div className="p-6">
                <div className="space-y-8">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-lg">
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
                              <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${leader.metrics.teamPerformance * 20}%` }}></div>
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Leadership Succession Planning</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {leaders.map((leader) => (
                    <div key={leader.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-lg">
                            {leader.avatar}
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{leader.name}</h4>
                            <p className="text-sm text-gray-600">{leader.title}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getReadinessColor(leader.successionPlan.readiness)}`}>
                          {leader.successionPlan.readiness.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Succession Readiness</p>
                          <p className="text-sm text-gray-900">{leader.successionPlan.readiness.replace('_', ' ')}</p>
                          <p className="text-xs text-gray-500">Time to replace: {leader.successionPlan.timeToReplace} months</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Potential Successors</p>
                          <div className="space-y-1">
                            {leader.successionPlan.potentialSuccessors.map((successor, index) => (
                              <span key={index} className="inline-block text-xs px-2 py-1 bg-violet-100 text-violet-800 rounded-full mr-1">
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
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center text-2xl">
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
                        <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                          <h4 className="font-medium text-violet-900">{selectedLeader.title}</h4>
                          <p className="text-sm text-violet-700">Current Company • {selectedLeader.experience.yearsAtCompany} years</p>
                        </div>
                        {selectedLeader.experience.previousRoles.map((role, index) => (
                          <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
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
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{focus.initiative}</h4>
                              <p className="text-sm text-gray-600">Timeline: {focus.timeline}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                focus.priority === 'high' ? 'bg-red-100 text-red-800' :
                                focus.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {focus.priority.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(focus.status)}`}>
                                {focus.status.replace('_', ' ').toUpperCase()}
                              </span>
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
                          <a href={`mailto:${selectedLeader.email}`} className="text-violet-600 hover:text-violet-800">
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
                            <div className="bg-violet-500 h-2 rounded-full" style={{ width: `${selectedLeader.metrics.teamPerformance * 20}%` }}></div>
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
