package com.arthmatic.shumelahire.dto.performance;

import java.time.LocalDate;
import java.util.List;

public class PipCreateRequest {

    private Long employeeId;
    private Long managerId;
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<MilestoneRequest> milestones;

    public PipCreateRequest() {}

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getManagerId() { return managerId; }
    public void setManagerId(Long managerId) { this.managerId = managerId; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public List<MilestoneRequest> getMilestones() { return milestones; }
    public void setMilestones(List<MilestoneRequest> milestones) { this.milestones = milestones; }

    public static class MilestoneRequest {
        private String title;
        private String description;
        private LocalDate targetDate;

        public MilestoneRequest() {}

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public LocalDate getTargetDate() { return targetDate; }
        public void setTargetDate(LocalDate targetDate) { this.targetDate = targetDate; }
    }
}
