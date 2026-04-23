package com.arthmatic.shumelahire.entity;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class JobAd extends TenantAwareEntity {
    
    private String id;
    
    private String requisitionId;

    private String jobPostingId;

    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "HTML body is required")
    private String htmlBody;
    
    private Boolean channelInternal = false;
    
    private Boolean channelExternal = false;
    
    private JobAdStatus status = JobAdStatus.DRAFT;
    
    private LocalDate closingDate;
    
    private String slug;
    
    @NotBlank(message = "Created by is required")
    private String createdBy;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private String department;

    private String location;

    private String employmentType;

    private BigDecimal salaryRangeMin;

    private BigDecimal salaryRangeMax;

    private String salaryCurrency;

    private List<JobAdHistory> history = new ArrayList<>();
    
    // Constructors
    public JobAd() {}
    
    public JobAd(String title, String htmlBody, String createdBy) {
        this.title = title;
        this.htmlBody = htmlBody;
        this.createdBy = createdBy;
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getRequisitionId() {
        return requisitionId;
    }
    
    public void setRequisitionId(String requisitionId) {
        this.requisitionId = requisitionId;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getHtmlBody() {
        return htmlBody;
    }
    
    public void setHtmlBody(String htmlBody) {
        this.htmlBody = htmlBody;
    }
    
    public Boolean getChannelInternal() {
        return channelInternal;
    }
    
    public void setChannelInternal(Boolean channelInternal) {
        this.channelInternal = channelInternal;
    }
    
    public Boolean getChannelExternal() {
        return channelExternal;
    }
    
    public void setChannelExternal(Boolean channelExternal) {
        this.channelExternal = channelExternal;
    }
    
    public JobAdStatus getStatus() {
        return status;
    }
    
    public void setStatus(JobAdStatus status) {
        this.status = status;
    }
    
    public LocalDate getClosingDate() {
        return closingDate;
    }
    
    public void setClosingDate(LocalDate closingDate) {
        this.closingDate = closingDate;
    }
    
    public String getSlug() {
        return slug;
    }
    
    public void setSlug(String slug) {
        this.slug = slug;
    }
    
    public String getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public List<JobAdHistory> getHistory() {
        return history;
    }
    
    public void setHistory(List<JobAdHistory> history) {
        this.history = history;
    }
    
    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public BigDecimal getSalaryRangeMin() { return salaryRangeMin; }
    public void setSalaryRangeMin(BigDecimal salaryRangeMin) { this.salaryRangeMin = salaryRangeMin; }

    public BigDecimal getSalaryRangeMax() { return salaryRangeMax; }
    public void setSalaryRangeMax(BigDecimal salaryRangeMax) { this.salaryRangeMax = salaryRangeMax; }

    public String getSalaryCurrency() { return salaryCurrency; }
    public void setSalaryCurrency(String salaryCurrency) { this.salaryCurrency = salaryCurrency; }

    // Helper methods
    public boolean isPublished() {
        return status == JobAdStatus.PUBLISHED;
    }
    
    public boolean isExpired() {
        return status == JobAdStatus.EXPIRED || 
               (closingDate != null && closingDate.isBefore(LocalDate.now()));
    }
    
    public boolean hasInternalChannel() {
        return Boolean.TRUE.equals(channelInternal);
    }
    
    public boolean hasExternalChannel() {
        return Boolean.TRUE.equals(channelExternal);
    }
    
    @Override
    public String toString() {
        return "JobAd{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", status=" + status +
                ", slug='" + slug + '\'' +
                ", createdBy='" + createdBy + '\'' +
                '}';
    }
}