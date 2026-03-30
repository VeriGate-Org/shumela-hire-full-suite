package com.arthmatic.shumelahire.repository.dynamo.items;

import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.*;

/**
 * DynamoDB item for the JobAdTemplate entity.
 *
 * Table keys:
 *   PK:  TENANT#{tenantId}
 *   SK:  JOB_AD_TEMPLATE#{id}
 *
 * GSI1 (archived status + date sort):
 *   GSI1PK: TEMPLATE_ARCHIVED#{isArchived}
 *   GSI1SK: JOB_AD_TEMPLATE#{createdAt}
 *
 * GSI3 (employment type):
 *   GSI3PK: TEMPLATE_EMPTYPE#{employmentType}
 *   GSI3SK: JOB_AD_TEMPLATE#{createdAt}
 *
 * GSI6 (date range — created):
 *   GSI6PK: TEMPLATE_CREATED#{tenantId}
 *   GSI6SK: JOB_AD_TEMPLATE#{createdAt}
 */
@DynamoDbBean
public class JobAdTemplateItem {

    private String pk;
    private String sk;
    private String gsi1pk;
    private String gsi1sk;
    private String gsi3pk;
    private String gsi3sk;
    private String gsi6pk;
    private String gsi6sk;

    // Entity fields
    private String id;
    private String tenantId;
    private String name;
    private String description;
    private String title;
    private String intro;
    private String responsibilities;
    private String requirements;
    private String benefits;
    private String location;
    private String employmentType;
    private String salaryRangeMin;
    private String salaryRangeMax;
    private String closingDate;
    private String contactEmail;
    private Boolean isArchived;
    private Integer usageCount;
    private String createdBy;
    private String createdAt;
    private String updatedAt;

    // ── Table keys ───────────────────────────────────────────────────────────

    @DynamoDbPartitionKey
    @DynamoDbAttribute("PK")
    public String getPk() { return pk; }
    public void setPk(String pk) { this.pk = pk; }

    @DynamoDbSortKey
    @DynamoDbAttribute("SK")
    public String getSk() { return sk; }
    public void setSk(String sk) { this.sk = sk; }

    // ── GSI1: Archived status + date sort ────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1PK")
    public String getGsi1pk() { return gsi1pk; }
    public void setGsi1pk(String gsi1pk) { this.gsi1pk = gsi1pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI1")
    @DynamoDbAttribute("GSI1SK")
    public String getGsi1sk() { return gsi1sk; }
    public void setGsi1sk(String gsi1sk) { this.gsi1sk = gsi1sk; }

    // ── GSI3: Employment type ────────────────────────────────────────────────

    @DynamoDbSecondaryPartitionKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3PK")
    public String getGsi3pk() { return gsi3pk; }
    public void setGsi3pk(String gsi3pk) { this.gsi3pk = gsi3pk; }

    @DynamoDbSecondarySortKey(indexNames = "GSI3")
    @DynamoDbAttribute("GSI3SK")
    public String getGsi3sk() { return gsi3sk; }
    public void setGsi3sk(String gsi3sk) { this.gsi3sk = gsi3sk; }

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

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getIntro() { return intro; }
    public void setIntro(String intro) { this.intro = intro; }

    public String getResponsibilities() { return responsibilities; }
    public void setResponsibilities(String responsibilities) { this.responsibilities = responsibilities; }

    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }

    public String getBenefits() { return benefits; }
    public void setBenefits(String benefits) { this.benefits = benefits; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getSalaryRangeMin() { return salaryRangeMin; }
    public void setSalaryRangeMin(String salaryRangeMin) { this.salaryRangeMin = salaryRangeMin; }

    public String getSalaryRangeMax() { return salaryRangeMax; }
    public void setSalaryRangeMax(String salaryRangeMax) { this.salaryRangeMax = salaryRangeMax; }

    public String getClosingDate() { return closingDate; }
    public void setClosingDate(String closingDate) { this.closingDate = closingDate; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public Boolean getIsArchived() { return isArchived; }
    public void setIsArchived(Boolean isArchived) { this.isArchived = isArchived; }

    public Integer getUsageCount() { return usageCount; }
    public void setUsageCount(Integer usageCount) { this.usageCount = usageCount; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
