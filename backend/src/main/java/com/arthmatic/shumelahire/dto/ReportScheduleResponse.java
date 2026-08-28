package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.ReportSchedule;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Wire shape for a report schedule.
 *
 * <p>Field names and casing match what {@code ReportScheduler.tsx} already types, so the frontend
 * needed no shape changes — it previously held these objects only in React state.
 * {@code frequency} and {@code lastStatus} are lower-cased because the TypeScript union is
 * {@code 'daily' | 'weekly' | 'monthly'} and {@code 'success' | 'failed' | 'running' | 'pending'}.
 */
public class ReportScheduleResponse {

    private static final DateTimeFormatter ISO = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private String id;
    private String reportId;
    private String reportName;
    private String frequency;
    private List<String> recipients = new ArrayList<>();
    private boolean enabled;
    private String nextRun;
    private String lastRun;
    private int runCount;
    private String lastStatus;
    private String errorMessage;
    private String createdAt;

    public ReportScheduleResponse() {}

    public ReportScheduleResponse(ReportSchedule e) {
        this.id = e.getId();
        this.reportId = e.getReportId();
        this.reportName = e.getReportName();
        this.frequency = e.getFrequency() != null ? e.getFrequency().name().toLowerCase() : null;
        this.recipients = e.getRecipients() != null ? new ArrayList<>(e.getRecipients()) : new ArrayList<>();
        this.enabled = e.isEnabled();
        this.nextRun = e.getNextRun() != null ? e.getNextRun().format(ISO) : null;
        this.lastRun = e.getLastRun() != null ? e.getLastRun().format(ISO) : null;
        this.runCount = e.getRunCount();
        this.lastStatus = e.getLastStatus() != null ? e.getLastStatus().name().toLowerCase() : null;
        this.errorMessage = e.getErrorMessage();
        this.createdAt = e.getCreatedAt() != null ? e.getCreatedAt().format(ISO) : null;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getReportId() { return reportId; }
    public void setReportId(String reportId) { this.reportId = reportId; }
    public String getReportName() { return reportName; }
    public void setReportName(String reportName) { this.reportName = reportName; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public List<String> getRecipients() { return recipients; }
    public void setRecipients(List<String> recipients) { this.recipients = recipients; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public String getNextRun() { return nextRun; }
    public void setNextRun(String nextRun) { this.nextRun = nextRun; }
    public String getLastRun() { return lastRun; }
    public void setLastRun(String lastRun) { this.lastRun = lastRun; }
    public int getRunCount() { return runCount; }
    public void setRunCount(int runCount) { this.runCount = runCount; }
    public String getLastStatus() { return lastStatus; }
    public void setLastStatus(String lastStatus) { this.lastStatus = lastStatus; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
}
