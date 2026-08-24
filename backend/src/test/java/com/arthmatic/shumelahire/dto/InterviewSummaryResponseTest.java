package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Whole-set counts for the interview queue.
 *
 * <p>The two figures worth protecting are the stalls: an interview that happened and was never
 * written up, and one whose slot passed with nobody starting or cancelling it. Both are computed on
 * the entity already and neither was ever counted.
 */
class InterviewSummaryResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 24, 12, 0);

    private static Interview interview(String id, InterviewStatus status, LocalDateTime scheduledAt) {
        Interview interview = new Interview();
        interview.setId(id);
        interview.setStatus(status);
        interview.setScheduledAt(scheduledAt);
        interview.setDurationMinutes(60);
        return interview;
    }

    private static Interview completed(String id, LocalDateTime completedAt) {
        Interview interview = interview(id, InterviewStatus.COMPLETED, completedAt.minusHours(1));
        interview.setCompletedAt(completedAt);
        return interview;
    }

    @Test
    @DisplayName("A completed interview with no feedback is counted as awaiting write-up")
    void awaitingWriteUpIsCounted() {
        var summary = InterviewSummaryResponse.from(
                List.of(completed("a", NOW.minusDays(9)), completed("b", NOW.minusDays(6))), NOW);

        assertEquals(2, summary.getAwaitingWriteUp());
        assertEquals("a", summary.getOldestWriteUpId());
        assertEquals(9L, summary.getOldestWriteUpDays());
    }

    @Test
    @DisplayName("The write-up worklist is ordered longest wait first")
    void worklistIsOrderedByWait() {
        var summary = InterviewSummaryResponse.from(List.of(
                completed("recent", NOW.minusDays(2)),
                completed("oldest", NOW.minusDays(11)),
                completed("middling", NOW.minusDays(5))), NOW);

        assertEquals(List.of("oldest", "middling", "recent"), summary.getAwaitingWriteUpIds());
    }

    @Test
    @DisplayName("A scheduled interview whose slot has passed is a separate stall from a missing write-up")
    void slotPassedIsItsOwnFigure() {
        // Nobody started it and nobody cancelled it — a different failure, needing a different
        // action, from an interview that happened and was never written up.
        var summary = InterviewSummaryResponse.from(List.of(
                interview("passed", InterviewStatus.SCHEDULED, NOW.minusDays(3)),
                completed("unwritten", NOW.minusDays(3))), NOW);

        assertEquals(1, summary.getSlotPassed());
        assertEquals(1, summary.getAwaitingWriteUp());
    }

    @Test
    @DisplayName("Upcoming counts only what is still scheduled, within seven days")
    void upcomingIsBounded() {
        var summary = InterviewSummaryResponse.from(List.of(
                interview("soon", InterviewStatus.SCHEDULED, NOW.plusDays(2)),
                interview("later", InterviewStatus.SCHEDULED, NOW.plusDays(20)),
                interview("past", InterviewStatus.SCHEDULED, NOW.minusDays(2)),
                interview("cancelled", InterviewStatus.CANCELLED, NOW.plusDays(1))), NOW);

        assertEquals(1, summary.getNextSevenDays());
    }

    @Test
    @DisplayName("Every status appears, including the ones holding nothing")
    void emptyStatusesStillAppear() {
        var summary = InterviewSummaryResponse.from(
                List.of(interview("a", InterviewStatus.SCHEDULED, NOW.plusDays(1))), NOW);

        assertEquals(InterviewStatus.values().length, summary.getCountsByStatus().size());
        assertEquals(0L, summary.getCountsByStatus().get(InterviewStatus.COMPLETED.name()));
        assertEquals(1L, summary.getCountsByStatus().get(InterviewStatus.SCHEDULED.name()));
    }

    @Test
    @DisplayName("Median time to file is a real duration, and null when nothing has been filed")
    void medianTimeToFile() {
        Interview one = completed("one", NOW.minusDays(10));
        one.setFeedbackSubmittedAt(NOW.minusDays(8));   // 2 days
        Interview two = completed("two", NOW.minusDays(10));
        two.setFeedbackSubmittedAt(NOW.minusDays(4));   // 6 days
        Interview three = completed("three", NOW.minusDays(10));
        three.setFeedbackSubmittedAt(NOW.minusDays(7)); // 3 days

        assertEquals(3L, InterviewSummaryResponse.from(List.of(one, two, three), NOW)
                .getMedianDaysToWriteUp());

        // Nothing filed at all: no typical time exists, which is not the same as zero days.
        assertNull(InterviewSummaryResponse.from(List.of(completed("x", NOW.minusDays(3))), NOW)
                .getMedianDaysToWriteUp());
    }

    @Test
    @DisplayName("An empty set reports zeros and no figures it cannot compute")
    void emptySetIsHonest() {
        var summary = InterviewSummaryResponse.from(List.of(), NOW);

        assertEquals(0, summary.getTotal());
        assertEquals(0, summary.getAwaitingWriteUp());
        assertNull(summary.getOldestWriteUpDays());
        assertNull(summary.getMedianDaysToWriteUp());
        assertTrue(summary.getAwaitingWriteUpIds().isEmpty());
    }

    @Test
    @DisplayName("A completed interview with no completedAt still has a knowable wait")
    void completedWithoutTimestampFallsBackToTheSlot() {
        // Falling back to the end of the booked slot is more honest than reporting no wait at all
        // for an interview that plainly finished.
        Interview interview = interview("a", InterviewStatus.COMPLETED, NOW.minusDays(4));

        var summary = InterviewSummaryResponse.from(List.of(interview), NOW);
        assertEquals(1, summary.getAwaitingWriteUp());
        assertEquals("a", summary.getOldestWriteUpId());
        assertEquals(3L, summary.getOldestWriteUpDays());
    }
}
