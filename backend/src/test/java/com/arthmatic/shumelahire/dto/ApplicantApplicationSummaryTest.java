package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApplicantApplicationSummaryTest {

    private static Application application(String id, String jobTitle, ApplicationStatus status,
                                           LocalDateTime submittedAt) {
        Application application = new Application();
        application.setId(id);
        application.setJobTitle(jobTitle);
        application.setDepartment("Strategic Business Unit");
        application.setStatus(status);
        application.setSubmittedAt(submittedAt);
        return application;
    }

    @Test
    @DisplayName("An applicant who has never applied returns zero, not an absent summary")
    void neverApplied() {
        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(Collections.emptyList());

        assertNotNull(summary, "an empty history must still produce a summary object");
        assertEquals(0, summary.getTotal());
        assertEquals(0, summary.getActive());
        assertFalse(summary.isHired());
        assertNull(summary.getLastAppliedAt(), "never applied has no last-applied date, not epoch");
        assertTrue(summary.getApplications().isEmpty());
        assertTrue(summary.getByStatus().isEmpty());
    }

    @Test
    @DisplayName("A null list is treated as no history rather than throwing")
    void nullHistory() {
        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(null);

        assertEquals(0, summary.getTotal());
        assertTrue(summary.getApplications().isEmpty());
    }

    @Test
    @DisplayName("Active excludes terminal statuses, and byStatus counts every application")
    void countsActiveAgainstTerminal() {
        List<Application> applications = List.of(
                application("a1", "Investment Analyst", ApplicationStatus.SCREENING,
                        LocalDateTime.of(2026, 8, 20, 9, 0)),
                application("a2", "ICT Business Analyst", ApplicationStatus.REJECTED,
                        LocalDateTime.of(2026, 5, 4, 9, 0)),
                application("a3", "Graduate Trainee Programme", ApplicationStatus.WITHDRAWN,
                        LocalDateTime.of(2026, 2, 1, 9, 0)),
                application("a4", "Risk Manager", ApplicationStatus.INTERVIEW_SCHEDULED,
                        LocalDateTime.of(2026, 8, 1, 9, 0)));

        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(applications);

        assertEquals(4, summary.getTotal());
        assertEquals(2, summary.getActive(), "SCREENING and INTERVIEW_SCHEDULED are active");
        assertFalse(summary.isHired());

        assertEquals(1, summary.getByStatus().get("SCREENING"));
        assertEquals(1, summary.getByStatus().get("REJECTED"));
        assertEquals(1, summary.getByStatus().get("WITHDRAWN"));
        assertEquals(1, summary.getByStatus().get("INTERVIEW_SCHEDULED"));
    }

    @Test
    @DisplayName("Repeated applications to the same status are summed, not overwritten")
    void repeatedStatusesAreSummed() {
        List<Application> applications = List.of(
                application("a1", "Investment Analyst", ApplicationStatus.REJECTED,
                        LocalDateTime.of(2026, 3, 1, 9, 0)),
                application("a2", "Investment Analyst", ApplicationStatus.REJECTED,
                        LocalDateTime.of(2025, 9, 1, 9, 0)),
                application("a3", "Legal Advisor", ApplicationStatus.REJECTED,
                        LocalDateTime.of(2025, 1, 1, 9, 0)));

        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(applications);

        assertEquals(3, summary.getTotal());
        assertEquals(0, summary.getActive());
        assertEquals(3, summary.getByStatus().get("REJECTED"),
                "three rejections must read as three, which is the repeat-applicant signal");
    }

    @Test
    @DisplayName("lastAppliedAt is the most recent submission regardless of list order")
    void lastAppliedIsTheMaximum() {
        List<Application> outOfOrder = List.of(
                application("a1", "Risk Manager", ApplicationStatus.REJECTED,
                        LocalDateTime.of(2026, 1, 15, 9, 0)),
                application("a2", "Investment Analyst", ApplicationStatus.SCREENING,
                        LocalDateTime.of(2026, 8, 20, 9, 0)),
                application("a3", "Legal Advisor", ApplicationStatus.REJECTED,
                        LocalDateTime.of(2026, 4, 2, 9, 0)));

        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(outOfOrder);

        assertEquals(LocalDateTime.of(2026, 8, 20, 9, 0), summary.getLastAppliedAt());
    }

    @Test
    @DisplayName("A hired applicant is flagged, and HIRED is not counted as active")
    void hiredIsTerminal() {
        List<Application> applications = List.of(
                application("a1", "Investment Analyst", ApplicationStatus.HIRED,
                        LocalDateTime.of(2026, 6, 1, 9, 0)));

        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(applications);

        assertTrue(summary.isHired());
        assertEquals(0, summary.getActive(), "HIRED is terminal, so nothing is in flight");
        assertEquals(1, summary.getTotal());
    }

    @Test
    @DisplayName("An application with no submission date does not break the summary")
    void missingSubmittedAt() {
        List<Application> applications = List.of(
                application("a1", "Investment Analyst", ApplicationStatus.SCREENING, null),
                application("a2", "Risk Manager", ApplicationStatus.SCREENING,
                        LocalDateTime.of(2026, 7, 7, 9, 0)));

        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(applications);

        assertEquals(2, summary.getTotal());
        assertEquals(LocalDateTime.of(2026, 7, 7, 9, 0), summary.getLastAppliedAt(),
                "the only real date wins; a null must not be treated as newer");
    }

    @Test
    @DisplayName("Entries carry the job and status a candidate-centric view needs, and no CSS")
    void entriesCarryWhatTheViewNeeds() {
        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(List.of(
                application("a1", "Investment Analyst", ApplicationStatus.OFFER_ACCEPTED,
                        LocalDateTime.of(2026, 8, 20, 9, 0))));

        ApplicantApplicationSummary.Entry entry = summary.getApplications().get(0);

        assertEquals("a1", entry.getId());
        assertEquals("Investment Analyst", entry.getJobTitle());
        assertEquals("Strategic Business Unit", entry.getDepartment());
        assertEquals("OFFER_ACCEPTED", entry.getStatus());
        assertEquals(ApplicationStatus.OFFER_ACCEPTED.getDisplayName(), entry.getStatusDisplayName());
        assertEquals(LocalDateTime.of(2026, 8, 20, 9, 0), entry.getSubmittedAt());
    }

    @Test
    @DisplayName("An application with no status is counted but does not corrupt the breakdown")
    void missingStatus() {
        List<Application> applications = List.of(
                application("a1", "Investment Analyst", null, LocalDateTime.of(2026, 8, 1, 9, 0)),
                application("a2", "Risk Manager", ApplicationStatus.SCREENING,
                        LocalDateTime.of(2026, 8, 2, 9, 0)));

        ApplicantApplicationSummary summary = ApplicantApplicationSummary.from(applications);

        assertEquals(2, summary.getTotal(), "it is still an application");
        assertEquals(1, summary.getActive());
        assertEquals(1, summary.getByStatus().size(), "no null key in the breakdown");
        assertEquals(1, summary.getByStatus().get("SCREENING"));
    }
}
