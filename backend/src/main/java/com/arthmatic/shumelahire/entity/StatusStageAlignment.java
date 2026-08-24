package com.arthmatic.shumelahire.entity;

import java.util.EnumSet;
import java.util.Set;

/**
 * Keeps {@link ApplicationStatus} and {@link PipelineStage} from contradicting each other.
 *
 * <p>An application carries both. {@code PipelineService} and {@code ApplicationManagementService}
 * move {@code pipelineStage} and stamp {@code pipelineStageEnteredAt};
 * {@code ApplicationService.updateApplicationStatus} — the endpoint behind
 * {@code PUT /api/applications/{id}/status}, which is what the application detail page and the
 * applications list both call — moved only {@code status} and touched neither. Advancing a
 * candidate from the detail page therefore left the pipeline board showing them where they were,
 * with a stage-entry timestamp that no longer described anything.
 *
 * <p><b>The mapping is deliberately lossy in one direction and this class is built around that.</b>
 * Sixteen stages fold onto thirteen statuses, so a status cannot tell you <i>which</i> interview a
 * candidate is at — {@code INTERVIEW_COMPLETED} is true of a first interview, a panel and a final
 * one alike. Rewriting the stage on every status change would quietly demote a candidate whom a
 * recruiter had placed at {@code PANEL_INTERVIEW} back to {@code FIRST_INTERVIEW}, which is a worse
 * failure than the one being fixed.
 *
 * <p>So each status names <b>the stages consistent with it</b> and one canonical stage to use when
 * none of them applies. If the application is already at a consistent stage it is left alone; only
 * a genuine contradiction moves it, and only then is {@code pipelineStageEnteredAt} restamped —
 * because that field means "when this stage was entered", not "when this record was last touched".
 */
public final class StatusStageAlignment {

    private StatusStageAlignment() {
    }

    /** The stages that do not contradict the given status. */
    public static Set<PipelineStage> consistentStages(ApplicationStatus status) {
        return switch (status) {
            case SUBMITTED -> EnumSet.of(PipelineStage.APPLICATION_RECEIVED);
            case SCREENING -> EnumSet.of(PipelineStage.INITIAL_SCREENING, PipelineStage.PHONE_SCREENING);
            // Any interview stage satisfies both interview statuses: the status records that an
            // interview is scheduled or done, never which round it was.
            case INTERVIEW_SCHEDULED, INTERVIEW_COMPLETED -> EnumSet.of(
                    PipelineStage.FIRST_INTERVIEW,
                    PipelineStage.TECHNICAL_ASSESSMENT,
                    PipelineStage.SECOND_INTERVIEW,
                    PipelineStage.PANEL_INTERVIEW,
                    PipelineStage.MANAGER_INTERVIEW,
                    PipelineStage.FINAL_INTERVIEW);
            case REFERENCE_CHECK -> EnumSet.of(
                    PipelineStage.REFERENCE_CHECK, PipelineStage.BACKGROUND_CHECK);
            case OFFER_PENDING -> EnumSet.of(PipelineStage.OFFER_PREPARATION);
            case OFFERED -> EnumSet.of(
                    PipelineStage.OFFER_EXTENDED, PipelineStage.OFFER_NEGOTIATION);
            case OFFER_ACCEPTED -> EnumSet.of(PipelineStage.OFFER_ACCEPTED);
            // The pipeline has no "offer declined" stage. A declined offer ends the candidacy, and
            // REJECTED is the terminal stage that says so — not a judgement on the candidate, just
            // the only terminal stage the pipeline models for an ended, unsuccessful process.
            case OFFER_DECLINED, REJECTED -> EnumSet.of(PipelineStage.REJECTED);
            case WITHDRAWN -> EnumSet.of(PipelineStage.WITHDRAWN);
            case HIRED -> EnumSet.of(PipelineStage.HIRED);
        };
    }

    /**
     * The stage to move to when the current one contradicts the status.
     *
     * <p>The earliest consistent stage, so a status change never advances a candidate further than
     * the status itself establishes. Marking someone {@code INTERVIEW_COMPLETED} puts them at a
     * first interview, not a final one.
     */
    public static PipelineStage canonicalStage(ApplicationStatus status) {
        return consistentStages(status).stream()
                .min((a, b) -> Integer.compare(a.getOrder(), b.getOrder()))
                .orElseThrow();
    }

    /**
     * Whether this application's stage needs to move to agree with the given status.
     *
     * <p>A null stage counts as needing alignment: an application with no stage at all cannot be
     * said to be at a consistent one.
     */
    public static boolean needsAlignment(PipelineStage current, ApplicationStatus status) {
        return current == null || !consistentStages(status).contains(current);
    }
}
