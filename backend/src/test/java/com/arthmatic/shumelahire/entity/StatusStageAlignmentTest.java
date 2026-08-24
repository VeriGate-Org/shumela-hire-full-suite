package com.arthmatic.shumelahire.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The rule that stops {@code status} and {@code pipelineStage} contradicting each other.
 *
 * <p>The behaviour worth protecting is the restraint: a status change must correct a stage that is
 * genuinely wrong and leave alone one that is merely more specific than the status can express.
 */
class StatusStageAlignmentTest {

    @Test
    @DisplayName("Every status maps to at least one stage, so no status can be unalignable")
    void everyStatusIsCovered() {
        for (ApplicationStatus status : ApplicationStatus.values()) {
            assertFalse(StatusStageAlignment.consistentStages(status).isEmpty(),
                    status + " has no consistent stage");
            assertNotNull(StatusStageAlignment.canonicalStage(status),
                    status + " has no canonical stage");
        }
    }

    @Test
    @DisplayName("A more specific interview stage survives a generic interview status")
    void specificStageIsNotDemoted() {
        // The whole point. INTERVIEW_COMPLETED is true of a panel interview too, so rewriting the
        // stage would move a candidate backwards and lose what the pipeline knew.
        assertFalse(StatusStageAlignment.needsAlignment(
                PipelineStage.PANEL_INTERVIEW, ApplicationStatus.INTERVIEW_COMPLETED));
        assertFalse(StatusStageAlignment.needsAlignment(
                PipelineStage.FINAL_INTERVIEW, ApplicationStatus.INTERVIEW_SCHEDULED));
    }

    @Test
    @DisplayName("A stage that contradicts the status is moved")
    void contradictionIsCorrected() {
        // Someone screening an application that the board still shows as newly received.
        assertTrue(StatusStageAlignment.needsAlignment(
                PipelineStage.APPLICATION_RECEIVED, ApplicationStatus.SCREENING));
        assertEquals(PipelineStage.INITIAL_SCREENING,
                StatusStageAlignment.canonicalStage(ApplicationStatus.SCREENING));
    }

    @Test
    @DisplayName("An application with no stage at all is aligned rather than left blank")
    void missingStageIsAligned() {
        assertTrue(StatusStageAlignment.needsAlignment(null, ApplicationStatus.SUBMITTED));
    }

    @Test
    @DisplayName("The canonical stage is the earliest consistent one, never the furthest")
    void canonicalStageDoesNotOverreach() {
        // Marking someone INTERVIEW_COMPLETED must not promote them to a final interview they
        // never had.
        assertEquals(PipelineStage.FIRST_INTERVIEW,
                StatusStageAlignment.canonicalStage(ApplicationStatus.INTERVIEW_COMPLETED));
        assertEquals(PipelineStage.OFFER_EXTENDED,
                StatusStageAlignment.canonicalStage(ApplicationStatus.OFFERED));
    }

    @Test
    @DisplayName("Each terminal status lands on its own terminal stage")
    void terminalStatusesAreTerminal() {
        assertEquals(PipelineStage.REJECTED,
                StatusStageAlignment.canonicalStage(ApplicationStatus.REJECTED));
        assertEquals(PipelineStage.WITHDRAWN,
                StatusStageAlignment.canonicalStage(ApplicationStatus.WITHDRAWN));
        assertEquals(PipelineStage.HIRED,
                StatusStageAlignment.canonicalStage(ApplicationStatus.HIRED));
        // The pipeline models no "declined" stage; a declined offer ends the process, and REJECTED
        // is the terminal stage for an ended, unsuccessful one.
        assertEquals(PipelineStage.REJECTED,
                StatusStageAlignment.canonicalStage(ApplicationStatus.OFFER_DECLINED));
        assertTrue(StatusStageAlignment.canonicalStage(ApplicationStatus.HIRED).isTerminal());
    }
}
