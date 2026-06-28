'use client';

import { ShareIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { useToast } from './Toast';

interface JobDetailClientProps {
  jobTitle: string;
  companyName?: string;
}

export default function JobDetailClient({ jobTitle, companyName }: JobDetailClientProps) {
  const { toast } = useToast();
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: jobTitle,
          text: `Check out this job opportunity: ${jobTitle}${companyName ? ` at ${companyName}` : ''}`,
          url: window.location.href
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast('Job URL copied to clipboard', 'success');
    }
  };

  const handleSave = () => {
    // You can implement bookmark functionality here
    // For now, just show a placeholder
    toast('Bookmark functionality would be implemented here', 'info');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    window.open(linkedInUrl, 'linkedin-share', 'width=600,height=600,scrollbars=yes');
  };

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleShare}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-control hover:bg-gray-50 transition-colors"
      >
        <ShareIcon className="w-4 h-4 mr-2" />
        Share
      </button>
      <button
        onClick={handleShareLinkedIn}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-control hover:bg-gray-50 transition-colors"
        title="Share on LinkedIn"
      >
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#0A66C2">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
        LinkedIn
      </button>
      <button
        onClick={handleSave}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-control hover:bg-gray-50 transition-colors"
      >
        <BookmarkIcon className="w-4 h-4 mr-2" />
        Save
      </button>
    </div>
  );
}