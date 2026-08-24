package com.arthmatic.shumelahire.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Covers which moves the verification gate guards.
 *
 * <p>Two things were wrong with the question the pipeline used to ask, and neither is visible from
 * the happy path.</p>
 *
 * <p>The pipeline board groups Reference Check and Background Check into one "Checks" column and
 * greys out the move button for the whole column, but the rule fired only on Background Check. A
 * candidate at Reference Check could be sent to Offer Preparation with everything outstanding while
 * the screen showed them as blocked.</p>
 *
 * <p>And because the terminal stages sort above every active one by order, the old comparison
 * caught rejection too: a candidate whose criminal check came back ADVERSE could not be rejected,
 * on the grounds that their checks were not clear. The gate is there to stop an unverified hire,
 * not to trap a candidate in the pipeline.</p>
 */
class VerificationGateScopeTest {

    @Test
    @DisplayName("guards the move out of Background Check")
    void guardsBackgroundCheck() {
        assertTrue(PipelineStage.requiresCompletedChecks(
                PipelineStage.BACKGROUND_CHECK, PipelineStage.OFFER_PREPARATION));
    }

    @Test
    @DisplayName("guards Reference Check too — the board always claimed it did")
    void guardsReferenceCheck() {
        assertTrue(PipelineStage.requiresCompletedChecks(
                PipelineStage.REFERENCE_CHECK, PipelineStage.OFFER_PREPARATION));
        assertTrue(PipelineStage.requiresCompletedChecks(
                PipelineStage.REFERENCE_CHECK, PipelineStage.HIRED));
    }

    @Test
    @DisplayName("moving deeper into the checks is not leaving them")
    void referenceToBackgroundIsNotGuarded() {
        assertFalse(PipelineStage.requiresCompletedChecks(
                PipelineStage.REFERENCE_CHECK, PipelineStage.BACKGROUND_CHECK));
    }

    @Test
    @DisplayName("a candidate with outstanding or adverse checks can still be rejected")
    void neverBlocksRejection() {
        // The reason you are rejecting them is usually the check itself.
        assertFalse(PipelineStage.requiresCompletedChecks(
                PipelineStage.BACKGROUND_CHECK, PipelineStage.REJECTED));
        assertFalse(PipelineStage.requiresCompletedChecks(
                PipelineStage.REFERENCE_CHECK, PipelineStage.REJECTED));
    }

    @Test
    @DisplayName("or withdraw themselves")
    void neverBlocksWithdrawal() {
        assertFalse(PipelineStage.requiresCompletedChecks(
                PipelineStage.BACKGROUND_CHECK, PipelineStage.WITHDRAWN));
    }

    @Test
    @DisplayName("stages before the checks are not guarded — there is nothing to have completed yet")
    void doesNotGuardEarlierStages() {
        assertFalse(PipelineStage.requiresCompletedChecks(
                PipelineStage.FIRST_INTERVIEW, PipelineStage.FINAL_INTERVIEW));
        assertFalse(PipelineStage.requiresCompletedChecks(
                PipelineStage.APPLICATION_RECEIVED, PipelineStage.OFFER_PREPARATION));
    }

    @Test
    @DisplayName("Hired and Offer Accepted are terminal too — and are exactly what the gate is for")
    void guardsTheSuccessfulTerminalStages() {
        // Exempting everything terminal would have left the hole open at the only place it matters:
        // an unverified candidate marked hired in one move.
        assertTrue(PipelineStage.requiresCompletedChecks(
                PipelineStage.BACKGROUND_CHECK, PipelineStage.HIRED));
        assertTrue(PipelineStage.requiresCompletedChecks(
                PipelineStage.BACKGROUND_CHECK, PipelineStage.OFFER_ACCEPTED));
    }

    @Test
    @DisplayName("a null current stage is not a gate")
    void toleratesNulls() {
        assertFalse(PipelineStage.requiresCompletedChecks(null, PipelineStage.OFFER_PREPARATION));
        assertFalse(PipelineStage.requiresCompletedChecks(PipelineStage.BACKGROUND_CHECK, null));
    }
}
