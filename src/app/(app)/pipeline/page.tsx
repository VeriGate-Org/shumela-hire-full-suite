'use client';

import { useRouter } from 'next/navigation';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PageWrapper from '@/components/PageWrapper';
import IdentityBand from '@/components/record/IdentityBand';
import { apiFetch, refusalMessage } from '@/lib/api-fetch';
import {
  BOARD_FILTERS,
  BoardCard,
  PipelineAnalytics,
  actionOwed,
  biggestDropOff,
  daysInStage,
  daysLabel,
  feedbackBadge,
  isBoardCard,
  isPipelineAnalytics,
  isStuck,
  legalMoves,
  matchesFilter as matchesBoardFilter,
  offerBadge,
  regressedIds,
  stageMedianDays,
  stageSampleSize,
  stuckCandidates,
} from './board';
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
import { isOpaqueId } from '@/utils/identity';
import AiCandidatePanel from '@/components/ai/AiCandidatePanel';
import AiAssistPanel from '@/components/ai/AiAssistPanel';
import AiCandidateRanking from '@/components/ai/AiCandidateRanking';
import AiOfferPrediction from '@/components/ai/AiOfferPrediction';
import BackgroundCheckPanel from '@/components/BackgroundCheckPanel';
import VerificationReportDownload from '@/components/VerificationReportDownload';
import ScreeningNotesPanel, { ScreeningNotesHandle } from '@/components/ScreeningNotesPanel';
import ShortlistButton from '@/components/ShortlistButton';
import BulkActionBar, { BulkSelect, BulkButton } from '@/components/record/BulkActionBar';
import { useAuth } from '@/contexts/AuthContext';
import VerificationStatusSummary, { VerificationSummary } from '@/components/VerificationStatusSummary';
import OfferSummaryPanel from '@/components/OfferSummaryPanel';
import InterviewSummaryPanel from '@/components/InterviewSummaryPanel';
import StatusPill from '@/components/StatusPill';
import ErrorState from '@/components/ErrorState';
import EmptyState from '@/components/EmptyState';
import { KanbanSkeleton } from '@/components/LoadingComponents';

// --- Stage grouping: maps 16 backend PipelineStage enum values into 7 display columns ---

// Stage colours come from the palette tokens. These were five hardcoded Tailwind ramps —
// bg-purple-100, bg-yellow-100, bg-green-100, bg-green-200, bg-green-600 text-white — that sat
// outside the ShumelaHire palette, did not survive dark mode, and carried no meaning beyond
// "further right".
const STAGE_GROUPS = [
  {
    id: 'applied',
    displayName: 'Applied',
    order: 1,
    color: 'bg-muted text-muted-foreground border-border',
    icon: UserIcon,
    description: 'Initial application submitted',
    backendStages: ['APPLICATION_RECEIVED'],
  },
  {
    id: 'screening',
    displayName: 'Screening',
    order: 2,
    color: 'bg-icon-bg-gold text-accent-gold border-border',
    icon: EyeIcon,
    description: 'Resume and initial screening',
    backendStages: ['INITIAL_SCREENING', 'PHONE_SCREENING'],
  },
  {
    id: 'interviews',
    displayName: 'Interviews',
    order: 3,
    color: 'bg-icon-bg-navy text-accent-navy border-border',
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
    color: 'bg-icon-bg-pink text-accent-pink border-border',
    icon: ShieldCheckIcon,
    description: 'Reference and background checks',
    backendStages: ['REFERENCE_CHECK', 'BACKGROUND_CHECK'],
  },
  {
    id: 'offer',
    displayName: 'Offer',
    order: 5,
    color: 'bg-icon-bg-teal text-accent-teal border-border',
    icon: BriefcaseIcon,
    description: 'Offer extended to candidate',
    backendStages: ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION'],
  },
  {
    id: 'accepted',
    displayName: 'Accepted',
    order: 6,
    color: 'bg-icon-bg-teal text-accent-teal border-accent-teal',
    icon: CheckCircleIcon,
    description: 'Offer accepted by candidate',
    backendStages: ['OFFER_ACCEPTED'],
  },
  {
    id: 'hired',
    displayName: 'Hired',
    order: 7,
    color: 'bg-accent-teal text-white border-accent-teal',
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
  /**
   * The raw stage-entry timestamp, unfilled.
   *
   * daysInStage above falls back to updatedAt when this is absent, which keeps an existing display
   * working. The stuck calculation deliberately does not: without a real entry time there is no
   * honest dwell, and inventing one from the last edit is the bug that made rating a candidate
   * reset their apparent dwell to zero.
   */
  pipelineStageEnteredAt?: string | null;
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
    /** Null when the analytics are unavailable — a conversion rate cannot be guessed from a snapshot. */
    conversionRate: number | null;
  }>;
}

