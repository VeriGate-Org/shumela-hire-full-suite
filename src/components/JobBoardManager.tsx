'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { jobBoardService } from '@/services/jobBoardService';
import StatusPill from '@/components/StatusPill';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  JobBoardPosting,
  JobBoardType,
  AvailableBoard,
  getBoardDisplayName,
} from '@/types/jobBoard';

interface JobBoardManagerProps {
  jobId: string;
}

export default function JobBoardManager({ jobId }: JobBoardManagerProps) {
  const { toast } = useToast();
  const [postings, setPostings] = useState<JobBoardPosting[]>([]);
  const [availableBoards, setAvailableBoards] = useState<AvailableBoard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [removePostingId, setRemovePostingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [postingsResult, boardsResult] = await Promise.allSettled([
        jobBoardService.getPostingsByJob(jobId),
        jobBoardService.getAvailableBoards(),
      ]);
      if (postingsResult.status === 'fulfilled') {
        setPostings(postingsResult.value);
      } else {
        toast('Failed to load board postings', 'error');
      }
      if (boardsResult.status === 'fulfilled') {
        setAvailableBoards(boardsResult.value);
      } else {
        toast('Failed to load available boards', 'error');
      }
    } catch (error) {
      console.error('Failed to load job board data:', error);
      toast('Failed to load job board data', 'error');
    } finally {
      setLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePost = async () => {
    if (!selectedBoard) return;
    try {
      setActionLoading(-1);
      await jobBoardService.postToBoard(jobId, selectedBoard as JobBoardType);
      setSelectedBoard('');
      await loadData();
    } catch (error) {
      console.error('Failed to post:', error);
      toast('Failed to post to board', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSync = async (id: number) => {
    try {
      setActionLoading(id);
      await jobBoardService.syncPosting(id);
      await loadData();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = (id: number) => {
    setRemovePostingId(id);
  };

  const confirmRemove = async () => {
    if (removePostingId === null) return;
    const id = removePostingId;
    setRemovePostingId(null);
    try {
      setActionLoading(id);
      await jobBoardService.removePosting(id);
      await loadData();
    } catch (error) {
      console.error('Failed to remove:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter out boards that already have an active posting
  const postedBoardTypes = postings
    .filter(p => p.status === 'POSTED' || p.status === 'PENDING')
    .map(p => p.boardType);
  const unpostedBoards = availableBoards.filter(b => !postedBoardTypes.includes(b.type as JobBoardType));

  if (loading) {
    return <div className="py-4"><div className="animate-spin h-6 w-6 border-2 border-gold-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Job Board Postings</h4>
      </div>

      {/* Post to new board */}
      {unpostedBoards.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={selectedBoard}
            onChange={e => setSelectedBoard(e.target.value)}
            className="text-sm p-2 border border-gray-300 rounded-sm flex-1"
          >
            <option value="">Select a board...</option>
            {unpostedBoards.map(board => (
              <option key={board.type} value={board.type}>
                {board.displayName} {board.requiresApiIntegration ? '(API)' : '(Manual)'}
              </option>
            ))}
          </select>
          <button
            onClick={handlePost}
            disabled={!selectedBoard || actionLoading === -1}
            className="px-3 py-2 text-sm bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionLoading === -1 ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}

      {/* Posting list */}
      {postings.length === 0 ? (
        <p className="text-sm text-gray-500">No board postings yet. Select a board above to post this job.</p>
      ) : (
        <div className="space-y-2">
          {postings.map(posting => (
            <div key={posting.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <span className="font-medium text-sm text-gray-900">
                  {getBoardDisplayName(posting.boardType)}
                </span>
                <StatusPill value={posting.status} domain="postingStatus" size="sm" />
              </div>

              <div className="flex items-center gap-4">
                {posting.status === 'POSTED' && (
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{posting.viewCount} views</span>
                    <span>{posting.clickCount} clicks</span>
                    <span>{posting.applicationCount} apps</span>
                  </div>
                )}

                <div className="flex gap-1">
                  {posting.externalUrl && (
                    <a
                      href={posting.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-2 py-1 text-violet-700 border border-violet-200 rounded hover:bg-gold-50"
                    >
                      View
                    </a>
                  )}
                  {posting.status === 'POSTED' && (
                    <>
                      <button
                        onClick={() => handleSync(posting.id)}
                        disabled={actionLoading === posting.id}
                        className="text-xs px-2 py-1 text-blue-700 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
                      >
                        {actionLoading === posting.id ? 'Syncing...' : 'Sync'}
                      </button>
                      <button
                        onClick={() => handleRemove(posting.id)}
                        disabled={actionLoading === posting.id}
                        className="text-xs px-2 py-1 text-red-700 border border-red-200 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={removePostingId !== null}
        title="Remove Posting"
        message="Remove this posting from the board?"
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemove}
        onCancel={() => setRemovePostingId(null)}
      />
    </div>
  );
}
