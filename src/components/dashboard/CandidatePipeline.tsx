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
}

const CandidatePipeline: React.FC<CandidatePipelineProps> = ({
  stages: initialStages,
  onCandidateMove,
  onCandidateClick,
  title = "Candidate Pipeline",
  subtitle = "Drag candidates between stages",
  className = '',
}) => {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

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
        return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'interview_scheduled':
        return <CalendarIcon className="w-4 h-4 text-purple-600" />;
      case 'offer_made':
        return <DocumentTextIcon className="w-4 h-4 text-green-600" />;
      case 'hired':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4 text-red-600" />;
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

  return (
    <DashboardWidget
      id="candidate-pipeline"
      title={title}
      subtitle={`${totalCandidates} active candidates • ${subtitle}`}
      className={className}
      refreshable={true}
      size="large"
    >
      <div className="h-full flex flex-col">
        {/* Pipeline Summary */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-sm">
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
                className={`flex-shrink-0 w-72 bg-gray-50 rounded-sm p-4 flex flex-col ${
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
                    <span className="text-red-500 text-xs">Full</span>
                  )}
                </div>

                {/* Candidates */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                  {stage.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => handleDragStart(candidate)}
                      onClick={() => onCandidateClick?.(candidate)}
                      className="bg-white rounded-sm p-3 border border-gray-200 cursor-move hover:shadow-md transition-shadow group"
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {candidate.avatar ? (
                            <img
                              src={candidate.avatar}
                              alt={candidate.name}
                              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            />
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
                              candidate.score >= 80 ? 'bg-green-100 text-green-800' :
                              candidate.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
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
                          <div className="flex flex-col gap-1 text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
                            <div className="flex items-center gap-1">
                              {getNextActionIcon(candidate.nextAction.type)}
                              <span className="font-medium flex-1 break-words">
                                {candidate.nextAction.description}
                              </span>
                            </div>
                            <div className="text-xs text-yellow-700">
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
