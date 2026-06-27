'use client';

import { useLookups as useLookupsContext } from '@/contexts/LookupsContext';
import type {
  LookupOption,
  ExperienceLevelOption,
  InterviewTypeOption,
  InterviewRoundOption,
  ApplicationSourceOption,
  SalaryCurrencyOption,
  SageSyncFrequencyOption,
  WorkflowTriggerOption,
  WorkflowActionTypeOption,
} from '@/types/lookups';

export function useEmploymentTypes(): { employmentTypes: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { employmentTypes: lookups.employmentTypes, loading: isLoading };
}

export function useExperienceLevels(): { experienceLevels: ExperienceLevelOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { experienceLevels: lookups.experienceLevels, loading: isLoading };
}

export function useInterviewTypes(): { interviewTypes: InterviewTypeOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { interviewTypes: lookups.interviewTypes, loading: isLoading };
}

export function useInterviewRounds(): { interviewRounds: InterviewRoundOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { interviewRounds: lookups.interviewRounds, loading: isLoading };
}

export function useApplicationStatuses(): { applicationStatuses: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { applicationStatuses: lookups.applicationStatuses, loading: isLoading };
}

export function usePositionLevels(): { positionLevels: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { positionLevels: lookups.positionLevels, loading: isLoading };
}

export function useApplicationSources(): { applicationSources: ApplicationSourceOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { applicationSources: lookups.applicationSources, loading: isLoading };
}

export function useSalaryCurrencies(): { salaryCurrencies: SalaryCurrencyOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { salaryCurrencies: lookups.salaryCurrencies, loading: isLoading };
}

export function useLeaveAccrualMethods(): { leaveAccrualMethods: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { leaveAccrualMethods: lookups.leaveAccrualMethods, loading: isLoading };
}

export function useSageEntityTypes(): { sageEntityTypes: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { sageEntityTypes: lookups.sageEntityTypes, loading: isLoading };
}

export function useSageSyncDirections(): { sageSyncDirections: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { sageSyncDirections: lookups.sageSyncDirections, loading: isLoading };
}

export function useSageSyncFrequencies(): { sageSyncFrequencies: SageSyncFrequencyOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { sageSyncFrequencies: lookups.sageSyncFrequencies, loading: isLoading };
}

export function useContactSubjects(): { contactSubjects: LookupOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { contactSubjects: lookups.contactSubjects, loading: isLoading };
}

export function useWorkflowTriggers(): { workflowTriggers: WorkflowTriggerOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { workflowTriggers: lookups.workflowTriggers, loading: isLoading };
}

export function useWorkflowActionTypes(): { workflowActionTypes: WorkflowActionTypeOption[]; loading: boolean } {
  const { lookups, isLoading } = useLookupsContext();
  return { workflowActionTypes: lookups.workflowActionTypes, loading: isLoading };
}
