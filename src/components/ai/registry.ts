/**
 * Every AI feature in the platform, in one place.
 *
 * <p><b>This exists because a hand-assembled list had already drifted before it was built.</b> The
 * AI Tools design named ten features, four of them high-risk. There are twelve, five of them
 * high-risk — it missed `AiCandidateSummary` and `AiScreeningNotesDrafter` entirely. A page
 * whose whole purpose is answering "what is the AI deciding about our candidates, and where" cannot
 * be allowed to answer incompletely, and nothing in the code stopped it.
 *
 * <p><b>Completeness is enforced, not promised.</b> `registry.test.ts` scans
 * `src/components/ai/*.tsx` for the disclaimer level each component declares and fails if any of
 * them is missing here, or if its risk level disagrees. Adding a thirteenth feature without
 * registering it breaks the build rather than quietly shrinking this page.
 *
 * <p>The alternative — deriving the list at runtime — is not available: each feature declares its
 * own flag string at its call site and nothing enumerates them, so there is nothing to read. A
 * checked list is the next best thing.
 */

/**
 * How much weight a feature's output carries in a decision about a person.
 *
 * <p>Not a judgement made here. It is read from the `level` each component passes to
 * `AiDisclaimer`, which is a safety decision somebody already made deliberately — and which
 * was visible only after opening a tool, i.e. after it had been used.
 */
export type AiRiskLevel = 'high-risk' | 'advisory';

export interface AiFeature {
  /** Stable key for this page. Not a backend identifier. */
  id: string;
  /** The component that renders it, matched against the filesystem by the registry test. */
  component: string;
  /** The feature-flag string its call site declares. */
  flag: string;
  label: string;
  /**
   * What the feature does, in the plain terms a candidate would recognise.
   *
   * <p>Deliberately not the product's own subtitles, which are marketing register — "Natural
   * language candidate discovery", "Market-aligned compensation insights". For a high-risk feature
   * the card has to say what the thing does to a person.
   */
  description: string;
  level: AiRiskLevel;
  /** Where it actually runs. For most of these the answer is a screen elsewhere. */
  runsIn: string[];
  /**
   * Whether it can be opened from the AI Tools page itself.
   *
   * <p>False means it only appears inside another screen — which is true of most of them, and the
   * reason a launcher listing only the runnable ones implies a completeness it does not have.
   */
  launchable: boolean;
}

