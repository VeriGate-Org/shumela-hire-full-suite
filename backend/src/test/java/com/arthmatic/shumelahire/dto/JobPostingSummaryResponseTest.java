package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Whole-set counts for the advert queue.
 *
 * <p>What these pin is the split the page exists for: an advert that is published and still taking
 * applications, versus one that is published and has stopped. Nothing closes a posting when its
 * deadline passes, so both wear the same status.
 */
class JobPostingSummaryResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 24, 12, 0);

    private static JobPosting posting(String id, JobPostingStatus status, LocalDateTime deadline) {
        JobPosting posting = new JobPosting();
        posting.setId(id);
        posting.setStatus(status);
        posting.setApplicationDeadline(deadline);
        return posting;
    }

    @Test
    @DisplayName("Published splits into open and past deadline, on the same status")
    void publishedSplitsOnTheDeadline() {
        var summary = JobPostingSummaryResponse.from(List.of(
                posting("open", JobPostingStatus.PUBLISHED, NOW.plusDays(5)),
                posting("expired", JobPostingStatus.PUBLISHED, NOW.minusDays(11)),
                posting("also-expired", JobPostingStatus.PUBLISHED, NOW.minusDays(6))), NOW);

        assertEquals(1, summary.getOpenToApplicants());
        assertEquals(2, summary.getPastDeadline());
        // Both remain PUBLISHED — the split is derived, not stored.
        assertEquals(3L, summary.getCountsByStatus().get(JobPostingStatus.PUBLISHED.name()));
    }

    @Test
    @DisplayName("The oldest expired advert is named, so it can be acted on")
    void oldestExpiredIsIdentified() {
        var summary = JobPostingSummaryResponse.from(List.of(
                posting("recent", JobPostingStatus.PUBLISHED, NOW.minusDays(6)),
                posting("oldest", JobPostingStatus.PUBLISHED, NOW.minusDays(11))), NOW);

        assertEquals("oldest", summary.getOldestExpiredId());
        assertEquals(11L, summary.getOldestExpiredDays());
    }

    @Test
    @DisplayName("A published advert with no deadline counts as open, not expired")
    void noDeadlineIsOpen() {
        // It is published and taking applications, which is what open means. Treating an absent
        // deadline as a passed one would report a live advert as dead.
        var summary = JobPostingSummaryResponse.from(
                List.of(posting("no-date", JobPostingStatus.PUBLISHED, null)), NOW);

        assertEquals(1, summary.getOpenToApplicants());
        assertEquals(0, summary.getPastDeadline());
        assertNull(summary.getOldestExpiredDays());
    }

    @Test
    @DisplayName("Only a published advert can be open or expired")
    void unpublishedAdvertsAreNeither() {
        // A draft's deadline means nothing yet; a closed advert was ended deliberately.
        var summary = JobPostingSummaryResponse.from(List.of(
                posting("draft", JobPostingStatus.DRAFT, NOW.minusDays(30)),
                posting("closed", JobPostingStatus.CLOSED, NOW.minusDays(30))), NOW);

        assertEquals(0, summary.getOpenToApplicants());
        assertEquals(0, summary.getPastDeadline());
        assertEquals(2, summary.getTotal());
    }

    @Test
    @DisplayName("Applications received is a real total across every advert")
    void applicationsAreTotalled() {
        JobPosting one = posting("a", JobPostingStatus.PUBLISHED, NOW.plusDays(3));
        one.setApplicationsCount(29L);
        JobPosting two = posting("b", JobPostingStatus.CLOSED, NOW.minusDays(3));
        two.setApplicationsCount(11L);
        JobPosting three = posting("c", JobPostingStatus.DRAFT, null);

        var summary = JobPostingSummaryResponse.from(List.of(one, two, three), NOW);

        // Counted across the whole set including closed adverts, and a null count is not a crash.
        assertEquals(40, summary.getApplicationsReceived());
    }

    @Test
    @DisplayName("Every status appears, including the ones holding nothing")
    void emptyStatusesStillAppear() {
        var summary = JobPostingSummaryResponse.from(
                List.of(posting("a", JobPostingStatus.DRAFT, null)), NOW);

        assertEquals(JobPostingStatus.values().length, summary.getCountsByStatus().size());
        assertEquals(0L, summary.getCountsByStatus().get(JobPostingStatus.PUBLISHED.name()));
    }

    @Test
    @DisplayName("Awaiting approval is counted separately from draft")
    void awaitingApprovalIsItsOwnFigure() {
        var summary = JobPostingSummaryResponse.from(List.of(
                posting("a", JobPostingStatus.PENDING_APPROVAL, null),
                posting("b", JobPostingStatus.PENDING_APPROVAL, null),
                posting("c", JobPostingStatus.DRAFT, null)), NOW);

        assertEquals(2, summary.getAwaitingApproval());
    }

    @Test
    @DisplayName("An empty set reports no oldest expiry rather than a zero")
    void emptySetIsHonest() {
        var summary = JobPostingSummaryResponse.from(List.of(), NOW);

        assertEquals(0, summary.getTotal());
        assertNull(summary.getOldestExpiredDays());
        assertNull(summary.getOldestExpiredId());
    }
}
