export interface BackendJobAd {
  id: number;
  requisitionId?: number;
  title: string;
  htmlBody: string;
  channelInternal: boolean;
  channelExternal: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'EXPIRED';
  closingDate?: string;
  slug: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  department?: string;
  location?: string;
  employmentType?: string;
  salaryRangeMin?: number;
  salaryRangeMax?: number;
  companyName?: string;
}

export interface BackendApiResponse<T = BackendJobAd> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface BackendPagedResponse {
  content: BackendJobAd[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
}
