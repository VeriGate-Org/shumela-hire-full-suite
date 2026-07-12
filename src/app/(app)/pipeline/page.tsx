'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { apiFetch } from '@/lib/api-fetch';
import { useToast } from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
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
  BanknotesIcon,
  StarIcon,
  ArrowDownTrayIcon,
  PaperClipIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { pipelineApplicationStatusConfig, getStatusConfig } from '@/utils/statusIcons';
import { formatEnumValue } from '@/utils/enumLabels';
import AiCandidatePanel from '@/components/ai/AiCandidatePanel';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiCandidateRanking from '@/components/ai/AiCandidateRanking';
import AiOfferPrediction from '@/components/ai/AiOfferPrediction';
import BackgroundCheckPanel from '@/components/BackgroundCheckPanel';
import VerificationStatusSummary, { VerificationSummary } from '@/components/VerificationStatusSummary';
import OfferSummaryPanel from '@/components/OfferSummaryPanel';
import InterviewSummaryPanel from '@/components/InterviewSummaryPanel';
import InterviewScheduler from '@/components/InterviewScheduler';
import StatusPill from '@/components/StatusPill';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { KanbanSkeleton } from '@/components/LoadingComponents';

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
    color: 'bg-gold-100 text-gold-800 border-gold-300',
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
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
  OFFER_DECLINED: 'Offer Declined',
  NO_SHOW: 'No Show',
  DUPLICATE: 'Duplicate',
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
  rating: number;
  screeningNotes: string;
  jobPostingId: string;
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
  const [error, setError] = useState<string | null>(null);
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
  const [verificationSummaries, setVerificationSummaries] = useState<Record<string, VerificationSummary>>({});
  const [offers, setOffers] = useState<Record<string, any>>({});
  const [offerLoading, setOfferLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false);
  const [stageTransitionConfirm, setStageTransitionConfirm] = useState<{ applicationId: string; targetStage: string; stageName: string } | null>(null);
  const [progressConfirm, setProgressConfirm] = useState<string | null>(null);
  const [bulkMoveConfirm, setBulkMoveConfirm] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [ratingUpdating, setRatingUpdating] = useState(false);
  const [screeningNotesOpen, setScreeningNotesOpen] = useState(false);
  const [interviewPreviews, setInterviewPreviews] = useState<Record<string, { nextDate?: string; nextType?: string; status?: string; feedbackCount?: number; totalInterviewers?: number; latestRecommendation?: string }>>({});
  const [schedulerApplicationId, setSchedulerApplicationId] = useState<number | null>(null);

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

  // Load verification summaries for checks-column applications
  const loadVerificationSummaries = useCallback(async (apps: Application[]) => {
    const checksApps = apps.filter(a =>
      ['REFERENCE_CHECK', 'BACKGROUND_CHECK'].includes(a.backendStage)
    );
    if (checksApps.length === 0) {
      setVerificationSummaries({});
      return;
    }
    try {
      const ids = checksApps.map(a => a.id);
      const response = await apiFetch(`/api/background-checks/summary?applicationIds=${ids.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        setVerificationSummaries(data || {});
      }
    } catch {
      // Gracefully ignore — feature may not be enabled
    }
  }, []);

  const loadPipelineData = useCallback(async () => {
    setLoading(true);
    setError(null);
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
          firstName = a.applicant.name || a.applicant.firstName || a.applicant.given_name || '';
          lastName = a.applicant.surname || a.applicant.lastName || a.applicant.family_name || '';
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
          id: String(a.id),
          candidate: {
            id: String(applicantId),
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
          rating: a.rating || 0,
          screeningNotes: a.screeningNotes || '',
          jobPostingId: a.jobPosting?.id || a.jobPostingId || '',
          status: statusMap[statusKey] || 'active',
          priority: (a.priority || 'medium').toLowerCase() as Application['priority'],
          notes: [],
          timeline: [],
        };
      });
      setApplications(mapped);
      loadVerificationSummaries(mapped);
      // Preload offers for offer/accepted stage cards (for status badges)
      const offerApps = mapped.filter(a =>
        ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION', 'OFFER_ACCEPTED'].includes(a.backendStage)
      );
      offerApps.forEach(a => {
        apiFetch(`/api/offers/applications/${a.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data) {
              const offer = Array.isArray(data) ? data[0] : data;
              if (offer) setOffers(prev => ({ ...prev, [a.id]: offer }));
            }
          })
          .catch(() => {});
      });
      // Preload interview previews for interview-stage cards
      const interviewStages = ['FIRST_INTERVIEW', 'TECHNICAL_ASSESSMENT', 'SECOND_INTERVIEW', 'PANEL_INTERVIEW', 'MANAGER_INTERVIEW', 'FINAL_INTERVIEW'];
      const interviewApps = mapped.filter(a => interviewStages.includes(a.backendStage));
      interviewApps.forEach(a => {
        apiFetch(`/api/interviews/application/${a.id}`)
          .then(res => res.ok ? res.json() : [])
          .then(data => {
            const items = Array.isArray(data) ? data : data.content || [];
            if (items.length === 0) return;
            const scheduled = items.find((iv: any) => ['SCHEDULED', 'RESCHEDULED'].includes(iv.status));
            const completed = items.filter((iv: any) => iv.status === 'COMPLETED');
            const latestCompleted = completed[0];
            setInterviewPreviews(prev => ({
              ...prev,
              [a.id]: {
                nextDate: scheduled?.scheduledAt,
                nextType: scheduled?.type,
                status: scheduled ? scheduled.status : latestCompleted?.status,
                latestRecommendation: latestCompleted?.recommendation || undefined,
              },
            }));
          })
          .catch(() => {});
      });
    } catch (err) {
      console.error('Failed to load pipeline data:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load pipeline data';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [loadVerificationSummaries]);

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

  // Load offer data and documents when modal opens
  useEffect(() => {
    if (!selectedApplication) {
      setDocuments([]);
      setScreeningNotesOpen(false);
      return;
    }
    // Load documents
    let cancelled = false;
    setDocumentsLoading(true);
    apiFetch(`/api/applications/${selectedApplication.id}/documents`)
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (!cancelled) setDocuments(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setDocuments([]); })
      .finally(() => { if (!cancelled) setDocumentsLoading(false); });

    // Load offer for offer/accepted/hired stages
    const offerStages = ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION', 'OFFER_ACCEPTED', 'HIRED'];
    if (offerStages.includes(selectedApplication.backendStage)) {
      if (!offers[selectedApplication.id]) {
        setOfferLoading(true);
        apiFetch(`/api/offers/applications/${selectedApplication.id}`)
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (cancelled) return;
            if (data) {
              // API may return array or single object
              const offer = Array.isArray(data) ? data[0] : data;
              if (offer) setOffers(prev => ({ ...prev, [selectedApplication.id]: offer }));
            }
          })
          .catch(() => {})
          .finally(() => { if (!cancelled) setOfferLoading(false); });
      }
    }
    return () => { cancelled = true; };
  }, [selectedApplication]);

  // Rate application
  const handleRate = async (applicationId: string, rating: number) => {
    setRatingUpdating(true);
    try {
      const response = await apiFetch(`/api/applications/${applicationId}/rate?rating=${rating}`, { method: 'POST' });
      if (response.ok) {
        setApplications(prev => prev.map(a => a.id === applicationId ? { ...a, rating } : a));
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? { ...prev, rating } : prev);
        }
      }
    } catch {}
    setRatingUpdating(false);
  };

  // Refresh offer data
  const refreshOffer = async (applicationId: string) => {
    try {
      const res = await apiFetch(`/api/offers/applications/${applicationId}`);
      if (res.ok) {
        const data = await res.json();
        const offer = Array.isArray(data) ? data[0] : data;
        if (offer) setOffers(prev => ({ ...prev, [applicationId]: offer }));
      }
    } catch {}
  };

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
  const handleStageTransition = (applicationId: string, targetBackendStage: string, _notes?: string) => {
    const group = STAGE_GROUPS.find(g => (g.backendStages as readonly string[]).includes(targetBackendStage));
    setStageTransitionConfirm({ applicationId, targetStage: targetBackendStage, stageName: group?.displayName || targetBackendStage });
  };

  const confirmStageTransition = async () => {
    if (!stageTransitionConfirm) return;
    const { applicationId, targetStage } = stageTransitionConfirm;
    setStageTransitionConfirm(null);
    try {
      const response = await apiFetch(
        `/api/pipeline/applications/${applicationId}/move?targetStage=${encodeURIComponent(targetStage)}&performedBy=1`,
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
  const handleProgressToNext = (applicationId: string) => {
    setProgressConfirm(applicationId);
  };

  const confirmProgressToNext = async () => {
    if (!progressConfirm) return;
    const applicationId = progressConfirm;
    setProgressConfirm(null);
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
  const handleBulkMove = (targetStageId: string) => {
    setBulkMoveConfirm(targetStageId);
  };

  const confirmBulkMove = async () => {
    if (!bulkMoveConfirm) return;
    const targetStageId = bulkMoveConfirm;
    setBulkMoveConfirm(null);
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
    setShowBulkRejectConfirm(true);
  };

  const confirmBulkReject = async () => {
    setShowBulkRejectConfirm(false);
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
      <button
        onClick={() => toast('Export feature coming soon', 'info')}
        className="btn-primary inline-flex items-center"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        Export
      </button>
      <button
        onClick={() => toast('Add Application feature coming soon', 'info')}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta border-2 border-cta text-foreground font-semibold text-sm uppercase tracking-wider transition-all hover:bg-cta-hover hover:border-cta-hover"
      >
        <PlusIcon className="w-4 h-4" />
        Add Candidate
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper title="Recruitment Pipeline" subtitle="Loading pipeline data..." actions={actions}>
        <KanbanSkeleton />
      </PageWrapper>
    );
  }

  if (error && applications.length === 0) {
    return (
      <PageWrapper title="Recruitment Pipeline" subtitle="Track and manage candidates across all hiring stages" actions={actions}>
        <ErrorState
          title="Failed to Load Pipeline"
          message={error}
          onRetry={loadPipelineData}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Recruitment Pipeline"
      subtitle="Track and manage candidates across all hiring stages"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { icon: UserGroupIcon, label: 'Total Candidates', value: pipelineMetrics.totalApplications, iconColor: 'text-accent-navy', iconBg: 'bg-icon-bg-navy' },
            { icon: ClockIcon, label: 'Avg Time in Pipeline', value: `${pipelineMetrics.averageTimeToHire}d`, iconColor: 'text-accent-teal', iconBg: 'bg-icon-bg-teal' },
            { icon: ChartBarIcon, label: 'Conversion Rate', value: `${pipelineMetrics.conversionRate}%`, iconColor: 'text-accent-gold', iconBg: 'bg-icon-bg-gold' },
            { icon: CheckCircleIcon, label: 'Active Applications', value: pipelineMetrics.activeApplications, iconColor: 'text-accent-pink', iconBg: 'bg-icon-bg-pink' },
          ].map((metric) => (
            <div key={metric.label} className="enterprise-card p-5 hover:-translate-y-px transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-card ${metric.iconBg} flex items-center justify-center shrink-0`}>
                  <metric.icon className={`w-6 h-6 ${metric.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{metric.value}</div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">{metric.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter / View Bar */}
        <div className="enterprise-card px-5 py-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
            {/* Left: filter selects */}
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                aria-label="Filter by stage"
                className="px-3 py-2 text-sm font-medium border border-border rounded-control bg-card text-foreground appearance-none pr-8 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C/polyline%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.12)] outline-none transition-all"
              >
                <option value="all">All Stages</option>
                {STAGE_GROUPS.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.displayName} ({pipelineMetrics.stageMetrics[stage.id]?.count || 0})
                  </option>
                ))}
              </select>

              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {filteredApplications.length} of {applications.length} candidates
              </span>
            </div>

            {/* Center: search */}
            <div className="flex-[0_1_280px] min-w-[180px]">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  aria-label="Search candidates"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-medium border border-border rounded-control bg-card text-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(5,82,126,0.12)] outline-none transition-all"
                />
              </div>
            </div>

            {/* Right: view toggle buttons */}
            <div className="flex items-center gap-1">
              {[
                { id: 'kanban' as const, label: 'Kanban View', icon: (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="5" height="18" rx="1" /><rect x="10" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" />
                  </svg>
                )},
                { id: 'list' as const, label: 'List View', icon: (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                )},
                { id: 'funnel' as const, label: 'Funnel View', icon: (
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                )},
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id)}
                  aria-pressed={viewMode === mode.id}
                  title={mode.label}
                  className={`w-[38px] h-[38px] rounded-control border flex items-center justify-center transition-all ${
                    viewMode === mode.id
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
                  }`}
                >
                  {mode.icon}
                </button>
              ))}
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

        {/* Empty state when no applications exist at all */}
        {applications.length === 0 && (
          <EmptyState
            icon={FunnelIcon}
            title="Your pipeline is empty"
            description="Start by creating a job posting to receive applications, or add a candidate manually."
            action={{ label: 'Add Application', onClick: () => toast('Add Application feature coming soon', 'info') }}
          />
        )}

        {/* Pipeline Views */}
        {viewMode === 'funnel' && (() => {
          const funnelColors = ['bg-primary', 'bg-violet-500', 'bg-teal-600', 'bg-sky-500', 'bg-gold-600', 'bg-orange-500', 'bg-green-500'];
          return (
          <div className="enterprise-card p-8">
            <div className="space-y-1">
              {STAGE_GROUPS.map((stage, idx) => {
                const metrics = pipelineMetrics.stageMetrics[stage.id] || { count: 0, averageDays: 0, conversionRate: 0 };
                const maxCount = Math.max(...Object.values(pipelineMetrics.stageMetrics).map(m => m.count), 1);
                const width = maxCount > 0 ? (metrics.count / maxCount) * 100 : 0;

                return (
                  <div key={stage.id}>
                    <div className="flex items-center gap-4">
                      <div className="w-[120px] text-right text-sm font-semibold text-foreground shrink-0">
                        {stage.displayName}
                      </div>
                      <div className="flex-1 flex items-center gap-3">
                        <div
                          className={`h-11 rounded-control flex items-center px-4 text-white text-sm font-bold transition-all hover:opacity-90 hover:scale-y-105 min-w-[60px] ${funnelColors[idx] || 'bg-primary'}`}
                          style={{ width: `${Math.max(width, 8)}%` }}
                        >
                          {metrics.count}
                        </div>
                        <span className="text-[0.8125rem] font-bold text-foreground min-w-[30px]">{metrics.count}</span>
                      </div>
                    </div>
                    {idx < STAGE_GROUPS.length - 1 && (
                      <div className="flex items-center justify-center py-0.5 ml-[120px] pl-4">
                        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-button">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                          {metrics.conversionRate.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          );
        })()}

        {viewMode === 'kanban' && (() => {
          const columnAccentColors: Record<string, string> = {
            applied: 'border-t-primary',
            screening: 'border-t-violet-500',
            interviews: 'border-t-sky-500',
            checks: 'border-t-gold-600',
            offer: 'border-t-orange-500',
            accepted: 'border-t-green-500',
            hired: 'border-t-green-500',
          };
          const columnBadgeColors: Record<string, string> = {
            applied: 'bg-icon-bg-navy text-accent-navy',
            screening: 'bg-violet-100 text-violet-600',
            interviews: 'bg-sky-100 text-sky-500',
            checks: 'bg-icon-bg-gold text-accent-gold',
            offer: 'bg-orange-100 text-orange-500',
            accepted: 'bg-green-100 text-green-600',
            hired: 'bg-green-100 text-green-600',
          };
          return (
          <div role="region" aria-label="Pipeline kanban board" className="flex gap-4 overflow-x-auto pb-4">
            {STAGE_GROUPS.map((stage, stageIndex) => {
              const stageApplications = filteredApplications.filter(app => app.currentStage === stage.id);

              return (
                <div key={stage.id} role="list" aria-label={`${stage.displayName} stage`} className="min-w-[280px] max-w-[280px] bg-muted/40 border border-border rounded-card flex flex-col shrink-0">
                  {/* Column header with colored top border */}
                  <div className={`px-4 py-3 border-b border-border border-t-[3px] ${columnAccentColors[stage.id] || 'border-t-primary'} rounded-t-card flex items-center justify-between`}>
                    <h3 className="text-sm font-bold uppercase tracking-[0.04em] text-foreground">{stage.displayName}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-button min-w-[24px] text-center ${columnBadgeColors[stage.id] || 'bg-border text-muted-foreground'}`}>
                      {stageApplications.length}
                    </span>
                  </div>

                  {/* Cards container */}
                  <div className="p-3 flex flex-col gap-2.5 overflow-y-auto max-h-[520px] flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-sm">
                    {stageApplications.map(application => {
                      const isSelected = selectedIds.has(application.id);
                      const progressScore = Math.round(application.progress);
                      const scoreClass = progressScore >= 80 ? 'bg-surface-teal text-accent-teal' : progressScore >= 60 ? 'bg-surface-gold text-accent-gold' : 'bg-surface-pink text-accent-pink';
                      return (
                        <div
                          key={application.id}
                          role="listitem"
                          onClick={() => setSelectedApplication(application)}
                          className={`bg-card border rounded-card shadow-sm p-3.5 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-px relative group ${
                            isSelected ? 'border-primary shadow-[0_0_0_2px_rgba(5,82,126,0.2)]' : 'border-border'
                          }`}
                        >
                          {/* Checkbox - visible on hover or when selected */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(application.id);
                              else next.delete(application.id);
                              setSelectedIds(next);
                            }}
                            className={`absolute top-2.5 right-2.5 w-4 h-4 rounded border-2 border-border accent-primary transition-opacity ${
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          />

                          {/* Candidate name */}
                          <div className="font-bold text-sm text-foreground mb-0.5 pr-6">
                            {application.candidate.firstName} {application.candidate.lastName}
                          </div>

                          {/* Position */}
                          <div className="text-xs text-muted-foreground font-medium leading-snug mb-2.5">
                            {application.job.title}
                            {application.job.department && <> &middot; {application.job.department}</>}
                          </div>

                          {/* Sub-stage badge */}
                          {stage.backendStages.length > 1 && BACKEND_STAGE_DISPLAY[application.backendStage] && (
                            <span className="inline-block mb-2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground rounded">
                              {BACKEND_STAGE_DISPLAY[application.backendStage]}
                            </span>
                          )}

                          {/* Rating stars */}
                          {application.rating > 0 && (
                            <div className="flex items-center gap-0.5 mb-2">
                              {[1, 2, 3, 4, 5].map(s => (
                                s <= application.rating
                                  ? <StarIconSolid key={s} className="w-3 h-3 text-yellow-400" />
                                  : <StarIcon key={s} className="w-3 h-3 text-muted-foreground/40" />
                              ))}
                            </div>
                          )}

                          {/* Interview preview on interview cards */}
                          {stage.id === 'interviews' && interviewPreviews[application.id] && (() => {
                            const preview = interviewPreviews[application.id];
                            return (
                              <div className="mb-2 space-y-1">
                                {preview.nextDate && (
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <CalendarIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-foreground font-medium">
                                      {(() => {
                                        const d = new Date(preview.nextDate);
                                        const now = new Date();
                                        const diffDays = Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                        const time = d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
                                        if (diffDays === 0) return `Today ${time}`;
                                        if (diffDays === 1) return `Tomorrow ${time}`;
                                        if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`;
                                        return `${d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} ${time}`;
                                      })()}
                                    </span>
                                    {preview.nextType && (
                                      <StatusPill value={preview.nextType} domain="interviewType" size="sm" />
                                    )}
                                  </div>
                                )}
                                {preview.latestRecommendation && (
                                  <StatusPill value={preview.latestRecommendation} domain="interviewRecommendation" size="sm" />
                                )}
                              </div>
                            );
                          })()}

                          {/* Offer status badge on offer/accepted cards */}
                          {['offer', 'accepted'].includes(stage.id) && offers[application.id] && (
                            <div className="mb-2">
                              <StatusPill value={offers[application.id].status} domain="offerStatus" size="sm" />
                            </div>
                          )}

                          {/* Verification summary for checks-column apps */}
                          {stage.id === 'checks' && verificationSummaries[application.id] && (
                            <VerificationStatusSummary
                              summary={verificationSummaries[application.id]}
                              onInitiateChecks={() => setSelectedApplication(application)}
                              compact
                            />
                          )}

                          {/* Footer: days in stage + score */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground font-medium">
                              <ClockIcon className="w-3 h-3" />
                              {application.daysInStage === 0 ? 'Today' : `${application.daysInStage}d in stage`}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-button text-[0.6875rem] font-bold ${scoreClass}`}>
                              {progressScore}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          );
        })()}

        {viewMode === 'list' && (() => {
          const avatarColors = ['bg-primary', 'bg-accent-pink', 'bg-accent-teal', 'bg-accent-gold'];
          const stageTagColors: Record<string, string> = {
            applied: 'bg-surface-navy text-primary',
            screening: 'bg-violet-100 text-violet-600',
            interviews: 'bg-sky-100 text-sky-500',
            checks: 'bg-surface-gold text-accent-gold',
            offer: 'bg-orange-100 text-orange-500',
            accepted: 'bg-green-100 text-green-600',
            hired: 'bg-green-100 text-green-600',
          };
          return (
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={filteredApplications.length > 0 && filteredApplications.every(a => selectedIds.has(a.id))}
                        onChange={(e) => {
                          const next = new Set(selectedIds);
                          if (e.target.checked) {
                            filteredApplications.forEach(a => next.add(a.id));
                          } else {
                            filteredApplications.forEach(a => next.delete(a.id));
                          }
                          setSelectedIds(next);
                        }}
                        className="w-[18px] h-[18px] rounded border-2 border-border accent-primary"
                      />
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] cursor-pointer hover:text-primary whitespace-nowrap">Candidate</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] cursor-pointer hover:text-primary whitespace-nowrap">Position</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] cursor-pointer hover:text-primary whitespace-nowrap">Stage</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] cursor-pointer hover:text-primary whitespace-nowrap">Days in Stage</th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] cursor-pointer hover:text-primary whitespace-nowrap">Score</th>
                    <th className="py-3 px-4 w-[50px] text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((application, rowIdx) => {
                    const currentStageGroup = STAGE_GROUPS.find(s => s.id === application.currentStage);
                    const avatarBg = avatarColors[rowIdx % avatarColors.length];
                    const progressScore = Math.round(application.progress);
                    const scoreClass = progressScore >= 80 ? 'bg-surface-teal text-accent-teal' : progressScore >= 60 ? 'bg-surface-gold text-accent-gold' : 'bg-surface-pink text-accent-pink';

                    return (
                      <tr
                        key={application.id}
                        className={`border-b border-border transition-colors hover:bg-surface-navy/30 ${rowIdx % 2 === 1 ? 'bg-muted/30' : ''}`}
                      >
                        <td className="py-3 px-4 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(application.id)}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(application.id);
                              else next.delete(application.id);
                              setSelectedIds(next);
                            }}
                            className="w-[18px] h-[18px] rounded border-2 border-border accent-primary"
                          />
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full ${avatarBg} text-white flex items-center justify-center text-[0.6875rem] font-bold shrink-0`}>
                              {application.candidate.firstName?.[0]}{application.candidate.lastName?.[0]}
                            </div>
                            <span className="font-semibold text-foreground">
                              {application.candidate.firstName} {application.candidate.lastName}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle text-foreground">{application.job.title}</td>
                        <td className="py-3 px-4 align-middle">
                          {currentStageGroup && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-button text-xs font-semibold tracking-wide ${stageTagColors[currentStageGroup.id] || 'bg-muted text-muted-foreground'}`}>
                              {currentStageGroup.displayName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle text-foreground">
                          <span className={application.daysInStage > 7 ? 'text-destructive font-medium' : application.daysInStage > 3 ? 'text-yellow-600' : ''}>
                            {application.daysInStage === 0 ? 'Today' : `${application.daysInStage}d`}
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-button text-[0.6875rem] font-bold ${scoreClass}`}>
                            {progressScore}%
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <button
                            onClick={() => setSelectedApplication(application)}
                            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                            title="View details"
                          >
                            <EyeIcon className="w-[18px] h-[18px]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          );
        })()}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground rounded-card shadow-lg px-6 py-3 flex items-center gap-4 z-50 animate-in slide-in-from-bottom-4">
            <span className="text-sm font-bold">{selectedIds.size} selected</span>
            <div className="w-px h-6 bg-primary-foreground/30" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkMove(e.target.value);
                  e.target.value = '';
                }
              }}
              aria-label="Move selected candidates to stage"
              className="text-xs font-semibold uppercase tracking-[0.05em] border border-primary-foreground/30 rounded-button px-3 py-1.5 bg-transparent text-primary-foreground cursor-pointer"
              defaultValue=""
            >
              <option value="" disabled>Move to...</option>
              {STAGE_GROUPS.map(s => (
                <option key={s.id} value={s.id} className="text-foreground bg-card">{s.displayName}</option>
              ))}
            </select>
            <button
              onClick={handleBulkReject}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.05em] border border-primary-foreground/30 rounded-button px-3 py-1.5 text-primary-foreground hover:bg-primary-foreground/15 transition-all"
            >
              <XCircleIcon className="w-3.5 h-3.5" />
              Reject
            </button>
            <div className="w-px h-6 bg-primary-foreground/30" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="w-7 h-7 rounded-full bg-primary-foreground/15 text-primary-foreground flex items-center justify-center hover:bg-primary-foreground/30 transition-all"
              title="Clear selection"
            >
              <XCircleIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Application Detail Modal */}
        {selectedApplication && (() => {
          const currentGroupId = selectedApplication.currentStage;
          const currentGroup = STAGE_GROUPS.find(g => g.id === currentGroupId);
          const nextGroupStage = getNextGroupFirstStage(selectedApplication.backendStage);
          const nextGroup = nextGroupStage ? STAGE_GROUPS.find(g => (g.backendStages as readonly string[]).includes(nextGroupStage)) : null;
          const summary = verificationSummaries[selectedApplication.id];
          const checksBlocked = currentGroupId === 'checks' && summary?.enforceCheckCompletion && !summary?.allClear;
          const isChecksStage = ['REFERENCE_CHECK', 'BACKGROUND_CHECK'].includes(selectedApplication.backendStage);
          const isHiredStage = selectedApplication.backendStage === 'HIRED';
          const isOfferRelated = ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION', 'OFFER_ACCEPTED', 'HIRED'].includes(selectedApplication.backendStage);
          const isInterviewStage = ['FIRST_INTERVIEW', 'TECHNICAL_ASSESSMENT', 'SECOND_INTERVIEW', 'PANEL_INTERVIEW', 'MANAGER_INTERVIEW', 'FINAL_INTERVIEW'].includes(selectedApplication.backendStage);
          const showAiPanels = !isChecksStage && !isHiredStage;

          return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="pipeline-detail-title"
              className="bg-card rounded-control shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border"
            >
              {/* Modal Header with stage badge and move button */}
              <div className="px-6 py-4 border-b border-border flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 id="pipeline-detail-title" className="text-2xl font-bold text-foreground">
                      {selectedApplication.candidate.firstName} {selectedApplication.candidate.lastName}
                    </h2>
                    <StatusPill value={selectedApplication.backendStage} domain="pipelineStage" size="sm" />
                  </div>
                  <p className="text-muted-foreground">{selectedApplication.job.title} - {selectedApplication.job.department}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedApplication.status === 'active' && nextGroupStage && (
                    <button
                      onClick={() => { handleStageTransition(selectedApplication.id, nextGroupStage); setSelectedApplication(null); }}
                      disabled={checksBlocked}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        checksBlocked
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-cta text-cta-foreground hover:opacity-90'
                      }`}
                      title={checksBlocked ? 'Complete all verification checks before progressing' : `Move to ${nextGroup?.displayName || 'Next'}`}
                    >
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                      Move to {nextGroup?.displayName || 'Next'}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedApplication(null)}
                    aria-label="Close detail panel"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <XCircleIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Rating */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">Rating</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onClick={() => handleRate(selectedApplication.id, s === selectedApplication.rating ? 0 : s)}
                        disabled={ratingUpdating}
                        className="disabled:opacity-50"
                      >
                        {s <= selectedApplication.rating
                          ? <StarIconSolid className="w-5 h-5 text-yellow-400 hover:text-yellow-500" />
                          : <StarIcon className="w-5 h-5 text-muted-foreground/40 hover:text-yellow-300" />
                        }
                      </button>
                    ))}
                  </div>
                  {selectedApplication.rating > 0 && (
                    <span className="text-xs text-muted-foreground">{selectedApplication.rating}/5</span>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Candidate Information</h3>
                    <div className="bg-muted/50 rounded-control p-4 space-y-2">
                      <p><strong>Email:</strong> {selectedApplication.candidate.email}</p>
                      <p><strong>Phone:</strong> {selectedApplication.candidate.phone}</p>
                      <p><strong>Applied:</strong> {new Date(selectedApplication.submittedAt).toLocaleDateString()}</p>
                      <p><strong>Last Activity:</strong> {new Date(selectedApplication.lastActivity).toLocaleDateString()}</p>
                      <p><strong>Days in Stage:</strong> {selectedApplication.daysInStage}</p>
                    </div>

                    {/* Screening Notes */}
                    {selectedApplication.screeningNotes && (
                      <div>
                        <button
                          onClick={() => setScreeningNotesOpen(!screeningNotesOpen)}
                          className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-foreground/80"
                        >
                          <ChevronDownIcon className={`w-4 h-4 transition-transform ${screeningNotesOpen ? 'rotate-180' : ''}`} />
                          Screening Notes
                        </button>
                        {screeningNotesOpen && (
                          <div className="mt-2 bg-muted/50 rounded-control p-3 text-sm text-foreground">
                            {selectedApplication.screeningNotes}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents / CV Section */}
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <PaperClipIcon className="w-4 h-4" />
                        Documents
                      </h4>
                      {documentsLoading ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Loading documents...
                        </div>
                      ) : documents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No documents attached.</p>
                      ) : (
                        <div className="space-y-2">
                          {documents.map((doc: any) => (
                            <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-control p-2.5 border border-border">
                              <div className="flex items-center gap-2 min-w-0">
                                <DocumentTextIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">{doc.filename}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doc.type === 'CV' ? 'CV / Resume' : doc.type === 'SUPPORT' ? 'Supporting Document' : formatEnumValue(doc.type)}
                                    {doc.fileSizeFormatted && ` - ${doc.fileSizeFormatted}`}
                                  </p>
                                </div>
                              </div>
                              {doc.url && (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary hover:underline"
                                >
                                  <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                                  Download
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Application Timeline</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto">
                      {timelineLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : timelineEntries.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No timeline entries recorded yet.</p>
                      ) : (
                        timelineEntries.map((event, index) => (
                          <div key={index} className="flex space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center">
                                <div className="w-3 h-3 bg-gold-500 rounded-full"></div>
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-foreground">
                                <strong>{event.fromStage ? `${BACKEND_STAGE_DISPLAY[event.fromStage] || formatEnumValue(event.fromStage)} → ${BACKEND_STAGE_DISPLAY[event.toStage] || formatEnumValue(event.toStage)}` : (BACKEND_STAGE_DISPLAY[event.toStage] || formatEnumValue(event.toStage))}</strong>
                                {event.performedBy && <span className="text-muted-foreground"> by {event.performedBy}</span>}
                              </div>
                              {event.reason && (
                                <div className="text-xs text-muted-foreground mt-0.5">{event.reason}</div>
                              )}
                              <div className="text-sm text-muted-foreground">
                                {new Date(event.createdAt).toLocaleDateString()} at {new Date(event.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Interview Summary Panel (Interview stages) */}
                {isInterviewStage && (
                  <div className="pt-6 border-t border-border">
                    <InterviewSummaryPanel
                      applicationId={selectedApplication.id}
                      candidateName={`${selectedApplication.candidate.firstName} ${selectedApplication.candidate.lastName}`}
                      jobTitle={selectedApplication.job.title}
                      onSchedule={() => {
                        setSchedulerApplicationId(Number(selectedApplication.id));
                      }}
                    />
                  </div>
                )}

                {/* Offer Summary Panel (Offer/Accepted/Hired) */}
                {isOfferRelated && (
                  <div className="pt-6 border-t border-border">
                    {offerLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Loading offer data...
                      </div>
                    ) : (
                      <OfferSummaryPanel
                        offer={offers[selectedApplication.id] || null}
                        applicationId={selectedApplication.id}
                        readOnly={isHiredStage}
                        onAction={() => refreshOffer(selectedApplication.id)}
                      />
                    )}
                  </div>
                )}

                {/* Verification Summary (for checks stage) */}
                {isChecksStage && verificationSummaries[selectedApplication.id] && (
                  <div className="pt-6 border-t border-border">
                    <VerificationStatusSummary
                      summary={verificationSummaries[selectedApplication.id]}
                    />
                  </div>
                )}

                {/* Background Screening */}
                {(isChecksStage || isHiredStage) && (
                  <div className="pt-6 border-t border-border">
                    <BackgroundCheckPanel
                      applicationId={selectedApplication.id}
                      candidateName={`${selectedApplication.candidate.firstName} ${selectedApplication.candidate.lastName}`}
                      candidateEmail={selectedApplication.candidate.email}
                      jobPostingId={selectedApplication.job?.id}
                      onClose={() => {}}
                      onChecksUpdated={() => loadVerificationSummaries(applications)}
                      readOnly={isHiredStage}
                    />
                  </div>
                )}

                {/* AI Candidate Assist — hidden for Checks and Hired stages */}
                {showAiPanels && (
                  <div className="pt-6 border-t border-border space-y-4">
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
                )}

                <div className="flex justify-end pt-6 border-t border-border">
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="inline-flex items-center px-5 py-2 rounded-button border-2 border-border text-muted-foreground font-semibold text-sm uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
      <ConfirmDialog
        open={showBulkRejectConfirm}
        title="Reject Candidates"
        message={`Reject ${selectedIds.size} selected candidates?`}
        confirmLabel="Reject"
        variant="danger"
        onConfirm={confirmBulkReject}
        onCancel={() => setShowBulkRejectConfirm(false)}
      />
      <ConfirmDialog
        open={stageTransitionConfirm !== null}
        title="Move Candidate"
        message={`Move this candidate to ${stageTransitionConfirm?.stageName || 'the selected stage'}?`}
        confirmLabel="Move"
        variant="warning"
        onConfirm={confirmStageTransition}
        onCancel={() => setStageTransitionConfirm(null)}
      />
      <ConfirmDialog
        open={progressConfirm !== null}
        title="Progress Candidate"
        message="Advance this candidate to the next pipeline stage?"
        confirmLabel="Progress"
        variant="warning"
        onConfirm={confirmProgressToNext}
        onCancel={() => setProgressConfirm(null)}
      />
      <ConfirmDialog
        open={bulkMoveConfirm !== null}
        title="Bulk Move Candidates"
        message={`Move ${selectedIds.size} selected candidates to ${STAGE_GROUPS.find(g => g.id === bulkMoveConfirm)?.displayName || 'the selected stage'}?`}
        confirmLabel="Move All"
        variant="warning"
        onConfirm={confirmBulkMove}
        onCancel={() => setBulkMoveConfirm(null)}
      />

      {/* Interview Scheduler Modal */}
      {schedulerApplicationId !== null && (
        <InterviewScheduler
          applicationId={schedulerApplicationId}
          onSuccess={() => {
            setSchedulerApplicationId(null);
            toast('Interview scheduled', 'success');
            // Refresh the interview panel if detail modal is open
            if (selectedApplication) {
              setSelectedApplication({ ...selectedApplication });
            }
          }}
          onCancel={() => setSchedulerApplicationId(null)}
          variant="modal"
        />
      )}
    </PageWrapper>
  );
}
