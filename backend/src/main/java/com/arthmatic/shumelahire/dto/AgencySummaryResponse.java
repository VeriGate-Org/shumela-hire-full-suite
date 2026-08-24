package com.arthmatic.shumelahire.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Counts across the whole agency panel.
 *
 * <p>The headline is <b>submitting on a lapsed contract</b>. Nothing in the product compares
 * {@code contractEndDate} to today, so an agency whose contract ended can keep putting candidates
 * forward indefinitely — and a placement made under a lapsed contract has no agreed fee.
 */
public class AgencySummaryResponse {

    /** Agencies on file, in whatever state. */
    private long agencies;

    /** Approved with a live contract, whether or not it is near expiry. */
    private long inContract;

    /** Approved, contract ended, still able to submit. */
    private long lapsed;

    /** Approved, ending within {@link AgencyResponse#EXPIRY_WARNING_DAYS}. */
    private long expiringSoon;

    /**
     * Approved with no contract end date at all.
     *
     * <p>Reported rather than hidden: these never appear in any expiry check, so an agency can sit
     * on the panel indefinitely with nothing ever prompting a renewal decision.
     */
    private long noEndDate;

    private long suspended;
    private long pendingApproval;
    private long terminated;

    /**
     * Submissions received across the panel after the submitting agency's contract had ended.
     *
     * <p>The exposure figure. Not "two contracts lapsed" but "eleven candidates were put forward
     * under contracts that had already ended".
     */
    private long submissionsOnLapsedContracts;

    /** Submissions still waiting on a decision from us, across the panel. */
    private long awaitingReview;

    /** Submissions received across the panel, ever. */
    private long totalSubmissions;

    /**
     * Median days to review, across the panel.
     *
     * <p>The median of each agency's median, not of every submission — so a single high-volume
     * agency cannot speak for how the panel is treated. Null when nobody has submitted anything.
     */
    private Long medianReviewDays;

    /** The agency whose contract lapsed longest ago, so it can be acted on. */
    private String longestLapsedAgencyId;

    /** How long ago that was, in days, or null if nothing has lapsed. */
    private Long longestLapsedDays;

    public static AgencySummaryResponse from(List<AgencyResponse> agencies) {
        AgencySummaryResponse summary = new AgencySummaryResponse();
        if (agencies == null) {
            return summary;
        }

        List<Long> medians = new ArrayList<>();

        for (AgencyResponse agency : agencies) {
            summary.agencies++;
            summary.totalSubmissions += agency.getTotalSubmissions();
            summary.awaitingReview += agency.getAwaitingReview();

            if (agency.getMedianReviewDays() != null) {
                medians.add(agency.getMedianReviewDays());
            }

            AgencyResponse.ContractState state = agency.getContractState();
            if (state == null) {
                continue;
            }

            switch (state) {
                case LAPSED -> {
                    summary.lapsed++;
                    if (agency.getSubmissionsSinceLapse() != null) {
                        summary.submissionsOnLapsedContracts += agency.getSubmissionsSinceLapse();
                    }
                    Long since = agency.getDaysSinceLapse();
                    if (since != null
                            && (summary.longestLapsedDays == null || since > summary.longestLapsedDays)) {
                        summary.longestLapsedDays = since;
                        summary.longestLapsedAgencyId = agency.getId();
                    }
                }
                case EXPIRING_SOON -> {
                    summary.expiringSoon++;
                    // Still in contract as well — the warning is about the decision owed, not about
                    // the agency having stopped being able to work.
                    summary.inContract++;
                }
                case IN_CONTRACT -> summary.inContract++;
                case NO_END_DATE -> summary.noEndDate++;
                case SUSPENDED -> summary.suspended++;
                case PENDING_APPROVAL -> summary.pendingApproval++;
                case TERMINATED -> summary.terminated++;
            }
        }

        if (!medians.isEmpty()) {
            List<Long> sorted = medians.stream().sorted().toList();
            summary.medianReviewDays = sorted.get((sorted.size() - 1) / 2);
        }

        return summary;
    }

    public long getAgencies() { return agencies; }
    public void setAgencies(long agencies) { this.agencies = agencies; }

    public long getInContract() { return inContract; }
    public void setInContract(long inContract) { this.inContract = inContract; }

    public long getLapsed() { return lapsed; }
    public void setLapsed(long lapsed) { this.lapsed = lapsed; }

    public long getExpiringSoon() { return expiringSoon; }
    public void setExpiringSoon(long expiringSoon) { this.expiringSoon = expiringSoon; }

    public long getNoEndDate() { return noEndDate; }
    public void setNoEndDate(long noEndDate) { this.noEndDate = noEndDate; }

    public long getSuspended() { return suspended; }
    public void setSuspended(long suspended) { this.suspended = suspended; }

    public long getPendingApproval() { return pendingApproval; }
    public void setPendingApproval(long pendingApproval) { this.pendingApproval = pendingApproval; }

    public long getTerminated() { return terminated; }
    public void setTerminated(long terminated) { this.terminated = terminated; }

    public long getSubmissionsOnLapsedContracts() { return submissionsOnLapsedContracts; }
    public void setSubmissionsOnLapsedContracts(long submissionsOnLapsedContracts) {
        this.submissionsOnLapsedContracts = submissionsOnLapsedContracts;
    }

    public long getAwaitingReview() { return awaitingReview; }
    public void setAwaitingReview(long awaitingReview) { this.awaitingReview = awaitingReview; }

    public long getTotalSubmissions() { return totalSubmissions; }
    public void setTotalSubmissions(long totalSubmissions) { this.totalSubmissions = totalSubmissions; }

    public Long getMedianReviewDays() { return medianReviewDays; }
    public void setMedianReviewDays(Long medianReviewDays) { this.medianReviewDays = medianReviewDays; }

    public String getLongestLapsedAgencyId() { return longestLapsedAgencyId; }
    public void setLongestLapsedAgencyId(String longestLapsedAgencyId) {
        this.longestLapsedAgencyId = longestLapsedAgencyId;
    }

    public Long getLongestLapsedDays() { return longestLapsedDays; }
    public void setLongestLapsedDays(Long longestLapsedDays) { this.longestLapsedDays = longestLapsedDays; }
}
