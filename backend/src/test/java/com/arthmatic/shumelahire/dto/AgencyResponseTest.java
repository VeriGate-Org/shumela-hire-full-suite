package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.AgencyProfile;
import com.arthmatic.shumelahire.entity.AgencyStatus;
import com.arthmatic.shumelahire.entity.AgencySubmission;
import com.arthmatic.shumelahire.entity.AgencySubmissionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Whether an agency's contract has actually ended.
 *
 * <p>{@code contractEndDate} is stored, editable, and compared to the current date nowhere in the
 * codebase. These pin the derivation, and in particular that lapse is only meaningful for an
 * approved agency — there is no {@code EXPIRED} in {@link AgencyStatus}.
 */
class AgencyResponseTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 8, 25);

    private static AgencyProfile agency(AgencyStatus status, LocalDate contractEnd) {
        AgencyProfile agency = new AgencyProfile();
        agency.setId("a1");
        agency.setAgencyName("Sasekile Talent Partners");
        agency.setStatus(status);
        agency.setContractEndDate(contractEnd);
        return agency;
    }

    private static AgencySubmission submission(AgencySubmissionStatus status,
                                               LocalDateTime submittedAt,
                                               LocalDateTime reviewedAt) {
        AgencySubmission submission = new AgencySubmission();
        submission.setStatus(status);
        submission.setSubmittedAt(submittedAt);
        submission.setReviewedAt(reviewedAt);
        return submission;
    }

    @Test
    @DisplayName("An approved agency past its end date is lapsed, and the days are counted")
    void lapsedIsDerived() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.minusDays(24)), List.of(), TODAY);

        assertEquals(AgencyResponse.ContractState.LAPSED, response.getContractState());
        assertEquals(24L, response.getDaysSinceLapse());
        assertNull(response.getDaysUntilExpiry());
    }

    @Test
    @DisplayName("A contract ending inside the warning window is a renewal decision, not a lapse")
    void expiringSoonIsSeparate() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(37)), List.of(), TODAY);

        assertEquals(AgencyResponse.ContractState.EXPIRING_SOON, response.getContractState());
        assertEquals(37L, response.getDaysUntilExpiry());
        assertNull(response.getDaysSinceLapse());
    }

    @Test
    @DisplayName("A contract ending today has not lapsed yet")
    void endingTodayIsStillLive() {
        // The contract runs to the end of its last day. Calling it lapsed on the morning of the
        // final day would block an agency that is still entitled to submit.
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY), List.of(), TODAY);

        assertEquals(AgencyResponse.ContractState.EXPIRING_SOON, response.getContractState());
        assertEquals(0L, response.getDaysUntilExpiry());
    }

    @Test
    @DisplayName("No end date is its own state, not quietly treated as in contract")
    void noEndDateIsReported() {
        // contractEndDate is optional, so an agency can sit on the panel indefinitely and never
        // appear in any expiry check. Worth deciding whether that should be allowed.
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, null), List.of(), TODAY);

        assertEquals(AgencyResponse.ContractState.NO_END_DATE, response.getContractState());
        assertNull(response.getDaysUntilExpiry());
        assertNull(response.getDaysSinceLapse());
    }

    @Test
    @DisplayName("Only an approved agency can be in or out of contract")
    void statusOutranksTheDate() {
        // Reporting a suspended agency as "lapsed" would bury the reason it cannot submit.
        assertEquals(AgencyResponse.ContractState.SUSPENDED,
                AgencyResponse.from(agency(AgencyStatus.SUSPENDED, TODAY.minusDays(300)),
                        List.of(), TODAY).getContractState());
        assertEquals(AgencyResponse.ContractState.TERMINATED,
                AgencyResponse.from(agency(AgencyStatus.TERMINATED, TODAY.plusDays(300)),
                        List.of(), TODAY).getContractState());
        assertEquals(AgencyResponse.ContractState.PENDING_APPROVAL,
                AgencyResponse.from(agency(AgencyStatus.PENDING_APPROVAL, TODAY.plusDays(300)),
                        List.of(), TODAY).getContractState());
    }

    @Test
    @DisplayName("Submissions arriving after the contract ended are counted — the exposure")
    void submissionsSinceLapseAreCounted() {
        // Not "this contract lapsed" but "candidates have been put forward since it did". A
        // placement made under a lapsed contract has no agreed fee.
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.minusDays(70)),
                List.of(
                        submission(AgencySubmissionStatus.SUBMITTED, TODAY.minusDays(100).atStartOfDay(), null),
                        submission(AgencySubmissionStatus.SUBMITTED, TODAY.minusDays(40).atStartOfDay(), null),
                        submission(AgencySubmissionStatus.ACCEPTED, TODAY.minusDays(10).atStartOfDay(),
                                TODAY.minusDays(8).atStartOfDay())),
                TODAY);

        assertEquals(2L, response.getSubmissionsSinceLapse());
        assertEquals(3, response.getTotalSubmissions());
    }

    @Test
    @DisplayName("An agency still in contract has no since-lapse figure at all")
    void noLapseNoFigure() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(200)),
                List.of(submission(AgencySubmissionStatus.SUBMITTED, TODAY.minusDays(3).atStartOfDay(), null)),
                TODAY);

        assertNull(response.getSubmissionsSinceLapse());
    }

    @Test
    @DisplayName("Placement rate is accepted over total")
    void placementRateIsComputed() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(100)),
                List.of(
                        submission(AgencySubmissionStatus.ACCEPTED, TODAY.minusDays(30).atStartOfDay(),
                                TODAY.minusDays(28).atStartOfDay()),
                        submission(AgencySubmissionStatus.REJECTED, TODAY.minusDays(30).atStartOfDay(),
                                TODAY.minusDays(29).atStartOfDay()),
                        submission(AgencySubmissionStatus.REJECTED, TODAY.minusDays(30).atStartOfDay(),
                                TODAY.minusDays(27).atStartOfDay()),
                        submission(AgencySubmissionStatus.REJECTED, TODAY.minusDays(30).atStartOfDay(),
                                TODAY.minusDays(26).atStartOfDay())),
                TODAY);

        assertEquals(25.0, response.getPlacementRate());
        assertEquals(1, response.getAcceptedSubmissions());
    }

    @Test
    @DisplayName("An agency that has never submitted has no placement rate, rather than 0%")
    void noSubmissionsMeansNoRate() {
        // The dashboard returned 0 here, which ranks a brand-new agency alongside one that has sent
        // twenty-two candidates and placed two.
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(100)), List.of(), TODAY);

        assertNull(response.getPlacementRate());
        assertEquals(0, response.getTotalSubmissions());
    }

    @Test
    @DisplayName("A genuine nought-percent is reported as nought, not as absent")
    void zeroPlacementsIsAFigure() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(100)),
                List.of(submission(AgencySubmissionStatus.REJECTED, TODAY.minusDays(9).atStartOfDay(),
                        TODAY.minusDays(8).atStartOfDay())),
                TODAY);

        assertEquals(0.0, response.getPlacementRate());
    }

    @Test
    @DisplayName("Unreviewed submissions count towards review time, at how long they have waited")
    void openSubmissionsAreNotExcludedFromTheMedian() {
        // Excluding them would mean an agency whose candidates are never looked at reports the
        // fastest review time on the panel.
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(100)),
                List.of(
                        submission(AgencySubmissionStatus.ACCEPTED, TODAY.minusDays(20).atStartOfDay(),
                                TODAY.minusDays(19).atStartOfDay()),
                        submission(AgencySubmissionStatus.SUBMITTED, TODAY.minusDays(60).atStartOfDay(), null),
                        submission(AgencySubmissionStatus.SUBMITTED, TODAY.minusDays(40).atStartOfDay(), null)),
                TODAY);

        // Contributions are 1, 60 and 40 — the median of which is 40, not the 1 day the single
        // reviewed submission would have reported on its own.
        assertEquals(40L, response.getMedianReviewDays());
        assertEquals(2, response.getAwaitingReview());
        assertEquals(60L, response.getOldestAwaitingDays());
    }

    @Test
    @DisplayName("A withdrawn submission is not owed a review and does not skew the wait")
    void withdrawnSubmissionsAreNotOpen() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(100)),
                List.of(
                        submission(AgencySubmissionStatus.WITHDRAWN, TODAY.minusDays(400).atStartOfDay(), null),
                        submission(AgencySubmissionStatus.ACCEPTED, TODAY.minusDays(10).atStartOfDay(),
                                TODAY.minusDays(7).atStartOfDay())),
                TODAY);

        assertEquals(0, response.getAwaitingReview());
        assertEquals(3L, response.getMedianReviewDays());
        assertNull(response.getOldestAwaitingDays());
    }

    @Test
    @DisplayName("A submission with no timestamp still counts as a submission")
    void missingTimestampStillCounts() {
        var response = AgencyResponse.from(
                agency(AgencyStatus.APPROVED, TODAY.plusDays(100)),
                List.of(submission(AgencySubmissionStatus.ACCEPTED, null, null)),
                TODAY);

        assertEquals(1, response.getTotalSubmissions());
        assertEquals(100.0, response.getPlacementRate());
        // It can say nothing about how long a review took.
        assertNull(response.getMedianReviewDays());
    }

    @Test
    @DisplayName("No rand figure is returned anywhere")
    void noRandFigureIsInvented() {
        // Cost of a placement needs feePercentage against the placed candidate's offer salary. Both
        // exist, in different aggregates, with no join. Asserted so adding one means deleting a test.
        var names = java.util.Arrays.stream(AgencyResponse.class.getMethods())
                .map(java.lang.reflect.Method::getName)
                .filter(name -> name.contains("Cost") || name.contains("Value") || name.contains("Amount"))
                .toList();

        assertEquals(List.of(), names);
    }
}
