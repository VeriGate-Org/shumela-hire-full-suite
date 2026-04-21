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
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <PlayCircleIcon className="w-5 h-5 text-violet-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in-progress':
        return `${baseClasses} bg-gold-100 text-gold-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600 bg-green-50';
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50';
      case 'advanced':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
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

  const actions = canManageTraining ? (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50">
        <CalendarIcon className="w-4 h-4 mr-2" />
        Schedule Training
      </button>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-gold-500 bg-transparent border-2 border-gold-500 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider">
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Module
      </button>
    </div>
  ) : undefined;

  return (
    <PageWrapper
      title="Training & Development"
      subtitle="Enhance team skills with comprehensive training programs and learning paths"
      actions={actions}
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="w-8 h-8 text-violet-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Modules</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalModules}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrophyIcon className="w-8 h-8 text-green-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.completedModules}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="w-8 h-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Learning Hours</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalLearningHours}h</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-sm shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <StarIcon className="w-8 h-8 text-purple-500" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Rating</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.averageRating}/5</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="bg-white rounded-sm shadow p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex gap-1">
              {[
                { id: 'modules', name: 'Training Modules', icon: BookOpenIcon },
                { id: 'paths', name: 'Learning Paths', icon: AcademicCapIcon },
                { id: 'progress', name: 'My Progress', icon: ChartBarIcon }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => setSelectedView(view.id as any)}
                  className={`flex items-center px-4 py-2 rounded-sm text-sm font-medium transition-colors ${
                    selectedView === view.id
                      ? 'bg-gold-100 text-gold-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <view.icon className="w-4 h-4 mr-2" />
                  {view.name}
                </button>
              ))}
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
              <input
                type="text"
                placeholder="Search training..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gold-500/60 focus:border-violet-400"
              />
              <div className="flex gap-2 flex-wrap">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-2 rounded-sm whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-gold-100 text-gold-800 border border-violet-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Training Modules View */}
        {selectedView === 'modules' && (
          <>
            {loading ? (
              <div className="text-center py-12">
                <AcademicCapIcon className="w-8 h-8 text-gray-400 animate-pulse mx-auto mb-4" />
                <p className="text-gray-500">Loading training modules...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredModules.map(module => (
                  <div key={module.id} className="bg-white rounded-sm shadow hover:shadow-md transition-shadow">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getTypeIcon(module.type)}
                            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={getStatusBadge(module.status)}>
                              {module.status.replace('-', ' ')}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(module.level)}`}>
                              {module.level}
                            </span>
                            {module.isRequired && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                        {getStatusIcon(module.status)}
                      </div>

                      {/* Description */}
                      <p className="text-gray-600 text-sm mb-4">{module.description}</p>

                      {/* Progress Bar */}
                      {module.progress > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{module.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gold-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${module.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {module.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Metadata */}
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {module.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            <UserGroupIcon className="w-4 h-4" />
                            {module.enrolledUsers}
                          </span>
                          <span className="flex items-center gap-1">
                            <StarIcon className="w-4 h-4" />
                            {module.rating}
                          </span>
                        </div>
                        {module.dueDate && (
                          <span className={`text-xs font-medium ${
                            new Date(module.dueDate) < new Date() ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            Due: {new Date(module.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Instructor */}
                      <div className="text-sm text-gray-600 mb-4">
                        Instructor: {module.instructor}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {module.status === 'not-started' ? (
                          <button
                            onClick={() => handleStartModule(module.id)}
                            className="flex-1 px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 transition-colors"
                          >
                            Start Module
                          </button>
                        ) : module.status === 'in-progress' ? (
                          <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors">
                            Continue
                          </button>
                        ) : (
                          <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-colors">
                            Review
                          </button>
                        )}
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Learning Paths View */}
        {selectedView === 'paths' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {trainingPaths.map(path => (
              <div key={path.id} className="bg-white rounded-sm shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{path.name}</h3>
                  <p className="text-gray-600 text-sm mb-4">{path.description}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>{path.modules.length} modules</span>
                    <span>{Math.floor(path.totalDuration / 60)}h {path.totalDuration % 60}m</span>
                    <span>{path.enrolledUsers} enrolled</span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{path.completedModules}/{path.modules.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(path.completedModules / path.modules.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 transition-colors">
                    {path.completedModules > 0 ? 'Continue Path' : 'Start Path'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress View */}
        {selectedView === 'progress' && (
          <div className="bg-white rounded-sm shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">My Learning Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gold-600 mb-2">
                  {stats?.completedModules}/{stats?.totalModules}
                </div>
                <div className="text-gray-600">Modules Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats?.totalLearningHours}h
                </div>
                <div className="text-gray-600">Learning Hours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {stats?.averageRating}/5
                </div>
                <div className="text-gray-600">Average Rating</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              {modules.filter(m => m.status !== 'not-started').map(module => (
                <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-sm">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(module.status)}
                    <div>
                      <div className="font-medium">{module.title}</div>
                      <div className="text-sm text-gray-600">{module.progress}% complete</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {module.status === 'completed' ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {filteredModules.length === 0 && !loading && selectedView === 'modules' && (
          <EmptyState
            icon={AcademicCapIcon}
            title="No training modules found"
            description="Try adjusting your search or filter criteria."
          />
        )}
      </div>
    </PageWrapper>
  );
}
