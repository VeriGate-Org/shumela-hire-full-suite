'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, WellnessProgram } from '@/services/engagementService';
import { HeartIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';

/* ------------------------------------------------------------------ */
/* Type-aware colour maps (design-system tokens, no hardcoded hex)    */
/* ------------------------------------------------------------------ */
const TYPE_CONFIG: Record<
  string,
  {
    iconBg: string;
    iconColor: string;
    labelBg: string;
    labelColor: string;
    barFill: string;
  }
> = {
  PHYSICAL: {
    iconBg: 'bg-icon-bg-teal',
    iconColor: 'text-accent-teal',
    labelBg: 'bg-surface-teal',
    labelColor: 'text-accent-teal',
    barFill: 'bg-accent-teal',
  },
  MENTAL: {
    iconBg: 'bg-icon-bg-navy',
    iconColor: 'text-accent-navy',
    labelBg: 'bg-surface-navy',
    labelColor: 'text-accent-navy',
    barFill: 'bg-accent-navy',
  },
  FINANCIAL: {
    iconBg: 'bg-icon-bg-gold',
    iconColor: 'text-accent-gold',
    labelBg: 'bg-surface-gold',
    labelColor: 'text-accent-gold',
    barFill: 'bg-accent-gold',
  },
  SOCIAL: {
    iconBg: 'bg-icon-bg-pink',
    iconColor: 'text-accent-pink',
    labelBg: 'bg-surface-pink',
    labelColor: 'text-accent-pink',
    barFill: 'bg-accent-pink',
  },
};

const DEFAULT_CFG = TYPE_CONFIG.PHYSICAL;

/* ------------------------------------------------------------------ */
/* Inline SVG icon helpers (matching the mock)                        */
/* ------------------------------------------------------------------ */
function TypeIcon({ type }: { type: string }) {
  switch (type) {
    case 'PHYSICAL':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
        </svg>
      );
    case 'MENTAL':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
          <line x1="9" y1="21" x2="15" y2="21" /><line x1="10" y1="24" x2="14" y2="24" />
        </svg>
      );
    case 'FINANCIAL':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );
    case 'SOCIAL':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    default:
      return <HeartIcon className="w-6 h-6" />;
  }
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton Components                                                */
/* ------------------------------------------------------------------ */
function SkeletonStatCard() {
  return (
    <div className="enterprise-card p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-card bg-muted animate-pulse shrink-0" />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-5 w-2/5 rounded bg-muted animate-pulse" />
        <div className="h-3 w-3/5 rounded bg-muted animate-pulse" />
      </div>
    </div>
  );
}

