'use client';

import { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, TrainingCourse, TrainingSession } from '@/services/trainingService';
import Link from 'next/link';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CalendarDaysIcon,
  ShieldExclamationIcon,
  BookOpenIcon,
  UsersIcon,
  EyeIcon,
  ArchiveBoxIcon,
  XMarkIcon,
  PlayCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

export default function TrainingAdminPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_training');

  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'courses' | 'sessions'>('courses');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '', code: '', description: '', deliveryMethod: 'CLASSROOM',
    category: '', provider: '', durationHours: '', maxParticipants: '', cost: '',
    isMandatory: false, isActive: true,
  });
  const [sessionForm, setSessionForm] = useState({
    courseId: '', trainerName: '', location: '', startDate: '', endDate: '',
    availableSeats: '',
  });

  useEffect(() => {
    if (canManage) loadData();
  }, [canManage]);

  const loadData = async () => {
    setLoading(true);
    const [c, s] = await Promise.all([
      trainingService.getCourses(),
      trainingService.getSessions(),
    ]);
    setCourses(c);
    setSessions(s);
    setLoading(false);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trainingService.createCourse({
        ...courseForm,
        durationHours: courseForm.durationHours ? parseFloat(courseForm.durationHours) : undefined,
        maxParticipants: courseForm.maxParticipants ? parseInt(courseForm.maxParticipants) : undefined,
        cost: courseForm.cost ? parseFloat(courseForm.cost) : undefined,
      } as any);
      setShowCourseForm(false);
      setCourseForm({ title: '', code: '', description: '', deliveryMethod: 'CLASSROOM', category: '', provider: '', durationHours: '', maxParticipants: '', cost: '', isMandatory: false, isActive: true });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create course');
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trainingService.createSession({
        courseId: sessionForm.courseId,
        trainerName: sessionForm.trainerName || null,
        location: sessionForm.location || null,
        startDate: sessionForm.startDate,
        endDate: sessionForm.endDate,
        availableSeats: sessionForm.availableSeats ? parseInt(sessionForm.availableSeats) : null,
      });
      setShowSessionForm(false);
      setSessionForm({ courseId: '', trainerName: '', location: '', startDate: '', endDate: '', availableSeats: '' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create session');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this course?')) return;
    try {
      await trainingService.deleteCourse(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleSessionAction = async (id: string, action: 'open' | 'close' | 'cancel') => {
    try {
      if (action === 'open') await trainingService.openSession(id);
      else if (action === 'close') await trainingService.closeSession(id);
      else await trainingService.cancelSession(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Compute stats
  const activeCourseCount = courses.filter(c => c.isActive).length;
  const activeSessionCount = sessions.filter(s => s.status === 'OPEN' || s.status === 'PLANNED').length;
  const totalEnrolled = sessions.reduce((sum, s) => sum + (s.enrollmentCount || 0), 0);

  if (!canManage) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Access Denied" subtitle="You do not have permission to access Training Administration.">
          <div className="text-center py-12">
            <ShieldExclamationIcon className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-muted-foreground">Contact your administrator if you believe this is an error.</p>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Training Administration"
        subtitle="Manage training courses, sessions, and employee development"
        actions={
          <button
            onClick={() => activeTab === 'courses' ? setShowCourseForm(true) : setShowSessionForm(true)}
            className="btn-cta inline-flex items-center gap-2 px-6 py-2.5 text-sm cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            {activeTab === 'courses' ? 'Create Course' : 'New Session'}
          </button>
        }
      >
        <div className="space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Courses */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-navy flex items-center justify-center flex-shrink-0">
                <BookOpenIcon className="w-6 h-6 text-accent-navy" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-none">
                  {loading ? '-' : courses.length}
                </p>
                <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Courses</p>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-teal flex items-center justify-center flex-shrink-0">
                <CalendarDaysIcon className="w-6 h-6 text-accent-teal" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-none">
                  {loading ? '-' : activeSessionCount}
                </p>
                <p className="text-[0.8125rem] text-muted-foreground mt-1">Active Sessions</p>
              </div>
            </div>

            {/* Total Enrolled */}
            <div className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-icon-bg-gold flex items-center justify-center flex-shrink-0">
                <UsersIcon className="w-6 h-6 text-accent-gold" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground leading-none">
                  {loading ? '-' : totalEnrolled}
                </p>
                <p className="text-[0.8125rem] text-muted-foreground mt-1">Total Enrolled</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="inline-flex gap-1 bg-card border border-border rounded-card p-1 shadow-sm">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-control text-[0.8125rem] font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'courses'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-primary hover:bg-surface-navy'
              }`}
            >
              <BookOpenIcon className="w-4 h-4" />
              Courses
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[0.6875rem] font-bold px-1.5 ${
                activeTab === 'courses'
                  ? 'bg-white/25 text-primary-foreground'
                  : 'bg-border text-muted-foreground'
              }`}>
                {courses.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-control text-[0.8125rem] font-semibold transition-all duration-200 cursor-pointer ${
                activeTab === 'sessions'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-primary hover:bg-surface-navy'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4" />
              Sessions
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-[0.6875rem] font-bold px-1.5 ${
                activeTab === 'sessions'
                  ? 'bg-white/25 text-primary-foreground'
                  : 'bg-border text-muted-foreground'
              }`}>
                {sessions.length}
              </span>
            </button>
          </div>

          {/* Course Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              {/* Create Course Modal Overlay */}
              {showCourseForm && (
                <div
                  className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowCourseForm(false); }}
                >
                  <div className="bg-card rounded-2xl shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div className="flex items-center justify-between px-6 pt-6">
                      <h2 className="text-xl font-bold text-foreground">Create New Course</h2>
                      <button
                        onClick={() => setShowCourseForm(false)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all cursor-pointer"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleCreateCourse}>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="form-label">Title <span className="text-destructive">*</span></label>
                          <input type="text" required value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                            className="form-input w-full" placeholder="e.g. Advanced Water Treatment" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="form-label">Code <span className="text-destructive">*</span></label>
                            <input type="text" required value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                              className="form-input w-full" placeholder="e.g. WQM-101" />
                          </div>
                          <div>
                            <label className="form-label">Delivery Method</label>
                            <select value={courseForm.deliveryMethod} onChange={e => setCourseForm({ ...courseForm, deliveryMethod: e.target.value })}
                              className="form-input w-full cursor-pointer">
                              <option value="CLASSROOM">Classroom</option>
                              <option value="ONLINE">Online</option>
                              <option value="BLENDED">Blended</option>
                              <option value="ON_THE_JOB">On the Job</option>
                              <option value="WORKSHOP">Workshop</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="form-label">Category</label>
                            <input type="text" value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                              className="form-input w-full" placeholder="e.g. Technical" />
                          </div>
                          <div>
                            <label className="form-label">Provider</label>
                            <input type="text" value={courseForm.provider} onChange={e => setCourseForm({ ...courseForm, provider: e.target.value })}
                              className="form-input w-full" placeholder="e.g. External Provider" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="form-label">Duration (Hours)</label>
                            <input type="number" step="0.5" value={courseForm.durationHours} onChange={e => setCourseForm({ ...courseForm, durationHours: e.target.value })}
                              className="form-input w-full" placeholder="e.g. 40" />
                          </div>
                          <div>
                            <label className="form-label">Max Participants</label>
                            <input type="number" value={courseForm.maxParticipants} onChange={e => setCourseForm({ ...courseForm, maxParticipants: e.target.value })}
                              className="form-input w-full" placeholder="e.g. 25" />
                          </div>
                          <div>
                            <label className="form-label">Cost (ZAR)</label>
                            <input type="number" step="0.01" value={courseForm.cost} onChange={e => setCourseForm({ ...courseForm, cost: e.target.value })}
                              className="form-input w-full" placeholder="e.g. 5000" />
                          </div>
                        </div>
                        <div>
                          <label className="form-label">Description</label>
                          <textarea rows={3} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                            className="form-input w-full min-h-[80px] resize-y" placeholder="Describe the course objectives and content..." />
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="isMandatory"
                            checked={courseForm.isMandatory}
                            onChange={e => setCourseForm({ ...courseForm, isMandatory: e.target.checked })}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-ring"
                          />
                          <label htmlFor="isMandatory" className="text-sm font-medium text-foreground cursor-pointer">
                            Mandatory Course
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 px-6 pb-6">
                        <button
                          type="button"
                          onClick={() => setShowCourseForm(false)}
                          className="btn-secondary px-5 py-2.5 text-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Create Course
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="enterprise-card overflow-hidden animate-pulse">
                  <div className="flex gap-6 p-3.5 bg-surface-navy border-b-2 border-border">
                    {[180, 80, 70, 60, 80, 60].map((w, i) => (
                      <div key={i} className="loading-shimmer rounded" style={{ width: w, height: 12 }} />
                    ))}
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`flex gap-6 p-3.5 border-b border-border ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <div className="loading-shimmer rounded" style={{ width: 180 + Math.random() * 40, height: 14 }} />
                      <div className="loading-shimmer rounded-full" style={{ width: 80, height: 20 }} />
                      <div className="loading-shimmer rounded" style={{ width: 55, height: 14 }} />
                      <div className="loading-shimmer rounded-full" style={{ width: 65, height: 20 }} />
                      <div className="loading-shimmer rounded" style={{ width: 40, height: 14 }} />
                      <div className="loading-shimmer rounded" style={{ width: 60, height: 14 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="enterprise-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Course</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Method</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Category</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Sessions</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Status</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {courses.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                              No courses found. Create your first course to get started.
                            </td>
                          </tr>
                        ) : (
                          courses.map((course, idx) => (
                            <tr
                              key={course.id}
                              className={`border-b border-border transition-colors duration-150 hover:bg-surface-navy ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}
                            >
                              <td className="px-4 py-3 text-[0.8125rem] text-foreground">
                                <span className="font-semibold">{course.title}</span>
                                <p className="text-xs text-muted-foreground mt-0.5">{course.code}</p>
                              </td>
                              <td className="px-4 py-3 text-[0.8125rem] text-foreground">
                                {course.deliveryMethod?.replace('_', ' ')}
                              </td>
                              <td className="px-4 py-3 text-[0.8125rem]">
                                {course.category ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide bg-icon-bg-navy text-accent-navy">
                                    {course.category}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-[0.8125rem] text-foreground font-semibold">
                                {course.sessionCount}
                              </td>
                              <td className="px-4 py-3 text-[0.8125rem]">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${
                                  course.isActive
                                    ? 'bg-success-bg text-success'
                                    : 'bg-muted text-muted-foreground'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${course.isActive ? 'bg-success' : 'bg-muted-foreground'}`} />
                                  {course.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-[0.8125rem]">
                                <div className="flex gap-1">
                                  <button
                                    className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all cursor-pointer"
                                    title="Edit"
                                  >
                                    <PencilSquareIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-primary transition-all cursor-pointer"
                                    title="View"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCourse(course.id)}
                                    className="w-8 h-8 rounded-control flex items-center justify-center text-muted-foreground hover:bg-error-bg hover:text-destructive transition-all cursor-pointer"
                                    title="Archive"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              {/* Create Session Modal Overlay */}
              {showSessionForm && (
                <div
                  className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
                  onClick={(e) => { if (e.target === e.currentTarget) setShowSessionForm(false); }}
                >
                  <div className="bg-card rounded-2xl shadow-xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div className="flex items-center justify-between px-6 pt-6">
                      <h2 className="text-xl font-bold text-foreground">Create Training Session</h2>
                      <button
                        onClick={() => setShowSessionForm(false)}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:bg-surface-navy hover:text-foreground transition-all cursor-pointer"
                      >
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </div>
                    <form onSubmit={handleCreateSession}>
                      <div className="p-6 space-y-4">
                        <div>
                          <label className="form-label">Course <span className="text-destructive">*</span></label>
                          <select required value={sessionForm.courseId} onChange={e => setSessionForm({ ...sessionForm, courseId: e.target.value })}
                            className="form-input w-full cursor-pointer">
                            <option value="">Select a course</option>
                            {courses.filter(c => c.isActive).map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="form-label">Trainer Name</label>
                            <input type="text" value={sessionForm.trainerName} onChange={e => setSessionForm({ ...sessionForm, trainerName: e.target.value })}
                              className="form-input w-full" placeholder="e.g. Dr. Thabo Mokoena" />
                          </div>
                          <div>
                            <label className="form-label">Location</label>
                            <input type="text" value={sessionForm.location} onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                              className="form-input w-full" placeholder="e.g. Ladysmith Training Centre" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="form-label">Start Date <span className="text-destructive">*</span></label>
                            <input type="datetime-local" required value={sessionForm.startDate} onChange={e => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                              className="form-input w-full" />
                          </div>
                          <div>
                            <label className="form-label">End Date <span className="text-destructive">*</span></label>
                            <input type="datetime-local" required value={sessionForm.endDate} onChange={e => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                              className="form-input w-full" />
                          </div>
                        </div>
                        <div>
                          <label className="form-label">Available Seats</label>
                          <input type="number" value={sessionForm.availableSeats} onChange={e => setSessionForm({ ...sessionForm, availableSeats: e.target.value })}
                            className="form-input w-full" placeholder="e.g. 25" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 px-6 pb-6">
                        <button
                          type="button"
                          onClick={() => setShowSessionForm(false)}
                          className="btn-secondary px-5 py-2.5 text-sm cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn-cta inline-flex items-center gap-2 px-5 py-2.5 text-sm cursor-pointer"
                        >
                          <CheckIcon className="w-4 h-4" />
                          Create Session
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="enterprise-card overflow-hidden animate-pulse">
                  <div className="flex gap-6 p-3.5 bg-surface-navy border-b-2 border-border">
                    {[120, 100, 90, 80, 100, 70, 80].map((w, i) => (
                      <div key={i} className="loading-shimmer rounded" style={{ width: w, height: 12 }} />
                    ))}
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`flex gap-6 p-3.5 border-b border-border ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <div className="loading-shimmer rounded" style={{ width: 140 + Math.random() * 40, height: 14 }} />
                      <div className="loading-shimmer rounded" style={{ width: 100, height: 14 }} />
                      <div className="loading-shimmer rounded" style={{ width: 80, height: 14 }} />
                      <div className="loading-shimmer rounded" style={{ width: 90, height: 14 }} />
                      <div className="loading-shimmer rounded" style={{ width: 100, height: 14 }} />
                      <div className="loading-shimmer rounded-full" style={{ width: 70, height: 20 }} />
                      <div className="loading-shimmer rounded" style={{ width: 80, height: 14 }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="enterprise-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Course</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Facilitator</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Enrolled / Capacity</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Date</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Status</th>
                          <th className="px-4 py-3.5 text-left text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground border-b-2 border-border bg-surface-navy whitespace-nowrap">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground text-sm">
                              No sessions found. Create your first session to get started.
                            </td>
                          </tr>
                        ) : (
                          sessions.map((session, idx) => {
                            const enrolled = session.enrollmentCount || 0;
                            const capacity = session.availableSeats || 0;
                            const pct = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
                            const fillColor = pct < 50 ? 'bg-success' : pct < 80 ? 'bg-warning' : 'bg-destructive';

                            return (
                              <tr
                                key={session.id}
                                className={`border-b border-border transition-colors duration-150 hover:bg-surface-navy ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}
                              >
                                <td className="px-4 py-3 text-[0.8125rem] text-foreground">
                                  <span className="font-semibold">{session.courseTitle}</span>
                                  <p className="text-xs text-muted-foreground mt-0.5">{session.courseCode}</p>
                                </td>
                                <td className="px-4 py-3 text-[0.8125rem] text-foreground">
                                  {session.trainerName || <span className="text-muted-foreground italic">-</span>}
                                </td>
                                <td className="px-4 py-3 text-[0.8125rem]">
                                  <div className="flex items-center gap-2">
                                    <div className="w-[60px] h-1.5 bg-border rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-300 ${fillColor}`}
                                        style={{ width: `${Math.min(pct, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-[0.8125rem] font-semibold text-foreground">
                                      {enrolled}{capacity ? `/${capacity}` : ''}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[0.8125rem]">
                                  <div className="leading-snug">
                                    <div className="font-semibold text-foreground">
                                      {new Date(session.startDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(session.startDate).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                                      {session.endDate && ` - ${new Date(session.endDate).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-[0.8125rem]">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.6875rem] font-semibold ${
                                    session.status === 'OPEN' ? 'bg-icon-bg-navy text-accent-navy' :
                                    session.status === 'PLANNED' ? 'bg-icon-bg-navy text-accent-navy' :
                                    session.status === 'COMPLETED' ? 'bg-success-bg text-success' :
                                    session.status === 'CANCELLED' ? 'bg-error-bg text-destructive' :
                                    'bg-muted text-muted-foreground'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      session.status === 'OPEN' ? 'bg-accent-navy' :
                                      session.status === 'PLANNED' ? 'bg-accent-navy' :
                                      session.status === 'COMPLETED' ? 'bg-success' :
                                      session.status === 'CANCELLED' ? 'bg-destructive' :
                                      'bg-muted-foreground'
                                    }`} />
                                    {session.status?.replace('_', ' ')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[0.8125rem]">
                                  <div className="flex gap-1.5">
                                    {session.status === 'PLANNED' && (
                                      <button
                                        onClick={() => handleSessionAction(session.id, 'open')}
                                        className="btn-cta inline-flex items-center gap-1 px-3 py-1 text-[0.6875rem] cursor-pointer"
                                        title="Open enrollment"
                                      >
                                        <PlayCircleIcon className="w-3.5 h-3.5" />
                                        Open
                                      </button>
                                    )}
                                    {session.status === 'OPEN' && (
                                      <button
                                        onClick={() => handleSessionAction(session.id, 'close')}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide bg-warning text-white hover:bg-amber-600 transition-all cursor-pointer"
                                        title="Mark as completed"
                                      >
                                        <CheckIcon className="w-3.5 h-3.5" />
                                        Complete
                                      </button>
                                    )}
                                    {(session.status === 'PLANNED' || session.status === 'OPEN') && (
                                      <button
                                        onClick={() => handleSessionAction(session.id, 'cancel')}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide bg-destructive text-white hover:bg-red-600 transition-all cursor-pointer"
                                        title="Cancel session"
                                      >
                                        <XMarkIcon className="w-3.5 h-3.5" />
                                        Cancel
                                      </button>
                                    )}
                                    {session.status !== 'PLANNED' && session.status !== 'OPEN' && (
                                      <span className="text-xs text-muted-foreground italic">No actions</span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
