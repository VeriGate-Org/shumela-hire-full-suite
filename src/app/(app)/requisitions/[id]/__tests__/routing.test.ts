import { buildStages, daysBetween, decisionFor, isRouting, stageLabel, RequisitionRouting } from '../routing';
import { RequisitionData, RequisitionStatus } from '@/types/workflow';
import { ApprovalStep } from '@/components/ApprovalTimeline';

const NOW = new Date('2026-08-24T12:00:00Z');

function requisition(overrides: Partial<RequisitionData> = {}): RequisitionData {
  return {
    id: 'req-1',
    jobTitle: 'Risk Manager',
    department: 'Enterprise Risk Management',
    location: 'Sandton',
    employmentType: 'FULL_TIME',
    description: 'Replaces M. Pillay.',
    status: RequisitionStatus.PENDING_HR_APPROVAL,
    createdBy: 'user-1',
    createdAt: new Date('2026-08-13T09:00:00Z'),
    updatedAt: new Date('2026-08-20T09:00:00Z'),
    approvalHistory: [],
    ...overrides,
  } as RequisitionData;
}

const HR_ONLY: RequisitionRouting = {
  chain: ['HR_MANAGER'],
  rationale: 'Band ceiling 800000 is within the 1000000 HR delegation — HR approval only.',
  escalated: false,
  measuredValue: 800000,
  currentStage: 'HR_MANAGER',
};

const ESCALATED: RequisitionRouting = {
  chain: ['HR_MANAGER', 'EXECUTIVE'],
  rationale: 'Band ceiling 1100000 exceeds the 1000000 executive threshold — executive approval required.',
  escalated: true,
  measuredValue: 1100000,
  currentStage: 'EXECUTIVE',
};

describe('stageLabel', () => {
  it('says what a person would say', () => {
    expect(stageLabel('HR_MANAGER')).toBe('HR Manager');
    expect(stageLabel('EXECUTIVE')).toBe('Executive');
  });

  it('passes an unknown stage through rather than blanking it', () => {
    // A new stage added server-side must still render, even before this map knows about it.
    expect(stageLabel('BOARD')).toBe('BOARD');
  });
});

describe('daysBetween', () => {
  it('counts whole days', () => {
    expect(daysBetween('2026-08-14T12:00:00Z', NOW)).toBe(10);
  });

  it('is undefined rather than zero when there is no date', () => {
    expect(daysBetween(undefined, NOW)).toBeUndefined();
    expect(daysBetween(null, NOW)).toBeUndefined();
  });

  it('never goes negative for a future timestamp', () => {
    expect(daysBetween('2026-09-01T12:00:00Z', NOW)).toBe(0);
  });

  it('is undefined for an unparseable date rather than NaN', () => {
    expect(daysBetween('not a date', NOW)).toBeUndefined();
  });
});

