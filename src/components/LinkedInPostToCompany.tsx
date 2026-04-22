'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from './Toast';
import { linkedInSocialService, LinkedInConnectionStatus } from '@/services/linkedInSocialService';

interface JobPostingInfo {
  id: string | number;
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  employmentTypeDisplayName?: string;
}

interface LinkedInPostToCompanyProps {
  jobPosting: JobPostingInfo;
  isOpen: boolean;
  onClose: () => void;
}

const LINKEDIN_MAX_CHARS = 3000;

function buildDefaultPostText(job: JobPostingInfo): string {
  let text = `We're hiring! ${job.title}\n\n`;

  const details: string[] = [];
  if (job.location) details.push(job.location);
  if (job.employmentTypeDisplayName) details.push(job.employmentTypeDisplayName);
  if (details.length > 0) text += details.join(' | ') + '\n\n';

  text += `Apply now on ShumelaHire\n\n`;
  text += '#Hiring';
  if (job.department) {
    text += ` #${job.department.replace(/[^a-zA-Z0-9]/g, '')}`;
  }
  text += ' #JobOpening';

  return text;
}

export default function LinkedInPostToCompany({ jobPosting, isOpen, onClose }: LinkedInPostToCompanyProps) {
  const { toast } = useToast();
  const [postText, setPostText] = useState('');
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<LinkedInConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setPostText(buildDefaultPostText(jobPosting));
      loadConnectionStatus();
    }
  }, [isOpen, jobPosting]);

  const loadConnectionStatus = async () => {
    setStatusLoading(true);
    try {
      const status = await linkedInSocialService.getStatus();
      setConnectionStatus(status);
    } catch {
      setConnectionStatus({ connected: false, organizationName: null, organizationId: null, connectedAt: null, tokenExpired: false });
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePost = async () => {
    if (!postText.trim()) {
      toast('Post text cannot be empty', 'error');
      return;
    }
    if (postText.length > LINKEDIN_MAX_CHARS) {
      toast(`Post text exceeds ${LINKEDIN_MAX_CHARS} characters`, 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await linkedInSocialService.createPost({
        jobPostingId: jobPosting.id,
        customText: postText,
      });

      if (response.success) {
        toast('Successfully posted to LinkedIn', 'success');
        if (response.postUrl) {
          window.open(response.postUrl, '_blank', 'noopener,noreferrer');
        }
        onClose();
      } else {
        toast(response.message || 'Failed to post to LinkedIn', 'error');
      }
    } catch {
      toast('Failed to post to LinkedIn', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const charsRemaining = LINKEDIN_MAX_CHARS - postText.length;
  const isOverLimit = charsRemaining < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-sm shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#0A66C2">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-900">Post to Company LinkedIn</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {statusLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0A66C2]" />
            </div>
          ) : !connectionStatus?.connected ? (
            <div className="text-center py-6">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <p className="text-gray-600 font-medium">LinkedIn not connected</p>
              <p className="text-sm text-gray-500 mt-1">
                Ask your administrator to connect the company LinkedIn page in Integrations.
              </p>
            </div>
          ) : connectionStatus.tokenExpired ? (
            <div className="text-center py-6">
              <p className="text-amber-600 font-medium">LinkedIn connection expired</p>
              <p className="text-sm text-gray-500 mt-1">
                Ask your administrator to reconnect the company LinkedIn page in Integrations.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full" />
                  Posting as <strong>{connectionStatus.organizationName}</strong>
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  Posting: <strong>{jobPosting.title}</strong>
                </p>
              </div>

              <div className="mb-2">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-[#0A66C2]/30 focus:border-[#0A66C2] resize-none text-sm"
                  placeholder="Write your LinkedIn post..."
                />
              </div>

              <div className="flex justify-between text-xs">
                <button
                  onClick={() => setPostText(buildDefaultPostText(jobPosting))}
                  className="text-[#0A66C2] hover:underline"
                >
                  Reset to default
                </button>
                <span className={isOverLimit ? 'text-red-600 font-medium' : 'text-gray-400'}>
                  {charsRemaining} characters remaining
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {connectionStatus?.connected && !connectionStatus.tokenExpired && (
            <button
              onClick={handlePost}
              disabled={loading || isOverLimit || !postText.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-[#0A66C2] rounded-full hover:bg-[#004182] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />}
              {loading ? 'Posting...' : 'Post to LinkedIn'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
