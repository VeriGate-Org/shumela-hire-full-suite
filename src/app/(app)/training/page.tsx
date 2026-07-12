'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import EmptyState from '@/components/EmptyState';
import { apiFetch } from '@/lib/api-fetch';
import { useAuth } from '@/contexts/AuthContext';
import {
  AcademicCapIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BookOpenIcon,
  StarIcon,
  TrophyIcon,
  PlusIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  status: 'not-started' | 'in-progress' | 'completed';
  progress: number; // percentage
  instructor: string;
  rating: number;
  enrolledUsers: number;
  isRequired: boolean;
  dueDate?: string;
  tags: string[];
  type: 'video' | 'interactive' | 'document' | 'assessment';
}

interface TrainingPath {
  id: string;
  name: string;
  description: string;
  modules: string[];
  totalDuration: number;
  completedModules: number;
  enrolledUsers: number;
  category: string;
}

interface TrainingStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  overdueTasks: number;
  averageRating: number;
  totalLearningHours: number;
}

export default function TrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [trainingPaths, setTrainingPaths] = useState<TrainingPath[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedView, setSelectedView] = useState<'modules' | 'paths' | 'progress'>('modules');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();
  const canManageTraining = hasPermission('manage_training');

  const categories = [
    { id: 'all', name: 'All Training', count: 0 },
    { id: 'recruitment', name: 'Recruitment & Sourcing', count: 0 },
    { id: 'interviewing', name: 'Interviewing Skills', count: 0 },
    { id: 'compliance', name: 'Compliance & Legal', count: 0 },
    { id: 'diversity', name: 'Diversity & Inclusion', count: 0 },
    { id: 'systems', name: 'System Training', count: 0 },
    { id: 'leadership', name: 'Leadership Development', count: 0 }
  ];

  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    setLoading(true);
    try {
      const [modulesRes, pathsRes, statsRes] = await Promise.allSettled([
        apiFetch('/api/training/modules'),
        apiFetch('/api/training/paths'),
        apiFetch('/api/training/stats'),
      ]);

      let loadedModules: TrainingModule[] = [];
      if (modulesRes.status === 'fulfilled' && modulesRes.value.ok) {
        const data = await modulesRes.value.json();
        loadedModules = Array.isArray(data) ? data : data.data || [];
      }

      if (pathsRes.status === 'fulfilled' && pathsRes.value.ok) {
        const data = await pathsRes.value.json();
        setTrainingPaths(Array.isArray(data) ? data : data.data || []);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStats(data.data || data);
      }

      // Fallback demo training modules when API returns empty
      if (loadedModules.length === 0) {
        loadedModules = [
          { id: 'trn-1', title: 'ShumelaHire Platform Fundamentals', description: 'Learn the core features of the ShumelaHire platform including navigation, dashboards, and key workflows.', category: 'systems', level: 'beginner', duration: 45, status: 'completed', progress: 100, instructor: 'Platform Team', rating: 4.7, enrolledUsers: 142, isRequired: true, tags: ['onboarding', 'platform'], type: 'interactive' },
          { id: 'trn-2', title: 'Effective Interview Techniques', description: 'Best practices for conducting structured interviews, behavioral questioning, and candidate assessment.', category: 'interviewing', level: 'intermediate', duration: 90, status: 'in-progress', progress: 60, instructor: 'HR Academy', rating: 4.5, enrolledUsers: 98, isRequired: true, tags: ['interviews', 'assessment'], type: 'video' },
          { id: 'trn-3', title: 'SA Labour Law Compliance', description: 'Understanding Employment Equity Act, BCEA, and LRA requirements for recruitment professionals.', category: 'compliance', level: 'intermediate', duration: 120, status: 'not-started', progress: 0, instructor: 'Legal Department', rating: 4.3, enrolledUsers: 67, isRequired: true, dueDate: '2026-04-30', tags: ['compliance', 'legal', 'EEA'], type: 'document' },
          { id: 'trn-4', title: 'Unconscious Bias in Hiring', description: 'Recognize and mitigate unconscious bias throughout the recruitment and selection process.', category: 'diversity', level: 'beginner', duration: 60, status: 'not-started', progress: 0, instructor: 'D&I Council', rating: 4.8, enrolledUsers: 115, isRequired: false, tags: ['diversity', 'inclusion', 'bias'], type: 'video' },
          { id: 'trn-5', title: 'Advanced Talent Sourcing', description: 'Strategies for sourcing passive candidates, Boolean search techniques, and building talent pipelines.', category: 'recruitment', level: 'advanced', duration: 75, status: 'not-started', progress: 0, instructor: 'Sourcing Team', rating: 4.6, enrolledUsers: 54, isRequired: false, tags: ['sourcing', 'talent', 'pipeline'], type: 'interactive' },
          { id: 'trn-6', title: 'Recruitment Leadership', description: 'Leading recruitment teams, setting KPIs, and driving continuous improvement in hiring outcomes.', category: 'leadership', level: 'advanced', duration: 150, status: 'not-started', progress: 0, instructor: 'Executive Team', rating: 4.4, enrolledUsers: 23, isRequired: false, tags: ['leadership', 'management', 'KPIs'], type: 'assessment' },
        ];
        setStats({ totalModules: 6, completedModules: 1, inProgressModules: 1, overdueTasks: 0, averageRating: 4.6, totalLearningHours: 9 });
      }
      setModules(loadedModules);
    } catch {
      // Keep empty state on error
    } finally {
      setLoading(false);
    }
  };

  const filteredModules = modules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || module.level === selectedLevel;
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesLevel && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'in-progress':
        return <PlayCircleIcon className="w-5 h-5 text-accent-teal" />;
      default:
        return <ClockIcon className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-success-bg text-success`;
      case 'in-progress':
        return `${baseClasses} bg-warning-bg text-warning`;
      default:
        return `${baseClasses} bg-muted text-muted-foreground`;
    }
  };

  const getLevelBadge = (level: string) => {
    const base = "px-2.5 py-0.5 rounded-full text-[0.625rem] font-bold uppercase tracking-wider border";
    switch (level) {
      case 'beginner':
        return `${base} border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-950 dark:text-green-300`;
      case 'intermediate':
        return `${base} border-yellow-300 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300`;
      case 'advanced':
        return `${base} border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-300`;
      default:
        return `${base} border-border bg-background text-muted-foreground`;
    }
  };

  const getCategoryBadge = (category: string) => {
    const base = "inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider";
    switch (category) {
      case 'systems':
      case 'recruitment':
        return `${base} bg-icon-bg-navy text-accent-navy`;
      case 'leadership':
        return `${base} bg-icon-bg-teal text-accent-teal`;
      case 'compliance':
        return `${base} bg-icon-bg-gold text-accent-gold`;
      case 'diversity':
      case 'interviewing':
        return `${base} bg-icon-bg-pink text-accent-pink`;
      default:
        return `${base} bg-muted text-muted-foreground`;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircleIcon className="w-4 h-4" />;
      case 'interactive':
        return <AcademicCapIcon className="w-4 h-4" />;
      case 'document':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'assessment':
        return <CheckCircleIcon className="w-4 h-4" />;
      default:
        return <BookOpenIcon className="w-4 h-4" />;
    }
  };

  const handleStartModule = (moduleId: string) => {
    setModules(prev => prev.map(module =>
      module.id === moduleId && module.status === 'not-started'
        ? { ...module, status: 'in-progress', progress: 10 }
        : module
    ));
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSearchTerm('');
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(rating)) {
        stars.push(<StarIcon key={i} className="w-3.5 h-3.5 text-warning fill-warning" />);
      } else if (i - rating < 1 && i - rating > 0) {
        stars.push(<StarIcon key={i} className="w-3.5 h-3.5 text-warning fill-warning/50" />);
      } else {
        stars.push(<StarIcon key={i} className="w-3.5 h-3.5 text-border" />);
      }
    }
    return stars;
  };

  const actions = canManageTraining ? (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-border text-sm font-semibold rounded-full text-muted-foreground hover:border-primary hover:text-primary uppercase tracking-wider transition-all">
        <CalendarIcon className="w-4 h-4" />
        Schedule Training
      </button>
      <button className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-cta text-sm font-semibold rounded-full text-primary bg-transparent hover:bg-cta hover:text-cta-foreground uppercase tracking-wider transition-all">
        <PlusIcon className="w-4 h-4" />
        Create Module
      </button>
    </div>
  ) : undefined;

  return (
    <PageWrapper
      title="Training & Development"
      subtitle="Browse courses, track progress, and manage certifications"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Bar - 3-column grid matching mock */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-icon-bg-navy text-accent-navy">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground leading-tight">{stats.completedModules}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground">Courses Completed</div>
              </div>
            </div>

            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-icon-bg-teal text-accent-teal">
                <ClockIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground leading-tight">{stats.inProgressModules}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground">In Progress</div>
              </div>
            </div>

            <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px transition-transform">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-icon-bg-gold text-accent-gold">
                <TrophyIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-foreground leading-tight">{stats.totalModules}</div>
                <div className="text-[0.8125rem] font-medium text-muted-foreground">Certifications</div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs - underline style matching mock */}
        <div>
          <div className="flex border-b-2 border-border mb-6">
            {[
              { id: 'modules', name: 'Course Catalog', icon: BookOpenIcon },
              { id: 'paths', name: 'My Courses', icon: AcademicCapIcon },
              { id: 'progress', name: 'Certifications', icon: ChartBarIcon }
            ].map(view => (
              <button
                key={view.id}
                onClick={() => setSelectedView(view.id as 'modules' | 'paths' | 'progress')}
                className={`px-6 py-3 text-sm font-semibold tracking-wide border-b-2 -mb-[2px] transition-colors ${
                  selectedView === view.id
                    ? 'text-primary border-primary'
                    : 'text-muted-foreground border-transparent hover:text-primary'
                }`}
              >
                {view.name}
              </button>
            ))}
          </div>

          {/* Filter Bar - matching mock: category select, level select, search input, clear */}
          {selectedView === 'modules' && (
            <div className="enterprise-card p-4 flex items-center gap-4 flex-wrap mb-6">
              <label className="text-[0.8125rem] font-semibold text-muted-foreground whitespace-nowrap">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="min-w-[150px] px-3 py-2 text-sm text-foreground border border-border rounded-control bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <label className="text-[0.8125rem] font-semibold text-muted-foreground whitespace-nowrap">Level:</label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="min-w-[150px] px-3 py-2 text-sm text-foreground border border-border rounded-control bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all cursor-pointer"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 text-sm text-foreground border border-border rounded-control bg-card focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all"
              />
              <button
                onClick={clearFilters}
                className="text-[0.8125rem] font-semibold text-primary underline hover:text-cta-hover transition-colors px-2 py-1"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>

        {/* Course Catalog View - 3-column grid matching mock */}
        {selectedView === 'modules' && (
          <>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="enterprise-card p-6 animate-pulse flex flex-col gap-3">
                    <div className="h-5 w-20 bg-muted rounded-full" />
                    <div className="h-4 w-4/5 bg-muted rounded" />
                    <div className="h-3 w-3/5 bg-muted rounded" />
                    <div className="h-3 w-2/5 bg-muted rounded" />
                    <div className="h-3 w-full bg-muted rounded" />
                    <div className="border-t border-border mt-1 pt-3">
                      <div className="h-8 w-24 bg-muted rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredModules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredModules.map(module => (
                  <div key={module.id} className="enterprise-card p-6 flex flex-col gap-3 hover:-translate-y-1 transition-all">
                    {/* Header: category badge + level badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={getCategoryBadge(module.category)}>
                        {categories.find(c => c.id === module.category)?.name || module.category}
                      </span>
                      <span className={getLevelBadge(module.level)}>
                        {module.level}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-[1.0625rem] font-bold text-foreground leading-snug">{module.title}</h3>

                    {/* Provider / Instructor */}
                    <div className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                      <UserGroupIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      {module.instructor}
                    </div>

                    {/* Meta: duration, enrolled, type */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                        <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {module.duration} min
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                        <UserGroupIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        {module.enrolledUsers} enrolled
                      </span>
                      <span className="flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
                        {getTypeIcon(module.type)}
                        <span className="capitalize">{module.type}</span>
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {renderStars(module.rating)}
                      </div>
                      <span className="text-[0.8125rem] font-bold text-foreground">{module.rating}</span>
                      <span className="text-xs text-muted-foreground">/5</span>
                    </div>

                    {/* Seats / Required / Due date */}
                    <div className="text-[0.8125rem] text-muted-foreground">
                      {module.isRequired && (
                        <span className="text-error font-semibold">Required</span>
                      )}
                      {module.dueDate && (
                        <span className={`ml-2 text-xs font-medium ${
                          new Date(module.dueDate) < new Date() ? 'text-error' : 'text-warning'
                        }`}>
                          Due: {new Date(module.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Progress Bar (if in-progress or completed) */}
                    {module.progress > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-700"
                            style={{ width: `${module.progress}%` }}
                          />
                        </div>
                        <span className="text-[0.8125rem] font-bold text-foreground min-w-[36px] text-right">{module.progress}%</span>
                      </div>
                    )}

                    {/* Footer: action button */}
                    <div className="mt-auto pt-3 border-t border-border flex items-center justify-between">
                      <span className={getStatusBadge(module.status)}>
                        {module.status.replace('-', ' ')}
                      </span>
                      {module.status === 'not-started' ? (
                        <button
                          onClick={() => handleStartModule(module.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full uppercase tracking-wider bg-cta border-2 border-cta text-cta-foreground hover:bg-cta-hover hover:border-cta-hover transition-all"
                        >
                          Enrol
                        </button>
                      ) : module.status === 'in-progress' ? (
                        <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full uppercase tracking-wider bg-transparent border-2 border-accent-teal text-accent-teal hover:bg-accent-teal hover:text-white transition-all">
                          <PlayCircleIcon className="w-3.5 h-3.5" />
                          Continue
                        </button>
                      ) : (
                        <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full uppercase tracking-wider bg-transparent border-2 border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AcademicCapIcon}
                title="No courses match your search"
                description="Try adjusting your filters or search query to find what you are looking for."
              />
            )}
          </>
        )}

        {/* My Courses View - progress cards + completed table matching mock */}
        {selectedView === 'paths' && (
          <div className="space-y-8">
            {/* In Progress Section */}
            {(() => {
              const inProgressModules = modules.filter(m => m.status === 'in-progress');
              const completedModules = modules.filter(m => m.status === 'completed');
              return (
                <>
                  {/* In Progress */}
                  <div>
                    <div className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                      <ClockIcon className="w-5 h-5" />
                      In Progress
                      <span className="bg-primary text-primary-foreground text-[0.6875rem] font-bold px-2 py-0.5 rounded-full">
                        {inProgressModules.length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-4 mb-8">
                      {inProgressModules.length > 0 ? inProgressModules.map(module => (
                        <div key={module.id} className="enterprise-card p-6 flex items-center gap-6 hover:-translate-y-px transition-transform flex-wrap md:flex-nowrap">
                          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 bg-icon-bg-navy text-accent-navy">
                            {getTypeIcon(module.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-foreground mb-1">{module.title}</div>
                            <div className="flex items-center gap-4 text-[0.8125rem] text-muted-foreground mb-3 flex-wrap">
                              <span className={getCategoryBadge(module.category)} style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                                {categories.find(c => c.id === module.category)?.name || module.category}
                              </span>
                              <span>{module.instructor}</span>
                              <span>{module.duration} min total</span>
                            </div>
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-primary transition-all duration-1000"
                                  style={{ width: `${module.progress}%` }}
                                />
                              </div>
                              <span className="text-[0.8125rem] font-bold text-foreground min-w-[36px] text-right">{module.progress}%</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full uppercase tracking-wider bg-cta border-2 border-cta text-cta-foreground hover:bg-cta-hover hover:border-cta-hover transition-all">
                              <PlayCircleIcon className="w-3.5 h-3.5" />
                              Continue
                            </button>
                          </div>
                        </div>
                      )) : (
                        <div className="enterprise-card p-8 text-center text-muted-foreground text-sm">
                          No courses currently in progress.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Completed Section */}
                  <div>
                    <div className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                      <CheckCircleIcon className="w-5 h-5" />
                      Completed
                      <span className="bg-primary text-primary-foreground text-[0.6875rem] font-bold px-2 py-0.5 rounded-full">
                        {completedModules.length}
                      </span>
                    </div>
                    <div className="enterprise-card overflow-hidden">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-background border-b border-border">
                            <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Course</th>
                            <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                            <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Completed</th>
                            <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Score</th>
                            <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Certificate</th>
                            <th className="text-left px-5 py-3.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completedModules.length > 0 ? completedModules.map(module => (
                            <tr key={module.id} className="border-b border-border last:border-b-0 hover:bg-surface-navy transition-colors">
                              <td className="px-5 py-3.5 text-sm font-bold text-foreground">{module.title}</td>
                              <td className="px-5 py-3.5">
                                <span className={getCategoryBadge(module.category)} style={{ fontSize: '0.625rem', padding: '0.125rem 0.5rem' }}>
                                  {categories.find(c => c.id === module.category)?.name || module.category}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-sm text-foreground">
                                {module.dueDate ? new Date(module.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                              </td>
                              <td className="px-5 py-3.5">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-bg text-success">
                                  {module.rating >= 4.5 ? '92%' : module.rating >= 4 ? '85%' : '78%'}
                                </span>
                              </td>
                              <td className="px-5 py-3.5">
                                <button className="inline-flex items-center gap-1 text-[0.8125rem] font-semibold text-primary hover:text-cta-hover hover:underline transition-colors">
                                  <DocumentTextIcon className="w-3.5 h-3.5" />
                                  View Certificate
                                </button>
                              </td>
                              <td className="px-5 py-3.5">
                                <button className="inline-flex items-center gap-1 px-3 py-1 text-[0.6875rem] font-semibold rounded-full uppercase tracking-wider border-2 border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                                  Review
                                </button>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
                                No completed courses yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Certifications View - 2-column cert card grid matching mock */}
        {selectedView === 'progress' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Certification cards from module data */}
              {modules.filter(m => m.status === 'completed' || m.isRequired).length > 0 ? (
                modules.filter(m => m.status === 'completed' || m.isRequired).map(module => {
                  const isCompleted = module.status === 'completed';
                  const certStatus = isCompleted ? 'valid' : 'pending';
                  const iconBgMap: Record<string, string> = {
                    systems: 'bg-icon-bg-navy text-accent-navy',
                    recruitment: 'bg-icon-bg-navy text-accent-navy',
                    interviewing: 'bg-icon-bg-pink text-accent-pink',
                    compliance: 'bg-icon-bg-gold text-accent-gold',
                    diversity: 'bg-icon-bg-teal text-accent-teal',
                    leadership: 'bg-icon-bg-teal text-accent-teal',
                  };

                  return (
                    <div key={module.id} className="enterprise-card p-6 flex gap-5 hover:-translate-y-0.5 transition-transform">
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgMap[module.category] || 'bg-icon-bg-navy text-accent-navy'}`}>
                        <TrophyIcon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground mb-1">{module.title}</div>
                        <div className="text-[0.8125rem] text-muted-foreground mb-3">{module.instructor}</div>
                        <div className="flex gap-6 mb-3 flex-wrap">
                          <div className="text-[0.8125rem]">
                            <span className="text-muted-foreground font-medium">Category: </span>
                            <span className="text-foreground font-semibold">{categories.find(c => c.id === module.category)?.name || module.category}</span>
                          </div>
                          <div className="text-[0.8125rem]">
                            <span className="text-muted-foreground font-medium">Duration: </span>
                            <span className="text-foreground font-semibold">{module.duration} min</span>
                          </div>
                        </div>
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider ${
                          certStatus === 'valid'
                            ? 'bg-success-bg text-success'
                            : 'bg-warning-bg text-warning'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${certStatus === 'valid' ? 'bg-success' : 'bg-warning'}`} />
                          {certStatus === 'valid' ? 'Completed' : 'Pending'}
                        </span>
                        {/* Actions */}
                        <div className="flex gap-2 mt-3">
                          {isCompleted && (
                            <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider border-2 border-cta text-primary bg-transparent hover:bg-cta hover:text-cta-foreground transition-all">
                              <DocumentTextIcon className="w-3.5 h-3.5" />
                              Download
                            </button>
                          )}
                          <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full uppercase tracking-wider border-2 border-border text-muted-foreground hover:border-primary hover:text-primary transition-all">
                            {isCompleted ? 'View' : 'Start Course'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full">
                  <EmptyState
                    icon={TrophyIcon}
                    title="No certifications yet"
                    description="Complete training courses to earn certifications."
                  />
                </div>
              )}
            </div>

            {/* Progress summary within certifications tab */}
            {stats && (
              <div className="enterprise-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-6">Learning Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-accent-gold mb-2">
                      {stats.completedModules}/{stats.totalModules}
                    </div>
                    <div className="text-muted-foreground text-sm">Modules Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-success mb-2">
                      {stats.totalLearningHours}h
                    </div>
                    <div className="text-muted-foreground text-sm">Learning Hours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-extrabold text-primary mb-2">
                      {stats.averageRating}/5
                    </div>
                    <div className="text-muted-foreground text-sm">Average Rating</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
