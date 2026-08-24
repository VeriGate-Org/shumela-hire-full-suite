package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.PipelineStage;
import com.arthmatic.shumelahire.entity.PipelineTransition;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * What the pipeline is doing, computed from transitions.
 *
 * <p>None of this ran before: every analytics method on the only implementation of
 * {@code PipelineTransitionDataRepository} throws. These pin the two measures the board and the
 * dashboard both get wrong — a funnel that counts who <i>reached</i> a stage rather than who sits
 * in it, and a stage duration that is a median rather than a mean.
 */
class PipelineAnalyticsResponseTest {

    private static PipelineTransition move(String applicationId, PipelineStage from,
                                           PipelineStage to, Long hoursInFrom) {
        Application application = new Application();
        application.setId(applicationId);

        PipelineTransition transition = new PipelineTransition();
        transition.setApplication(application);
        transition.setFromStage(from);
        transition.setToStage(to);
        transition.setDurationInPreviousStageHours(hoursInFrom);
        return transition;
    }

    @Test
    @DisplayName("The funnel counts who reached a stage, not who sits in it")
    void funnelCountsReached() {
        // One candidate who passed through screening on the way to an interview is counted at
        // screening, even though they are not there now. The board computed the opposite and
        // called it a conversion rate.
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING, 24L),
                move("a", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 48L),
                move("b", PipelineStage.APPLICATION_RECEIVED, PipelineStage.INITIAL_SCREENING, 12L)));

        assertEquals(2L, analytics.getReachedByStage().get(PipelineStage.INITIAL_SCREENING.name()));
        assertEquals(1L, analytics.getReachedByStage().get(PipelineStage.FIRST_INTERVIEW.name()));
    }

    @Test
    @DisplayName("One candidate bouncing between stages is not counted twice at the same stage")
    void funnelCountsDistinctApplications() {
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 10L),
                move("a", PipelineStage.FIRST_INTERVIEW, PipelineStage.INITIAL_SCREENING, 10L),
                move("a", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 10L)));

        assertEquals(1L, analytics.getReachedByStage().get(PipelineStage.FIRST_INTERVIEW.name()));
    }

    @Test
    @DisplayName("Stage duration is a median, so one stuck candidate does not move it")
    void durationIsAMedianNotAMean() {
        // Four candidates left screening after about a day; one sat there sixteen. The mean would
        // be over 80 hours and describe nobody. This is the case the board exists to surface.
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 24L),
                move("b", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 24L),
                move("c", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 30L),
                move("d", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 384L)));

        assertEquals(24.0, analytics.getMedianStageHours().get(PipelineStage.INITIAL_SCREENING.name()));
        assertEquals(4L, analytics.getStageSampleSize().get(PipelineStage.INITIAL_SCREENING.name()));
    }

    @Test
    @DisplayName("The median takes the lower of two central values, matching every other median here")
    void medianConvention() {
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.FIRST_INTERVIEW, PipelineStage.PANEL_INTERVIEW, 10L),
                move("b", PipelineStage.FIRST_INTERVIEW, PipelineStage.PANEL_INTERVIEW, 20L),
                move("c", PipelineStage.FIRST_INTERVIEW, PipelineStage.PANEL_INTERVIEW, 30L),
                move("d", PipelineStage.FIRST_INTERVIEW, PipelineStage.PANEL_INTERVIEW, 40L)));

        assertEquals(20.0, analytics.getMedianStageHours().get(PipelineStage.FIRST_INTERVIEW.name()));
    }

    @Test
    @DisplayName("Duration is attributed to the stage being left, not the one arrived at")
    void durationBelongsToTheStageLeft() {
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.BACKGROUND_CHECK, PipelineStage.OFFER_PREPARATION, 264L)));

        assertEquals(264.0, analytics.getMedianStageHours().get(PipelineStage.BACKGROUND_CHECK.name()));
        assertNull(analytics.getMedianStageHours().get(PipelineStage.OFFER_PREPARATION.name()));
    }

    @Test
    @DisplayName("A transition with no recorded duration is reported, not counted as zero")
    void missingDurationsAreReported() {
        // Treating an absent duration as zero hours would drag every median towards nothing.
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, null),
                move("b", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 48L)));

        assertEquals(1, analytics.getTransitionsWithoutDuration());
        assertEquals(48.0, analytics.getMedianStageHours().get(PipelineStage.INITIAL_SCREENING.name()));
        assertEquals(1L, analytics.getStageSampleSize().get(PipelineStage.INITIAL_SCREENING.name()));
    }

    @Test
    @DisplayName("The slowest stage is named, and terminal stages cannot be it")
    void slowestStageExcludesTerminal() {
        // Time spent "in" Rejected is not a bottleneck, it is the end of the process.
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.BACKGROUND_CHECK, PipelineStage.OFFER_PREPARATION, 264L),
                move("b", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 96L),
                move("c", PipelineStage.REJECTED, PipelineStage.INITIAL_SCREENING, 8760L)));

        assertEquals(PipelineStage.BACKGROUND_CHECK.name(), analytics.getSlowestStage());
        assertEquals(11.0, analytics.getSlowestStageDays());
    }

    @Test
    @DisplayName("Hours become days in floating point, so 23 hours is not zero days")
    void hoursToDaysKeepsTheFraction() {
        // PipelineTransition.getDurationInDays() does Long division by 24, so 23 hours reports as
        // zero days. Nothing here uses that method.
        var analytics = PipelineAnalyticsResponse.from(
                List.of(move("a", PipelineStage.PHONE_SCREENING, PipelineStage.FIRST_INTERVIEW, 23L)));

        assertTrue(analytics.getSlowestStageDays() > 0);
    }

    @Test
    @DisplayName("A move to an earlier stage is a regression; rejecting somebody is not")
    void regressionIsBackwardsMovement() {
        assertTrue(PipelineAnalyticsResponse.isRegression(
                PipelineStage.BACKGROUND_CHECK, PipelineStage.FIRST_INTERVIEW));
        // Rejected has a higher order number than any working stage, but rejecting a candidate is
        // not sending them backwards.
        assertFalse(PipelineAnalyticsResponse.isRegression(
                PipelineStage.FIRST_INTERVIEW, PipelineStage.REJECTED));
        assertFalse(PipelineAnalyticsResponse.isRegression(
                PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW));
    }

    @Test
    @DisplayName("Reopening a rejection counts as a regression")
    void reopeningIsARegression() {
        assertTrue(PipelineAnalyticsResponse.isRegression(
                PipelineStage.REJECTED, PipelineStage.FIRST_INTERVIEW));
    }

    @Test
    @DisplayName("A regression carries who and when, so the board need not look it up again")
    void regressionsCarryContext() {
        PipelineTransition back = move("zanele", PipelineStage.BACKGROUND_CHECK,
                PipelineStage.SECOND_INTERVIEW, 48L);
        back.setReason("Second interview requested");

        var analytics = PipelineAnalyticsResponse.from(List.of(back));

        assertEquals(1, analytics.getRegressions().size());
        var regression = analytics.getRegressions().get(0);
        assertEquals("zanele", regression.getApplicationId());
        assertEquals("Second interview requested", regression.getReason());
        assertEquals(PipelineStage.SECOND_INTERVIEW.name(), regression.getToStage());
    }

    @Test
    @DisplayName("Conversions are real from-stage to-stage counts")
    void conversionsAreCounted() {
        var analytics = PipelineAnalyticsResponse.from(List.of(
                move("a", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 10L),
                move("b", PipelineStage.INITIAL_SCREENING, PipelineStage.FIRST_INTERVIEW, 10L),
                move("c", PipelineStage.INITIAL_SCREENING, PipelineStage.REJECTED, 10L)));

        var fromScreening = analytics.getConversions().get(PipelineStage.INITIAL_SCREENING.name());
        assertEquals(2L, fromScreening.get(PipelineStage.FIRST_INTERVIEW.name()));
        assertEquals(1L, fromScreening.get(PipelineStage.REJECTED.name()));
    }

    @Test
    @DisplayName("The biggest drop-off is between consecutive stages, in order")
    void biggestDropOffIsFound() {
        var analytics = new PipelineAnalyticsResponse();
        analytics.getReachedByStage().put(PipelineStage.APPLICATION_RECEIVED.name(), 218L);
        analytics.getReachedByStage().put(PipelineStage.INITIAL_SCREENING.name(), 154L);
        analytics.getReachedByStage().put(PipelineStage.FIRST_INTERVIEW.name(), 59L);
        analytics.getReachedByStage().put(PipelineStage.BACKGROUND_CHECK.name(), 24L);

        var drop = analytics.biggestDropOff();

        assertEquals(PipelineStage.INITIAL_SCREENING.name(), drop.getFromStage());
        assertEquals(PipelineStage.FIRST_INTERVIEW.name(), drop.getToStage());
        assertEquals(95L, drop.getLostCount());
    }

    @Test
    @DisplayName("No transitions reports nothing rather than zeroes with meaning")
    void emptySet() {
        var analytics = PipelineAnalyticsResponse.from(List.of());

        assertEquals(0, analytics.getTransitions());
        assertNull(analytics.getSlowestStage());
        assertNull(analytics.getSlowestStageDays());
        assertNull(analytics.biggestDropOff());
    }

    @Test
    @DisplayName("A transition with no application is counted but attributed to nobody")
    void transitionWithoutApplication() {
        PipelineTransition orphan = new PipelineTransition();
        orphan.setFromStage(PipelineStage.INITIAL_SCREENING);
        orphan.setToStage(PipelineStage.FIRST_INTERVIEW);
        orphan.setDurationInPreviousStageHours(24L);

        var analytics = PipelineAnalyticsResponse.from(List.of(orphan));

        assertEquals(1, analytics.getTransitions());
        // It cannot join the funnel, which counts distinct applications.
        assertNull(analytics.getReachedByStage().get(PipelineStage.FIRST_INTERVIEW.name()));
        // But it still says something about how long screening took.
        assertEquals(24.0, analytics.getMedianStageHours().get(PipelineStage.INITIAL_SCREENING.name()));
    }
}