function SkeletonProgramCard() {
  return (
    <div className="enterprise-card p-6 flex flex-col gap-3">
      <div className="flex gap-3.5 items-start">
        <div className="w-12 h-12 rounded-card bg-muted animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
          <div className="h-[18px] w-[70px] rounded-full bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-4/5 rounded bg-muted animate-pulse" />
      <div className="h-3 w-3/5 rounded bg-muted animate-pulse mt-1" />
      <div className="h-2 w-full rounded-full bg-muted animate-pulse mt-2" />
      <div className="border-t border-border mt-2 pt-3 flex justify-end">
        <div className="h-8 w-20 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function WellnessPage() {
  const [programs, setPrograms] = useState<WellnessProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadPrograms();
  }, []);

  async function loadPrograms() {
    setLoading(true);
    try {
      const data = await engagementService.getWellnessPrograms(0, 50);
      setPrograms(data.content);
    } catch (error) {
      console.error('Failed to load wellness programs:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin(programId: string) {
    const employeeId = prompt('Enter your employee ID:');
    if (!employeeId) return;
    try {
      await engagementService.joinWellnessProgram(programId, employeeId);
      loadPrograms();
    } catch (error: any) {
      alert(error.message || 'Failed to join program');
    }
  }

  const filteredPrograms = filter === 'all' ? programs :
    programs.filter(p => p.programType === filter);

  /* Derived stats */
  const stats = useMemo(() => {
    const activeCount = programs.filter(p => p.isActive).length;
    const totalParticipants = programs.reduce((sum, p) => sum + p.currentParticipants, 0);
    const totalCapacity = programs.reduce((sum, p) => sum + (p.maxParticipants ?? p.currentParticipants), 0);
    const participationRate = totalCapacity > 0 ? Math.round((totalParticipants / totalCapacity) * 100) : 0;
    return { activeCount, participationRate, totalParticipants };
  }, [programs]);

  return (
    <FeatureGate feature="WELLNESS_PROGRAMS">
      <PageWrapper
        title="Wellness Programs"
        subtitle="Physical, mental, financial, and social wellness initiatives"
        actions={
          <Link
            href="/engagement/wellness/indicators"
            className="btn-primary inline-flex items-center gap-2"
          >
            <ChartBarIcon className="w-4 h-4" />
            Wellness Indicators
          </Link>
        }
      >
        <div className="space-y-6">

          {/* ======== Stats Bar ======== */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Participation Rate',
                  value: `${stats.participationRate}%`,
                  iconBg: 'bg-icon-bg-navy',
                  iconColor: 'text-accent-navy',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  ),
                },
                {
                  label: 'Active Programs',
                  value: String(stats.activeCount),
                  iconBg: 'bg-icon-bg-teal',
                  iconColor: 'text-accent-teal',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  ),
                },
                {
                  label: 'Total Participants',
                  value: String(stats.totalParticipants),
                  iconBg: 'bg-icon-bg-gold',
                  iconColor: 'text-accent-gold',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ),
                },
                {
                  label: 'Program Types',
                  value: String(new Set(programs.map(p => p.programType)).size),
                  iconBg: 'bg-icon-bg-pink',
                  iconColor: 'text-accent-pink',
                  icon: (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform"
                >
                  <div className={`w-12 h-12 rounded-card ${stat.iconBg} flex items-center justify-center shrink-0`}>
                    <span className={stat.iconColor}>{stat.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{stat.value}</div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ======== Filter Pills ======== */}
          <div className="flex items-center gap-2 flex-wrap">
            {['all', 'PHYSICAL', 'MENTAL', 'FINANCIAL', 'SOCIAL'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`
                  px-[1.125rem] py-2 rounded-full border font-semibold text-[0.8125rem] whitespace-nowrap
                  transition-all duration-200 cursor-pointer
                  ${filter === f
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
                  }
                `}
              >
                {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* ======== Programs Grid ======== */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <SkeletonProgramCard key={i} />)}
            </div>
          ) : filteredPrograms.length === 0 ? (
            <div className="enterprise-card text-center py-12 px-6">
              <HeartIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-base font-semibold text-foreground mb-1">No programs found</h3>
              <p className="text-[0.9375rem] text-muted-foreground">Try a different filter to find wellness programs.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPrograms.map((program) => {
                const cfg = TYPE_CONFIG[program.programType] || DEFAULT_CFG;
                const isFull = program.maxParticipants !== null && program.currentParticipants >= program.maxParticipants;
                const pct = program.maxParticipants
                  ? Math.round((program.currentParticipants / program.maxParticipants) * 100)
                  : 0;

                return (
                  <div
                    key={program.id}
                    className="enterprise-card p-6 flex flex-col hover:-translate-y-0.5 transition-transform"
                  >
                    {/* Card Header: Icon + Name + Type Label */}
                    <div className="flex items-start gap-3.5 mb-3.5">
                      <div className={`w-12 h-12 rounded-card ${cfg.iconBg} flex items-center justify-center shrink-0`}>
                        <span className={cfg.iconColor}>
                          <TypeIcon type={program.programType} />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base text-foreground leading-snug mb-0.5">
                          {program.name}
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide ${cfg.labelBg} ${cfg.labelColor}`}
                        >
                          {program.programType}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[0.8125rem] text-muted-foreground leading-relaxed mb-4 flex-1">
                      {program.description}
                    </p>

                    {/* Meta Rows */}
                    <div className="flex flex-col gap-2.5 mb-4">
                      {program.startDate && (
                        <div className="flex items-center gap-2 text-[0.8125rem]">
                          <CalendarIcon />
                          <span className="text-muted-foreground font-medium">Next session:</span>
                          <strong className="text-foreground font-semibold">
                            {new Date(program.startDate).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                        </div>
                      )}
                      {program.endDate && (
                        <div className="flex items-center gap-2 text-[0.8125rem]">
                          <ClockIcon />
                          <span className="text-muted-foreground font-medium">Ends:</span>
                          <strong className="text-foreground font-semibold">
                            {new Date(program.endDate).toLocaleDateString('en-ZA', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Capacity Progress Bar */}
                    {program.maxParticipants !== null && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
                          <span className="text-muted-foreground">Capacity</span>
                          <span className="text-foreground">
                            {program.currentParticipants}/{program.maxParticipants} enrolled
                          </span>
                        </div>
                        <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-accent-pink' : cfg.barFill}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* If no maxParticipants, show participant count inline */}
                    {program.maxParticipants === null && (
                      <div className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground mb-4">
                        <UserGroupIcon className="w-3.5 h-3.5" />
                        {program.currentParticipants} participants
                      </div>
                    )}

                    {/* Divider */}
                    <div className="h-px bg-border mb-3.5" />

                    {/* Footer */}
                    <div className="flex items-center justify-end pt-1">
                      {program.isActive ? (
                        <button
                          onClick={() => handleJoin(program.id)}
                          disabled={isFull}
                          className={`
                            inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            font-semibold text-xs uppercase tracking-wider transition-all duration-200
                            ${isFull
                              ? 'bg-muted border-2 border-border text-muted-foreground cursor-not-allowed'
                              : 'bg-accent-teal border-2 border-accent-teal text-white hover:opacity-90'
                            }
                          `}
                        >
                          {isFull ? 'FULL' : 'JOIN'}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted border-2 border-border text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
