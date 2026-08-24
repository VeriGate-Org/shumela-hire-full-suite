package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Requisition;
import com.arthmatic.shumelahire.entity.Requisition.RequisitionStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Counts for the whole requisition queue, not for whichever page happens to be loaded.
 *
 * <p>The requisitions list currently computes every tab count and three of its four tiles with
 * {@code requisitions.filter(...)} over the twenty rows in hand. "Pending Approval: 7" means seven
 * <em>on this page</em>; turn to page two and the number changes for no reason a user could
 * explain. This is the endpoint that makes those numbers mean what they appear to mean.
 *
 * <p><b>The pattern, for the pages that copy this.</b> A summary is a separate call from the list.
 * It is not paginated, it never returns records, and every figure on it describes the entire set.
 * Where a figure cannot be computed for the whole set at acceptable cost it is left out rather than
 * approximated from a page — a number that changes when you paginate is worse than no number.
 *
 * <p><b>What it costs here.</b> One index read per status. On the DynamoDB backend
 * {@code countByStatus} runs the same GSI query as fetching and then calls {@code size()}, so
 * counting is not cheaper than reading — which is why this reads each status once and derives both
 * the count and the oldest wait from the same result rather than paying twice.
 */
public class RequisitionSummaryResponse {

    /** Statuses where somebody owes a decision. */
    public static final List<RequisitionStatus> AWAITING_DECISION = List.of(
            RequisitionStatus.SUBMITTED,
            RequisitionStatus.PENDING_HR_APPROVAL,
            RequisitionStatus.PENDING_EXECUTIVE_APPROVAL);

    private Map<String, Long> countsByStatus = new LinkedHashMap<>();
    private long total;
    private long awaitingDecision;

    /** Days the longest-waiting undecided requisition has been sitting, or null if none are. */
    private Long oldestWaitingDays;

    /** That requisition's id, so a caller can link straight to it rather than searching for it. */
    private String oldestWaitingId;

    /**
     * Median days from raised to approved, across every approved requisition.
     *
     * <p>Free to compute: this response already reads every status, so the approved records are
     * in hand. Median rather than mean because one requisition that sat for eight months would
     * drag an average somewhere no real requisition has ever been.
     *
     * <p>Null when nothing has been approved yet — a queue with no completions has no typical
     * time, which is a different statement from "zero days".
     */
    private Long medianDaysToApproval;

    public static RequisitionSummaryResponse from(Map<RequisitionStatus, List<Requisition>> byStatus,
                                                  LocalDateTime now) {
        RequisitionSummaryResponse summary = new RequisitionSummaryResponse();

        Requisition oldest = null;

        for (RequisitionStatus status : RequisitionStatus.values()) {
            List<Requisition> found = byStatus.getOrDefault(status, List.of());
            // Every status appears, including the empty ones. A caller building a filter row needs
            // to know a status exists and holds nothing — otherwise "Rejected" silently disappears
            // on a good week and reappears later, which reads as a bug.
            summary.countsByStatus.put(status.name(), (long) found.size());
            summary.total += found.size();

            if (AWAITING_DECISION.contains(status)) {
                summary.awaitingDecision += found.size();
                for (Requisition requisition : found) {
                    if (waitingSince(requisition) == null) continue;
                    if (oldest == null || waitingSince(requisition).isBefore(waitingSince(oldest))) {
                        oldest = requisition;
                    }
                }
            }
        }

        if (oldest != null) {
            summary.oldestWaitingId = oldest.getId();
            summary.oldestWaitingDays = Math.max(0,
                    Duration.between(waitingSince(oldest), now).toDays());
        }

        summary.medianDaysToApproval = medianDaysToApproval(
                byStatus.getOrDefault(RequisitionStatus.APPROVED, List.of()));

        return summary;
    }

    /**
     * Median days from raised to approved.
     *
     * <p>Uses {@code updatedAt} as the approval moment, which is the closest thing the record has
     * — there is no per-transition timestamp on the requisition itself. That is exact for a
     * requisition approved and then left alone, and overstates one that was edited afterwards.
     * Worth knowing before the figure is quoted anywhere it matters.
     *
     * <p>Records missing either timestamp are excluded rather than counted as zero: a requisition
     * whose duration is unknown must not pull the median toward nothing.
     */
    private static Long medianDaysToApproval(List<Requisition> approved) {
        List<Long> durations = approved.stream()
                .filter(r -> r.getCreatedAt() != null && r.getUpdatedAt() != null)
                .map(r -> Duration.between(r.getCreatedAt(), r.getUpdatedAt()).toDays())
                .filter(days -> days >= 0)
                .sorted()
                .toList();

        if (durations.isEmpty()) {
            return null;
        }
        int middle = durations.size() / 2;
        return durations.size() % 2 == 1
                ? durations.get(middle)
                // Even count: the lower of the two central values rather than their mean, so the
                // figure is always a duration some requisition actually took.
                : durations.get(middle - 1);
    }

    /**
     * When the current wait started.
     *
     * <p>{@code updatedAt} is the closest thing the record has to "entered this status" — there is
     * no per-transition timestamp. It is therefore accurate for the current stage but resets if the
     * requisition is edited for an unrelated reason. A status-history table would make this exact,
     * and is the same gap the requisition detail page has for its dwell bars.
     */
    private static LocalDateTime waitingSince(Requisition requisition) {
        return requisition.getUpdatedAt() != null ? requisition.getUpdatedAt() : requisition.getCreatedAt();
    }

    public Map<String, Long> getCountsByStatus() { return countsByStatus; }
    public void setCountsByStatus(Map<String, Long> countsByStatus) { this.countsByStatus = countsByStatus; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getAwaitingDecision() { return awaitingDecision; }
    public void setAwaitingDecision(long awaitingDecision) { this.awaitingDecision = awaitingDecision; }

    public Long getOldestWaitingDays() { return oldestWaitingDays; }
    public void setOldestWaitingDays(Long oldestWaitingDays) { this.oldestWaitingDays = oldestWaitingDays; }

    public String getOldestWaitingId() { return oldestWaitingId; }
    public void setOldestWaitingId(String oldestWaitingId) { this.oldestWaitingId = oldestWaitingId; }

    public Long getMedianDaysToApproval() { return medianDaysToApproval; }
    public void setMedianDaysToApproval(Long medianDaysToApproval) { this.medianDaysToApproval = medianDaysToApproval; }
}
