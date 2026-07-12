'use client';

import React, { useState, useEffect, useMemo } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, CompetencyFramework } from '@/services/performanceEnhancementService';
import {
  AcademicCapIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  StarIcon,
  Squares2X2Icon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

// ---- colour helpers keyed to category ----
const CATEGORY_BADGE: Record<string, string> = {
  Technical: 'bg-icon-bg-navy text-primary',
  'Compliance & Safety': 'bg-icon-bg-pink text-accent-pink',
  Communication: 'bg-icon-bg-teal text-accent-teal',
  'Problem Solving': 'bg-icon-bg-gold text-accent-gold',
  Leadership: 'bg-icon-bg-gold text-accent-gold',
  Financial: 'bg-icon-bg-gold text-accent-gold',
};

const ICON_BG: Record<string, string> = {
  Technical: 'bg-icon-bg-navy text-primary',
  'Compliance & Safety': 'bg-icon-bg-pink text-accent-pink',
  Communication: 'bg-icon-bg-teal text-accent-teal',
  'Problem Solving': 'bg-icon-bg-gold text-accent-gold',
  Leadership: 'bg-icon-bg-gold text-accent-gold',
  Financial: 'bg-icon-bg-gold text-accent-gold',
};

// Cycle through icon-bg colours per-framework when category not available
const ICON_CYCLE = [
  'bg-icon-bg-navy text-primary',
  'bg-icon-bg-teal text-accent-teal',
  'bg-icon-bg-gold text-accent-gold',
  'bg-icon-bg-pink text-accent-pink',
];

const BADGE_CYCLE = [
  'bg-icon-bg-navy text-primary',
  'bg-icon-bg-teal text-accent-teal',
  'bg-icon-bg-gold text-accent-gold',
  'bg-icon-bg-pink text-accent-pink',
];

function getCategoryBadge(category: string | null | undefined, idx: number) {
  if (category && CATEGORY_BADGE[category]) return CATEGORY_BADGE[category];
  return BADGE_CYCLE[idx % BADGE_CYCLE.length];
}

function getIconBg(category: string | null | undefined, idx: number) {
  if (category && ICON_BG[category]) return ICON_BG[category];
  return ICON_CYCLE[idx % ICON_CYCLE.length];
}

// ---- Skeleton loading ----
function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="enterprise-card p-5 flex items-center gap-4 animate-pulse">
          <div className="w-12 h-12 rounded-card loading-shimmer" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-5 w-2/5 loading-shimmer rounded" />
            <div className="h-3 w-3/5 loading-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="enterprise-card p-4 mb-6 flex items-center gap-3 flex-wrap animate-pulse">
      <div className="h-9 w-40 loading-shimmer rounded-control" />
      <div className="h-9 flex-1 min-w-[200px] loading-shimmer rounded-control" />
    </div>
  );
}

function AccordionSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="enterprise-card p-4 flex items-center gap-4 animate-pulse">
          <div className="w-11 h-11 rounded-card loading-shimmer" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-4 w-3/5 loading-shimmer rounded" />
            <div className="h-3 w-2/5 loading-shimmer rounded" />
          </div>
          <div className="w-20 h-6 loading-shimmer rounded-button" />
          <div className="w-6 h-6 loading-shimmer rounded" />
        </div>
      ))}
    </div>
  );
}

