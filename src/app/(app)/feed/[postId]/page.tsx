'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { feedService, FeedPost, FeedComment } from '@/services/feedService';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  HandThumbUpIcon,
  SparklesIcon,
  HeartIcon,
  TrashIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  ANNOUNCEMENT: 'bg-red-100 text-red-700',
  DISCUSSION: 'bg-blue-100 text-blue-700',
  EVENT: 'bg-purple-100 text-purple-700',
  POLICY_UPDATE: 'bg-amber-100 text-amber-700',
  KUDOS: 'bg-green-100 text-green-700',
};

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryLabel(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = Number(params.postId);
  const { user } = useAuth();

  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadPost = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await feedService.getPost(postId);
      setPost(data);
    } catch (err) {
      console.error('Failed to load post:', err);
      setError('Post not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) loadPost();
  }, [postId, loadPost]);

  async function handleToggleReaction(reactionType: 'LIKE' | 'CELEBRATE' | 'SUPPORT') {
    if (!user || !post) return;
    try {
      const userId = Number(user.id);
      await feedService.toggleReaction(post.id, userId, reactionType);
      await loadPost();
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }

  async function handleAddComment() {
    if (!user || !post || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const authorId = Number(user.id);
      await feedService.addComment(post.id, { authorId, content: commentText.trim() });
      setCommentText('');
      await loadPost();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!post) return;
    try {
      await feedService.deleteComment(post.id, commentId);
      await loadPost();
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  function hasUserReacted(reactionType: string): boolean {
    if (!user || !post) return false;
    const userId = Number(user.id);
    return post.reactions.some((r) => r.userId === userId && r.reactionType === reactionType);
  }

  function getReactionCount(reactionType: string): number {
    if (!post) return 0;
    return post.reactions.filter((r) => r.reactionType === reactionType).length;
  }

  if (loading) {
    return (
      <PageWrapper title="Post" subtitle="Loading post details">
        <FeatureGate feature="SOCIAL_FEED">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </FeatureGate>
      </PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <PageWrapper title="Post" subtitle="Post details">
        <FeatureGate feature="SOCIAL_FEED">
          <div className="enterprise-card p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {error || 'Post not found.'}
            </p>
            <Link
              href="/feed"
              className="inline-flex items-center gap-2 mt-4 text-sm text-blue-600 hover:text-blue-800"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Feed
            </Link>
          </div>
        </FeatureGate>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Post" subtitle="View post and comments">
      <FeatureGate feature="SOCIAL_FEED">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Back Link */}
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to Feed
          </Link>

          {/* Post Detail Card */}
          <div className="enterprise-card p-6">
            {/* Author and Meta */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                  {post.authorName ? post.authorName.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {post.authorName || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(post.publishedAt || post.createdAt)}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_BADGE_COLORS[post.category] || 'bg-gray-100 text-gray-700'}`}
              >
                {categoryLabel(post.category)}
              </span>
            </div>

            {/* Title and Content */}
            {post.title && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {post.title}
              </h2>
            )}
            <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
              {post.content}
            </div>

            {/* Reaction Bar */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <button
                onClick={() => handleToggleReaction('LIKE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  hasUserReacted('LIKE')
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {hasUserReacted('LIKE') ? (
                  <HandThumbUpSolidIcon className="h-4 w-4" />
                ) : (
                  <HandThumbUpIcon className="h-4 w-4" />
                )}
                Like
                {getReactionCount('LIKE') > 0 && (
                  <span className="ml-0.5 font-medium">{getReactionCount('LIKE')}</span>
                )}
              </button>
              <button
                onClick={() => handleToggleReaction('CELEBRATE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  hasUserReacted('CELEBRATE')
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {hasUserReacted('CELEBRATE') ? (
                  <SparklesSolidIcon className="h-4 w-4" />
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                Celebrate
                {getReactionCount('CELEBRATE') > 0 && (
                  <span className="ml-0.5 font-medium">{getReactionCount('CELEBRATE')}</span>
                )}
              </button>
              <button
                onClick={() => handleToggleReaction('SUPPORT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  hasUserReacted('SUPPORT')
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
                }`}
              >
                {hasUserReacted('SUPPORT') ? (
                  <HeartSolidIcon className="h-4 w-4" />
                ) : (
                  <HeartIcon className="h-4 w-4" />
                )}
                Support
                {getReactionCount('SUPPORT') > 0 && (
                  <span className="ml-0.5 font-medium">{getReactionCount('SUPPORT')}</span>
                )}
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="enterprise-card p-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ChatBubbleLeftIcon className="h-5 w-5" />
              Comments ({post.comments.length})
            </h3>

            {/* Add Comment */}
            <div className="mb-6">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || submittingComment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingComment ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>

            {/* Comments List */}
            {post.comments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-4">
                {post.comments.map((comment: FeedComment) => {
                  const isOwnComment = user && Number(user.id) === comment.authorId;
                  return (
                    <div
                      key={comment.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-semibold text-gray-600 dark:text-gray-300">
                            {comment.authorName
                              ? comment.authorName.charAt(0).toUpperCase()
                              : '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {comment.authorName || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {timeAgo(comment.createdAt)}
                            </p>
                          </div>
                        </div>
                        {isOwnComment && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Delete comment"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 ml-9">
                        {comment.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </FeatureGate>
    </PageWrapper>
  );
}