export const AI_FEATURES: AiFeature[] = [
  {
    id: 'candidate-ranking',
    component: 'AiCandidateRanking',
    flag: 'AI_SCREENING_RANKING',
    label: 'Candidate ranking',
    description:
      'Puts candidates for a vacancy in an order. Whoever it ranks first is looked at first.',
    level: 'high-risk',
    runsIn: ['Pipeline board'],
    launchable: false,
  },
  {
    id: 'candidate-summary',
    component: 'AiCandidateSummary',
    flag: 'AI_SCREENING_SUMMARY',
    label: 'Candidate summary',
    description:
      "Writes the summary of a candidate that a recruiter reads instead of the application itself.",
    level: 'high-risk',
    runsIn: ['Pipeline board', 'Applications'],
    launchable: false,
  },
  {
    id: 'cv-screening',
    component: 'AiCvScreeningPanel',
    flag: 'AI_SCREENING_CV',
    label: 'CV screening',
    description:
      'Reads an attached CV and judges how well the person fits the role.',
    level: 'high-risk',
    runsIn: ['Pipeline board', 'Applications'],
    launchable: false,
  },
  {
    id: 'duplicate-detection',
    component: 'AiDuplicateDetectionPanel',
    flag: 'AI_DUPLICATE_DETECTION',
    label: 'Duplicate detection',
    description:
      'Decides that two applicant records are probably the same person, which can merge their history.',
    level: 'high-risk',
    runsIn: ['Applicant profile'],
    launchable: false,
  },
  {
    id: 'offer-prediction',
    component: 'AiOfferPrediction',
    flag: 'AI_OFFER_PREDICTION',
    label: 'Offer prediction',
    description:
      'Estimates whether a candidate would accept a given offer, before one is made to them.',
    level: 'high-risk',
    runsIn: ['Pipeline board', 'Offers'],
    launchable: false,
  },
  {
    id: 'screening-notes',
    component: 'AiScreeningNotesDrafter',
    flag: 'AI_SCREENING_NOTES',
    label: 'Screening notes',
    description:
      'Drafts the screening notes recorded against a candidate. A person edits them before they are saved.',
    level: 'advisory',
    runsIn: ['Pipeline board', 'Applications'],
    launchable: false,
  },
  {
    id: 'email-drafter',
    component: 'AiEmailDrafter',
    flag: 'AI_EMAIL_DRAFTER',
    label: 'Email drafter',
    description:
      'Drafts offer, negotiation and regret letters for a named candidate. Nothing is sent without a person sending it.',
    level: 'advisory',
    runsIn: ['AI Tools', 'Candidate panel'],
    launchable: true,
  },
  {
    id: 'smart-search',
    component: 'AiSmartSearch',
    flag: 'AI_SEARCH',
    label: 'Smart search',
    description:
      'Finds candidates from a description in plain language instead of a filter. It searches the candidate base.',
    level: 'advisory',
    runsIn: ['AI Tools', 'Talent pools'],
    launchable: true,
  },
  {
    id: 'job-description',
    component: 'AiJobDescriptionWriter',
    flag: 'AI_JOB_DESCRIPTION',
    label: 'Job description writer',
    description:
      'Writes an advert body from a requisition, with inclusive-language checks.',
    level: 'advisory',
    runsIn: ['AI Tools', 'Job templates'],
    launchable: true,
  },
  {
    id: 'salary-benchmark',
    component: 'AiSalaryBenchmark',
    flag: 'AI_SALARY_BENCHMARK',
    label: 'Salary benchmark',
    description:
      'Compares a role against market pay data, to support a salary recommendation a person still makes.',
    level: 'advisory',
    runsIn: ['AI Tools', 'Salary recommendations'],
    launchable: true,
  },
  {
    id: 'interview-questions',
    component: 'AiInterviewQuestionGenerator',
    flag: 'AI_INTERVIEW_QUESTIONS',
    label: 'Interview questions',
    description:
      "Suggests questions for a scheduled interview, from the role and the candidate's CV.",
    level: 'advisory',
    runsIn: ['Interviews'],
    launchable: false,
  },
  {
    id: 'report-narrative',
    component: 'AiReportNarrative',
    flag: 'AI_REPORT_NARRATIVE',
    label: 'Report narrative',
    description: 'Writes a plain-language summary of an analytics report.',
    level: 'advisory',
    runsIn: ['Reports'],
    launchable: false,
  },
];

/**
 * Components that render an {@code AiDisclaimer} but are not themselves a feature.
 *
 * <p>{@code AiAssistPanel} is a wrapper, {@code AiCandidatePanel} groups four features, and
 * {@code AiDisclaimer} is the disclaimer. Listed so the registry test can tell "not a feature" from
 * "somebody forgot to register it" — an exclusion list nobody maintains is how the next one slips
 * through.
 */
export const NOT_FEATURES = ['AiAssistPanel', 'AiCandidatePanel', 'AiDisclaimer'];

export function highRiskFeatures(): AiFeature[] {
  return AI_FEATURES.filter((f) => f.level === 'high-risk');
}

export function launchableFeatures(): AiFeature[] {
  return AI_FEATURES.filter((f) => f.launchable);
}

/** Features that only appear inside another screen — most of them, and all but one high-risk one. */
export function embeddedFeatures(): AiFeature[] {
  return AI_FEATURES.filter((f) => !f.launchable);
}

/**
 * How many of these are switched on, given the flag state.
 *
 * <p>Returns null rather than zero when the flag state has not loaded. "None are enabled" and "we
 * do not yet know" are different answers, and only one of them is worth showing an operator.
 */
export function enabledCount(
  isEnabled: ((flag: string) => boolean) | null,
): number | null {
  if (!isEnabled) return null;
  return AI_FEATURES.filter((f) => isEnabled(f.flag)).length;
}