export default function CompetenciesPage() {
  const [frameworks, setFrameworks] = useState<CompetencyFramework[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadFrameworks();
  }, []);

  async function loadFrameworks() {
    setLoading(true);
    try {
      const data = await performanceEnhancementService.getFrameworks();
      setFrameworks(data);
    } catch (error) {
      console.error('Failed to load frameworks:', error);
    } finally {
      setLoading(false);
    }
  }

  // Derive unique categories from competencies
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    frameworks.forEach((fw) =>
      fw.competencies?.forEach((c) => {
        if (c.category) cats.add(c.category);
      })
    );
    return Array.from(cats).sort();
  }, [frameworks]);

  // Filtered frameworks + competencies
  const filteredFrameworks = useMemo(() => {
    return frameworks
      .map((fw) => {
        const filtered = (fw.competencies ?? []).filter((comp) => {
          if (categoryFilter && comp.category !== categoryFilter) return false;
          if (searchTerm) {
            const haystack = `${comp.name} ${comp.description ?? ''} ${comp.category ?? ''} ${fw.name}`.toLowerCase();
            if (!haystack.includes(searchTerm.toLowerCase())) return false;
          }
          return true;
        });
        return { ...fw, competencies: filtered };
      })
      .filter((fw) => (fw.competencies?.length ?? 0) > 0);
  }, [frameworks, categoryFilter, searchTerm]);

  const totalCompetencies = useMemo(
    () => frameworks.reduce((sum, fw) => sum + (fw.competencies?.length ?? 0), 0),
    [frameworks]
  );

  const filteredCount = useMemo(
    () => filteredFrameworks.reduce((sum, fw) => sum + (fw.competencies?.length ?? 0), 0),
    [filteredFrameworks]
  );

  return (
    <FeatureGate feature="COMPETENCY_MAPPING">
      <PageWrapper
        title="Competency Framework"
        subtitle="Define, assess, and track workforce competencies"
        actions={
          <Link
            href="/competencies/profile"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            My Competency Profile
          </Link>
        }
      >
        <div className="space-y-0">
          {loading ? (
            <>
              <StatsSkeleton />
              <FilterBarSkeleton />
              <AccordionSkeleton />
            </>
          ) : frameworks.length === 0 ? (
            /* ---------- empty state ---------- */
            <div className="text-center py-16">
              <AcademicCapIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No competency frameworks defined yet</h3>
              <p className="text-sm text-muted-foreground">
                Get started by creating your first competency framework.
              </p>
            </div>
          ) : (
            <>
              {/* ========== STATS BAR ========== */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {/* Total Competencies */}
                <div className="enterprise-card p-5 flex items-center gap-4 transition hover:-translate-y-px">
                  <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-primary flex items-center justify-center shrink-0">
                    <StarIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                      {totalCompetencies}
                    </div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                      Total Competencies
                    </div>
                  </div>
                </div>

                {/* Categories */}
                <div className="enterprise-card p-5 flex items-center gap-4 transition hover:-translate-y-px">
                  <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-accent-teal flex items-center justify-center shrink-0">
                    <Squares2X2Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                      {allCategories.length || frameworks.length}
                    </div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                      {allCategories.length > 0 ? 'Categories' : 'Frameworks'}
                    </div>
                  </div>
                </div>

                {/* Profiles Assessed (derived: active frameworks) */}
                <div className="enterprise-card p-5 flex items-center gap-4 transition hover:-translate-y-px">
                  <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-accent-gold flex items-center justify-center shrink-0">
                    <UserGroupIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">
                      {frameworks.filter((f) => f.isActive).length}
                    </div>
                    <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5">
                      Active Frameworks
                    </div>
                  </div>
                </div>
              </div>

              {/* ========== FILTER BAR ========== */}
              <div className="enterprise-card p-4 mb-6 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-wrap flex-1">
                  {/* Category dropdown */}
                  {allCategories.length > 0 && (
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="text-sm font-medium px-3 py-2 border border-border rounded-control bg-card text-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none appearance-none pr-8 cursor-pointer"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'right 0.75rem center',
                      }}
                    >
                      <option value="">All Categories</option>
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Search */}
                <div className="relative flex-[0_1_360px] min-w-[200px]">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search competencies..."
                    className="w-full text-sm font-medium pl-9 pr-3 py-2 border border-border rounded-control bg-card text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none"
                  />
                </div>

                {/* Filter count */}
                <span className="text-[0.8125rem] font-medium text-muted-foreground whitespace-nowrap">
                  Showing {filteredCount} competenc{filteredCount === 1 ? 'y' : 'ies'}
                </span>
              </div>

              {/* ========== ACCORDION LIST ========== */}
              {filteredFrameworks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MagnifyingGlassIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No competencies found</h3>
                  <p className="text-sm">Try adjusting your search or filter criteria.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredFrameworks.map((framework, fwIdx) => {
                    const isExpanded = expandedId === framework.id;
                    const primaryCategory =
                      framework.competencies?.[0]?.category ?? null;

                    return (
                      <div
                        key={framework.id}
                        className="enterprise-card overflow-hidden"
                      >
                        {/* ---- accordion header ---- */}
                        <button
                          onClick={() =>
                            setExpandedId(isExpanded ? null : framework.id)
                          }
                          className="w-full flex items-center justify-between p-4 sm:px-5 cursor-pointer select-none hover:bg-muted/30 transition-colors"
                        >
                          {/* left: icon + titles */}
                          <div className="flex items-center gap-4 flex-1 min-w-0 text-left">
                            <div
                              className={`w-11 h-11 rounded-card flex items-center justify-center shrink-0 ${getIconBg(primaryCategory, fwIdx)}`}
                            >
                              <AcademicCapIcon className="w-[22px] h-[22px]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-base text-foreground leading-snug truncate">
                                {framework.name}
                              </div>
                              <div className="text-[0.8125rem] font-medium text-muted-foreground mt-0.5 truncate">
                                {framework.description || `${framework.competencies?.length ?? 0} competencies defined`}
                              </div>
                            </div>
                          </div>

                          {/* right: badge + count + chevron */}
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            {!framework.isActive && (
                              <span className="inline-flex items-center px-3 py-0.5 rounded-button text-xs font-semibold tracking-wide bg-muted/50 text-muted-foreground">
                                Inactive
                              </span>
                            )}
                            {primaryCategory && (
                              <span
                                className={`hidden sm:inline-flex items-center px-3 py-0.5 rounded-button text-xs font-semibold tracking-wide ${getCategoryBadge(primaryCategory, fwIdx)}`}
                              >
                                {primaryCategory}
                              </span>
                            )}
                            <span className="text-[0.8125rem] font-semibold text-muted-foreground whitespace-nowrap hidden sm:inline">
                              {framework.competencies?.length ?? 0} competenc
                              {(framework.competencies?.length ?? 0) === 1
                                ? 'y'
                                : 'ies'}
                            </span>
                            <ChevronDownIcon
                              className={`w-6 h-6 text-muted-foreground transition-transform duration-300 shrink-0 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>

                        {/* ---- accordion body ---- */}
                        {isExpanded && framework.competencies && (
                          <div className="px-5 pb-5">
                            <div className="h-px bg-border mb-4" />
                            <div className="space-y-3">
                              {framework.competencies.map((comp) => (
                                <div
                                  key={comp.id}
                                  className="bg-muted/30 border border-border rounded-control p-4 transition hover:border-primary/30 hover:shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-4 flex-wrap">
                                    {/* left: icon + name */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div
                                        className={`w-9 h-9 rounded-control flex items-center justify-center shrink-0 ${getIconBg(comp.category, fwIdx)}`}
                                      >
                                        <AcademicCapIcon className="w-[18px] h-[18px]" />
                                      </div>
                                      <span className="font-semibold text-[0.9375rem] text-foreground truncate">
                                        {comp.name}
                                      </span>
                                    </div>

                                    {/* right: category badge */}
                                    <div className="flex items-center gap-3 shrink-0">
                                      {comp.category && (
                                        <span
                                          className={`inline-flex items-center px-3 py-0.5 rounded-button text-xs font-semibold tracking-wide ${getCategoryBadge(comp.category, fwIdx)}`}
                                        >
                                          {comp.category}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* description */}
                                  {comp.description && (
                                    <div className="mt-3 pt-3 border-t border-border">
                                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                                        Description
                                      </div>
                                      <p className="text-sm text-foreground leading-relaxed">
                                        {comp.description}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
