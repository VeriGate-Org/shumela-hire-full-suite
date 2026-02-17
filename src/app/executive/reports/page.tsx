'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { 
  ChartBarIcon,
  DocumentChartBarIcon,
  PresentationChartLineIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserGroupIcon,
  BanknotesIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  UsersIcon,
  StarIcon,
  ChartPieIcon,
  DocumentTextIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ArrowPathIcon,
  PlusIcon,
  Cog6ToothIcon,
  ShareIcon,
  PrinterIcon,
  XMarkIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { 
  ChartBarIcon as ChartBarIconSolid,
  TrophyIcon as TrophyIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid
} from '@heroicons/react/24/solid';

interface ExecutiveMetrics {
  totalHires: number;
  totalRequisitions: number;
  averageTimeToHire: number;
  costPerHire: number;
  offerAcceptanceRate: number;
  candidateSatisfaction: number;
  diversityScore: number;
  retentionRate: number;
  monthlyTrend: number;
  quarterlyTrend: number;
  yearlyTrend: number;
}

interface DepartmentMetrics {
  department: string;
  openRequisitions: number;
  filledPositions: number;
  averageTimeToFill: number;
  costPerHire: number;
  offerAcceptanceRate: number;
  candidateQualityScore: number;
  urgentPositions: number;
  projectedNeed: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'strategic' | 'compliance' | 'performance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'on_demand';
  lastGenerated: string;
  nextScheduled?: string;
  status: 'active' | 'paused' | 'draft';
  recipients: string[];
  format: 'pdf' | 'excel' | 'dashboard' | 'presentation';
  automated: boolean;
  criticalMetrics: string[];
  insights: string[];
}

interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  metric: string;
  value: number;
  threshold: number;
  trend: 'up' | 'down' | 'stable';
  department?: string;
  recommendedAction: string;
  timestamp: string;
}

interface StrategicInsight {
  id: string;
  category: 'market_trends' | 'competitive_analysis' | 'talent_pipeline' | 'cost_optimization' | 'risk_assessment';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  dataPoints: Array<{
    metric: string;
    value: string;
    change: number;
  }>;
  recommendations: string[];
  timeframe: string;
}