export default function PipelinePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
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
  const [verificationSummaries, setVerificationSummaries] = useState<Record<string, VerificationSummary>>({});
  // Per-card decoration from GET /api/pipeline/board-cards. An id absent from this map means the
  // batch did not answer for it — which is not the same as the card having nothing to show.
  const [boardCards, setBoardCards] = useState<Record<string, BoardCard>>({});
  // Whole-pipeline analytics. Guarded, because this endpoint returned a 500 on every call until
  // the analytics were implemented and the page had no way of noticing.
  const [analytics, setAnalytics] = useState<PipelineAnalytics | null>(null);
  const [analyticsFailed, setAnalyticsFailed] = useState(false);
  const [boardFilter, setBoardFilter] = useState('all');
  const [offers, setOffers] = useState<Record<string, any>>({});
  const [offerLoading, setOfferLoading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showBulkRejectConfirm, setShowBulkRejectConfirm] = useState(false);
  const [stageTransitionConfirm, setStageTransitionConfirm] = useState<{ applicationId: string; targetStage: string; stageName: string } | null>(null);
  const [progressConfirm, setProgressConfirm] = useState<string | null>(null);
  const [bulkMoveConfirm, setBulkMoveConfirm] = useState<string | null>(null);
  const [bulkRatingConfirm, setBulkRatingConfirm] = useState<string | null>(null);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [ratingUpdating, setRatingUpdating] = useState(false);
  const [screeningNotesOpen, setScreeningNotesOpen] = useState(false);
  // Lets the AI notes drafter hand its text to the notes box instead of into the void.
  const notesPanelRef = useRef<ScreeningNotesHandle>(null);
  // Keyed by job id: the vacancy's required skills, which AI CV screening compares the candidate
  // against. It was never passed, so screening ran against an empty requirement list and could
  // only ever produce a generic reading.
  const [jobRequirements, setJobRequirements] = useState<Record<string, string[]>>({});
  // Loaded once for the whole board rather than per card — a shortlist control on every candidate
  // reading its own state would be a request per card on the busiest screen in the product.
  const [shortlistStates, setShortlistStates] = useState<Record<string, boolean>>({});

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
  /**
   * Legal moves, offer state and interview state for every card on the board, in one call.
   *
   * Replaces two per-card fetch loops. Cards the server did not answer for are left absent rather
   * than filled with an empty object, so the page can tell "nowhere to move" from "not loaded".
   */
  const loadBoardCards = useCallback(async (apps: Application[]) => {
    const ids = apps.map(a => String(a.id)).filter(Boolean);
    if (ids.length === 0) {
      setBoardCards({});
      return;
    }
    try {
      const response = await apiFetch(
        `/api/pipeline/board-cards?applicationIds=${ids.map(encodeURIComponent).join(',')}`,
      );
      if (!response.ok) {
        setBoardCards({});
        return;
      }
      const payload = await response.json();
      const valid: Record<string, BoardCard> = {};
      if (payload && typeof payload === 'object') {
        for (const [id, entry] of Object.entries(payload)) {
          if (isBoardCard(entry)) valid[id] = entry;
        }
      }
      setBoardCards(valid);
    } catch {
      setBoardCards({});
    }
  }, []);

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

  const loadShortlistStates = useCallback(async (apps: Application[]) => {
    if (apps.length === 0) {
      setShortlistStates({});
      return;
    }
    try {
      const ids = apps.map(a => a.id).join(',');
      const response = await apiFetch(`/api/shortlisting/applications/shortlist-states?applicationIds=${ids}`);
      if (response.ok) setShortlistStates((await response.json()) || {});
    } catch {
      // Shortlisting may not be enabled. The action still works; only the initial label is unknown.
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
        // pipelineStageEnteredAt is the field that means "entered this stage"; updatedAt moves on
        // any edit. Reading updatedAt first meant rating a candidate reset their apparent dwell to
        // zero, so a card stuck three weeks quietly became fresh the moment anyone touched it.
        const stageEnteredAt = a.pipelineStageEnteredAt || a.updatedAt;
        // Last activity is a different question from dwell — it is genuinely the last edit.
        const updatedAt = a.updatedAt || a.pipelineStageEnteredAt;
        const daysInStage = stageEnteredAt
          ? Math.floor((Date.now() - new Date(stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24))
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
          pipelineStageEnteredAt: a.pipelineStageEnteredAt ?? null,
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
      loadShortlistStates(mapped);
      // Card decoration in ONE call — legal moves, offer state, interview state.
      //
      // What stood here was two loops issuing one HTTP request per card:
      //   offerApps.forEach(a => apiFetch(`/api/offers/applications/${a.id}`))
      //   interviewApps.forEach(a => apiFetch(`/api/interviews/application/${a.id}`))
      // On a hundred-candidate board that is two hundred requests on load. Twelve lines above,
      // loadVerificationSummaries already did it correctly with a batched applicationIds call.
      loadBoardCards(mapped);
    } catch (err) {
      console.error('Failed to load pipeline data:', err);
      const msg = err instanceof Error ? err.message : 'Failed to load pipeline data';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [loadVerificationSummaries, loadShortlistStates, loadBoardCards]);

  // P5: Fetch backend analytics
  // Note: the backend /api/pipeline/analytics returns { funnel, averageStageDurations, conversions, ... }
  // which doesn't match the PipelineMetrics shape. Only use it if it actually has the expected keys;
  // otherwise fall through to client-side computation from loaded applications.
  /**
   * Whole-pipeline analytics.
   *
   * What stood here tested the response for `totalApplications` and `stageMetrics` and fell through
   * to client-side arithmetic when it did not find them. It never found them: the endpoint returned
   * a different shape entirely, and beneath that it threw on every call — its repository methods
   * had no working implementation at all. So the "fallback" was the only path that ever ran, and
   * nothing said so.
   *
   * A failure is now recorded rather than swallowed, because figures the page cannot compute must
   * read as unavailable, not as zero.
   */
  const loadAnalytics = useCallback(async () => {
    try {
      const response = await apiFetch('/api/pipeline/analytics');
      if (!response.ok) {
        setAnalytics(null);
        setAnalyticsFailed(true);
        return;
      }
      const payload = await response.json();
      if (isPipelineAnalytics(payload)) {
        setAnalytics(payload);
        setAnalyticsFailed(false);
      } else {
        setAnalytics(null);
        setAnalyticsFailed(true);
      }
    } catch {
      setAnalytics(null);
      setAnalyticsFailed(true);
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
          // Prefer the name: performedBy holds a user id, performedByName the
          // person. Taking performedBy first put a UUID on the timeline.
          performedBy: t.performedByName || t.performedBy || '',
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

    // Load the vacancy's required skills so AI CV screening has something to screen against.
    const jobId = selectedApplication.job.id;
    if (jobId && !jobRequirements[jobId]) {
      apiFetch(`/api/job-postings/${jobId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (cancelled || !data) return;
          const skills = [
            ...(Array.isArray(data.requiredSkills) ? data.requiredSkills : []),
            ...(Array.isArray(data.preferredSkills) ? data.preferredSkills : []),
          ].filter(Boolean);
          if (skills.length > 0) setJobRequirements(prev => ({ ...prev, [jobId]: skills }));
        })
        .catch(() => {});
    }

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

  const regressed = useMemo(() => regressedIds(analytics), [analytics]);

  /** Board-level triage counts. Every one is derived, and every one is also a filter. */
  const triage = useMemo(() => {
    const cards = applications.map(app => ({
      id: app.id,
      candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
      stage: app.backendStage,
      pipelineStageEnteredAt: app.pipelineStageEnteredAt,
    }));
    return {
      stuck: stuckCandidates(cards, analytics).length,
      regressed: cards.filter(c => regressed.has(String(c.id))).length,
      actionOwed: applications.filter(app => actionOwed(boardCards[String(app.id)])).length,
    };
  }, [applications, analytics, regressed, boardCards]);

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

      if (!matchesStage || !matchesSearch) return false;

      // Triage filters. A card whose stuck state is unknown does not count as stuck — see
      // isStuck, which returns null rather than false when there is no median to compare against.
      return matchesBoardFilter(
        boardFilter,
        {
          id: app.id,
          candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
          stage: app.backendStage,
          pipelineStageEnteredAt: app.pipelineStageEnteredAt,
        },
        boardCards[String(app.id)],
        analytics,
        regressed,
      );
    });
  }, [applications, selectedStage, searchTerm, viewMode, boardFilter, boardCards, analytics, regressed]);

  // P5: Use backend metrics with client-side fallback
  const pipelineMetrics = useMemo((): PipelineMetrics => {

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

    const stageMetrics: Record<string, { count: number; averageDays: number; conversionRate: number | null }> = {};

    // Exclude terminal-stage applications from per-stage counts so that
    // the dropdown, funnel, and kanban views all show consistent numbers.
    const nonTerminalApplications = applications.filter(app => !TERMINAL_STAGES.has(app.backendStage));

    let previousStageCount = 0;
    STAGE_GROUPS.forEach((stage, index) => {
      const stageApplications = nonTerminalApplications.filter(app => app.currentStage === stage.id);
      const averageDays = stageApplications.reduce((sum, app) => sum + app.daysInStage, 0) / Math.max(stageApplications.length, 1);

      // Stage-to-stage conversion, from real transitions.
      //
      // What stood here was `stageApplications.length / basis * 100` — the share of candidates
      // SITTING IN a stage, labelled a conversion rate. That is a snapshot of where people are
      // now, not the share who progressed through, and on any pipeline where candidates move at
      // different speeds the two diverge completely. `conversions` on the analytics response has
      // always been a genuine from-stage to-stage transition count; nothing read it.
      //
      // Null when the analytics are unavailable, because a distribution wearing a conversion
      // rate's label is worse than no figure at all.
      const reachedThis = stage.backendStages
        .map(bs => analytics?.reachedByStage?.[bs])
        .filter((n): n is number => typeof n === 'number')
        .reduce((a, b) => a + b, 0);
      const previousGroup = index === 0 ? null : STAGE_GROUPS[index - 1];
      const reachedPrevious = previousGroup
        ? previousGroup.backendStages
            .map(bs => analytics?.reachedByStage?.[bs])
            .filter((n): n is number => typeof n === 'number')
            .reduce((a, b) => a + b, 0)
        : totalApplications;
      const conversionRate = analytics && reachedPrevious > 0
        ? (reachedThis / reachedPrevious) * 100
        : null;

      stageMetrics[stage.id] = {
        count: stageApplications.length,
        averageDays: Math.round(averageDays),
        conversionRate: conversionRate === null ? null : Math.round(conversionRate * 10) / 10,
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
  }, [applications, analytics]);

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
        throw new Error(await refusalMessage(response));
      }
      toast('Stage transition saved', 'success');
      await loadPipelineData();
    } catch (error: any) {
      // The API explains a refusal in words ("required verification checks are not completed…").
      // Show those words: the rule is the point, and "HTTP 400" reads as a broken screen.
      toast(error.message || 'Could not move this candidate', 'error');
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
        throw new Error(await refusalMessage(response));
      }
      toast('Candidate progressed to next stage', 'success');
      await loadPipelineData();
    } catch (error: any) {
      toast(error.message || 'Could not progress this candidate', 'error');
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
      if (!response.ok) throw new Error(await refusalMessage(response));
      // Bulk is many decisions, not one: the server moves who it can and refuses who it cannot.
      // Reporting `ids.length` moved would claim a clean sweep while a candidate sat unmoved.
      const result = await response.json().catch(() => null);
      const refused: string[] = Array.isArray(result?.errors) ? result.errors : [];
      const moved: number = typeof result?.updatedCount === 'number' ? result.updatedCount : ids.length;

      if (refused.length > 0) {
        toast(
          `Moved ${moved} of ${ids.length} to ${group.displayName}. ${refused.length} blocked: ${refused.join(' · ')}`,
          moved > 0 ? 'info' : 'error'
        );
      } else {
        toast(`Moved ${moved} candidates to ${group.displayName}`, 'success');
      }
      setSelectedIds(new Set());
      await loadPipelineData();
    } catch (error: any) {
      toast(error.message || 'Bulk move failed', 'error');
    }
  };

  /*
   * Which bulk actions this person may use.
   *
   * /pipeline is reachable by anyone holding manage_pipeline — ADMIN, HR_MANAGER, RECRUITER and
   * HIRING_MANAGER. Both actions this bar has offered until now are ADMIN/HR_MANAGER on the
   * server, so a recruiter could select twenty candidates, press Reject, and be refused. Bulk
   * rating admits RECRUITER, which is why it is here: gating alone would leave a recruiter with a
   * bar containing nothing.
   */
  const role = user?.role;
  const canBulkStageOrStatus = role === 'ADMIN' || role === 'HR_MANAGER';
  const canBulkRate = canBulkStageOrStatus || role === 'RECRUITER';

  const confirmBulkRating = async () => {
    if (!bulkRatingConfirm) return;
    const rating = Number(bulkRatingConfirm);
    const ids = Array.from(selectedIds);
    setBulkRatingConfirm(null);
    try {
      const response = await apiFetch('/api/applications/manage/bulk/rating', {
        method: 'PUT',
        body: JSON.stringify({ ratings: Object.fromEntries(ids.map(id => [id, rating])) }),
      });
      if (!response.ok) throw new Error(await refusalMessage(response));

      const result = await response.json().catch(() => null);
      const changed = Array.isArray(result?.updatedIds) ? result.updatedIds.length : ids.length;
      toast(`Rated ${changed} candidate${changed === 1 ? '' : 's'} ${rating} of 5`, 'success');
      setSelectedIds(new Set());
      await loadPipelineData();
    } catch (error: any) {
      toast(error.message || 'Bulk rating failed', 'error');
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
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-button bg-cta border-2 border-cta text-cta-foreground font-semibold text-sm uppercase tracking-wider transition-all hover:bg-cta-hover hover:border-cta-hover"
      >
        <PlusIcon className="w-4 h-4" />
        Add Candidate
      </button>
    </div>
  );

  if (loading) {
    return (
      <PageWrapper>
        <IdentityBand
          eyebrow="Hiring pipeline"
          title="Recruitment Pipeline"
          subtitle="Loading pipeline data…"
          actions={actions}
        />
        <KanbanSkeleton />
      </PageWrapper>
    );
  }

  if (error && applications.length === 0) {
    return (
      <PageWrapper>
        <IdentityBand
          eyebrow="Hiring pipeline"
          title="Recruitment Pipeline"
          subtitle="Counts unavailable"
          actions={actions}
        />
        <ErrorState
          title="Failed to Load Pipeline"
          message={error}
          onRetry={loadPipelineData}
        />
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* Page header, not a record component under one — see #285. The stats bar below carries
          the four pipeline measures; the band carries who is in it and what is stuck. */}
      <IdentityBand
        eyebrow="Hiring pipeline"
        title="Recruitment Pipeline"
        subtitle={`${pipelineMetrics.totalApplications} ${
          pipelineMetrics.totalApplications === 1 ? 'candidate' : 'candidates'
        } · ${pipelineMetrics.activeApplications} still moving`}
        figures={[
          { label: 'Active', value: pipelineMetrics.activeApplications },
          {
            label: 'Average time in pipeline',
            value: `${pipelineMetrics.averageTimeToHire} days`,
            tone: (pipelineMetrics.averageTimeToHire >= 60 ? 'warning' : undefined) as 'warning' | undefined,
          },
          { label: 'Conversion', value: `${pipelineMetrics.conversionRate}%` },
        ]}
        actions={actions}
      />

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
                    {/* The share who progressed, from transitions. Absent rather than guessed when
                        the analytics did not answer — a distribution labelled as a conversion rate
                        is worse than no figure. */}
                    {idx < STAGE_GROUPS.length - 1 && (
                      <div className="flex items-center justify-center py-0.5 ml-[120px] pl-4">
                        <span className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-button">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
                          {metrics.conversionRate === null
                            ? 'conversion unavailable'
                            : `${metrics.conversionRate.toFixed(1)}%`}
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
          <>
          {/* Where this pipeline loses time. Every figure comes from the analytics endpoint, which
              until now threw on every call — so none of this has ever been rendered before. */}
          {analytics && (() => {
            const orderedStages = STAGE_GROUPS.flatMap(g => [...g.backendStages]);
            const drop = biggestDropOff(analytics, orderedStages);
            const slowest = analytics.slowestStage;
            if (!drop && !slowest && analytics.regressions.length === 0) return null;
            return (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                {slowest && (
                  <div className="enterprise-card p-4">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                      Slowest stage
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {BACKEND_STAGE_DISPLAY[slowest] ?? slowest}
                      <span className="ml-2 font-semibold text-accent-gold">
                        {daysLabel(analytics.slowestStageDays ?? null)} median
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Median, so one stuck candidate does not move it.
                    </p>
                  </div>
                )}
                {drop && (
                  <div className="enterprise-card p-4">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                      Biggest drop-off
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {BACKEND_STAGE_DISPLAY[drop.fromStage] ?? drop.fromStage} &rarr;{' '}
                      {BACKEND_STAGE_DISPLAY[drop.toStage] ?? drop.toStage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <b className="font-semibold text-foreground">{Math.round(drop.lostPercent)}%</b>{' '}
                      of candidates end here ({drop.lostCount}). Measured from transitions, not from
                      how many sit in each column.
                    </p>
                  </div>
                )}
                {analytics.regressions.length > 0 && (
                  <div className="enterprise-card p-4">
                    <p className="text-[0.625rem] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                      Moved backwards
                    </p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {analytics.regressions.length} this period
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.regressions[0].reason
                        ? `Most recent: ${analytics.regressions[0].reason}`
                        : 'A candidate returned to an earlier stage.'}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Triage. On a record you state one ask; on a board every card is an ask, so the useful
              line is what is wrong — and each count is a filter rather than a decoration. */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {BOARD_FILTERS.map(filter => {
              const count =
                filter.key === 'stuck' ? triage.stuck
                : filter.key === 'regressed' ? triage.regressed
                : filter.key === 'action-owed' ? triage.actionOwed
                : applications.length;
              const unavailable = filter.key === 'stuck' && !analytics;
              return (
                <button
                  key={filter.key}
                  onClick={() => setBoardFilter(filter.key)}
                  aria-pressed={boardFilter === filter.key}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    boardFilter === filter.key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {filter.label}
                  {/* No number rather than a zero when the figure could not be computed: "none are
                      stuck" and "we could not tell" are different answers. */}
                  {!unavailable && <span className="ml-1.5 tabular-nums">{count}</span>}
                </button>
              );
            })}
            {analyticsFailed && (
              <span className="text-xs text-error ml-1">
                Stage medians unavailable — nothing can be called stuck without them.
              </span>
            )}
          </div>

          <div role="region" aria-label="Pipeline kanban board" className="flex gap-4 overflow-x-auto pb-4">
            {STAGE_GROUPS.map((stage, stageIndex) => {
              const stageApplications = filteredApplications.filter(app => app.currentStage === stage.id);

              return (
                <div key={stage.id} role="list" aria-label={`${stage.displayName} stage`} className="min-w-[280px] max-w-[280px] bg-muted/40 border border-border rounded-card flex flex-col shrink-0">
                  {/* Column header carries the stage median, because "23 days here" only means
                      something next to it — without one, a slow stage and a slow candidate look
                      identical. Absent when the server measured nothing for this stage. */}
                  <div className={`px-4 py-3 border-b border-border border-t-[3px] ${columnAccentColors[stage.id] || 'border-t-primary'} rounded-t-card`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-[0.04em] text-foreground">{stage.displayName}</h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-button min-w-[24px] text-center ${columnBadgeColors[stage.id] || 'bg-border text-muted-foreground'}`}>
                        {stageApplications.length}
                      </span>
                    </div>
                    {(() => {
                      const medians = stage.backendStages
                        .map(backendStage => stageMedianDays(analytics, backendStage))
                        .filter((d): d is number => d !== null);
                      if (medians.length === 0) {
                        return (
                          <p className="text-[0.6875rem] text-muted-foreground/60 mt-0.5">
                            {analyticsFailed ? 'Median unavailable' : 'No median yet'}
                          </p>
                        );
                      }
                      // A group spans several backend stages; the slowest of them is the one worth
                      // showing, since that is where the column actually loses time.
                      const worst = Math.max(...medians);
                      const sample = stage.backendStages
                        .map(backendStage => stageSampleSize(analytics, backendStage) ?? 0)
                        .reduce((a, b) => a + b, 0);
                      return (
                        <p className="text-[0.6875rem] text-muted-foreground mt-0.5">
                          median <b className="font-semibold text-foreground">{daysLabel(worst)}</b>
                          {sample > 0 && <span className="text-muted-foreground/60"> · {sample} measured</span>}
                        </p>
                      );
                    })()}
                  </div>

                  {/* Cards container */}
                  <div className="p-2.5 flex flex-col gap-2 overflow-y-auto max-h-[560px] flex-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-sm">
                    {stageApplications.map(application => {
                      const isSelected = selectedIds.has(application.id);
                      const progressScore = Math.round(application.progress);
                      const scoreClass = progressScore >= 80 ? 'bg-surface-teal text-accent-teal' : progressScore >= 60 ? 'bg-surface-gold text-accent-gold' : 'bg-surface-pink text-accent-pink';
                      return (
                        <div
                          key={application.id}
                          role="listitem"
                          onClick={() => setSelectedApplication(application)}
                          className={`bg-card border rounded-card shadow-sm p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-px relative group ${
                            isSelected ? 'border-primary shadow-[0_0_0_2px_rgba(5,82,126,0.2)]' : 'border-border'
                          }`}
                        >
                          {/* Checkbox - visible on hover, on focus, or when selected.
                              It was revealed by group-hover alone, which does not fire for a
                              keyboard user: the control was in the tab order the whole time, so
                              focus landed on something invisible. Worse than being unreachable,
                              because the page appears to swallow the Tab key. focus-within is
                              already used a few lines below for the shortlist button. */}
                          <input
                            type="checkbox"
                            checked={isSelected}
                            aria-label={`Select ${application.candidate.firstName} ${application.candidate.lastName}`}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const next = new Set(selectedIds);
                              if (e.target.checked) next.add(application.id);
                              else next.delete(application.id);
                              setSelectedIds(next);
                            }}
                            className={`absolute top-2.5 right-2.5 w-4 h-4 rounded border-2 border-border accent-primary transition-opacity ${
                              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
                            }`}
                          />

                          {/* Candidate name — and the card's primary action.
                              Opening a candidate was an onClick on the card div with no tabIndex,
                              role or key handler, so the whole board was mouse-only: a keyboard or
                              screen-reader user could read every card and open none of them. A real
                              button carries Enter and Space for free. The card keeps its own
                              onClick, so clicking anywhere on it still works with a mouse. */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedApplication(application);
                            }}
                            className="block text-left font-bold text-[0.8125rem] text-foreground mb-0.5 pr-6 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            {application.candidate.firstName} {application.candidate.lastName}
                            <span className="sr-only"> — open candidate details</span>
                          </button>

                          {/* Position */}
                          <div className="text-[0.6875rem] text-muted-foreground font-medium leading-snug mb-2">
                            {application.job.title}
                            {application.job.department && <> &middot; {application.job.department}</>}
                          </div>

                          {/* Sub-stage badge */}
                          {stage.backendStages.length > 1 && BACKEND_STAGE_DISPLAY[application.backendStage] && (
                            <span className="inline-block mb-1.5 px-1.5 py-0.5 text-[0.625rem] font-medium uppercase tracking-wider bg-muted text-muted-foreground rounded">
                              {BACKEND_STAGE_DISPLAY[application.backendStage]}
                            </span>
                          )}

                          {/* Rating stars */}
                          {application.rating > 0 && (
                            <div className="flex items-center gap-0.5 mb-1.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                s <= application.rating
                                  ? <StarIconSolid key={s} className="w-3 h-3 text-yellow-400" />
                                  : <StarIcon key={s} className="w-3 h-3 text-muted-foreground/40" />
                              ))}
                            </div>
                          )}

                          {/* Interview preview on interview cards */}
                          {/* Interview preview, now from the batch call rather than a per-card
                              fetch. Same information, one request instead of one per candidate. */}
                          {stage.id === 'interviews' && boardCards[String(application.id)] && (() => {
                            const cardState = boardCards[String(application.id)];
                            const preview = {
                              nextDate: cardState.nextInterviewAt,
                              nextType: cardState.nextInterviewType,
                              latestRecommendation: cardState.latestRecommendation,
                            };
                            if (!preview.nextDate && !preview.latestRecommendation) return null;
                            return (
                              <div className="mb-1.5 space-y-0.5">
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

                          {/* Offer status, from the batch call. Only fires for an offer actually
                              with the candidate — a draft is not, and used to show here. */}
                          {['offer', 'accepted'].includes(stage.id)
                            && boardCards[String(application.id)]?.offerStatus && (
                            <div className="mb-2">
                              <StatusPill
                                value={boardCards[String(application.id)]!.offerStatus!}
                                domain="offerStatus"
                                size="sm"
                              />
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

                          {/* What is wrong with this card, if anything. Every badge is a stored
                              fact from the batch call — nothing here is inferred from position. */}
                          {(() => {
                            const cardState = boardCards[String(application.id)];
                            const stuck = isStuck(
                              {
                                id: application.id,
                                candidateName: `${application.candidate.firstName} ${application.candidate.lastName}`,
                                stage: application.backendStage,
                                pipelineStageEnteredAt: application.pipelineStageEnteredAt,
                              },
                              analytics,
                            );
                            const offer = offerBadge(cardState);
                            const feedback = feedbackBadge(cardState);
                            const wentBack = regressed.has(String(application.id));
                            if (!stuck && !offer && !feedback && !wentBack) return null;
                            return (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {stuck && (
                                  <span className="px-1.5 py-0.5 rounded text-[0.625rem] font-bold bg-surface-pink text-accent-pink">
                                    Past this stage&rsquo;s median
                                  </span>
                                )}
                                {wentBack && (
                                  <span className="px-1.5 py-0.5 rounded text-[0.625rem] font-bold bg-surface-gold text-accent-gold">
                                    Moved back
                                  </span>
                                )}
                                {feedback && (
                                  <span className="px-1.5 py-0.5 rounded text-[0.625rem] font-bold bg-surface-gold text-accent-gold">
                                    {feedback}
                                  </span>
                                )}
                                {offer && (
                                  <span className={`px-1.5 py-0.5 rounded text-[0.625rem] font-bold ${
                                    cardState?.offerExpiringSoon ? 'bg-surface-pink text-accent-pink' : 'bg-surface-teal text-accent-teal'
                                  }`}>
                                    {offer}
                                  </span>
                                )}
                              </div>
                            );
                          })()}

                          {/* Footer: days in stage + score */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-[0.6875rem] text-muted-foreground font-medium">
                              <ClockIcon className="w-3 h-3" />
                              {(() => {
                                // Dwell measured from the real stage-entry time only. Where that is
                                // absent the card says so rather than reporting "Today", which is
                                // what falling back to the last edit produced.
                                const dwell = daysInStage({
                                  id: application.id,
                                  candidateName: '',
                                  stage: application.backendStage,
                                  pipelineStageEnteredAt: application.pipelineStageEnteredAt,
                                });
                                if (dwell === null) return 'Time in stage unknown';
                                return dwell === 0 ? 'Today' : `${dwell}d in stage`;
                              })()}
                            </span>
                            <div className="flex items-center gap-1">
                              {/* Revealed on hover so the card stays readable at rest, but the
                                  action is one click away in the view people actually work in. */}
                              {application.status === 'active' && (
                                <span className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                  <ShortlistButton
                                    applicationId={application.id}
                                    candidateName={`${application.candidate.firstName} ${application.candidate.lastName}`}
                                    shortlisted={shortlistStates[application.id] ?? false}
                                    variant="icon"
                                    className="!w-6 !h-6"
                                  />
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-button text-[0.6875rem] font-bold ${scoreClass}`}>
                                {progressScore}%
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          </>
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
                    <th className="py-3 px-4 w-[90px] text-left text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] whitespace-nowrap">Actions</th>
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedApplication(application)}
                              className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-primary transition-all"
                              title="View details"
                              // The button was reachable but anonymous: an icon with a title and no
                              // text reads as "View details" on every row, so a screen-reader user
                              // hears the same label twenty times and cannot tell the rows apart.
                              aria-label={`View details for ${application.candidate.firstName} ${application.candidate.lastName}`}
                            >
                              <EyeIcon className="w-[18px] h-[18px]" />
                            </button>
                            {/* Shortlisting from the row is the quickest form of the action:
                                triaging a list is exactly when you want it. */}
                            {application.status === 'active' && (
                              <ShortlistButton
                                applicationId={application.id}
                                candidateName={`${application.candidate.firstName} ${application.candidate.lastName}`}
                                shortlisted={shortlistStates[application.id] ?? false}
                                variant="icon"
                              />
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
          );
        })()}

        {/* Bulk Action Bar — the same component the applications queue uses, so there is one
            selection model in the product rather than two that drift apart. */}
        <BulkActionBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
          {canBulkStageOrStatus && (
            <BulkSelect
              label="Move to stage"
              options={STAGE_GROUPS.map(g => ({ value: g.id, label: g.displayName }))}
              onChoose={handleBulkMove}
            />
          )}
          {canBulkRate && (
            <BulkSelect
              label="Set rating"
              options={[1, 2, 3, 4, 5].map(n => ({
                value: String(n),
                label: `${n} star${n === 1 ? '' : 's'}`,
              }))}
              onChoose={setBulkRatingConfirm}
            />
          )}
          {canBulkStageOrStatus && (
            <BulkButton onClick={handleBulkReject}>
              <XCircleIcon className="w-3.5 h-3.5" />
              Reject
            </BulkButton>
          )}
        </BulkActionBar>

        {/* Application Detail Modal */}
        {selectedApplication && (() => {
          const currentGroupId = selectedApplication.currentStage;
          const currentGroup = STAGE_GROUPS.find(g => g.id === currentGroupId);
          const nextGroupStage = getNextGroupFirstStage(selectedApplication.backendStage);
          // The moves the server says are legal. legalMoves returns null when the batch did not
          // answer for this card — distinct from an empty list, which means genuinely nowhere left
          // to go and correctly offers no button at all.
          const allowed = legalMoves(boardCards[String(selectedApplication.id)]);
          const serverMove = allowed === null
            ? nextGroupStage
            : allowed.find(stage => !TERMINAL_STAGES.has(stage)) ?? null;
          const serverMoveGroup = serverMove
            ? STAGE_GROUPS.find(g => (g.backendStages as readonly string[]).includes(serverMove))
            : null;
          const serverMoveLabel = serverMoveGroup?.displayName
            ?? (serverMove ? (BACKEND_STAGE_DISPLAY[serverMove] ?? 'Next') : 'Next');
          const summary = verificationSummaries[selectedApplication.id];
          const checksBlocked = currentGroupId === 'checks' && summary?.enforceCheckCompletion && !summary?.allClear;
          const isChecksStage = ['REFERENCE_CHECK', 'BACKGROUND_CHECK'].includes(selectedApplication.backendStage);
          const isHiredStage = selectedApplication.backendStage === 'HIRED';
          const isOfferRelated = ['OFFER_PREPARATION', 'OFFER_EXTENDED', 'OFFER_NEGOTIATION', 'OFFER_ACCEPTED', 'HIRED'].includes(selectedApplication.backendStage);
          const isInterviewStage = ['FIRST_INTERVIEW', 'TECHNICAL_ASSESSMENT', 'SECOND_INTERVIEW', 'PANEL_INTERVIEW', 'MANAGER_INTERVIEW', 'FINAL_INTERVIEW'].includes(selectedApplication.backendStage);
          const showAiPanels = !isChecksStage && !isHiredStage;
          // Applied and Screening are where a recruiter forms a view, so they get the two things
          // that were missing there: somewhere to record it, and sight of any verification already
          // on file. The full BackgroundCheckPanel stays with Checks — commissioning a paid check
          // is a different act from reading one.
          const isEarlyStage = ['applied', 'screening'].includes(currentGroupId);

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
                  {/* The full record, at an address. This modal stays because it is the
                      stage-transition workspace — the verification gate and the move-to-next rule
                      live here — but everything about the candidate now has one home, and this is
                      the way to it. */}
                  <a
                    href={`/applications/${selectedApplication.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Open full record
                  </a>
                  {selectedApplication.status === 'active' && (
                    <ShortlistButton
                      applicationId={selectedApplication.id}
                      candidateName={`${selectedApplication.candidate.firstName} ${selectedApplication.candidate.lastName}`}
                      shortlisted={shortlistStates[selectedApplication.id] ?? false}
                      onDone={(next) => setShortlistStates(prev => ({ ...prev, [selectedApplication.id]: next }))}
                    />
                  )}
                  {/* The move offered is the server's, not one derived by walking STAGE_GROUPS by
                      index. Where the batch has not answered, the client-side guess is used and the
                      button says nothing it cannot back up — but the server remains the authority
                      the moment its answer arrives. */}
                  {selectedApplication.status === 'active' && serverMove && (
                    <button
                      onClick={() => { handleStageTransition(selectedApplication.id, serverMove); setSelectedApplication(null); }}
                      disabled={checksBlocked}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                        checksBlocked
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-cta text-cta-foreground hover:opacity-90'
                      }`}
                      title={checksBlocked ? 'Complete all verification checks before progressing' : `Move to ${serverMoveLabel}`}
                    >
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                      Move to {serverMoveLabel}
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

              <div className="px-5 py-4 space-y-4">
                {/* The record's facts, as a definition grid.
                    This was a Rating row, a heading, and five stacked <p> tags inside a filled box
                    — around 320px of modal spent on eight short values, most of it gap. Four
                    columns of label-over-value say the same in a quarter of the height and match
                    how every other record surface in this product states its terms. */}
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-4">
                  <div className="min-w-0">
                    <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Email</dt>
                    <dd className="mt-0.5 truncate text-[0.8125rem]" title={selectedApplication.candidate.email}>
                      {selectedApplication.candidate.email || <span className="text-muted-foreground">Not recorded</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Phone</dt>
                    <dd className="mt-0.5 text-[0.8125rem] tabular-nums">
                      {selectedApplication.candidate.phone || <span className="text-muted-foreground">Not recorded</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Applied</dt>
                    <dd className="mt-0.5 text-[0.8125rem] tabular-nums">
                      {new Date(selectedApplication.submittedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">In this stage</dt>
                    <dd className={`mt-0.5 text-[0.8125rem] font-semibold tabular-nums ${selectedApplication.daysInStage >= 14 ? 'text-error' : ''}`}>
                      {selectedApplication.daysInStage} {selectedApplication.daysInStage === 1 ? 'day' : 'days'}
                    </dd>
                  </div>
                  <div className="col-span-2 sm:col-span-4">
                    <dt className="text-[0.5625rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Rating</dt>
                    <dd className="mt-0.5 flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleRate(selectedApplication.id, star === selectedApplication.rating ? 0 : star)}
                            disabled={ratingUpdating}
                            aria-label={`Rate ${star} of 5`}
                            className="disabled:opacity-50"
                          >
                            {star <= selectedApplication.rating
                              ? <StarIconSolid className="w-4 h-4 text-yellow-400 hover:text-yellow-500" />
                              : <StarIcon className="w-4 h-4 text-muted-foreground/40 hover:text-yellow-300" />}
                          </button>
                        ))}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {selectedApplication.rating > 0 ? `${selectedApplication.rating} of 5` : 'Not rated'}
                      </span>
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-4">
                    {/* Screening Notes — read-only summary. The early stages get the full
                        read-and-write panel lower down instead, so this would only duplicate it. */}
                    {!isEarlyStage && selectedApplication.screeningNotes && (
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
                    <h3 className="text-[0.6875rem] font-extrabold uppercase tracking-[0.14em] text-muted-foreground">Application Timeline</h3>
                    {/* No taller than its contents. A 256px scroll area was reserved whether or
                        not anything was in it, beside a single line of text. */}
                    <div className="space-y-2.5 max-h-52 overflow-y-auto">
                      {timelineLoading ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="h-3 w-3 animate-spin rounded-full border-b-2 border-primary" />
                          Loading history…
                        </div>
                      ) : timelineEntries.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No stage changes recorded yet.</p>
                      ) : (
                        timelineEntries.map((event, index) => (
                          <div key={index} className="flex gap-2.5">
                            <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gold-500" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-foreground">
                                <strong>{event.fromStage ? `${BACKEND_STAGE_DISPLAY[event.fromStage] || formatEnumValue(event.fromStage)} → ${BACKEND_STAGE_DISPLAY[event.toStage] || formatEnumValue(event.toStage)}` : (BACKEND_STAGE_DISPLAY[event.toStage] || formatEnumValue(event.toStage))}</strong>
                                {!isOpaqueId(event.performedBy) && event.performedBy && (
                                  <span className="text-muted-foreground"> by {event.performedBy}</span>
                                )}
                              </div>
                              {event.reason && (
                                <div className="text-xs text-muted-foreground mt-0.5">{event.reason}</div>
                              )}
                              <div className="text-[0.625rem] tabular-nums text-muted-foreground">
                                {new Date(event.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} at {new Date(event.createdAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
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
                      // Scheduling happens on the candidate's own record, not in a wizard opened
                      // from inside this modal. A modal on a modal left you unsure which of the two
                      // layers Cancel had just dismissed, and the record is where the interview
                      // belongs anyway.
                      onSchedule={() => {
                        router.push(
                          `/interviews/schedule?applicationId=${selectedApplication.id}` +
                            `&returnTo=/applications/${selectedApplication.id}`,
                        );
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

                {/* Screening notes and verification for the early stages. Interviews, Offer and
                    Checks each already have a panel for the work done there; Applied and Screening
                    had nothing, so a recruiter could form a view of a candidate and had nowhere to
                    put it. */}
                {isEarlyStage && (
                  <div className="pt-6 border-t border-border space-y-6">
                    <ScreeningNotesPanel
                      ref={notesPanelRef}
                      applicationId={selectedApplication.id}
                      notes={selectedApplication.screeningNotes}
                      onSaved={(allNotes) => {
                        setApplications(prev => prev.map(a =>
                          a.id === selectedApplication.id ? { ...a, screeningNotes: allNotes } : a));
                        setSelectedApplication(prev =>
                          prev ? { ...prev, screeningNotes: allNotes } : prev);
                      }}
                    />

                    {/* Verification already on file, readable from the stage where the screening
                        decision is made rather than only from Checks. */}
                    <VerificationReportDownload
                      applicationId={selectedApplication.id}
                      hideWhenEmpty={currentGroupId === 'applied'}
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
                      jobRequirements={jobRequirements[selectedApplication.job.id] || []}
                      // Without this the Notes tab drafted screening notes and then hid its own
                      // Apply button, because AiScreeningNotesDrafter only renders it when a
                      // handler exists. The AI wrote text that had nowhere to go — which is what
                      // made the panel look decorative in exactly the two stages it is most useful.
                      onApplyNotes={(text) => {
                        notesPanelRef.current?.setDraft(text);
                        toast('Draft moved to Screening Notes — review it, then save', 'info');
                      }}
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
        open={bulkRatingConfirm !== null}
        title="Rate Candidates"
        message={`Set ${selectedIds.size} selected candidate${selectedIds.size === 1 ? '' : 's'} to ${bulkRatingConfirm} of 5?`}
        confirmLabel="Apply Rating"
        variant="warning"
        onConfirm={confirmBulkRating}
        onCancel={() => setBulkRatingConfirm(null)}
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
    </PageWrapper>
  );
}
