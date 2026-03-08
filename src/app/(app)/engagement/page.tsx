'use client';

import React, { useState, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { engagementService, Survey, Recognition, WellnessProgram, LeaderboardEntry } from '@/services/engagementService';
import {
  HeartIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  SparklesIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function EngagementDashboardPage() {
  const [activeSurveys, setActiveSurveys] = useState<Survey[]>([]);
  const [recentRecognitions, setRecentRecognitions] = useState<Recognition[]>([]);
  const [activePrograms, setActivePrograms] = useState<WellnessProgram[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [surveys, recognitions, programs, leaders] = await Promise.all([
        engagementService.getActiveSurveys(),
        engagementService.getPublicRecognitions(0, 5),
        engagementService.getActiveWellnessPrograms(),
        engagementService.getLeaderboard(5),
      ]);
      setActiveSurveys(surveys);
      setRecentRecognitions(recognitions.content);
      setActivePrograms(programs);
      setLeaderboard(leaders);
    } catch (error) {
      console.error('Failed to load engagement dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { label: 'Active Surveys', value: activeSurveys.length, icon: ClipboardDocumentListIcon, href: '/engagement/surveys', color: 'bg-blue-500' },
    { label: 'Recent Recognitions', value: recentRecognitions.length, icon: StarIcon, href: '/engagement/recognition', color: 'bg-yellow-500' },
    { label: 'Wellness Programs', value: activePrograms.length, icon: HeartIcon, href: '/engagement/wellness', color: 'bg-green-500' },
    { label: 'Top Performers', value: leaderboard.length, icon: TrophyIcon, href: '/engagement/recognition', color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <PageWrapper title="Employee Engagement" subtitle="Surveys, recognition, and wellness programs">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Employee Engagement" subtitle="Surveys, recognition, and wellness programs">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Link key={card.label} href={card.href}>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center">
                  <div className={`${card.color} p-3 rounded-lg`}>
                    <card.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Surveys */}
          <FeatureGate feature="PULSE_SURVEYS">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Surveys</h3>
                <Link href="/engagement/surveys" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
              </div>
              {activeSurveys.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No active surveys</p>
              ) : (
                <div className="space-y-3">
                  {activeSurveys.slice(0, 5).map((survey) => (
                    <div key={survey.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{survey.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {survey.endDate ? `Ends: ${new Date(survey.endDate).toLocaleDateString()}` : 'No end date'}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FeatureGate>

          {/* Recognition Leaderboard */}
          <FeatureGate feature="RECOGNITION_REWARDS">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recognition Leaderboard</h3>
                <Link href="/engagement/recognition" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
              </div>
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">No recognitions yet</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => (
                    <div key={entry.employeeId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-gray-400 w-8">#{idx + 1}</span>
                        <p className="font-medium text-gray-900 dark:text-white">{entry.employeeName}</p>
                      </div>
                      <div className="flex items-center">
                        <TrophyIcon className="h-4 w-4 text-yellow-500 mr-1" />
                        <span className="font-semibold text-gray-900 dark:text-white">{entry.totalPoints} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FeatureGate>
        </div>

        {/* Recent Recognitions */}
        <FeatureGate feature="RECOGNITION_REWARDS">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Recognitions</h3>
              <Link href="/engagement/recognition/give" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                Give Recognition
              </Link>
            </div>
            {recentRecognitions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recognitions yet. Be the first!</p>
            ) : (
              <div className="space-y-3">
                {recentRecognitions.map((rec) => (
                  <div key={rec.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{rec.fromEmployeeName}</span> recognized{' '}
                          <span className="font-medium">{rec.toEmployeeName}</span>
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{rec.message}</p>
                      </div>
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        {rec.category.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <SparklesIcon className="h-3 w-3 mr-1" />
                      {rec.points} points
                      <span className="mx-2">|</span>
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FeatureGate>

        {/* Wellness Programs */}
        <FeatureGate feature="WELLNESS_PROGRAMS">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Wellness Programs</h3>
              <Link href="/engagement/wellness" className="text-sm text-blue-600 hover:text-blue-800">View all</Link>
            </div>
            {activePrograms.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No active wellness programs</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePrograms.slice(0, 6).map((program) => (
                  <div key={program.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white">{program.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{program.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">{program.programType}</span>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-3 w-3 mr-1" />
                        {program.currentParticipants}{program.maxParticipants ? `/${program.maxParticipants}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FeatureGate>
      </div>
    </PageWrapper>
  );
}
