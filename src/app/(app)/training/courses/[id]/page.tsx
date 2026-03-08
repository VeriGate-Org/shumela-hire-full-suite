'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import {
  trainingService,
  TrainingCourse,
  TrainingSession,
  Certification,
} from '@/services/trainingService';
import {
  ArrowLeftIcon,
  AcademicCapIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const deliveryMethodColors: Record<string, string> = {
  CLASSROOM: 'bg-blue-100 text-blue-700',
  ONLINE: 'bg-green-100 text-green-700',
  BLENDED: 'bg-purple-100 text-purple-700',
  ON_THE_JOB: 'bg-yellow-100 text-yellow-700',
  WORKSHOP: 'bg-orange-100 text-orange-700',
};

const sessionStatusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = Number(params.id);

  const [course, setCourse] = useState<TrainingCourse | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollingSessionId, setEnrollingSessionId] = useState<number | null>(null);
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [enrollSuccess, setEnrollSuccess] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [courseData, sessionsData, certsData] = await Promise.all([
        trainingService.getCourse(courseId),
        trainingService.getSessions({ courseId }),
        trainingService.getCertifications({}),
      ]);

      setCourse(courseData);
      setSessions(sessionsData);
      setCertifications(certsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      fetchData();
    }
  }, [courseId, fetchData]);

  async function handleEnroll(sessionId: number) {
    const empId = Number(employeeIdInput);
    if (!empId || isNaN(empId)) {
      setEnrollError('Please enter a valid employee ID.');
      return;
    }

    try {
      setEnrollError(null);
      setEnrollSuccess(null);
      await trainingService.enroll(sessionId, empId);
      setEnrollSuccess(`Successfully enrolled employee #${empId}.`);
      setEnrollingSessionId(null);
      setEmployeeIdInput('');
      // Refresh sessions to update seat counts
      const updatedSessions = await trainingService.getSessions({ courseId });
      setSessions(updatedSessions);
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : 'Enrollment failed');
    }
  }

  // Filter certifications that might relate to this course (match by course title in cert name)
  const relatedCerts = course
    ? certifications.filter(
        (c) =>
          c.name.toLowerCase().includes(course.title.toLowerCase()) ||
          course.title.toLowerCase().includes(c.name.toLowerCase())
      )
    : [];

  if (loading) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Course Details" subtitle="Loading course...">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (error) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Course Details" subtitle="An error occurred">
          <div className="bg-white rounded-[10px] border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{error}</h3>
              <p className="text-sm text-gray-500 mb-6">
                Please try again or go back to the courses list.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={fetchData}
                  className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
                >
                  Retry
                </button>
                <Link
                  href="/training/courses"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50"
                >
                  Back to Courses
                </Link>
              </div>
            </div>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  if (!course) {
    return (
      <FeatureGate feature="TRAINING_MANAGEMENT">
        <PageWrapper title="Course Details" subtitle="Course not found">
          <div className="bg-white rounded-[10px] border border-gray-200 p-12 text-center">
            <AcademicCapIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Course not found</h3>
            <p className="text-sm text-gray-500 mb-6">
              The course you are looking for does not exist.
            </p>
            <Link
              href="/training/courses"
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-full text-sm font-medium hover:bg-gold-600"
            >
              Back to Courses
            </Link>
          </div>
        </PageWrapper>
      </FeatureGate>
    );
  }

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper title={course.title} subtitle={`Course ${course.code}`}>
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/training/courses"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-600 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Courses
          </Link>

          {/* Success message */}
          {enrollSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-[10px] p-4 text-sm text-green-700">
              {enrollSuccess}
              <button
                onClick={() => setEnrollSuccess(null)}
                className="ml-4 text-green-500 hover:text-green-700 font-medium"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Course Info Card */}
          <div className="bg-white rounded-[10px] border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
                <p className="text-sm text-gray-500 mt-1">Code: {course.code}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    deliveryMethodColors[course.deliveryMethod] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {course.deliveryMethod?.replace('_', ' ')}
                </span>
                {course.category && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    {course.category}
                  </span>
                )}
                {course.isMandatory && (
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">
                    Mandatory
                  </span>
                )}
                {!course.isActive && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {course.description && (
              <p className="text-sm text-gray-700 leading-relaxed mb-6">{course.description}</p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <AcademicCapIcon className="w-4 h-4 text-gold-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provider
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">{course.provider || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-4 h-4 text-gold-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {course.durationHours ? `${course.durationHours} hours` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserGroupIcon className="w-4 h-4 text-gold-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Participants
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {course.maxParticipants ?? 'Unlimited'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gold-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <CurrencyDollarIcon className="w-4 h-4 text-gold-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">
                    {course.cost ? `R${course.cost.toLocaleString()}` : 'Free'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-gray-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sessions
                  </p>
                  <p className="text-sm text-gray-900 mt-0.5">{course.sessionCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Training Sessions</h3>
            </div>

            {sessions.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">No sessions available for this course.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trainer
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sessions.map((session) => (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {session.trainerName || 'TBD'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <MapPinIcon className="w-3.5 h-3.5" />
                            {session.location || 'TBD'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(session.startDate)} - {formatDate(session.endDate)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              sessionStatusColors[session.status] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {session.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {session.availableSeats !== null
                            ? `${session.availableSeats} available`
                            : 'Unlimited'}{' '}
                          <span className="text-gray-400">
                            ({session.enrollmentCount} enrolled)
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {session.status === 'OPEN' &&
                          session.availableSeats !== null &&
                          session.availableSeats > 0 ? (
                            enrollingSessionId === session.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="Employee ID"
                                  value={employeeIdInput}
                                  onChange={(e) => setEmployeeIdInput(e.target.value)}
                                  className="w-28 px-2 py-1 border rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                                />
                                <button
                                  onClick={() => handleEnroll(session.id)}
                                  className="px-3 py-1 bg-gold-500 text-violet-950 rounded-full text-xs font-medium hover:bg-gold-600"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => {
                                    setEnrollingSessionId(null);
                                    setEmployeeIdInput('');
                                    setEnrollError(null);
                                  }}
                                  className="px-3 py-1 border border-gray-300 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEnrollingSessionId(session.id);
                                  setEnrollError(null);
                                  setEnrollSuccess(null);
                                }}
                                className="px-4 py-1.5 bg-gold-500 text-violet-950 rounded-full text-xs font-medium hover:bg-gold-600"
                              >
                                Enroll
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {enrollError && (
              <div className="px-6 py-3 bg-red-50 border-t border-red-200 text-sm text-red-700">
                {enrollError}
              </div>
            )}
          </div>

          {/* Related Certifications */}
          <div className="bg-white rounded-[10px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">Related Certifications</h3>
            </div>

            {relatedCerts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckBadgeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-sm text-gray-500">
                  No certifications are linked to this course.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {relatedCerts.map((cert) => (
                  <li key={cert.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {cert.issuingBody || 'Unknown issuer'}
                        {cert.certificationNumber && ` - #${cert.certificationNumber}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Employee: {cert.employeeName}
                        {cert.issueDate && ` | Issued: ${formatDate(cert.issueDate)}`}
                        {cert.expiryDate && ` | Expires: ${formatDate(cert.expiryDate)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {cert.expired && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          Expired
                        </span>
                      )}
                      {cert.expiringSoon && !cert.expired && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                          Expiring Soon
                        </span>
                      )}
                      {!cert.expired && !cert.expiringSoon && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          {cert.status}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
