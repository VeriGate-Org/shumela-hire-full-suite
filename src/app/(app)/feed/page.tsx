'use client';

import React, { useState, useEffect, useCallback } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { FeatureGate } from '@/components/FeatureGate';
import { feedService, FeedPost } from '@/services/feedService';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  HandThumbUpIcon,
  ChatBubbleLeftIcon,
  SparklesIcon,
  HeartIcon,
  PlusIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import {
  HandThumbUpIcon as HandThumbUpSolidIcon,
  SparklesIcon as SparklesSolidIcon,
  HeartIcon as HeartSolidIcon,
} from '@heroicons/react/24/solid';

const CATEGORIES = [
  { key: 'ALL', label: 'All' },
  { key: 'ANNOUNCEMENT', label: 'Announcements' },
  { key: 'DISCUSSION', label: 'Discussions' },
  { key: 'EVENT', label: 'Events' },
  { key: 'POLICY_UPDATE', label: 'Policy Updates' },
  { key: 'KUDOS', label: 'Kudos' },
];

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

function categoryLabel(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<FeedPost[]>([]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  const loadFeed = useCallback(async (pageNum: number, category: string, append = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    try {
      const categoryParam = category === 'ALL' ? undefined : category;
      const result = await feedService.getFeed(pageNum, PAGE_SIZE, categoryParam);
      if (append) {
        setPosts((prev) => [...prev, ...result.content]);
      } else {
        setPosts(result.content);
      }
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error('Failed to load feed:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  const loadPinned = useCallback(async () => {
    try {
      const pinned = await feedService.getPinnedPosts();
      setPinnedPosts(pinned);
    } catch (error) {
      console.error('Failed to load pinned posts:', error);
    }
  }, []);

  useEffect(() => {
    loadPinned();
  }, [loadPinned]);

  useEffect(() => {
    setPage(0);
    loadFeed(0, activeCategory);
  }, [activeCategory, loadFeed]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage, activeCategory, true);
  }

  async function handleToggleReaction(postId: number, reactionType: 'LIKE' | 'CELEBRATE' | 'SUPPORT') {
    if (!user) return;
    try {
      const userId = Number(user.id);
      await feedService.toggleReaction(postId, userId, reactionType);
      // Refresh the post in both lists
      const updatedPost = await feedService.getPost(postId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
      setPinnedPosts((prev) => prev.map((p) => (p.id === postId ? updatedPost : p)));
    } catch (error) {
      console.error('Failed to toggle reaction:', error);
    }
  }

  function hasUserReacted(post: FeedPost, reactionType: string): boolean {
    if (!user) return false;
    const userId = Number(user.id);
    return post.reactions.some((r) => r.userId === userId && r.reactionType === reactionType);
  }

  function getReactionCount(post: FeedPost, reactionType: string): number {
    return post.reactions.filter((r) => r.reactionType === reactionType).length;
  }

  const hasMore = posts.length < totalElements;

  function renderPostCard(post: FeedPost, isPinned = false) {
    return (
      <div
        key={post.id}
        className={`enterprise-card p-5 ${isPinned ? 'border-l-4 border-l-yellow-400' : ''}`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-sm font-semibold text-blue-700 dark:text-blue-300">
              {post.authorName ? post.authorName.charAt(0).toUpperCase() : '?'}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {post.authorName || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo(post.publishedAt || post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPinned && (
              <span className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                <MapPinIcon className="h-3.5 w-3.5" />
                Pinned
              </span>
            )}
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_BADGE_COLORS[post.category] || 'bg-gray-100 text-gray-700'}`}
            >
              {categoryLabel(post.category)}
            </span>
          </div>
        </div>

        <Link href={`/feed/${post.id}`} className="block group">
          {post.title && (
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1">
              {post.title}
            </h3>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
            {post.content}
          </p>
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleReaction(post.id, 'LIKE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                hasUserReacted(post, 'LIKE')
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {hasUserReacted(post, 'LIKE') ? (
                <HandThumbUpSolidIcon className="h-4 w-4" />
              ) : (
                <HandThumbUpIcon className="h-4 w-4" />
              )}
              {getReactionCount(post, 'LIKE') > 0 && (
                <span>{getReactionCount(post, 'LIKE')}</span>
              )}
            </button>
            <button
              onClick={() => handleToggleReaction(post.id, 'CELEBRATE')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                hasUserReacted(post, 'CELEBRATE')
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {hasUserReacted(post, 'CELEBRATE') ? (
                <SparklesSolidIcon className="h-4 w-4" />
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {getReactionCount(post, 'CELEBRATE') > 0 && (
                <span>{getReactionCount(post, 'CELEBRATE')}</span>
              )}
            </button>
            <button
              onClick={() => handleToggleReaction(post.id, 'SUPPORT')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-colors ${
                hasUserReacted(post, 'SUPPORT')
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-400'
              }`}
            >
              {hasUserReacted(post, 'SUPPORT') ? (
                <HeartSolidIcon className="h-4 w-4" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
              {getReactionCount(post, 'SUPPORT') > 0 && (
                <span>{getReactionCount(post, 'SUPPORT')}</span>
              )}
            </button>
          </div>

          <Link
            href={`/feed/${post.id}`}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ChatBubbleLeftIcon className="h-4 w-4" />
            {post.commentCount > 0 && <span>{post.commentCount}</span>}
            <span>Comments</span>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <PageWrapper title="Social Feed" subtitle="Stay connected with your organisation">
        <FeatureGate feature="SOCIAL_FEED">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        </FeatureGate>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Social Feed"
      subtitle="Stay connected with your organisation"
      actions={
        <Link
          href="/feed/compose"
          className="btn-cta inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Post
        </Link>
      }
    >
      <FeatureGate feature="SOCIAL_FEED">
        <div className="space-y-6">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  activeCategory === cat.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Pinned Posts Section */}
          {pinnedPosts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Pinned
              </h3>
              <div className="space-y-3">
                {pinnedPosts.map((post) => renderPostCard(post, true))}
              </div>
            </div>
          )}

          {/* Feed Posts */}
          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="enterprise-card p-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No posts yet. Be the first to share something!
                </p>
                <Link
                  href="/feed/compose"
                  className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  Create Post
                </Link>
              </div>
            ) : (
              posts.map((post) => renderPostCard(post))
            )}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </FeatureGate>
    </PageWrapper>
  );
}
