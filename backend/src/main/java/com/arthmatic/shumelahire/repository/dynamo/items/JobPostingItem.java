package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the JobPosting entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  JOB_POSTING#{id}
 *
 * GSI1 (status + date sort):
 *   GSI1PK: POSTING_STATUS#{status}
 *   GSI1SK: JOB_POSTING#{createdAt}
 *
 * GSI2 (FK lookup — by createdBy):
 *   GSI2PK: POSTING_CREATOR#{createdBy}
 *   GSI2SK: JOB_POSTING#{createdAt}
 *
 * GSI3 (department):
 *   GSI3PK: POSTING_DEPT#{department}
 *   GSI3SK: JOB_POSTING#{createdAt}
 *
 * GSI4 (unique constraint — slug):
 *   GSI4PK: POSTING_SLUG#{tenantId}#{slug}
 *   GSI4SK: JOB_POSTING#{id}
 *
 * GSI6 (date range — created):
 *   GSI6PK: POSTING_CREATED#{tenantId}
 *   GSI6SK: JOB_POSTING#{createdAt}
 */
@DynamoDbBean
public class JobPostingItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi3pk;
    private String gsi3sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String title;
    private String department;
    private String location;
    private String employmentType;
    private String experienceLevel;
    private String description;
    private String requirements;
    private String responsibilities;
    private String qualifications;
    private String benefits;
    private String salaryMin;
    private String salaryMax;
    private String salaryCurrency;
    private Boolean remoteWorkAllowed;
    private Boolean travelRequired;
    private String applicationDeadline;
    private Integer positionsAvailable;
    private String status;
    private String createdBy;
    private String approvedBy;
    private String publishedBy;
    private String approvalNotes;
    private String rejectionReason;
    private String internalNotes;
    private String externalJobBoards;
    private String requiredCheckTypes;
    private Boolean enforceCheckCompletion;
    private String seoTitle;
    private String seoDescription;
    private String seoKeywords;
    private String slug;
    private Boolean featured;
    private Boolean urgent;
    private Long viewsCount;
    private Long applicationsCount;
    private String createdAt;
    private String updatedAt;
    private String submittedForApprovalAt;
    private String approvedAt;
    private String publishedAt;
    private String unpublishedAt;
    private String closedAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Status + date sort ─────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI2: FK lookup by createdBy ─────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

    // ── GSI3: Department ─────────────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3PK")
    public String getGsi3pk() { return gsi3pk; }
    public void setGsi3pk(String gsi3pk) { this.gsi3pk = gsi3pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3SK")
    public String getGsi3sk() { return gsi3sk; }
    public void setGsi3sk(String gsi3sk) { this.gsi3sk = gsi3sk; }

    // ── GSI4: Unique constraint — slug ───────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4PK")
    public String getGsi4pk() { return gsi4pk; }
    public void setGsi4pk(String gsi4pk) { this.gsi4pk = gsi4pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI4")
    @DynamoDbAttribute("GSI4SK")
    public String getGsi4sk() { return gsi4sk; }
    public void setGsi4sk(String gsi4sk) { this.gsi4sk = gsi4sk; }

    // ── GSI6: Date range — created ───────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6PK")
    public String getGsi6pk() { return gsi6pk; }
    public void setGsi6pk(String gsi6pk) { this.gsi6pk = gsi6pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI6")
    @DynamoDbAttribute("GSI6SK")
    public String getGsi6sk() { return gsi6sk; }
    public void setGsi6sk(String gsi6sk) { this.gsi6sk = gsi6sk; }

    // ── Entity fields ────────────────────────────────────────────────────────

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTenantId() { return tenantId; }
    public void setTenantId(String tenantId) { this.tenantId = tenantId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getExperienceLevel() { return experienceLevel; }
    public void setExperienceLevel(String experienceLevel) { this.experienceLevel = experienceLevel; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public String getResponsibilities() { return responsibilities; }
    public void setResponsibilities(String responsibilities) { this.responsibilities = responsibilities; }

    public String getQualifications() { return qualifications; }
    public void setQualifications(String qualifications) { this.qualifications = qualifications; }

    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }

    public String getSalaryMin() { return salaryMin; }
    public void setSalaryMin(String salaryMin) { this.salaryMin = salaryMin; }

    public String getSalaryMax() { return salaryMax; }
    public void setSalaryMax(String salaryMax) { this.salaryMax = salaryMax; }

    public String getSalaryCurrency() { return salaryCurrency; }
    public void setSalaryCurrency(String salaryCurrency) { this.salaryCurrency = salaryCurrency; }

    public Boolean getRemoteWorkAllowed() { return remoteWorkAllowed; }
    public void setRemoteWorkAllowed(Boolean remoteWorkAllowed) { this.remoteWorkAllowed = remoteWorkAllowed; }

    public Boolean getTravelRequired() { return travelRequired; }
    public void setTravelRequired(Boolean travelRequired) { this.travelRequired = travelRequired; }

    public String getApplicationDeadline() { return applicationDeadline; }
    public void setApplicationDeadline(String applicationDeadline) { this.applicationDeadline = applicationDeadline; }

    public Integer getPositionsAvailable() { return positionsAvailable; }
    public void setPositionsAvailable(Integer positionsAvailable) { this.positionsAvailable = positionsAvailable; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public String getPublishedBy() { return publishedBy; }
    public void setPublishedBy(String publishedBy) { this.publishedBy = publishedBy; }

    public String getApprovalNotes() { return approvalNotes; }
    public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getInternalNotes() { return internalNotes; }
    public void setInternalNotes(String internalNotes) { this.internalNotes = internalNotes; }

    public String getExternalJobBoards() { return externalJobBoards; }
    public void setExternalJobBoards(String externalJobBoards) { this.externalJobBoards = externalJobBoards; }

    public String getRequiredCheckTypes() { return requiredCheckTypes; }
    public void setRequiredCheckTypes(String requiredCheckTypes) { this.requiredCheckTypes = requiredCheckTypes; }

    public Boolean getEnforceCheckCompletion() { return enforceCheckCompletion; }
    public void setEnforceCheckCompletion(Boolean enforceCheckCompletion) { this.enforceCheckCompletion = enforceCheckCompletion; }

    public String getSeoTitle() { return seoTitle; }
    public void setSeoTitle(String seoTitle) { this.seoTitle = seoTitle; }

    public String getSeoDescription() { return seoDescription; }
    public void setSeoDescription(String seoDescription) { this.seoDescription = seoDescription; }

    public String getSeoKeywords() { return seoKeywords; }
    public void setSeoKeywords(String seoKeywords) { this.seoKeywords = seoKeywords; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public Boolean getFeatured() { return featured; }
    public void setFeatured(Boolean featured) { this.featured = featured; }

    public Boolean getUrgent() { return urgent; }
    public void setUrgent(Boolean urgent) { this.urgent = urgent; }

    public Long getViewsCount() { return viewsCount; }
    public void setViewsCount(Long viewsCount) { this.viewsCount = viewsCount; }

    public Long getApplicationsCount() { return applicationsCount; }
    public void setApplicationsCount(Long applicationsCount) { this.applicationsCount = applicationsCount; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getSubmittedForApprovalAt() { return submittedForApprovalAt; }
    public void setSubmittedForApprovalAt(String submittedForApprovalAt) { this.submittedForApprovalAt = submittedForApprovalAt; }

    public String getApprovedAt() { return approvedAt; }
    public void setApprovedAt(String approvedAt) { this.approvedAt = approvedAt; }

    public String getPublishedAt() { return publishedAt; }
    public void setPublishedAt(String publishedAt) { this.publishedAt = publishedAt; }

    public String getUnpublishedAt() { return unpublishedAt; }
    public void setUnpublishedAt(String unpublishedAt) { this.unpublishedAt = unpublishedAt; }

    public String getClosedAt() { return closedAt; }
    public void setClosedAt(String closedAt) { this.closedAt = closedAt; }
}
