'use client';

import React from 'react';
import { JobAd, PublishingChannel, formatSalaryRange, getChannelDisplayName } from '../../types/jobAd';
import { JobAdDraft } from '../../types/jobTemplate';
import { 
  MapPinIcon, 
  BriefcaseIcon, 
  CalendarIcon, 
  EnvelopeIcon,
  BuildingOfficeIcon,
  StarIcon,
  EyeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface JobAdPreviewProps {
  draft?: JobAdDraft;
  jobAd?: JobAd;
  companyName?: string;
  department?: string;
  featured?: boolean;
  channels?: PublishingChannel[];
  expiresAt?: Date;
  viewMode?: 'internal' | 'external';
  className?: string;
}

const JobAdPreview: React.FC<JobAdPreviewProps> = ({
  draft,
  jobAd,
  companyName = 'Your Company',
  department,
  featured = false,
  channels = [],
  expiresAt,
  viewMode = 'external',
  className = ''
}) => {
  // Use jobAd data if available, otherwise use draft data
  const data = jobAd || draft;
  
  if (!data) {
    return (
      <div className={`p-8 text-center text-gray-500 ${className}`}>
        No job data to preview
      </div>
    );
  }

  const isInternal = viewMode === 'internal';
  const salaryRange = formatSalaryRange(data.salaryRangeMin, data.salaryRangeMax);

  return (
    <div className={`bg-white ${className}`}>
      {/* Header with job basics */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{data.title}</h1>
              {featured && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                  <StarIcon className="w-3 h-3 mr-1" />
                  Featured
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                {companyName}
              </div>
              {department && (
                <div className="flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-1" />
                  {department}
                </div>
              )}
              <div className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                {data.location}
              </div>
              <div className="flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-1" />
                {data.employmentType}
              </div>
            </div>

            {/* Salary range */}
            <div className="text-lg font-semibold text-green-600 mb-3">
              {salaryRange}
            </div>

            {/* Publishing info for internal view */}
            {isInternal && (
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                {channels.length > 0 && (
                  <div className="flex items-center">
                    <EyeIcon className="w-3 h-3 mr-1" />
                    Published to: {channels.map(getChannelDisplayName).join(', ')}
                  </div>
                )}
                {expiresAt && (
                  <div className="flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    Expires: {new Date(expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Apply button */}
          <div className="ml-6">
            <button className="bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider px-6 py-3 rounded-full font-medium transition-colors">
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* Job content */}
      <div className="space-y-8">
        {/* Introduction */}
        {data.intro && (
          <div>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: data.intro }}
            />
          </div>
        )}

        {/* Responsibilities */}
        {data.responsibilities && (
          <div>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: data.responsibilities }}
            />
          </div>
        )}

        {/* Requirements */}
        {data.requirements && (
          <div>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: data.requirements }}
            />
          </div>
        )}

        {/* Benefits */}
        {data.benefits && (
          <div>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: data.benefits }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-gray-50 rounded-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Ready to Apply?</h3>
          <p className="text-gray-600 mb-4">
            Send your application to join our team and make an impact!
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <EnvelopeIcon className="w-4 h-4 mr-2" />
              <span>Send applications to: <strong>{data.contactEmail}</strong></span>
            </div>
            
            <button className="bg-transparent border-2 border-gold-500 text-violet-900 hover:bg-gold-500 hover:text-violet-950 uppercase tracking-wider px-6 py-2 rounded-full font-medium transition-colors">
              Apply Now
            </button>
          </div>

          {/* Application deadline */}
          {expiresAt && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center text-sm text-gray-500">
                <CalendarIcon className="w-4 h-4 mr-2" />
                <span>Application deadline: {new Date(expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Internal only: Analytics preview */}
      {isInternal && jobAd && (
        <div className="mt-6 p-4 bg-gold-50 rounded-sm">
          <h4 className="text-sm font-semibold text-violet-900 mb-2">Performance Metrics</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-violet-700">Views:</span>
              <span className="ml-2 font-medium">{jobAd.viewCount}</span>
            </div>
            <div>
              <span className="text-violet-700">Applications:</span>
              <span className="ml-2 font-medium">{jobAd.applicationCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAdPreview;