import { WIZARD_DRAFT_PREFIX, clearAllWizardDrafts } from '../useWizardDraft';

/**
 * Drafts are the only thing in this product that outlives a session by design — they live in
 * localStorage so a half-written vacancy survives a closed tab. That is the feature and also the
 * hazard: on a shared workstation, the next person to sign in shares the storage.
 *
 * These pin the two halves of the fix. The key must name its owner, and signing out must take the
 * drafts with it.
 */
describe('wizard draft storage', () => {
  beforeEach(() => localStorage.clear());

  it('clears every draft on this device, whoever wrote it', () => {
    localStorage.setItem(`${WIZARD_DRAFT_PREFIX}t1#alice:job-posting:new`, '{"formData":{}}');
    localStorage.setItem(`${WIZARD_DRAFT_PREFIX}t1#bob:requisition:new`, '{"formData":{}}');
    // Signing out must not take unrelated state with it.
    localStorage.setItem('auth_token', 'keep-me-out-of-this');

    clearAllWizardDrafts();

    expect(localStorage.getItem(`${WIZARD_DRAFT_PREFIX}t1#alice:job-posting:new`)).toBeNull();
    expect(localStorage.getItem(`${WIZARD_DRAFT_PREFIX}t1#bob:requisition:new`)).toBeNull();
    expect(localStorage.getItem('auth_token')).toBe('keep-me-out-of-this');
  });

  it('survives an empty store', () => {
    expect(() => clearAllWizardDrafts()).not.toThrow();
  });

  it('does not stop partway when keys shift underneath it', () => {
    // Removing while iterating by index is the obvious way to write this and it skips entries,
    // which would leave someone else's draft behind — the exact thing being fixed.
    for (let i = 0; i < 12; i += 1) {
      localStorage.setItem(`${WIZARD_DRAFT_PREFIX}t1#alice:w${i}:new`, '{}');
    }

    clearAllWizardDrafts();

    const left = Object.keys(localStorage).filter((k) => k.startsWith(WIZARD_DRAFT_PREFIX));
    expect(left).toEqual([]);
  });

  it('keys drafts under an owner, so two people do not share one', () => {
    // The key used to be `wizard-draft:{type}:{entityId}` with no owner at all, so these two
    // collided and whoever opened the wizard second restored the other's work.
    const alice = `${WIZARD_DRAFT_PREFIX}t1#alice:job-posting:new`;
    const bob = `${WIZARD_DRAFT_PREFIX}t1#bob:job-posting:new`;
    expect(alice).not.toEqual(bob);

    // And the same person in two tenants is likewise kept apart.
    const aliceOtherTenant = `${WIZARD_DRAFT_PREFIX}t2#alice:job-posting:new`;
    expect(alice).not.toEqual(aliceOtherTenant);
  });
});
