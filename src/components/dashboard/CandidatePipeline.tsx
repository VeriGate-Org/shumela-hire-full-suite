import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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

  const totalCandidates = stages.reduce((total, stage) => total + stage.candidates.length, 0);
  const truncated = typeof totalAvailable === 'number' && totalAvailable > totalCandidates;
  const countLabel = truncated
    ? `${totalCandidates} of ${totalAvailable} candidates`
    : `${totalCandidates} active candidates`;

  return (
    /*
     * A plain card, not a DashboardWidget.
     *
     * <p>The widget wraps every panel in a 2px accent border, a refresh button and an overflow
     * menu. On a board that is already six columns of draggable cards that is chrome competing
     * with content, and none of it was in the design.
     */
    <section className={`bg-card border border-border rounded-card p-4 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[1.0625rem] font-bold text-foreground">{title}</h2>
          <p className="text-[0.8125rem] text-muted-foreground mt-0.5">
            {countLabel} · {subtitle}
          </p>
        </div>
      </div>

      {/*
       * Six across, and the counts live in the column headers.
       *
       * <p>This replaces a horizontally-scrolling board of fixed 288px columns that sat beneath a
       * separate four-across summary block repeating the same six numbers. The whole pipeline now
       * fits one screen without scrolling sideways, and each stage is counted once.
       */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {stages.map((stage) => {
          const currentPage = stagePages[stage.id] || 0;
          const totalPages = Math.ceil(stage.candidates.length / PAGE_SIZE);
          const shown = stage.candidates.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`min-w-0 rounded-control border p-2 transition-colors ${
                dragOverStage === stage.id
                  ? 'border-cta bg-surface-gold'
                  : 'border-border bg-background'
              }`}
            >
              <div className="flex items-baseline justify-between gap-1">
                <h3 className="text-[0.75rem] font-bold text-foreground truncate">{stage.name}</h3>
                <span className="text-[0.75rem] font-bold tabular-nums text-muted-foreground">
                  {stage.candidates.length}
                </span>
              </div>
              {/* stage.color is a CSS colour, not a class name — see the type's comment. */}
              <div className="h-[2px] rounded-full my-1.5" style={{ backgroundColor: stage.color }} />

              {stage.candidates.length === 0 ? (
                <p className="text-[0.6875rem] text-muted-foreground py-1">Nobody here</p>
              ) : (
                <div className="space-y-1">
                  {shown.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      onClick={() => onCandidateClick?.(candidate)}
                      title={`${candidate.name} — ${candidate.position}`}
                      className="cursor-move rounded-[5px] bg-muted px-1.5 py-1 hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[0.6875rem] font-medium text-foreground truncate">
                          {candidate.name || 'Unnamed'}
                        </span>
                        {candidate.score ? (
                          <span
                            className={`text-[0.625rem] font-bold tabular-nums flex-none ${
                              candidate.score >= 80
                                ? 'text-success-on-tint'
                                : candidate.score >= 60
                                  ? 'text-warning-on-tint'
                                  : 'text-error-on-tint'
                            }`}
                          >
                            {candidate.score}
                          </span>
                        ) : null}
                      </div>
                      <span className="block text-[0.625rem] text-muted-foreground truncate">
                        {candidate.position}
                      </span>
                    </div>
                  ))}

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[0.625rem] tabular-nums text-muted-foreground">
                        {currentPage * PAGE_SIZE + 1}–
                        {Math.min((currentPage + 1) * PAGE_SIZE, stage.candidates.length)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <button
                          aria-label={`Previous candidates in ${stage.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setStagePages((prev) => ({ ...prev, [stage.id]: currentPage - 1 }));
                          }}
                          disabled={currentPage === 0}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeftIcon className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          aria-label={`More candidates in ${stage.name}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setStagePages((prev) => ({ ...prev, [stage.id]: currentPage + 1 }));
                          }}
                          disabled={currentPage >= totalPages - 1}
                          className="p-0.5 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRightIcon className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CandidatePipeline;
