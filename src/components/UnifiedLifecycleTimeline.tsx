'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';

interface LifecycleEvent {
  eventId: string;
  entityType: string;
  entityId: string;
  eventType: string;
  title: string;
  description: string;
  timestamp: string;
  performedBy: string | null;
  status: string | null;
  previousStatus: string | null;
  metadata: Record<string, unknown> | null;
  icon: string;
  colorClass: string;
}

interface RecruitmentLifecycle {
  applicationId: number;
  applicantName: string;
  jobTitle: string;
  department: string;
  currentStage: string;
  startDate: string;
  endDate: string;
  totalDurationHours: number;
  timeline: LifecycleEvent[];
  eventCounts: Record<string, number>;
  totalEvents: number;
  interviewCount: number;
  offerCount: number;
  stageTransitionCount: number;
}

interface UnifiedLifecycleTimelineProps {
  applicationId: number;
  onClose: () => void;
}

const ENTITY_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REQUISITION:      { label: 'Requisition',   color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-300' },
  JOB_AD:           { label: 'Job Ad',        color: 'text-indigo-700',  bg: 'bg-indigo-50',  border: 'border-indigo-300' },
  APPLICATION:      { label: 'Application',   color: 'text-purple-700',  bg: 'bg-purple-50',  border: 'border-purple-300' },
  INTERVIEW:        { label: 'Interview',     color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-300' },
  OFFER:            { label: 'Offer',         color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
  SALARY_REC:       { label: 'Salary Rec',    color: 'text-orange-700',  bg: 'bg-orange-50',  border: 'border-orange-300' },
  PIPELINE:         { label: 'Pipeline',      color: 'text-violet-700',  bg: 'bg-violet-50',  border: 'border-violet-300' },
  BACKGROUND_CHECK: { label: 'Verification',  color: 'text-teal-700',    bg: 'bg-teal-50',    border: 'border-teal-300' },
  AUDIT:            { label: 'Audit',         color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-300' },
};

const ALL_ENTITY_TYPES = Object.keys(ENTITY_TYPE_CONFIG);

export default function UnifiedLifecycleTimeline({ applicationId, onClose }: UnifiedLifecycleTimelineProps) {
  const [lifecycle, setLifecycle] = useState<RecruitmentLifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(ALL_ENTITY_TYPES));
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const loadLifecycle = useCallback(async () => {
    try {
      const response = await apiFetch(`/api/lifecycle/applications/${applicationId}`);
      setLifecycle(await response.json());
    } catch (err) {
      console.error('Failed to load lifecycle:', err);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadLifecycle();
  }, [loadLifecycle]);

  const toggleFilter = (entityType: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(entityType)) {
        next.delete(entityType);
      } else {
        next.add(entityType);
      }
      return next;
    });
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const filteredEvents = lifecycle?.timeline.filter(e => activeFilters.has(e.entityType)) || [];

  const formatDuration = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading recruitment lifecycle...</span>
        </div>
      </div>
    );
  }

  if (!lifecycle) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center text-gray-500">
        Failed to load lifecycle data.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-violet-950">Recruitment Lifecycle</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {lifecycle.applicantName} &mdash; {lifecycle.jobTitle} ({lifecycle.department})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-violet-950">{lifecycle.totalEvents}</div>
            <div className="text-xs text-gray-500">Events</div>
          </div>
          <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-amber-700">{lifecycle.interviewCount}</div>
            <div className="text-xs text-gray-500">Interviews</div>
          </div>
          <div className="bg-emerald-50 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-emerald-700">{lifecycle.offerCount}</div>
            <div className="text-xs text-gray-500">Offers</div>
          </div>
          <div className="bg-violet-50 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-violet-700">{lifecycle.stageTransitionCount}</div>
            <div className="text-xs text-gray-500">Transitions</div>
          </div>
          <div className="bg-blue-50 rounded-lg px-3 py-2 text-center">
            <div className="text-xl font-bold text-blue-700">
              {lifecycle.totalDurationHours ? formatDuration(lifecycle.totalDurationHours) : '-'}
            </div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex flex-wrap gap-2">
          {ALL_ENTITY_TYPES.map(type => {
            const cfg = ENTITY_TYPE_CONFIG[type];
            const count = lifecycle.eventCounts[type] || 0;
            const isActive = activeFilters.has(type);

            if (count === 0) return null;

            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                  isActive
                    ? `${cfg.bg} ${cfg.color} ${cfg.border}`
                    : 'bg-white text-gray-400 border-gray-200'
                }`}
              >
                {cfg.label}
                <span className={`ml-1.5 ${isActive ? 'opacity-70' : 'opacity-40'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline */}
      <div className="px-6 py-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              const cfg = ENTITY_TYPE_CONFIG[event.entityType] || ENTITY_TYPE_CONFIG.AUDIT;
              const isExpanded = expandedEvents.has(event.eventId);

              return (
                <div key={event.eventId + '-' + index} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 top-2 w-5 h-5 rounded-full border-2 border-white shadow-sm ${cfg.bg.replace('50', '200')}`}>
                    <div className={`w-full h-full rounded-full ${cfg.bg.replace('50', '400')}`} style={{ opacity: 0.6 }} />
                  </div>

                  {/* Event card */}
                  <div
                    className={`border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow ${cfg.border} ${cfg.bg}`}
                    onClick={() => toggleExpand(event.eventId)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-semibold ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          {event.status && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-gray-600 font-medium">
                              {event.status.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 mt-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <div className="ml-4 text-right shrink-0">
                        <div className="text-xs text-gray-500">
                          {new Date(event.timestamp).toLocaleDateString('en-ZA', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(event.timestamp).toLocaleTimeString('en-ZA', {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-gray-200/50">
                        {event.previousStatus && (
                          <div className="text-xs text-gray-500 mb-1">
                            <span className="font-medium">From:</span> {event.previousStatus.replace(/_/g, ' ')}
                            {' → '}
                            <span className="font-medium">To:</span> {event.status?.replace(/_/g, ' ')}
                          </div>
                        )}
                        {event.performedBy && (
                          <div className="text-xs text-gray-500 mb-1">
                            <span className="font-medium">By:</span> User #{event.performedBy}
                          </div>
                        )}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="text-xs text-gray-500">
                            {Object.entries(event.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredEvents.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No events match the selected filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
