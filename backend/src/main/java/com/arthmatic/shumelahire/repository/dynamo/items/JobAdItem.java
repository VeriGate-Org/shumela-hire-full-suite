package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the JobAd entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  JOB_AD#{id}
 *
 * GSI1 (status + date sort):
 *   GSI1PK: JOBAD_STATUS#{status}
 *   GSI1SK: JOB_AD#{createdAt}
 *
 * GSI2 (FK lookup — by jobPostingId):
 *   GSI2PK: JOBAD_POSTING#{jobPostingId}
 *   GSI2SK: JOB_AD#{id}
 *
 * GSI4 (unique constraint — slug):
 *   GSI4PK: JOBAD_SLUG#{tenantId}#{slug}
 *   GSI4SK: JOB_AD#{id}
 *
 * GSI6 (date range — created):
 *   GSI6PK: JOBAD_CREATED#{tenantId}
 *   GSI6SK: JOB_AD#{createdAt}
 */
@DynamoDbBean
public class JobAdItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi2pk;
    private String gsi2sk;
    private String gsi4pk;
    private String gsi4sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String requisitionId;
    private String jobPostingId;
    private String title;
    private String htmlBody;
    private Boolean channelInternal;
    private Boolean channelExternal;
    private String status;
    private String closingDate;
    private String slug;
    private String createdBy;
    private String createdAt;
    private String updatedAt;
    private String department;
    private String location;
    private String employmentType;
    private String salaryRangeMin;
    private String salaryRangeMax;
    private String salaryCurrency;

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

    // ── GSI2: FK lookup by jobPostingId ──────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2PK")
    public String getGsi2pk() { return gsi2pk; }
    public void setGsi2pk(String gsi2pk) { this.gsi2pk = gsi2pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI2")
    @DynamoDbAttribute("GSI2SK")
    public String getGsi2sk() { return gsi2sk; }
    public void setGsi2sk(String gsi2sk) { this.gsi2sk = gsi2sk; }

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

    public String getRequisitionId() { return requisitionId; }
    public void setRequisitionId(String requisitionId) { this.requisitionId = requisitionId; }

    public String getJobPostingId() { return jobPostingId; }
    public void setJobPostingId(String jobPostingId) { this.jobPostingId = jobPostingId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getHtmlBody() { return htmlBody; }
    public void setHtmlBody(String htmlBody) { this.htmlBody = htmlBody; }

    public Boolean getChannelInternal() { return channelInternal; }
    public void setChannelInternal(Boolean channelInternal) { this.channelInternal = channelInternal; }

    public Boolean getChannelExternal() { return channelExternal; }
    public void setChannelExternal(Boolean channelExternal) { this.channelExternal = channelExternal; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getClosingDate() { return closingDate; }
    public void setClosingDate(String closingDate) { this.closingDate = closingDate; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getSalaryRangeMin() { return salaryRangeMin; }
    public void setSalaryRangeMin(String salaryRangeMin) { this.salaryRangeMin = salaryRangeMin; }

    public String getSalaryRangeMax() { return salaryRangeMax; }
    public void setSalaryRangeMax(String salaryRangeMax) { this.salaryRangeMax = salaryRangeMax; }

    public String getSalaryCurrency() { return salaryCurrency; }
    public void setSalaryCurrency(String salaryCurrency) { this.salaryCurrency = salaryCurrency; }
}
