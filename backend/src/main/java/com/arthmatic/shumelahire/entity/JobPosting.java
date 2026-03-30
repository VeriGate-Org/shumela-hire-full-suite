package com.arthmatic.shumelahire.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class JobPosting extends TenantAwareEntity {
    
    private Long id;
    
    @NotBlank(message = "Job title is required")
    private String title;
    
    @NotBlank(message = "Department is required")
    private String department;
    
    private String location;
    
    private EmploymentType employmentType = EmploymentType.FULL_TIME;
    
    private ExperienceLevel experienceLevel = ExperienceLevel.MID_LEVEL;
    
    @NotBlank(message = "Job description is required")
    private String description;
    
    private String requirements;
    
    private String responsibilities;
    
    private String qualifications;
    
    private String benefits;
    
    private BigDecimal salaryMin;
    
    private BigDecimal salaryMax;
    
    private String salaryCurrency = "ZAR";
    
    private Boolean remoteWorkAllowed = false;
    
    private Boolean travelRequired = false;
    
    private LocalDateTime applicationDeadline;
    
    @Min(value = 1, message = "At least one position must be available")
    private Integer positionsAvailable = 1;
    
    private JobPostingStatus status = JobPostingStatus.DRAFT;
    
    @NotNull(message = "Creator is required")
    private Long createdBy; // User ID who created the posting
    
    private Long approvedBy; // User ID who approved the posting
    
    private Long publishedBy; // User ID who published the posting
    
    private String approvalNotes;
    
    private String rejectionReason;
    
    private String internalNotes;
    
    private String externalJobBoards; // JSON array of job board names

    private String requiredCheckTypes; // JSON array of check type codes

    private Boolean enforceCheckCompletion = false;
    
    private String seoTitle;
    
    private String seoDescription;
    
    private String seoKeywords;
    
    private String slug;
    
    private Boolean featured = false;
    
    private Boolean urgent = false;
    
    private Long viewsCount = 0L;
    
    private Long applicationsCount = 0L;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private LocalDateTime submittedForApprovalAt;
    
    private LocalDateTime approvedAt;
    
    private LocalDateTime publishedAt;
    
    private LocalDateTime unpublishedAt;
    
    private LocalDateTime closedAt;
    
    // Relationships
    @JsonIgnore
    private List<Application> applications;
    
    // Constructors
    public JobPosting() {
        this.createdAt = LocalDateTime.now();
    }
    
    public JobPosting(String title, String department, String description, Long createdBy) {
        this();
        this.title = title;
        this.department = department;
        this.description = description;
        this.createdBy = createdBy;
    }
    
    // Lifecycle callbacks
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean canBeEdited() {
        return status == JobPostingStatus.DRAFT || status == JobPostingStatus.REJECTED;
    }
    
    public boolean canBeSubmittedForApproval() {
        return status == JobPostingStatus.DRAFT || status == JobPostingStatus.REJECTED;
    }
    
    public boolean canBeApproved() {
        return status == JobPostingStatus.PENDING_APPROVAL;
    }
    
    public boolean canBeRejected() {
        return status == JobPostingStatus.PENDING_APPROVAL;
    }
    
    public boolean canBePublished() {
        return status == JobPostingStatus.APPROVED;
    }
    
    public boolean canBeUnpublished() {
        return status == JobPostingStatus.PUBLISHED;
    }
    
    public boolean canBeClosed() {
        return status == JobPostingStatus.PUBLISHED || status == JobPostingStatus.APPROVED;
    }
    
    public boolean isActive() {
        return status == JobPostingStatus.PUBLISHED;
    }
    
    public boolean isPublic() {
        return status == JobPostingStatus.PUBLISHED && 
               (applicationDeadline == null || applicationDeadline.isAfter(LocalDateTime.now()));
    }
    
    public String getStatusDisplayName() {
        return status.getDisplayName();
    }
    
    public String getSalaryRange() {
        if (salaryMin == null && salaryMax == null) {
            return "Salary negotiable";
        }
        if (salaryMin != null && salaryMax != null) {
            return String.format("%s %,.0f - %,.0f", salaryCurrency, salaryMin, salaryMax);
        }
        if (salaryMin != null) {
            return String.format("%s %,.0f+", salaryCurrency, salaryMin);
        }
        return String.format("Up to %s %,.0f", salaryCurrency, salaryMax);
    }
    
    public long getDaysFromCreation() {
        return java.time.temporal.ChronoUnit.DAYS.between(createdAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }
    
    public long getDaysFromPublication() {
        if (publishedAt == null) return 0;
        return java.time.temporal.ChronoUnit.DAYS.between(publishedAt.toLocalDate(), LocalDateTime.now().toLocalDate());
    }
    
    public boolean isDeadlinePassed() {
        return applicationDeadline != null && applicationDeadline.isBefore(LocalDateTime.now());
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getTitle() {
        return title;
    }
    
    public void setTitle(String title) {
        this.title = title;
    }
    
    public String getDepartment() {
        return department;
    }
    
    public void setDepartment(String department) {
        this.department = department;
    }
    
    public String getLocation() {
        return location;
    }
    
    public void setLocation(String location) {
        this.location = location;
    }
    
    public EmploymentType getEmploymentType() {
        return employmentType;
    }
    
    public void setEmploymentType(EmploymentType employmentType) {
        this.employmentType = employmentType;
    }
    
    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }
    
    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getRequirements() {
        return requirements;
    }
    
    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }
    
    public String getResponsibilities() {
        return responsibilities;
    }
    
    public void setResponsibilities(String responsibilities) {
        this.responsibilities = responsibilities;
    }
    
    public String getQualifications() {
        return qualifications;
    }
    
    public void setQualifications(String qualifications) {
        this.qualifications = qualifications;
    }
    
    public String getBenefits() {
        return benefits;
    }
    
    public void setBenefits(String benefits) {
        this.benefits = benefits;
    }
    
    public BigDecimal getSalaryMin() {
        return salaryMin;
    }
    
    public void setSalaryMin(BigDecimal salaryMin) {
        this.salaryMin = salaryMin;
    }
    
    public BigDecimal getSalaryMax() {
        return salaryMax;
    }
    
    public void setSalaryMax(BigDecimal salaryMax) {
        this.salaryMax = salaryMax;
    }
    
    public String getSalaryCurrency() {
        return salaryCurrency;
    }
    
    public void setSalaryCurrency(String salaryCurrency) {
        this.salaryCurrency = salaryCurrency;
    }
    
    public Boolean getRemoteWorkAllowed() {
        return remoteWorkAllowed;
    }
    
    public void setRemoteWorkAllowed(Boolean remoteWorkAllowed) {
        this.remoteWorkAllowed = remoteWorkAllowed;
    }
    
    public Boolean getTravelRequired() {
        return travelRequired;
    }
    
    public void setTravelRequired(Boolean travelRequired) {
        this.travelRequired = travelRequired;
    }
    
    public LocalDateTime getApplicationDeadline() {
        return applicationDeadline;
    }
    
    public void setApplicationDeadline(LocalDateTime applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }
    
    public Integer getPositionsAvailable() {
        return positionsAvailable;
    }
    
    public void setPositionsAvailable(Integer positionsAvailable) {
        this.positionsAvailable = positionsAvailable;
    }
    
    public JobPostingStatus getStatus() {
        return status;
    }
    
    public void setStatus(JobPostingStatus status) {
        this.status = status;
    }
    
    public Long getCreatedBy() {
        return createdBy;
    }
    
    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
    }
    
    public Long getApprovedBy() {
        return approvedBy;
    }
    
    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }
    
    public Long getPublishedBy() {
        return publishedBy;
    }
    
    public void setPublishedBy(Long publishedBy) {
        this.publishedBy = publishedBy;
    }
    
    public String getApprovalNotes() {
        return approvalNotes;
    }
    
    public void setApprovalNotes(String approvalNotes) {
        this.approvalNotes = approvalNotes;
    }
    
    public String getRejectionReason() {
        return rejectionReason;
    }
    
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
    
    public String getInternalNotes() {
        return internalNotes;
    }
    
    public void setInternalNotes(String internalNotes) {
        this.internalNotes = internalNotes;
    }
    
    public String getExternalJobBoards() {
        return externalJobBoards;
    }
    
    public void setExternalJobBoards(String externalJobBoards) {
        this.externalJobBoards = externalJobBoards;
    }

    public String getRequiredCheckTypes() {
        return requiredCheckTypes;
    }

    public void setRequiredCheckTypes(String requiredCheckTypes) {
        this.requiredCheckTypes = requiredCheckTypes;
    }

    public Boolean getEnforceCheckCompletion() {
        return enforceCheckCompletion;
    }

    public void setEnforceCheckCompletion(Boolean enforceCheckCompletion) {
        this.enforceCheckCompletion = enforceCheckCompletion;
    }

    public String getSeoTitle() {
        return seoTitle;
    }
    
    public void setSeoTitle(String seoTitle) {
        this.seoTitle = seoTitle;
    }
    
    public String getSeoDescription() {
        return seoDescription;
    }
    
    public void setSeoDescription(String seoDescription) {
        this.seoDescription = seoDescription;
    }
    
    public String getSeoKeywords() {
        return seoKeywords;
    }
    
    public void setSeoKeywords(String seoKeywords) {
        this.seoKeywords = seoKeywords;
    }
    
    public String getSlug() {
        return slug;
    }
    
    public void setSlug(String slug) {
        this.slug = slug;
    }
    
    public Boolean getFeatured() {
        return featured;
    }
    
    public void setFeatured(Boolean featured) {
        this.featured = featured;
    }
    
    public Boolean getUrgent() {
        return urgent;
    }
    
    public void setUrgent(Boolean urgent) {
        this.urgent = urgent;
    }
    
    public Long getViewsCount() {
        return viewsCount;
    }
    
    public void setViewsCount(Long viewsCount) {
        this.viewsCount = viewsCount;
    }
    
    public Long getApplicationsCount() {
        return applicationsCount;
    }
    
    public void setApplicationsCount(Long applicationsCount) {
        this.applicationsCount = applicationsCount;
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
    
    public LocalDateTime getSubmittedForApprovalAt() {
        return submittedForApprovalAt;
    }
    
    public void setSubmittedForApprovalAt(LocalDateTime submittedForApprovalAt) {
        this.submittedForApprovalAt = submittedForApprovalAt;
    }
    
    public LocalDateTime getApprovedAt() {
        return approvedAt;
    }
    
    public void setApprovedAt(LocalDateTime approvedAt) {
        this.approvedAt = approvedAt;
    }
    
    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }
    
    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }
    
    public LocalDateTime getUnpublishedAt() {
        return unpublishedAt;
    }
    
    public void setUnpublishedAt(LocalDateTime unpublishedAt) {
        this.unpublishedAt = unpublishedAt;
    }
    
    public LocalDateTime getClosedAt() {
        return closedAt;
    }
    
    public void setClosedAt(LocalDateTime closedAt) {
        this.closedAt = closedAt;
    }
    
    public List<Application> getApplications() {
        return applications;
    }
    
    public void setApplications(List<Application> applications) {
        this.applications = applications;
    }
}