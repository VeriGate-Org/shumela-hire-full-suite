'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { trainingService, IndividualDevelopmentPlan } from '@/services/trainingService';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlusIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  ACTIVE: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function IDPsPage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ? Number(user.employeeId) : null;

  const [idps, setIdps] = useState<IndividualDevelopmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    targetDate: '',
  });

  useEffect(() => {
    if (employeeId) {
      loadIDPs();
    }
  }, [employeeId]);

  const loadIDPs = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await trainingService.getIDPs({ employeeId });
      setIdps(data);
    } catch {
      // Keep empty state on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await trainingService.createIDP({
        employeeId,
        title: form.title,
        description: form.description || null,
        startDate: form.startDate || null,
        targetDate: form.targetDate || null,
      });
      setForm({ title: '', description: '', startDate: '', targetDate: '' });
      setShowForm(false);
      loadIDPs();
    } catch (err: any) {
      alert(err.message || 'Failed to create IDP');
    } finally {
      setSubmitting(false);
    }
  };

  const getCompletedGoals = (idp: IndividualDevelopmentPlan) => {
    return idp.goals.filter(g => g.status === 'COMPLETED').length;
  };

  const getProgressPercent = (idp: IndividualDevelopmentPlan) => {
    if (idp.goals.length === 0) return 0;
    return Math.round((getCompletedGoals(idp) / idp.goals.length) * 100);
  };

  return (
    <FeatureGate feature="TRAINING_MANAGEMENT">
      <PageWrapper
        title="Individual Development Plans"
        subtitle="Set goals and track your professional development"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" /> Create IDP
          </button>
        }
      >
        <div className="space-y-6">
          {/* Create Form */}
          {showForm && (
            <form onSubmit={handleCreate} className="enterprise-card p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Create New Development Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="e.g. Q2 2026 Development Plan"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    rows={3}
                    placeholder="Describe the focus and objectives of this plan..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={form.targetDate}
                    onChange={e => setForm({ ...form, targetDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          )}

          {/* IDPs List */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading development plans...</div>
          ) : !employeeId ? (
            <div className="text-center py-12 text-gray-500 enterprise-card">
              Unable to determine your employee record. Please contact your administrator.
            </div>
          ) : idps.length === 0 ? (
            <div className="text-center py-12 text-gray-500 enterprise-card">
              <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm font-medium text-gray-900 mb-1">No development plans yet</p>
              <p className="text-sm text-gray-500">Create your first IDP to start tracking your development goals.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {idps.map(idp => {
                const completed = getCompletedGoals(idp);
                const total = idp.goals.length;
                const progress = getProgressPercent(idp);

                return (
                  <Link key={idp.id} href={`/training/idps/${idp.id}`} className="block">
                    <div className="enterprise-card p-6 hover:shadow-md transition-shadow cursor-pointer">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground flex-1 mr-2">{idp.title}</h3>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[idp.status] || ''}`}>
                          {idp.status}
                        </span>
                      </div>

                      {/* Description */}
                      {idp.description && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{idp.description}</p>
                      )}

                      {/* Date Range */}
                      <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        <span>{formatDate(idp.startDate)} - {formatDate(idp.targetDate)}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Goal Count */}
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        <span>{completed} / {total} goals completed</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
