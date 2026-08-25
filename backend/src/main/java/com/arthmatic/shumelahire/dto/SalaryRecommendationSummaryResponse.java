package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.SalaryRecommendation;
import com.arthmatic.shumelahire.entity.SalaryRecommendationStatus;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Counts across every salary recommendation.
 *
 * <p>The figure this exists for is <b>above its own band</b>. The record carries a proposed
 * minimum, a proposed maximum and a recommended salary, and nothing compares them. A recommendation
 * that exceeds the ceiling its own requester proposed is the one a reviewer most needs to see, and
 * reading four amounts down a row does not surface it.
 *
 * <p>The second is <b>total proposed</b>. It is the first number a finance reviewer asks for and
 * nothing computes it.
 */
public class SalaryRecommendationSummaryResponse {

    /**
     * Statuses that are still going somewhere.
     *
     * <p>{@code REJECTED} and {@code IMPLEMENTED} are endings — one refused, one already reflected
     * in an offer — so neither belongs in a total of what is still being decided.
     */
    public static final Set<SalaryRecommendationStatus> LIVE = EnumSet.of(
            SalaryRecommendationStatus.DRAFT,
            SalaryRecommendationStatus.PENDING_REVIEW,
            SalaryRecommendationStatus.RECOMMENDED,
            SalaryRecommendationStatus.PENDING_APPROVAL,
            SalaryRecommendationStatus.APPROVED,
            SalaryRecommendationStatus.RETURNED);

    /** Every status, including the ones holding nothing, so a zero is visible as a zero. */
    private Map<String, Long> countsByStatus = new LinkedHashMap<>();

    private long total;

    /** Still being decided — see {@link #LIVE}. */
    private long live;

    /** Waiting on a reviewer to put a number on it. */
    private long awaitingReview;

    /** Recommended and waiting on a signature. */
    private long awaitingApproval;

    /**
     * Sent back and not yet resubmitted.
     *
     * <p>Producible since the return-for-rework transition was added. Before that this was
     * permanently zero, because nothing in the product could set the status.
     */
    private long returned;

    /**
     * Recommended above the requester's own proposed maximum.
     *
     * <p>Counted only where both figures exist. A recommendation with no ceiling proposed cannot be
     * above it, and guessing one from the target would invent the very comparison this is for.
     */
    private long aboveProposedBand;

    /** Recommended below the requester's own proposed minimum. Rarer, and equally worth seeing. */
    private long belowProposedBand;

    /**
     * Sum of {@code proposedTargetSalary} across live recommendations.
     *
     * <p>Null when no live recommendation carries a target — a total of nothing is not zero rands,
     * it is an absent figure, and a finance reviewer reading "R 0" would draw the wrong conclusion.
     */
    private BigDecimal totalProposed;

    /** Live recommendations with no proposed target, and so excluded from {@link #totalProposed}. */
    private long liveWithoutTarget;

    /** Days the longest-waiting recommendation has been awaiting review or approval. */
    private Long oldestWaitingDays;

    /** That recommendation's number, so a caller can go straight to it. */
    private String oldestWaitingRef;

