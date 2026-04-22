'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { performanceEnhancementService, FeedbackRequest } from '@/services/performanceEnhancementService';
import { ChatBubbleLeftRightIcon, ClockIcon, CheckCircleIcon, XCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { aiPerformanceService } from '@/services/aiPerformanceService';
import { FeedbackSummaryResult } from '@/types/ai';

export default function FeedbackPage() {
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ employeeId: '', requesterId: '', feedbackType: 'PEER', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [aiSummary, setAiSummary] = useState<FeedbackSummaryResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = await performanceEnhancementService.getPendingFeedbackRequests(0, 50);
      setRequests(data.content);
    } catch (error) {
      console.error('Failed to load feedback requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await performanceEnhancementService.createFeedbackRequest({
        employeeId: formData.employeeId,
        requesterId: formData.requesterId,
        feedbackType: formData.feedbackType,
        dueDate: formData.dueDate || null,
      });
      setShowCreateModal(false);
      setFormData({ employeeId: '', requesterId: '', feedbackType: 'PEER', dueDate: '' });
      loadRequests();
    } catch (error: any) {
      alert(error.message || 'Failed to create request');
    } finally {
      setSubmitting(false);
    }
  }

  async function generateAiSummary() {
    if (requests.length === 0) return;
    setAiLoading(true);
    try {
      const submitted = requests.filter(r => r.status === 'SUBMITTED');
      const result = await aiPerformanceService.summarizeFeedback({
        employeeName: 'Selected Employee',
        feedbackEntries: submitted.map(r => ({
          respondentRole: r.feedbackType || 'PEER',
          comments: `Feedback from ${r.requesterName} (${r.feedbackType})`,
        })),
      });
      setAiSummary(result);
    } catch (error) {
      console.error('AI summary failed:', error);
    } finally {
      setAiLoading(false);
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'SUBMITTED': return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'DECLINED': return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-green-100 text-green-800',
      DECLINED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const feedbackTypes = ['PEER', 'UPWARD', 'DOWNWARD', 'SELF', 'EXTERNAL'];

  return (
    <FeatureGate feature="PERFORMANCE_360_FEEDBACK">
      <PageWrapper title="360 Feedback" subtitle="Multi-source performance feedback management"
        actions={
          <div className="flex gap-2">
            <button onClick={generateAiSummary}
              disabled={aiLoading || requests.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm disabled:opacity-50 flex items-center gap-1">
              <SparklesIcon className="h-4 w-4" />
              {aiLoading ? 'Analysing...' : 'AI Summary'}
            </button>
            <button onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              Request Feedback
            </button>
          </div>
        }>
        {aiSummary && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-purple-900 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                AI Feedback Summary
              </h3>
              <button onClick={() => setAiSummary(null)} className="text-purple-400 hover:text-purple-600 text-sm">Dismiss</button>
            </div>
            <p className="text-sm text-purple-800 mb-3">{aiSummary.executiveSummary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {aiSummary.consensusStrengths?.length > 0 && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-green-700 mb-1">Consensus Strengths</h4>
                  <ul className="text-xs text-gray-600 space-y-1">{aiSummary.consensusStrengths.map((s, i) => <li key={i}>- {s}</li>)}</ul>
                </div>
              )}
              {aiSummary.consensusDevelopmentAreas?.length > 0 && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-700 mb-1">Development Areas</h4>
                  <ul className="text-xs text-gray-600 space-y-1">{aiSummary.consensusDevelopmentAreas.map((s, i) => <li key={i}>- {s}</li>)}</ul>
                </div>
              )}
              {aiSummary.blindSpots?.length > 0 && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-red-700 mb-1">Blind Spots</h4>
                  <ul className="text-xs text-gray-600 space-y-1">{aiSummary.blindSpots.map((s, i) => <li key={i}>- {s}</li>)}</ul>
                </div>
              )}
              {aiSummary.actionableRecommendations?.length > 0 && (
                <div className="bg-white p-3 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-700 mb-1">Recommended Actions</h4>
                  <ul className="text-xs text-gray-600 space-y-1">{aiSummary.actionableRecommendations.map((s, i) => <li key={i}>- {s}</li>)}</ul>
                </div>
              )}
            </div>
            {aiSummary.sentimentOverview && (
              <p className="text-xs text-purple-600 mt-2">Sentiment: {aiSummary.sentimentOverview}</p>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Feedback Requests List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No feedback requests found</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requester</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Created</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{req.employeeName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{req.requesterName}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">{req.feedbackType}</span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusBadge(req.status)}`}>{req.status}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                        {req.dueDate ? new Date(req.dueDate).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {req.status === 'PENDING' && (
                          <Link
                            href={`/performance/360/provide/${req.id}`}
                            className="px-3 py-1.5 bg-gold-500 text-white rounded-lg hover:bg-gold-600 text-xs font-medium"
                          >
                            Provide Feedback
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request 360 Feedback</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID (to evaluate)</label>
                  <input type="text" required value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requester ID</label>
                  <input type="text" required value={formData.requesterId}
                    onChange={(e) => setFormData({ ...formData, requesterId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Feedback Type</label>
                  <select value={formData.feedbackType}
                    onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    {feedbackTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input type="date" value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
                  <button type="submit" disabled={submitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                    {submitting ? 'Creating...' : 'Create Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </PageWrapper>
    </FeatureGate>
  );
}
