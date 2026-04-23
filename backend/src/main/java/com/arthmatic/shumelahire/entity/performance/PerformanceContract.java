package com.arthmatic.shumelahire.entity.performance;

import com.arthmatic.shumelahire.entity.TenantAwareEntity;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

public class PerformanceContract extends TenantAwareEntity {
    
    private String id;
    
    @NotNull(message = "Performance cycle is required")
    private PerformanceCycle cycle;
    
    @NotNull(message = "Employee ID is required")
    private String employeeId;
    
    private String employeeName;
    
    private String employeeNumber;
    
    @NotNull(message = "Manager ID is required")
    private String managerId;
    
    private String managerName;
    
    private String department;
    
    private String jobTitle;
    
    private String jobLevel;
    
    private PerformanceTemplate template;
    
    private ContractStatus status = ContractStatus.DRAFT;
    
    private LocalDateTime submittedAt;
    
    private LocalDateTime approvedAt;
    
    private String approvedBy;
    
    private String approvalComments;
    
    private String rejectionReason;
    
    // Versioning for amendments
    private Integer version = 1;
    
    private String amendmentReason;
    
    private LocalDateTime amendedAt;
    
    private String amendedBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    // Relationships
    private List<PerformanceGoal> goals;
    
    private List<PerformanceReview> reviews;
    
    // Constructors
    public PerformanceContract() {
        this.createdAt = LocalDateTime.now();
    }
    
    public PerformanceContract(PerformanceCycle cycle, String employeeId, String managerId) {
        this();
        this.cycle = cycle;
        this.employeeId = employeeId;
        this.managerId = managerId;
    }
    
    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canBeEdited() {
        return status == ContractStatus.DRAFT || status == ContractStatus.REJECTED;
    }
    
    public boolean canBeSubmitted() {
        return status == ContractStatus.DRAFT && goals != null && !goals.isEmpty();
    }
    
    public boolean canBeApproved() {
        return status == ContractStatus.SUBMITTED;
    }
    
    public boolean canBeAmended() {
        return status == ContractStatus.APPROVED && cycle.isActive();
    }
    
    public boolean isActive() {
        return status == ContractStatus.APPROVED && cycle.isActive();
    }
    
    public void submit() {
        if (!canBeSubmitted()) {
            throw new IllegalStateException("Contract cannot be submitted in current state");
        }
        this.status = ContractStatus.SUBMITTED;
        this.submittedAt = LocalDateTime.now();
    }
    
    public void approve(String approverId, String comments) {
        if (!canBeApproved()) {
            throw new IllegalStateException("Contract cannot be approved in current state");
        }
        this.status = ContractStatus.APPROVED;
        this.approvedBy = approverId;
        this.approvedAt = LocalDateTime.now();
        this.approvalComments = comments;
    }
    
    public void reject(String reason) {
        if (!canBeApproved()) {
            throw new IllegalStateException("Contract cannot be rejected in current state");
        }
        this.status = ContractStatus.REJECTED;
        this.rejectionReason = reason;
    }
    
    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public PerformanceCycle getCycle() { return cycle; }
    public void setCycle(PerformanceCycle cycle) { this.cycle = cycle; }
    
    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    
    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }
    
    public String getEmployeeNumber() { return employeeNumber; }
    public void setEmployeeNumber(String employeeNumber) { this.employeeNumber = employeeNumber; }
    
    public String getManagerId() { return managerId; }
    public void setManagerId(String managerId) { this.managerId = managerId; }
    
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    
    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }
    
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    
    public String getJobLevel() { return jobLevel; }
    public void setJobLevel(String jobLevel) { this.jobLevel = jobLevel; }
    
    public PerformanceTemplate getTemplate() { return template; }
    public void setTemplate(PerformanceTemplate template) { this.template = template; }
    
    public ContractStatus getStatus() { return status; }
    public void setStatus(ContractStatus status) { this.status = status; }
    
    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
    
    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }
    
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    
    public String getApprovalComments() { return approvalComments; }
    public void setApprovalComments(String approvalComments) { this.approvalComments = approvalComments; }
    
    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
    
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    
    public String getAmendmentReason() { return amendmentReason; }
    public void setAmendmentReason(String amendmentReason) { this.amendmentReason = amendmentReason; }
    
    public LocalDateTime getAmendedAt() { return amendedAt; }
    public void setAmendedAt(LocalDateTime amendedAt) { this.amendedAt = amendedAt; }
    
    public String getAmendedBy() { return amendedBy; }
    public void setAmendedBy(String amendedBy) { this.amendedBy = amendedBy; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    
    public List<PerformanceGoal> getGoals() { return goals; }
    public void setGoals(List<PerformanceGoal> goals) { this.goals = goals; }
    
    public List<PerformanceReview> getReviews() { return reviews; }
    public void setReviews(List<PerformanceReview> reviews) { this.reviews = reviews; }
}