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
  ANNOUNCEMENT: 'bg-surface-pink text-idc-pink-600',
  DISCUSSION: 'bg-surface-navy text-primary',
  EVENT: 'bg-surface-gold text-gold-600',
  POLICY_UPDATE: 'bg-surface-teal text-teal-600',
  KUDOS: 'bg-surface-gold text-gold-700',
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

  async function handleToggleReaction(postId: string, reactionType: 'LIKE' | 'CELEBRATE' | 'SUPPORT') {
    if (!user) return;
    try {
      await feedService.toggleReaction(postId, user.id, reactionType);
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
    return (post.reactions || []).some((r) => r.userId === user.id && r.reactionType === reactionType);
  }

  function getReactionCount(post: FeedPost, reactionType: string): number {
    return (post.reactions || []).filter((r) => r.reactionType === reactionType).length;
  }

  const hasMore = posts.length < totalElements;

  /* ========== Pinned (Hero) Announcement Card ========== */
  function renderPinnedCard(post: FeedPost) {
    return (
      <div
        key={post.id}
        className="enterprise-card relative overflow-hidden border-l-[5px] border-l-cta px-7 py-7 mb-7"
      >
        {/* Gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cta via-cta-hover to-primary" />

        {/* Pinned badge + category */}
        <div className="flex items-center gap-2.5 mb-3.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 bg-surface-gold text-gold-600 text-[0.6875rem] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
            <MapPinIcon className="h-3 w-3" />
            PINNED
          </span>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide ${CATEGORY_BADGE_COLORS[post.category] || 'bg-surface-navy text-primary'}`}
          >
            {categoryLabel(post.category)}
          </span>
        </div>

        {/* Title */}
        <Link href={`/feed/${post.id}`} className="block group">
          <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2 group-hover:text-primary transition-colors">
            {post.title || post.content.slice(0, 60)}
          </h2>
        </Link>

        {/* Meta: author + date */}
        <div className="flex items-center gap-4 text-[0.8125rem] text-muted-foreground mb-3.5 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-icon-bg-gold text-gold-600 inline-flex items-center justify-center text-[0.65rem] font-bold flex-shrink-0">
              {post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').slice(0, 3).toUpperCase() : '?'}
            </span>
            <span>
              Published by <strong className="text-foreground font-semibold">{post.authorName || 'Unknown'}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {timeAgo(post.publishedAt || post.createdAt)}
          </div>
        </div>

        {/* Preview text */}
        <p className="text-[0.9375rem] text-muted-foreground leading-relaxed mb-4 line-clamp-3">
          {post.content}
        </p>

        {/* Footer: Read More + reactions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            href={`/feed/${post.id}`}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border-2 border-primary text-primary text-[0.8125rem] font-bold uppercase tracking-wide hover:bg-primary hover:text-white transition-colors"
          >
            READ MORE
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </Link>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleReaction(post.id, 'LIKE')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-control text-[0.8125rem] font-semibold transition-colors ${
                hasUserReacted(post, 'LIKE')
                  ? 'bg-surface-navy text-primary'
                  : 'text-muted-foreground hover:bg-surface-navy hover:text-primary'
              }`}
            >
              {hasUserReacted(post, 'LIKE') ? (
                <HandThumbUpSolidIcon className="h-[18px] w-[18px]" />
              ) : (
                <HandThumbUpIcon className="h-[18px] w-[18px]" />
              )}
              <span>Like</span>
              {getReactionCount(post, 'LIKE') > 0 && (
                <span className="text-muted-foreground font-medium">{getReactionCount(post, 'LIKE')}</span>
              )}
            </button>
            <button
              onClick={() => handleToggleReaction(post.id, 'CELEBRATE')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-control text-[0.8125rem] font-semibold transition-colors ${
                hasUserReacted(post, 'CELEBRATE')
                  ? 'bg-surface-gold text-gold-600'
                  : 'text-muted-foreground hover:bg-surface-gold hover:text-gold-600'
              }`}
            >
              {hasUserReacted(post, 'CELEBRATE') ? (
                <SparklesSolidIcon className="h-[18px] w-[18px]" />
              ) : (
                <SparklesIcon className="h-[18px] w-[18px]" />
              )}
              <span>Celebrate</span>
              {getReactionCount(post, 'CELEBRATE') > 0 && (
                <span className="text-muted-foreground font-medium">{getReactionCount(post, 'CELEBRATE')}</span>
              )}
            </button>
            <button
              onClick={() => handleToggleReaction(post.id, 'SUPPORT')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-control text-[0.8125rem] font-semibold transition-colors ${
                hasUserReacted(post, 'SUPPORT')
                  ? 'bg-surface-pink text-idc-pink-600'
                  : 'text-muted-foreground hover:bg-surface-pink hover:text-idc-pink-600'
              }`}
            >
              {hasUserReacted(post, 'SUPPORT') ? (
                <HeartSolidIcon className="h-[18px] w-[18px]" />
              ) : (
                <HeartIcon className="h-[18px] w-[18px]" />
              )}
              <span>Love</span>
              {getReactionCount(post, 'SUPPORT') > 0 && (
                <span className="text-muted-foreground font-medium">{getReactionCount(post, 'SUPPORT')}</span>
              )}
            </button>
            <Link
              href={`/feed/${post.id}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-control text-[0.8125rem] font-semibold text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
            >
              <ChatBubbleLeftIcon className="h-[18px] w-[18px]" />
              <span>Comment</span>
              {(post.commentCount || 0) > 0 && (
                <span className="text-muted-foreground font-medium">{post.commentCount}</span>
              )}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ========== Regular Post Card (Social Feed style) ========== */
  function renderPostCard(post: FeedPost) {
    const totalReactions = getReactionCount(post, 'LIKE') + getReactionCount(post, 'CELEBRATE') + getReactionCount(post, 'SUPPORT');

    return (
      <div
        key={post.id}
        className="enterprise-card overflow-hidden transition-shadow"
      >
        {/* Post Header */}
        <div className="flex items-center gap-3.5 px-5 pt-5">
          <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-[0.8125rem] font-bold flex-shrink-0 tracking-wide">
            {post.authorName ? post.authorName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[0.9375rem] font-bold text-foreground">
                {post.authorName || 'Unknown'}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[0.6875rem] font-semibold uppercase tracking-wide ${CATEGORY_BADGE_COLORS[post.category] || 'bg-surface-navy text-primary'}`}
              >
                {categoryLabel(post.category)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {timeAgo(post.publishedAt || post.createdAt)}
            </p>
          </div>
        </div>

        {/* Post Content */}
        <Link href={`/feed/${post.id}`} className="block group">
          <div className="px-5 py-4">
            {post.title && (
              <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-primary transition-colors tracking-tight">
                {post.title}
              </h3>
            )}
            <p className="text-[0.9375rem] text-foreground leading-relaxed line-clamp-3">
              {post.content}
            </p>
          </div>
        </Link>

        {/* Reactions Summary Bar */}
        {(totalReactions > 0 || (post.commentCount || 0) > 0) && (
          <div className="flex items-center justify-between px-5 mb-2">
            {totalReactions > 0 && (
              <span className="text-[0.8125rem] text-muted-foreground font-medium">
                {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
              </span>
            )}
            {(post.commentCount || 0) > 0 && (
              <Link
                href={`/feed/${post.id}`}
                className="text-[0.8125rem] text-muted-foreground font-medium hover:text-primary transition-colors ml-auto"
              >
                {post.commentCount} comment{post.commentCount !== 1 ? 's' : ''}
              </Link>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border mx-5" />

        {/* Action Buttons */}
        <div className="flex items-center px-5 py-2">
          <button
            onClick={() => handleToggleReaction(post.id, 'LIKE')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-control text-[0.8125rem] font-semibold transition-colors ${
              hasUserReacted(post, 'LIKE')
                ? 'text-primary'
                : 'text-muted-foreground hover:bg-accent hover:text-primary'
            }`}
          >
            {hasUserReacted(post, 'LIKE') ? (
              <HandThumbUpSolidIcon className="h-[18px] w-[18px]" />
            ) : (
              <HandThumbUpIcon className="h-[18px] w-[18px]" />
            )}
            <span>Like</span>
          </button>
          <button
            onClick={() => handleToggleReaction(post.id, 'SUPPORT')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-control text-[0.8125rem] font-semibold transition-colors ${
              hasUserReacted(post, 'SUPPORT')
                ? 'text-idc-pink-600'
                : 'text-muted-foreground hover:bg-accent hover:text-primary'
            }`}
          >
            {hasUserReacted(post, 'SUPPORT') ? (
              <HeartSolidIcon className="h-[18px] w-[18px]" />
            ) : (
              <HeartIcon className="h-[18px] w-[18px]" />
            )}
            <span>Love</span>
          </button>
          <button
            onClick={() => handleToggleReaction(post.id, 'CELEBRATE')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-control text-[0.8125rem] font-semibold transition-colors ${
              hasUserReacted(post, 'CELEBRATE')
                ? 'text-gold-600'
                : 'text-muted-foreground hover:bg-accent hover:text-primary'
            }`}
          >
            {hasUserReacted(post, 'CELEBRATE') ? (
              <SparklesSolidIcon className="h-[18px] w-[18px]" />
            ) : (
              <SparklesIcon className="h-[18px] w-[18px]" />
            )}
            <span>Celebrate</span>
          </button>
          <Link
            href={`/feed/${post.id}`}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-control text-[0.8125rem] font-semibold text-muted-foreground hover:bg-accent hover:text-primary transition-colors"
          >
            <ChatBubbleLeftIcon className="h-[18px] w-[18px]" />
            <span>Comment</span>
          </Link>
        </div>
      </div>
    );
  }

  /* ========== Loading State ========== */
  if (loading) {
    return (
      <PageWrapper title="Social Feed" subtitle="Stay connected with your organisation">
        {/* Skeleton Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="enterprise-card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-accent animate-pulse" />
              <div className="flex-1">
                <div className="h-7 w-16 bg-accent rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-accent rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton Filter Pills */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 w-24 bg-accent rounded-full animate-pulse" />
          ))}
        </div>
        {/* Skeleton Post Cards */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="enterprise-card p-5">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-accent animate-pulse" />
                <div className="flex-1">
                  <div className="h-4 w-40 bg-accent rounded animate-pulse mb-1.5" />
                  <div className="h-3 w-24 bg-accent rounded animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-full bg-accent rounded animate-pulse mb-2" />
              <div className="h-4 w-[90%] bg-accent rounded animate-pulse mb-2" />
              <div className="h-4 w-[60%] bg-accent rounded animate-pulse" />
            </div>
          ))}
        </div>
      </PageWrapper>
    );
  }

  /* ========== Main Render ========== */
  return (
    <PageWrapper
      title="Social Feed"
      subtitle="Stay connected with your organisation"
      actions={
        <Link
          href="/feed/compose"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-full border-2 border-cta bg-transparent text-primary uppercase tracking-wide hover:bg-cta hover:text-foreground transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          New Post
        </Link>
      }
    >
      <FeatureGate feature="SOCIAL_FEED" fallback={
        <div className="enterprise-card p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-navy inline-flex items-center justify-center mb-5">
            <ChatBubbleLeftIcon className="h-9 w-9 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">Feature not available</h3>
          <p className="text-[0.9rem] text-muted-foreground">Social Feed requires a Standard plan or higher.</p>
        </div>
      }>
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-navy text-primary flex items-center justify-center flex-shrink-0">
              <ChatBubbleLeftIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{posts.length}</div>
              <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Posts This Page</div>
            </div>
          </div>
          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-teal text-teal-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{pinnedPosts.length}</div>
              <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Pinned Announcements</div>
            </div>
          </div>
          <div className="enterprise-card p-5 flex items-center gap-4 hover:-translate-y-px">
            <div className="w-12 h-12 rounded-card bg-icon-bg-gold text-gold-600 flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <div className="text-[1.75rem] font-extrabold leading-tight text-foreground">{totalElements}</div>
              <div className="text-[0.8125rem] text-muted-foreground font-medium mt-0.5">Total Posts</div>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 mb-6 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-[1.125rem] py-2 rounded-full border text-[0.8125rem] font-semibold tracking-wide transition-colors ${
                activeCategory === cat.key
                  ? 'bg-primary border-primary text-white'
                  : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Feed Layout: Main + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">

          {/* Main Feed Column */}
          <div className="flex flex-col gap-4">

            {/* Compose Card */}
            <div className="enterprise-card p-5">
              <div className="flex gap-3.5 mb-4">
                <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center text-[0.8125rem] font-bold flex-shrink-0">
                  {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <Link
                  href="/feed/compose"
                  className="flex-1 border border-border rounded-control px-4 py-3 text-[0.9375rem] text-muted-foreground hover:border-primary transition-colors cursor-pointer flex items-center"
                >
                  Share something with your team...
                </Link>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button className="w-[38px] h-[38px] rounded-control flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </button>
                  <button className="w-[38px] h-[38px] rounded-control flex items-center justify-center text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </button>
                </div>
                <Link
                  href="/feed/compose"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cta border-2 border-cta text-foreground text-xs font-bold uppercase tracking-wide hover:bg-cta-hover hover:border-cta-hover transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  Post
                </Link>
              </div>
            </div>

            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && pinnedPosts.map((post) => renderPinnedCard(post))}

            {/* Feed Posts */}
            {posts.length === 0 ? (
              <div className="enterprise-card p-16 text-center">
                <div className="w-20 h-20 rounded-full bg-surface-navy inline-flex items-center justify-center mb-5">
                  <ChatBubbleLeftIcon className="h-9 w-9 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No posts yet</h3>
                <p className="text-[0.9rem] text-muted-foreground mb-5">Be the first to share something!</p>
                <Link
                  href="/feed/compose"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-cta bg-transparent text-primary text-sm font-bold uppercase tracking-wide hover:bg-cta hover:text-foreground transition-colors"
                >
                  Create Post
                </Link>
              </div>
            ) : (
              posts.map((post) => renderPostCard(post))
            )}

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-2 pb-4">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-border bg-card text-muted-foreground text-[0.8125rem] font-semibold hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:flex flex-col gap-4 sticky top-20">

            {/* Trending Topics */}
            <div className="enterprise-card p-5">
              <h3 className="font-bold text-[0.9375rem] text-foreground mb-4 flex items-center gap-2">
                <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Trending Topics
              </h3>
              <div className="flex flex-col">
                {[
                  { rank: 1, topic: 'Performance Reviews', count: '12 posts' },
                  { rank: 2, topic: 'Team Building Event', count: '8 posts' },
                  { rank: 3, topic: 'Q3 Planning', count: '6 posts' },
                  { rank: 4, topic: 'Training Updates', count: '4 posts' },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-3 py-2.5 ${idx < 3 ? 'border-b border-border' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                      {item.rank}
                    </div>
                    <span className="flex-1 text-[0.8125rem] font-medium text-foreground leading-snug">{item.topic}</span>
                    <span className="text-xs text-muted-foreground font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Members */}
            <div className="enterprise-card p-5">
              <h3 className="font-bold text-[0.9375rem] text-foreground mb-4 flex items-center gap-2">
                <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Active Now
              </h3>
              <div className="flex flex-col gap-2.5">
                {[
                  { initials: 'TM', name: 'Thandi Mkhize', dept: 'Executive Office', color: 'bg-idc-pink-600' },
                  { initials: 'BN', name: 'Bongani Nkosi', dept: 'Operations', color: 'bg-primary' },
                  { initials: 'ND', name: 'Nomvula Dlamini', dept: 'HR', color: 'bg-teal-600' },
                  { initials: 'PvM', name: 'Pieter van der Merwe', dept: 'Finance', color: 'bg-gold-600' },
                ].map((person, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <div className={`relative w-8 h-8 rounded-full ${person.color} text-white flex items-center justify-center text-[0.625rem] font-bold flex-shrink-0`}>
                      {person.initials}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-teal-600 border-2 border-card" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.8125rem] font-semibold text-foreground truncate">{person.name}</div>
                      <div className="text-[0.6875rem] text-muted-foreground font-medium">{person.dept}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="enterprise-card p-5">
              <h3 className="font-bold text-[0.9375rem] text-foreground mb-4 flex items-center gap-2">
                <svg className="w-[18px] h-[18px] text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                Quick Links
              </h3>
              <div className="flex flex-col gap-1">
                <Link href="/feed/compose" className="flex items-center gap-2 px-3 py-2 rounded-control text-[0.8125rem] font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                  <PlusIcon className="h-4 w-4" />
                  Create New Post
                </Link>
                <Link href="/engagement" className="flex items-center gap-2 px-3 py-2 rounded-control text-[0.8125rem] font-medium text-muted-foreground hover:bg-accent hover:text-primary transition-colors">
                  <HeartIcon className="h-4 w-4" />
                  Engagement Hub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </FeatureGate>
    </PageWrapper>
  );
}
