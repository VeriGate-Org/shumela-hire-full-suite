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

// --- Skill Gap Analysis ---

export interface SkillGapAiRequest {
  employeeName?: string;
  jobTitle?: string;
  department?: string;
  gaps: Array<{
    competencyName: string;
    category: string | null;
    currentLevel: number;
    targetLevel: number;
  }>;
}

export interface SkillGapAiResult {
  overallAssessment: string;
  priorityActions: string[];
  suggestedLearningPath: Array<{
    order: number;
    competency: string;
    activity: string;
    method: string;
    duration: string;
    rationale: string;
  }>;
  estimatedTimeframe: string;
  riskFactors: string[];
  strengths: string[];
}

// --- Smart Search ---

export interface SmartSearchResult {
  interpretedQuery: string;
  parsedFilters: Record<string, unknown>;
  results: Record<string, unknown>[];
  totalResults: number;
}

// --- Performance Review AI ---

export interface ReviewDraftRequest {
  employeeName: string;
  jobTitle: string;
  department: string;
  reviewPeriod: string;
  goals?: string[];
  achievements?: string[];
  feedbackSummaries?: string[];
  overallRating?: number;
  managerNotes?: string;
}

export interface ReviewDraftResult {
  narrative: string;
  strengthsSummary: string;
  developmentAreas: string;
  suggestedGoals: string[];
  overallAssessment: string;
  ratingJustification: string;
}

export interface FeedbackSummaryRequest {
  employeeName: string;
  feedbackEntries: Array<{
    respondentRole: string;
    ratings?: string;
    comments?: string;
    strengths?: string;
    improvements?: string;
  }>;
}

export interface FeedbackSummaryResult {
  executiveSummary: string;
  consensusStrengths: string[];
  consensusDevelopmentAreas: string[];
  blindSpots: string[];
  actionableRecommendations: string[];
  sentimentOverview: string;
}

export interface GoalSuggestionRequest {
  employeeName: string;
  jobTitle: string;
  department: string;
  competencyGaps?: string[];
  previousGoals?: string[];
  careerAspiration?: string;
}

export interface GoalSuggestionResult {
  goals: Array<{
    goal: string;
    category: string;
    measurableTarget: string;
    timeframe: string;
    rationale: string;
  }>;
}

// --- Training Learning Path AI ---

export interface LearningPathRequest {
  employeeName: string;
  currentRole: string;
  targetRole?: string;
  department: string;
  currentSkills?: string[];
  skillGaps?: string[];
  completedCourses?: string[];
  careerGoal?: string;
}

export interface LearningPathResult {
  summary: string;
  estimatedDuration: string;
  phases: Array<{
    phase: number;
    name: string;
    duration: string;
    activities: Array<{
      activity: string;
      type: string;
      provider: string;
      duration: string;
      skillAddressed: string;
    }>;
    milestone: string;
  }>;
  certificationRecommendations: string[];
  mentorshipSuggestions: string[];
  readinessAssessment: string;
}

export interface TrainingRoiRequest {
  courseName: string;
  enrollmentCount: number;
  completionCount: number;
  totalCost: number;
  preTrainingMetrics?: string[];
  postTrainingMetrics?: string[];
  department: string;
}

export interface TrainingRoiResult {
  roiSummary: string;
  estimatedRoiPercentage: number;
  keyFindings: string[];
  recommendations: string[];
  effectivenessRating: string;
}

// --- Attrition Risk AI ---

export interface AttritionAnalysisRequest {
  employeeName: string;
  jobTitle: string;
  department: string;
  tenureMonths: number;
  recentPerformanceRating: number;
  leaveDaysTaken: number;
  overtimeHoursLastQuarter: number;
  hadRecentPromotion: boolean;
  hadSalaryIncrease: boolean;
  salaryPercentile: number;
  trainingHoursLastYear: number;
  lastEngagementScore?: string;
  additionalFactors?: string[];
}

