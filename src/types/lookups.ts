export interface LookupOption {
  value: string;
  label: string;
  description?: string;
  cssClass?: string;
  icon?: string;
}

export interface ExperienceLevelOption extends LookupOption {
  minYears: number;
  maxYears: number;
}

export interface InterviewTypeOption extends LookupOption {
  isRemote: boolean;
  requiresLocation: boolean;
}

export interface InterviewRoundOption extends LookupOption {
  order: number;
}

export interface ApplicationSourceOption extends LookupOption {
  category: 'FORM' | 'REPORT' | 'BOTH';
}

export interface SalaryCurrencyOption extends LookupOption {
  code: string;
}

export interface SageSyncFrequencyOption extends LookupOption {
  cronExpression: string;
}

export interface WorkflowCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: unknown;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowTriggerOption {
  id: string;
  type: 'application_received' | 'interview_scheduled' | 'interview_completed' | 'offer_extended' | 'offer_accepted' | 'manual' | 'scheduled';
  name: string;
  description: string;
  conditions?: WorkflowCondition[];
}

export interface WorkflowActionTypeOption {
  type: string;
  name: string;
  description: string;
  icon: string;
  config: Record<string, { type: string; label: string; required: boolean }>;
}

export interface LookupsData {
  employmentTypes: LookupOption[];
  experienceLevels: ExperienceLevelOption[];
  interviewTypes: InterviewTypeOption[];
  interviewRounds: InterviewRoundOption[];
  applicationStatuses: LookupOption[];
  positionLevels: LookupOption[];
  applicationSources: ApplicationSourceOption[];
  salaryCurrencies: SalaryCurrencyOption[];
  leaveAccrualMethods: LookupOption[];
  sageEntityTypes: LookupOption[];
  sageSyncDirections: LookupOption[];
  sageSyncFrequencies: SageSyncFrequencyOption[];
  contactSubjects: LookupOption[];
  workflowTriggers: WorkflowTriggerOption[];
  workflowActionTypes: WorkflowActionTypeOption[];
}
