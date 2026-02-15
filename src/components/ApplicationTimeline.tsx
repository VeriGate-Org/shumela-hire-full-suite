'use client';

import React, { useState, useEffect } from 'react';

interface Application {
  id: number;
  applicant: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  jobPosting: {
    id: number;
    title: string;
    department: string;
  };
  pipelineStage: string;
  pipelineStageDisplayName: string;
  pipelineStageEnteredAt: string;
  submittedAt: string;
}

interface PipelineTransition {
  id: number;
  fromStage?: string;
  toStage: string;
  transitionType: string;
  reason?: string;
  notes?: string;
  automated: boolean;
  triggeredByInterviewId?: number;
  createdBy: number;
  createdAt: string;
  effectiveAt: string;
  durationInPreviousStageHours?: number;
}

interface ApplicationTimelineProps {
  application: Application;
  onClose: () => void;
  onStageTransition?: (applicationId: number, targetStage: string, reason?: string) => void;
}

const TRANSITION_TYPES = {
  PROGRESSION: { icon: '➡️', color: 'text-green-600', bg: 'bg-green-50' },
  REGRESSION: { icon: '⬅️', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  REJECTION: { icon: '❌', color: 'text-red-600', bg: 'bg-red-50' },
  WITHDRAWAL: { icon: '↩️', color: 'text-gray-600', bg: 'bg-gray-50' },
  REACTIVATION: { icon: '🔄', color: 'text-violet-600', bg: 'bg-violet-50' },
  HOLD: { icon: '⏸️', color: 'text-orange-600', bg: 'bg-orange-50' },
  SKIP: { icon: '⏭️', color: 'text-purple-600', bg: 'bg-purple-50' },
  RESTART: { icon: '🔄', color: 'text-indigo-600', bg: 'bg-indigo-50' }
};

const AVAILABLE_STAGES = [
  { value: 'INITIAL_SCREENING', label: 'Initial Screening' },
  { value: 'PHONE_SCREENING', label: 'Phone Screening' },
  { value: 'FIRST_INTERVIEW', label: 'First Interview' },
  { value: 'TECHNICAL_ASSESSMENT', label: 'Technical Assessment' },
  { value: 'SECOND_INTERVIEW', label: 'Second Interview' },
  { value: 'PANEL_INTERVIEW', label: 'Panel Interview' },
  { value: 'MANAGER_INTERVIEW', label: 'Manager Interview' },
  { value: 'FINAL_INTERVIEW', label: 'Final Interview' },
  { value: 'REFERENCE_CHECK', label: 'Reference Check' },
  { value: 'BACKGROUND_CHECK', label: 'Background Check' },
  { value: 'OFFER_PREPARATION', label: 'Offer Preparation' },
  { value: 'OFFER_EXTENDED', label: 'Offer Extended' },
  { value: 'OFFER_NEGOTIATION', label: 'Offer Negotiation' },
  { value: 'OFFER_ACCEPTED', label: 'Offer Accepted' },
  { value: 'HIRED', label: 'Hired' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn' }
];

export default function ApplicationTimeline({ application, onClose, onStageTransition }: ApplicationTimelineProps) {
  const [timeline, setTimeline] = useState<PipelineTransition[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTransitionForm, setShowTransitionForm] = useState(false);
  const [selectedStage, setSelectedStage] = useState('');
  const [transitionReason, setTransitionReason] = useState('');

  useEffect(() => {
    loadTimeline();
    loadAvailableStages();
  }, [application.id]);

  const loadTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/pipeline/applications/${application.id}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error('Error loading timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStages = async () => {
    try {
      const response = await fetch(`/api/pipeline/applications/${application.id}/available-transitions`);
      if (response.ok) {
        const data = await response.json();
        setAvailableStages(data.map((stage: any) => stage.name || stage));
      }
    } catch (error) {
      console.error('Error loading available stages:', error);
    }
  };

  const handleStageTransition = async () => {
    if (!selectedStage || !transitionReason.trim()) {
      alert('Please select a stage and provide a reason');
      return;
    }

    if (onStageTransition) {
      onStageTransition(application.id, selectedStage, transitionReason);
    }

    setShowTransitionForm(false);
    setSelectedStage('');
    setTransitionReason('');
    
    // Reload timeline after transition
    setTimeout(loadTimeline, 1000);
  };

  const formatDuration = (hours?: number) => {
    if (!hours) return 'N/A';
    
    if (hours < 24) {
      return `${hours.toFixed(1)} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days} days${remainingHours > 0 ? ` ${remainingHours.toFixed(1)}h` : ''}`;
    }
  };

  const getTransitionStyle = (transitionType: string) => {
    return TRANSITION_TYPES[transitionType as keyof typeof TRANSITION_TYPES] || 
           { icon: '📝', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Application Timeline</h2>
            <p className="text-sm text-gray-600">
              {application.applicant.firstName} {application.applicant.lastName} - {application.jobPosting.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Current Status */}
        <div className="px-6 py-4 bg-violet-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-violet-900">Current Stage</p>
              <p className="text-lg font-bold text-violet-600">{application.pipelineStageDisplayName}</p>
              <p className="text-sm text-violet-700">
                Entered on {new Date(application.pipelineStageEnteredAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowTransitionForm(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700"
            >
              Move Stage
            </button>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {timeline.length === 0 ? (
                <div className="text-center p-8">
                  <p className="text-gray-600">No timeline data available</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Timeline will show when stage transitions occur
                  </p>
                </div>
              ) : (
                timeline.map((transition, index) => {
                  const isFirst = index === 0;
                  const isLast = index === timeline.length - 1;
                  const style = getTransitionStyle(transition.transitionType);

                  return (
                    <div key={transition.id} className="relative">
                      {/* Timeline Line */}
                      {!isLast && (
                        <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-300"></div>
                      )}

                      <div className="flex items-start space-x-4">
                        {/* Timeline Icon */}
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full ${style.bg} flex items-center justify-center`}>
                          <span className="text-lg">{style.icon}</span>
                        </div>

                        {/* Transition Details */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {transition.fromStage ? 
                                    `${transition.fromStage} → ${transition.toStage}` : 
                                    `Started at ${transition.toStage}`
                                  }
                                </h4>
                                <p className={`text-sm font-medium ${style.color}`}>
                                  {transition.transitionType.replace('_', ' ')}
                                </p>
                              </div>
                              <div className="text-right text-sm text-gray-500">
                                <p>{new Date(transition.effectiveAt).toLocaleDateString()}</p>
                                <p>{new Date(transition.effectiveAt).toLocaleTimeString()}</p>
                              </div>
                            </div>

                            {transition.reason && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-600">
                                  <strong>Reason:</strong> {transition.reason}
                                </p>
                              </div>
                            )}

                            {transition.notes && (
                              <div className="mb-2">
                                <p className="text-sm text-gray-600">
                                  <strong>Notes:</strong> {transition.notes}
                                </p>
                              </div>
                            )}

                            <div className="flex justify-between items-center text-xs text-gray-500">
                              <div className="flex items-center space-x-4">
                                {transition.durationInPreviousStageHours && (
                                  <span>
                                    ⏱️ {formatDuration(transition.durationInPreviousStageHours)} in previous stage
                                  </span>
                                )}
                                
                                {transition.automated && (
                                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                                    🤖 Automated
                                  </span>
                                )}
                                
                                {transition.triggeredByInterviewId && (
                                  <span className="inline-flex items-center px-2 py-1 bg-violet-100 text-violet-800 rounded-full">
                                    📅 Interview Triggered
                                  </span>
                                )}
                              </div>
                              
                              <span>User ID: {transition.createdBy}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Stage Transition Form */}
        {showTransitionForm && (
          <div className="absolute inset-0 bg-white z-10">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Move to Stage</h3>
              <button
                onClick={() => setShowTransitionForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Stage *
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                >
                  <option value="">Select a stage...</option>
                  {AVAILABLE_STAGES
                    .filter(stage => availableStages.includes(stage.value))
                    .map(stage => (
                      <option key={stage.value} value={stage.value}>
                        {stage.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Transition *
                </label>
                <textarea
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
                  placeholder="Explain why this transition is being made..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowTransitionForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStageTransition}
                  disabled={!selectedStage || !transitionReason.trim()}
                  className="px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Move Stage
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}