package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.Interview;
import com.arthmatic.shumelahire.entity.InterviewStatus;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Counts for the whole interview set, not for whichever page is loaded.
 *
 * <p>The interviews page fetches {@code GET /api/interviews} with no parameters at all — the
 * endpoint is fully paginated and filterable, and the page reads {@code data.content || data} and
 * derives everything from the result. This makes the figures describe the set.
 *
 * <p><b>The two headline figures are stalls the backend already computes and nothing displays.</b>
 * {@code requiresFeedback()} — completed, and no feedback filed — is on every record as a
 * {@code @JsonProperty} and has its own endpoint, and is referenced in one Storybook fixture and
 * nowhere else in the application. {@code isOverdue()} — scheduled, and the slot ended over fifteen
 * minutes ago — is shown as a badge on a row but never counted. They are different failures with
 * different remedies: one needs the panel chased, the other needs somebody to say whether the
 * interview happened.
 */
public class InterviewSummaryResponse {

    private Map<String, Long> countsByStatus = new LinkedHashMap<>();
    private long total;

    /** Completed, with nothing written up. Each one is holding a candidate at the interview stage. */
    private long awaitingWriteUp;

    /** Scheduled, and the slot has passed with nobody starting or cancelling it. */
    private long slotPassed;

    /** Scheduled within the next seven days. */
    private long nextSevenDays;

    /** Scheduled for today, however far along. */
    private long today;

    /** Days the longest-outstanding write-up has been waiting, or null if none are. */
    private Long oldestWriteUpDays;

    /** That interview's id, so a caller can link to it rather than hunt for it. */
    private String oldestWriteUpId;

    /**
     * Median days from the interview finishing to feedback being filed.
     *
     * <p>Both ends are stored — {@code completedAt} and {@code feedbackSubmittedAt}. Median rather
     * than mean, and null when nothing has ever been written up: a set with no completions has no
     * typical time, which is a different statement from zero days.
     */
    private Long medianDaysToWriteUp;

    /** Interviews whose write-up is outstanding, worst first — the queue's own worklist. */
    private List<String> awaitingWriteUpIds = new ArrayList<>();

    public static InterviewSummaryResponse from(List<Interview> interviews, LocalDateTime now) {
        InterviewSummaryResponse summary = new InterviewSummaryResponse();

        // Every status appears, including the empty ones — a status that vanishes on a quiet week
        // and returns later reads as a bug in the filter row.
        for (InterviewStatus status : InterviewStatus.values()) {
            summary.countsByStatus.put(status.name(), 0L);
        }

        Interview oldestWriteUp = null;
        List<Long> writeUpDurations = new ArrayList<>();
        List<Interview> awaiting = new ArrayList<>();

        for (Interview interview : interviews) {
            summary.total++;
            if (interview.getStatus() != null) {
                summary.countsByStatus.merge(interview.getStatus().name(), 1L, Long::sum);
            }

            if (interview.requiresFeedback()) {
                summary.awaitingWriteUp++;
                awaiting.add(interview);
                LocalDateTime finished = finishedAt(interview);
                if (finished != null
                        && (oldestWriteUp == null || finished.isBefore(finishedAt(oldestWriteUp)))) {
                    oldestWriteUp = interview;
                }
            }

            if (interview.isOverdue()) {
                summary.slotPassed++;
            }

            LocalDateTime scheduled = interview.getScheduledAt();
            if (scheduled != null && interview.getStatus() == InterviewStatus.SCHEDULED) {
                if (!scheduled.isBefore(now) && scheduled.isBefore(now.plusDays(7))) {
                    summary.nextSevenDays++;
                }
            }
            if (scheduled != null && scheduled.toLocalDate().equals(now.toLocalDate())) {
                summary.today++;
            }

            if (interview.getCompletedAt() != null && interview.getFeedbackSubmittedAt() != null) {
                long days = Duration.between(
                        interview.getCompletedAt(), interview.getFeedbackSubmittedAt()).toDays();
                // A negative duration means the two timestamps disagree about order; excluded
                // rather than folded in as a zero, which would drag the median toward nothing.
                if (days >= 0) {
                    writeUpDurations.add(days);
                }
            }
        }

        // Longest wait first: this list is a worklist, not a record set.
        awaiting.sort((a, b) -> {
            LocalDateTime aAt = finishedAt(a);
            LocalDateTime bAt = finishedAt(b);
            if (aAt == null && bAt == null) return 0;
            if (aAt == null) return 1;
            if (bAt == null) return -1;
            return aAt.compareTo(bAt);
        });
        awaiting.forEach(interview -> summary.awaitingWriteUpIds.add(interview.getId()));

        if (oldestWriteUp != null) {
            summary.oldestWriteUpId = oldestWriteUp.getId();
            summary.oldestWriteUpDays = Math.max(0,
                    Duration.between(finishedAt(oldestWriteUp), now).toDays());
        }

        summary.medianDaysToWriteUp = median(writeUpDurations);
        return summary;
    }

    /**
     * When the interview actually finished.
     *
     * <p>{@code completedAt} where it was recorded, otherwise the end of the booked slot. An
     * interview marked complete without a timestamp still has a knowable end; falling back is more
     * honest than reporting no wait at all for it.
     */
    private static LocalDateTime finishedAt(Interview interview) {
        if (interview.getCompletedAt() != null) {
            return interview.getCompletedAt();
        }
        return interview.getScheduledAt() != null ? interview.getEndTime() : null;
    }

    private static Long median(List<Long> values) {
        if (values.isEmpty()) {
            return null;
        }
        List<Long> sorted = values.stream().sorted().toList();
        int middle = sorted.size() / 2;
        // Even count: the lower of the two central values rather than their mean, so the figure is
        // always a duration some write-up actually took.
        return sorted.size() % 2 == 1 ? sorted.get(middle) : sorted.get(middle - 1);
    }

    public Map<String, Long> getCountsByStatus() { return countsByStatus; }
    public void setCountsByStatus(Map<String, Long> countsByStatus) { this.countsByStatus = countsByStatus; }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getAwaitingWriteUp() { return awaitingWriteUp; }
    public void setAwaitingWriteUp(long awaitingWriteUp) { this.awaitingWriteUp = awaitingWriteUp; }

    public long getSlotPassed() { return slotPassed; }
    public void setSlotPassed(long slotPassed) { this.slotPassed = slotPassed; }

    public long getNextSevenDays() { return nextSevenDays; }
    public void setNextSevenDays(long nextSevenDays) { this.nextSevenDays = nextSevenDays; }

    public long getToday() { return today; }
    public void setToday(long today) { this.today = today; }

    public Long getOldestWriteUpDays() { return oldestWriteUpDays; }
    public void setOldestWriteUpDays(Long oldestWriteUpDays) { this.oldestWriteUpDays = oldestWriteUpDays; }

    public String getOldestWriteUpId() { return oldestWriteUpId; }
    public void setOldestWriteUpId(String oldestWriteUpId) { this.oldestWriteUpId = oldestWriteUpId; }

    public Long getMedianDaysToWriteUp() { return medianDaysToWriteUp; }
    public void setMedianDaysToWriteUp(Long medianDaysToWriteUp) { this.medianDaysToWriteUp = medianDaysToWriteUp; }

    public List<String> getAwaitingWriteUpIds() { return awaitingWriteUpIds; }
    public void setAwaitingWriteUpIds(List<String> awaitingWriteUpIds) { this.awaitingWriteUpIds = awaitingWriteUpIds; }
}
