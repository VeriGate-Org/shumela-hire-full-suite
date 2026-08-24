package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequisitionSummaryResponseTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 8, 24, 12, 0);

    private static Requisition req(String id, LocalDateTime updatedAt) {
        Requisition requisition = new Requisition();
        requisition.setId(id);
        requisition.setCreatedAt(updatedAt);
        requisition.setUpdatedAt(updatedAt);
        return requisition;
    }

    private static Map<RequisitionStatus, List<Requisition>> byStatus(RequisitionStatus status,
                                                                      List<Requisition> items) {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(status, items);
        return map;
    }

    @Test
    @DisplayName("Every status appears, including the ones holding nothing")
    void everyStatusIsReported() {
        RequisitionSummaryResponse summary =
                RequisitionSummaryResponse.from(new EnumMap<>(RequisitionStatus.class), NOW);

        // A status that vanishes on a quiet week and returns later reads as a bug, so the filter
        // row needs to know it exists and is empty.
        assertEquals(RequisitionStatus.values().length, summary.getCountsByStatus().size());
        for (RequisitionStatus status : RequisitionStatus.values()) {
            assertEquals(0L, summary.getCountsByStatus().get(status.name()), status.name());
        }
        assertEquals(0, summary.getTotal());
    }

    @Test
    @DisplayName("Total is every requisition, not only the ones awaiting a decision")
    void totalCountsEverything() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.PENDING_HR_APPROVAL, List.of(req("a", NOW.minusDays(3))));
        map.put(RequisitionStatus.APPROVED, List.of(req("b", NOW.minusDays(30)), req("c", NOW.minusDays(40))));
        map.put(RequisitionStatus.REJECTED, List.of(req("d", NOW.minusDays(9))));

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(map, NOW);

        assertEquals(4, summary.getTotal());
        assertEquals(1, summary.getAwaitingDecision());
    }

    @Test
    @DisplayName("Awaiting a decision spans every pending status, not just one")
    void awaitingSpansAllPendingStatuses() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.SUBMITTED, List.of(req("a", NOW.minusDays(1))));
        map.put(RequisitionStatus.PENDING_HR_APPROVAL, List.of(req("b", NOW.minusDays(2))));
        map.put(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL, List.of(req("c", NOW.minusDays(3))));

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(map, NOW);

        assertEquals(3, summary.getAwaitingDecision());
    }

    @Test
    @DisplayName("The oldest wait is the longest-waiting undecided requisition, and names it")
    void oldestWaitingIsFound() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.PENDING_HR_APPROVAL,
                List.of(req("recent", NOW.minusDays(2)), req("stale", NOW.minusDays(19))));
        map.put(RequisitionStatus.PENDING_EXECUTIVE_APPROVAL, List.of(req("middling", NOW.minusDays(11))));

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(map, NOW);

        assertEquals("stale", summary.getOldestWaitingId(), "so a caller can link straight to it");
        assertEquals(19L, summary.getOldestWaitingDays());
    }

    @Test
    @DisplayName("A settled requisition never counts as the oldest wait, however old it is")
    void settledRecordsAreNotWaiting() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.APPROVED, List.of(req("ancient", NOW.minusDays(400))));
        map.put(RequisitionStatus.PENDING_HR_APPROVAL, List.of(req("waiting", NOW.minusDays(4))));

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(map, NOW);

        assertEquals("waiting", summary.getOldestWaitingId());
        assertEquals(4L, summary.getOldestWaitingDays());
    }

    @Test
    @DisplayName("With nothing pending, the oldest wait is absent rather than zero")
    void noPendingMeansNoOldestWait() {
        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(
                byStatus(RequisitionStatus.APPROVED, List.of(req("a", NOW.minusDays(5)))), NOW);

        assertNull(summary.getOldestWaitingDays(), "nothing waiting is not a wait of zero days");
        assertNull(summary.getOldestWaitingId());
    }

    @Test
    @DisplayName("A requisition updated in the future does not report a negative wait")
    void futureTimestampsClampToZero() {
        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(
                byStatus(RequisitionStatus.PENDING_HR_APPROVAL, List.of(req("a", NOW.plusDays(3)))), NOW);

        assertEquals(0L, summary.getOldestWaitingDays());
    }

    @Test
    @DisplayName("A requisition with no updatedAt falls back to when it was raised")
    void fallsBackToCreatedAt() {
        Requisition requisition = new Requisition();
        requisition.setId("a");
        requisition.setCreatedAt(NOW.minusDays(6));
        requisition.setUpdatedAt(null);

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(
                byStatus(RequisitionStatus.PENDING_HR_APPROVAL, List.of(requisition)), NOW);

        assertEquals(6L, summary.getOldestWaitingDays());
    }

    @Test
    @DisplayName("A requisition raised today has waited zero days, which is a real answer")
    void freshlyRaisedWaitsZeroDays() {
        // Requisition field-initialises createdAt to now(), so a record is never genuinely undated
        // in normal use — a brand new one legitimately reports a wait of zero.
        Requisition justRaised = new Requisition();
        justRaised.setId("fresh");
        justRaised.setCreatedAt(NOW);
        justRaised.setUpdatedAt(NOW);

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(
                byStatus(RequisitionStatus.PENDING_HR_APPROVAL, List.of(justRaised)), NOW);

        assertEquals(1, summary.getAwaitingDecision());
        assertEquals(0L, summary.getOldestWaitingDays());
        assertEquals("fresh", summary.getOldestWaitingId());
    }

    @Test
    @DisplayName("A record whose timestamps are both null is counted but cannot be ranked")
    void undatedRecordsAreCountedNotRanked() {
        // Defensive: the entity initialises createdAt, but a record read back from storage with
        // both timestamps missing must not be treated as having waited zero days — that would put
        // a record of unknown age at the front of a queue sorted by longest wait.
        Requisition undated = new Requisition();
        undated.setId("undated");
        undated.setCreatedAt(null);
        undated.setUpdatedAt(null);

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(
                byStatus(RequisitionStatus.PENDING_HR_APPROVAL, List.of(undated)), NOW);

        assertEquals(1, summary.getAwaitingDecision(), "it is still awaiting a decision");
        assertNull(summary.getOldestWaitingDays(), "but its wait is unknown, not zero");
    }

    private static Requisition approvedAfter(String id, long days) {
        Requisition requisition = new Requisition();
        requisition.setId(id);
        requisition.setCreatedAt(NOW.minusDays(days));
        requisition.setUpdatedAt(NOW);
        return requisition;
    }

    @Test
    @DisplayName("Median time to approval is a duration some requisition actually took")
    void medianIsARealDuration() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.APPROVED, List.of(
                approvedAfter("a", 4), approvedAfter("b", 8), approvedAfter("c", 40)));

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(map, NOW);

        // The 40-day outlier would drag a mean to 17; the median stays where requisitions live.
        assertEquals(8L, summary.getMedianDaysToApproval());
    }

    @Test
    @DisplayName("With nothing approved, there is no typical time rather than a time of zero")
    void medianAbsentWhenNothingApproved() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.PENDING_HR_APPROVAL, List.of(req("a", NOW.minusDays(3))));

        assertNull(RequisitionSummaryResponse.from(map, NOW).getMedianDaysToApproval());
    }

    @Test
    @DisplayName("An approved requisition missing a timestamp is excluded, not counted as zero days")
    void medianExcludesUndatedRecords() {
        Requisition undated = new Requisition();
        undated.setId("undated");
        undated.setCreatedAt(null);
        undated.setUpdatedAt(NOW);

        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.APPROVED, List.of(undated, approvedAfter("a", 9)));

        // Were the undated record counted as zero, the median would drop to 0.
        assertEquals(9L, RequisitionSummaryResponse.from(map, NOW).getMedianDaysToApproval());
    }

    @Test
    @DisplayName("Only approved requisitions count toward time to approval")
    void medianIgnoresOtherStatuses() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.APPROVED, List.of(approvedAfter("a", 6)));
        map.put(RequisitionStatus.REJECTED, List.of(approvedAfter("r", 90)));
        map.put(RequisitionStatus.DRAFT, List.of(approvedAfter("d", 120)));

        assertEquals(6L, RequisitionSummaryResponse.from(map, NOW).getMedianDaysToApproval());
    }

    @Test
    @DisplayName("Draft is counted in the total but is not awaiting anyone")
    void draftIsNotAwaitingADecision() {
        Map<RequisitionStatus, List<Requisition>> map = new EnumMap<>(RequisitionStatus.class);
        map.put(RequisitionStatus.DRAFT, List.of(req("d1", NOW.minusDays(50))));

        RequisitionSummaryResponse summary = RequisitionSummaryResponse.from(map, NOW);

        assertEquals(1, summary.getTotal());
        assertEquals(0, summary.getAwaitingDecision(), "nobody owes a decision on an unsubmitted draft");
        assertNull(summary.getOldestWaitingDays());
        assertTrue(summary.getCountsByStatus().get("DRAFT") == 1L);
    }
}