export default function ExecutiveReportsPage() {
  const [executiveMetrics, setExecutiveMetrics] = useState<ExecutiveMetrics | null>(null);
  const [departmentMetrics, setDepartmentMetrics] = useState<DepartmentMetrics[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [performanceAlerts, setPerformanceAlerts] = useState<PerformanceAlert[]>([]);
  const [strategicInsights, setStrategicInsights] = useState<StrategicInsight[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'reports' | 'insights' | 'analytics'>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExecutiveData();
  }, [selectedPeriod]);

  const loadExecutiveData = async () => {
    setLoading(true);

    // Mock executive metrics
    const mockExecutiveMetrics: ExecutiveMetrics = {
      totalHires: 247,
      totalRequisitions: 89,
      averageTimeToHire: 28,
      costPerHire: 12500,
      offerAcceptanceRate: 87.3,
      candidateSatisfaction: 4.2,
      diversityScore: 73.5,
      retentionRate: 91.8,
      monthlyTrend: 8.5,
      quarterlyTrend: 15.2,
      yearlyTrend: 23.7
    };

    // Mock department metrics
    const mockDepartmentMetrics: DepartmentMetrics[] = [
      {
        department: 'Engineering',
        openRequisitions: 23,
        filledPositions: 67,
        averageTimeToFill: 32,
        costPerHire: 18500,
        offerAcceptanceRate: 89.2,
        candidateQualityScore: 4.3,
        urgentPositions: 8,
        projectedNeed: 45
      },
      {
        department: 'Product',
        openRequisitions: 12,
        filledPositions: 34,
        averageTimeToFill: 25,
        costPerHire: 15200,
        offerAcceptanceRate: 92.1,
        candidateQualityScore: 4.5,
        urgentPositions: 3,
        projectedNeed: 28
      },
      {
        department: 'Sales',
        openRequisitions: 18,
        filledPositions: 45,
        averageTimeToFill: 21,
        costPerHire: 9800,
        offerAcceptanceRate: 84.7,
        candidateQualityScore: 4.1,
        urgentPositions: 6,
        projectedNeed: 35
      },
      {
        department: 'Marketing',
        openRequisitions: 8,
        filledPositions: 22,
        averageTimeToFill: 19,
        costPerHire: 11200,
        offerAcceptanceRate: 88.9,
        candidateQualityScore: 4.4,
        urgentPositions: 2,
        projectedNeed: 15
      },
      {
        department: 'Operations',
        openRequisitions: 15,
        filledPositions: 38,
        averageTimeToFill: 26,
        costPerHire: 8900,
        offerAcceptanceRate: 85.3,
        candidateQualityScore: 4.0,
        urgentPositions: 4,
        projectedNeed: 22
      },
      {
        department: 'Customer Success',
        openRequisitions: 13,
        filledPositions: 41,
        averageTimeToFill: 23,
        costPerHire: 10500,
        offerAcceptanceRate: 90.8,
        candidateQualityScore: 4.2,
        urgentPositions: 5,
        projectedNeed: 19
      }
    ];

    // Mock report templates
    const mockReportTemplates: ReportTemplate[] = [
      {
        id: 'report_001',
        name: 'Executive Quarterly Review',
        description: 'Comprehensive quarterly talent acquisition and organizational health report for board presentation',
        category: 'executive',
        frequency: 'quarterly',
        lastGenerated: '2025-01-15T09:00:00Z',
        nextScheduled: '2025-04-15T09:00:00Z',
        status: 'active',
        recipients: ['ceo@company.com', 'board@company.com', 'investors@company.com'],
        format: 'presentation',
        automated: true,
        criticalMetrics: ['Cost per Hire', 'Time to Fill', 'Diversity Score', 'Retention Rate'],
        insights: ['Market competitiveness analysis', 'Talent pipeline health', 'Organizational scaling readiness']
      },
      {
        id: 'report_002',
        name: 'Monthly Talent Dashboard',
        description: 'Executive summary of key recruitment metrics and department performance',
        category: 'operational',
        frequency: 'monthly',
        lastGenerated: '2025-01-20T08:00:00Z',
        nextScheduled: '2025-02-20T08:00:00Z',
        status: 'active',
        recipients: ['ceo@company.com', 'cmo@company.com', 'cto@company.com'],
        format: 'dashboard',
        automated: true,
        criticalMetrics: ['Total Hires', 'Open Requisitions', 'Offer Acceptance Rate'],
        insights: ['Department hiring velocity', 'Budget utilization', 'Candidate pipeline strength']
      },
      {
        id: 'report_003',
        name: 'Strategic Workforce Planning',
        description: 'Annual strategic analysis of workforce needs and talent market trends',
        category: 'strategic',
        frequency: 'annual',
        lastGenerated: '2024-12-01T10:00:00Z',
        nextScheduled: '2025-12-01T10:00:00Z',
        status: 'active',
        recipients: ['executive-team@company.com', 'board-directors@company.com'],
        format: 'pdf',
        automated: false,
        criticalMetrics: ['Projected Headcount Growth', 'Skills Gap Analysis', 'Market Salary Trends'],
        insights: ['Future skill requirements', 'Competitive positioning', 'Investment priorities']
      },
      {
        id: 'report_004',
        name: 'Diversity & Inclusion Report',
        description: 'Quarterly analysis of D&I metrics and progress against organizational goals',
        category: 'compliance',
        frequency: 'quarterly',
        lastGenerated: '2025-01-10T11:00:00Z',
        nextScheduled: '2025-04-10T11:00:00Z',
        status: 'active',
        recipients: ['chief-diversity-officer@company.com', 'hr-leadership@company.com'],
        format: 'pdf',
        automated: true,
        criticalMetrics: ['Diversity Score', 'Inclusive Hiring Rate', 'Pay Equity Index'],
        insights: ['Progress against D&I goals', 'Pipeline diversity analysis', 'Retention by demographic']
      },
      {
        id: 'report_005',
        name: 'Recruitment ROI Analysis',
        description: 'Monthly analysis of recruitment investment returns and cost optimization opportunities',
        category: 'performance',
        frequency: 'monthly',
        lastGenerated: '2025-01-18T14:00:00Z',
        nextScheduled: '2025-02-18T14:00:00Z',
        status: 'active',
        recipients: ['cfo@company.com', 'vp-talent@company.com'],
        format: 'excel',
        automated: true,
        criticalMetrics: ['Cost per Hire', 'Source ROI', 'Time to Productivity'],
        insights: ['Channel effectiveness', 'Budget allocation optimization', 'Productivity forecasting']
      },
      {
        id: 'report_006',
        name: 'Competitive Intelligence Brief',
        description: 'Weekly intelligence on competitor hiring activities and market movements',
        category: 'strategic',
        frequency: 'weekly',
        lastGenerated: '2025-01-21T16:00:00Z',
        nextScheduled: '2025-01-28T16:00:00Z',
        status: 'active',
        recipients: ['ceo@company.com', 'chief-strategy-officer@company.com'],
        format: 'pdf',
        automated: false,
        criticalMetrics: ['Competitor Hiring Volume', 'Salary Benchmarking', 'Talent Movement'],
        insights: ['Market positioning', 'Competitive threats', 'Talent acquisition opportunities']
      }
    ];

    // Mock performance alerts
    const mockPerformanceAlerts: PerformanceAlert[] = [
      {
        id: 'alert_001',
        type: 'critical',
        title: 'Engineering Time-to-Fill Exceeding Target',
        description: 'Average time to fill engineering positions has exceeded 30-day target by 6.7%',
        metric: 'Average Time to Fill',
        value: 32,
        threshold: 30,
        trend: 'up',
        department: 'Engineering',
        recommendedAction: 'Review sourcing strategy and consider increasing recruiter capacity or external agency support',
        timestamp: '2025-01-22T10:30:00Z'
      },
      {
        id: 'alert_002',
        type: 'warning',
        title: 'Q1 Budget Utilization High',
        description: 'Recruitment budget utilization at 78% with 5 weeks remaining in quarter',
        metric: 'Budget Utilization',
        value: 78,
        threshold: 70,
        trend: 'up',
        recommendedAction: 'Monitor spending velocity and consider budget reallocation or approval for overage',
        timestamp: '2025-01-22T09:15:00Z'
      },
      {
        id: 'alert_003',
        type: 'info',
        title: 'Customer Success Exceeding Targets',
        description: 'Customer Success department achieving 127% of quarterly hiring targets',
        metric: 'Hiring Target Achievement',
        value: 127,
        threshold: 100,
        trend: 'up',
        department: 'Customer Success',
        recommendedAction: 'Leverage successful practices across other departments',
        timestamp: '2025-01-22T08:45:00Z'
      },
      {
        id: 'alert_004',
        type: 'warning',
        title: 'Candidate Pipeline Thinning',
        description: 'Overall candidate pipeline volume down 15% compared to previous month',
        metric: 'Pipeline Volume',
        value: 85,
        threshold: 100,
        trend: 'down',
        recommendedAction: 'Increase sourcing activities and review job posting optimization',
        timestamp: '2025-01-21T16:20:00Z'
      },
      {
        id: 'alert_005',
        type: 'critical',
        title: 'Diversity Hiring Below Target',
        description: 'Q1 diversity hiring rate at 62% vs 75% organizational target',
        metric: 'Diversity Hiring Rate',
        value: 62,
        threshold: 75,
        trend: 'down',
        recommendedAction: 'Review sourcing channels and implement targeted diversity initiatives',
        timestamp: '2025-01-21T14:10:00Z'
      }
    ];

    // Mock strategic insights
    const mockStrategicInsights: StrategicInsight[] = [
      {
        id: 'insight_001',
        category: 'market_trends',
        title: 'AI/ML Talent Market Acceleration',
        description: 'Demand for AI/ML professionals has increased 340% year-over-year with salary premiums averaging 28% above market rate',
        impact: 'high',
        confidence: 89,
        dataPoints: [
          { metric: 'Market Demand Increase', value: '340%', change: 45 },
          { metric: 'Salary Premium', value: '28%', change: 8 },
          { metric: 'Available Candidates', value: '15,000', change: -12 }
        ],
        recommendations: [
          'Establish AI Center of Excellence to attract top talent',
          'Create specialized compensation packages for AI roles',
          'Partner with universities for talent pipeline development',
          'Consider acquiring AI-focused teams from other companies'
        ],
        timeframe: 'Next 6-12 months'
      },
      {
        id: 'insight_002',
        category: 'competitive_analysis',
        title: 'Competitor Aggressive Hiring in Product',
        description: 'Three major competitors have increased product hiring by 60%+ in past quarter, indicating strategic product investments',
        impact: 'medium',
        confidence: 82,
        dataPoints: [
          { metric: 'Competitor Hiring Increase', value: '60%', change: 25 },
          { metric: 'Average Salary Offers', value: 'R185K', change: 15 },
          { metric: 'Time to Close Offers', value: '5 days', change: -30 }
        ],
        recommendations: [
          'Accelerate product team expansion timeline',
          'Review and adjust compensation benchmarks',
          'Streamline offer approval process',
          'Strengthen employee retention programs'
        ],
        timeframe: 'Immediate (next 30 days)'
      },
      {
        id: 'insight_003',
        category: 'talent_pipeline',
        title: 'Remote Work Preference Shift',
        description: 'Candidate preference for remote work options has stabilized at 85%, with hybrid models becoming the new baseline expectation',
        impact: 'high',
        confidence: 94,
        dataPoints: [
          { metric: 'Remote Work Preference', value: '85%', change: 2 },
          { metric: 'Hybrid Model Acceptance', value: '92%', change: 5 },
          { metric: 'Fully On-Site Acceptance', value: '23%', change: -8 }
        ],
        recommendations: [
          'Formalize flexible work policies',
          'Invest in remote collaboration technology',
          'Redesign office spaces for hybrid work',
          'Adjust job postings to highlight flexibility'
        ],
        timeframe: 'Next 3-6 months'
      },
      {
        id: 'insight_004',
        category: 'cost_optimization',
        title: 'Recruitment Channel ROI Analysis',
        description: 'Employee referrals show 3.2x higher ROI than external agencies, with 40% faster time-to-hire and 60% better retention rates',
        impact: 'medium',
        confidence: 91,
        dataPoints: [
          { metric: 'Referral ROI Multiple', value: '3.2x', change: 18 },
          { metric: 'Time to Hire Improvement', value: '40%', change: 5 },
          { metric: 'Retention Rate Bonus', value: '60%', change: 12 }
        ],
        recommendations: [
          'Expand employee referral program incentives',
          'Reduce dependency on external agencies by 30%',
          'Implement gamification for referral programs',
          'Create department-specific referral competitions'
        ],
        timeframe: 'Next 2-4 months'
      },
      {
        id: 'insight_005',
        category: 'risk_assessment',
        title: 'Key Person Dependency Risk',
        description: 'Analysis reveals 23% of critical roles have single-person dependencies, creating significant organizational risk',
        impact: 'high',
        confidence: 87,
        dataPoints: [
          { metric: 'Single-Person Dependencies', value: '23%', change: 7 },
          { metric: 'Average Replacement Time', value: '4.3 months', change: 15 },
          { metric: 'Business Impact Risk Score', value: '7.2/10', change: 8 }
        ],
        recommendations: [
          'Implement succession planning for critical roles',
          'Cross-train team members in essential functions',
          'Document institutional knowledge systematically',
          'Create emergency replacement protocols'
        ],
        timeframe: 'Next 1-3 months'
      }
    ];

    // Simulate loading delay
    setTimeout(() => {
      setExecutiveMetrics(mockExecutiveMetrics);
      setDepartmentMetrics(mockDepartmentMetrics);
      setReportTemplates(mockReportTemplates);
      setPerformanceAlerts(mockPerformanceAlerts);
      setStrategicInsights(mockStrategicInsights);
      setLoading(false);
    }, 1200);
  };

  const handleReportGeneration = (reportId: string) => {
    // Mock report generation
    console.log(`Generating report: ${reportId}`);
    // In real implementation, this would trigger report generation API
  };

  const handleReportScheduling = (reportId: string, frequency: string) => {
    setReportTemplates(prev =>
      prev.map(report =>
        report.id === reportId
          ? { ...report, frequency: frequency as any, status: 'active' }
          : report
      )
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ExclamationTriangleIconSolid className="w-5 h-5 text-red-500" />;
      case 'warning': return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
      case 'info': return <InformationCircleIcon className="w-5 h-5 text-primary" />;
      default: return <InformationCircleIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info': return 'bg-gold-50 border-primary/30 text-primary';
      default: return 'bg-muted border-border text-foreground';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'executive': return <TrophyIconSolid className="w-5 h-5" />;
      case 'operational': return <ChartBarIconSolid className="w-5 h-5" />;
      case 'strategic': return <LightBulbIcon className="w-5 h-5" />;
      case 'compliance': return <ShieldCheckIcon className="w-5 h-5" />;
      case 'performance': return <ArrowTrendingUpIcon className="w-5 h-5" />;
      default: return <DocumentTextIcon className="w-5 h-5" />;
    }
  };

  const filteredReports = reportTemplates.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || report.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const actions = (
    <div className="flex items-center gap-3">
      {activeView === 'reports' && (
        <>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
          >
            <option value="all">All Categories</option>
            <option value="executive">Executive</option>
            <option value="operational">Operational</option>
            <option value="strategic">Strategic</option>
            <option value="compliance">Compliance</option>
            <option value="performance">Performance</option>
          </select>
        </>
      )}
      
      <select
        value={selectedPeriod}
        onChange={(e) => setSelectedPeriod(e.target.value as any)}
        className="px-3 py-2 border border-border rounded-sm text-sm focus:ring-2 focus:ring-gold-500/60 focus:border-primary"
      >
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="quarter">This Quarter</option>
        <option value="year">This Year</option>
      </select>
      
      <button className="flex items-center px-4 py-2 bg-transparent border-2 border-gold-500 text-primary hover:bg-gold-500 hover:text-primary uppercase tracking-wider rounded-full text-sm font-medium">
        <PlusIcon className="w-4 h-4 mr-2" />
        New Report
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Executive Reports" subtitle="Loading executive analytics..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Executive Reports"
      subtitle="Strategic insights, performance analytics, and executive reporting"
      actions={actions}
    >
      <div className="space-y-6">
        {/* View Navigation */}
        <div className="bg-card rounded-sm shadow p-4">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', name: 'Executive Dashboard', icon: ChartBarIcon },
              { id: 'reports', name: 'Report Templates', icon: DocumentChartBarIcon },
              { id: 'insights', name: 'Strategic Insights', icon: LightBulbIcon },
              { id: 'analytics', name: 'Performance Analytics', icon: PresentationChartLineIcon }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                  activeView === item.id
                    ? 'bg-gold-100 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Executive Dashboard */}
        {activeView === 'dashboard' && executiveMetrics && (
          <div className="space-y-6">
            {/* Key Executive Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <UsersIcon className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Total Hires</p>
                    <p className="text-2xl font-semibold text-foreground">{executiveMetrics.totalHires}</p>
                    <p className="text-xs text-green-600">+{executiveMetrics.monthlyTrend}% vs last month</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <ClockIcon className="w-8 h-8 text-orange-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Avg Time to Hire</p>
                    <p className="text-2xl font-semibold text-foreground">{executiveMetrics.averageTimeToHire} days</p>
                    <p className="text-xs text-red-600">Target: 25 days</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-8 h-8 text-green-500" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Cost per Hire</p>
                    <p className="text-2xl font-semibold text-foreground">R{executiveMetrics.costPerHire.toLocaleString()}</p>
                    <p className="text-xs text-green-600">-12% vs industry avg</p>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <div className="flex items-center">
                  <TrophyIconSolid className="w-8 h-8 text-primary" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">Offer Acceptance</p>
                    <p className="text-2xl font-semibold text-foreground">{executiveMetrics.offerAcceptanceRate}%</p>
                    <p className="text-xs text-green-600">Above industry benchmark</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Alerts */}
            <div className="bg-card rounded-sm shadow">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Performance Alerts</h3>
              </div>
              <div className="p-6 space-y-4">
                {performanceAlerts.slice(0, 4).map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-sm border ${getAlertColor(alert.type)}`}>
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className="text-sm font-medium">{alert.title}</h4>
                        <p className="text-sm mt-1">{alert.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs">
                          <span>Value: {alert.value}{alert.metric.includes('Rate') ? '%' : alert.metric.includes('Cost') ? '$' : ''}</span>
                          <span>Threshold: {alert.threshold}{alert.metric.includes('Rate') ? '%' : alert.metric.includes('Cost') ? '$' : ''}</span>
                          {alert.department && <span>Department: {alert.department}</span>}
                        </div>
                        <p className="text-xs mt-2 font-medium">Recommendation: {alert.recommendedAction}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Performance */}
            <div className="bg-card rounded-sm shadow">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">Department Performance Overview</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {departmentMetrics.slice(0, 4).map((dept) => (
                    <div key={dept.department} className="border border-border rounded-sm p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-foreground">{dept.department}</h4>
                        <span className="text-sm text-muted-foreground">{dept.openRequisitions} open positions</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Filled Positions</p>
                          <p className="font-semibold text-foreground">{dept.filledPositions}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg Time to Fill</p>
                          <p className="font-semibold text-foreground">{dept.averageTimeToFill} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Cost per Hire</p>
                          <p className="font-semibold text-foreground">R{dept.costPerHire.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Acceptance Rate</p>
                          <p className="font-semibold text-foreground">{dept.offerAcceptanceRate}%</p>
                        </div>
                      </div>
                      
                      {dept.urgentPositions > 0 && (
                        <div className="mt-4 p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <span className="text-red-600 font-medium">{dept.urgentPositions} urgent positions</span> requiring immediate attention
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Templates */}
        {activeView === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {filteredReports.map((report) => (
                <div key={report.id} className="bg-card rounded-sm shadow border-l-4 border-l-primary">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getCategoryIcon(report.category)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{report.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                            <span>Category: <span className="font-medium text-foreground">{report.category}</span></span>
                            <span>Frequency: <span className="font-medium text-foreground">{report.frequency}</span></span>
                            <span>Format: <span className="font-medium text-foreground">{report.format.toUpperCase()}</span></span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          report.status === 'active' ? 'bg-green-100 text-green-800' :
                          report.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-muted text-foreground'
                        }`}>
                          {report.status.toUpperCase()}
                        </span>
                        {report.automated && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                            AUTOMATED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Critical Metrics</h4>
                        <div className="flex flex-wrap gap-1">
                          {report.criticalMetrics.map((metric, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                              {metric}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Key Insights</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {report.insights.map((insight, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-muted-foreground mr-2">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
                      <div className="flex items-center space-x-4 text-muted-foreground">
                        <span>Last Generated: {new Date(report.lastGenerated).toLocaleDateString()}</span>
                        {report.nextScheduled && (
                          <span>Next: {new Date(report.nextScheduled).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="flex items-center px-3 py-1 border border-border text-sm font-medium rounded-full text-foreground bg-card hover:bg-muted"
                        >
                          <EyeIcon className="w-4 h-4 mr-1" />
                          View
                        </button>

                        <button
                          onClick={() => handleReportGeneration(report.id)}
                          className="flex items-center px-3 py-1 border border-primary/40 text-sm font-medium rounded-full text-primary bg-gold-50 hover:bg-gold-100"
                        >
                          <PlayIcon className="w-4 h-4 mr-1" />
                          Generate
                        </button>

                        <button className="flex items-center px-3 py-1 border border-border text-sm font-medium rounded-full text-foreground bg-card hover:bg-muted">
                          <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strategic Insights */}
        {activeView === 'insights' && (
          <div className="space-y-6">
            {strategicInsights.map((insight) => (
              <div key={insight.id} className="bg-card rounded-sm shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{insight.title}</h3>
                      <p className="text-muted-foreground mt-2">{insight.description}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                          {insight.impact.toUpperCase()} IMPACT
                        </span>
                        <span className="text-sm text-muted-foreground">Confidence: {insight.confidence}%</span>
                        <span className="text-sm text-muted-foreground">Timeline: {insight.timeframe}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    {insight.dataPoints.map((point, index) => (
                      <div key={index} className="bg-muted rounded-sm p-4">
                        <h4 className="text-sm font-medium text-foreground">{point.metric}</h4>
                        <div className="flex items-center mt-2">
                          <span className="text-2xl font-bold text-foreground">{point.value}</span>
                          <div className={`ml-2 flex items-center text-sm ${
                            point.change > 0 ? 'text-green-600' : point.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                          }`}>
                            {point.change > 0 ? (
                              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                            ) : point.change < 0 ? (
                              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
                            ) : null}
                            {Math.abs(point.change)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-3">Strategic Recommendations</h4>
                    <div className="space-y-2">
                      {insight.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start">
                          <CheckCircleIconSolid className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Performance Analytics */}
        {activeView === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-sm shadow p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Hiring Velocity Trends</h3>
                <div className="text-center py-12">
                  <ChartBarIconSolid className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-foreground mb-2">Advanced Analytics Coming Soon</h4>
                  <p className="text-muted-foreground">Interactive charts and predictive analytics will be available in the next release.</p>
                </div>
              </div>

              <div className="bg-card rounded-sm shadow p-6">
                <h3 className="text-lg font-medium text-foreground mb-4">Cost Analysis</h3>
                <div className="text-center py-12">
                  <ChartPieIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-foreground mb-2">Detailed Cost Breakdown</h4>
                  <p className="text-muted-foreground">Comprehensive cost analysis and ROI tracking dashboard in development.</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-sm shadow p-6">
              <h3 className="text-lg font-medium text-foreground mb-4">Predictive Analytics Dashboard</h3>
              <div className="text-center py-12">
                <PresentationChartLineIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">AI-Powered Insights</h4>
                <p className="text-muted-foreground">Machine learning models for hiring predictions and market analysis coming soon.</p>
              </div>
            </div>
          </div>
        )}

        {/* Report Details Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedReport.name}</h2>
                    <p className="text-muted-foreground mt-2">{selectedReport.description}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-100 text-gold-800">
                        {selectedReport.category.toUpperCase()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {selectedReport.frequency.charAt(0).toUpperCase() + selectedReport.frequency.slice(1)} Report
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Format: {selectedReport.format.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="text-muted-foreground hover:text-muted-foreground"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Recipients</h3>
                      <div className="space-y-2">
                        {selectedReport.recipients.map((recipient, index) => (
                          <div key={index} className="flex items-center p-2 bg-muted rounded-sm">
                            <UsersIcon className="w-4 h-4 text-muted-foreground mr-2" />
                            <span className="text-sm text-foreground">{recipient}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Critical Metrics</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.criticalMetrics.map((metric, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gold-100 text-gold-800">
                            {metric}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Key Insights</h3>
                      <ul className="space-y-2">
                        {selectedReport.insights.map((insight, index) => (
                          <li key={index} className="flex items-start text-sm text-foreground">
                            <LightBulbIcon className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-3">Schedule Information</h3>
                      <div className="bg-muted rounded-sm p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frequency:</span>
                          <span className="font-medium">{selectedReport.frequency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Generated:</span>
                          <span className="font-medium">{new Date(selectedReport.lastGenerated).toLocaleDateString()}</span>
                        </div>
                        {selectedReport.nextScheduled && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Scheduled:</span>
                            <span className="font-medium">{new Date(selectedReport.nextScheduled).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Automation:</span>
                          <span className={`font-medium ${selectedReport.automated ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {selectedReport.automated ? 'Enabled' : 'Manual'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-4 py-2 bg-muted-foreground text-white rounded-full hover:bg-foreground"
                  >
                    Close
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <button className="flex items-center px-4 py-2 border border-border text-sm font-medium rounded-full text-foreground bg-card hover:bg-muted">
                      <Cog6ToothIcon className="w-4 h-4 mr-2" />
                      Configure
                    </button>

                    <button className="flex items-center px-4 py-2 border border-primary/40 text-sm font-medium rounded-full text-primary bg-gold-50 hover:bg-gold-100">
                      <ShareIcon className="w-4 h-4 mr-2" />
                      Share
                    </button>

                    <button
                      onClick={() => {
                        handleReportGeneration(selectedReport.id);
                        setSelectedReport(null);
                      }}
                      className="flex items-center px-6 py-2 bg-transparent border-2 border-gold-500 text-primary hover:bg-gold-500 hover:text-primary uppercase tracking-wider rounded-full text-sm font-medium"
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Generate Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
