import { apiFetch } from '@/lib/api-fetch';

export interface FeedPost {
  id: string;
  authorId: string;
  authorName: string | null;
  title: string | null;
  content: string;
  category: 'ANNOUNCEMENT' | 'DISCUSSION' | 'EVENT' | 'POLICY_UPDATE' | 'KUDOS';
  pinned: boolean;
  publishedAt: string;
  status: string;
  comments: FeedComment[];
  reactions: FeedReaction[];
  commentCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string | null;
  content: string;
  createdAt: string;
}

export interface FeedReaction {
  id: string;
  postId: string;
  userId: string;
  reactionType: 'LIKE' | 'CELEBRATE' | 'SUPPORT';
  createdAt: string;
}

export interface FeedPage {
  content: FeedPost[];
  totalElements: number;
  page: number;
  size: number;
}

export const feedService = {
  async getFeed(page = 0, size = 20, category?: string): Promise<FeedPage> {
    const params = new URLSearchParams({ page: page.toString(), size: size.toString() });
    if (category) params.set('category', category);
    const response = await apiFetch(`/api/feed?${params}`);
    if (!response.ok) return { content: [], totalElements: 0, page: 0, size: 20 };
    return await response.json();
  },

  async getPinnedPosts(): Promise<FeedPost[]> {
    const response = await apiFetch('/api/feed/pinned');
    if (!response.ok) return [];
    return await response.json();
  },

  async getPost(id: string): Promise<FeedPost> {
    const response = await apiFetch(`/api/feed/${id}`);
    if (!response.ok) throw new Error('Post not found');
    return await response.json();
  },

  async createPost(data: { authorId: string; title?: string; content: string; category: string }): Promise<FeedPost> {
    const response = await apiFetch('/api/feed', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to create post');
    }
    return await response.json();
  },

  async updatePost(id: string, data: Partial<FeedPost>): Promise<FeedPost> {
    const response = await apiFetch(`/api/feed/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to update post');
    }
    return await response.json();
  },

  async deletePost(id: string): Promise<void> {
    const response = await apiFetch(`/api/feed/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
  },

  async togglePin(id: string): Promise<FeedPost> {
    const response = await apiFetch(`/api/feed/${id}/pin`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to toggle pin');
    return await response.json();
  },

  // Comments
  async addComment(postId: string, data: { authorId: string; content: string }): Promise<FeedComment> {
    const response = await apiFetch(`/api/feed/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to add comment');
    }
    return await response.json();
  },

  async deleteComment(postId: string, commentId: string): Promise<void> {
    const response = await apiFetch(`/api/feed/${postId}/comments/${commentId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete comment');
  },

  // Reactions
  async toggleReaction(postId: string, userId: string, reactionType: string): Promise<{ action: string }> {
    const response = await apiFetch(`/api/feed/${postId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ userId, reactionType }),
    });
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Failed to toggle reaction');
    }
    return await response.json();
  },
};
