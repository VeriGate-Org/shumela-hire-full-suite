'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
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
  ShieldCheckIcon,
  DocumentTextIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { pipelineApplicationStatusConfig, getStatusConfig } from '@/utils/statusIcons';
import AiCandidatePanel from '@/components/ai/AiCandidatePanel';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiCandidateRanking from '@/components/ai/AiCandidateRanking';
import AiOfferPrediction from '@/components/ai/AiOfferPrediction';
import BackgroundCheckPanel from '@/components/BackgroundCheckPanel';

// --- Stage grouping: maps 16 backend PipelineStage enum values into 7 display columns ---

const STAGE_GROUPS = [
  {
    id: 'applied',
    displayName: 'Applied',
    order: 1,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: UserIcon,
    description: 'Initial application submitted',
    backendStages: ['APPLICATION_RECEIVED'],
  },
  {
    id: 'screening',
    displayName: 'Screening',
    order: 2,
    color: 'bg-gold-100 text-gold-800 border-violet-300',
    icon: EyeIcon,
    description: 'Resume and initial screening',
    backendStages: ['INITIAL_SCREENING', 'PHONE_SCREENING'],
  },
  {
    id: 'interviews',
    displayName: 'Interviews',
    order: 3,
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: CalendarIcon,
    description: 'Interview rounds',
    backendStages: [
      'FIRST_INTERVIEW', 'TECHNICAL_ASSESSMENT', 'SECOND_INTERVIEW',
      'PANEL_INTERVIEW', 'MANAGER_INTERVIEW', 'FINAL_INTERVIEW',
    ],
  },
  {
    id: 'checks',
    displayName: 'Checks',
    order: 4,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: ShieldCheckIcon,
    description: 'Reference and background checks',
    backendStages: ['REFERENCE_CHECK', 'BACKGROUND_CHECK'],
  },
  {
    id: 'offer',
    displayName: 'Offer',
    order: 5,
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: BriefcaseIcon,
    description: 'Offer extended to candidate',
    backendStages: ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION'],
  },
  {
    id: 'accepted',
    displayName: 'Accepted',
    order: 6,
    color: 'bg-green-200 text-green-900 border-green-400',
    icon: CheckCircleIcon,
    description: 'Offer accepted by candidate',
    backendStages: ['OFFER_ACCEPTED'],
  },
  {
    id: 'hired',
    displayName: 'Hired',
    order: 7,
    color: 'bg-green-600 text-white border-green-600',
    icon: CheckCircleIcon,
    description: 'Successfully hired',
    backendStages: ['HIRED'],
  },
] as const;

// Reverse lookup: backend enum value -> group id
const BACKEND_STAGE_TO_GROUP: Record<string, string> = {};
STAGE_GROUPS.forEach(group => {
  group.backendStages.forEach(bs => {
    BACKEND_STAGE_TO_GROUP[bs] = group.id;
  });
});

// Display names for backend sub-stages (shown on kanban cards within grouped columns)
const BACKEND_STAGE_DISPLAY: Record<string, string> = {
  APPLICATION_RECEIVED: 'Application Received',
  INITIAL_SCREENING: 'Initial Screening',
  PHONE_SCREENING: 'Phone Screening',
  FIRST_INTERVIEW: 'First Interview',
  TECHNICAL_ASSESSMENT: 'Technical Assessment',
  SECOND_INTERVIEW: 'Second Interview',
  PANEL_INTERVIEW: 'Panel Interview',
  MANAGER_INTERVIEW: 'Manager Interview',
  FINAL_INTERVIEW: 'Final Interview',
  REFERENCE_CHECK: 'Reference Check',
  BACKGROUND_CHECK: 'Background Check',
  OFFER_PREPARATION: 'Offer Preparation',
  OFFER_EXTENDED: 'Offer Extended',
  OFFER_NEGOTIATION: 'Offer Negotiation',
  OFFER_ACCEPTED: 'Offer Accepted',
  HIRED: 'Hired',
};

// Get the first backend stage of the next stage group (for cross-column progression)
function getNextGroupFirstStage(currentBackendStage: string): string | null {
  const currentGroupId = BACKEND_STAGE_TO_GROUP[currentBackendStage];
  if (!currentGroupId) return null;
  const currentGroupIndex = STAGE_GROUPS.findIndex(g => g.id === currentGroupId);
  if (currentGroupIndex < 0 || currentGroupIndex >= STAGE_GROUPS.length - 1) return null;
  return STAGE_GROUPS[currentGroupIndex + 1].backendStages[0];
}

