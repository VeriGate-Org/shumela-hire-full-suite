package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Counts across the salary recommendations.
 *
 * <p>What these pin is the comparison the row could never make: a recommendation that exceeds the
 * ceiling its own requester proposed. Four amounts read down a row do not surface it.
 */
class SalaryRecommendationSummaryResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 25, 12, 0);

    private static SalaryRecommendation rec(SalaryRecommendationStatus status,
                                            String min, String max, String recommended,
                                            String target) {
        SalaryRecommendation rec = new SalaryRecommendation();
        rec.setStatus(status);
        rec.setRecommendationNumber("SR-TEST");
        if (min != null) rec.setProposedMinSalary(new BigDecimal(min));
        if (max != null) rec.setProposedMaxSalary(new BigDecimal(max));
        if (recommended != null) rec.setRecommendedSalary(new BigDecimal(recommended));
        if (target != null) rec.setProposedTargetSalary(new BigDecimal(target));
        rec.setUpdatedAt(NOW.minusDays(1));
        return rec;
    }

    @Test
    @DisplayName("A recommendation above its own proposed ceiling is counted")
    void aboveBandIsCounted() {
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.PENDING_APPROVAL, "900000", "1450000", "1480000", "1200000"),
                rec(SalaryRecommendationStatus.PENDING_APPROVAL, "900000", "1100000", "1020000", "1000000")),
                NOW);

        assertEquals(1, summary.getAboveProposedBand());
        assertEquals(0, summary.getBelowProposedBand());
    }

    @Test
    @DisplayName("Below the proposed floor is counted separately, not lumped in")
    void belowBandIsItsOwnCount() {
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.RECOMMENDED, "900000", "1100000", "800000", "1000000")),
                NOW);

        assertEquals(1, summary.getBelowProposedBand());
        assertEquals(0, summary.getAboveProposedBand());
    }

    @Test
    @DisplayName("A recommendation with no ceiling cannot be above it")
    void missingBoundIsNotABreach() {
        // Guessing a ceiling from the target would invent the very comparison this exists for.
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.RECOMMENDED, null, null, "5000000", "1000000")),
                NOW);

        assertEquals(0, summary.getAboveProposedBand());
        assertEquals(0, summary.getBelowProposedBand());
    }

    @Test
    @DisplayName("Nothing is above band before a number has been recommended")
    void unrecommendedIsNotCompared() {
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.PENDING_REVIEW, "620000", "800000", null, "700000")),
                NOW);

        assertEquals(0, summary.getAboveProposedBand());
    }

    @Test
    @DisplayName("Total proposed covers live recommendations only")
    void totalCoversLiveOnly() {
        // Rejected and implemented are endings; neither is still being decided, so neither belongs
        // in a total of what is on the table.
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.PENDING_REVIEW, null, null, null, "1000000"),
                rec(SalaryRecommendationStatus.RETURNED, null, null, null, "500000"),
                rec(SalaryRecommendationStatus.REJECTED, null, null, null, "9000000"),
                rec(SalaryRecommendationStatus.IMPLEMENTED, null, null, null, "9000000")),
                NOW);

        assertEquals(new BigDecimal("1500000"), summary.getTotalProposed());
        assertEquals(2, summary.getLive());
    }

    @Test
    @DisplayName("No live target reports no total rather than R0")
    void absentTotalIsNullNotZero() {
        // A finance reviewer reading "R 0" would draw the wrong conclusion entirely.
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.PENDING_REVIEW, null, null, null, null)),
                NOW);

        assertNull(summary.getTotalProposed());
        assertEquals(1, summary.getLiveWithoutTarget());
    }

    @Test
    @DisplayName("Returned recommendations are counted — they can exist now")
    void returnedIsCounted() {
        // Permanently zero until the return-for-rework transition was added, because nothing in the
        // product could set the status.
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.RETURNED, null, null, null, "100000"),
                rec(SalaryRecommendationStatus.RETURNED, null, null, null, "200000")),
                NOW);

        assertEquals(2, summary.getReturned());
    }

    @Test
    @DisplayName("Every status appears, including the empty ones")
    void everyStatusAppears() {
        var summary = SalaryRecommendationSummaryResponse.from(List.of(
                rec(SalaryRecommendationStatus.DRAFT, null, null, null, null)), NOW);

        assertEquals(SalaryRecommendationStatus.values().length, summary.getCountsByStatus().size());
        assertEquals(0L, summary.getCountsByStatus().get(SalaryRecommendationStatus.IMPLEMENTED.name()));
        assertEquals(1L, summary.getCountsByStatus().get(SalaryRecommendationStatus.DRAFT.name()));
    }

    @Test
    @DisplayName("The wait on an approval is measured from when it was recommended")
    void approvalWaitStartsAtRecommendation() {
        // The review time before that belonged to somebody else, and charging it to the approver
        // makes every approval look slow.
        SalaryRecommendation awaiting = rec(SalaryRecommendationStatus.PENDING_APPROVAL,
                null, null, "1000000", "1000000");
        awaiting.setCreatedAt(NOW.minusDays(40));
        awaiting.setRecommendedAt(NOW.minusDays(12));
        awaiting.setUpdatedAt(NOW.minusDays(12));

        var summary = SalaryRecommendationSummaryResponse.from(List.of(awaiting), NOW);

        assertEquals(12L, summary.getOldestWaitingDays());
    }

    @Test
    @DisplayName("Only things actually waiting count towards the longest wait")
    void finishedItemsDoNotWait() {
        SalaryRecommendation old = rec(SalaryRecommendationStatus.IMPLEMENTED, null, null, null, null);
        old.setUpdatedAt(NOW.minusDays(400));

        var summary = SalaryRecommendationSummaryResponse.from(List.of(old), NOW);

        assertNull(summary.getOldestWaitingDays());
        assertNull(summary.getOldestWaitingRef());
    }

    @Test
    @DisplayName("An empty set reports nothing rather than zeroes with meaning")
    void emptySet() {
        var summary = SalaryRecommendationSummaryResponse.from(List.of(), NOW);

        assertEquals(0, summary.getTotal());
        assertNull(summary.getTotalProposed());
        assertNull(summary.getOldestWaitingDays());
        assertEquals(SalaryRecommendationStatus.values().length, summary.getCountsByStatus().size());
    }
}
