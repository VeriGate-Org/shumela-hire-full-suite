import React, { useState } from 'react';
import {
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EllipsisVerticalIcon,
  PhoneIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import DashboardWidget from './DashboardWidget';
import EmptyState from '@/components/EmptyState';

interface Candidate {
  id: string;
  name: string;
  email: string;
  position: string;
  avatar?: string;
  score?: number;
  appliedDate: string;
  source: string;
  status: 'new' | 'in_review' | 'interview_scheduled' | 'offer_made' | 'hired' | 'rejected';
  tags?: string[];
  nextAction?: {
    type: 'call' | 'interview' | 'review';
    date: string;
    description: string;
  };
}

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  candidates: Candidate[];
  capacity?: number;
}

interface CandidatePipelineProps {
  stages: PipelineStage[];
  onCandidateMove?: (candidateId: string, fromStage: string, toStage: string) => void;
  onCandidateClick?: (candidate: Candidate) => void;
  title?: string;
  subtitle?: string;
  className?: string;
  /**
   * How many applications exist in total, when that differs from what was loaded.
   *
   * The subtitle used to read `${rendered} active candidates`, which is not a count of anything
   * the user would recognise — it was min(pageSize, total) minus any status the mapping did not
   * know. On a tenant with 92 applications it confidently said 48. Pass the real total and the
   * widget will say when it is showing a subset instead of implying it is showing everything.
   */
  totalAvailable?: number;
}

/**
 * True only for a value a browser can actually load as an image.
 *
 * `avatar` is typed as a string and rendered into <img src>, but the only caller passes
 * INITIALS — HiringManagerDashboard sets `avatar: getInitials(name)`. "AN" is truthy, so the old
 * check fell into the <img> branch and every card on the Talent Acquisition dashboard showed a
 * broken-image glyph beside the candidate's name.
 *
 * Rendering the initials is better than falling back to a generic person icon: the rest of the
 * product already identifies candidates by initials circles, so this matches an existing
 * convention rather than introducing a second one.
 */
function isImageSrc(value?: string): boolean {
  if (!value) return false;
  return /^(https?:\/\/|data:|blob:|\/)/.test(value.trim());
}

