export enum JobBoardType {
  LINKEDIN = 'LINKEDIN',
  INDEED = 'INDEED',
  PNET = 'PNET',
  CAREER_JUNCTION = 'CAREER_JUNCTION',
  CUSTOM = 'CUSTOM',
}

export enum PostingStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED',
  REMOVED = 'REMOVED',
}

export interface JobBoardPosting {
  id: number;
  jobPostingId: string;
  boardType: JobBoardType;
  status: PostingStatus;
  externalPostId?: string;
  externalUrl?: string;
  postedAt?: string;
  expiresAt?: string;
  viewCount: number;
  clickCount: number;
  applicationCount: number;
  errorMessage?: string;
  boardConfig?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableBoard {
  type: string;
  displayName: string;
  requiresApiIntegration: boolean;
}

export function getBoardDisplayName(type: JobBoardType): string {
  switch (type) {
    case JobBoardType.LINKEDIN: return 'LinkedIn';
    case JobBoardType.INDEED: return 'Indeed';
    case JobBoardType.PNET: return 'PNet';
    case JobBoardType.CAREER_JUNCTION: return 'CareerJunction';
    case JobBoardType.CUSTOM: return 'Custom';
    default: return type;
  }
}

export function getPostingStatusColor(status: PostingStatus): string {
  switch (status) {
    case PostingStatus.DRAFT: return 'bg-gray-100 text-gray-800';
    case PostingStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
    case PostingStatus.POSTED: return 'bg-green-100 text-green-800';
    case PostingStatus.EXPIRED: return 'bg-orange-100 text-orange-800';
    case PostingStatus.FAILED: return 'bg-red-100 text-red-800';
    case PostingStatus.REMOVED: return 'bg-gray-100 text-gray-500';
    default: return 'bg-gray-100 text-gray-800';
  }
}
