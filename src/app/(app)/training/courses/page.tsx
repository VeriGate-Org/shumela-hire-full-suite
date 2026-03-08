'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, TrainingCourse } from '@/services/trainingService';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  AcademicCapIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

export default function TrainingCoursesPage() {
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      trainingService.getCourses({ activeOnly: true }),
      trainingService.getCategories(),
    ]).then(([c, cats]) => {
      setCourses(c);
      setCategories(cats);
      setLoading(false);
    });
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    const results = await trainingService.getCourses({ search: search || undefined, activeOnly: true });
    setCourses(results);
    setLoading(false);
  };

  const filteredCourses = filterCategory
    ? courses.filter(c => c.category === filterCategory)
    : courses;

  const deliveryMethodColors: Record<string, string> = {
    CLASSROOM: 'bg-blue-100 text-blue-700',
    ONLINE: 'bg-green-100 text-green-700',
    BLENDED: 'bg-purple-100 text-purple-700',
    ON_THE_JOB: 'bg-yellow-100 text-yellow-700',
    WORKSHOP: 'bg-orange-100 text-orange-700',
  };

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Training Course Catalog"
        subtitle="Browse available training courses and programs"
        actions={
          <Link
            href="/training/admin"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <AcademicCapIcon className="w-4 h-4" /> Manage Courses
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Search
            </button>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading courses...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow border">
              No courses found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map(course => (
                <div key={course.id} className="bg-white rounded-lg shadow border p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{course.code}</p>
                    </div>
                    {course.isMandatory && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                        Mandatory
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description || 'No description available.'}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${deliveryMethodColors[course.deliveryMethod] || 'bg-gray-100 text-gray-600'}`}>
                      {course.deliveryMethod?.replace('_', ' ')}
                    </span>
                    {course.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {course.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 border-t pt-3">
                    {course.durationHours && (
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-3.5 h-3.5" /> {course.durationHours}h
                      </span>
                    )}
                    {course.maxParticipants && (
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="w-3.5 h-3.5" /> Max {course.maxParticipants}
                      </span>
                    )}
                    {course.cost && (
                      <span className="flex items-center gap-1">
                        <CurrencyDollarIcon className="w-3.5 h-3.5" /> R{course.cost}
                      </span>
                    )}
                    <span className="ml-auto">{course.sessionCount} sessions</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
