package com.arthmatic.shumelahire.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class Requisition extends TenantAwareEntity {

    private String id;

    private String jobTitle;

    private String department;

    private String location;

    private EmploymentType employmentType;

    private BigDecimal salaryMin;

    private BigDecimal salaryMax;

    private String description;

    private String justification;

    private RequisitionStatus status = RequisitionStatus.DRAFT;

    private String createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    /**
     * Ordered record of every submit / approve / reject action taken against this requisition.
     * Drives the approval timeline; empty until the requisition is first submitted.
     */
    private List<RequisitionApproval> approvalHistory = new ArrayList<>();

    public enum RequisitionStatus {
        DRAFT,
        SUBMITTED,
        PENDING_HR_APPROVAL,
        PENDING_EXECUTIVE_APPROVAL,
        APPROVED,
        REJECTED
    }

    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public EmploymentType getEmploymentType() { return employmentType; }
    public void setEmploymentType(EmploymentType employmentType) { this.employmentType = employmentType; }

    public BigDecimal getSalaryMin() { return salaryMin; }
    public void setSalaryMin(BigDecimal salaryMin) { this.salaryMin = salaryMin; }

    public BigDecimal getSalaryMax() { return salaryMax; }
    public void setSalaryMax(BigDecimal salaryMax) { this.salaryMax = salaryMax; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getJustification() { return justification; }
    public void setJustification(String justification) { this.justification = justification; }

    public RequisitionStatus getStatus() { return status; }
    public void setStatus(RequisitionStatus status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<RequisitionApproval> getApprovalHistory() { return approvalHistory; }
    public void setApprovalHistory(List<RequisitionApproval> approvalHistory) {
        this.approvalHistory = approvalHistory != null ? approvalHistory : new ArrayList<>();
    }

    /** Append a step to the approval history, tolerating a null list on legacy records. */
    public void recordApproval(RequisitionApproval approval) {
        if (this.approvalHistory == null) {
            this.approvalHistory = new ArrayList<>();
        }
        this.approvalHistory.add(approval);
    }
}
