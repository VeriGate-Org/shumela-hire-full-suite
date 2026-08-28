package com.arthmatic.shumelahire.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A saved report set to run on a cadence and be sent to people.
 *
 * <p>Scheduling previously had no implementation at all: {@code GET /api/reports/scheduled}
 * returned an empty list unconditionally, {@code POST /api/reports/schedule} answered
 * {@code {"scheduled": false}}, and the frontend's create form only ever updated its own React
 * state. A schedule a user created survived until they navigated away.
 *
 * <p>{@code lastStatus} and {@code errorMessage} are the point of the record rather than
 * decoration. A schedule that fails silently is indistinguishable, to the people expecting the
 * report, from one nobody ever created — so the failure has to be stored, not merely logged.
 */
public class ReportSchedule extends TenantAwareEntity {

    /** What a run can be. Mirrors the union the frontend already types. */
    public enum Status { SUCCESS, FAILED, RUNNING, PENDING }

    /** Supported cadences. Deliberately small — a cron field is a support burden nobody asked for. */
    public enum Frequency { DAILY, WEEKLY, MONTHLY }

    private String id;
    /** The saved report this runs. */
    private String reportId;
    /** Denormalised so a schedule still reads sensibly if its report is deleted. */
    private String reportName;
    private Frequency frequency = Frequency.WEEKLY;
    private List<String> recipients = new ArrayList<>();
    private boolean enabled = true;
    private LocalDateTime nextRun;
    private LocalDateTime lastRun;
    private int runCount = 0;
    private Status lastStatus = Status.PENDING;
    private String errorMessage;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ReportSchedule() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }

    public String getReportName() { return reportName; }
    public void setReportName(String reportName) { this.reportName = reportName; }

    public Frequency getFrequency() { return frequency; }
    public void setFrequency(Frequency frequency) { this.frequency = frequency; }

    public List<String> getRecipients() { return recipients; }
    public void setRecipients(List<String> recipients) {
        this.recipients = recipients != null ? recipients : new ArrayList<>();
    }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getNextRun() { return nextRun; }
    public void setNextRun(LocalDateTime nextRun) { this.nextRun = nextRun; }

    public LocalDateTime getLastRun() { return lastRun; }
    public void setLastRun(LocalDateTime lastRun) { this.lastRun = lastRun; }

    public int getRunCount() { return runCount; }
    public void setRunCount(int runCount) { this.runCount = runCount; }

    public Status getLastStatus() { return lastStatus; }
    public void setLastStatus(Status lastStatus) { this.lastStatus = lastStatus; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    /**
     * When this should next run, counted from {@code from}.
     *
     * <p>Runs are placed at 06:00 local time so a daily report is waiting at the start of the
     * working day rather than arriving during it.
     */
    public LocalDateTime computeNextRun(LocalDateTime from) {
        LocalDateTime base = from.toLocalDate().atTime(6, 0);
        if (!base.isAfter(from)) {
            base = base.plusDays(1);
        }
        return switch (frequency) {
            case DAILY -> base;
            case WEEKLY -> base.plusDays(7 - 1);
            case MONTHLY -> from.toLocalDate().withDayOfMonth(1).plusMonths(1).atTime(6, 0);
        };
    }
}
