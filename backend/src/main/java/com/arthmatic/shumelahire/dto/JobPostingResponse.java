package com.arthmatic.shumelahire.dto;

import com.arthmatic.shumelahire.entity.EmploymentType;
import com.arthmatic.shumelahire.entity.ExperienceLevel;
import com.arthmatic.shumelahire.entity.JobPosting;
import com.arthmatic.shumelahire.entity.JobPostingStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class JobPostingResponse {
    
    private Long id;
    private String title;
    private String department;
    private String location;
    private EmploymentType employmentType;
    private String employmentTypeDisplayName;
    private ExperienceLevel experienceLevel;
    private String experienceLevelDisplayName;
    private String description;
    private String requirements;
    private String responsibilities;
    private String qualifications;
    private String benefits;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String salaryCurrency;
    private String salaryRange;
    private Boolean remoteWorkAllowed;
    private Boolean travelRequired;
    private LocalDateTime applicationDeadline;
    private Integer positionsAvailable;
    private JobPostingStatus status;
    private String statusDisplayName;
    private String statusCssClass;
    private String statusIcon;
    private Long createdBy;
    private Long approvedBy;
    private Long publishedBy;
    private String approvalNotes;
    private String rejectionReason;
    private String internalNotes;
    private String externalJobBoards;
    private String seoTitle;
    private String seoDescription;
    private String seoKeywords;
    private String slug;
    private Boolean featured;
    private Boolean urgent;
    private Long viewsCount;
    private Long applicationsCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime submittedForApprovalAt;
    private LocalDateTime approvedAt;
    private LocalDateTime publishedAt;
    private LocalDateTime unpublishedAt;
    private LocalDateTime closedAt;
    private long daysFromCreation;
    private long daysFromPublication;
    private boolean canBeEdited;
    private boolean canBeSubmittedForApproval;
    private boolean canBeApproved;
    private boolean canBeRejected;
    private boolean canBePublished;
    private boolean canBeUnpublished;
    private boolean canBeClosed;
    private boolean isActive;
    private boolean isPublic;
    private boolean isDeadlinePassed;
    
    // Constructors
    public JobPostingResponse() {}
    
    public JobPostingResponse(JobPosting jobPosting) {
        this.id = jobPosting.getId();
        this.title = jobPosting.getTitle();
        this.department = jobPosting.getDepartment();
        this.location = jobPosting.getLocation();
        this.employmentType = jobPosting.getEmploymentType();
        this.employmentTypeDisplayName = jobPosting.getEmploymentType().getDisplayName();
        this.experienceLevel = jobPosting.getExperienceLevel();
        this.experienceLevelDisplayName = jobPosting.getExperienceLevel().getDisplayName();
        this.description = jobPosting.getDescription();
        this.requirements = jobPosting.getRequirements();
        this.responsibilities = jobPosting.getResponsibilities();
        this.qualifications = jobPosting.getQualifications();
        this.benefits = jobPosting.getBenefits();
        this.salaryMin = jobPosting.getSalaryMin();
        this.salaryMax = jobPosting.getSalaryMax();
        this.salaryCurrency = jobPosting.getSalaryCurrency();
        this.salaryRange = jobPosting.getSalaryRange();
        this.remoteWorkAllowed = jobPosting.getRemoteWorkAllowed();
        this.travelRequired = jobPosting.getTravelRequired();
        this.applicationDeadline = jobPosting.getApplicationDeadline();
        this.positionsAvailable = jobPosting.getPositionsAvailable();
        this.status = jobPosting.getStatus();
        this.statusDisplayName = jobPosting.getStatusDisplayName();
        this.statusCssClass = jobPosting.getStatus().getCssClass();
        this.statusIcon = jobPosting.getStatus().getIcon();
        this.createdBy = jobPosting.getCreatedBy();
        this.approvedBy = jobPosting.getApprovedBy();
        this.publishedBy = jobPosting.getPublishedBy();
        this.approvalNotes = jobPosting.getApprovalNotes();
        this.rejectionReason = jobPosting.getRejectionReason();
        this.internalNotes = jobPosting.getInternalNotes();
        this.externalJobBoards = jobPosting.getExternalJobBoards();
        this.seoTitle = jobPosting.getSeoTitle();
        this.seoDescription = jobPosting.getSeoDescription();
        this.seoKeywords = jobPosting.getSeoKeywords();
        this.slug = jobPosting.getSlug();
        this.featured = jobPosting.getFeatured();
        this.urgent = jobPosting.getUrgent();
        this.viewsCount = jobPosting.getViewsCount();
        this.applicationsCount = jobPosting.getApplicationsCount();
        this.createdAt = jobPosting.getCreatedAt();
        this.updatedAt = jobPosting.getUpdatedAt();
        this.submittedForApprovalAt = jobPosting.getSubmittedForApprovalAt();
        this.approvedAt = jobPosting.getApprovedAt();
        this.publishedAt = jobPosting.getPublishedAt();
        this.unpublishedAt = jobPosting.getUnpublishedAt();
        this.closedAt = jobPosting.getClosedAt();
        this.daysFromCreation = jobPosting.getDaysFromCreation();
        this.daysFromPublication = jobPosting.getDaysFromPublication();
        this.canBeEdited = jobPosting.canBeEdited();
        this.canBeSubmittedForApproval = jobPosting.canBeSubmittedForApproval();
        this.canBeApproved = jobPosting.canBeApproved();
        this.canBeRejected = jobPosting.canBeRejected();
        this.canBePublished = jobPosting.canBePublished();
        this.canBeUnpublished = jobPosting.canBeUnpublished();
        this.canBeClosed = jobPosting.canBeClosed();
        this.isActive = jobPosting.isActive();
        this.isPublic = jobPosting.isPublic();
        this.isDeadlinePassed = jobPosting.isDeadlinePassed();
    }
    
    // Static factory methods
    public static JobPostingResponse fromEntity(JobPosting jobPosting) {
        return new JobPostingResponse(jobPosting);
    }

    public static JobPostingResponse fromEntityPublic(JobPosting jobPosting) {
        return new JobPostingResponse(jobPosting).toPublicView();
    }

    /**
     * Strips sensitive/internal fields for public consumption.
     */
    public JobPostingResponse toPublicView() {
        this.internalNotes = null;
        this.approvalNotes = null;
        this.rejectionReason = null;
        this.createdBy = null;
        this.approvedBy = null;
        this.publishedBy = null;
        this.canBeEdited = false;
        this.canBeSubmittedForApproval = false;
        this.canBeApproved = false;
        this.canBeRejected = false;
        this.canBePublished = false;
        this.canBeUnpublished = false;
        this.canBeClosed = false;
        return this;
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
    
    public String getEmploymentTypeDisplayName() {
        return employmentTypeDisplayName;
    }
    
    public void setEmploymentTypeDisplayName(String employmentTypeDisplayName) {
        this.employmentTypeDisplayName = employmentTypeDisplayName;
    }
    
    public ExperienceLevel getExperienceLevel() {
        return experienceLevel;
    }
    
    public void setExperienceLevel(ExperienceLevel experienceLevel) {
        this.experienceLevel = experienceLevel;
    }
    
    public String getExperienceLevelDisplayName() {
        return experienceLevelDisplayName;
    }
    
    public void setExperienceLevelDisplayName(String experienceLevelDisplayName) {
        this.experienceLevelDisplayName = experienceLevelDisplayName;
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
    
    public String getSalaryRange() {
        return salaryRange;
    }
    
    public void setSalaryRange(String salaryRange) {
        this.salaryRange = salaryRange;
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
    
    public String getStatusDisplayName() {
        return statusDisplayName;
    }
    
    public void setStatusDisplayName(String statusDisplayName) {
        this.statusDisplayName = statusDisplayName;
    }
    
    public String getStatusCssClass() {
        return statusCssClass;
    }
    
    public void setStatusCssClass(String statusCssClass) {
        this.statusCssClass = statusCssClass;
    }
    
    public String getStatusIcon() {
        return statusIcon;
    }
    
    public void setStatusIcon(String statusIcon) {
        this.statusIcon = statusIcon;
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
    
    public long getDaysFromCreation() {
        return daysFromCreation;
    }
    
    public void setDaysFromCreation(long daysFromCreation) {
        this.daysFromCreation = daysFromCreation;
    }
    
    public long getDaysFromPublication() {
        return daysFromPublication;
    }
    
    public void setDaysFromPublication(long daysFromPublication) {
        this.daysFromPublication = daysFromPublication;
    }
    
    public boolean isCanBeEdited() {
        return canBeEdited;
    }
    
    public void setCanBeEdited(boolean canBeEdited) {
        this.canBeEdited = canBeEdited;
    }
    
    public boolean isCanBeSubmittedForApproval() {
        return canBeSubmittedForApproval;
    }
    
    public void setCanBeSubmittedForApproval(boolean canBeSubmittedForApproval) {
        this.canBeSubmittedForApproval = canBeSubmittedForApproval;
    }
    
    public boolean isCanBeApproved() {
        return canBeApproved;
    }
    
    public void setCanBeApproved(boolean canBeApproved) {
        this.canBeApproved = canBeApproved;
    }
    
    public boolean isCanBeRejected() {
        return canBeRejected;
    }
    
    public void setCanBeRejected(boolean canBeRejected) {
        this.canBeRejected = canBeRejected;
    }
    
    public boolean isCanBePublished() {
        return canBePublished;
    }
    
    public void setCanBePublished(boolean canBePublished) {
        this.canBePublished = canBePublished;
    }
    
    public boolean isCanBeUnpublished() {
        return canBeUnpublished;
    }
    
    public void setCanBeUnpublished(boolean canBeUnpublished) {
        this.canBeUnpublished = canBeUnpublished;
    }
    
    public boolean isCanBeClosed() {
        return canBeClosed;
    }
    
    public void setCanBeClosed(boolean canBeClosed) {
        this.canBeClosed = canBeClosed;
    }
    
    public boolean isActive() {
        return isActive;
    }
    
    public void setActive(boolean active) {
        isActive = active;
    }
    
    public boolean isPublic() {
        return isPublic;
    }
    
    public void setPublic(boolean aPublic) {
        isPublic = aPublic;
    }
    
    public boolean isDeadlinePassed() {
        return isDeadlinePassed;
    }
    
    public void setDeadlinePassed(boolean deadlinePassed) {
        isDeadlinePassed = deadlinePassed;
    }
}