export interface AttritionAnalysisResult {
  riskScore: number;
  riskLevel: string;
  summary: string;
  riskFactors: string[];
  protectiveFactors: string[];
  retentionRecommendations: string[];
  predictedTimeframe: string;
  confidence: number;
}

export interface WorkforceAnalysisRequest {
  department: string;
  totalHeadcount: number;
  avgTenureMonths: number;
  turnoverRateLast12Months: number;
  openPositions: number;
  avgPerformanceRating: number;
  avgEngagementScore: number;
  recentDepartures?: string[];
}

export interface WorkforceAnalysisResult {
  overallHealthAssessment: string;
  keyRisks: string[];
  strengths: string[];
  hiringRecommendations: string[];
  retentionStrategies: string[];
  forecastSummary: string;
}

// --- Leave Analytics AI ---

export interface LeavePatternRequest {
  department: string;
  totalEmployees: number;
  leaveData: Array<{
    leaveType: string;
    totalDays: number;
    requestCount: number;
    month: string;
  }>;
  avgLeaveDaysPerEmployee: number;
  peakMonths?: string[];
  year: number;
}

export interface LeavePatternResult {
  overallAnalysis: string;
  patterns: string[];
  burnoutWarnings: string[];
  coverageRisks: string[];
  forecast: Array<{
    month: string;
    expectedLeaveLevel: string;
    recommendation: string;
  }>;
  policyRecommendations: string[];
  staffingRecommendations: string[];
}

// --- Attendance Anomaly AI ---

export interface AttendanceAnomalyRequest {
  department: string;
  records: Array<{
    employeeName: string;
    lateArrivals: number;
    earlyDepartures: number;
    absences: number;
    avgOvertimeHoursPerWeek: number;
    missedClockIns: number;
    shiftPattern: string;
  }>;
  periodDays: number;
}

export interface AttendanceAnomalyResult {
  overallAssessment: string;
  anomalies: Array<{
    employeeName: string;
    anomalyType: string;
    severity: string;
    description: string;
    suggestedAction: string;
  }>;
  fatigueWarnings: string[];
  policyViolations: string[];
  recommendations: string[];
}

// --- Engagement Sentiment AI ---

export interface SentimentAnalysisRequest {
  surveyName: string;
  surveyType: string;
  totalResponses: number;
  eNpsScore: number;
  responses: Array<{
    question: string;
    avgRating: number;
    freeTextResponses?: string[];
  }>;
}

export interface SentimentAnalysisResult {
  overallSentiment: string;
  sentimentScore: number;
  executiveSummary: string;
  keyThemes: string[];
  concerns: string[];
  positives: string[];
  actionItems: string[];
  eNpsTrendAnalysis: string;
  departmentBreakdown: Array<{
    department: string;
    sentiment: string;
    keyIssue: string;
  }>;
}

// --- HR General AI (Labour Relations, Onboarding, Payroll) ---

export interface CaseAnalysisRequest {
  caseType: string;
  description: string;
  employeeRole: string;
  department: string;
  previousActions?: string[];
  severity: string;
}

export interface CaseAnalysisResult {
  summary: string;
  recommendedSteps: string[];
  legalConsiderations: string[];
  riskAssessment: string;
  documentationRequired: string[];
  suggestedResolution: string;
}

export interface OnboardingPlanRequest {
  employeeName: string;
  jobTitle: string;
  department: string;
  startDate: string;
  experienceLevel: string;
  requiredCertifications?: string[];
}

export interface OnboardingPlanResult {
  welcomeMessage: string;
  weeklyPlan: Array<{
    week: number;
    theme: string;
    tasks: string[];
  }>;
  requiredTraining: string[];
  keyMeetings: string[];
  successMetrics: string[];
}

export interface PayrollAnomalyRequest {
  period: string;
  totalEmployees: number;
  entries: Array<{
    employeeName: string;
    grossPay: number;
    netPay: number;
    previousGrossPay: number;
    overtimePay: number;
    deductions: number;
    anomalyNotes?: string;
  }>;
}

export interface PayrollAnomalyResult {
  summary: string;
  flags: Array<{
    employeeName: string;
    flagType: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
}
