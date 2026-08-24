package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Whole-set counts for the applications queue.
 *
 * <p>What these pin is the difference between "none" and "unknown". A figure that cannot be
 * computed is absent; a figure that is genuinely zero is zero; neither is allowed to impersonate
 * the other.
 */
class ApplicationSummaryResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 24, 9, 0);

    private static Application app(String id, LocalDateTime submittedAt) {
        return app(id, submittedAt, null, null, null, null);
    }

    private static Application app(String id, LocalDateTime submittedAt, String advertId,
                                   String jobTitle, String department, String source) {
        Application application = new Application();
        application.setId(id);
        application.setSubmittedAt(submittedAt);
        application.setJobPostingId(advertId);
        application.setJobTitle(jobTitle);
        application.setDepartment(department);
        application.setApplicationSource(source);
        return application;
    }

    private static Map<ApplicationStatus, List<Application>> byStatus(ApplicationStatus status,
                                                                      List<Application> records) {
        Map<ApplicationStatus, List<Application>> map = new EnumMap<>(ApplicationStatus.class);
        map.put(status, records);
        return map;
    }

    @Test
    @DisplayName("Every status appears, including the ones holding nothing")
    void emptyStatusesStillAppear() {
        var summary = ApplicationSummaryResponse.from(
                byStatus(ApplicationStatus.SUBMITTED, List.of(app("a", NOW.minusDays(1)))), NOW);

        assertEquals(ApplicationStatus.values().length, summary.getCountsByStatus().size());
        // A status that vanishes when empty and returns later reads as a bug in the filter row.
        assertEquals(0L, summary.getCountsByStatus().get(ApplicationStatus.HIRED.name()));
        assertEquals(1L, summary.getCountsByStatus().get(ApplicationStatus.SUBMITTED.name()));
    }

    @Test
    @DisplayName("Live excludes rejected, withdrawn and declined; total includes them")
    void liveExcludesEndedCandidacies() {
        Map<ApplicationStatus, List<Application>> map = new EnumMap<>(ApplicationStatus.class);
        map.put(ApplicationStatus.SUBMITTED, List.of(app("a", NOW), app("b", NOW)));
        map.put(ApplicationStatus.REJECTED, List.of(app("c", NOW)));
        map.put(ApplicationStatus.WITHDRAWN, List.of(app("d", NOW)));
        map.put(ApplicationStatus.OFFER_DECLINED, List.of(app("e", NOW)));

        var summary = ApplicationSummaryResponse.from(map, NOW);

        assertEquals(5, summary.getTotal());
        assertEquals(2, summary.getLive());
    }

    @Test
    @DisplayName("The oldest unscreened application is the one waiting longest")
    void oldestUnscreenedIsTheLongestWait() {
        var summary = ApplicationSummaryResponse.from(byStatus(ApplicationStatus.SUBMITTED, List.of(
                app("recent", NOW.minusDays(2)),
                app("oldest", NOW.minusDays(23)),
                app("middling", NOW.minusDays(9)))), NOW);

        assertEquals(3, summary.getUnscreened());
        assertEquals("oldest", summary.getOldestUnscreenedId());
        assertEquals(23L, summary.getOldestUnscreenedDays());
    }

    @Test
    @DisplayName("An application with no submission time cannot be the longest wait")
    void undatedApplicationDoesNotWinTheWait() {
        var summary = ApplicationSummaryResponse.from(byStatus(ApplicationStatus.SUBMITTED, List.of(
                app("undated", null),
                app("dated", NOW.minusDays(4)))), NOW);

        // It is still counted — it exists and is unscreened — but an unknown wait must not be
        // reported as the longest one, nor as a wait of zero.
        assertEquals(2, summary.getUnscreened());
        assertEquals("dated", summary.getOldestUnscreenedId());
        assertEquals(4L, summary.getOldestUnscreenedDays());
    }

    @Test
    @DisplayName("With nothing unscreened there is no oldest wait, rather than a wait of zero")
    void noUnscreenedMeansNoFigure() {
        var summary = ApplicationSummaryResponse.from(
                byStatus(ApplicationStatus.HIRED, List.of(app("a", NOW.minusDays(30)))), NOW);

        assertEquals(0, summary.getUnscreened());
        assertNull(summary.getOldestUnscreenedDays());
        assertNull(summary.getOldestUnscreenedId());
        assertTrue(summary.getUnscreenedByAdvert().isEmpty());
    }

    @Test
    @DisplayName("Unscreened work is grouped by advert, worst first")
    void backlogIsConcentratedWorstFirst() {
        var summary = ApplicationSummaryResponse.from(byStatus(ApplicationStatus.SUBMITTED, List.of(
                app("a", NOW, "advert-1", "Investment Analyst", "SBU", "Careers site"),
                app("b", NOW, "advert-2", "ICT Business Analyst", "IT", "PNet"),
                app("c", NOW, "advert-1", "Investment Analyst", "SBU", "LinkedIn"),
                app("d", NOW, "advert-1", "Investment Analyst", "SBU", "Referral"))), NOW);

        var backlog = summary.getUnscreenedByAdvert();
        assertEquals(2, backlog.size());
        assertEquals("advert-1", backlog.get(0).getJobPostingId());
        assertEquals("Investment Analyst", backlog.get(0).getJobTitle());
        assertEquals(3, backlog.get(0).getUnscreened());
        assertEquals(1, backlog.get(1).getUnscreened());
    }

    @Test
    @DisplayName("An application with no advert is counted but not grouped into a phantom row")
    void missingAdvertIsNotInvented() {
        var summary = ApplicationSummaryResponse.from(byStatus(ApplicationStatus.SUBMITTED, List.of(
                app("a", NOW, null, null, null, null),
                app("b", NOW, "advert-1", "Investment Analyst", "SBU", "PNet"))), NOW);

        assertEquals(2, summary.getUnscreened());
        assertEquals(1, summary.getUnscreenedByAdvert().size());
        assertEquals("advert-1", summary.getUnscreenedByAdvert().get(0).getJobPostingId());
    }

    @Test
    @DisplayName("Filter options are derived from the data, deduplicated and sorted")
    void filterOptionsComeFromTheData() {
        Map<ApplicationStatus, List<Application>> map = new EnumMap<>(ApplicationStatus.class);
        map.put(ApplicationStatus.SUBMITTED, List.of(
                app("a", NOW, "j1", "Analyst", "Information Technology", "PNet"),
                app("b", NOW, "j2", "Risk Manager", "Enterprise Risk Management", "LinkedIn")));
        map.put(ApplicationStatus.HIRED, List.of(
                app("c", NOW, "j3", "Analyst", "Information Technology", "Careers site")));

        var summary = ApplicationSummaryResponse.from(map, NOW);

        // Sorted and deduplicated: a filter whose options reorder on refresh is one a user stops
        // trusting, and the hardcoded list this replaces matched none of these.
        assertEquals(List.of("Enterprise Risk Management", "Information Technology"),
                summary.getDepartments());
        assertEquals(List.of("Careers site", "LinkedIn", "PNet"), summary.getSources());
    }

    @Test
    @DisplayName("Blank departments and sources are omitted rather than offered as an empty filter")
    void blankFilterValuesAreOmitted() {
        var summary = ApplicationSummaryResponse.from(byStatus(ApplicationStatus.SUBMITTED, List.of(
                app("a", NOW, "j1", "Analyst", "   ", ""),
                app("b", NOW, "j2", "Analyst", "Information Technology", "PNet"))), NOW);

        assertEquals(List.of("Information Technology"), summary.getDepartments());
        assertEquals(List.of("PNet"), summary.getSources());
    }
}