describe('buildStages', () => {
  it('renders a two-stage chain for a requisition inside the delegation', () => {
    const stages = buildStages(requisition(), HR_ONLY, [], NOW);

    // Raised, HR Manager, Approved — no executive stage invented.
    expect(stages.map((s) => s.name)).toEqual(['Raised', 'HR Manager', 'Approved']);
  });

  it('renders a three-stage chain when the band pushed it up', () => {
    const stages = buildStages(
      requisition({ status: RequisitionStatus.PENDING_EXECUTIVE_APPROVAL }),
      ESCALATED,
      [],
      NOW
    );

    expect(stages.map((s) => s.name)).toEqual(['Raised', 'HR Manager', 'Executive', 'Approved']);
  });

  it('marks the awaited stage as current and gives it the wait in days', () => {
    const stages = buildStages(requisition(), HR_ONLY, [], NOW);
    const hr = stages.find((s) => s.name === 'HR Manager');

    expect(hr?.state).toBe('current');
    expect(hr?.days).toBe(4); // 20 Aug → 24 Aug
  });

  it('shows who approved a completed stage', () => {
    const steps: ApprovalStep[] = [
      { role: 'HR_MANAGER', approverName: 'Thandeka Mabaso', status: 'approved', timestamp: '2026-08-20T09:00:00Z' },
    ];
    const stages = buildStages(
      requisition({ status: RequisitionStatus.PENDING_EXECUTIVE_APPROVAL }),
      ESCALATED,
      steps,
      NOW
    );
    const hr = stages.find((s) => s.name === 'HR Manager');

    expect(hr?.state).toBe('done');
    expect(hr?.actor).toBe('Thandeka Mabaso');
  });

  it('stops the rail at the stage that rejected it', () => {
    const steps: ApprovalStep[] = [
      { role: 'HR_MANAGER', approverName: 'Thandeka Mabaso', status: 'rejected', timestamp: '2026-08-22T09:00:00Z' },
    ];
    const stages = buildStages(
      requisition({ status: RequisitionStatus.REJECTED }),
      HR_ONLY,
      steps,
      NOW
    );

    expect(stages.find((s) => s.name === 'HR Manager')?.state).toBe('stopped');
    // The terminal stage says rejected rather than showing an unreached "Approved".
    expect(stages[stages.length - 1].name).toBe('Rejected');
  });

  it('marks the outcome done once the requisition is approved', () => {
    const steps: ApprovalStep[] = [
      { role: 'HR_MANAGER', approverName: 'Thandeka Mabaso', status: 'approved', timestamp: '2026-08-21T09:00:00Z' },
    ];
    const stages = buildStages(requisition({ status: RequisitionStatus.APPROVED }), HR_ONLY, steps, NOW);

    expect(stages[stages.length - 1]).toMatchObject({ name: 'Approved', state: 'done' });
  });

  it('falls back to the approval history when routing is unavailable', () => {
    // The routing endpoint failing must not blank the rail, and must not invent a chain either.
    const steps: ApprovalStep[] = [
      { role: 'HR_MANAGER', approverName: 'Thandeka Mabaso', status: 'approved', timestamp: '2026-08-20T09:00:00Z' },
    ];
    const stages = buildStages(requisition(), null, steps, NOW);

    expect(stages.map((s) => s.name)).toEqual(['Raised', 'HR Manager', 'Approved']);
  });

  it('always opens with Raised, dated from when the requisition was created', () => {
    const stages = buildStages(requisition(), HR_ONLY, [], NOW);

    expect(stages[0]).toMatchObject({ name: 'Raised', state: 'done' });
    expect(stages[0].days).toBe(11); // 13 Aug → 24 Aug, nothing has been decided
  });
});

describe('decisionFor', () => {
  it('names the stage that is waiting, and how long', () => {
    const { ask, tone } = decisionFor(requisition(), HR_ONLY, 4);

    expect(ask).toContain('HR Manager');
    expect(ask).toContain('4 days');
    expect(tone).toBe('owed');
  });

  it('uses the singular for one day', () => {
    expect(decisionFor(requisition(), HR_ONLY, 1).ask).toContain('1 day.');
  });

  it('omits the wait entirely when it is not known', () => {
    const { ask } = decisionFor(requisition(), HR_ONLY, undefined);

    expect(ask).not.toContain('undefined');
    expect(ask).not.toContain('NaN');
    expect(ask).not.toContain('waiting 0');
  });

  it('reads as settled once approved, and stopped once rejected', () => {
    expect(decisionFor(requisition({ status: RequisitionStatus.APPROVED }), HR_ONLY).tone).toBe('settled');
    expect(decisionFor(requisition({ status: RequisitionStatus.REJECTED }), HR_ONLY).tone).toBe('stopped');
  });

  it('tells a draft it has not been submitted', () => {
    const { ask } = decisionFor(requisition({ status: RequisitionStatus.DRAFT }), null);

    expect(ask).toContain('not been submitted');
  });
});

describe('isRouting', () => {
  it('accepts a well-formed routing response', () => {
    expect(isRouting(HR_ONLY)).toBe(true);
    expect(isRouting(ESCALATED)).toBe(true);
  });

  it('rejects a requisition returned where routing was expected', () => {
    // Exactly what a catch-all proxy rule produces: /requisitions/{id}/routing answered with the
    // requisition. Reaching the strip with no chain threw on chain.map and took down a page whose
    // own record had loaded perfectly.
    expect(isRouting({ id: 'r1', jobTitle: 'Risk Manager', status: 'APPROVED' })).toBe(false);
  });

  it('rejects an empty or malformed chain', () => {
    expect(isRouting({ chain: [], rationale: 'x' })).toBe(false);
    expect(isRouting({ chain: 'HR_MANAGER', rationale: 'x' })).toBe(false);
    expect(isRouting({ chain: [1, 2], rationale: 'x' })).toBe(false);
  });

  it('rejects a chain with no explanation, since the strip exists to explain', () => {
    expect(isRouting({ chain: ['HR_MANAGER'] })).toBe(false);
    expect(isRouting({ chain: ['HR_MANAGER'], rationale: '' })).toBe(false);
  });

  it('rejects nothing at all', () => {
    expect(isRouting(null)).toBe(false);
    expect(isRouting(undefined)).toBe(false);
    expect(isRouting('routing')).toBe(false);
  });
});
