'use client';

import React, { useState } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService } from '@/services/engagementService';
import { useRouter } from 'next/navigation';
import { SparklesIcon } from '@heroicons/react/24/outline';

const categories = [
  { value: 'TEAMWORK', label: 'Teamwork', description: 'Great collaboration and team spirit' },
  { value: 'INNOVATION', label: 'Innovation', description: 'Creative thinking and new ideas' },
  { value: 'CUSTOMER_SERVICE', label: 'Customer Service', description: 'Outstanding service delivery' },
  { value: 'LEADERSHIP', label: 'Leadership', description: 'Exceptional leadership qualities' },
  { value: 'GOING_ABOVE', label: 'Going Above & Beyond', description: 'Exceeding expectations' },
];

export default function GiveRecognitionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fromEmployeeId: '',
    toEmployeeId: '',
    category: '',
    message: '',
    points: '10',
    isPublic: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await engagementService.giveRecognition({
        fromEmployeeId: parseInt(formData.fromEmployeeId),
        toEmployeeId: parseInt(formData.toEmployeeId),
        category: formData.category,
        message: formData.message,
        points: parseInt(formData.points),
        isPublic: formData.isPublic,
      });
      setSuccess(true);
      setTimeout(() => router.push('/engagement/recognition'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to give recognition');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FeatureGate feature="RECOGNITION_REWARDS">
      <PageWrapper title="Give Recognition" subtitle="Recognize a colleague for their outstanding work">
        <div className="max-w-2xl mx-auto">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
              <SparklesIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-green-800">Recognition Sent!</h3>
              <p className="text-green-600 mt-2">Your recognition has been shared. Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Employee ID</label>
                  <input type="number" required value={formData.fromEmployeeId}
                    onChange={(e) => setFormData({ ...formData, fromEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recognize Employee ID</label>
                  <input type="number" required value={formData.toEmployeeId}
                    onChange={(e) => setFormData({ ...formData, toEmployeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <label key={cat.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.category === cat.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                      }`}>
                      <input type="radio" name="category" value={cat.value} checked={formData.category === cat.value}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">{cat.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                <textarea required rows={4} value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Share what this person did and why it matters..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Points</label>
                  <input type="number" min="1" max="100" value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="mr-2 h-4 w-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Share publicly on the recognition wall</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => router.back()}
                  className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || !formData.category}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {submitting ? 'Sending...' : 'Send Recognition'}
                </button>
              </div>
            </form>
          )}
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
