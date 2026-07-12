'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, Survey, Recognition, WellnessProgram, LeaderboardEntry } from '@/services/engagementService';
import {
  HeartIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/* Helper: get initials from a name string                             */
/* ------------------------------------------------------------------ */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ------------------------------------------------------------------ */
/* Colour-cycling helpers for avatars / ranks                          */
/* ------------------------------------------------------------------ */
const AVATAR_STYLES = [
  'bg-accent-navy text-white',
  'bg-accent-pink text-white',
  'bg-accent-teal text-white',
  'bg-accent-gold text-white',
];

const RANK_STYLES: Record<number, string> = {
  1: 'bg-icon-bg-gold text-accent-gold',
  2: 'bg-icon-bg-navy text-accent-navy',
  3: 'bg-icon-bg-teal text-accent-teal',
};

const PROGRESS_COLORS = [
  'bg-accent-navy',
  'bg-accent-teal',
  'bg-accent-gold',
  'bg-accent-pink',
];

const CATEGORY_STYLES: Record<string, string> = {
  TEAMWORK: 'bg-icon-bg-teal text-accent-teal',
  LEADERSHIP: 'bg-icon-bg-navy text-accent-navy',
  INNOVATION: 'bg-icon-bg-gold text-accent-gold',
  SAFETY: 'bg-icon-bg-pink text-accent-pink',
  SERVICE_EXCELLENCE: 'bg-surface-navy text-accent-navy',
  CUSTOMER_SERVICE: 'bg-surface-navy text-accent-navy',
};

const WELLNESS_ICON_STYLES = [
  'bg-icon-bg-teal text-accent-teal',
  'bg-icon-bg-navy text-accent-navy',
  'bg-icon-bg-gold text-accent-gold',
  'bg-icon-bg-pink text-accent-pink',
];

export default function EngagementDashboardPage() {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [recentRecognitions, setRecentRecognitions] = useState<Recognition[]>([]);
  const [activePrograms, setActivePrograms] = useState<WellnessProgram[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [surveys, recognitions, programs, leaders] = await Promise.all([
        engagementService.getActiveSurveys(),
        engagementService.getPublicRecognitions(0, 5),
        engagementService.getActiveWellnessPrograms(),
        engagementService.getLeaderboard(5),
      ]);
      setActiveSurveys(surveys);
      setRecentRecognitions(recognitions.content);
      setActivePrograms(programs);
      setLeaderboard(leaders);
    } catch (error) {
      console.error('Failed to load engagement dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  /* ----- Stat cards configuration ----- */
  const statCards = [
    {
      label: 'Active Surveys',
      value: activeSurveys.length,
      icon: ClipboardDocumentListIcon,
      href: '/engagement/surveys',
      iconBg: 'bg-icon-bg-navy',
      iconColor: 'text-accent-navy',
    },
    {
      label: 'Recent Recognitions',
      value: recentRecognitions.length,
      icon: StarIcon,
      href: '/engagement/recognition',
      iconBg: 'bg-icon-bg-teal',
      iconColor: 'text-accent-teal',
    },
    {
      label: 'Wellness Programs',
      value: activePrograms.length,
      icon: HeartIcon,
      href: '/engagement/wellness',
      iconBg: 'bg-icon-bg-gold',
      iconColor: 'text-accent-gold',
    },
    {
      label: 'Top Performers',
      value: leaderboard.length,
      icon: TrophyIcon,
      href: '/engagement/recognition',
      iconBg: 'bg-icon-bg-pink',
      iconColor: 'text-accent-pink',
    },
  ];

  /* ----- Header action buttons (matching mock's page-header-right) ----- */
  const headerActions = (
    <div className="flex items-center gap-3 flex-wrap">
      <Link href="/engagement/surveys" className="btn-primary inline-flex items-center gap-2 px-4 py-2 cursor-pointer">
        <ClipboardDocumentListIcon className="w-4 h-4" />
        Create Survey
      </Link>
      <Link href="/engagement/recognition/give" className="btn-primary inline-flex items-center gap-2 px-4 py-2 cursor-pointer">
        <StarIcon className="w-4 h-4" />
        Give Recognition
      </Link>
      <Link href="/engagement" className="btn-cta inline-flex items-center gap-2 px-4 py-2 cursor-pointer">
        <ChartBarIcon className="w-4 h-4" />
        View Reports
      </Link>
    </div>
  );

  /* ----- Loading skeleton state ----- */
  if (loading) {
    return (
      <PageWrapper title="Engagement Hub" subtitle="Employee engagement, recognition and wellness" actions={headerActions}>
        {/* Skeleton stats bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-7 w-16 rounded bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="enterprise-card">
              <div className="flex items-center justify-between px-5 pt-5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-control bg-muted animate-pulse" />
                  <div className="h-5 w-32 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-8 w-20 rounded-button bg-muted animate-pulse" />
              </div>
              <div className="px-5 pb-5 space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2 py-3 border-b border-border last:border-b-0">
                    <div className="flex justify-between">
                      <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                      <div className="h-4 w-10 rounded bg-muted animate-pulse" />
                    </div>
                    <div className="h-2.5 w-36 rounded bg-muted animate-pulse" />
                    <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Skeleton recognitions */}
        <div className="enterprise-card mb-6">
          <div className="flex items-center justify-between px-5 pt-5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-muted animate-pulse" />
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded-button bg-muted animate-pulse" />
          </div>
          <div className="px-5 pb-5 space-y-0">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-start gap-3 py-3.5 border-b border-border last:border-b-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
                  <div className="w-3.5 h-3.5 bg-muted animate-pulse" />
                  <div className="w-7 h-7 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-56 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-[90%] rounded bg-muted animate-pulse" />
                  <div className="flex gap-2.5">
                    <div className="h-[18px] w-16 rounded-button bg-muted animate-pulse" />
                    <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton wellness */}
        <div className="enterprise-card">
          <div className="flex items-center justify-between px-5 pt-5 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-control bg-muted animate-pulse" />
              <div className="h-5 w-36 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-20 rounded-button bg-muted animate-pulse" />
          </div>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border border-border rounded-control p-4 space-y-3">
                  <div className="w-10 h-10 rounded-control bg-muted animate-pulse" />
                  <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                  <div className="space-y-1.5">
                    <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Engagement Hub" subtitle="Employee engagement, recognition and wellness" actions={headerActions}>
      <div className="space-y-6">

        {/* ============================================================ */}
        {/* Stats Bar — 4-col grid matching mock's stats-bar              */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px cursor-pointer">
                <div className={`w-12 h-12 rounded-card ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{card.value}</div>
                  <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">{card.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ============================================================ */}
        {/* Content Grid — Active Surveys + Recognition Leaderboard       */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Active Surveys Card */}
          <FeatureGate feature="PULSE_SURVEYS">
            <div className="enterprise-card">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 pt-5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-control bg-icon-bg-navy flex items-center justify-center shrink-0">
                    <ClipboardDocumentListIcon className="w-[18px] h-[18px] text-accent-navy" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Active Surveys</h2>
                </div>
                <Link
                  href="/engagement/surveys"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border-2 border-border text-muted-foreground text-xs font-semibold uppercase tracking-wide hover:border-primary hover:text-primary transition-all"
                >
                  View All
                </Link>
              </div>

              {/* Card Body — survey items */}
              <div className="px-5 pb-5">
                {activeSurveys.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No active surveys</p>
                ) : (
                  <div className="divide-y divide-border">
                    {activeSurveys.slice(0, 5).map((survey, idx) => {
                      const progressColor = PROGRESS_COLORS[idx % PROGRESS_COLORS.length];
                      return (
                        <div key={survey.id} className="py-3.5 first:pt-0 last:pb-0">
                          {/* Title + status */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-[0.9375rem] text-foreground">{survey.title}</span>
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-button bg-success-bg text-success">Active</span>
                          </div>

                          {/* Meta row */}
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2.5">
                            {survey.endDate && (
                              <span className="flex items-center gap-1">
                                <CalendarDaysIcon className="w-3 h-3" />
                                Closes {new Date(survey.endDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: '45%' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </FeatureGate>

          {/* Recognition Leaderboard Card */}
          <FeatureGate feature="RECOGNITION_REWARDS">
            <div className="enterprise-card">
              {/* Card Header */}
              <div className="flex items-center justify-between px-5 pt-5 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-control bg-icon-bg-gold flex items-center justify-center shrink-0">
                    <TrophyIcon className="w-[18px] h-[18px] text-accent-gold" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Recognition Leaderboard</h2>
                </div>
                <Link
                  href="/engagement/recognition"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border-2 border-border text-muted-foreground text-xs font-semibold uppercase tracking-wide hover:border-primary hover:text-primary transition-all"
                >
                  This Month
                </Link>
              </div>

              {/* Card Body — leaderboard entries */}
              <div className="px-5 pb-5">
                {leaderboard.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No recognitions yet</p>
                ) : (
                  <div className="divide-y divide-border">
                    {leaderboard.map((entry, idx) => {
                      const rankStyle = RANK_STYLES[idx + 1] || 'bg-muted text-muted-foreground';
                      const avatarStyle = AVATAR_STYLES[idx % AVATAR_STYLES.length];
                      return (
                        <div key={entry.employeeId} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                          {/* Rank badge */}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs shrink-0 ${rankStyle}`}>
                            {idx + 1}
                          </div>
                          {/* Avatar */}
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[0.6875rem] shrink-0 ${avatarStyle}`}>
                            {getInitials(entry.employeeName)}
                          </div>
                          {/* Name & dept */}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-foreground truncate">{entry.employeeName}</div>
                          </div>
                          {/* Points */}
                          <div className="text-right shrink-0">
                            <div className="font-extrabold text-[0.9375rem] text-accent-gold">{entry.totalPoints}</div>
                            <div className="font-medium text-[0.6875rem] text-muted-foreground">points</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </FeatureGate>
        </div>

        {/* ============================================================ */}
        {/* Recent Recognitions Feed — full width card                    */}
        {/* ============================================================ */}
        <FeatureGate feature="RECOGNITION_REWARDS">
          <div className="enterprise-card">
            {/* Card Header */}
            <div className="flex items-center justify-between px-5 pt-5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-icon-bg-teal flex items-center justify-center shrink-0">
                  <StarIcon className="w-[18px] h-[18px] text-accent-teal" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Recent Recognitions</h2>
              </div>
              <Link
                href="/engagement/recognition/give"
                className="btn-cta inline-flex items-center gap-2 px-4 py-2 cursor-pointer text-sm"
              >
                <SparklesIcon className="w-4 h-4" />
                Give Recognition
              </Link>
            </div>

            {/* Card Body — recognition feed */}
            <div className="px-5 pb-5">
              {recentRecognitions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recognitions yet. Be the first!</p>
              ) : (
                <div className="divide-y divide-border">
                  {recentRecognitions.map((rec, idx) => {
                    const fromAvatar = AVATAR_STYLES[idx % AVATAR_STYLES.length];
                    const toAvatar = AVATAR_STYLES[(idx + 2) % AVATAR_STYLES.length];
                    const categoryKey = rec.category?.toUpperCase().replace(/\s+/g, '_') || '';
                    const categoryStyle = CATEGORY_STYLES[categoryKey] || 'bg-icon-bg-navy text-accent-navy';

                    return (
                      <div key={rec.id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
                        {/* From -> To avatar group */}
                        <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[0.5625rem] ${fromAvatar}`}>
                            {getInitials(rec.fromEmployeeName)}
                          </div>
                          <ArrowRightIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[0.5625rem] ${toAvatar}`}>
                            {getInitials(rec.toEmployeeName)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-[0.8125rem] text-foreground mb-0.5">
                            <span className="text-primary">{rec.fromEmployeeName}</span>
                            {' recognised '}
                            <span className="text-accent-teal">{rec.toEmployeeName}</span>
                          </div>
                          <div className="text-[0.8125rem] text-muted-foreground truncate mb-1.5">
                            {rec.message}
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-button text-[0.6875rem] font-semibold tracking-tight ${categoryStyle}`}>
                              {rec.category.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[0.6875rem] text-muted-foreground flex items-center gap-1">
                              <SparklesIcon className="w-3 h-3" />
                              {rec.points} pts
                            </span>
                            <span className="text-[0.6875rem] text-muted-foreground">
                              {new Date(rec.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FeatureGate>

        {/* ============================================================ */}
        {/* Wellness Programs — full width card with 2-col inner grid    */}
        {/* ============================================================ */}
        <FeatureGate feature="WELLNESS_PROGRAMS">
          <div className="enterprise-card">
            {/* Card Header */}
            <div className="flex items-center justify-between px-5 pt-5 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-control bg-icon-bg-pink flex items-center justify-center shrink-0">
                  <HeartIcon className="w-[18px] h-[18px] text-accent-pink" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Wellness Programs</h2>
              </div>
              <Link
                href="/engagement/wellness"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-button border-2 border-border text-muted-foreground text-xs font-semibold uppercase tracking-wide hover:border-primary hover:text-primary transition-all"
              >
                Manage
              </Link>
            </div>

            {/* Card Body — wellness grid */}
            <div className="px-5 pb-5">
              {activePrograms.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active wellness programs</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activePrograms.slice(0, 6).map((program, idx) => {
                    const wellnessStyle = WELLNESS_ICON_STYLES[idx % WELLNESS_ICON_STYLES.length];
                    return (
                      <div
                        key={program.id}
                        className="border border-border rounded-control p-4 cursor-pointer transition-all hover:border-primary/30 hover:shadow-sm hover:-translate-y-px"
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-control flex items-center justify-center mb-3 ${wellnessStyle}`}>
                          <HeartIcon className="w-5 h-5" />
                        </div>

                        {/* Name */}
                        <div className="font-bold text-[0.9375rem] text-foreground mb-1.5">{program.name}</div>

                        {/* Meta rows */}
                        <div className="space-y-1">
                          {program.description && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDaysIcon className="w-3 h-3 shrink-0" />
                              <span className="truncate">{program.description}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <UserGroupIcon className="w-3 h-3 shrink-0" />
                            {program.currentParticipants}{program.maxParticipants ? `/${program.maxParticipants}` : ''} enrolled
                          </div>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-button text-[0.6875rem] font-semibold bg-success-bg text-success">
                              {program.programType}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </FeatureGate>
      </div>
    </PageWrapper>
  );
}
