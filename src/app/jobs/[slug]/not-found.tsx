import Link from 'next/link';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function JobNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-6">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
          <p className="text-gray-600">
            The job posting you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
        </div>
        <div className="space-y-3">
          <Link href="/jobs">
            <button className="w-full inline-flex items-center justify-center px-4 py-2 bg-gold-500 text-violet-950 rounded-full hover:bg-gold-600 transition-colors">
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              View All Jobs
            </button>
          </Link>
          <Link href="/">
            <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors">
              Go to Homepage
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}