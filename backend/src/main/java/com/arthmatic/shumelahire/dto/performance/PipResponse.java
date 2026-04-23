package com.arthmatic.shumelahire.dto.performance;

import com.arthmatic.shumelahire.entity.performance.PerformanceImprovementPlan;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class PipResponse {

    private String id;
    private String employeeId;
    private String employeeName;
    private String managerId;
    private String managerName;
    private String reason;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private String outcome;
    private List<PipMilestoneResponse> milestones;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public PipResponse() {}

    public static PipResponse fromEntity(PerformanceImprovementPlan entity) {
        PipResponse r = new PipResponse();
        r.id = entity.getId();
        r.employeeId = entity.getEmployee() != null ? entity.getEmployee().getId() : null;
        r.employeeName = entity.getEmployee() != null ?
                entity.getEmployee().getFirstName() + " " + entity.getEmployee().getLastName() : null;
        r.managerId = entity.getManager() != null ? entity.getManager().getId() : null;
        r.managerName = entity.getManager() != null ?
                entity.getManager().getFirstName() + " " + entity.getManager().getLastName() : null;
        r.reason = entity.getReason();
        r.startDate = entity.getStartDate();
        r.endDate = entity.getEndDate();
        r.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        r.outcome = entity.getOutcome();
        if (entity.getMilestones() != null) {
            r.milestones = entity.getMilestones().stream()
                    .map(PipMilestoneResponse::fromEntity)
                    .collect(Collectors.toList());
        }
        r.createdAt = entity.getCreatedAt();
        r.updatedAt = entity.getUpdatedAt();
        return r;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOutcome() { return outcome; }
    public void setOutcome(String outcome) { this.outcome = outcome; }
    public List<PipMilestoneResponse> getMilestones() { return milestones; }
    public void setMilestones(List<PipMilestoneResponse> milestones) { this.milestones = milestones; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
