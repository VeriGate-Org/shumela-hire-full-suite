// --- Shared AI types ---

export interface AiGenerationResult<T> {
  content: T;
  provider: string;
  model: string;
  generatedAt: string;
}

export interface AiFeatureStatus {
  enabled: boolean;
  provider: string;
  available: boolean;
}

// --- Job Description ---

export interface JobDescriptionRequest {
  title: string;
  department: string;
  level: string;
  employmentType: string;
  location: string;
  keyResponsibilities: string[];
  keyRequirements: string[];
}

export interface JobDescriptionResult {
  title: string;
  intro: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  biasWarnings: string[];
}

export interface BiasCheckResult {
  biasWarnings: string[];
  overallAssessment: string;
}

// --- Screening Notes ---

export interface ScreeningNotesRequest {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  bulletPoints: string[];
  tone: 'formal' | 'neutral' | 'concise';
}

export interface ScreeningNotesResult {
  draftNotes: string;
}

// --- Email Drafting ---

export type EmailType = 'REJECTION' | 'INTERVIEW_INVITATION' | 'OFFER' | 'FOLLOW_UP';

export interface EmailDraftRequest {
  emailType: EmailType;
  candidateName: string;
  jobTitle: string;
  context: Record<string, string>;
  tone: 'formal' | 'friendly' | 'concise';
}

export interface EmailDraftResult {
  subject: string;
  body: string;
}

// --- Interview Questions ---

export type InterviewType = 'TECHNICAL' | 'BEHAVIORAL' | 'COMPETENCY' | 'PANEL' | 'CASE_STUDY';

export interface InterviewQuestionRequest {
  jobTitle: string;
  jobRequirements: string[];
  interviewType: InterviewType;
  candidateExperience: string;
  candidateSkills: string[];
  questionCount: number;
  level: string;
}

export interface GeneratedQuestion {
  question: string;
  category: string;
  expectedAnswer: string;
  difficulty: string;
}

export interface InterviewQuestionsResult {
  questions: GeneratedQuestion[];
}

// --- CV Screening ---

export interface CvScreeningResult {
  overallScore: number;
  skillsMatchScore: number;
  experienceMatchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  strengths: string[];
  concerns: string[];
  summary: string;
  scoringMethodology?: string;
  confidenceInterval?: { low: number; high: number };
  weightBreakdown?: Array<{ factor: string; weight: number; score: number; explanation: string }>;
}

export interface CvRankingEntry {
  applicationId: string;
  candidateName: string;
  rank: number;
  overallScore: number;
  quickSummary: string;
  scoringFactors?: Array<{ factor: string; contribution: number }>;
}

// --- Candidate Summary ---

export interface CandidateSummaryResult {
  executiveSummary: string;
  educationSummary: string;
  experienceSummary: string;
  keyStrengths: string[];
  potentialGaps: string[];
  fitAssessment: string;
}

// --- Duplicate Detection ---

export interface DuplicateCheckRequest {
  fullName: string;
  email: string;
  phone: string;
  idNumber: string;
}

export interface DuplicateCandidate {
  applicantId: string;
  fullName: string;
  email: string;
  confidenceScore: number;
  matchReason: string;
}

// --- Salary Benchmark ---

export interface SalaryBenchmarkRequest {
  positionTitle: string;
  department: string;
  jobGrade: string;
  level: string;
  location: string;
  candidateCurrentSalary?: number;
  candidateExpectedSalary?: number;
}

export interface SalaryBenchmarkResult {
  suggestedMin: number;
  suggestedMax: number;
  suggestedTarget: number;
  currency: string;
  justification: string;
  marketFactors: string[];
  dataPointsUsed: number;
}

// --- Offer Prediction ---

export interface OfferPredictionRequest {
  applicationId: string;
  proposedSalary: number;
  additionalBenefits: string[];
}

export interface OfferPredictionResult {
  acceptanceProbability: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  positiveFactors: string[];
  riskFactors: string[];
  recommendations: string[];
}

// --- Report Narrative ---

export interface ReportNarrativeRequest {
  reportType: string;
  jobId?: string;
  reportData: Record<string, unknown>;
  audience: 'executive' | 'hr' | 'hiring_manager';
  tone: 'formal' | 'concise' | 'detailed';
}

export interface ReportNarrativeResult {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
}

// --- Smart Search ---

export interface SmartSearchResult {
  interpretedQuery: string;
  parsedFilters: Record<string, unknown>;
  results: Record<string, unknown>[];
  totalResults: number;
}
