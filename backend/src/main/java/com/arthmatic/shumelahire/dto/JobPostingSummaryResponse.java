package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Counts for the whole advert set.
 *
 * <p><b>The figure this exists for is "past deadline".</b> Nothing transitions a posting to
 * {@code CLOSED} when its closing date passes, so an advert that stopped accepting applications a
 * fortnight ago sits at {@code PUBLISHED} indefinitely — under the same pill as one still taking
 * them. {@code isDeadlinePassed()} and {@code isPublic()} already make that distinction per record;
 * this makes it countable across the set.
 *
 * <p>The list's tiles previously summed the ten postings on the loaded page and labelled the result
 * "Total Applicants", "Published" and "Pending Approval". Only "Total Postings" used a real total.
 */
public class JobPostingSummaryResponse {

    private Map<String, Long> countsByStatus = new LinkedHashMap<>();
    private long total;

    /** Published, and the closing date has not passed. The adverts genuinely taking applications. */
    private long openToApplicants;

    /**
     * Published, and the closing date has passed.
     *
     * <p>Still listed as published, accepting nothing. This is the number the page exists to show.
     */
    private long pastDeadline;

    /** Days since the oldest past-deadline advert expired, or null if none have. */
    private Long oldestExpiredDays;

    /** That advert's id, so a caller can link straight to it. */
    private String oldestExpiredId;

    /** Waiting on an approval decision. */
    private long awaitingApproval;

    /** Applications received across every advert — a real total, not a page's worth. */
    private long applicationsReceived;

    public static JobPostingSummaryResponse from(List<JobPosting> postings, LocalDateTime now) {
        JobPostingSummaryResponse summary = new JobPostingSummaryResponse();

        for (JobPostingStatus status : JobPostingStatus.values()) {
            summary.countsByStatus.put(status.name(), 0L);
        }

        JobPosting oldestExpired = null;

        for (JobPosting posting : postings) {
            summary.total++;
            if (posting.getStatus() != null) {
                summary.countsByStatus.merge(posting.getStatus().name(), 1L, Long::sum);
                if (posting.getStatus() == JobPostingStatus.PENDING_APPROVAL) {
                    summary.awaitingApproval++;
                }
            }

            if (posting.getApplicationsCount() != null) {
                summary.applicationsReceived += posting.getApplicationsCount();
            }

            // Only a published advert can be open or expired — a draft has no deadline that means
            // anything yet, and a closed one was ended deliberately.
            if (posting.getStatus() != JobPostingStatus.PUBLISHED) {
                continue;
            }
            // Against the caller's clock, not the wall clock. JobPosting.isDeadlinePassed() reads
            // LocalDateTime.now() internally, so this method took a `now` argument and then ignored
            // it for the one decision it exists to make. The test that pins the split was written
            // with a fixed NOW five days ago and started failing the moment real time crossed it —
            // in a summary that is otherwise deterministic, which is the point of passing a clock.
            LocalDateTime deadline = posting.getApplicationDeadline();
            if (deadline != null && deadline.isBefore(now)) {
                summary.pastDeadline++;
                if (oldestExpired == null || deadline.isBefore(oldestExpired.getApplicationDeadline())) {
                    oldestExpired = posting;
                }
            } else {
                // Includes an advert with no deadline at all: it is published and taking
                // applications, which is what "open" means here.
                summary.openToApplicants++;
            }
        }

        if (oldestExpired != null) {
            summary.oldestExpiredId = oldestExpired.getId();
            summary.oldestExpiredDays = Math.max(0,
                    Duration.between(oldestExpired.getApplicationDeadline(), now).toDays());
        }

        return summary;
    }

    public Map<String, Long> getCountsByStatus() { return countsByStatus; }
    public void setCountsByStatus(Map<String, Long> countsByStatus) { this.countsByStatus = countsByStatus; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getOpenToApplicants() { return openToApplicants; }
    public void setOpenToApplicants(long openToApplicants) { this.openToApplicants = openToApplicants; }

    public long getPastDeadline() { return pastDeadline; }
    public void setPastDeadline(long pastDeadline) { this.pastDeadline = pastDeadline; }

    public Long getOldestExpiredDays() { return oldestExpiredDays; }
    public void setOldestExpiredDays(Long oldestExpiredDays) { this.oldestExpiredDays = oldestExpiredDays; }

    public String getOldestExpiredId() { return oldestExpiredId; }
    public void setOldestExpiredId(String oldestExpiredId) { this.oldestExpiredId = oldestExpiredId; }

    public long getAwaitingApproval() { return awaitingApproval; }
    public void setAwaitingApproval(long awaitingApproval) { this.awaitingApproval = awaitingApproval; }

    public long getApplicationsReceived() { return applicationsReceived; }
    public void setApplicationsReceived(long applicationsReceived) { this.applicationsReceived = applicationsReceived; }
}
