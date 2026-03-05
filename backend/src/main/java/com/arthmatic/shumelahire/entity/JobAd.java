package com.arthmatic.shumelahire.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_ads")
public class JobAd extends TenantAwareEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "requisition_id")
    private Long requisitionId;

    @Column(name = "job_posting_id")
    private Long jobPostingId;

    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 500)
    private String title;
    
    @NotBlank(message = "HTML body is required")
    @Column(name = "html_body", nullable = false, columnDefinition = "TEXT")
    private String htmlBody;
    
    @Column(name = "channel_internal", nullable = false)
    private Boolean channelInternal = false;
    
    @Column(name = "channel_external", nullable = false)
    private Boolean channelExternal = false;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobAdStatus status = JobAdStatus.DRAFT;
    
    @Column(name = "closing_date")
    private LocalDate closingDate;
    
    @Column(unique = true, length = 200)
    private String slug;
    
    @NotBlank(message = "Created by is required")
    @Column(name = "created_by", nullable = false, length = 100)
    private String createdBy;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "department", length = 100)
    private String department;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "employment_type", length = 50)
    private String employmentType;

    @Column(name = "salary_range_min", precision = 12, scale = 2)
    private BigDecimal salaryRangeMin;

    @Column(name = "salary_range_max", precision = 12, scale = 2)
    private BigDecimal salaryRangeMax;

    @Column(name = "salary_currency", length = 3)
    private String salaryCurrency;

    @OneToMany(mappedBy = "jobAd", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<JobAdHistory> history = new ArrayList<>();
    
    // Constructors
    public JobAd() {}
    
    public JobAd(String title, String htmlBody, String createdBy) {
        this.title = title;
        this.htmlBody = htmlBody;
        this.createdBy = createdBy;
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
    
    public List<JobAdHistory> getHistory() {
        return history;
    }
    
    public void setHistory(List<JobAdHistory> history) {
        this.history = history;
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