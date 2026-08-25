package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Applicant;
import com.arthmatic.shumelahire.entity.Application;
import com.arthmatic.shumelahire.entity.ApplicationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Whole-set counts for the applicant base.
 *
 * <p>What these pin is the segment the page exists for — people who keep coming back — and the
 * arithmetic that has to hold for the strip to be believable: every registered applicant is in
 * exactly one of never-applied, applied-once and repeat.
 */
class ApplicantSummaryResponseTest {

    private static Application application(String applicantId, ApplicationStatus status) {
        Applicant applicant = new Applicant();
        applicant.setId(applicantId);

        Application application = new Application();
        application.setApplicant(applicant);
        application.setStatus(status);
        return application;
    }

    @Test
    @DisplayName("Every registered applicant lands in exactly one of the three volume segments")
    void segmentsPartitionTheBase() {
        var summary = ApplicantSummaryResponse.from(
                Set.of("never", "once", "twice", "thrice"),
                List.of(
                        application("once", ApplicationStatus.SUBMITTED),
                        application("twice", ApplicationStatus.REJECTED),
                        application("twice", ApplicationStatus.SUBMITTED),
                        application("thrice", ApplicationStatus.REJECTED),
                        application("thrice", ApplicationStatus.REJECTED),
                        application("thrice", ApplicationStatus.HIRED)));

        assertEquals(4, summary.getRegistered());
        assertEquals(1, summary.getNeverApplied());
        assertEquals(1, summary.getAppliedOnce());
        assertEquals(2, summary.getRepeatApplicants());
        // The whole point of the strip: the parts account for the whole.
        assertEquals(summary.getRegistered(),
                summary.getNeverApplied() + summary.getAppliedOnce() + summary.getRepeatApplicants());
        assertEquals(6, summary.getApplicationsRecorded());
    }

    @Test
    @DisplayName("An applicant with nothing live is not counted as in process")
    void inProcessFollowsTheStatusPredicate() {
        var summary = ApplicantSummaryResponse.from(
                Set.of("live", "done"),
                List.of(
                        application("live", ApplicationStatus.SUBMITTED),
                        application("done", ApplicationStatus.REJECTED),
                        application("done", ApplicationStatus.REJECTED)));

        // Uses ApplicationStatus.isActive() rather than a restated list, so this cannot drift from
        // the per-applicant summary shown on the rows underneath.
        assertEquals(1, summary.getInProcessNow());
    }

    @Test
    @DisplayName("An applicant is counted once however many times they are in process")
    void inProcessCountsPeopleNotApplications() {
        var summary = ApplicantSummaryResponse.from(
                Set.of("busy"),
                List.of(
                        application("busy", ApplicationStatus.SUBMITTED),
                        application("busy", ApplicationStatus.SUBMITTED),
                        application("busy", ApplicationStatus.SUBMITTED)));

        assertEquals(1, summary.getInProcessNow());
        assertEquals(1, summary.getRepeatApplicants());
        assertEquals(3, summary.getApplicationsRecorded());
    }

    @Test
    @DisplayName("Previously hired overlaps the other segments rather than excluding them")
    void hiredIsNotMutuallyExclusive() {
        // Someone hired last year and applying again now is both hired and in process. Treating
        // these as exclusive buckets would lose exactly the person the page is looking for.
        var summary = ApplicantSummaryResponse.from(
                Set.of("returner"),
                List.of(
                        application("returner", ApplicationStatus.HIRED),
                        application("returner", ApplicationStatus.SUBMITTED)));

        assertEquals(1, summary.getPreviouslyHired());
        assertEquals(1, summary.getInProcessNow());
        assertEquals(1, summary.getRepeatApplicants());
    }

    @Test
    @DisplayName("An applicant base with no applications at all is all never-applied")
    void emptyApplicationSet() {
        var summary = ApplicantSummaryResponse.from(Set.of("a", "b", "c"), List.of());

        assertEquals(3, summary.getRegistered());
        assertEquals(3, summary.getNeverApplied());
        assertEquals(0, summary.getApplicationsRecorded());
    }

    @Test
    @DisplayName("No applicants and no applications reports zeroes, not a crash")
    void emptyEverything() {
        var summary = ApplicantSummaryResponse.from(Set.of(), List.of());

        assertEquals(0, summary.getRegistered());
        assertEquals(0, summary.getNeverApplied());
        assertEquals(0, summary.getOrphanedApplications());
    }

    @Test
    @DisplayName("An application belonging to a deleted applicant is reported, not absorbed")
    void orphanedApplicationsAreSurfaced() {
        // Subtracting to get "never applied" would have silently produced a negative here and been
        // clamped to zero, turning a data fault into a healthy-looking tenant.
        var summary = ApplicantSummaryResponse.from(
                Set.of("still-here"),
                List.of(
                        application("still-here", ApplicationStatus.SUBMITTED),
                        application("deleted", ApplicationStatus.REJECTED),
                        application("deleted", ApplicationStatus.REJECTED)));

        assertEquals(1, summary.getRegistered());
        assertEquals(1, summary.getAppliedOnce());
        assertEquals(0, summary.getRepeatApplicants());
        assertEquals(0, summary.getNeverApplied());
        assertEquals(2, summary.getOrphanedApplications());
        // Still counted as applications that happened.
        assertEquals(3, summary.getApplicationsRecorded());
    }

    @Test
    @DisplayName("An application naming no applicant counts as orphaned rather than throwing")
    void nullApplicantIsOrphaned() {
        Application unattached = new Application();
        unattached.setStatus(ApplicationStatus.SUBMITTED);

        var summary = ApplicantSummaryResponse.from(Set.of("a"), List.of(unattached));

        assertEquals(1, summary.getOrphanedApplications());
        assertEquals(1, summary.getApplicationsRecorded());
        assertEquals(1, summary.getNeverApplied());
    }

    @Test
    @DisplayName("An application with no status still counts towards how often someone applied")
    void missingStatusStillCounts() {
        var summary = ApplicantSummaryResponse.from(
                Set.of("a"),
                List.of(application("a", null), application("a", ApplicationStatus.SUBMITTED)));

        assertEquals(1, summary.getRepeatApplicants());
        assertEquals(1, summary.getInProcessNow());
        assertEquals(0, summary.getPreviouslyHired());
    }
}