const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
  stages: initialStages,
  onCandidateMove,
  onCandidateClick,
  title = "Candidate Pipeline",
  subtitle = "Drag candidates between stages",
  className = '',
  totalAvailable,
}) => {
  const PAGE_SIZE = 5;
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [stagePages, setStagePages] = useState<Record<string, number>>({});

  const handleDragStart = (candidate: Candidate) => {
    setDraggedCandidate(candidate);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, toStageId: string) => {
    e.preventDefault();
    setDragOverStage(null);

    if (!draggedCandidate) return;

    const fromStage = stages.find(stage => 
      stage.candidates.some(c => c.id === draggedCandidate.id)
    );

    if (!fromStage || fromStage.id === toStageId) return;

    // Update local state
    setStages(prevStages => 
      prevStages.map(stage => {
        if (stage.id === fromStage.id) {
          return {
            ...stage,
            candidates: stage.candidates.filter(c => c.id !== draggedCandidate.id),
          };
        }
        if (stage.id === toStageId) {
          return {
            ...stage,
            candidates: [...stage.candidates, draggedCandidate],
          };
        }
        return stage;
      })
    );

    // Notify parent component
    onCandidateMove?.(draggedCandidate.id, fromStage.id, toStageId);
    setDraggedCandidate(null);
  };

  const getStatusIcon = (status: Candidate['status']) => {
    switch (status) {
      case 'new':
        return <UserIcon className="w-4 h-4 text-gold-600" />;
      case 'in_review':
        return <ClockIcon className="w-4 h-4 text-warning-on-tint" />;
      case 'interview_scheduled':
        return <CalendarIcon className="w-4 h-4 text-link" />;
      case 'offer_made':
        return <DocumentTextIcon className="w-4 h-4 text-success-on-tint" />;
      case 'hired':
        return <CheckCircleIcon className="w-4 h-4 text-success-on-tint" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4 text-error-on-tint" />;
      default:
        return <UserIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNextActionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneIcon className="w-3 h-3" />;
      case 'interview':
        return <CalendarIcon className="w-3 h-3" />;
      case 'review':
        return <DocumentTextIcon className="w-3 h-3" />;
      default:
        return <ClockIcon className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-ZA');
  };

  const totalCandidates = stages.reduce((total, stage) => total + stage.candidates.length, 0);
  const truncated = typeof totalAvailable === 'number' && totalAvailable > totalCandidates;
  const countLabel = truncated
    ? `${totalCandidates} of ${totalAvailable} candidates`
    : `${totalCandidates} active candidates`;

  return (
    <DashboardWidget
      id="candidate-pipeline"
      title={title}
      subtitle={`${countLabel} • ${subtitle}`}
      className={className}
      refreshable={true}
      size="large"
    >
      <div className="h-full flex flex-col">
        {/* Pipeline Summary */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-control">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            {stages.map((stage) => (
              <div key={stage.id} className="text-center">
                <div 
                  className="text-xl font-bold"
                  style={{ color: stage.color }}
                >
                  {stage.candidates.length}
                </div>
                <div className="text-sm text-gray-600">{stage.name}</div>
                {stage.capacity && (
                  <div className="text-xs text-gray-500">
                    /{stage.capacity} max
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="flex-1 overflow-x-auto min-h-0">
          <div className="flex gap-4 min-w-max pb-4 h-full">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`flex-shrink-0 w-72 bg-gray-50 rounded-control p-4 flex flex-col ${
                  dragOverStage === stage.id ? 'ring-2 ring-gold-500 bg-gold-50' : ''
                }`}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-3 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    <h3 className="font-medium text-gray-900 text-sm">{stage.name}</h3>
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                      {stage.candidates.length}
                    </span>
                  </div>
                  {stage.capacity && stage.candidates.length >= stage.capacity && (
                    <span className="text-error-on-tint text-xs">Full</span>
                  )}
                </div>

                {/* Candidates */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {(() => {
                    const currentPage = stagePages[stage.id] || 0;
                    const totalPages = Math.ceil(stage.candidates.length / PAGE_SIZE);
                    const paginatedCandidates = stage.candidates.slice(
                      currentPage * PAGE_SIZE,
                      (currentPage + 1) * PAGE_SIZE,
                    );
                    return paginatedCandidates;
                  })().map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      onClick={() => onCandidateClick?.(candidate)}
                      className="bg-card rounded-control p-3 border border-gray-200 cursor-move hover:shadow-md transition-shadow group"
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {isImageSrc(candidate.avatar) ? (
                            <img
                              src={candidate.avatar}
                              alt={candidate.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
                          ) : candidate.avatar ? (
                            <div
                              className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-700"
                              aria-label={candidate.name}
                            >
                              {candidate.avatar}
                            </div>
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm leading-tight break-words">
                              {candidate.name}
                            </h4>
                            <p className="text-xs text-gray-500 leading-tight break-words">
                              {candidate.position}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {candidate.score && (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              candidate.score >= 80 ? 'bg-success-bg text-success-on-tint' :
                              candidate.score >= 60 ? 'bg-warning-bg text-warning-on-tint' :
                              'bg-error-bg text-error-on-tint'
                            }`}>
                              {candidate.score}%
                            </span>
                          )}
                          {getStatusIcon(candidate.status)}
                        </div>
                      </div>

                      {/* Candidate Details */}
                      <div className="space-y-2">
                        <div className="flex flex-col gap-1 text-xs text-gray-500">
                          <span>Applied {formatDate(candidate.appliedDate)}</span>
                          <span>Source: {candidate.source}</span>
                        </div>

                        {/* Tags */}
                        {candidate.tags && candidate.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {candidate.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 bg-gold-100 text-violet-700 text-xs rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {candidate.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                +{candidate.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Next Action */}
                        {candidate.nextAction && (
                          <div className="flex flex-col gap-1 text-xs bg-warning-bg text-warning-on-tint p-2 rounded">
                            <div className="flex items-center gap-1">
                              {getNextActionIcon(candidate.nextAction.type)}
                              <span className="font-medium flex-1 break-words">
                                {candidate.nextAction.description}
                              </span>
                            </div>
                            <div className="text-xs text-warning-on-tint">
                              {formatDate(candidate.nextAction.date)}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions (shown on hover) */}
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                          <EllipsisVerticalIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Empty State */}
                  {stage.candidates.length === 0 && (
                    <EmptyState
                      icon={UserIcon}
                      title="No candidates yet"
                      description="Drag candidates here or create a job posting"
                      action={{ label: 'Create Job Posting', href: '/job-postings' }}
                    />
                  )}

                  {/* Pagination */}
                  {stage.candidates.length > PAGE_SIZE && (() => {
                    const currentPage = stagePages[stage.id] || 0;
                    const totalPages = Math.ceil(stage.candidates.length / PAGE_SIZE);
                    const rangeStart = currentPage * PAGE_SIZE + 1;
                    const rangeEnd = Math.min((currentPage + 1) * PAGE_SIZE, stage.candidates.length);
                    return (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-1">
                        <span className="text-[10px] text-gray-500">
                          {rangeStart}–{rangeEnd} of {stage.candidates.length}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStagePages(prev => ({ ...prev, [stage.id]: currentPage - 1 }));
                            }}
                            disabled={currentPage === 0}
                            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeftIcon className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStagePages(prev => ({ ...prev, [stage.id]: currentPage + 1 }));
                            }}
                            disabled={currentPage >= totalPages - 1}
                            className="p-0.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRightIcon className="w-3.5 h-3.5 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardWidget>
  );
};

export default CandidatePipeline;