// Terminal stages excluded from kanban, visible in list view only
const TERMINAL_STAGES = new Set(['WITHDRAWN', 'REJECTED', 'OFFER_DECLINED', 'NO_SHOW', 'DUPLICATE']);

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
  backendStage: string;
  submittedAt: string;
  lastActivity: string;
  daysInStage: number;
  progress: number;
  status: 'active' | 'hired' | 'rejected' | 'withdrawn' | 'offer_declined';
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
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'funnel'>('kanban');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineEntries, setTimelineEntries] = useState<Array<{
    fromStage: string;
    toStage: string;
    createdAt: string;
    reason?: string;
    notes?: string;
    performedBy?: string;
  }>>([]);
  const [backendMetrics, setBackendMetrics] = useState<PipelineMetrics | null>(null);

  // --- Status mapping covering all 12 ApplicationStatus enum values ---
  const statusMap: Record<string, Application['status']> = {
    SUBMITTED: 'active',
    SCREENING: 'active',
    INTERVIEW_SCHEDULED: 'active',
    INTERVIEW_COMPLETED: 'active',
    REFERENCE_CHECK: 'active',
    OFFER_PENDING: 'active',
    OFFERED: 'active',
    OFFER_ACCEPTED: 'active',
    OFFER_DECLINED: 'offer_declined',
    REJECTED: 'rejected',
    WITHDRAWN: 'withdrawn',
    HIRED: 'hired',
  };

  const loadPipelineData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/applications/manage/search?size=200');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      const items = result.content || result.data || result || [];
      const mapped: Application[] = items.map((a: any) => {
        // Handle both DTO shape (applicantName) and raw entity shape (applicant.firstName)
        let firstName = '';
        let lastName = '';
        if (a.applicantName) {
          const nameParts = a.applicantName.split(' ');
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        } else if (a.applicant) {
          firstName = a.applicant.firstName || a.applicant.given_name || '';
          lastName = a.applicant.lastName || a.applicant.family_name || '';
        }

        const backendStage = a.pipelineStage || a.status || 'APPLICATION_RECEIVED';
        const currentStage = BACKEND_STAGE_TO_GROUP[backendStage] || 'applied';
        const stageIndex = STAGE_GROUPS.findIndex(s => s.id === currentStage);
        const updatedAt = a.updatedAt || a.pipelineStageEnteredAt;
        const daysInStage = updatedAt
          ? Math.floor((Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Handle both DTO (applicantEmail, jobTitle) and raw entity (applicant.email, jobPosting.title)
        const email = a.applicantEmail || a.applicant?.email || '';
        const applicantId = a.applicantId || a.applicant?.id || '';
        const jobId = a.jobPostingId || a.jobPosting?.id || '';
        const jobTitle = a.jobTitle || a.jobPosting?.title || '';
        const department = a.department || a.jobPosting?.department || '';

        // status may be an enum string (from raw entity) or already mapped
        const statusKey = typeof a.status === 'string' ? a.status : '';

        return {
          id: a.id,
          candidate: {
            id: applicantId,
            firstName,
            lastName,
            email,
            phone: a.applicant?.phone || '',
          },
          job: {
            id: jobId,
            title: jobTitle,
            department,
            location: a.jobPosting?.location || '',
            type: a.jobPosting?.type || '',
          },
          currentStage,
          backendStage,
          submittedAt: a.submittedAt || a.createdAt || new Date().toISOString(),
          lastActivity: updatedAt || a.submittedAt || new Date().toISOString(),
          daysInStage,
          progress: stageIndex >= 0 ? (stageIndex / Math.max(STAGE_GROUPS.length - 1, 1)) * 100 : 0,
          status: statusMap[statusKey] || 'active',
          priority: (a.priority || 'medium').toLowerCase() as Application['priority'],
          notes: [],
          timeline: [],
        };
      });
      setApplications(mapped);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
      toast('Failed to load pipeline data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // P5: Fetch backend analytics
  // Note: the backend /api/pipeline/analytics returns { funnel, averageStageDurations, conversions, ... }
  // which doesn't match the PipelineMetrics shape. Only use it if it actually has the expected keys;
  // otherwise fall through to client-side computation from loaded applications.
  const loadAnalytics = useCallback(async () => {
    try {
      const response = await apiFetch('/api/pipeline/analytics');
      if (response.ok) {
        const data = await response.json();
        // Only use backend metrics if the response matches the expected shape
        if (typeof data.totalApplications === 'number' && typeof data.stageMetrics === 'object' && data.stageMetrics !== null) {
          setBackendMetrics({
            totalApplications: data.totalApplications,
            activeApplications: data.activeApplications ?? 0,
            averageTimeToHire: data.averageTimeToHire ?? 0,
            conversionRate: data.conversionRate ?? 0,
            stageMetrics: data.stageMetrics,
          });
        }
        // else: response has different shape (funnel, conversions, etc.) — skip and use client-side fallback
      }
    } catch {
      // Fall back to client-side computation
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
    loadAnalytics();
  }, [loadPipelineData, loadAnalytics]);

  // P4: Fetch timeline when selectedApplication changes
  useEffect(() => {
    if (!selectedApplication) {
      setTimelineEntries([]);
      return;
    }
    let cancelled = false;
    setTimelineLoading(true);
    apiFetch(`/api/pipeline/applications/${selectedApplication.id}/timeline`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (cancelled) return;
        const entries = (Array.isArray(data) ? data : data.content || data.data || []).map((t: any) => ({
          fromStage: t.fromStage || '',
          toStage: t.toStage || '',
          createdAt: t.createdAt || t.transitionDate || '',
          reason: t.reason || t.notes || '',
          notes: t.notes || '',
          performedBy: t.performedBy || t.performedByName || '',
        }));
        setTimelineEntries(entries);
      })
      .catch(() => {
        if (!cancelled) setTimelineEntries([]);
      })
      .finally(() => {
        if (!cancelled) setTimelineLoading(false);
      });
    return () => { cancelled = true; };
  }, [selectedApplication]);

  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      // In kanban view, exclude terminal stages
      if (viewMode === 'kanban' && TERMINAL_STAGES.has(app.backendStage)) return false;
      const matchesStage = selectedStage === 'all' || app.currentStage === selectedStage;
      const matchesSearch = searchTerm === '' ||
        app.candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.job.department.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesStage && matchesSearch;
    });
  }, [applications, selectedStage, searchTerm, viewMode]);

  // P5: Use backend metrics with client-side fallback
  const pipelineMetrics = useMemo((): PipelineMetrics => {
    if (backendMetrics) return backendMetrics;

    const totalApplications = applications.length;
    const activeApplications = applications.filter(app =>
      app.status === 'active'
    ).length;
    const hiredApplications = applications.filter(app => app.status?.toUpperCase() === 'HIRED' || app.currentStage === 'HIRED').length;

    const averageTimeToHire = applications
      .filter(app => app.status === 'hired')
      .reduce((sum, app) => {
        const days = Math.floor((new Date().getTime() - new Date(app.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0) / Math.max(hiredApplications, 1);

    const conversionRate = totalApplications > 0 ? (hiredApplications / totalApplications) * 100 : 0;

    const stageMetrics: Record<string, { count: number; averageDays: number; conversionRate: number }> = {};

    // Exclude terminal-stage applications from per-stage counts so that
    // the dropdown, funnel, and kanban views all show consistent numbers.
    const nonTerminalApplications = applications.filter(app => !TERMINAL_STAGES.has(app.backendStage));

    let previousStageCount = 0;
    STAGE_GROUPS.forEach((stage, index) => {
      const stageApplications = nonTerminalApplications.filter(app => app.currentStage === stage.id);
      const averageDays = stageApplications.reduce((sum, app) => sum + app.daysInStage, 0) / Math.max(stageApplications.length, 1);

      // Stage-to-stage conversion: percentage of previous stage that reached this one.
      // First stage shows percentage of total applications.
      const basis = index === 0 ? totalApplications : previousStageCount;
      const conversionRate = basis > 0 ? (stageApplications.length / basis) * 100 : 0;

      stageMetrics[stage.id] = {
        count: stageApplications.length,
        averageDays: Math.round(averageDays),
        conversionRate: Math.round(conversionRate * 10) / 10,
      };

      previousStageCount = stageApplications.length;
    });

    return {
      totalApplications,
      activeApplications,
      averageTimeToHire: Math.round(averageTimeToHire),
      conversionRate: Math.round(conversionRate * 10) / 10,
      stageMetrics
    };
  }, [applications, backendMetrics]);

  // P1: Persist stage transitions via backend
  const handleStageTransition = async (applicationId: string, targetBackendStage: string, notes?: string) => {
    try {
      const response = await apiFetch(
        `/api/pipeline/applications/${applicationId}/move?targetStage=${encodeURIComponent(targetBackendStage)}&performedBy=1`,
        { method: 'POST' }
      );
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }
      toast('Stage transition saved', 'success');
      await loadPipelineData();
    } catch (error: any) {
      toast(`Failed to move candidate: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // P1: Progress to next stage via backend
  const handleProgressToNext = async (applicationId: string) => {
    try {
      const response = await apiFetch(
        `/api/pipeline/applications/${applicationId}/progress?performedBy=1`,
        { method: 'POST' }
      );
      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `HTTP ${response.status}`);
      }
      toast('Candidate progressed to next stage', 'success');
      await loadPipelineData();
    } catch (error: any) {
      toast(`Failed to progress candidate: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // P3: Persist bulk move via backend
  const handleBulkMove = async (targetStageId: string) => {
    // Find the first backend stage for the target group
    const group = STAGE_GROUPS.find(g => g.id === targetStageId);
    if (!group) return;
    const targetBackendStage = group.backendStages[0];
    const ids = Array.from(selectedIds);
    try {
      const response = await apiFetch('/api/applications/manage/bulk/pipeline-stage', {
        method: 'PUT',
        body: JSON.stringify({ applicationIds: ids, pipelineStage: targetBackendStage }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      toast(`Moved ${ids.length} candidates to ${group.displayName}`, 'success');
      setSelectedIds(new Set());
      await loadPipelineData();
    } catch (error: any) {
      toast(`Bulk move failed: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  // P3: Persist bulk reject via backend
  const handleBulkReject = async () => {
    if (!confirm(`Reject ${selectedIds.size} selected candidates?`)) return;
    const ids = Array.from(selectedIds);
    try {
      const response = await apiFetch('/api/applications/manage/bulk/status', {
        method: 'PUT',
        body: JSON.stringify({ applicationIds: ids, status: 'REJECTED' }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      toast(`Rejected ${ids.length} candidates`, 'success');
      setSelectedIds(new Set());
      await loadPipelineData();
    } catch (error: any) {
      toast(`Bulk reject failed: ${error.message || 'Unknown error'}`, 'error');
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
      <div className="flex rounded-sm border border-gray-300">
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
                ? 'bg-gold-500 text-violet-950'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } ${mode.id === 'kanban' ? 'rounded-l-lg' : mode.id === 'funnel' ? 'rounded-r-lg' : ''}`}
          >
            <mode.icon className="w-4 h-4 mr-2 inline" />
            {mode.name}
          </button>
        ))}
      </div>
      <button className="inline-flex items-center px-4 py-2 border-2 border-gold-500 text-sm font-medium rounded-full shadow-sm bg-transparent text-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider">
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Application
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Recruitment Pipeline" subtitle="Loading pipeline data..." actions={actions}>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gold-500"></div>
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
          <div className="bg-white rounded-sm shadow p-6">
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

          <div className="bg-white rounded-sm shadow p-6">
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

          <div className="bg-white rounded-sm shadow p-6">
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

          <div className="bg-white rounded-sm shadow p-6">
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
        <div className="bg-white rounded-sm shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search candidates or jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              >
                <option value="all">All Stages</option>
                {STAGE_GROUPS.map(stage => (
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

        {/* AI Candidate Ranking — shown when viewing a single job's candidates */}
        {(() => {
          const jobIds = new Set(filteredApplications.map(a => a.job.id).filter(Boolean));
          if (jobIds.size === 1) {
            const jobId = [...jobIds][0];
            return (
              <AiAssistPanel title="AI Candidate Ranking" feature="AI_SCREENING_RANKING" description="Rank and compare candidates for this position based on qualifications and fit">
                <AiCandidateRanking jobId={jobId} />
              </AiAssistPanel>
            );
          }
          return null;
        })()}

        {/* Pipeline Views */}
        {viewMode === 'funnel' && (
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Pipeline Funnel</h3>
              <p className="text-xs text-gray-400">Percentages show stage-to-stage conversion</p>
            </div>
            <div className="space-y-4">
              {STAGE_GROUPS.map((stage) => {
                const metrics = pipelineMetrics.stageMetrics[stage.id] || { count: 0, averageDays: 0, conversionRate: 0 };
                const maxCount = Math.max(...Object.values(pipelineMetrics.stageMetrics).map(m => m.count), 1);
                const width = maxCount > 0 ? (metrics.count / maxCount) * 100 : 0;

                return (
                  <div key={stage.id} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium text-gray-900 text-right">
                      {stage.displayName}
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="h-8 rounded-full flex items-center justify-between px-4 text-white text-sm font-medium transition-all bg-gold-500"
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
          <div className="bg-white rounded-sm shadow p-6">
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {STAGE_GROUPS.map((stage, stageIndex) => {
                const stageApplications = filteredApplications.filter(app => app.currentStage === stage.id);
                const nextStage = STAGE_GROUPS[stageIndex + 1];
                const nextStageCount = nextStage
                  ? filteredApplications.filter(app => app.currentStage === nextStage.id).length
                  : 0;

                return (
                  <div key={stage.id} className="flex-shrink-0 w-80">
                    <div className={`rounded-sm border-2 ${stage.color} p-4 mb-4`}>
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
                            className="rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                          />
                          <stage.icon className="w-5 h-5" />
                          <h3 className="font-semibold">{stage.displayName}</h3>
                        </div>
                        <span className="text-sm font-medium">
                          {stageApplications.length}
                          {stageIndex < STAGE_GROUPS.length - 1 && stageApplications.length > 0 && (
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
                        <div key={application.id} className="bg-gray-50 rounded-sm p-4 border border-gray-200 hover:border-gray-300 transition-colors">
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
                                className="mt-1 rounded border-gray-300 text-gold-600 focus:ring-gold-500"
                              />
                              <div>
                              <h4 className="font-medium text-gray-900">
                                {application.candidate.firstName} {application.candidate.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">{application.job.title}</p>
                              <p className="text-xs text-gray-500">{application.job.department}</p>
                              {stage.backendStages.length > 1 && BACKEND_STAGE_DISPLAY[application.backendStage] && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-gray-200 text-gray-600 rounded">
                                  {BACKEND_STAGE_DISPLAY[application.backendStage]}
                                </span>
                              )}
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
                              className="bg-gold-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(application.progress, 100)}%` }}
                            ></div>
                          </div>

                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="text-gold-600 hover:text-gold-800 text-xs font-medium"
                            >
                              <EyeIcon className="w-4 h-4 inline mr-1" />
                              View Details
                            </button>

                            {application.status === 'active' && stage.order < STAGE_GROUPS.length && (() => {
                              const nextGroupStage = getNextGroupFirstStage(application.backendStage);
                              const nextGroup = nextGroupStage ? STAGE_GROUPS.find(g => (g.backendStages as readonly string[]).includes(nextGroupStage)) : null;
                              return nextGroupStage && (
                                <button
                                  onClick={() => handleStageTransition(application.id, nextGroupStage)}
                                  className="text-green-600 hover:text-green-800 text-xs font-medium"
                                >
                                  <ArrowRightIcon className="w-4 h-4 inline mr-1" />
                                  Move to {nextGroup?.displayName || 'Next'}
                                </button>
                              );
                            })()}
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
          <div className="bg-white rounded-sm shadow overflow-hidden">
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
                    const currentStageGroup = STAGE_GROUPS.find(s => s.id === application.currentStage);

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
                          {currentStageGroup && (
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStageGroup.color}`}>
                                <currentStageGroup.icon className="w-4 h-4 mr-1" />
                                {currentStageGroup.displayName}
                              </span>
                              {currentStageGroup.backendStages.length > 1 && BACKEND_STAGE_DISPLAY[application.backendStage] && (
                                <div className="text-[10px] text-gray-500 mt-0.5">{BACKEND_STAGE_DISPLAY[application.backendStage]}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gold-500 h-2 rounded-full"
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
                              className="text-gold-600 hover:text-violet-900"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {application.status === 'active' && ['REFERENCE_CHECK', 'BACKGROUND_CHECK'].includes(application.backendStage) && (
                              <button
                                onClick={() => setSelectedApplication(application)}
                                className="text-yellow-600 hover:text-yellow-800"
                                title="Background Screening"
                              >
                                <ShieldCheckIcon className="w-4 h-4" />
                              </button>
                            )}
                            {application.status === 'active' && ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION'].includes(application.backendStage) && (
                              <a
                                href="/reports/offer-letter-sample.pdf"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#05527E] hover:text-[#033d5e]"
                                title="Generate Offer Letter"
                              >
                                <DocumentTextIcon className="w-4 h-4" />
                              </a>
                            )}
                            {['OFFER_ACCEPTED', 'HIRED'].includes(application.backendStage) && (
                              <a
                                href="/offers"
                                className="text-[#05527E] hover:text-[#033d5e]"
                                title="Send to Payroll"
                              >
                                <BanknotesIcon className="w-4 h-4" />
                              </a>
                            )}
                            {application.status === 'active' && (() => {
                              const nextGroupStage = getNextGroupFirstStage(application.backendStage);
                              return nextGroupStage && (
                                <button
                                  onClick={() => handleStageTransition(application.id, nextGroupStage)}
                                  className="text-green-600 hover:text-green-900"
                                  title={`Move to ${STAGE_GROUPS.find(g => (g.backendStages as readonly string[]).includes(nextGroupStage))?.displayName || 'next stage'}`}
                                >
                                  <ArrowRightIcon className="w-4 h-4" />
                                </button>
                              );
                            })()}
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
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border border-gray-200 rounded-sm shadow-lg px-6 py-3 flex items-center gap-4 z-50">
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
              className="text-sm border border-gray-300 rounded-sm px-2 py-1"
              defaultValue=""
            >
              <option value="" disabled>Move to...</option>
              {STAGE_GROUPS.map(s => (
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
            <div className="bg-white rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
                    <div className="bg-gray-50 rounded-sm p-4 space-y-2">
                      <p><strong>Email:</strong> {selectedApplication.candidate.email}</p>
                      <p><strong>Phone:</strong> {selectedApplication.candidate.phone}</p>
                      <p><strong>Applied:</strong> {new Date(selectedApplication.submittedAt).toLocaleDateString()}</p>
                      <p><strong>Last Activity:</strong> {new Date(selectedApplication.lastActivity).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Application Timeline</h3>
                    <div className="space-y-4">
                      {timelineLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
                        </div>
                      ) : timelineEntries.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">No timeline entries recorded yet.</p>
                      ) : (
                        timelineEntries.map((event, index) => (
                          <div key={index} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-gold-500 rounded-full"></div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900">
                                <strong>{event.fromStage ? `${event.fromStage} → ${event.toStage}` : event.toStage}</strong>
                                {event.performedBy && <span className="text-gray-500"> by {event.performedBy}</span>}
                              </div>
                              {event.reason && (
                                <div className="text-xs text-gray-600 mt-0.5">{event.reason}</div>
                              )}
                              <div className="text-sm text-gray-500">
                                {new Date(event.createdAt).toLocaleDateString()} at {new Date(event.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Background Screening */}
                {['REFERENCE_CHECK', 'BACKGROUND_CHECK', 'OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION', 'OFFER_ACCEPTED', 'HIRED'].includes(selectedApplication.backendStage) && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <BackgroundCheckPanel
                      applicationId={selectedApplication.id}
                      candidateName={`${selectedApplication.candidate.firstName} ${selectedApplication.candidate.lastName}`}
                      candidateEmail={selectedApplication.candidate.email}
                      jobPostingId={selectedApplication.job?.id}
                      onClose={() => {}}
                    />
                  </div>
                )}

                {/* AI Candidate Assist */}
                <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                  <AiCandidatePanel
                    applicationId={selectedApplication.id}
                    candidateName={`${selectedApplication.candidate.firstName} ${selectedApplication.candidate.lastName}`}
                    jobTitle={selectedApplication.job.title}
                  />

                  {selectedApplication.backendStage.includes('OFFER') && (
                    <AiAssistPanel title="AI Offer Prediction" feature="AI_OFFER_PREDICTION" description="Predict offer acceptance likelihood based on candidate and market signals">
                      <AiOfferPrediction applicationId={selectedApplication.id} />
                    </AiAssistPanel>
                  )}
                </div>

                <div className="flex justify-end mt-6 pt-6 border-t">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700"
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
