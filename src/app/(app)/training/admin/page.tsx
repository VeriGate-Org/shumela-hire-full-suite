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
        courseId: parseInt(sessionForm.courseId),
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

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this course?')) return;
    try {
      await trainingService.deleteCourse(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete course');
    }
  };

  const handleSessionAction = async (id: number, action: 'open' | 'close' | 'cancel') => {
    try {
      if (action === 'open') await trainingService.openSession(id);
      else if (action === 'close') await trainingService.closeSession(id);
      else await trainingService.cancelSession(id);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!canManage) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Access Denied" subtitle="You do not have permission to access Training Administration.">
          <div className="text-center py-12">
            <ShieldExclamationIcon className="w-12 h-12 text-red-400 mx-auto mb-4" />
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
        subtitle="Manage courses, sessions, and enrollments"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2">
            <button onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 text-sm rounded-t-lg font-medium ${activeTab === 'courses' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              Courses
            </button>
            <button onClick={() => setActiveTab('sessions')}
              className={`px-4 py-2 text-sm rounded-t-lg font-medium ${activeTab === 'sessions' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              Sessions
            </button>
          </div>

          {/* Course Tab */}
          {activeTab === 'courses' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowCourseForm(!showCourseForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4" /> New Course
                </button>
              </div>

              {showCourseForm && (
                <form onSubmit={handleCreateCourse} className="bg-white rounded-lg shadow border p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Create Training Course</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                      <input type="text" required value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
                      <input type="text" required value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Delivery Method</label>
                      <select value={courseForm.deliveryMethod} onChange={e => setCourseForm({ ...courseForm, deliveryMethod: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="CLASSROOM">Classroom</option>
                        <option value="ONLINE">Online</option>
                        <option value="BLENDED">Blended</option>
                        <option value="ON_THE_JOB">On the Job</option>
                        <option value="WORKSHOP">Workshop</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <input type="text" value={courseForm.category} onChange={e => setCourseForm({ ...courseForm, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Provider</label>
                      <input type="text" value={courseForm.provider} onChange={e => setCourseForm({ ...courseForm, provider: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Duration (Hours)</label>
                      <input type="number" step="0.5" value={courseForm.durationHours} onChange={e => setCourseForm({ ...courseForm, durationHours: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Max Participants</label>
                      <input type="number" value={courseForm.maxParticipants} onChange={e => setCourseForm({ ...courseForm, maxParticipants: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Cost (ZAR)</label>
                      <input type="number" step="0.01" value={courseForm.cost} onChange={e => setCourseForm({ ...courseForm, cost: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex items-end gap-4 pb-1">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={courseForm.isMandatory} onChange={e => setCourseForm({ ...courseForm, isMandatory: e.target.checked })} />
                        Mandatory
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows={3} value={courseForm.description} onChange={e => setCourseForm({ ...courseForm, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowCourseForm(false)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Course</button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sessions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {courses.map(course => (
                        <tr key={course.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-gray-900">{course.title}</p>
                            <p className="text-xs text-gray-500">{course.code}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{course.deliveryMethod?.replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{course.category || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{course.sessionCount}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${course.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {course.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            <button onClick={() => handleDeleteCourse(course.id)} className="text-red-500 hover:text-red-700">
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={() => setShowSessionForm(!showSessionForm)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <PlusIcon className="w-4 h-4" /> New Session
                </button>
              </div>

              {showSessionForm && (
                <form onSubmit={handleCreateSession} className="bg-white rounded-lg shadow border p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900">Create Training Session</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Course *</label>
                      <select required value={sessionForm.courseId} onChange={e => setSessionForm({ ...sessionForm, courseId: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm">
                        <option value="">Select a course</option>
                        {courses.filter(c => c.isActive).map(c => (
                          <option key={c.id} value={c.id}>{c.title} ({c.code})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Trainer Name</label>
                      <input type="text" value={sessionForm.trainerName} onChange={e => setSessionForm({ ...sessionForm, trainerName: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                      <input type="text" value={sessionForm.location} onChange={e => setSessionForm({ ...sessionForm, location: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                      <input type="datetime-local" required value={sessionForm.startDate} onChange={e => setSessionForm({ ...sessionForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">End Date *</label>
                      <input type="datetime-local" required value={sessionForm.endDate} onChange={e => setSessionForm({ ...sessionForm, endDate: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Available Seats</label>
                      <input type="number" value={sessionForm.availableSeats} onChange={e => setSessionForm({ ...sessionForm, availableSeats: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setShowSessionForm(false)} className="px-4 py-2 text-sm text-gray-600 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Session</button>
                  </div>
                </form>
              )}

              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (
                <div className="bg-white rounded-lg shadow border overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trainer</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {sessions.map(session => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">
                            <p className="font-medium text-gray-900">{session.courseTitle}</p>
                            <p className="text-xs text-gray-500">{session.courseCode}</p>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{session.trainerName || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(session.startDate).toLocaleDateString('en-ZA')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {session.enrollmentCount}{session.availableSeats ? `/${session.availableSeats}` : ''}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              session.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                              session.status === 'COMPLETED' ? 'bg-purple-100 text-purple-700' :
                              session.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {session.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-right space-x-2">
                            {session.status === 'PLANNED' && (
                              <button onClick={() => handleSessionAction(session.id, 'open')} className="text-green-600 hover:text-green-800 text-xs font-medium">Open</button>
                            )}
                            {session.status === 'OPEN' && (
                              <button onClick={() => handleSessionAction(session.id, 'close')} className="text-purple-600 hover:text-purple-800 text-xs font-medium">Complete</button>
                            )}
                            {(session.status === 'PLANNED' || session.status === 'OPEN') && (
                              <button onClick={() => handleSessionAction(session.id, 'cancel')} className="text-red-600 hover:text-red-800 text-xs font-medium">Cancel</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
