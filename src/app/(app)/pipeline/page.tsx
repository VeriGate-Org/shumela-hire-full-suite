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
      <div className="flex rounded-sm border border-border">
        {[
          { id: 'kanban', name: 'Kanban', icon: UserGroupIcon },
          { id: 'list', name: 'List', icon: ChartBarIcon },
          { id: 'funnel', name: 'Funnel', icon: FunnelIcon }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id as any)}
            aria-pressed={viewMode === mode.id}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              viewMode === mode.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            } ${mode.id === 'kanban' ? 'rounded-l-sm' : mode.id === 'funnel' ? 'rounded-r-sm' : ''}`}
          >
            <mode.icon className="w-4 h-4 mr-2 inline" />
            {mode.name}
          </button>
        ))}
      </div>
      <button
        onClick={() => toast('Add Application feature coming soon', 'info')}
        className="btn-primary inline-flex items-center"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Add Application
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
      <PageWrapper title="Recruitment Pipeline" subtitle="Track candidates through the hiring process" actions={actions}>
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
      subtitle="Track candidates through the hiring process"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Pipeline Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: UserGroupIcon, label: 'Total Applications', value: pipelineMetrics.totalApplications, color: 'text-violet-500' },
            { icon: ClockIcon, label: 'Active Applications', value: pipelineMetrics.activeApplications, color: 'text-green-500' },
            { icon: ChartBarIcon, label: 'Avg. Time to Hire', value: `${pipelineMetrics.averageTimeToHire} days`, color: 'text-purple-500' },
            { icon: CheckCircleIcon, label: 'Conversion Rate', value: `${pipelineMetrics.conversionRate}%`, color: 'text-yellow-500' },
          ].map((metric) => (
            <div key={metric.label} className="enterprise-card p-4">
              <div className="flex items-center">
                <metric.icon className={`w-8 h-8 ${metric.color} shrink-0`} />
                <div className="ml-3 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground truncate">{metric.label}</p>
                  <p className="text-xl font-semibold text-foreground">{metric.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="enterprise-card p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search candidates or jobs..."
                  aria-label="Search candidates or jobs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-border rounded-sm bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                aria-label="Filter by stage"
                className="px-3 py-2 border border-border rounded-sm bg-card text-foreground focus:ring-2 focus:ring-ring/40 focus:border-ring"
              >
                <option value="all">All Stages</option>
                {STAGE_GROUPS.map(stage => (
                  <option key={stage.id} value={stage.id}>
                    {stage.displayName} ({pipelineMetrics.stageMetrics[stage.id]?.count || 0})
                  </option>
                ))}
              </select>

              <div className="text-sm text-muted-foreground">
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
        {viewMode === 'funnel' && (
          <div className="enterprise-card p-6">
            <div className="flex items-baseline justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Pipeline Funnel</h3>
              <p className="text-xs text-muted-foreground">Percentages show stage-to-stage conversion</p>
            </div>
            <div className="space-y-4">
              {STAGE_GROUPS.map((stage) => {
                const metrics = pipelineMetrics.stageMetrics[stage.id] || { count: 0, averageDays: 0, conversionRate: 0 };
                const maxCount = Math.max(...Object.values(pipelineMetrics.stageMetrics).map(m => m.count), 1);
                const width = maxCount > 0 ? (metrics.count / maxCount) * 100 : 0;

                return (
                  <div key={stage.id} className="flex items-center space-x-4">
                    <div className="w-32 text-sm font-medium text-foreground text-right">
                      {stage.displayName}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-8 relative">
                      <div
                        className="h-8 rounded-full flex items-center justify-between px-4 text-primary-foreground text-sm font-medium transition-all bg-primary"
                        style={{ width: `${Math.max(width, 10)}%` }}
                      >
                        <span>{metrics.count} candidates</span>
                        <span>{metrics.averageDays}d avg</span>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-muted-foreground text-center">
                      {metrics.conversionRate.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'kanban' && (
          <div className="enterprise-card p-4">
            <div role="region" aria-label="Pipeline kanban board" className="flex space-x-4 overflow-x-auto pb-4">
              {STAGE_GROUPS.map((stage, stageIndex) => {
                const stageApplications = filteredApplications.filter(app => app.currentStage === stage.id);
                const nextStage = STAGE_GROUPS[stageIndex + 1];
                const nextStageCount = nextStage
                  ? filteredApplications.filter(app => app.currentStage === nextStage.id).length
                  : 0;

                return (
                  <div key={stage.id} role="list" aria-label={`${stage.displayName} stage`} className="flex-shrink-0 w-64">
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
                            <span className="text-[10px] text-muted-foreground font-normal ml-2">
                              &rarr; {Math.round((nextStageCount / stageApplications.length) * 100)}%
                            </span>
                          )}
                        </span>
                      </div>
                      <p className="text-xs mt-1 opacity-75">{stage.description}</p>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {stageApplications.map(application => (
                        <div key={application.id} role="listitem" className="bg-card rounded-sm p-4 border border-border hover:shadow-sm transition-all">
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
                              <h4 className="font-medium text-foreground">
                                {application.candidate.firstName} {application.candidate.lastName}
                              </h4>
                              <p className="text-sm text-muted-foreground">{application.job.title}</p>
                              <p className="text-xs text-muted-foreground">{application.job.department}</p>
                              {application.rating > 0 && (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  {[1, 2, 3, 4, 5].map(s => (
                                    s <= application.rating
                                      ? <StarIconSolid key={s} className="w-3 h-3 text-yellow-400" />
                                      : <StarIcon key={s} className="w-3 h-3 text-muted-foreground/40" />
                                  ))}
                                </div>
                              )}
                              {stage.backendStages.length > 1 && BACKEND_STAGE_DISPLAY[application.backendStage] && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-muted text-muted-foreground rounded">
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
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
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

                          <div className="bg-muted rounded-full h-2 mb-3">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(application.progress, 100)}%` }}
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="text-primary hover:text-primary/80 text-xs font-medium"
                            >
                              <EyeIcon className="w-4 h-4 inline mr-1" />
                              View Details
                            </button>

                            {application.status === 'active' && stage.order < STAGE_GROUPS.length && (() => {
                              const nextGroupStage = getNextGroupFirstStage(application.backendStage);
                              const nextGroup = nextGroupStage ? STAGE_GROUPS.find(g => (g.backendStages as readonly string[]).includes(nextGroupStage)) : null;
                              const summary = verificationSummaries[application.id];
                              const checksBlocked = stage.id === 'checks' && summary?.enforceCheckCompletion && !summary?.allClear;
                              return nextGroupStage && (
                                <button
                                  onClick={() => !checksBlocked && handleStageTransition(application.id, nextGroupStage)}
                                  disabled={checksBlocked}
                                  className={`text-xs font-medium ${
                                    checksBlocked
                                      ? 'text-muted-foreground cursor-not-allowed'
                                      : 'text-green-600 hover:text-green-800'
                                  }`}
                                  title={checksBlocked ? 'Complete all verification checks before progressing' : `Move to ${nextGroup?.displayName || 'Next'}`}
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
          <div className="enterprise-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Position
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Days in Stage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApplications.map((application) => {
                    const currentStageGroup = STAGE_GROUPS.find(s => s.id === application.currentStage);

                    return (
                      <tr key={application.id} className="hover:bg-accent/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-10 h-10">
                              <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                                {application.candidate.firstName?.[0]}{application.candidate.lastName?.[0]}
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-foreground">
                                {application.candidate.firstName} {application.candidate.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">{application.candidate.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-foreground">{application.job.title}</div>
                          <div className="text-sm text-muted-foreground">{application.job.department}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {currentStageGroup && (
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStageGroup.color}`}>
                                <currentStageGroup.icon className="w-4 h-4 mr-1" />
                                {currentStageGroup.displayName}
                              </span>
                              {currentStageGroup.backendStages.length > 1 && BACKEND_STAGE_DISPLAY[application.backendStage] && (
                                <div className="text-[10px] text-muted-foreground mt-0.5">{BACKEND_STAGE_DISPLAY[application.backendStage]}</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(application.progress, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{application.progress.toFixed(0)}%</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                          <span className={application.daysInStage > 7 ? 'text-destructive font-medium' : application.daysInStage > 3 ? 'text-yellow-600' : ''}>
                            {application.daysInStage}d
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(application.priority)}`}>
                            {application.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
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
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-sm shadow-lg px-6 py-3 flex items-center gap-4 z-50">
            <span className="text-sm font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px bg-border" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkMove(e.target.value);
                  e.target.value = '';
                }
              }}
              aria-label="Move selected candidates to stage"
              className="text-sm border border-border rounded-sm px-2 py-1 bg-card text-foreground"
              defaultValue=""
            >
              <option value="" disabled>Move to...</option>
              {STAGE_GROUPS.map(s => (
                <option key={s.id} value={s.id}>{s.displayName}</option>
              ))}
            </select>
            <button
              onClick={handleBulkReject}
              className="text-sm text-destructive hover:text-destructive/80 font-medium"
            >
              Reject Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Clear
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
              className="bg-card rounded-sm shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border"
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
                    <div className="bg-muted/50 rounded-sm p-4 space-y-2">
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
                          <div className="mt-2 bg-muted/50 rounded-sm p-3 text-sm text-foreground">
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
                            <div key={doc.id} className="flex items-center justify-between bg-muted/50 rounded-sm p-2.5 border border-border">
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

                <div className="flex justify-end pt-6 border-t">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSchedulerApplicationId(null)} />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-card rounded-[2px] shadow-xl mx-4">
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
            />
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
