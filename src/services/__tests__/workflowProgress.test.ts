import { getWorkflowProgress } from '../workflowDefinition';
import { RequisitionStatus } from '@/types/workflow';

/**
 * The progress figure on a requisition drives WorkflowStatusBadge, which appears on the
 * requisition detail page and on every row of the requisitions list. It was weighted against a
 * seven-state ladder while the backend enum has six, and it treated rejection as completion.
 */
describe('getWorkflowProgress', () => {
  it('runs from nothing to complete across the stages that actually exist', () => {
    expect(getWorkflowProgress(RequisitionStatus.DRAFT)).toBe(0);
    expect(getWorkflowProgress(RequisitionStatus.SUBMITTED)).toBe(25);
    expect(getWorkflowProgress(RequisitionStatus.PENDING_HR_APPROVAL)).toBe(50);
    expect(getWorkflowProgress(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL)).toBe(75);
    expect(getWorkflowProgress(RequisitionStatus.APPROVED)).toBe(100);
  });

  it('does not reserve a third of the bar for a stage the backend cannot reach', () => {
    // PENDING_HIRING_MANAGER_APPROVAL is in the frontend enum only; the backend
    // RequisitionStatus has six values and never routes to a hiring-manager stage. It previously
    // held the 50 slot, pushing HR approval down to 33.
    expect(getWorkflowProgress(RequisitionStatus.PENDING_HR_APPROVAL)).toBeGreaterThan(33);
  });

  it('a requisition awaiting its only approval is half way, not a third', () => {
    // Below the delegation threshold HR is the entire chain, so awaiting HR is genuinely the
    // midpoint between raised and approved.
    const awaitingHr = getWorkflowProgress(RequisitionStatus.PENDING_HR_APPROVAL);

    expect(awaitingHr).toBe(50);
    expect(awaitingHr).toBeLessThan(getWorkflowProgress(RequisitionStatus.APPROVED));
  });

  it('rejection is an end, not an achievement', () => {
    // This was weighted 100, so a rejected requisition rendered a full bar and read as complete
    // — identical to an approved one at a glance.
    expect(getWorkflowProgress(RequisitionStatus.REJECTED)).toBe(0);
    expect(getWorkflowProgress(RequisitionStatus.REJECTED))
      .not.toBe(getWorkflowProgress(RequisitionStatus.APPROVED));
  });

  it('progress only ever increases through the approval chain', () => {
    const chain = [
      RequisitionStatus.DRAFT,
      RequisitionStatus.SUBMITTED,
      RequisitionStatus.PENDING_HR_APPROVAL,
      RequisitionStatus.PENDING_EXECUTIVE_APPROVAL,
      RequisitionStatus.APPROVED,
    ];

    const values = chain.map(getWorkflowProgress);

    expect(values).toEqual([...values].sort((a, b) => a - b));
    expect(new Set(values).size).toBe(values.length);
  });

  it('an unknown status is zero rather than undefined', () => {
    expect(getWorkflowProgress('SOMETHING_ELSE' as RequisitionStatus)).toBe(0);
  });
});
