import { apiFetch } from '@/lib/api-fetch';

export interface FeedPost {
  id: number;
  authorId: number;
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
  id: number;
  postId: number;
  authorId: number;
  authorName: string | null;
  content: string;
  createdAt: string;
}

export interface FeedReaction {
  id: number;
  postId: number;
  userId: number;
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

  async getPost(id: number): Promise<FeedPost> {
    const response = await apiFetch(`/api/feed/${id}`);
    if (!response.ok) throw new Error('Post not found');
    return await response.json();
  },

  async createPost(data: { authorId: number; title?: string; content: string; category: string }): Promise<FeedPost> {
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

  async updatePost(id: number, data: Partial<FeedPost>): Promise<FeedPost> {
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

  async deletePost(id: number): Promise<void> {
    const response = await apiFetch(`/api/feed/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete post');
  },

  async togglePin(id: number): Promise<FeedPost> {
    const response = await apiFetch(`/api/feed/${id}/pin`, { method: 'PUT' });
    if (!response.ok) throw new Error('Failed to toggle pin');
    return await response.json();
  },

  // Comments
  async addComment(postId: number, data: { authorId: number; content: string }): Promise<FeedComment> {
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

  async deleteComment(postId: number, commentId: number): Promise<void> {
    const response = await apiFetch(`/api/feed/${postId}/comments/${commentId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete comment');
  },

  // Reactions
  async toggleReaction(postId: number, userId: number, reactionType: string): Promise<{ action: string }> {
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
