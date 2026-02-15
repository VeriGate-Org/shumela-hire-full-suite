'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
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

    // Mock training modules
    const mockModules: TrainingModule[] = [
      {
        id: 'sage-integration-101',
        title: 'Sage Integration Fundamentals',
        description: 'Learn how to effectively use Sage integration for payroll and HR data synchronization.',
        category: 'systems',
        level: 'intermediate',
        duration: 45,
        status: 'completed',
        progress: 100,
        instructor: 'Sarah Chen',
        rating: 4.8,
        enrolledUsers: 156,
        isRequired: true,
        tags: ['Sage', 'Integration', 'Payroll', 'HR Systems'],
        type: 'interactive'
      },
      {
        id: 'recruitment-best-practices',
        title: 'Modern Recruitment Best Practices',
        description: 'Comprehensive guide to contemporary recruitment strategies and candidate experience optimization.',
        category: 'recruitment',
        level: 'intermediate',
        duration: 90,
        status: 'in-progress',
        progress: 65,
        instructor: 'Michael Rodriguez',
        rating: 4.7,
        enrolledUsers: 203,
        isRequired: true,
        dueDate: '2024-02-15T00:00:00Z',
        tags: ['Recruitment', 'Candidate Experience', 'Best Practices'],
        type: 'video'
      },
      {
        id: 'bias-free-interviewing',
        title: 'Bias-Free Interviewing Techniques',
        description: 'Learn to conduct fair, unbiased interviews that promote diversity and inclusion.',
        category: 'interviewing',
        level: 'beginner',
        duration: 60,
        status: 'not-started',
        progress: 0,
        instructor: 'Dr. Amanda Johnson',
        rating: 4.9,
        enrolledUsers: 89,
        isRequired: true,
        dueDate: '2024-01-30T00:00:00Z',
        tags: ['Interviewing', 'Bias', 'Diversity', 'Inclusion'],
        type: 'interactive'
      },
      {
        id: 'gdpr-compliance',
        title: 'GDPR and Data Privacy in Recruitment',
        description: 'Understanding legal requirements for candidate data handling and privacy protection.',
        category: 'compliance',
        level: 'intermediate',
        duration: 75,
        status: 'completed',
        progress: 100,
        instructor: 'Legal Team',
        rating: 4.6,
        enrolledUsers: 245,
        isRequired: true,
        tags: ['GDPR', 'Privacy', 'Legal', 'Compliance'],
        type: 'document'
      },
      {
        id: 'advanced-sourcing',
        title: 'Advanced Sourcing Strategies',
        description: 'Master advanced techniques for finding and engaging top talent across multiple channels.',
        category: 'recruitment',
        level: 'advanced',
        duration: 120,
        status: 'not-started',
        progress: 0,
        instructor: 'Jennifer Park',
        rating: 4.8,
        enrolledUsers: 67,
        isRequired: false,
        tags: ['Sourcing', 'LinkedIn', 'Boolean Search', 'Networking'],
        type: 'video'
      },
      {
        id: 'leadership-hiring',
        title: 'Executive and Leadership Hiring',
        description: 'Specialized approaches for recruiting C-level executives and senior leadership positions.',
        category: 'leadership',
        level: 'advanced',
        duration: 105,
        status: 'in-progress',
        progress: 30,
        instructor: 'Robert Kim',
        rating: 4.9,
        enrolledUsers: 34,
        isRequired: false,
        tags: ['Executive Search', 'Leadership', 'C-Suite', 'Senior Roles'],
        type: 'interactive'
      }
    ];

    // Mock training paths
    const mockPaths: TrainingPath[] = [
      {
        id: 'new-recruiter-onboarding',
        name: 'New Recruiter Onboarding',
        description: 'Complete onboarding program for new recruitment team members.',
        modules: ['recruitment-best-practices', 'bias-free-interviewing', 'gdpr-compliance', 'sage-integration-101'],
        totalDuration: 270,
        completedModules: 2,
        enrolledUsers: 45,
        category: 'onboarding'
      },
      {
        id: 'advanced-recruitment-mastery',
        name: 'Advanced Recruitment Mastery',
        description: 'Advanced certification path for experienced recruiters seeking to enhance their skills.',
        modules: ['advanced-sourcing', 'leadership-hiring', 'bias-free-interviewing'],
        totalDuration: 285,
        completedModules: 1,
        enrolledUsers: 28,
        category: 'advanced'
      },
      {
        id: 'compliance-certification',
        name: 'Compliance & Legal Certification',
        description: 'Mandatory training for all recruitment staff on legal and compliance requirements.',
        modules: ['gdpr-compliance', 'bias-free-interviewing'],
        totalDuration: 135,
        completedModules: 2,
        enrolledUsers: 156,
        category: 'compliance'
      }
    ];

    // Mock stats
    const mockStats: TrainingStats = {
      totalModules: mockModules.length,
      completedModules: mockModules.filter(m => m.status === 'completed').length,
      inProgressModules: mockModules.filter(m => m.status === 'in-progress').length,
      overdueTasks: mockModules.filter(m => m.dueDate && new Date(m.dueDate) < new Date()).length,
      averageRating: 4.7,
      totalLearningHours: 28.5
    };

    // Simulate loading delay
    setTimeout(() => {
      setModules(mockModules);
      setTrainingPaths(mockPaths);
      setStats(mockStats);
      setLoading(false);
    }, 800);
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
        return `${baseClasses} bg-violet-100 text-violet-800`;
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

  const actions = (
    <div className="flex items-center gap-3">
      <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
        <CalendarIcon className="w-4 h-4 mr-2" />
        Schedule Training
      </button>
      <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-violet-600 hover:bg-violet-700">
        <PlusIcon className="w-4 h-4 mr-2" />
        Create Module
      </button>
    </div>
  );

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
            <div className="bg-white rounded-lg shadow p-6">
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
            
            <div className="bg-white rounded-lg shadow p-6">
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
            
            <div className="bg-white rounded-lg shadow p-6">
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
            
            <div className="bg-white rounded-lg shadow p-6">
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
        <div className="bg-white rounded-lg shadow p-6">
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
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedView === view.id
                      ? 'bg-violet-100 text-violet-800'
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
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400"
              />
              <div className="flex gap-2 overflow-x-auto">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-violet-100 text-violet-800 border border-violet-200'
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
                  <div key={module.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
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
                              className="bg-violet-600 h-2 rounded-full transition-all duration-300"
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
                            className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors"
                          >
                            Start Module
                          </button>
                        ) : module.status === 'in-progress' ? (
                          <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            Continue
                          </button>
                        ) : (
                          <button className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                            Review
                          </button>
                        )}
                        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
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
              <div key={path.id} className="bg-white rounded-lg shadow">
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

                  <button className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                    {path.completedModules > 0 ? 'Continue Path' : 'Start Path'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress View */}
        {selectedView === 'progress' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">My Learning Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-violet-600 mb-2">
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
                <div key={module.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
          <div className="text-center py-12">
            <AcademicCapIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No training modules found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