    public static SalaryRecommendationSummaryResponse from(List<SalaryRecommendation> all,
                                                           LocalDateTime now) {
        SalaryRecommendationSummaryResponse summary = new SalaryRecommendationSummaryResponse();

        for (SalaryRecommendationStatus status : SalaryRecommendationStatus.values()) {
            summary.countsByStatus.put(status.name(), 0L);
        }
        if (all == null || all.isEmpty()) {
            return summary;
        }

        BigDecimal proposed = null;
        LocalDateTime oldestWaitingSince = null;

        for (SalaryRecommendation rec : all) {
            summary.total++;

            SalaryRecommendationStatus status = rec.getStatus();
            if (status == null) {
                continue;
            }
            summary.countsByStatus.merge(status.name(), 1L, Long::sum);

            if (status == SalaryRecommendationStatus.PENDING_REVIEW) summary.awaitingReview++;
            if (status == SalaryRecommendationStatus.PENDING_APPROVAL) summary.awaitingApproval++;
            if (status == SalaryRecommendationStatus.RETURNED) summary.returned++;

            if (LIVE.contains(status)) {
                summary.live++;
                BigDecimal target = rec.getProposedTargetSalary();
                if (target == null) {
                    summary.liveWithoutTarget++;
                } else {
                    proposed = proposed == null ? target : proposed.add(target);
                }
            }

            // Only meaningful once a number has been recommended, and only where a bound exists.
            BigDecimal recommended = rec.getRecommendedSalary();
            if (recommended != null) {
                if (rec.getProposedMaxSalary() != null
                        && recommended.compareTo(rec.getProposedMaxSalary()) > 0) {
                    summary.aboveProposedBand++;
                } else if (rec.getProposedMinSalary() != null
                        && recommended.compareTo(rec.getProposedMinSalary()) < 0) {
                    summary.belowProposedBand++;
                }
            }

            if (status == SalaryRecommendationStatus.PENDING_REVIEW
                    || status == SalaryRecommendationStatus.PENDING_APPROVAL) {
                LocalDateTime waitingSince = waitingSince(rec);
                if (waitingSince != null
                        && (oldestWaitingSince == null || waitingSince.isBefore(oldestWaitingSince))) {
                    oldestWaitingSince = waitingSince;
                    summary.oldestWaitingRef = rec.getRecommendationNumber();
                }
            }
        }

        summary.totalProposed = proposed;

        if (oldestWaitingSince != null) {
            summary.oldestWaitingDays = Math.max(0, Duration.between(oldestWaitingSince, now).toDays());
        }

        return summary;
    }

    /**
     * When the clock started on the current wait.
     *
     * <p>A recommendation awaiting approval has been waiting since it was recommended, not since it
     * was created — the review time before that belonged to somebody else. Falls back to
     * {@code updatedAt} and then {@code createdAt}, because a wait measured from the wrong moment is
     * still better than none, and a null here silently drops the row from the oldest-waiting search.
     */
    static LocalDateTime waitingSince(SalaryRecommendation rec) {
        if (rec.getStatus() == SalaryRecommendationStatus.PENDING_APPROVAL
                && rec.getRecommendedAt() != null) {
            return rec.getRecommendedAt();
        }
        if (rec.getUpdatedAt() != null) return rec.getUpdatedAt();
        return rec.getCreatedAt();
    }

    public Map<String, Long> getCountsByStatus() { return countsByStatus; }
    public void setCountsByStatus(Map<String, Long> countsByStatus) { this.countsByStatus = countsByStatus; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getLive() { return live; }
    public void setLive(long live) { this.live = live; }

    public long getAwaitingReview() { return awaitingReview; }
    public void setAwaitingReview(long awaitingReview) { this.awaitingReview = awaitingReview; }

    public long getAwaitingApproval() { return awaitingApproval; }
    public void setAwaitingApproval(long awaitingApproval) { this.awaitingApproval = awaitingApproval; }

    public long getReturned() { return returned; }
    public void setReturned(long returned) { this.returned = returned; }

    public long getAboveProposedBand() { return aboveProposedBand; }
    public void setAboveProposedBand(long aboveProposedBand) { this.aboveProposedBand = aboveProposedBand; }

    public long getBelowProposedBand() { return belowProposedBand; }
    public void setBelowProposedBand(long belowProposedBand) { this.belowProposedBand = belowProposedBand; }

    public BigDecimal getTotalProposed() { return totalProposed; }
    public void setTotalProposed(BigDecimal totalProposed) { this.totalProposed = totalProposed; }

    public long getLiveWithoutTarget() { return liveWithoutTarget; }
    public void setLiveWithoutTarget(long liveWithoutTarget) { this.liveWithoutTarget = liveWithoutTarget; }

    public Long getOldestWaitingDays() { return oldestWaitingDays; }
    public void setOldestWaitingDays(Long oldestWaitingDays) { this.oldestWaitingDays = oldestWaitingDays; }

    public String getOldestWaitingRef() { return oldestWaitingRef; }
    public void setOldestWaitingRef(String oldestWaitingRef) { this.oldestWaitingRef = oldestWaitingRef; }
}
