'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, Recognition, LeaderboardEntry } from '@/services/engagementService';
import { StarIcon, TrophyIcon, SparklesIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function RecognitionPage() {
  const [recognitions, setRecognitions] = useState<Recognition[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadData();
  }, [page]);

  async function loadData() {
    setLoading(true);
    try {
      const [recData, leaders] = await Promise.all([
        engagementService.getPublicRecognitions(page, 10),
        engagementService.getLeaderboard(10),
      ]);
      setRecognitions(recData.content);
      setTotalPages(recData.totalPages);
      setLeaderboard(leaders);
    } catch (error) {
      console.error('Failed to load recognition data:', error);
    } finally {
      setLoading(false);
    }
  }

  const categoryColors: Record<string, string> = {
    TEAMWORK: 'bg-blue-100 text-blue-800',
    INNOVATION: 'bg-purple-100 text-purple-800',
    CUSTOMER_SERVICE: 'bg-green-100 text-green-800',
    LEADERSHIP: 'bg-yellow-100 text-yellow-800',
    GOING_ABOVE: 'bg-pink-100 text-pink-800',
  };

  return (
    <FeatureGate feature="RECOGNITION_REWARDS">
      <PageWrapper title="Recognition Wall" subtitle="Celebrate your colleagues' achievements"
        actions={
          <Link href="/engagement/recognition/give"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            Give Recognition
          </Link>
        }>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recognitions Feed */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Recognitions</h3>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : recognitions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <StarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recognitions yet. Be the first to recognize a colleague!</p>
              </div>
            ) : (
              <>
                {recognitions.map((rec) => (
                  <div key={rec.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          <span className="font-semibold">{rec.fromEmployeeName}</span>{' '}
                          recognized <span className="font-semibold">{rec.toEmployeeName}</span>
                        </p>
                        {rec.message && (
                          <p className="text-gray-600 dark:text-gray-300 mt-2 italic">&ldquo;{rec.message}&rdquo;</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[rec.category] || 'bg-gray-100 text-gray-800'}`}>
                        {rec.category.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <SparklesIcon className="h-4 w-4 mr-1 text-yellow-500" />
                      {rec.points} points
                      <span className="mx-2">|</span>
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 pt-4">
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1 text-sm rounded border disabled:opacity-50">Previous</button>
                    <span className="px-3 py-1 text-sm">Page {page + 1} of {totalPages}</span>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1 text-sm rounded border disabled:opacity-50">Next</button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Leaderboard Sidebar */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <TrophyIcon className="h-5 w-5 mr-2 text-yellow-500" /> Leaderboard
              </h3>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.employeeId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                          idx === 1 ? 'bg-gray-100 text-gray-800' :
                          idx === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">{entry.employeeName}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{entry.totalPoints} pts</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </PageWrapper>
    </FeatureGate>
  );
}
