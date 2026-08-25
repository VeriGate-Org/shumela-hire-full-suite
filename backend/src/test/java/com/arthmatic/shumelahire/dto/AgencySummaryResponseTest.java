package com.arthmatic.shumelahire.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Counts across the panel.
 *
 * <p>The figure these exist for is <b>submissions received on lapsed contracts</b> — the exposure
 * stated in the unit that matters.
 */
class AgencySummaryResponseTest {

    private static AgencyResponse agency(String id, AgencyResponse.ContractState state) {
        AgencyResponse agency = new AgencyResponse();
        agency.setId(id);
        agency.setContractState(state);
        return agency;
    }

    private static AgencyResponse lapsed(String id, long daysSince, long submissionsSince) {
        AgencyResponse agency = agency(id, AgencyResponse.ContractState.LAPSED);
        agency.setDaysSinceLapse(daysSince);
        agency.setSubmissionsSinceLapse(submissionsSince);
        return agency;
    }

    @Test
    @DisplayName("Submissions on lapsed contracts are totalled — the exposure, not the count of contracts")
    void submissionsOnLapsedContractsAreTotalled() {
        var summary = AgencySummaryResponse.from(List.of(
                lapsed("a", 24, 9),
                lapsed("b", 70, 2),
                agency("c", AgencyResponse.ContractState.IN_CONTRACT)));

        assertEquals(2, summary.getLapsed());
        assertEquals(11, summary.getSubmissionsOnLapsedContracts());
    }

    @Test
    @DisplayName("An expiring contract is still a live contract")
    void expiringSoonCountsAsInContract() {
        // The warning is about the renewal decision owed, not about the agency having stopped being
        // able to work. Counting it out of "in contract" would understate the working panel.
        var summary = AgencySummaryResponse.from(List.of(
                agency("a", AgencyResponse.ContractState.EXPIRING_SOON),
                agency("b", AgencyResponse.ContractState.IN_CONTRACT)));

        assertEquals(1, summary.getExpiringSoon());
        assertEquals(2, summary.getInContract());
    }

    @Test
    @DisplayName("An agency with no end date is its own count, not folded into in-contract")
    void noEndDateIsCountedSeparately() {
        var summary = AgencySummaryResponse.from(List.of(
                agency("a", AgencyResponse.ContractState.NO_END_DATE),
                agency("b", AgencyResponse.ContractState.IN_CONTRACT)));

        assertEquals(1, summary.getNoEndDate());
        assertEquals(1, summary.getInContract());
    }

    @Test
    @DisplayName("The worst lapse is named so it can be acted on")
    void longestLapseIsIdentified() {
        var summary = AgencySummaryResponse.from(List.of(
                lapsed("recent", 24, 9),
                lapsed("worst", 70, 2)));

        assertEquals("worst", summary.getLongestLapsedAgencyId());
        assertEquals(70L, summary.getLongestLapsedDays());
    }

    @Test
    @DisplayName("Panel review time is the median of the agencies, not of every submission")
    void medianIsAcrossAgencies() {
        // Otherwise a single high-volume agency speaks for how the whole panel is treated.
        AgencyResponse fast = agency("fast", AgencyResponse.ContractState.IN_CONTRACT);
        fast.setMedianReviewDays(2L);
        AgencyResponse middling = agency("middling", AgencyResponse.ContractState.IN_CONTRACT);
        middling.setMedianReviewDays(9L);
        AgencyResponse slow = agency("slow", AgencyResponse.ContractState.IN_CONTRACT);
        slow.setMedianReviewDays(40L);

        var summary = AgencySummaryResponse.from(List.of(fast, middling, slow));

        assertEquals(9L, summary.getMedianReviewDays());
    }

    @Test
    @DisplayName("An agency that has never submitted does not drag the panel median to zero")
    void agenciesWithNoSubmissionsAreExcludedFromTheMedian() {
        AgencyResponse active = agency("active", AgencyResponse.ContractState.IN_CONTRACT);
        active.setMedianReviewDays(9L);
        AgencyResponse silent = agency("silent", AgencyResponse.ContractState.IN_CONTRACT);

        var summary = AgencySummaryResponse.from(List.of(active, silent));

        assertEquals(9L, summary.getMedianReviewDays());
        assertEquals(2, summary.getAgencies());
    }

    @Test
    @DisplayName("Nothing submitted anywhere reports no median rather than a zero")
    void noSubmissionsNoMedian() {
        var summary = AgencySummaryResponse.from(List.of(
                agency("a", AgencyResponse.ContractState.IN_CONTRACT)));

        assertNull(summary.getMedianReviewDays());
    }

    @Test
    @DisplayName("Every state is counted, including the ones that cannot submit")
    void everyStateIsCounted() {
        var summary = AgencySummaryResponse.from(List.of(
                agency("a", AgencyResponse.ContractState.SUSPENDED),
                agency("b", AgencyResponse.ContractState.TERMINATED),
                agency("c", AgencyResponse.ContractState.PENDING_APPROVAL)));

        assertEquals(1, summary.getSuspended());
        assertEquals(1, summary.getTerminated());
        assertEquals(1, summary.getPendingApproval());
        assertEquals(3, summary.getAgencies());
    }

    @Test
    @DisplayName("An empty panel reports zeroes and no lapse")
    void emptyPanel() {
        var summary = AgencySummaryResponse.from(List.of());

        assertEquals(0, summary.getAgencies());
        assertEquals(0, summary.getSubmissionsOnLapsedContracts());
        assertNull(summary.getLongestLapsedDays());
        assertNull(summary.getLongestLapsedAgencyId());
    }
}
