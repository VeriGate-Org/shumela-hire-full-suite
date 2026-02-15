export enum JobAdStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  EXPIRED = 'EXPIRED',
  UNPUBLISHED = 'UNPUBLISHED'
}

export enum PublishingChannel {
  INTERNAL = 'internal',
  EXTERNAL = 'external'
}

export interface JobAd {
  id: string;
  draftId?: string; // Reference to the original draft
  templateId?: string;
  requisitionId?: string;
  title: string;
  intro: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  location: string;
  employmentType: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  contactEmail: string;
  
  // Publishing specific fields
  status: JobAdStatus;
  channels: PublishingChannel[];
  publishedAt?: Date;
  expiresAt: Date;
  slug: string; // URL-friendly slug for public access
  
  // SEO and display
  companyName: string;
  department?: string;
  featured?: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  publishedBy?: string;
  
  // Analytics
  viewCount: number;
  applicationCount: number;
  
  // Audit trail
  publishingHistory: PublishingHistoryEntry[];
}

export interface PublishingHistoryEntry {
  id: string;
  jobAdId: string;
  action: 'PUBLISHED' | 'UNPUBLISHED' | 'EXPIRED' | 'UPDATED';
  channels?: PublishingChannel[];
  performedBy: string;
  performedAt: Date;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface PublishingRequest {
  draftId: string;
  channels: PublishingChannel[];
  expiresAt: Date;
  companyName: string;
  department?: string;
  featured?: boolean;
  customSlug?: string;
}

export interface PublishingWizardStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface JobAdFilters {
  status?: JobAdStatus;
  channels?: PublishingChannel[];
  location?: string;
  employmentType?: string;
  department?: string;
  featured?: boolean;
  search?: string;
  expiresAfter?: Date;
  expiresBefore?: Date;
}

export interface JobAdStats {
  totalAds: number;
  publishedAds: number;
  expiredAds: number;
  totalViews: number;
  totalApplications: number;
  internalAds: number;
  externalAds: number;
  featuredAds: number;
  averageViewsPerAd: number;
  conversionRate: number; // applications / views
}

export interface JobApplication {
  id: string;
  jobAdId: string;
  applicantName: string;
  applicantEmail: string;
  resumeUrl?: string;
  coverLetter?: string;
  appliedAt: Date;
  source: 'internal' | 'external';
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'hired';
}

// Utility functions
export const generateSlug = (title: string, id?: string): string => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return id ? `${baseSlug}-${id.slice(-6)}` : baseSlug;
};

export const isJobAdExpired = (jobAd: JobAd): boolean => {
  return new Date() > new Date(jobAd.expiresAt);
};

export const isJobAdActive = (jobAd: JobAd): boolean => {
  return jobAd.status === JobAdStatus.PUBLISHED && !isJobAdExpired(jobAd);
};

export const formatSalaryRange = (min?: number, max?: number): string => {
  if (!min && !max) return 'Salary not specified';
  if (min && max) return `R${min.toLocaleString()} - R${max.toLocaleString()}`;
  if (min) return `R${min.toLocaleString()}+`;
  if (max) return `Up to R${max.toLocaleString()}`;
  return 'Salary not specified';
};

export const getJobAdUrl = (jobAd: JobAd, channel: PublishingChannel): string => {
  if (channel === PublishingChannel.INTERNAL) {
    return `/jobs/internal/${jobAd.id}`;
  }
  return `/jobs/${jobAd.slug}`;
};

export const getChannelDisplayName = (channel: PublishingChannel): string => {
  switch (channel) {
    case PublishingChannel.INTERNAL:
      return 'Internal Portal';
    case PublishingChannel.EXTERNAL:
      return 'Public Website';
    default:
      return channel;
  }
};

export const getStatusDisplayName = (status: JobAdStatus): string => {
  switch (status) {
    case JobAdStatus.DRAFT:
      return 'Draft';
    case JobAdStatus.PUBLISHED:
      return 'Published';
    case JobAdStatus.EXPIRED:
      return 'Expired';
    case JobAdStatus.UNPUBLISHED:
      return 'Unpublished';
    default:
      return status;
  }
};

export const getStatusColor = (status: JobAdStatus): string => {
  switch (status) {
    case JobAdStatus.DRAFT:
      return 'bg-gray-100 text-gray-800';
    case JobAdStatus.PUBLISHED:
      return 'bg-green-100 text-green-800';
    case JobAdStatus.EXPIRED:
      return 'bg-red-100 text-red-800';
    case JobAdStatus.UNPUBLISHED:
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Default publishing settings
export const DEFAULT_PUBLISHING_SETTINGS = {
  defaultExpiryDays: 30,
  maxExpiryDays: 90,
  minExpiryDays: 1,
  allowCustomSlugs: true,
  autoGenerateSlugs: true,
  requireApprovalForExternal: false,
  enableAnalytics: true
};

// Publishing wizard steps
export const PUBLISHING_WIZARD_STEPS: Omit<PublishingWizardStep, 'completed' | 'current'>[] = [
  {
    id: 'details',
    title: 'Job Details',
    description: 'Review and edit job information'
  },
  {
    id: 'targeting',
    title: 'Publishing Channels',
    description: 'Choose where to publish this job'
  },
  {
    id: 'preview',
    title: 'Preview',
    description: 'Review how your job will appear'
  },
  {
    id: 'publish',
    title: 'Publish',
    description: 'Make your job live'
  }
];