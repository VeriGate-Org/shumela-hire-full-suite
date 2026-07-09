export interface ShortlistApplicant {
  id: string | number;
  name: string;
  surname: string;
  email: string;
}

export interface ShortlistApplication {
  id: string | number;
  applicant: ShortlistApplicant;
  status: string;
  jobTitle: string;
  submittedAt: string;
  rating: number | null;
}

export interface ShortlistScore {
  id: string | number;
  application: ShortlistApplication;
  totalScore: number;
  skillsMatchScore: number;
  experienceScore: number;
  educationScore: number;
  screeningScore: number;
  keywordMatchScore: number;
  scoreBreakdown: string | null;
  isShortlisted: boolean;
  manuallyOverridden: boolean;
  overrideReason: string | null;
  createdAt: string;
}

export interface ShortlistingSummary {
  totalCandidates: number;
  shortlisted: number;
  notShortlisted: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export interface ShortlistOverrideRequest {
  include: boolean;
  reason: string;
  userId: string | null;
}
