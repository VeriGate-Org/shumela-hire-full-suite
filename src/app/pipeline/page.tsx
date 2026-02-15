'use client';

import { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import {
  FunnelIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  CalendarIcon,
  BriefcaseIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { pipelineApplicationStatusConfig, getStatusConfig } from '@/utils/statusIcons';

interface PipelineStage {
  id: string;
  name: string;
  displayName: string;
  order: number;
  color: string;
  icon: React.ComponentType<any>;
  description: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
}

interface Application {
  id: string;
  candidate: Candidate;
  job: Job;
  currentStage: string;
  submittedAt: string;
  lastActivity: string;
  daysInStage: number;
  progress: number;
  status: 'active' | 'hired' | 'rejected' | 'withdrawn';
  priority: 'low' | 'medium' | 'high';
  notes: string[];
  timeline: Array<{
    stage: string;
    date: string;
    action: string;
    actor: string;
    notes?: string;
  }>;
}

interface PipelineMetrics {
  totalApplications: number;
  activeApplications: number;
  averageTimeToHire: number;
  conversionRate: number;
  stageMetrics: Record<string, {
    count: number;
    averageDays: number;
    conversionRate: number;
  }>;
}

export default function PipelinePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'funnel'>('kanban');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pipelineStages: PipelineStage[] = [
    {
      id: 'applied',
      name: 'applied',
      displayName: 'Applied',
      order: 1,
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: UserIcon,
      description: 'Initial application submitted'
    },
    {
      id: 'screening',
      name: 'screening',
      displayName: 'Screening',
      order: 2,
      color: 'bg-violet-100 text-violet-800 border-violet-300',
      icon: EyeIcon,
      description: 'Resume and initial screening'
    },
    {
      id: 'phone_interview',
      name: 'phone_interview',
      displayName: 'Phone Interview',
      order: 3,
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: CalendarIcon,
      description: 'Initial phone/video screening'
    },
    {
      id: 'technical_interview',
      name: 'technical_interview',
      displayName: 'Technical Interview',
      order: 4,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: BriefcaseIcon,
      description: 'Technical assessment and interview'
    },
    {
      id: 'final_interview',
      name: 'final_interview',
      displayName: 'Final Interview',
      order: 5,
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: UserGroupIcon,
      description: 'Final round with hiring manager'
    },
    {
      id: 'offer',
      name: 'offer',
      displayName: 'Offer',
      order: 6,
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircleIcon,
      description: 'Offer extended to candidate'
    },
    {
      id: 'hired',
      name: 'hired',
      displayName: 'Hired',
      order: 7,
      color: 'bg-green-600 text-white border-green-600',
      icon: CheckCircleIcon,
      description: 'Successfully hired'
    }
  ];

  useEffect(() => {
    loadPipelineData();
  }, []);

  const loadPipelineData = async () => {
    setLoading(true);
    
    // Generate comprehensive mock data
    const mockApplications: Application[] = [];
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];
    const locations = ['New York', 'San Francisco', 'Austin', 'Remote', 'London', 'Toronto'];
    const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
    const priorities = ['low', 'medium', 'high'] as const;

    for (let i = 1; i <= 150; i++) {
      const submittedDate = new Date();
      submittedDate.setDate(submittedDate.getDate() - Math.floor(Math.random() * 90));
      
      const lastActivityDate = new Date();
      lastActivityDate.setDate(lastActivityDate.getDate() - Math.floor(Math.random() * 30));

      const currentStageIndex = Math.floor(Math.random() * pipelineStages.length);
      const currentStage = pipelineStages[currentStageIndex];
      
      let status: 'active' | 'hired' | 'rejected' | 'withdrawn' = 'active';
      if (currentStage.id === 'hired') status = 'hired';
      else if (Math.random() < 0.1) status = 'rejected';
      else if (Math.random() < 0.05) status = 'withdrawn';

      const application: Application = {
        id: `app_${i.toString().padStart(3, '0')}`,
        candidate: {
          id: `candidate_${i}`,
          firstName: `Candidate`,
          lastName: `${i}`,
          email: `candidate${i}@email.com`,
          phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`
        },
        job: {
          id: `job_${Math.floor(Math.random() * 20) + 1}`,
          title: [
            'Senior Software Engineer', 'Marketing Manager', 'Sales Representative',
            'HR Coordinator', 'Financial Analyst', 'Product Manager', 'UX Designer',
            'Data Scientist', 'DevOps Engineer', 'Content Writer'
          ][Math.floor(Math.random() * 10)],
          department: departments[Math.floor(Math.random() * departments.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          type: jobTypes[Math.floor(Math.random() * jobTypes.length)]
        },
        currentStage: currentStage.id,
        submittedAt: submittedDate.toISOString(),
        lastActivity: lastActivityDate.toISOString(),
        daysInStage: Math.floor(Math.random() * 30) + 1,
        progress: (currentStageIndex / (pipelineStages.length - 1)) * 100,
        status,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        notes: [
          'Strong technical background',
          'Great cultural fit',
          'Excellent communication skills'
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        timeline: generateTimeline(submittedDate, currentStageIndex)
      };

      mockApplications.push(application);
    }

    // Simulate loading delay
    setTimeout(() => {
      setApplications(mockApplications);
      setLoading(false);
    }, 800);
  };

  const generateTimeline = (startDate: Date, currentStageIndex: number) => {
    const timeline = [];
    const actors = ['Sarah Wilson', 'Michael Chen', 'Emily Rodriguez', 'James Park'];

    for (let i = 0; i <= currentStageIndex; i++) {
      const stage = pipelineStages[i];
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * 7); // 7 days between stages

      timeline.push({
        stage: stage.displayName,
        date: date.toISOString(),
        action: i === 0 ? 'Applied' : `Progressed to ${stage.displayName}`,
        actor: i === 0 ? 'System' : actors[Math.floor(Math.random() * actors.length)],
        notes: i > 0 ? 'Candidate met requirements for progression' : undefined
      });
    }

    return timeline;
  };

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesStage = selectedStage === 'all' || app.currentStage === selectedStage;
      const matchesSearch = searchTerm === '' || 
        app.candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStage && matchesSearch;
    });
  }, [applications, selectedStage, searchTerm]);

  const pipelineMetrics = useMemo((): PipelineMetrics => {
    const totalApplications = applications.length;
    const activeApplications = applications.filter(app => app.status === 'active').length;
    const hiredApplications = applications.filter(app => app.status === 'hired').length;
    
    const averageTimeToHire = applications
      .filter(app => app.status === 'hired')
      .reduce((sum, app) => {
        const days = Math.floor((new Date().getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / Math.max(hiredApplications, 1);

    const conversionRate = totalApplications > 0 ? (hiredApplications / totalApplications) * 100 : 0;

    const stageMetrics: Record<string, { count: number; averageDays: number; conversionRate: number }> = {};
    
    pipelineStages.forEach(stage => {
      const stageApplications = applications.filter(app => app.currentStage === stage.id);
      const averageDays = stageApplications.reduce((sum, app) => sum + app.daysInStage, 0) / Math.max(stageApplications.length, 1);
      
      stageMetrics[stage.id] = {
        count: stageApplications.length,
        averageDays: Math.round(averageDays),
        conversionRate: totalApplications > 0 ? (stageApplications.length / totalApplications) * 100 : 0
      };
    });

    return {
      totalApplications,
      activeApplications,
      averageTimeToHire: Math.round(averageTimeToHire),
      conversionRate: Math.round(conversionRate * 10) / 10,
      stageMetrics
    };
  }, [applications, pipelineStages]);

  const handleStageTransition = (applicationId: string, newStage: string, notes?: string) => {
    setApplications(prev => prev.map(app => {
      if (app.id === applicationId) {
        const newStageIndex = pipelineStages.findIndex(s => s.id === newStage);
        return {
          ...app,
          currentStage: newStage,
          progress: (newStageIndex / (pipelineStages.length - 1)) * 100,
          lastActivity: new Date().toISOString(),
          daysInStage: 0,
          timeline: [
            ...app.timeline,
            {
              stage: pipelineStages[newStageIndex]?.displayName || newStage,
              date: new Date().toISOString(),
              action: `Progressed to ${pipelineStages[newStageIndex]?.displayName || newStage}`,
              actor: 'Current User',
              notes
            }
          ]
        };
      }
      return app;
    }));
  };

  const handleBulkMove = (targetStageId: string) => {
    selectedIds.forEach(id => {
      handleStageTransition(id, targetStageId);
    });
    setSelectedIds(new Set());
  };

  const handleBulkReject = () => {
    if (confirm(`Reject ${selectedIds.size} selected candidates?`)) {
      selectedIds.forEach(id => {
        handleStageTransition(id, 'rejected', 'Bulk rejection');
      });
      setSelectedIds(new Set());
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    return getStatusConfig(pipelineApplicationStatusConfig, status).color;
  };

  const getStatusIcon = (status: string) => {
    const config = getStatusConfig(pipelineApplicationStatusConfig, status);
    const IconComponent = config.icon;
    return <IconComponent className="w-3.5 h-3.5" />;
  };

  const actions = (
    <div className="flex items-center gap-3">
      <div className="flex rounded-lg border border-gray-300">
        {[
          { id: 'kanban', name: 'Kanban', icon: UserGroupIcon },
          { id: 'list', name: 'List', icon: ChartBarIcon },
          { id: 'funnel', name: 'Funnel', icon: FunnelIcon }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as any)}
            className={`px-3 py-2 text-sm font-medium ${
              viewMode === mode.id
                ? 'bg-violet-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } ${mode.id === 'kanban' ? 'rounded-l-lg' : mode.id === 'funnel' ? 'rounded-r-lg' : ''}`}
          >
            <mode.icon className="w-4 h-4 mr-2 inline" />
            {mode.name}
          </button>
        ))}
      </div>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700">
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Application
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Recruitment Pipeline" subtitle="Loading pipeline data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-violet-500"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Recruitment Pipeline"
      subtitle="Track candidates through the hiring process"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-violet-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{pipelineMetrics.totalApplications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Applications</p>
                <p className="text-2xl font-semibold text-gray-900">{pipelineMetrics.activeApplications}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Avg. Time to Hire</p>
                <p className="text-2xl font-semibold text-gray-900">{pipelineMetrics.averageTimeToHire} days</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{pipelineMetrics.conversionRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates or jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              >
                <option value="all">All Stages</option>
                {pipelineStages.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.displayName} ({pipelineMetrics.stageMetrics[stage.id]?.count || 0})
                  </option>
                ))}
              </select>
              
              <div className="text-sm text-gray-600">
                {filteredApplications.length} of {applications.length} applications
              </div>
            </div>
          </div>
        </div>

        {/* Pipeline Views */}
        {viewMode === 'funnel' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Pipeline Funnel</h3>
            <div className="space-y-4">
              {pipelineStages.map((stage) => {
                const metrics = pipelineMetrics.stageMetrics[stage.id] || { count: 0, averageDays: 0, conversionRate: 0 };
                const maxCount = Math.max(...Object.values(pipelineMetrics.stageMetrics).map(m => m.count));
                const width = maxCount > 0 ? (metrics.count / maxCount) * 100 : 0;
                
                return (
                  <div key={stage.id} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium text-gray-900 text-right">
                      {stage.displayName}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div 
                        className="h-8 rounded-full flex items-center justify-between px-4 text-white text-sm font-medium transition-all bg-violet-500"
                        style={{ width: `${Math.max(width, 10)}%` }}
                      >
                        <span>{metrics.count} candidates</span>
                        <span>{metrics.averageDays} days avg</span>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600 text-center">
                      {metrics.conversionRate.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {pipelineStages.map((stage, stageIndex) => {
                const stageApplications = filteredApplications.filter(app => app.currentStage === stage.id);
                const nextStage = pipelineStages[stageIndex + 1];
                const nextStageCount = nextStage
                  ? filteredApplications.filter(app => app.currentStage === nextStage.id).length
                  : 0;

                return (
                  <div key={stage.id} className="flex-shrink-0 w-80">
                    <div className={`rounded-lg border-2 ${stage.color} p-4 mb-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={stageApplications.length > 0 && stageApplications.every(a => selectedIds.has(a.id))}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) {
                                stageApplications.forEach(a => next.add(a.id));
                              } else {
                                stageApplications.forEach(a => next.delete(a.id));
                              }
                              setSelectedIds(next);
                            }}
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          <stage.icon className="w-5 h-5" />
                          <h3 className="font-semibold">{stage.displayName}</h3>
                        </div>
                        <span className="text-sm font-medium">
                          {stageApplications.length}
                          {stageIndex < pipelineStages.length - 1 && stageApplications.length > 0 && (
                            <span className="text-[10px] text-gray-400 font-normal ml-2">
                              &rarr; {Math.round((nextStageCount / stageApplications.length) * 100)}%
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">{stage.description}</p>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stageApplications.map(application => (
                        <div key={application.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2 flex-1">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(application.id)}
                                onChange={(e) => {
                                  const next = new Set(selectedIds);
                                  if (e.target.checked) next.add(application.id);
                                  else next.delete(application.id);
                                  setSelectedIds(next);
                                }}
                                className="mt-1 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                              />
                              <div>
                              <h4 className="font-medium text-gray-900">
                                {application.candidate.firstName} {application.candidate.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{application.job.title}</p>
                              <p className="text-xs text-gray-500">{application.job.department}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(application.priority)}`}>
                                {application.priority}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(application.status)}`}>
                                {getStatusIcon(application.status)}
                                {application.status}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span className={`inline-flex items-center gap-1 ${
                              application.daysInStage <= 3 ? 'text-green-600' :
                              application.daysInStage <= 7 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              <ClockIcon className="w-3 h-3" />
                              {application.daysInStage}d
                            </span>
                            <span>{new Date(application.lastActivity).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-violet-500 h-2 rounded-full transition-all" 
                              style={{ width: `${Math.min(application.progress, 100)}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="text-violet-600 hover:text-violet-800 text-xs font-medium"
                            >
                              <EyeIcon className="w-4 h-4 inline mr-1" />
                              View Details
                            </button>
                            
                            {application.status === 'active' && stage.order < pipelineStages.length && (
                              <button
                                onClick={() => {
                                  const nextStage = pipelineStages[stage.order];
                                  if (nextStage) {
                                    const reason = prompt(`Move to ${nextStage.displayName}. Add notes (optional):`);
                                    if (reason !== null) {
                                      handleStageTransition(application.id, nextStage.id, reason || undefined);
                                    }
                                  }
                                }}
                                className="text-green-600 hover:text-green-800 text-xs font-medium"
                              >
                                <ArrowRightIcon className="w-4 h-4 inline mr-1" />
                                Progress
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days in Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.slice(0, 50).map((application) => {
                    const currentStage = pipelineStages.find(s => s.id === application.currentStage);
                    
                    return (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-gray-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {application.candidate.firstName} {application.candidate.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{application.candidate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{application.job.title}</div>
                          <div className="text-sm text-gray-500">{application.job.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentStage && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStage.color}`}>
                              <currentStage.icon className="w-4 h-4 mr-1" />
                              {currentStage.displayName}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-violet-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(application.progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{application.progress.toFixed(0)}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {application.daysInStage} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(application.priority)}`}>
                            {application.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            {application.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="text-violet-600 hover:text-violet-900"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {application.status === 'active' && (
                              <button
                                onClick={() => {
                                  const nextStageIndex = pipelineStages.findIndex(s => s.id === application.currentStage) + 1;
                                  const nextStage = pipelineStages[nextStageIndex];
                                  if (nextStage) {
                                    const reason = prompt(`Move to ${nextStage.displayName}. Add notes (optional):`);
                                    if (reason !== null) {
                                      handleStageTransition(application.id, nextStage.id, reason || undefined);
                                    }
                                  }
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <ArrowRightIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-lg shadow-lg px-6 py-3 flex items-center gap-4 z-50">
            <span className="text-sm font-medium text-gray-700">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-gray-300" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkMove(e.target.value);
                  e.target.value = '';
                }
              }}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
              defaultValue=""
            >
              <option value="" disabled>Move to...</option>
              {pipelineStages.map(s => (
                <option key={s.id} value={s.id}>{s.displayName}</option>
              ))}
            </select>
            <button
              onClick={handleBulkReject}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Reject Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedApplication.candidate.firstName} {selectedApplication.candidate.lastName}
                    </h2>
                    <p className="text-gray-600 mt-1">{selectedApplication.job.title} - {selectedApplication.job.department}</p>
                  </div>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Candidate Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <p><strong>Email:</strong> {selectedApplication.candidate.email}</p>
                      <p><strong>Phone:</strong> {selectedApplication.candidate.phone}</p>
                      <p><strong>Applied:</strong> {new Date(selectedApplication.submittedAt).toLocaleDateString()}</p>
                      <p><strong>Last Activity:</strong> {new Date(selectedApplication.lastActivity).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Application Timeline</h3>
                    <div className="space-y-4">
                      {selectedApplication.timeline.map((event, index) => (
                        <div key={index} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-violet-600 rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-900">
                              <strong>{event.action}</strong> by {event.actor}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleDateString()} at {new Date(event.date).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
