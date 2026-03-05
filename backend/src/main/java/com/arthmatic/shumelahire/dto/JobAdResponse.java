package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.JobAd;
import com.arthmatic.shumelahire.entity.JobAdStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class JobAdResponse {
    
    private Long id;
    private Long requisitionId;
    private String title;
    private String htmlBody;
    private Boolean channelInternal;
    private Boolean channelExternal;
    private JobAdStatus status;
    private LocalDate closingDate;
    private String slug;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long jobPostingId;
    private String department;
    private String location;
    private String employmentType;
    private BigDecimal salaryRangeMin;
    private BigDecimal salaryRangeMax;
    private String salaryCurrency;

    // Constructors
    public JobAdResponse() {}

    public JobAdResponse(JobAd jobAd) {
        this.id = jobAd.getId();
        this.requisitionId = jobAd.getRequisitionId();
        this.title = jobAd.getTitle();
        this.htmlBody = jobAd.getHtmlBody();
        this.channelInternal = jobAd.getChannelInternal();
        this.channelExternal = jobAd.getChannelExternal();
        this.status = jobAd.getStatus();
        this.closingDate = jobAd.getClosingDate();
        this.slug = jobAd.getSlug();
        this.createdBy = jobAd.getCreatedBy();
        this.createdAt = jobAd.getCreatedAt();
        this.updatedAt = jobAd.getUpdatedAt();
        this.jobPostingId = jobAd.getJobPostingId();
        this.department = jobAd.getDepartment();
        this.location = jobAd.getLocation();
        this.employmentType = jobAd.getEmploymentType();
        this.salaryRangeMin = jobAd.getSalaryRangeMin();
        this.salaryRangeMax = jobAd.getSalaryRangeMax();
        this.salaryCurrency = jobAd.getSalaryCurrency();
    }
    
    // Static factory method
    public static JobAdResponse fromEntity(JobAd jobAd) {
        return new JobAdResponse(jobAd);
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getRequisitionId() {
        return requisitionId;
    }
    
    public void setRequisitionId(Long requisitionId) {
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

    public Long getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(Long jobPostingId) { this.jobPostingId = jobPostingId; }

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
}