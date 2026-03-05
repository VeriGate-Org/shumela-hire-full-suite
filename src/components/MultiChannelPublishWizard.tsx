'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { jobBoardService } from '@/services/jobBoardService';
import { AvailableBoard, JobBoardType, BatchPostResult, getBoardDisplayName } from '@/types/jobBoard';

interface MultiChannelPublishWizardProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

export default function MultiChannelPublishWizard({ jobId, isOpen, onClose, onComplete }: MultiChannelPublishWizardProps) {
  const { toast } = useToast();
  const [availableBoards, setAvailableBoards] = useState<AvailableBoard[]>([]);
  const [selectedBoards, setSelectedBoards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<BatchPostResult[] | null>(null);

  const loadBoards = useCallback(async () => {
    setLoading(true);
    try {
      const [boards, existingPostings] = await Promise.all([
        jobBoardService.getAvailableBoards(),
        jobBoardService.getPostingsByJob(jobId),
      ]);

      // Filter out boards that already have active postings
      const postedTypes = existingPostings
        .filter(p => p.status === 'POSTED' || p.status === 'PENDING')
        .map(p => p.boardType);

      const unposted = boards.filter(b => !postedTypes.includes(b.type as JobBoardType));
      setAvailableBoards(unposted);

      // Pre-check all boards
      setSelectedBoards(new Set(unposted.map(b => b.type)));
    } catch (error) {
      console.error('Error loading boards:', error);
      toast('Failed to load available boards.', 'error');
    } finally {
      setLoading(false);
    }
  }, [jobId, toast]);

  useEffect(() => {
    if (isOpen) {
      setResults(null);
      loadBoards();
    }
  }, [isOpen, loadBoards]);

  const toggleBoard = (type: string) => {
    setSelectedBoards(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedBoards.size === availableBoards.length) {
      setSelectedBoards(new Set());
    } else {
      setSelectedBoards(new Set(availableBoards.map(b => b.type)));
    }
  };

  const handlePublish = async () => {
    if (selectedBoards.size === 0) {
      toast('Please select at least one channel.', 'error');
      return;
    }

    setPublishing(true);
    try {
      const boards = Array.from(selectedBoards).map(type => ({
        boardType: type as JobBoardType,
      }));

      const batchResults = await jobBoardService.postToMultipleBoards(jobId, boards);
      setResults(batchResults);

      const successCount = batchResults.filter(r => r.success).length;
      const failCount = batchResults.length - successCount;

      if (failCount === 0) {
        toast(`Published to ${successCount} channel${successCount > 1 ? 's' : ''} successfully!`, 'success');
      } else {
        toast(`Published to ${successCount} channel${successCount > 1 ? 's' : ''}, ${failCount} failed.`, 'error');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast('Failed to publish to selected channels.', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = () => {
    if (results && results.some(r => r.success)) {
      onComplete?.();
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-sm shadow-xl max-w-lg w-full m-4 border border-border">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-medium text-foreground">
            Publish to Job Boards
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Select the channels to publish this job posting to simultaneously.
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
            </div>
          ) : results ? (
            /* Results view */
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Publishing Results
              </h4>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-sm border ${
                    result.success
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                  }`}
                >
                  <span className="text-sm font-medium text-foreground">
                    {result.boardDisplayName}
                  </span>
                  {result.success ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      Failed
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : availableBoards.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                All available channels already have active postings for this job.
              </p>
            </div>
          ) : (
            /* Board selection */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedBoards.size} of {availableBoards.length} selected
                </span>
                <button
                  onClick={toggleAll}
                  className="text-sm text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-medium"
                >
                  {selectedBoards.size === availableBoards.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {availableBoards.map((board) => (
                <label
                  key={board.type}
                  className={`flex items-center p-4 rounded-sm border cursor-pointer transition-colors ${
                    selectedBoards.has(board.type)
                      ? 'border-violet-300 bg-gold-50 dark:border-violet-600 dark:bg-gold-950'
                      : 'border-border bg-card hover:bg-muted'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedBoards.has(board.type)}
                    onChange={() => toggleBoard(board.type)}
                    className="h-4 w-4 text-violet-600 border-border rounded focus:ring-gold-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-foreground">
                      {board.displayName}
                    </span>
                    {board.requiresApiIntegration && (
                      <span className="ml-2 text-xs text-muted-foreground">(API)</span>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-muted flex justify-end space-x-3">
          <button
            onClick={handleClose}
            disabled={publishing}
            className="px-4 py-2 text-foreground border border-border rounded-sm hover:bg-muted"
          >
            {results ? 'Close' : 'Cancel'}
          </button>
          {!results && availableBoards.length > 0 && (
            <button
              onClick={handlePublish}
              disabled={publishing || selectedBoards.size === 0}
              className="px-4 py-2 bg-gold-500 text-violet-950 rounded-sm hover:bg-gold-600 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : `Publish to ${selectedBoards.size} Channel${selectedBoards.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
